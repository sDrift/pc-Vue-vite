<!--
  CesiumMapDemo.vue —— Cesium 地图演示视图
  =====================================================================
  作为 CesiumMap 组件的使用示例页面，承载地图并展示其效果。
  页面结构：标题说明 + 地图容器（占满剩余区域）。
-->
<template>
  <div class="cesium-demo">
    <!-- 页面标题与说明 -->
    <div class="demo-header">
      <h2>Cesium 三维地图演示（重庆主城）</h2>
      <p>
        初始化三维地球 → 叠加高德矢量道路图 →
        相机定位重庆主城。点击点位可显示自定义信息弹窗。
      </p>
      <!-- 操作按钮：10 个重庆地标点位，点击添加并飞到（addMarker 内部按 name 去重） -->
      <div class="demo-actions">
        <button class="demo-btn" @click="handleAddMarkers">
          批量添加点位
        </button>
        <button class="demo-btn" @click="handleRemoveMarkers">
          批量删除点位
        </button>
        <button class="demo-btn" @click="handleStartBatchMarkersFrameUpdate">
          开始批量点位帧更新
        </button>
        <button class="demo-btn" @click="handleStopBatchMarkersFrameUpdate">
          停止批量点位帧更新
        </button>
      </div>
      <!-- 运动模式按钮：调用 startMarkerAnimation，需先「批量添加点位」 -->
      <div class="demo-actions">
        <button class="demo-btn" @click="handleStartOscillate">
          往返运动
        </button>
        <button class="demo-btn" @click="handleStartCircle">
          圆周运动
        </button>
        <button class="demo-btn" @click="handleStartLoopPath">
          循环路径
        </button>
        <button class="demo-btn" @click="handleStartPathFollow">
          路径跟随
        </button>
        <span class="demo-tip">需先「批量添加点位」，停止统一用「停止批量点位帧更新」</span>
      </div>
      <!-- 箭头点位沿路径移动：20 个箭头图标点位，沿解放碑→洪崖洞→朝天门循环移动 -->
      <div class="demo-actions">
        <button class="demo-btn" @click="handleAddArrowMarkers">
          加载 20 个箭头沿路径移动
        </button>
        <button class="demo-btn" @click="handleRemoveArrowMarkers">
          移除箭头点位
        </button>
        <span class="demo-tip">沿解放碑→洪崖洞→朝天门循环移动，停止用「停止批量点位帧更新」</span>
      </div>
      <!-- 3D 模型演示：调用 cesiumModels.js 工具模块（独立于 CesiumMap 组件） -->
      <div class="demo-actions">
        <button class="demo-btn" @click="handleLoad3DBuildings">
          加载建筑白模（ion OSM）
        </button>
        <button class="demo-btn" @click="handleRemove3DBuildings">
          移除建筑白模
        </button>
        <button class="demo-btn" @click="handleLoadAircraft">
          加载飞机模型（ion 资产）
        </button>
        <button class="demo-btn" @click="handleRemoveAircraft">
          移除飞机模型
        </button>
        <span class="demo-tip">依赖 ion token（见 .env VITE_CESIUM_ION_TOKEN）</span>
      </div>
      <!-- 自定义 b3dm 演示：加载 public/cesium-assets/my-building/tileset.json 模板 -->
      <div class="demo-actions">
        <button class="demo-btn" @click="handleLoadCustomB3dm">
          加载自定义 b3dm（模板）
        </button>
        <button class="demo-btn" @click="handleRemoveCustomB3dm">
          移除自定义 b3dm
        </button>
        <span class="demo-tip">把 b3dm 丢到 public/cesium-assets/my-building/，改 tileset.json 的 uri 即可用</span>
      </div>
      <div class="demo-actions">
        <div v-for="m in markers" :key="m.name">
          <button class="demo-btn" @click="handleAddMarker(m)">
            {{ m.name }}
          </button>
          <button class="demo-btn" @click="handleMoveMarker(m)">
            移动
          </button>
          <button class="demo-btn" @click="handleRemoveMarker(m)">
            删除
          </button>
        </div>
      </div>
    </div>

    <!-- 地图区域：包裹 CesiumMap 组件，必须给定明确高度 -->
    <div class="demo-map-wrapper">
      <CesiumMap ref="mapRef" />
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
import CesiumMap from '@/components/CesiumMap.vue'
import {
  load3DTileset,
  remove3DTileset,
  loadModel,
  removeModel,
  clearAllModels,
  flyToObject,
} from '@/utils/cesiumModels.js'

/* mapRef 引用 CesiumMap 组件实例，通过它调用 defineExpose 暴露的方法
   （viewer / addMarker）。 */
const mapRef = ref(null)

/* 10 个重庆地标点位数据。
   每个点位：name（名称 + 去重键）/ longitude / latitude / description
   （HTML 字符串，点击点位时显示在 infoBox 弹窗）。
   坐标为 WGS-84；高德瓦片是 GCJ-02，会有数百米偏移（展示可接受）。 */
const markers = [
  { name: '解放碑', longitude: 106.5781, latitude: 29.5486, description: '建成：1947 年，抗战胜利纪功碑，重庆城市地标，位于渝中半岛核心。' },
  { name: '洪崖洞', longitude: 106.5777, latitude: 29.5673, description: '<p><strong>楼层：</strong>11 层吊脚楼</p><p>巴渝民俗风貌区，夜景灯光观赏胜地。</p>' },
  { name: '人民大礼堂', longitude: 106.5512, latitude: 29.5544, description: '<p><strong>建成：</strong>1955 年</p><p>仿古建筑群，重庆标志性建筑，曾是西南最大礼堂。</p>' },
  { name: '重庆北站', longitude: 106.5516, latitude: 29.6074, description: '<p><strong>投用：</strong>2006 年</p><p>铁路枢纽站，西南地区重要客运站。</p>' },
  { name: '江北机场', longitude: 106.6407, latitude: 29.7200, description: '<p><strong>通航：</strong>1990 年</p><p>4E 级干线机场，西南主要航空枢纽。</p>' },
  { name: '磁器口', longitude: 106.4470, latitude: 29.5790, description: '<p><strong>历史：</strong>千年古镇</p><p>明清风格商贸古镇，嘉陵江畔。</p>' },
  { name: '长江索道', longitude: 106.5850, latitude: 29.5600, description: '<p><strong>运营：</strong>1987 年</p><p>万里长江第一条跨江客运索道。</p>' },
  { name: '南山一棵树', longitude: 106.5960, latitude: 29.5220, description: '<p><strong>海拔：</strong>约 444 米</p><p>重庆夜景观赏最佳点之一。</p>' },
  { name: '朝天门', longitude: 106.5870, latitude: 29.5680, description: '<p><strong>位置：</strong>两江交汇</p><p>长江与嘉陵江交汇处，重庆最古老码头。</p>' },
  { name: '重庆大剧院', longitude: 106.5810, latitude: 29.5710, description: '<p><strong>建成：</strong>2005 年</p><p>江北嘴地标，弧形玻璃幕墙建筑。</p>' },
]
const newMarkers = ref([]) // 批量添加的点位数据，便于后续删除

/* 点击按钮：添加（或飞到）对应点位。
   addMarker 内部按 name 去重，重复点同一按钮只会飞到已有点，不重复添加。 */
const handleAddMarker = (m) => {
  if (!mapRef.value) return
  mapRef.value.addMarker(m)
}
const handleMoveMarker = (m) => {
  if (!mapRef.value) return
  mapRef.value.moveEntityMarker(m.name,
    m.longitude + Math.random() * 0.01 - 0.005,
    m.latitude + Math.random() * 0.01 - 0.005,
    100 + Math.random() * 50,
  )
}
const handleRemoveMarker = (m) => {
  if (!mapRef.value) return
  mapRef.value.removeMarker(m.name)
}
/* 点击按钮：批量添加5000个点位。
   addMarkers 内部按 name 去重，重复点同一按钮只会飞到已有点，不重复添加。 */
const handleAddMarkers = () => {
  if (!mapRef.value) return
  handleRemoveMarkers() // 先删除已有批量点位，避免重复添加
  let arr = []
  for (let i = 0; i < 5000; i++) {
    arr.push({
      name: `重庆地标-${i + 1}`,
      longitude: 106.5 + Math.random() * 0.5,
      latitude: 29.5 + Math.random() * 0.5,
      description: `<p>随机生成的重庆地标点位 #${i + 1}</p>`,
    })
  }
  newMarkers.value = arr
  mapRef.value.addMarkers(arr)
}
const handleRemoveMarkers = () => {
  if (!mapRef.value) return
  mapRef.value.removeMarkers(newMarkers.value.map((m) => m.name))
  newMarkers.value = []
}

const handleStartBatchMarkersFrameUpdate = () => {
  if (!mapRef.value) return

  mapRef.value.startBatchMarkersFrameUpdate(
    (marker, time, index, seconds) => {
      // 使用 Cesium 时间，避免移动速度受帧率影响

      return {
        // 以原始位置为中心往返移动
        longitude:
          marker.originalLongitude +
          Math.sin(seconds + index) * 1,
        // Math.random() * 0.005 - 0.002, // ±0.005 度


        latitude: marker.originalLatitude,

        height: marker.height,
      }
    },
  )
}
const handleStopBatchMarkersFrameUpdate = () => {
  if (!mapRef.value) return
  mapRef.value.stopBatchMarkersFrameUpdate()
}

/* 通用辅助：未添加批量点位时先补一批，保证动画有可移动对象 */
const ensureBatchMarkers = () => {
  if (!newMarkers.value.length) handleAddMarkers()
}

/* 往返运动：在原始位置附近沿经度方向做正弦往返 */
const handleStartOscillate = () => {
  if (!mapRef.value) return
  ensureBatchMarkers()
  mapRef.value.startMarkerAnimation({
    mode: 'oscillate',
    amplitude: 0.01, // 振幅 0.01 度 ≈ 1.1km
    period: 4,        // 周期 4 秒
    axis: 'x',        // 仅经度方向往返
  })
}

/* 圆周运动：围绕解放碑做半径 0.012 度的圆周 */
const handleStartCircle = () => {
  if (!mapRef.value) return
  ensureBatchMarkers()
  mapRef.value.startMarkerAnimation({
    mode: 'circle',
    center: { longitude: 106.5781, latitude: 29.5486 }, // 解放碑
    radius: 0.012,
    duration: 8,
    direction: 1,
  })
}

/* 循环路径：沿主城若干地标首尾相接循环移动 */
const handleStartLoopPath = () => {
  if (!mapRef.value) return
  ensureBatchMarkers()
  mapRef.value.startMarkerAnimation({
    mode: 'loopPath',
    duration: 15,
    path: [
      { longitude: 106.5781, latitude: 29.5486 }, // 解放碑
      { longitude: 106.5777, latitude: 29.5673 }, // 洪崖洞
      { longitude: 106.5870, latitude: 29.5680 }, // 朝天门
      { longitude: 106.5512, latitude: 29.5544 }, // 人民大礼堂
    ],
  })
}

/* 路径跟随：沿解放碑→洪崖洞→朝天门移动，到终点后停止 */
const handleStartPathFollow = () => {
  if (!mapRef.value) return
  ensureBatchMarkers()
  mapRef.value.startMarkerAnimation({
    mode: 'pathFollow',
    duration: 10,
    path: [
      { longitude: 106.5781, latitude: 29.5486 }, // 解放碑
      { longitude: 106.5777, latitude: 29.5673 }, // 洪崖洞
      { longitude: 106.5870, latitude: 29.5680 }, // 朝天门
    ],
  })
}

/* ==================== 3D 模型演示 ====================
 * 调用 src/utils/cesiumModels.js（独立工具模块，不写进 CesiumMap.vue）。
 * 通过 mapRef.value.viewer 拿到 Cesium Viewer 实例传入。
 * 资产：ion OSM Buildings（assetId 96188）+ Cesium Air 飞机（assetId 12552）。
 * 注意：依赖 VITE_CESIUM_ION_TOKEN，未配置时 ion 资产加载会失败。
 */
const BUILDINGS_TAG = 'chongqing-buildings'
const AIRCRAFT_TAG = 'chongqing-aircraft'

/* 加载 3D Tiles：ion OSM Buildings（全球建筑白模，按瓦片按需加载） */
const handleLoad3DBuildings = async () => {
  if (!mapRef.value?.viewer) return
  const tileset = await load3DTileset(mapRef.value.viewer, {
    tag: BUILDINGS_TAG,
    assetId: 96188,             // Cesium OSM Buildings
    heightOffset: 0,           // 重庆地形与建筑基准基本对齐，保持 0
    maximumScreenSpaceError: 16,
    /* GCJ-02 偏移：底图是高德（GCJ-02），OSM Buildings 是 WGS-84，
     * 用解放碑做参考点整体平移，让参考点附近（重庆主城）的建筑跟
     * 高德道路底图对齐。远离主城的区域有少量二次偏差。 */
    applyGcj02: true,
    referenceLongitude: 106.5781,   // 解放碑
    referenceLatitude: 29.5486,
  })
  if (tileset) flyToObject(mapRef.value.viewer, tileset, {
    height: 2000,
    heading: 0,                    // 朝正北
    pitch: -60,                    // 陡俯视，60 度看建筑群更立体
    fallbackLongitude: 106.5781,   // 重庆解放碑
    fallbackLatitude: 29.5486,
  })
}

const handleRemove3DBuildings = () => {
  if (!mapRef.value?.viewer) return
  remove3DTileset(mapRef.value.viewer, BUILDINGS_TAG)
}

/* 加载单个 glTF 模型：用本地 glb 文件
 * Cesium_Air.glb 已下载到 public/cesium/Assets/ 下，直接用本地路径
 * 不依赖代理和 ion。改用 Entity 形式加载（cesiumModels.js 内部），
 * 避开 Model primitive 在 1.144 上对老 glb 的兼容问题。 */
const handleLoadAircraft = async () => {
  if (!mapRef.value?.viewer) return
  const model = await loadModel(mapRef.value.viewer, {
    tag: AIRCRAFT_TAG,
    url: '/cesium/Assets/Cesium_Air.glb',
    longitude: 106.5781,        // 解放碑
    latitude: 29.5486,
    height: 500,                // 上空 500 米
    scale: 5,                   // 调小：原 50 太大，5 大约真实飞机尺寸（25m 翼展）
    heading: 90,                // 朝东
  })
  if (model) flyToObject(mapRef.value.viewer, model, {
    height: 3500,
    heading: 90,                   // 朝东（跟飞机朝向一致）
    pitch: -45,                    // 斜俯视，能同时看到飞机和地面
  })
}

const handleRemoveAircraft = () => {
  if (!mapRef.value?.viewer) return
  removeModel(mapRef.value.viewer, AIRCRAFT_TAG)
}

/* ==================== 自定义 b3dm 演示 ====================
 * 加载 public/cesium-assets/my-building/tileset.json 模板。
 * 这是 3D Tiles 1.0 的标准入口清单文件，里面引用一个 b3dm 文件。
 * 用法：
 *   1. 把你的 building.b3dm 文件丢到 public/cesium-assets/my-building/
 *   2. 改 tileset.json 里的 content.uri 指向你的文件名
 *   3. 改 boundingVolume.region 为你 b3dm 实际位置的经纬度范围
 *   4. 点本按钮加载（或调 load3DTileset(viewer, { url: '...' })）
 * 模板文件含详细注释，每个字段都有 _xxx 注解说明作用。
 */
const CUSTOM_B3DM_TAG = 'custom-b3dm'

const handleLoadCustomB3dm = async () => {
  if (!mapRef.value?.viewer) return
  const tileset = await load3DTileset(mapRef.value.viewer, {
    tag: CUSTOM_B3DM_TAG,
    url: '/cesium-assets/my-building/tileset.json', // 相对 public 的路径
    heightOffset: 0, // 模型整体抬高/降低（米），按需调整
    maximumScreenSpaceError: 16,
  })
  if (tileset) {
    flyToObject(mapRef.value.viewer, tileset, {
      height: 500,
      heading: 0,
      pitch: -45,
      fallbackLongitude: 106.5781,
      fallbackLatitude: 29.5486,
    })
  }
}

const handleRemoveCustomB3dm = () => {
  if (!mapRef.value?.viewer) return
  remove3DTileset(mapRef.value.viewer, CUSTOM_B3DM_TAG)
}

/* ==================== 箭头点位沿路径移动 ====================
 * 加载 20 个箭头图标点位，沿「解放碑→洪崖洞→朝天门」3 点路径循环移动。
 * 用 SVG 构造红色箭头图标作为 data URI，不依赖任何外部图片资源。
 * 路径取自现有 10 个地标里的 3 个。
 */

/* 箭头图标：红色三角形 + 白色描边，向上指 */
const arrowImage =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">' +
    '<path d="M16 2 L30 28 L16 22 L2 28 Z" fill="#ff4444" stroke="#ffffff" stroke-width="1.5"/>' +
    '</svg>',
  )

/* 路径：从 10 个地标里选 3 个作为循环移动路径 */
const ARROW_MOVING_PATH = [
  { longitude: 106.5781, latitude: 29.5486 }, // 解放碑
  { longitude: 106.5777, latitude: 29.5673 }, // 洪崖洞
  { longitude: 106.5870, latitude: 29.5680 }, // 朝天门
]

const arrowMarkers = ref([]) // 保存 20 个箭头点位，便于后续删除

/* 加载 20 个箭头点位并启动路径循环移动
 * - 初始位置：从解放碑附近错开排列，让 20 个点位在路径上分散开
 * - 图标：用 arrowImage 红色箭头
 * - 动画：调 startMarkerAnimation 的 loopPath 模式，沿 3 点路径循环
 * - 相位错开：startMarkerAnimation 内部会按 index 加相位偏移，
 *   20 个点位不会重叠成一团，会形成「箭头队列」沿路径流动的效果
 */
const handleAddArrowMarkers = () => {
  if (!mapRef.value) return
  handleRemoveArrowMarkers() // 先清理已有箭头点位，避免重复添加

  const start = ARROW_MOVING_PATH[0]
  const arr = []
  for (let i = 0; i < 20; i++) {
    // 初始位置：在路径起点（解放碑）附近小范围错开，避免 20 个点位完全重叠
    arr.push({
      name: `箭头-${i + 1}`,
      longitude: start.longitude + (Math.random() - 0.5) * 0.001,
      latitude: start.latitude + (Math.random() - 0.5) * 0.001,
      height: 50,
      image: arrowImage,
      width: 24,
      height: 24, // 略小于默认 32，避免 20 个箭头互相遮挡
      description: `<p>箭头点位 #${i + 1}，沿解放碑→洪崖洞→朝天门循环移动</p>`,
    })
  }
  arrowMarkers.value = arr
  mapRef.value.addMarkers(arr)

  // 启动循环路径动画
  mapRef.value.startMarkerAnimation({
    mode: 'loopPath',
    duration: 18, // 一圈 18 秒，配合 20 个点位的相位错开形成流动效果
    path: ARROW_MOVING_PATH,
  })
}

const handleRemoveArrowMarkers = () => {
  if (!mapRef.value) return
  mapRef.value.stopBatchMarkersFrameUpdate() // 先停止动画
  mapRef.value.removeMarkers(arrowMarkers.value.map((m) => m.name))
  arrowMarkers.value = []
}

/* 页面卸载时清理所有 3D 模型，防止 primitives 堆积 */
onUnmounted(() => {
  if (mapRef.value?.viewer) {
    clearAllModels(mapRef.value.viewer)
  }
})
</script>

<style scoped>
.cesium-demo {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 600px;
  padding: 16px;
  box-sizing: border-box;
}

.demo-header {
  margin-bottom: 12px;
}

.demo-header h2 {
  margin: 0 0 6px;
  font-size: 18px;
  color: #303133;
}

.demo-header p {
  margin: 0;
  font-size: 13px;
  color: #909399;
  line-height: 1.6;
}

/* 操作按钮区：横向排列、自动换行 */
.demo-actions {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.demo-btn {
  padding: 6px 14px;
  font-size: 13px;
  color: #fff;
  background: #409eff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.demo-btn:hover {
  background: #66b1ff;
}

.demo-tip {
  align-self: center;
  font-size: 12px;
  color: #909399;
}

/* 地图容器占满剩余高度，确保 Cesium canvas 有明确尺寸 */
.demo-map-wrapper {
  flex: 1;
  min-height: 500px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  overflow: hidden;
}
</style>
