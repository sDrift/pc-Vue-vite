/**
 * coordTransform.js —— WGS-84 ↔ GCJ-02 坐标转换工具
 * ====================================================================
 * 解决中国境内"火星坐标偏移"问题：
 *   - Cesium / OSM 数据 / 国际地图服务用 WGS-84
 *   - 高德 / 腾讯 / Google 中国 用 GCJ-02（火星坐标系）
 *   两者在国内有几十到几百米偏移，对齐需做转换。
 *
 * 算法来源：公开的 GCJ-02 偏移公式（基于克拉索夫斯基椭球），
 *   不依赖外部服务，纯前端计算。
 *
 * 用法：
 *   import { wgs84ToGcj02, getGcj02EcefDelta } from '@/utils/coordTransform.js'
 *   const [lng, lat] = wgs84ToGcj02(106.5781, 29.5486)
 *   const delta = getGcj02EcefDelta(Cesium, 106.5781, 29.5486)
 *   // delta 是 ECEF 平移向量，应用于 3D Tiles 的 modelMatrix
 * ==================================================================== */

const PI = Math.PI
// 克拉索夫斯基椭球参数（GCJ-02 算法用）
const A = 6378245.0
// eslint-disable-next-line no-loss-of-precision -- GCJ-02 偏心率平方常数，需保留完整精度
const EE = 0.00669342162296594323 // 偏心率平方

/**
 * 判断坐标是否在中国境内（境内才需要做 GCJ-02 偏移）
 * @param {number} lng 经度
 * @param {number} lat 纬度
 * @returns {boolean} 不在国内返回 true
 */
function outOfChina(lng, lat) {
  return !(lng > 73.66 && lng < 135.05 && lat > 3.86 && lat < 53.55)
}

function transformLat(x, y) {
  let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x))

  ret += ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0) / 3.0
  ret += ((20.0 * Math.sin(y * PI) + 40.0 * Math.sin((y / 3.0) * PI)) * 2.0) / 3.0
  ret += ((160.0 * Math.sin((y / 12.0) * PI) + 320 * Math.sin((y * PI) / 30.0)) * 2.0) / 3.0

  return ret
}

function transformLng(x, y) {
  let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x))

  ret += ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0) / 3.0
  ret += ((20.0 * Math.sin(x * PI) + 40.0 * Math.sin((x / 3.0) * PI)) * 2.0) / 3.0
  ret += ((150.0 * Math.sin((x / 12.0) * PI) + 300.0 * Math.sin((x / 30.0) * PI)) * 2.0) / 3.0

  return ret
}

/**
 * WGS-84 转 GCJ-02（火星坐标）
 * @param {number} lng WGS-84 经度
 * @param {number} lat WGS-84 纬度
 * @returns {[number, number]} [GCJ-02 经度, GCJ-02 纬度]
 */
export function wgs84ToGcj02(lng, lat) {
  if (outOfChina(lng, lat)) return [lng, lat]
  let dLat = transformLat(lng - 105.0, lat - 35.0)
  let dLng = transformLng(lng - 105.0, lat - 35.0)
  const radLat = (lat / 180.0) * PI
  let magic = Math.sin(radLat)

  magic = 1 - EE * magic * magic
  const sqrtMagic = Math.sqrt(magic)

  dLat = (dLat * 180.0) / (((A * (1 - EE)) / (magic * sqrtMagic)) * PI)
  dLng = (dLng * 180.0) / ((A / sqrtMagic) * Math.cos(radLat) * PI)

  return [lng + dLng, lat + dLat]
}

/**
 * GCJ-02 转 WGS-84（反算：偏移量取负的近似，足够用于显示对齐）
 * 严格反解需要迭代，这里用单次反向偏移，误差 < 1 米。
 * @param {number} lng GCJ-02 经度
 * @param {number} lat GCJ-02 纬度
 * @returns {[number, number]} [WGS-84 经度, WGS-84 纬度]
 */
export function gcj02ToWgs84(lng, lat) {
  if (outOfChina(lng, lat)) return [lng, lat]
  const [gcjLng, gcjLat] = wgs84ToGcj02(lng, lat)

  return [lng * 2 - gcjLng, lat * 2 - gcjLat]
}

/**
 * 计算给定参考点的 GCJ-02 ECEF 平移向量
 * ------------------------------------------------------------------
 * 用于让 WGS-84 坐标系的 3D Tiles（如 OSM Buildings）跟 GCJ-02 底图
 * （如高德）对齐。原理：
 *   - 参考点的 WGS-84 经纬度 → ECEF 坐标 P1
 *   - 参考点的 GCJ-02 经纬度 → ECEF 坐标 P2
 *   - delta = P2 - P1，作为 3D Tiles 的 modelMatrix 平移
 *
 * 这样参考点附近的 tile 会跟底图对齐。其他区域有少量二次偏差
 * （GCJ-02 是非线性偏移），但几十公里内偏差 < 20 米，可接受。
 *
 * @param {object} Cesium Cesium 模块（用于 Cartesian3）
 * @param {number} longitude 参考点 WGS-84 经度
 * @param {number} latitude 参考点 WGS-84 纬度
 * @param {number} height 参考点高度（米，默认 0）
 * @returns {Cesium.Cartesian3} ECEF 平移向量
 */
export function getGcj02EcefDelta(Cesium, longitude, latitude, height = 0) {
  // 不在国内直接返回零向量（无需偏移）
  if (outOfChina(longitude, latitude)) {
    return new Cesium.Cartesian3(0, 0, 0)
  }

  const [gcjLng, gcjLat] = wgs84ToGcj02(longitude, latitude)

  // WGS-84 经纬度 → ECEF
  const wgs84Ecef = Cesium.Cartesian3.fromDegrees(longitude, latitude, height)
  // GCJ-02 经纬度 → ECEF（用 WGS-84 椭球算，因为 Cesium 的 fromDegrees 内部就是 WGS-84）
  const gcj02Ecef = Cesium.Cartesian3.fromDegrees(gcjLng, gcjLat, height)

  // delta = GCJ-02 ECEF - WGS-84 ECEF
  const delta = Cesium.Cartesian3.subtract(gcj02Ecef, wgs84Ecef, new Cesium.Cartesian3())

  return delta
}
