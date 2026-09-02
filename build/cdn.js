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
 *   1. vue / vue-router / pinia —— 【关键】vue 走 CDN external 成 window.Vue 后，
 *       unplugin-vue-components 的 __unplugin_components_ 组件注册表会丢失
 *       （该注册表编译时注入到打包的 vue 模块，external 后注入目标不存在），
 *       导致 element-plus 按需组件 resolve 成 undefined，渲染成 [object Object]。
 *       三者必须同步：vue-router/pinia 内部 import 'vue'，vue 不走 CDN 它们也不能走。
 *       vue 全家桶 gzip 仅约 80KB，回 bundle 可接受。
 *   2. element-plus —— 与按需引入冲突，CDN 会全量注入
 *   3. three        —— r150+ 移除了 build/three.min.js (IIFE)，只剩 ESM，
 *                       无法用 <script> 全局变量方式加载
 *   4. ol           —— 项目里大量用深度路径 import { Map } from 'ol/Map'，
 *                       CDN 全局变量只能替换顶层 import 'ol'，对深度路径无效
 *
 * cesium 走 CDN 的特殊说明：
 *   - JS 主体（Build/Cesium/Cesium.js，IIFE，暴露全局 Cesium）走 CDN
 *   - 静态资源（Assets / Workers / ThirdParty / Widgets）仍走本地
 *     public/cesium/，由 main.js 的 window.CESIUM_BASE_URL = '/cesium/' 指定
 *   - widgets.css 也走 CDN link 标签（css 字段），不再用本地 import
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
  // 1. ECharts（先加载主包，再加载扩展，后者向前者挂载扩展）
  { name: 'echarts', var: 'echarts', version: '5.4.3', file: 'dist/echarts.min.js' },
  { name: 'echarts-gl', var: 'echarts-gl', version: '2.0.9', file: 'dist/echarts-gl.min.js' },

  // 2. Cesium（IIFE 全局变量 Cesium；静态资源走本地 public/cesium/）
  //    widgets.css 不走 CDN，由 index.html 同源 link 加载（避免第三方 CDN
  //    触发浏览器跟踪防护的 storage 访问警告）
  {
    name: 'cesium',
    var: 'Cesium',
    version: '1.144.0',
    file: 'Build/Cesium/Cesium.js',
  },
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
