<!--
  CesiumMap.vue —— Cesium 三维地球地图组件
  =====================================================================
  本组件基于 Cesium 官方 "Hello World" 示例改造：
    底图由默认 ion 影像改为国内地图瓦片（高德矢量道路图，含地名），
    定位由旧金山改为重庆主城（项目业务重点）。
    官方示例：https://cesium.com/learn/cesiumjs-learn/cesiumjs-hello-world/

  组件展示的核心能力：
    1. 初始化 Viewer（三维地球容器，关闭默认 ion 影像/搜索/时间轴）
    2. 加载全球地形（Cesium World Terrain，让重庆山势有起伏）
    3. 叠加国内地图瓦片（高德矢量道路图，含道路与地名注记）
    4. 相机飞行定位到重庆主城（解放碑一带，约 30km 俯视）

  依赖前置条件：
    - Cesium 的四类静态资源（Assets / ThirdParty / Widgets / Workers）
      已拷贝到 public/cesium/ 下（见 package.json 的 cesium:copy 脚本）。
      Vite 在 dev 和 build 阶段都会把 public 目录原样输出到根路径，
      因此通过 /cesium/ 即可访问这些资源。
    - main.js 中已设置 window.CESIUM_BASE_URL = '/cesium/'（在 Cesium
      模块加载之前，因 main.js 早于路由懒加载的本组件执行），
      使 Cesium 能正确从 /cesium/ 加载上述静态资源。
    - 通过 import 'cesium/Build/Cesium/Widgets/widgets.css' 引入
      Cesium 内置 UI（如动画控件、时间轴、全屏按钮）的样式。

  关于 ion Access Token：
    Cesium ion 是 Cesium 提供的云端数据服务（地形、影像、3D Tiles、
    OSM 建筑物等都托管在上面）。访问这些数据需要 Access Token。
    - 你可以在 https://ion.cesium.com/tokens 免费注册并获取 token。
    - 下面的 Ion.defaultAccessToken 使用了 Cesium 内置的默认 token，
      仅供本地演示，额度有限且不稳定；生产环境务必替换为你自己的 token。
-->
<template>
  <!-- 地图容器：Cesium 会在该 div 内创建 WebGL canvas -->
  <div ref="containerRef" class="cesium-map-container">
    <!-- 自定义点位弹窗，不再使用 Cesium 默认 InfoBox -->
    <div v-if="popupVisible" class="custom-popup" :style="popupStyle">
      <!-- 关闭弹窗按钮 -->
      <button class="popup-close" @click="closePopup">
        ×
      </button>

      <!-- 点位名称 -->
      <div class="popup-title">
        {{ popupTitle }}
      </div>

      <!-- 点位描述，description 支持 HTML -->
      <div class="popup-content" v-html="popupDescription"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, shallowRef } from 'vue'
// 引入 Cesium 主包（ESM 形式）。Vite 会把它打进 bundle 或按需拆包。
import * as Cesium from 'cesium'
// 引入 Cesium 默认 UI 控件样式（动画控件、时间轴、全屏按钮等）
import 'cesium/Build/Cesium/Widgets/widgets.css'

import markerImage from '@/assets/vue.svg'

/* ------------------------------------------------------------------
 * ion Access Token 配置
 * ------------------------------------------------------------------
 * 把它设置到 Cesium.Ion.defaultAccessToken 后，所有依赖 ion 数据
 * 的接口（Terrain.fromWorldTerrain、createOsmBuildingsAsync 等）
 * 都会自动带上这个 token 去访问 ion 云端。
 *
 * 生产环境请替换为自己的 token：
 *   Cesium.Ion.defaultAccessToken = 'eyJhbGciOi...你的token...'
 *
 * 这里不主动覆盖，沿用 Cesium 内置默认 token（仅用于本地演示）。
 * 如需使用自己的 token，取消下面一行注释并替换字符串即可：
 */
// Cesium.Ion.defaultAccessToken = 'your_access_token'

/* 组件 ref：指向地图容器 div，Viewer 初始化时需要这个 DOM 节点 */
const containerRef = ref(null)

/* Viewer 是 Cesium 的顶级对象，相当于「地图实例」。
   组件外部通过 useTemplateRef / ref 获取本组件后，
   可以经由 defineExpose 拿到 viewer 做进一步操作 */
const viewer = shallowRef(null)

/* 当前被点击的点位 */
const selectedMarker = ref(null)

/* 自定义弹窗是否显示 */
const popupVisible = ref(false)

/* 弹窗在地图容器中的屏幕坐标 */
const popupPosition = ref({
  left: 0,
  top: 0,
})

/* 自定义弹窗的标题 */
const popupTitle = ref('')

/* 自定义弹窗的 HTML 内容 */
const popupDescription = ref('')

/* 鼠标点击事件处理器 */
let screenSpaceHandler = null

/* 把坐标转换成 CSS 定位值 */
const popupStyle = computed(() => ({
  left: `${popupPosition.value.left}px`,
  top: `${popupPosition.value.top}px`,
}))

/* 用于集中管理大量点图标 */
let markerCollection = null

/* 保存批量点位数据，便于后续删除 */
const batchMarkers = new Set()

/* 当前鼠标悬停的点位 */
let hoveredMarker = null

/* 每帧更新事件处理器，避免重复注册 */
let batchFrameUpdateHandler = null

// let markerImage = '@/assets/vue.svg'

/* ----------------------------------------------------------------
 * 坐标修正：补偿祖先 transform: scale 导致的点击命中错位
 * ----------------------------------------------------------------
 * 原理：
 *   ScreenSpaceEventHandler 回调传入的 position/endPosition，是 Cesium 内部
 *   用 canvas.getBoundingClientRect() 计算的「视觉坐标」。
 *   当存在祖先 transform: scale(sx, sy) 时：
 *     - rect.width = clientWidth * sx   （视觉上被放大/缩小）
 *     - ScreenSpaceEventHandler.position.x ∈ [0, clientWidth*sx]
 *     - 但 Scene.pick() 需要的视口坐标范围是 [0, clientWidth]
 *     - 两者比例不对 → 命中错位：scale>1 时命中偏右下，scale<1 时偏左上
 *
 *   修复：
 *     传入 pick 前将视觉坐标除以 (sx, sy) 压缩回视口坐标。
 *
 *   说明：弹窗跟随（worldToWindowCoordinates + position:absolute）
 *     不需要修正，因为弹窗 DOM 和 canvas 都处于同一 scale 祖先下，
 *     两者视觉坐标均按同比例变换，相对位置保持一致。
 */
function getCanvasScale() {
  if (!viewer.value) return { sx: 1, sy: 1 }
  const canvas = viewer.value.scene.canvas
  if (!canvas) return { sx: 1, sy: 1 }
  const rect = canvas.getBoundingClientRect()
  const cssWidth = canvas.clientWidth || 1
  const cssHeight = canvas.clientHeight || 1
  return {
    sx: rect.width / cssWidth,
    sy: rect.height / cssHeight,
  }
}

/* 把「视觉坐标（ScreenSpaceEventHandler 回调给的）」→「Cesium 渲染视口坐标」 */
function toViewportPosition(screenPos) {
  if (!screenPos) return screenPos
  const { sx, sy } = getCanvasScale()
  return new Cesium.Cartesian2(screenPos.x / sx, screenPos.y / sy)
}

onMounted(async () => {
  /* ----------------------------------------------------------------
   * 1. 初始化 Viewer（Cesium 的核心入口）
   * ----------------------------------------------------------------
   * new Cesium.Viewer(container, options)
   *   - container：承载地图的 DOM 元素
   *   - options：地图行为、UI、数据源等配置
   *
   * 关键配置说明：
   *   baseLayer: false
   *     关闭 Cesium 默认的 ion 影像底图（Bing Maps 卫星影像），
   *     改用下方手动添加的高德矢量道路图，避免依赖国外 ion 服务、
   *     并让画面贴合国内地名与路网。
   *   baseLayerPicker: false
   *     关掉右上角「基础图层选择器」按钮（它列出的是 ion 影像，
   *     换用高德后已无意义）。
   *   geocoder: false
   *     关掉右上角「地名搜索」框（它走 ion 地理编码服务，国内地名
   *     不全且会偏移）。
   *   animation: false
   *     关掉左下「动画控件」（播放/暂停/倍速按钮）。
   *   timeline: false
   *     关掉底部「时间轴」。这两个控件是为时间动态数据（卫星轨道、
   *     台风路径、时序遥感等）设计的，静态看重庆地图用不上，关掉省地方。
   *   terrain: Cesium.Terrain.fromWorldTerrain()
   *     启用 Cesium 全球地形（基于 ion 服务的地形瓦片，含山川起伏）。
   *     重庆是山城，保留地形能体现两山两江的起伏地貌。
   *     该项仍依赖 ion（如需完全去 ion 化，删掉此行即退回平坦地球）。
   *     fromWorldTerrain() 是异步加载工厂，Viewer 会先用平面地形，
   *     地形数据就绪后自动切换为真实地形。
   *
   *   requestRenderMode: true  （当前已注释，未启用）
   *     按需渲染模式。Cesium 默认连续渲染（60fps 空转），开启后只在场景
   *     有变化时才渲染一帧，降低 CPU/GPU 占用、省电。副作用：某些手动
   *     改状态的操作需调 viewer.scene.requestRender() 触发重绘
   *     （entity/camera 等大部分 API 会自动触发，日常基本不用手动调）。
   *
   *   terrainProvider: new Cesium.EllipsoidTerrainProvider()  （当前已注释，未启用）
   *     椭球地形（平坦地球）。用纯数学椭球面当地形，不加载地形瓦片、
   *     无山势起伏、不依赖 ion。注意：Cesium 文档规定 terrain 字段只能在
   *     terrainProvider 为 undefined 时指定，两者不能同时设（同时设会冲突：
   *     一个要真实起伏地形、一个要平坦椭球，意图相反，行为未定义）。
   *
   *   maximumRenderTimeChange: Infinity  （当前已注释，未启用）
   *     仅 requestRenderMode: true 时生效。按需渲染模式下「模拟时间」变化
   *     超过该值才触发渲染。默认 0.0（任何时间变化都重绘）。设 Infinity
   *     表示永不因时间变化触发渲染（更省，适合静态地图；不适合卫星轨道
   *     等时间动态数据，会卡住不刷新）。
   */
  viewer.value = new Cesium.Viewer(containerRef.value, {
    baseLayer: false,
    baseLayerPicker: false,
    geocoder: false,
    animation: false,
    timeline: false,
    homeButton: false,
    sceneModePicker: false,
    navigationHelpButton: false,
    terrain: Cesium.Terrain.fromWorldTerrain(),
    infoBox: false,
    // requestRenderMode: true,            // 按需渲染模式：省 CPU/GPU（未启用）
    // terrainProvider: new Cesium.EllipsoidTerrainProvider(),  // 平坦地球，与 terrain 冲突（未启用）
    // maximumRenderTimeChange: Infinity,  // 按需渲染时间阈值，需配合 requestRenderMode（未启用）
  })

  /* ----------------------------------------------------------------
   * 2. 叠加国内地图瓦片（高德矢量道路图，含地名注记）
   * ----------------------------------------------------------------
   * Cesium 用「影像图层（ImageryLayer）」管理瓦片底图，
   * viewer.imageryLayers.addImageryProvider(...) 添加图层。
   * UrlTemplateImageryProvider 用 URL 模板按 {x}{y}{z}{s} 拉取瓦片：
   *   - {x}{y}{z}：瓦片行列号 + 层级（XYZ 瓦片规范，Cesium 默认）
   *   - {s}：子域占位符，配合 subdomains 轮询多域名，分散请求压力、
   *           绕开浏览器对单域名 6 个并发连接的上限。
   *
   * 高德 appmaptile 的 style 取值（关键避坑）：
   *   - style=6 纯卫星影像（jpeg，不透明，无文字）
   *   - style=7 纯道路矢量（png，带浅色底，不透明，含道路+地名注记）——本组件用
   *   - style=8 道路矢量（png，带底，不透明，并非卫星）
   * 注意：style=7/8 都带不透明底色，不能叠在卫星上当注记层（会遮挡），
   * 但单层使用没问题。这里要「有地名的可读地图」，故用 style=7 单层矢量图，
   * 它自带道路网与地名文字（渝中区 / 解放碑 / 长江等），无需再叠加注记。
   * 缺点是失去卫星照片质感。若要「卫星 + 地名」需改用天地图（有透明注记层）。
   *
   * 高德瓦片采用 GCJ-02（火星坐标系），Cesium 内部用 WGS-84，
   * 直接套用会有数百米偏移；对可视化展示可接受。
   * 若需无偏移的国家级底图，可改用天地图（TIANDITU，WGS-84，需申请 tk），
   * 模板见本段末尾注释。
   */
  viewer.value.imageryLayers.addImageryProvider(
    new Cesium.UrlTemplateImageryProvider({
      url: 'https://webst0{s}.is.autonavi.com/appmaptile?style=7&x={x}&y={y}&z={z}',
      subdomains: ['1', '2', '3', '4'], // 轮询 webst01~04 四个子域
      minimumLevel: 3,                  // 最小层级，避免低层瓦片越界
      maximumLevel: 18,                 // 高德瓦片最高约 18 级
    })
  )

  /* —— 备选：天地图（TIANDITU）官方底图，WGS-84 无偏移，需申请 tk ——
  viewer.value.imageryLayers.addImageryProvider(
    new Cesium.UrlTemplateImageryProvider({
      url: 'https://t{s}.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILECOL={x}&TILEROW={y}&TILEMATRIX={z}&tk=你的天地图TOKEN',
      subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
      maximumLevel: 18,
    })
  )
  */

  /* ----------------------------------------------------------------
   * 3. 相机飞行定位到重庆（地图重点）
   * ----------------------------------------------------------------
   * viewer.camera.flyTo(options) 控制相机平滑飞到目标位置。
   *
   * destination：相机（视点眼）目标位置（笛卡尔坐标）。
   *   Cesium.Cartesian3.fromDegrees(longitude, latitude, height)
   *     把「经度、纬度、高度（米）」转换为 Cesium 内部使用的
   *     三维笛卡尔坐标（以地球质心为原点的直角坐标系）。
   *     106.55, 29.56 为重庆市中心（解放碑 / 人民大礼堂一带）经纬度，
   *     30000 为飞行高度（米），约 30 公里，聚焦主城核心区。
   *
   * orientation：相机朝向，由 heading / pitch / roll 三个角组成。
   *   - heading：偏航角，0 = 正北，顺时针为正。
   *     Cesium.Math.toRadians(deg) 把角度转弧度（Cesium 内部用弧度）。
   *   - pitch：俯仰角，0 = 水平前视，负值 = 低头俯视地面。
   *     -70° 陡俯视：相机在主城上空往北看，画面中心落在主城（渝中半岛）。
   *     pitch 越陡，视野中心越接近相机正下方，主城越居中；但太陡（接近
   *     -90°）会变成正俯视失去立体感。-70° 兼顾居中与山城立体观感。
   *     （-25° 太平会让视野中心北移到合川/广安，故改陡）
   *   - roll：翻滚角，通常保持 0，避免画面歪斜；这里不传，沿用默认。
   */
  viewer.value.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(106.55, 29.56, 30000),
    orientation: {
      heading: Cesium.Math.toRadians(0.0),    // 朝向正北
      pitch: Cesium.Math.toRadians(-70.0),    // 陡俯视，主城居中
    },
  })

  screenSpaceHandler = new Cesium.ScreenSpaceEventHandler(
    viewer.value.scene.canvas,
  )
  /*
  * 注册鼠标移动事件。
  * 鼠标移动时，Cesium 会检测鼠标下方是否有点位：
  * - 有点位：放大图标；
  * - 移出点位：恢复原大小。
  */
  screenSpaceHandler.setInputAction((event) => {
    /* 坐标修正：祖先存在 transform: scale 时必须先从视觉坐标转视口坐标 */
    updateHoverMarker(toViewportPosition(event.endPosition))
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
  screenSpaceHandler.setInputAction((event) => {
    /* 坐标修正：祖先存在 transform: scale 时必须先从视觉坐标转视口坐标 */
    const picked = viewer.value.scene.pick(
      toViewportPosition(event.position),
    )

    if (!Cesium.defined(picked)) {
      closePopup()
      return
    }

    /*
     * 兼容两种点位：
     * 1. 原来的 Entity 点位：picked.id 是 Cesium.Entity
     * 2. 批量 Billboard 点位：picked.id 是我们保存的普通对象
     */
    const marker = picked.id

    if (
      marker instanceof Cesium.Entity ||
      marker?.isBatchMarker === true
    ) {
      selectedMarker.value = marker
      popupTitle.value = marker.name || ''

      /*
       * Entity.description 是 Cesium Property；
       * 批量点位的 description 是普通字符串。
       */
      popupDescription.value =
        marker instanceof Cesium.Entity &&
          typeof marker.description?.getValue === 'function'
          ? marker.description.getValue(
            viewer.value.clock.currentTime,
          )
          : marker.description || ''

      popupVisible.value = true
      updatePopupPosition()
      return
    }

    closePopup()
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK)



  /* 相机移动、缩放时持续更新弹窗位置 */
  viewer.value.scene.postRender.addEventListener(
    updatePopupPosition,
  )

  /* 调试：临时挂到 window，方便浏览器控制台验证 infoBox 交互。
     验证完成后删除此行。 */
  // window.__viewer = viewer.value
})
/*
 * 根据点位的三维坐标，计算自定义弹窗在页面中的位置。
 * 相机移动、缩放或旋转后，Cesium 会触发 postRender，
 * 因此弹窗可以始终跟随点位移动。
 */
// function updatePopupPosition() {
//   if (
//     !viewer.value ||
//     !selectedMarker.value ||
//     !popupVisible.value
//   ) {
//     return
//   }

//   /*
//    * 获取当前点位的三维坐标。
//    * position 是 Cesium 的 ConstantProperty，
//    * 需要通过 getValue() 取得实际 Cartesian3 坐标。
//    */
//   const position = selectedMarker.value.position?.getValue(
//     viewer.value.clock.currentTime,
//   )

//   if (!position) return

//   /*
//    * 将地球三维坐标转换为浏览器窗口坐标。
//    * 返回的 x、y 可以直接用于 CSS 的 left、top。
//    */
//   const windowPosition =
//     Cesium.SceneTransforms.worldToWindowCoordinates(
//       viewer.value.scene,
//       position,
//     )

//   /*
//    * 点位位于相机背面或无法投影到屏幕时，隐藏弹窗。
//    */
//   if (!windowPosition) {
//     popupVisible.value = false
//     return
//   }

//   popupPosition.value = {
//     left: windowPosition.x + 16,
//     top: windowPosition.y - 16,
//   }
// }

function updatePopupPosition() {
  if (
    !viewer.value ||
    !selectedMarker.value ||
    !popupVisible.value
  ) {
    return
  }

  /*
   * Entity 的 position 是 Property；
   * Billboard 的 position 已经是 Cartesian3。
   */
  const position =
    selectedMarker.value instanceof Cesium.Entity
      ? selectedMarker.value.position?.getValue(
        viewer.value.clock.currentTime,
      )
      : selectedMarker.value.position

  if (!position) return

  /*
   * 将三维坐标转换成浏览器屏幕坐标，
   * 用于定位 Vue 自定义弹窗。
   */
  const windowPosition =
    Cesium.SceneTransforms.worldToWindowCoordinates(
      viewer.value.scene,
      position,
    )

  if (!windowPosition) {
    popupVisible.value = false
    return
  }

  popupPosition.value = {
    left: windowPosition.x + 16,
    top: windowPosition.y - 16,
  }
}

/*
 * 鼠标移出点位时，恢复原来的大小。
 */
function restoreHoverMarker() {
  if (!hoveredMarker) return

  if (
    hoveredMarker.type === 'batch' &&
    hoveredMarker.marker.primitive
  ) {
    hoveredMarker.marker.primitive.scale =
      hoveredMarker.originalScale
  }

  if (
    hoveredMarker.type === 'entity' &&
    hoveredMarker.entity.billboard
  ) {
    hoveredMarker.entity.billboard.scale =
      new Cesium.ConstantProperty(
        hoveredMarker.originalScale,
      )
  }

  hoveredMarker = null

  // 通知 Cesium 重新绘制
  viewer.value?.scene.requestRender()
}

/*
 * 设置鼠标悬停点位。
 */
function updateHoverMarker(position) {

  if (!viewer.value || !position) return
  const picked = viewer.value.scene.pick(position)

  if (!Cesium.defined(picked)) {
    restoreHoverMarker()
    return
  }

  const pickedId = picked.id

  /*
   * 处理批量 Billboard 点位。
   */
  if (pickedId?.isBatchMarker === true) {
    const primitive = pickedId.primitive

    if (!primitive) {
      restoreHoverMarker()
      return
    }

    if (
      hoveredMarker?.marker === pickedId
    ) {
      return
    }

    restoreHoverMarker()

    hoveredMarker = {
      type: 'batch',
      marker: pickedId,
      originalScale: primitive.scale || 1,
    }

    // 鼠标移上去后放大图片
    primitive.scale =
      hoveredMarker.originalScale * 1.3

    viewer.value.scene.requestRender()
    return
  }

  /*
   * 处理原来的 Entity 点位。
   */
  if (
    pickedId instanceof Cesium.Entity &&
    pickedId.billboard
  ) {
    if (hoveredMarker?.entity === pickedId) {
      return
    }

    restoreHoverMarker()

    const originalScale =
      pickedId.billboard.scale?.getValue(
        viewer.value.clock.currentTime,
      ) || 1

    hoveredMarker = {
      type: 'entity',
      entity: pickedId,
      originalScale,
    }

    pickedId.billboard.scale =
      new Cesium.ConstantProperty(
        originalScale * 1.3,
      )

    viewer.value.scene.requestRender()
    return
  }

  restoreHoverMarker()
}

// 修改关闭弹窗函数
function closePopup() {
  /* 隐藏弹窗 */
  popupVisible.value = false

  /* 清空当前点位和弹窗内容 */
  selectedMarker.value = null
  popupTitle.value = ''
  popupDescription.value = ''
}
/*
 * 飞行到指定点位。
 *
 * 先取消当前正在执行的飞行任务，避免：
 * 1. 地图初始化飞行还未结束；
 * 2. 用户又点击了点位；
 * 3. 两次飞行互相覆盖，导致看起来没有飞行。
 */
// function flyToMarker(marker) {
//   if (!viewer.value || !marker) return

//   // 取消 Cesium 当前正在执行的相机飞行
//   viewer.value.camera.cancelFlight()

//   // 让点位位于屏幕中心，并保持合适的俯视角度
//   viewer.value.flyTo(marker, {
//     duration: 1.5,
//     offset: new Cesium.HeadingPitchRange(
//       Cesium.Math.toRadians(0),     // 朝向正北
//       Cesium.Math.toRadians(-70),   // 俯视角度
//       28000,                        // 与点位保持 28 公里距离
//     ),
//   })
// }
/*
 * 飞行到指定点位。
 *
 * 不直接使用 viewer.flyTo(entity)，而是主动读取 entity.position，
 * 再让相机飞到该坐标对应的包围球，避免 Cesium 无法正确计算
 * PointGraphics 的位置。
 */
function flyToMarker(marker) {
  if (!viewer.value || !marker) {
    console.warn('Viewer 或点位不存在', {
      viewer: viewer.value,
      marker,
    })
    return
  }

  // 读取点位当前时刻的三维坐标
  const position =
    marker instanceof Cesium.Entity
      ? marker.position?.getValue(
        viewer.value.clock.currentTime,
      )
      : marker.position

  if (!position) {
    console.warn('无法获取点位坐标', marker)
    return
  }

  console.log('准备飞行到点位：', marker.name, position)

  // 取消之前没有结束的飞行动画
  viewer.value.camera.cancelFlight()

  /*
   * 创建一个以点位为中心的包围球。
   * 半径不能为 0，否则某些情况下相机无法正确计算距离。
   */
  const boundingSphere = new Cesium.BoundingSphere(
    position,
    1,
  )

  /*
   * 相机与点位保持 28 公里距离：
   * heading：朝向正北
   * pitch：向下俯视 70 度
   * range：距离点位 28000 米
   */
  viewer.value.camera.flyToBoundingSphere(
    boundingSphere,
    {
      duration: 1.5,
      offset: new Cesium.HeadingPitchRange(
        Cesium.Math.toRadians(0),
        Cesium.Math.toRadians(-70),
        28000,
      ),
    },
  )
}
/* ----------------------------------------------------------------
 * 添加点位标注（外部按需调用，如点击按钮时触发）
 * ----------------------------------------------------------------
 * 把点位添加逻辑从 onMounted 里拆出来，做成独立函数，通过 defineExpose
 * 暴露给父组件。父组件可在任意时机（如点击按钮）调用 addMarker({...})
 * 添加点位，而不是组件挂载就立即添加，实现「点位与地图初始化解耦」。
 *
 * 参数 options：
 *   longitude/latitude：点位经纬度（WGS-84）
 *   name：点位名称，同时用作 label 文字 + 去重键（同名已存在则不重复加）
 *   description：点位的 HTML 描述字符串，点击点位时显示在 Cesium 自带
 *     infoBox 弹窗（Viewer 默认开启 infoBox）。支持 <p>/<strong> 等标签。
 *   height：点位高度（米），默认 0 贴地
 *   flyTo：添加后是否飞到该点位，默认 true
 * 返回：添加的（或已存在的同名）Cesium.Entity 对象
 *
 * 点击交互：Cesium Viewer 默认开启（已关闭） infoBox（右侧信息弹窗）和
 *   selectionIndicator（绿色选中框），点击 entity 即弹出其 name +
 *   description，无需额外写点击事件。
 */
function addMarker({ longitude, latitude, name, description = '', height = 0, flyTo = true }) {
  /* viewer 必须已初始化（onMounted 之后调用） */
  if (!viewer.value) return
  longitude = Number(longitude)
  latitude = Number(latitude)
  height = Number(height) || 0

  if (
    !Number.isFinite(longitude) ||
    !Number.isFinite(latitude)
  ) {
    console.warn('Entity 点位坐标无效')
    return null
  }
  /* 去重：同名 entity 已存在则飞到它，不重复添加。

     entities.values 是所有实体的数组，按 name 匹配。 */
  const existing = viewer.value.entities.values.find(e => e.name === name)
  // debugger
  if (existing) {
    if (flyTo) {
      flyToMarker(existing)
    }
    return existing
  }

  const marker = viewer.value.entities.add({
    name,
    position: Cesium.Cartesian3.fromDegrees(longitude, latitude, height),
    /*
     * description：
     *   点位的 HTML 描述内容。
     *   点击点位后，由 Vue 自定义弹窗显示，
     *   不使用 Cesium 默认 InfoBox。
     */
    description,
    // point: {
    //   pixelSize: 20,
    //   color: Cesium.Color.RED,
    //   outlineColor: Cesium.Color.WHITE,
    //   outlineWidth: 3,
    //   disableDepthTestDistance: Number.POSITIVE_INFINITY, // 不被地形遮挡
    // },
    billboard: {
      image: markerImage,
      width: 36,
      height: 36,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      disableDepthTestDistance:
        Number.POSITIVE_INFINITY,
    },
    label: {
      text: name,
      font: '18px sans-serif',
      fillColor: Cesium.Color.WHITE,
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 3,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      pixelOffset: new Cesium.Cartesian2(0, -45), // 文字上移，不挡圆点
      showBackground: true,
      backgroundColor: new Cesium.Color(0, 0, 0, 0.6), // 半透明黑底
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
  })

  /* 飞到点位，让它居中可见（HeadingPitchRange: 朝北 / 陡俯视 / 距点位 28km） */
  if (flyTo) {
    flyToMarker(marker)
  }

  return marker
}

/*
 * 批量添加大量点位。
 *
 * 该方法使用 BillboardCollection
 * 比连续调用 entities.add() 更适合一次性添加 5000 个图标。
 *
 * 注意：
 * - 保留原来的 addMarker()，供单个点位使用；
 * - 本方法只添加圆点，不添加 5000 个文字标签；
 * - description 会在点击点位时显示到自定义弹窗。
 */
function addMarkers(markerList = []) {
  if (!viewer.value) {
    console.warn('Viewer 尚未初始化')
    return []
  }

  if (!Array.isArray(markerList)) {
    console.error('批量点位必须是数组')
    return []
  }

  /*
   * 只创建一个点集合，所有批量点位都放进去，
   * 避免创建大量 Entity 对象。
   */
  if (!markerCollection) {
    markerCollection =
      viewer.value.scene.primitives.add(
        // new Cesium.PointPrimitiveCollection(),
        new Cesium.BillboardCollection(),
      )
  }

  const markers = []

  markerList.forEach((item, index) => {

    const exists = [...batchMarkers].some(
      (marker) => marker.name === item.name,
    )

    if (exists) {
      return
    }
    const longitude = Number(item.longitude)
    const latitude = Number(item.latitude)
    const height = Number(item.height) || 0

    /*
     * 跳过坐标不合法的数据。
     */
    if (
      !Number.isFinite(longitude) ||
      !Number.isFinite(latitude)
    ) {
      console.warn(`第 ${index + 1} 个点位坐标无效`, item)
      return
    }

    /*
     * 将经纬度转换为 Cesium 的三维坐标。
     */
    const position = Cesium.Cartesian3.fromDegrees(
      longitude,
      latitude,
      height,
    )

    /*
     * 这是点击点位后返回的业务数据。
     * Billboard 的 id 可以保存任意对象。
     */
    const markerData = {
      id: item?.id || `batch-marker-${index + 1}`,
      isBatchMarker: true,
      name: item.name || `点位${index + 1}`,
      description: item.description || '',
      longitude,
      latitude,
      height,
      position,
      // 保存固定的初始坐标，供每帧运动计算
      originalLongitude: longitude,
      originalLatitude: latitude,
      originalHeight: height,
    }

    /*
     * 添加高性能点图标。
     * 保存 Billboard 实例。
     * 删除点位时需要通过这个实例从集合中移除。
     */
    /*
 * 添加图片点位。
 */
    const primitive = markerCollection.add({
      // 点位三维坐标
      position,

      // 图片地址
      image: markerImage,

      // 图片显示大小
      width: Number(item.width) || 32,
      height: Number(item.height) || 32,

      // 图片底部中心对准经纬度
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER,

      // 关闭深度遮挡，保证图片始终可见
      disableDepthTestDistance:
        Number.POSITIVE_INFINITY,

      // 点击时通过 picked.id 获取业务数据
      id: markerData,
    })

    /*
     * 保存 Billboard 实例，删除和悬停时需要使用。
     */

    /* 把 Primitive 保存到业务对象中 */
    markerData.primitive = primitive

    /* 保存到批量点位集合 */
    batchMarkers.add(markerData)

    markers.push(markerData)
  })

  /*
   * 如果开启按需渲染，手动请求重新绘制。
   * 当前即使未开启，也可以安全调用。
   */
  viewer.value.scene.requestRender()

  console.log(`批量添加完成，共添加 ${markers.length} 个点位`)

  return markers
}

/*
 * 移动一个 Entity 点位。
 *
 * markerKey 可以传：
 * - 点位名称
 * - Entity.id
 * - Entity 对象本身
 */
function moveEntityMarker(markerKey, longitude, latitude, height = 0) {
  if (!viewer.value) return false

  const lon = Number(longitude)
  const lat = Number(latitude)
  const h = Number(height) || 0

  if (
    !Number.isFinite(lon) ||
    !Number.isFinite(lat)
  ) {
    console.warn('Entity 移动坐标无效')
    return false
  }

  const entity =
    markerKey instanceof Cesium.Entity
      ? markerKey
      : viewer.value.entities.values.find(
        (item) =>
          item.name === markerKey ||
          item.id === markerKey,
      )

  if (!entity) {
    console.warn('没有找到 Entity 点位：', markerKey)
    return false
  }

  const position = Cesium.Cartesian3.fromDegrees(
    lon,
    lat,
    h,
  )

  /*
   * Entity 的位置是 Property，
   * 使用 ConstantPositionProperty 设置固定位置。
   */
  entity.position =
    new Cesium.ConstantPositionProperty(position)

  viewer.value.scene.requestRender()
  return true
}

/*
 * 启动批量点位的每帧更新。
 *
 * updateCallback：
 *   每帧都会被调用一次，参数为：
 *   - marker：当前点位业务数据
 *   - time：Cesium 当前时间
 *   - index：当前点位索引
 *
 * 回调需要返回新的坐标：
 *   {
 *     longitude: 106.55,
 *     latitude: 29.56,
 *     height: 100
 *   }
 *
 * 示例：
 * startBatchMarkersFrameUpdate((marker, time, index) => {
 *   return {
 *     longitude: marker.longitude + 0.00001,
 *     latitude: marker.latitude,
 *     height: marker.height,
 *   }
 * })
 */
function startBatchMarkersFrameUpdate(updateCallback) {
  if (!viewer.value) {
    console.warn('Viewer 尚未初始化')
    return
  }

  if (typeof updateCallback !== 'function') {
    console.error('updateCallback 必须是函数')
    return
  }

  /*
   * 如果之前已经启动过，先移除旧监听，
   * 避免每帧执行多次更新。
   */
  stopBatchMarkersFrameUpdate()

  // 记录启动时间，使用真实经过的时间驱动点位移动
  const startTime = performance.now()

  /*
   * preUpdate 会在 Cesium 每一帧渲染之前触发。
   */
  batchFrameUpdateHandler = () => {
    const currentTime = viewer.value.clock.currentTime

    // 当前帧只计算一次时间
    const seconds =
      (performance.now() - startTime) / 1000
    let index = 0

    batchMarkers.forEach((marker) => {
      const nextPosition = updateCallback(
        marker,
        currentTime,
        index,
        seconds
      )

      index += 1

      /*
       * 回调没有返回坐标时，跳过当前点位。
       */
      if (!nextPosition) return

      const longitude = Number(nextPosition.longitude)
      const latitude = Number(nextPosition.latitude)
      const height = Number(nextPosition.height) || 0

      if (
        !Number.isFinite(longitude) ||
        !Number.isFinite(latitude)
      ) {
        return
      }

      /*
       * 更新业务数据中的坐标。
       */
      marker.longitude = longitude
      marker.latitude = latitude
      marker.height = height

      /*
       * 将经纬度转换为 Cesium 三维坐标，
       * 并更新真正显示的 Billboard。
       */
      // markerCollection.update?.()

      // marker.primitive.position =
      //   Cesium.Cartesian3.fromDegrees(
      //     longitude,
      //     latitude,
      //     height,
      //   )
      // filepath: CesiumMap.vue
      marker.position = Cesium.Cartesian3.fromDegrees(
        longitude,
        latitude,
        height,
        Cesium.Ellipsoid.WGS84,
        marker.position,
      )

      marker.primitive.position = marker.position
    })
    viewer.value.scene.requestRender()
  }

  viewer.value.scene.preUpdate.addEventListener(
    batchFrameUpdateHandler,
  )
}

/*
 * 停止批量点位的每帧更新。
 */
function stopBatchMarkersFrameUpdate() {
  if (
    viewer.value &&
    batchFrameUpdateHandler
  ) {
    viewer.value.scene.preUpdate.removeEventListener(
      batchFrameUpdateHandler,
    )

    batchFrameUpdateHandler = null
  }
}

/* ----------------------------------------------------------------
 * 内置运动模式
 * ----------------------------------------------------------------
 * 把常见的点位移动方式封装成「工厂函数」：传入配置，返回一个
 * (marker, currentTime, index, seconds) => 新坐标 的回调。
 * 父组件无需自己写每帧计算逻辑，调用 startMarkerAnimation({ mode, ... }) 即可。
 *
 * 坐标单位说明：经纬度单位是「度」，重庆主城跨度约 0.1~0.5 度，
 * 因此 amplitude / radius 一般取 0.005~0.02 比较合适（过大点位会飞出主城）。
 * seconds 是从动画启动起的累计秒数（由 startBatchMarkersFrameUpdate 传入）。
 */

/* 往返运动：在原始位置附近沿坐标轴做正弦往返 */
function createOscillateMove({
  amplitude = 0.01,
  period = 5,
  axis = 'x',
  phase = 0,
} = {}) {
  const safePeriod = Math.max(period, 0.001)
  const omega = (2 * Math.PI) / safePeriod
  const useX = axis === 'x' || axis === 'xy'
  const useY = axis === 'y' || axis === 'xy'

  return (marker, _time, index, seconds) => {
    const offset = Math.sin(omega * seconds + index * 0.3 + phase) * amplitude
    return {
      longitude: useX
        ? Number(marker.originalLongitude) + offset
        : Number(marker.originalLongitude),
      latitude: useY
        ? Number(marker.originalLatitude) + offset
        : Number(marker.originalLatitude),
      height: Number(marker.originalHeight) || 0,
    }
  }
}

/* 圆周运动：围绕指定中心点做匀速圆周运动 */
function createCircleMove({
  center,
  radius = 0.01,
  duration = 10,
  direction = 1,
  phase = 0,
} = {}) {
  if (!center || !Number.isFinite(Number(center.longitude)) || !Number.isFinite(Number(center.latitude))) {
    console.warn('circle 模式必须提供 center: { longitude, latitude }')
    return null
  }
  const safeDuration = Math.max(duration, 0.001)
  const omega = (2 * Math.PI * (direction >= 0 ? 1 : -1)) / safeDuration
  const cx = Number(center.longitude)
  const cy = Number(center.latitude)

  return (marker, _time, index, seconds) => ({
    longitude: cx + Math.cos(omega * seconds + phase + index * 0.1) * radius,
    latitude: cy + Math.sin(omega * seconds + phase + index * 0.1) * radius,
    height: Number(marker.originalHeight) || 0,
  })
}

/* 循环路径：沿给定路径点首尾相接循环移动，到终点后从起点重新开始 */
function createLoopPathMove({ path = [], duration = 10, phase = 0 } = {}) {
  if (!Array.isArray(path) || path.length < 2) {
    console.warn('loopPath 模式至少需要 2 个路径点 path: [{longitude, latitude}, ...]')
    return null
  }
  const safeDuration = Math.max(duration, 0.001)
  const segCount = path.length

  return (marker, _time, index, seconds) => {
    /* t 在 [0,1) 内循环；不同点位用 phase+index 错开起始位置 */
    const t = ((seconds / safeDuration) + phase + index * 0.05) % 1
    const segFloat = t * segCount
    const segIndex = Math.floor(segFloat) % segCount
    const segT = segFloat - Math.floor(segFloat)
    const p1 = path[segIndex]
    const p2 = path[(segIndex + 1) % segCount]
    return {
      longitude: Number(p1.longitude) + (Number(p2.longitude) - Number(p1.longitude)) * segT,
      latitude: Number(p1.latitude) + (Number(p2.latitude) - Number(p1.latitude)) * segT,
      height: Number(marker.originalHeight) || 0,
    }
  }
}

/* 路径跟随：沿路径点移动，到终点后停止 */
function createPathFollowMove({ path = [], duration = 10, phase = 0 } = {}) {
  if (!Array.isArray(path) || path.length < 2) {
    console.warn('pathFollow 模式至少需要 2 个路径点 path: [{longitude, latitude}, ...]')
    return null
  }
  const safeDuration = Math.max(duration, 0.001)
  const lastSeg = path.length - 1

  return (marker, _time, index, seconds) => {
    /* 不同点位用 index 错开出发时间，形成「鱼贯」效果 */
    const t = Math.min((seconds - index * 0.2 + phase) / safeDuration, 1)
    if (t <= 0) {
      return {
        longitude: Number(path[0].longitude),
        latitude: Number(path[0].latitude),
        height: Number(marker.originalHeight) || 0,
      }
    }
    const segFloat = t * lastSeg
    const segIndex = Math.min(Math.floor(segFloat), lastSeg - 1)
    const segT = segFloat - segIndex
    const p1 = path[segIndex]
    const p2 = path[segIndex + 1]
    return {
      longitude: Number(p1.longitude) + (Number(p2.longitude) - Number(p1.longitude)) * segT,
      latitude: Number(p1.latitude) + (Number(p2.latitude) - Number(p1.latitude)) * segT,
      height: Number(marker.originalHeight) || 0,
    }
  }
}

/* 运动模式工厂表，供 startMarkerAnimation 按 mode 选用 */
const MOVE_MODE_FACTORIES = {
  oscillate: createOscillateMove,
  circle: createCircleMove,
  loopPath: createLoopPathMove,
  pathFollow: createPathFollowMove,
}

/*
 * 启动批量点位动画（按内置运动模式驱动）。
 *
 * config:
 *   mode: 'oscillate' | 'circle' | 'loopPath' | 'pathFollow'
 *
 *   oscillate: { amplitude(度), period(秒), axis: 'x'|'y'|'xy', phase }
 *   circle:    { center: {longitude, latitude}, radius(度), duration(秒), direction: ±1, phase }
 *   loopPath:  { path: [{longitude, latitude}, ...], duration(秒), phase }
 *   pathFollow:{ path: [{longitude, latitude}, ...], duration(秒), phase }
 *
 * 仍保留 startBatchMarkersFrameUpdate(callback) 用于自定义回调，
 * 本方法是对它的封装：根据 mode 选工厂生成回调后委托给它执行。
 */
function startMarkerAnimation(config = {}) {
  const { mode, ...params } = config
  const factory = MOVE_MODE_FACTORIES[mode]
  if (!factory) {
    console.error(
      `未知的运动模式: ${mode}，支持: ${Object.keys(MOVE_MODE_FACTORIES).join(' / ')}`,
    )
    return
  }
  const moveFn = factory(params)
  if (!moveFn) return
  startBatchMarkersFrameUpdate(moveFn)
}

/*
 * 删除一个点位。
 *
 * markerKey 可以传入：
 * - 点位名称
 * - 点位 id
 * - addMarkers() 返回的点位对象
 *
 * 示例：
 * removeMarker('解放碑')
 * removeMarker(markerObject)
 */
function removeMarker(markerKey) {

  if (!viewer.value || !markerKey) {
    return false
  }

  /*
   * 优先删除批量 Billboard 点位。
   */

  const batchMarker = [...batchMarkers].find((marker) => {
    if (typeof markerKey === 'object') {
      return (
        marker === markerKey ||
        marker.id === markerKey.id ||
        marker.name === markerKey.name
      )
    }

    return (
      marker.name === markerKey ||
      marker.id === markerKey
    )
  })

  if (batchMarker) {
    if (hoveredMarker?.marker === batchMarker) {
      restoreHoverMarker()
    }

    markerCollection.remove(batchMarker.primitive)
    batchMarkers.delete(batchMarker)

    if (
      selectedMarker.value === batchMarker
    ) {
      closePopup()
    }

    viewer.value.scene.requestRender()
    return true
  }

  /*
   * 再尝试删除原来的 Entity 点位。
   */
  const entity =
    typeof markerKey === 'object'
      ? markerKey
      : viewer.value.entities.values.find(
        (item) =>
          item.name === markerKey ||
          item.id === markerKey,
      )

  if (entity instanceof Cesium.Entity) {
    if (selectedMarker.value === entity) {
      closePopup()
    }

    viewer.value.entities.remove(entity)
    viewer.value.scene.requestRender()
    return true
  }

  console.warn('未找到要删除的点位：', markerKey)
  return false
}
/*
 * 批量删除点位。
 */
function removeMarkers(markerKeys = []) {
  if (!Array.isArray(markerKeys)) {
    console.warn('markerKeys 必须是数组')
    return 0
  }

  let count = 0

  markerKeys.forEach((key) => {
    if (removeMarker(key)) {
      count += 1
    }
  })

  return count
}

onBeforeUnmount(() => {
  stopBatchMarkersFrameUpdate()
  restoreHoverMarker()
  batchMarkers.clear()
  markerCollection = null
  closePopup()

  if (viewer.value && screenSpaceHandler) {
    viewer.value.scene.postRender.removeEventListener(
      updatePopupPosition,
    )
    screenSpaceHandler.destroy()
    screenSpaceHandler = null
  }
  /* ----------------------------------------------------------------
   * 组件卸载时销毁 Viewer，释放 WebGL 上下文、worker、事件监听等
   * 资源，避免内存泄漏与 canvas 残留。viewer.destroy() 是幂等的。
   * ---------------------------------------------------------------- */
  if (viewer.value) {
    viewer.value.destroy()
    viewer.value = null
  }
})

/* 暴露给父组件：
   - viewer：Cesium 实例，外部可直接调 API（entities / camera / scene 等）
   - addMarker：添加点位标注的便捷方法，避免父组件重复写 entity 配置 */
defineExpose({
  viewer,
  addMarker,
  addMarkers,
  removeMarker,
  removeMarkers,
  moveEntityMarker,
  startBatchMarkersFrameUpdate,
  stopBatchMarkersFrameUpdate,
  startMarkerAnimation,
})
</script>

<style scoped>
/* 地图容器：占满父元素宽高。Cesium 会在此容器内自动插入 canvas，
   因此容器必须明确宽高，否则地图不可见。 */
.cesium-map-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 400px;
}

.custom-popup {
  position: absolute;
  z-index: 20;
  width: 280px;
  padding: 16px;
  color: #fff;
  background: rgba(20, 35, 55, 0.95);
  border: 1px solid #409eff;
  border-radius: 6px;
  box-shadow: 0 4px 16px rgb(0 0 0 / 40%);
  transform: translateY(-100%);
}

.popup-title {
  padding-right: 20px;
  margin-bottom: 10px;
  color: #67c7ff;
  font-size: 17px;
  font-weight: bold;
}

.popup-content {
  line-height: 1.6;
  font-size: 14px;
}

.popup-close {
  position: absolute;
  top: 4px;
  right: 8px;
  padding: 0;
  color: #fff;
  background: transparent;
  border: 0;
  cursor: pointer;
  font-size: 20px;
}
</style>
