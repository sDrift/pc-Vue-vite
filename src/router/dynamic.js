/* ----------------------------------------------------------------
 * 动态路由解析
 * ----------------------------------------------------------------
 * 后端接口返回的 component 是字符串路径（相对 src/），如
 *   'views/charts/ChartDemo.vue'
 * 但 vue-router 的 route.component 需要的是「懒加载函数」：
 *   () => import('../views/charts/ChartDemo.vue')
 *
 * 这里用 Vite 的 import.meta.glob 预先扫到 src 下所有视图组件，
 * 按「相对 src 的路径」建一张映射表，再把字符串路径替换成 loader。
 *
 * 为什么不用 new Function(`return import(...)`) 动态拼字符串？
 *   Vite/Rollup 在构建期靠静态分析决定代码分割，动态拼接的
 *   import() 路径无法被分析，会被打进主 chunk 或直接失败。
 *   import.meta.glob 是 Vite 官方推荐方案，构建期静态可分析。
 */

/* 预扫 src/views 和 src/components 下所有 .vue 文件。
   glob 的 key 是相对当前文件的路径，如 '../views/charts/ChartDemo.vue' */
const moduleMap = import.meta.glob([
  '../views/**/*.vue',
  '../components/**/*.vue',
])

/* 把「相对 src 的路径」转成「相对当前文件的路径」作为 glob key。
   例：'views/charts/ChartDemo.vue' → '../views/charts/ChartDemo.vue' */
function toGlobKey(srcRelativePath) {
  if (!srcRelativePath) return null
  const normalized = srcRelativePath.replace(/^\/+/, '')
  return normalized.startsWith('../') ? normalized : `../${normalized}`
}

/* 根据字符串路径取懒加载函数；找不到时返回 undefined 并告警 */
function resolveComponent(componentPath) {
  if (!componentPath) return undefined
  if (typeof componentPath === 'function') return componentPath

  const key = toGlobKey(componentPath)
  const loader = moduleMap[key]
  if (!loader) {
    console.warn(`[dynamic routes] 找不到组件: ${componentPath}`)
    return undefined
  }
  return loader
}

/* 递归把接口返回的「字符串 component」转成「loader 函数」。
   支持嵌套 children。返回新的路由数组，不污染原始数据。 */
export function buildRoutes(rawRoutes = []) {
  if (!Array.isArray(rawRoutes)) return []

  return rawRoutes.map((raw) => {
    const route = {
      ...raw,
      component: resolveComponent(raw.component),
    }

    if (Array.isArray(raw.children) && raw.children.length) {
      route.children = buildRoutes(raw.children)
    }

    return route
  })
}

export default {
  buildRoutes,
}
