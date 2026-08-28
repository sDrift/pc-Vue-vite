/**
 * cdn.js — CDN 模块配置
 *
 * 用法：
 *   import { buildCdnModules } from './build/cdn.js'
 *   const cdnModules = buildCdnModules('jsdelivr')
 *
 * 设计说明：
 *   - dev 模式不启用（vite-plugin-cdn-import 默认仅 prod 生效）
 *   - 生产构建时把这些包替换成 CDN 全局变量，减小打包体积 + 提升首屏速度
 *   - 通过 .env.production 配置 VITE_CDN_PROVIDER 切换 CDN 源
 *
 * 不走 CDN 的包：
 *   1. element-plus —— 与按需引入冲突，CDN 会全量注入
 *   2. three        —— r150+ 移除了 build/three.min.js (IIFE)，只剩 ESM，
 *                       无法用 <script> 全局变量方式加载
 *   3. ol           —— 项目里大量用深度路径 import { Map } from 'ol/Map'，
 *                       CDN 全局变量只能替换顶层 import 'ol'，对深度路径无效
 */

/* ======================================================================
 * CDN 源提供商
 *   jsdelivr  默认，国内外都快
 *   unpkg     国外快
 *   bootcdn   国内最快
 *   off       完全不走 CDN（备用）
 * ====================================================================== */
export const CDN_PROVIDERS = {
  jsdelivr: (pkg, version, file) => `https://cdn.jsdelivr.net/npm/${pkg}@${version}/${file}`,
  unpkg: (pkg, version, file) => `https://unpkg.com/${pkg}@${version}/${file}`,
  bootcdn: (pkg, version, file) => `https://cdn.bootcdn.net/ajax/libs/${pkg}/${version}/${file}`,
  off: () => '',
}

/* ======================================================================
 * CDN 模块清单（顺序重要：echarts 必须在 echarts-gl 之前加载）
 * ====================================================================== */
const CDN_MODULE_LIST = [
  // 1. Vue 全家桶（IIFE 全局变量；项目里都是顶层 import 'vue'，CDN 能完整替换）
  { name: 'vue',        var: 'Vue',       version: '3.5.22', file: 'dist/vue.global.prod.js' },
  { name: 'vue-router', var: 'VueRouter', version: '4.5.1',  file: 'dist/vue-router.global.prod.js' },
  { name: 'pinia',      var: 'Pinia',     version: '3.0.3',  file: 'dist/pinia.iife.prod.js' },

  // 2. ECharts（先加载主包，再加载扩展，后者向前者挂载扩展）
  { name: 'echarts',    var: 'echarts',    version: '5.4.3', file: 'dist/echarts.min.js' },
  { name: 'echarts-gl', var: 'echarts-gl', version: '2.0.9', file: 'dist/echarts-gl.min.js' },
]

/* ======================================================================
 * 根据指定的 CDN 源生成模块配置（vite-plugin-cdn-import 期望的格式）
 * ====================================================================== */
export const buildCdnModules = (provider) => {
  if (provider === 'off') return []

  const P = CDN_PROVIDERS[provider] || CDN_PROVIDERS.jsdelivr

  return CDN_MODULE_LIST.map((m) => ({
    name: m.name,
    var: m.var,
    path: P(m.name, m.version, m.file),
    css: m.css ? P(m.name, m.version, m.css) : undefined,
  }))
}
