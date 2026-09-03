/**
 * chunks.js — Rollup manualChunks 分包策略
 *
 * 用法：
 *   import { manualChunks } from './build/chunks.js'
 *   build: { rollupOptions: { output: { manualChunks } } }
 *
 * 分包目标：
 *   - vendor-vue       Vue 全家桶
 *   - vendor-element   Element Plus + 图标
 *   - vendor-echarts   ECharts + 3D 扩展
 *   - vendor-three      Three.js 全家桶
 *   - vendor-ol         OpenLayers 全家桶
 *   - vendor-common     其它三方依赖
 *
 * 注意：启用 CDN 后，vue/echarts/three/ol 会被 external 出去不进任何 chunk，
 *       只有 element-plus 等还需走本地打包
 */
export const manualChunks = (id) => {
  // 三方依赖统一在 node_modules 下
  if (!id.includes('node_modules')) return

  // 1. Vue 全家桶
  if (/[\\/]node_modules[\\/](vue|vue-router|pinia|@vue)[\\/]/.test(id)) {
    return 'vendor-vue'
  }
  // 2. Element Plus 及其图标
  if (/[\\/]node_modules[\\/](element-plus|@element-plus)[\\/]/.test(id)) {
    return 'vendor-element'
  }
  // 3. ECharts + 3D 扩展
  if (/[\\/]node_modules[\\/](echarts|echarts-gl|zrender)[\\/]/.test(id)) {
    return 'vendor-echarts'
  }
  // 4. Three.js 全家桶
  if (/[\\/]node_modules[\\/](three)[\\/]/.test(id)) {
    return 'vendor-three'
  }
  // 5. OpenLayers 全家桶
  if (/[\\/]node_modules[\\/](ol)[\\/]/.test(id)) {
    return 'vendor-ol'
  }

  // 6. 其它三方依赖
  return 'vendor-common'
}
