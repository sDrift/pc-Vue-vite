/**
 * cesiumModels.js —— Cesium 3D 模型加载工具（独立于 CesiumMap 组件）
 * ====================================================================
 * 提供 3D Tiles（城市建筑等大规模切片）与单个 glTF/glb 模型的
 * 加载、定位、移除能力。所有函数接收外部传入的 viewer 实例，
 * 不依赖 CesiumMap.vue 内部状态，可被任意使用 CesiumMap 的页面调用。
 *
 * 设计原则：
 *   - 数据默认来自 Cesium ion 资产库（assetId），也支持本地 url
 *   - 不修改 viewer 的基础配置（底图、相机、credit 等）
 *   - 加载失败不抛异常，console.warn 并返回 null，调用方自行判断
 *   - 移除函数空值安全，viewer 或对象为 null 直接 return
 *
 * Cesium API 选型：
 *   3D Tiles：Cesium3DTileset.fromIonAssetId / fromUrl + scene.primitives.add
 *     - 异步工厂返回 tileset，加入 primitives 后才会渲染
 *     - boundingSphere.center 是世界坐标，转 Cartographic 改高度嵌入地形
 *   单模型：Model.fromGltfAsync + scene.primitives.add
 *     - modelMatrix 用 Transforms.eastNorthUpToFixedFrame 构造
 *     - 站姿朝向默认指北，heading/pitch/roll 通过 HeadingPitchRoll 调整
 *
 * 常用 ion 资产 id（公共免费，需配 VITE_CESIUM_ION_TOKEN）：
 *   96188  Cesium OSM Buildings（全球建筑白模）
 *   2275207 Cesium World Terrain（全球地形，CesiumMap 已用）
 *   12552  Cesium Air 飞机 glTF 模型（演示单模型常用）
 * ==================================================================== */

import * as Cesium from 'cesium'
import { getGcj02EcefDelta } from './coordTransform.js'

/* 内部缓存：记录已加载的资产，便于按 id 移除 */
const tilesetRegistry = new Map() // key: tag -> Cesium3DTileset
const modelRegistry = new Map()   // key: tag -> Model

/* ------------------------------------------------------------------
 * 3D Tiles：加载城市建筑等大规模切片数据
 * ------------------------------------------------------------------
 * @param {Cesium.Viewer} viewer 地图实例
 * @param {Object} options
 *   - tag: 标识键（自定义，用于按 id 移除；默认用 assetId 或 url）
 *   - assetId: ion 资产 id（默认 96188 = Cesium OSM Buildings 全球建筑白模）
 *   - url: 本地 tileset.json 或远程 URL（设置后忽略 assetId）
 *   - heightOffset: 模型整体高度偏移（米）。正数上抬、负数下沉。
 *       城市建筑常需下沉到地形表面或贴地，默认 0。
 *   - applyGcj02: 是否应用 GCJ-02 偏移（默认 false）。
 *       WGS-84 数据（如 OSM Buildings）跟 GCJ-02 底图（如高德）有偏差，
 *       启用后整体平移让参考点附近的建筑跟底图对齐。
 *   - referenceLongitude / referenceLatitude: GCJ-02 偏移参考点（WGS-84）。
 *       建议用相机中心或主要观察区域的坐标，参考点附近对齐最准。
 *   - show: 是否显示（默认 true）
 *   - maximumScreenSpaceError: 细节层级（默认 16，越大越粗略越省性能）
 *
 *   ---- 性能优化参数（按需启用）----
 *   - cacheBytes: 瓦片缓存上限（字节，默认 536870912 = 512MB）。超出自动卸载远瓦片
 *   - dynamicScreenSpaceError: 远距离自动放松精度（默认 false）。开启后远处瓦片加载更少
 *   - dynamicScreenSpaceErrorDensity: 远距离放松的密度（默认 0.0024 * 1024）
 *   - preloadWhenHidden: 不可见时也预加载（默认 false）。配合场景切换用
 *   - preloadSiblings: 预加载兄弟瓦片（默认 false）。开启后平移相机更流畅但流量增加
 *   - cullRequestsWhileMoving: 相机移动时跳过请求（默认 true）。避免拖拽时疯狂下载
 *   - skipLevelOfDetail: 跳过中间 LOD（默认 false）。开启后直接跳到目标 LOD，少下载
 *   - foveatedScreenSpaceError: 视野中心精度高、边缘低（默认 true）。省性能
 *   - foveatedConeSize: 视野中心高精度范围（默认 0.1 = 10% 区域）
 *   - progressiveResolutionHeightFraction: 渐进式分辨率高度比例（默认 0.3）
 * @returns {Promise<Cesium3DTileset|null>} 加载失败返回 null
 * ------------------------------------------------------------------ */
export async function load3DTileset(viewer, options = {}) {
  if (!viewer) {
    console.warn('[cesiumModels] viewer 为空，无法加载 3D Tiles')
    return null
  }

  const {
    tag,
    assetId = 96188,
    url,
    heightOffset = 0,
    applyGcj02 = false,
    referenceLongitude,
    referenceLatitude,
    show = true,
    maximumScreenSpaceError = 16,
    cacheBytes = 536870912,                          // 512MB
    dynamicScreenSpaceError = true,                  // 远距离自动放松精度
    dynamicScreenSpaceErrorDensity = 0.0024 * 1024,
    preloadWhenHidden = false,
    preloadSiblings = false,
    cullRequestsWhileMoving = true,
    skipLevelOfDetail = false,
    foveatedScreenSpaceError = true,
    foveatedConeSize = 0.3,
    progressiveResolutionHeightFraction = 0.3,
  } = options

  const key = tag || (url ? `url:${url}` : `ion:${assetId}`)

  // 已加载过同 tag 的，先移除再加载，避免重复堆叠
  if (tilesetRegistry.has(key)) {
    remove3DTileset(viewer, tilesetRegistry.get(key))
  }

  try {
    const tileset = url
      ? await Cesium.Cesium3DTileset.fromUrl(url)
      : await Cesium.Cesium3DTileset.fromIonAssetId(assetId)

    tileset.show = show

    /* ---- 性能优化参数应用 ----
     * 这些参数控制 Cesium 加载 3D Tiles 的策略：
     * 1. 屏幕误差（决定加载多细）
     * 2. 缓存预算（决定留多少内存）
     * 3. 视野中心高精度 / 边缘低精度
     * 4. 相机移动时跳过请求
     * 5. 远距离自动放松精度（动态屏幕误差）
     * 6. 跳过中间 LOD 层级
     * 全部安全赋值：Cesium 各版本字段可能不存在，typeof 守卫防报错 */
    const assign = (target, key, val) => {
      // eslint-disable-next-line no-prototype-builtins
      if (typeof target[key] !== 'undefined' && val !== undefined) {
        target[key] = val
      }
    }
    assign(tileset, 'maximumScreenSpaceError', maximumScreenSpaceError)
    assign(tileset, 'cacheBytes', cacheBytes)
    assign(tileset, 'dynamicScreenSpaceError', dynamicScreenSpaceError)
    assign(tileset, 'dynamicScreenSpaceErrorDensity', dynamicScreenSpaceErrorDensity)
    assign(tileset, 'preloadWhenHidden', preloadWhenHidden)
    assign(tileset, 'preloadSiblings', preloadSiblings)
    assign(tileset, 'cullRequestsWhileMoving', cullRequestsWhileMoving)
    assign(tileset, 'skipLevelOfDetail', skipLevelOfDetail)
    assign(tileset, 'foveatedScreenSpaceError', foveatedScreenSpaceError)
    assign(tileset, 'foveatedConeSize', foveatedConeSize)
    assign(tileset, 'progressiveResolutionHeightFraction', progressiveResolutionHeightFraction)

    /* 调试日志：打印 tileset 的关键状态，便于排查
     * "normalized result is not a number" 错误来源。
     * 重点看 boundingSphere.center 是否是 (0,0,0)（说明 tileset 未 ready） */
    const bs = tileset.boundingSphere
    console.log('[cesiumModels] tileset 状态:', {
      assetId: assetId || url,
      ready: !!bs,
      boundingSphereCenter: bs ? `[${bs.center.x}, ${bs.center.y}, ${bs.center.z}]` : 'null',
      boundingSphereRadius: bs ? bs.radius : 'null',
    })

    /* 监听 tileFailed：tile 加载失败时触发 */
    let failedCount = 0
    const tileFailedListener = tileset.tileFailed.addEventListener((err) => {
      failedCount += 1
      console.warn(`[cesiumModels] tile 加载失败 (${failedCount}):`,
        err?.url || err?.message || err)
      if (failedCount >= 3) {
        console.error(
          '[cesiumModels] 3D Tiles 多次加载失败，自动移除 tileset。'
        )
        remove3DTileset(viewer, tileset)
      }
    })
    tileset._tileFailedListener = tileFailedListener

    /* 监听 scene.renderError：render 抛错时触发（含 normalize NaN 错误）。
     * 触发后渲染已停止，无法恢复，但可以打印错误 + 自动移除最近 add 的
     * tileset 便于下次重试。 */
    const renderErrorListener = (scene, error) => {
      console.error('[cesiumModels] Scene render 抛错，自动移除 tileset:', error)
      remove3DTileset(viewer, tileset)
      scene.renderError.removeEventListener(renderErrorListener)
    }
    viewer.scene.renderError.addEventListener(renderErrorListener)
    tileset._renderErrorListener = renderErrorListener

    viewer.scene.primitives.add(tileset)
    tilesetRegistry.set(key, tileset)

    // 高度偏移
    if (heightOffset !== 0 && tileset.boundingSphere) {
      const cartographic = Cesium.Cartographic.fromCartesian(
        tileset.boundingSphere.center
      )
      const surface = Cesium.Cartesian3.fromRadians(
        cartographic.longitude,
        cartographic.latitude,
        0
      )
      const offsetPosition = Cesium.Cartesian3.fromRadians(
        cartographic.longitude,
        cartographic.latitude,
        heightOffset
      )
      const translation = Cesium.Cartesian3.subtract(
        offsetPosition,
        surface,
        new Cesium.Cartesian3()
      )
      tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation)
    }

    /* GCJ-02 偏移：让 WGS-84 数据（OSM Buildings）跟 GCJ-02 底图（高德）对齐。
     * 用参考点经纬度算 ECEF delta，平移整个 tileset 的 modelMatrix。
     * - 参考点附近（几十公里内）对齐最准
     * - 远离参考点的区域有少量二次偏差（GCJ-02 是非线性偏移）
     * - 不在国内（outOfChina）时 coordTransform 会返回零向量，无副作用 */
    if (applyGcj02 && referenceLongitude !== undefined && referenceLatitude !== undefined) {
      const delta = getGcj02EcefDelta(Cesium, referenceLongitude, referenceLatitude)
      console.log('[cesiumModels] GCJ-02 偏移量（ECEF）:',
        `[${delta.x}, ${delta.y}, ${delta.z}]`)
      // 注意：用 multiply 累积变换，兼容前面 heightOffset 已设的 modelMatrix
      const offsetMatrix = Cesium.Matrix4.fromTranslation(delta)
      tileset.modelMatrix = Cesium.Matrix4.multiply(
        tileset.modelMatrix,
        offsetMatrix,
        new Cesium.Matrix4()
      )
    }

    return tileset
  } catch (err) {
    console.error('[cesiumModels] 加载 3D Tiles 失败:', err)
    return null
  }
}

/* ------------------------------------------------------------------
 * 移除 3D Tiles
 * ------------------------------------------------------------------ */
export function remove3DTileset(viewer, tilesetOrTag) {
  if (!viewer) return
  if (!tilesetOrTag) return

  let tileset = null
  let key = null
  if (typeof tilesetOrTag === 'string') {
    tileset = tilesetRegistry.get(tilesetOrTag)
    key = tilesetOrTag
  } else {
    tileset = tilesetOrTag
    // 反查 tag
    for (const [k, v] of tilesetRegistry) {
      if (v === tileset) { key = k; break }
    }
  }
  if (!tileset) return
  try {
    if (tileset._tileFailedListener) {
      tileset._tileFailedListener()
      tileset._tileFailedListener = null
    }
    if (tileset._renderErrorListener) {
      viewer.scene.renderError.removeEventListener(tileset._renderErrorListener)
      tileset._renderErrorListener = null
    }
    viewer.scene.primitives.remove(tileset)
  } catch (e) {
    console.warn('[cesiumModels] 移除 3D Tiles 出错:', e)
  }
  if (key) tilesetRegistry.delete(key)
}

/* ------------------------------------------------------------------
 * 加载单个 glTF/glb 模型（用 Entity + ModelGraphics 形式）
 * ------------------------------------------------------------------
 * 实现选择：走 entities.add({ model: { uri } }) 而非
 *   scene.primitives.add(Model.fromGltfAsync)。
 *
 * 原因：Cesium 1.117+ 引入新版 ModelScene-based Model API 后，
 *   直接 primitives.add(Model) 在某些 glb（如 Cesium_Air.glb 这类
 *   早期 glTF 1.0 示例）上会触发内部 'AssociativeArray.remove' 报
 *   "key is required to be a string or number"，渲染循环挂掉。
 *   Entity + ModelGraphics 走另一套渲染代码路径，对老 glb 兼容性
 *   更好，且支持 heading/pitch/roll 朝向。
 *
 * 姿态：用 Transforms.headingPitchRollQuaternion 直接构造四元数，
 *   避开 ModelMatrix 计算路径。Entity.position + orientation 组合
 *   即定位+朝向。
 *
 * @param {Cesium.Viewer} viewer
 * @param {Object} options
 *   - tag: 标识键（用于按 id 移除；默认 url 或 assetId）
 *   - url: .glb/.gltf URL（本地放 public/ 下，或远程）
 *   - assetId: ion 资产 id（设置后忽略 url）
 *   - longitude, latitude: 经纬度（必填）
 *   - height: 高度（米，默认 0）
 *   - scale: 缩放（默认 1）
 *   - heading: 朝向（度，0 正北，默认 0）
 *   - pitch: 俯仰角（度，默认 0）
 *   - roll: 翻滚角（度，默认 0）
 *   - minimumPixelSize: 像素最小尺寸（保证远距离仍可见，默认 64）
 * @returns {Promise<Entity|null>}
 * ------------------------------------------------------------------ */
export async function loadModel(viewer, options = {}) {
  if (!viewer) {
    console.warn('[cesiumModels] viewer 为空，无法加载模型')
    return null
  }

  const {
    tag,
    url,
    assetId,
    longitude,
    latitude,
    height = 0,
    scale = 1,
    heading = 0,
    pitch = 0,
    roll = 0,
  } = options

  if (longitude === undefined || latitude === undefined) {
    console.warn('[cesiumModels] 缺少 longitude/latitude，无法定位模型')
    return null
  }

  const key = tag || (url ? `url:${url}` : `ion:${assetId}`)
  if (modelRegistry.has(key)) {
    removeModel(viewer, modelRegistry.get(key))
  }

  try {
    // 模型资源 URL：优先本地 url，否则走 ion 资产
    const modelUrl = url
      ? url
      : Cesium.IonResource.fromAssetId(assetId, { type: 'model' })

    // Entity 形式：position + orientation（四元数）即可定位+朝向
    const position = Cesium.Cartesian3.fromDegrees(longitude, latitude, height)
    const hpr = new Cesium.HeadingPitchRoll(
      Cesium.Math.toRadians(heading),
      Cesium.Math.toRadians(pitch),
      Cesium.Math.toRadians(roll)
    )
    const orientation = Cesium.Transforms.headingPitchRollQuaternion(
      position,
      hpr
    )

    /* Entity model 配置：
     *   - 不设 minimumPixelSize：该属性会让 Cesium 根据像素反算世界尺寸，
     *     老版 glb（如 Cesium_Air.glb）某些数据可能算出 NaN，触发
     *     Cartesian3.normalize 抛 "normalized result is not a number"，
     *     渲染循环挂掉。只用 scale 即可。
     *   - 加 viewFrom：给 Cesium 明确的"选中时相机视角"，避免它自动算
     *     boundingSphere 时的零向量问题。100 米外斜上方俯视。 */
    const entity = viewer.entities.add({
      name: key,
      position,
      orientation,
      viewFrom: new Cesium.Cartesian3(-100, -100, 100),
      model: {
        uri: modelUrl,
        scale,
      },
    })

    modelRegistry.set(key, entity)
    return entity
  } catch (err) {
    console.error('[cesiumModels] 加载 glTF 模型失败:', err)
    return null
  }
}

/* ------------------------------------------------------------------
 * 移除单个 glTF 模型（Entity 形式）
 * ------------------------------------------------------------------ */
export function removeModel(viewer, modelOrTag) {
  if (!viewer) return
  if (!modelOrTag) return

  let entity = null
  let key = null
  if (typeof modelOrTag === 'string') {
    entity = modelRegistry.get(modelOrTag)
    key = modelOrTag
  } else {
    entity = modelOrTag
    for (const [k, v] of modelRegistry) {
      if (v === entity) { key = k; break }
    }
  }
  if (!entity) return
  try {
    viewer.entities.remove(entity)
  } catch (e) {
    console.warn('[cesiumModels] 移除模型出错:', e)
  }
  if (key) modelRegistry.delete(key)
}

/* ------------------------------------------------------------------
 * 把相机定位到 tileset 或 model
 * ------------------------------------------------------------------
 * 关键避坑：Cesium 的 viewer.zoomTo(obj) 内部会走 viewBoundingSphere
 * → Camera.lookAt → Cartesian3.normalize，对以下两类对象会触发
 * "normalized result is not a number" 让渲染循环挂掉：
 *
 *   1. Entity + ModelGraphics：刚 add 时内部 Model primitive 还在异步
 *      加载，boundingSphere 是 {center:(0,0,0), radius:0}。
 *   2. OSM Buildings (96188) 这类全球 3D Tiles：root boundingSphere
 *      涵盖整个地球，center 在地心附近（约 [0,0,0]），半径 1100 万米
 *      （地球量级）。zoomTo 用这个超大球算相机方向时，normalize 某个
 *      中间向量会算出零向量，NaN，渲染挂掉。
 *
 * 处理：两类对象都改用 camera.flyTo 直接定位到目标经纬度上空，
 *   绕开 viewBoundingSphere 整条路径。
 *   - Entity：从 obj.position 拿经纬度
 *   - 3D Tiles：从 obj.boundingSphere.center 转 Cartographic 拿经纬度
 *     （但 OSM Buildings 的 center 是地心，转出来是 (0,0)，所以这种
 *     情况下 fallback 到 options.fallbackLongitude/Latitude 指定的坐标）
 *
 * 相机视角参数（度，Cesium 内部转弧度）：
 *   - height: 相机高度（米，默认 1500）
 *   - heading: 朝向（0=正北，正数顺时针，默认 0）
 *   - pitch: 俯仰角（0=平视，-90=正下俯视，-70=陡俯视，默认 -70）
 *   - duration: 飞行时长（秒，默认 1.5）
 *   不传 heading/pitch 时，Cesium 用默认视角（朝下俯视）。
 */
export async function flyToObject(viewer, obj, options = {}) {
  if (!viewer || !obj) return
  const flyHeight = options.height ?? 1500
  const duration = options.duration ?? 1.5

  try {
    let longitude
    let latitude

    // Entity 形式：直接从 position 拿经纬度
    if (obj.position) {
      const cartesian = obj.position.getValue(viewer.clock.currentTime)
      if (cartesian) {
        const carto = Cesium.Cartographic.fromCartesian(cartesian)
        longitude = Cesium.Math.toDegrees(carto.longitude)
        latitude = Cesium.Math.toDegrees(carto.latitude)
      }
    } else if (obj.boundingSphere) {
      // 3D Tiles / Model primitive 形式
      const center = obj.boundingSphere.center
      // 检测 center 是否在地心附近（≈0）：判断 |center| 是否远小于地球半径
      const mag = Math.sqrt(center.x * center.x + center.y * center.y + center.z * center.z)
      const EARTH_RADIUS = 6378137
      if (mag < EARTH_RADIUS * 0.1) {
        // center 在地心附近（全球数据集如 OSM Buildings），
        // 转 Cartographic 会得到 (0,0) 没意义，用 fallback
        if (options.fallbackLongitude !== undefined && options.fallbackLatitude !== undefined) {
          longitude = options.fallbackLongitude
          latitude = options.fallbackLatitude
        }
      } else {
        const carto = Cesium.Cartographic.fromCartesian(center)
        longitude = Cesium.Math.toDegrees(carto.longitude)
        latitude = Cesium.Math.toDegrees(carto.latitude)
      }
    }

    if (longitude !== undefined && latitude !== undefined) {
      // 构造 orientation：传了 heading 或 pitch 才设置，否则让 Cesium 用默认
      const flyToOptions = {
        destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, flyHeight),
        duration,
      }
      if (options.heading !== undefined || options.pitch !== undefined) {
        flyToOptions.orientation = {
          heading: Cesium.Math.toRadians(options.heading ?? 0),
          pitch: Cesium.Math.toRadians(options.pitch ?? -70),
          roll: 0,
        }
      }
      await viewer.camera.flyTo(flyToOptions)
    } else {
      // 兜底：仍走 zoomTo（适用于 boundingSphere 合理的小范围 3D Tiles）
      await viewer.zoomTo(obj, options)
    }
  } catch (e) {
    console.warn('[cesiumModels] 定位失败:', e)
  }
}

/* ------------------------------------------------------------------
 * 清理所有已加载的 3D Tiles 和模型（页面卸载时调用）
 *   - 3D Tiles：scene.primitives.remove
 *   - 单模型：entities.remove（Entity 形式）
 * ------------------------------------------------------------------ */
export function clearAllModels(viewer) {
  if (!viewer) return
  tilesetRegistry.forEach((tileset) => {
    try { viewer.scene.primitives.remove(tileset) } catch (e) {}
  })
  modelRegistry.forEach((entity) => {
    try { viewer.entities.remove(entity) } catch (e) {}
  })
  tilesetRegistry.clear()
  modelRegistry.clear()
}
