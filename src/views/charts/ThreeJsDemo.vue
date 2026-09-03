<template>
  <div class="three-js-demo">
    <el-card shadow="hover" class="main-card">
      <template #header>
        <div class="card-header">
          <span>Three.js 3D演示</span>
          <el-space>
            <el-button type="primary" @click="addCube">添加立方体</el-button>
            <el-button @click="resetScene">重置场景</el-button>
            <el-button @click="toggleRotation">旋转: {{ isRotating ? '开启' : '关闭' }}</el-button>
          </el-space>
        </div>
      </template>

      <div ref="canvasContainer" class="canvas-container">
        <!-- 点击命中信息 -->
        <div v-if="lastHit" class="hit-panel">
          <div class="hit-title">🎯 你点击到了立方体</div>
          <div class="hit-row">
            <span>编号：</span>
            <b>{{ lastHit.index + 1 }}</b>
          </div>
          <div class="hit-row">
            <span>位置：</span>
            <b>
              ({{ lastHit.position.x.toFixed(2) }}, {{ lastHit.position.y.toFixed(2) }},
              {{ lastHit.position.z.toFixed(2) }})
            </b>
          </div>
          <div class="hit-row">
            <span>颜色：</span>
            <span class="color-box" :style="{ background: lastHit.colorHex }"></span>
            <code>{{ lastHit.colorHex }}</code>
          </div>
          <el-button
            size="small"
            type="danger"
            style="margin-top: 8px; width: 100%"
            @click="removeHitCube"
          >
            删除这个立方体
          </el-button>
        </div>
      </div>

      <div class="info-panel">
        <el-row>
          <el-col :span="8">
            <div class="info-item">
              <span class="label">立方体数量:</span>
              <span class="value">{{ cubeCount }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="info-item">
              <span class="label">旋转速度:</span>
              <el-slider v-model="rotationSpeed" :min="0" :max="0.1" :step="0.01" />
            </div>
          </el-col>
          <el-col :span="8">
            <div class="info-item">
              <span class="label">场景大小:</span>
              <span class="value">{{ sceneSize }}x{{ sceneSize }}</span>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { ref, onMounted, onUnmounted, watch } from 'vue'

const canvasContainer = ref(null)
let scene, camera, renderer, controls
let cubes = []
let animationId = null

const cubeCount = ref(0)
const isRotating = ref(true)
const rotationSpeed = ref(0.01)
const sceneSize = ref(10)

/* ========== 点击拾取相关 ==========
 *
 * 思路（Three.js 标准拾取流程）：
 *   1. 监听 canvas 的 click（或 pointerdown）得到 DOM 鼠标事件 event
 *   2. 用 canvas.getBoundingClientRect() 把 event.clientX/Y 转为
 *      「相对于 canvas 左上角的坐标」 → 再映射到 WebGL 的 NDC：
 *           NDC x = (pixelX / width) * 2 - 1     范围 [-1, 1]
 *           NDC y = -(pixelY / height) * 2 + 1    注意 Y 要取反(DOM 向下, WebGL 向上)
 *   3. new THREE.Raycaster().setFromCamera(mouseNDC, camera) 发射一根射线
 *   4. raycaster.intersectObjects(objects) 得到被射线命中的物体
 *   5. intersects[0] 是最近的命中；读取 .object / .point / .face / .uv 等
 */
let raycaster = null // 射线实例
let mouseNDC = null // 存设备坐标
let highlightedCube = null // 当前高亮的立方体
let highlightBakColor = null // 原来的颜色(恢复用)

const lastHit = ref(null) // 展示给 UI 的命中信息

/**
 * initScene — Three.js 场景初始化入口
 *
 * 本函数【无入参、无返回值】。
 * 依赖：
 *   canvasContainer.value : 外层 <div ref="canvasContainer"> 的 DOM 实例，用来取宽高 & 挂载 canvas
 *   scene/camera/renderer/controls : 模块级变量，接收创建出来的实例，方便后续 addCube / resetScene / onUnmounted 使用
 *   animate() / handleResize() : 同文件下的辅助函数，最后启动渲染循环 & 注册 resize
 */
const initScene = () => {
  if (!canvasContainer.value) return

  const W = canvasContainer.value.clientWidth
  const H = canvasContainer.value.clientHeight

  /* ======================================================================
   * 1) Scene — 场景（所有物体 / 灯光 / 相机的根容器）
   *    new THREE.Scene() 【无构造参数】
   *    常用属性：
   *      scene.background : 背景颜色(THREE.Color) / 纹理 / null(透明)
   *      scene.fog        : 雾效果，如 new THREE.Fog(0xffffff, 10, 200)
   * ====================================================================== */
  scene = new THREE.Scene()
  // 参数(0xf0f0f0): 颜色值，可以是 0xRRGGBB 数字 / '#ffffff' 字符串 / {r,g,b} 对象
  scene.background = new THREE.Color(0xf0f0f0)

  /* ======================================================================
   * 2) PerspectiveCamera — 透视相机（人眼/普通 3D 视角）
   *    构造参数: new THREE.PerspectiveCamera(fov, aspect, near, far)
   *      fov    : 视场角(度)，越大越像鱼眼，越小越像望远镜，常用 45~75
   *      aspect : 宽高比，必须 = 画布宽/高，否则画面拉伸
   *      near   : 近裁剪面，比这个更近的物体不渲染(>0 即可)
   *      far    : 远裁剪面，比这个更远的物体不渲染
   * ====================================================================== */
  camera = new THREE.PerspectiveCamera(
    75, // ← fov       : 75° 视场角
    W / H, // ← aspect    : 画布宽高比
    0.1, // ← near      : 近裁剪面 0.1 单位
    1000, // ← far       : 远裁剪面 1000 单位
  )
  // 默认相机在 (0,0,0) 朝 -z 方向，必须拉开距离才能看到原点附近的物体
  camera.position.z = 15

  /* ======================================================================
   * 3) WebGLRenderer — WebGL 渲染器（真正把 scene+camera 画到 canvas 的东西）
   *    构造参数对象：
   *      antialias                 : 抗锯齿开关(true 线条/边缘更平滑)
   *      alpha                     : canvas 是否透明(可与页面背景混合)
   *      preserveDrawingBuffer     : 保留绘图缓冲，做 toDataURL 截图时需要
   *      powerPreference           : 'high-performance' 提示浏览器用独显
   *      canvas                    : 指定一个已有 <canvas>，不传则内部新建
   *
   *    常用方法：
   *      setPixelRatio(dpr)  : 适配高分屏(2K/4K/Mac 必加，否则画面糊)
   *      setSize(w,h)        : 设置 canvas 的像素尺寸 + CSS 尺寸
   *      render(scene,cam)   : 执行一次 GPU 绘制
   *      domElement          : 内部的 <canvas> DOM，需要 appendChild 到页面
   * ====================================================================== */
  renderer = new THREE.WebGLRenderer({
    antialias: true, // ← 参数1: 抗锯齿
    // alpha: true,       // ← 可选: 允许 canvas 透明
    // powerPreference: 'high-performance',  // ← 可选: 提示用高性能 GPU
  })
  // 【新增】高分屏适配：取 devicePixelRatio，上限 2 避免移动端 3x DPR 性能爆炸
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setSize(W, H)
  // 你选中的这一行：把 WebGLRenderer 内部生成的 <canvas> 插到容器里
  // ⚠️ 注意 1) 事件监听要绑定到 renderer.domElement（也就是这根 canvas），
  //        而不是 canvasContainer — 因为容器上还有 UI 层。
  //        另外 OrbitControls 也是绑的这根，所以想"点击但不触发拖拽"，
  //        可以在 click 后判断鼠标位移(<3px)再拾取，这里用最简单的 click 即可。
  canvasContainer.value.appendChild(renderer.domElement)

  /* --------------------------------------------------------------
   * 创建 Raycaster + Vector2（只创建一次，每帧复用同一个实例性能好）
   *   new THREE.Raycaster(origin?, direction?, near?, far?)
   *     origin    : 射线起点(Vector3)，一般给 camera 位置，通过 setFromCamera 自动算
   *     direction : 射线方向(Vector3，必须归一化)，同上会自动算
   *     near/far  : 射线的有效距离区间
   * -------------------------------------------------------------- */
  raycaster = new THREE.Raycaster()
  // 可选: 限制只在 0.1 ~ 200 单位内命中
  // raycaster.near = 0.1;
  // raycaster.far  = 200;

  mouseNDC = new THREE.Vector2() // 存 NDC 坐标(x,y ∈ [-1, 1])

  /* 绑定 canvas 点击事件 — 这就是你问的"点击事件怎么弄" */
  renderer.domElement.addEventListener('click', onCanvasClick)
  // 可选: 鼠标移动时高亮（hover），先不加，要加的话放开下一行
  // renderer.domElement.addEventListener('pointermove', onCanvasPointerMove);

  /* ======================================================================
   * 4) OrbitControls — 轨道控制器（来自 three/examples，非核心）
   *    构造参数: new OrbitControls(camera, domElement)
   *      camera     : 要被控制的相机
   *      domElement : 接收鼠标/触摸事件的 DOM（一般传 renderer.domElement）
   *
   *    常用属性：
   *      enableDamping / dampingFactor : 惯性滑行阻尼（开了后 animate 里必须 controls.update()）
   *      autoRotate / autoRotateSpeed  : 自动绕 target 旋转
   *      minDistance / maxDistance     : 滚轮缩放范围
   *      minPolarAngle / maxPolarAngle : 俯仰角限制(禁穿地面等)
   *      target : 相机看向的中心点(THREE.Vector3)
   *    常用方法：
   *      update()    每帧调用
   *      reset()     回到初始状态
   *      dispose()   卸载事件监听
   * ====================================================================== */
  controls = new OrbitControls(
    camera, // ← 参数1: 要控制的相机
    renderer.domElement, // ← 参数2: 接收事件的 DOM
  )
  controls.enableDamping = true // 开启拖拽惯性
  controls.dampingFactor = 0.05 // 阻尼系数，越小滑行越久
  // controls.autoRotate = true;      // 可选: 自动旋转
  // controls.autoRotateSpeed = 1;    // 可选: 自动旋转速度
  // controls.minDistance = 5;        // 可选: 缩放最近距离
  // controls.maxDistance = 60;       // 可选: 缩放最远距离

  /* ======================================================================
   * 5) 灯光
   *
   *  5.1 AmbientLight — 环境光（无方向，整体打亮，不会产生阴影）
   *      构造参数: new THREE.AmbientLight(color, intensity)
   *        color     : 光的颜色
   *        intensity : 强度，默认 1
   *
   *  5.2 DirectionalLight — 平行光（模拟太阳光，产生方向性高光/阴影）
   *      构造参数同上 (color, intensity)
   *      重要补充：
   *        .position.set(x,y,z)   : 决定光线方向（方向光不关心"距离"，只关心方向）
   *        .target                : 指向的目标点(Object3D)，默认 (0,0,0)
   *        .castShadow = true     : 开启投影（还需配 shadow.camera + renderer.shadowMap.enabled）
   * ====================================================================== */
  const ambientLight = new THREE.AmbientLight(
    0x404040, // ← 参数1: 光的颜色(深灰)
    2, // ← 参数2: 强度 2，放大整体底光
  )

  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(
    0xffffff, // ← 参数1: 白光
    1, // ← 参数2: 强度 1
  )

  directionalLight.position.set(5, 5, 5) // ← 光源位置(决定方向)
  // directionalLight.castShadow = true;     // ← 可选: 开启阴影投射
  scene.add(directionalLight)

  /* ======================================================================
   * 6) AxesHelper — 坐标轴辅助线(调试用)
   *    构造参数: new THREE.AxesHelper(size)
   *      size : 轴的长度(世界单位)
   *    红=X 轴, 绿=Y 轴, 蓝=Z 轴
   * ====================================================================== */
  const axesHelper = new THREE.AxesHelper(
    5, // ← 参数1: 轴长度 5 个单位
  )

  scene.add(axesHelper)

  /* ======================================================================
   * 7) 地面 Mesh ( Mesh = Geometry(形状) + Material(材质) )
   *
   *  7.1 PlaneGeometry — 平面几何体
   *      构造参数: new THREE.PlaneGeometry(width, height, widthSeg?, heightSeg?)
   *        width / height       : 宽、高（XY 平面上）
   *        widthSeg / heightSeg : 宽、高方向分段数(越多越细腻，也越慢)
   *
   *  7.2 MeshStandardMaterial — PBR 物理材质(需要灯光才能看到颜色)
   *      常用参数（对象里可传的字段）：
   *        color              : 基础颜色
   *        map                : 贴图(THREE.Texture)
   *        roughness          : 粗糙度(0=镜面,1=哑光)，默认 1
   *        metalness          : 金属度(0=非金属,1=金属)，默认 0
   *        emissive / emissiveIntensity : 自发光颜色 & 强度
   *        opacity + transparent:true   : 透明度（必须 transparent 才生效）
   *        side               : THREE.FrontSide / BackSide / DoubleSide
   *        wireframe          : true 显示线框
   *
   *  7.3 Mesh — 网格实体(Geometry + Material 的容器)
   *      构造参数: new THREE.Mesh(geometry, material)
   *      后续操作：
   *        .position / .rotation / .scale  : 位置、旋转、缩放
   *        .castShadow / .receiveShadow    : 是否投/收阴影
   * ====================================================================== */
  const groundGeometry = new THREE.PlaneGeometry(
    20, // ← 参数1: 宽度 20
    20, // ← 参数2: 高度 20
    // , 4  // ← 参数3(可选): widthSeg 宽度分段
    // , 4  // ← 参数4(可选): heightSeg 高度分段
  )
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0xcccccc, // ← 基础颜色
    roughness: 0.5, // ← 粗糙度(0~1)
    metalness: 0, // ← 金属度(0~1)，地面一般非金属
    side: THREE.DoubleSide, // ← 双面渲染(防止从下面看地面消失)
    // transparent: true, opacity: 0.8, // ← 可选: 开启透明度
    // wireframe: true,                 // ← 可选: 线框模式
  })
  const ground = new THREE.Mesh(
    groundGeometry, // ← 参数1: 几何体(形状)
    groundMaterial, // ← 参数2: 材质(皮肤)
  )

  // Plane 默认在 XY 平面，我们要放到地面(XZ 平面)，所以绕 X 轴旋转 -90°
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -5 // 下沉 5 个单位，给立方体留下掉落空间
  // ground.receiveShadow = true;   // ← 可选: 接收阴影
  scene.add(ground)

  /* ======================================================================
   * 8) 启动渲染循环 & 窗口监听
   *    animate()  内部递归 requestAnimationFrame 绘制
   * ====================================================================== */
  animate()
  window.addEventListener('resize', handleResize)
}

/**
 * animate — 渲染循环
 * 每帧做 3 件事：更新控制器 → 更新物体动画 → 调用 renderer.render 画一帧
 */
const animate = () => {
  animationId = requestAnimationFrame(animate)

  controls.update() // 控制器每帧必须调一次，阻尼/自动旋转才生效

  // 逐个立方体更新旋转
  if (isRotating.value) {
    cubes.forEach((cube, index) => {
      cube.rotation.x += rotationSpeed.value
      cube.rotation.y += rotationSpeed.value * (1 + index * 0.1)
    })
  }

  // 参数1: 场景对象  参数2: 相机对象
  renderer.render(scene, camera)
}

/**
 * addCube — 生成一个随机颜色/位置/大小的立方体并加入场景
 */
const addCube = () => {
  /* ---------------------------------------------------------------
   * BoxGeometry — 立方体几何体
   * 构造参数: new THREE.BoxGeometry(width, height, depth, wSeg?, hSeg?, dSeg?)
   *   width / height / depth : 宽、高、深
   *   wSeg/hSeg/dSeg         : 各方向分段(需要变形时才加大)
   * --------------------------------------------------------------- */
  const geometry = new THREE.BoxGeometry(
    1, // ← 宽
    1, // ← 高
    1, // ← 深
  )

  /* MeshStandardMaterial 参数(同地面材质)
   *   color     : 颜色
   *   metalness : 金属度(0~1)
   *   roughness : 粗糙度(0~1)
   *   map/normalMap/roughnessMap 等 PBR 贴图
   */
  const material = new THREE.MeshStandardMaterial({
    // Math.random() 作为 r,g,b → 拼一个随机颜色
    color: new THREE.Color(Math.random(), Math.random(), Math.random()),
    metalness: 0.5, // ← 半金属质感
    roughness: 0.3, // ← 有点光滑
    // wireframe: true,
  })

  // Mesh(geometry, material)  — 见上面地面处的详细注释
  const cube = new THREE.Mesh(geometry, material)

  // 随机位置(根据 sceneSize 在范围内均匀分布)
  const positionRange = sceneSize.value / 2 - 1

  cube.position.x = (Math.random() - 0.5) * positionRange * 2
  cube.position.y = Math.random() * 5
  cube.position.z = (Math.random() - 0.5) * positionRange * 2

  // 随机初始旋转角度
  cube.rotation.x = Math.random() * Math.PI
  cube.rotation.y = Math.random() * Math.PI

  // 随机缩放 0.5 ~ 2 倍
  const scale = 0.5 + Math.random() * 1.5

  cube.scale.set(scale, scale, scale)

  scene.add(cube)
  cubes.push(cube)
  cubeCount.value = cubes.length
}

/**
 * resetScene — 清空所有立方体，重置相机和控制器
 */
const resetScene = () => {
  // 释放每个立方体的 geometry 和 material（不 dispose 会显存泄漏）
  cubes.forEach((cube) => {
    scene.remove(cube)
    cube.geometry.dispose()
    cube.material.dispose()
  })

  cubes = []
  cubeCount.value = 0

  // position.set(x,y,z) : 同时设置三维坐标
  camera.position.set(0, 5, 15)
  // lookAt(x,y,z)       : 强制相机看向某个点
  camera.lookAt(0, 0, 0)
  controls.reset()
}

/**
 * toggleRotation — 切换是否自动旋转立方体
 */
const toggleRotation = () => {
  isRotating.value = !isRotating.value
}

/* ==========================================================================
 * 🔍 点击拾取（你问的"点击事件"核心逻辑）
 * ==========================================================================
 *
 * onCanvasClick(event)
 *   参数 event 是浏览器原生 MouseEvent，字段：
 *     event.clientX / event.clientY : 相对浏览器视口左上角的像素坐标
 *     event.target                  : 实际接收事件的 DOM (canvas)
 *     event.button                  : 0=左键 1=中键 2=右键
 *
 * 计算步骤：
 *   1. rect = canvas.getBoundingClientRect()
 *        rect.left/top  = canvas 左上角在视口中的坐标(考虑滚动条)
 *        rect.width/height = canvas 的 CSS 尺寸
 *   2. 像素内坐标
 *        pixelX = event.clientX - rect.left
 *        pixelY = event.clientY - rect.top
 *   3. NDC (Normalized Device Coordinates 归一化设备坐标 [-1,1])
 *        x = (pixelX / rect.width ) * 2 - 1     左=-1 中=0 右=+1
 *        y = -(pixelY / rect.height) * 2 + 1    上=+1 中=0 下=-1  (⚠️DOM Y向下/WebGL Y向上)
 *   4. raycaster.setFromCamera( mouseNDC, camera )
 *        — 内部自动把 NDC 反投影到 3D 空间，得到 origin(相机位置) + direction(过鼠标点)
 *   5. intersects = raycaster.intersectObjects( cubes, recursive=false )
 *        参数 1: 要检测的 3D 对象数组 (Group/Mesh 都可)
 *        参数 2: 是否递归进子节点 (如果对象有 children 需要 true；这里 cube 本身就是 Mesh，false 即可)
 *        返回值: 按距离从近到远排序的命中数组，每项含：
 *          .distance   : 射线起点到命中点距离
 *          .point      : 命中点世界坐标 (Vector3)
 *          .object     : 命中的 Mesh
 *          .face       : 命中的三角面 (含 normal 法线)
 *          .faceIndex  : 面索引
 *          .uv         : 命中点在贴图上的坐标
 */
const onCanvasClick = (event) => {
  // 只响应左键（避免右键菜单也触发拾取）
  if (event.button !== 0) return

  const canvas = renderer.domElement
  const rect = canvas.getBoundingClientRect()

  // → 步骤 2: 像素内坐标
  const pixelX = event.clientX - rect.left
  const pixelY = event.clientY - rect.top

  // → 步骤 3: 归一化到 [-1, 1]
  mouseNDC.x = (pixelX / rect.width) * 2 - 1
  mouseNDC.y = -(pixelY / rect.height) * 2 + 1

  // → 步骤 4: 生成射线
  raycaster.setFromCamera(mouseNDC, camera)

  // → 步骤 5: 与 cubes 数组里的所有 mesh 求交
  //    recursive: false，因为 cubes 存的就是 Mesh；里面若有 Group/子对象 才要 true
  const intersects = raycaster.intersectObjects(cubes, false)

  if (intersects.length === 0) {
    // 没命中任何物体
    clearHighlight()
    lastHit.value = null

    return
  }

  // 取最近一个命中
  const hit = intersects[0]
  const cube = hit.object
  const index = cubes.indexOf(cube)

  // UI 上显示
  lastHit.value = {
    index, // cubes 数组里的下标
    position: cube.position.clone(), // 世界位置（克隆防止被动画改动）
    colorHex: `#${cube.material.color.getHexString()}`, // 颜色 #RRGGBB
    distance: hit.distance, // 射线距离
    hitPoint: hit.point.clone(), // 面上精确命中点
    normal: hit.face.normal.clone(), // 命中面法线
  }

  // 高亮命中立方体(改为黄色)
  setHighlight(cube)

  console.log('[ThreeJsDemo] 命中立方体：', lastHit.value)
}

/**
 * 给某个 cube 设置高亮颜色
 */
const setHighlight = (cube) => {
  // 先恢复上一个高亮，避免多个立方体同时黄
  clearHighlight()
  if (!cube) return
  highlightedCube = cube
  // 用 .clone() 存备份：Material.color 是同一个 Color 对象引用
  highlightBakColor = cube.material.color.clone()
  // 改成高亮色（黄色 + 自发光稍微一点，阴影里也能看出来）
  cube.material.color.set('#ffdd33')
  cube.material.emissive?.set('#ff9900')
  cube.material.emissiveIntensity = 0.35
}

/**
 * 清除高亮，恢复原来的颜色
 */
const clearHighlight = () => {
  if (highlightedCube && highlightBakColor) {
    highlightedCube.material.color.copy(highlightBakColor)
    highlightedCube.material.emissive?.set('#000000')
    highlightedCube.material.emissiveIntensity = 0
  }
  highlightedCube = null
  highlightBakColor = null
}

/**
 * 移除当前被点击选中的那个立方体（命中面板里的按钮调用）
 */
const removeHitCube = () => {
  if (!lastHit.value) return
  const idx = lastHit.value.index

  if (idx < 0 || idx >= cubes.length) return
  const cube = cubes[idx]

  scene.remove(cube)
  cube.geometry.dispose()
  cube.material.dispose()
  cubes.splice(idx, 1)
  cubeCount.value = cubes.length
  // 删掉后清空选中状态
  clearHighlight()
  lastHit.value = null
}

/* ==========================================================================
 * (可选参考) 鼠标悬停高亮 — 逻辑与 click 一样，只是 pointermove + 节流
 * 想要可以把上面 initScene 里 pointermove 的注释打开即可
 * ==========================================================================
 * let _moveThrottle = 0;
 * const onCanvasPointerMove = (event) => {
 *   const now = performance.now();
 *   if (now - _moveThrottle < 16) return;  // 约 60fps 节流
 *   _moveThrottle = now;
 *   const rect = renderer.domElement.getBoundingClientRect();
 *   mouseNDC.x = ((event.clientX - rect.left) / rect.width ) * 2 - 1;
 *   mouseNDC.y = -((event.clientY - rect.top ) / rect.height) * 2 + 1;
 *   raycaster.setFromCamera(mouseNDC, camera);
 *   const hits = raycaster.intersectObjects(cubes, false);
 *   if (hits.length) setHighlight(hits[0].object);
 *   else clearHighlight();
 * };
 */

/**
 * handleResize — 窗口/容器尺寸变化时同步更新相机 & 渲染器
 * 注意顺序：先改 camera.aspect，再 updateProjectionMatrix，最后 renderer.setSize
 */
const handleResize = () => {
  if (!canvasContainer.value) return

  const width = canvasContainer.value.clientWidth
  const height = canvasContainer.value.clientHeight

  // aspect 宽高比 — 直接用 CSS 宽高比赋值
  camera.aspect = width / height
  // 更新相机投影矩阵（aspect/fov/near/far 任一项改变都必须调这句才生效）
  camera.updateProjectionMatrix()

  // 同步渲染器 canvas 尺寸
  renderer.setSize(width, height)
}

// 生命周期钩子
onMounted(() => {
  initScene()

  // 初始添加3个立方体
  for (let i = 0; i < 3; i++) {
    setTimeout(addCube, i * 500)
  }
})

onUnmounted(() => {
  // 清理资源
  if (animationId) {
    cancelAnimationFrame(animationId)
  }

  window.removeEventListener('resize', handleResize)

  // ⚠️ 解绑 canvas 点击事件，防止组件卸载后依然触发 + 内存泄漏
  if (renderer?.domElement) {
    renderer.domElement.removeEventListener('click', onCanvasClick)
    // renderer.domElement.removeEventListener('pointermove', onCanvasPointerMove);
  }

  if (renderer) {
    renderer.dispose()
  }

  if (controls) {
    controls.dispose()
  }

  resetScene()
})
</script>

<style scoped>
.three-js-demo {
  padding: 20px;
}

.main-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
}

.canvas-container {
  width: 100%;
  height: 600px;
  margin-top: 20px;
  position: relative;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  overflow: hidden;
  cursor: grab;
}

.canvas-container:active {
  cursor: grabbing;
}

/* 命中信息浮层 */
.hit-panel {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 230px;
  padding: 12px 14px;
  background: rgb(255 255 255 / 95%);
  border: 1px solid #ebeef5;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgb(0 0 0 / 12%);
  font-size: 13px;
  color: #303133;
  z-index: 10;
  user-select: none;
}

.hit-title {
  font-weight: 700;
  margin-bottom: 8px;
  color: #409eff;
}

.hit-row {
  display: flex;
  align-items: center;
  gap: 6px;
  line-height: 1.8;
}

.hit-row code {
  font-family: Consolas, Menlo, monospace;
  font-size: 12px;
  background: #f5f7fa;
  padding: 1px 6px;
  border-radius: 3px;
  color: #606266;
}

.color-box {
  display: inline-block;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
}

.info-panel {
  margin-top: 20px;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.info-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.label {
  font-weight: 500;
  color: #606266;
  margin-right: 10px;
}

.value {
  color: #303133;
  font-weight: 500;
}
</style>
