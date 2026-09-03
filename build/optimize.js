/**
 * optimize.js — dev 预构建 + 慢启动预热配置
 *
 * 用法：
 *   import { optimizeDepsInclude, warmupClientFiles } from './build/optimize.js'
 *   optimizeDeps: { include: optimizeDepsInclude }
 *   server: { warmup: { clientFiles: warmupClientFiles } }
 *
 * 1. optimizeDeps.include：
 *      dev 首次启动时把下面这些大依赖预先用 esbuild 转换好，
 *      二次启动直接复用 .vite/deps 缓存 → 秒开
 *
 * 2. server.warmup.clientFiles：
 *      让 Vite 在启动同时把这些入口文件编译一遍，
 *      访问页面时不用再等首次编译，解决"第一页打开很慢"的问题
 */

/* dev 预构建依赖列表 */
export const optimizeDepsInclude = [
  'vue',
  'vue-router',
  'pinia',
  'element-plus',
  '@element-plus/icons-vue',
  'echarts',
  'echarts-gl',
  'three',
  'ol',
]

/* 慢启动预热文件（关键入口） */
export const warmupClientFiles = [
  './src/main.js',
  './src/App.vue',
  './src/router/index.js',
  './src/store/index.js', // 如果有，没有也不报错（warmup 容错）
]
