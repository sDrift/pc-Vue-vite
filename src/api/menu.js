/* ----------------------------------------------------------------
 * 菜单/路由接口（mock）
 * ----------------------------------------------------------------
 * 模拟后端返回的动态路由数据。前端拿到后由 router/dynamic.js 把
 * component 字符串路径解析为真正的懒加载函数，再用
 * router.addRoute('Layout', route) 注入到 Layout 的 children 里。
 *
 * 数据结构与 vue-router 的路由配置基本一致，区别只有一点：
 *   component 用字符串路径（相对 src/），不用 import()
 *   例如：'views/charts/ChartDemo.vue'
 *
 * 这样后端只需关心「路径 + meta」，无需知道前端打包细节；
 * 前端用 import.meta.glob 预扫所有视图，按字符串取对应 loader。
 *
 * 这里把「图表相关 / 测试功能 / 地图相关 / AI相关」作为动态路由，
 * 其余基础路由（Dashboard / Users / Products / Settings 等）
 * 仍写死在 router/index.js 里，便于对比。
 */

/* 模拟网络延迟，让动态加载过程更接近真实接口 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const DYNAMIC_ROUTES = [
  {
    path: 'charts',
    name: 'Charts',
    meta: {
      title: '图表演示',
      icon: 'el-icon-pie-chart',
    },
    children: [
      {
        path: 'chart-demo',
        name: 'ChartDemo',
        component: 'views/charts/ChartDemo.vue',
        meta: { title: '3D饼图演示' },
      },
      {
        path: 'enhanced-chart-demo',
        name: 'EnhancedChartDemo',
        component: 'views/charts/EnhancedChartDemo.vue',
        meta: { title: '增强版3D饼图' },
      },
      {
        path: 'three-d-pie-chart',
        name: 'ThreeDPieChart',
        component: 'views/charts/ThreeDPieChartView.vue',
        meta: { title: '自定义3D饼图' },
      },
      {
        path: 'three-d-demo',
        name: 'ThreeDDemo',
        component: 'views/charts/ThreeDDemo.vue',
        meta: { title: '3D可视化演示' },
      },
      {
        path: 'three-js-demo',
        name: 'ThreeJsDemo',
        component: 'views/charts/ThreeJsDemo.vue',
        meta: { title: 'Three.js 3D演示' },
      },
      {
        path: 'particles-demo',
        name: 'ParticlesDemo',
        component: 'views/charts/ParticlesDemo.vue',
        meta: { title: 'Three.js 粒子系统' },
      },
      {
        path: 'character-demo',
        name: 'CharacterDemo',
        component: 'views/charts/CharacterDemo.vue',
        meta: { title: '3D 人物模型' },
      },
    ],
  },
  {
    path: 'tests',
    name: 'Tests',
    meta: {
      title: '测试功能',
      icon: 'el-icon-document-copy',
    },
    children: [
      {
        path: 'underline-animation',
        name: 'UnderlineAnimation',
        component: 'components/UnderlineAnimation.vue',
        meta: { title: '下划线动画演示' },
      },
      {
        path: 'underline-animation-test',
        name: 'UnderlineAnimationTest',
        component: 'views/test/UnderlineAnimationTest.vue',
        meta: { title: '下划线动画测试' },
      },
      {
        path: 'blank-test',
        name: 'BlankTest',
        component: 'views/test/BlankTest.vue',
        meta: { title: '空白测试页面' },
      },
      {
        path: 'calendar-test',
        name: 'CalendarTest',
        component: 'views/test/CalendarTest.vue',
        meta: { title: '日历测试页面' },
      },
      {
        path: 'async-loader-test',
        name: 'AsyncLoaderTest',
        component: 'views/test/AsyncLoaderTest.vue',
        meta: { title: '异步组件按需加载测试' },
      },
      {
        path: 'dynamic-form-test',
        name: 'DynamicFormTest',
        component: 'views/test/DynamicFormTest.vue',
        meta: { title: '动态表单生成器' },
      },
    ],
  },
  {
    path: 'maps',
    name: 'Maps',
    meta: {
      title: '地图功能',
      icon: 'el-icon-map-location',
    },
    children: [
      {
        path: 'map-demo',
        name: 'MapDemo',
        component: 'views/maps/MapDemo.vue',
        meta: { title: '地图演示' },
      },
      {
        path: 'china-map',
        name: 'ChinaMap',
        component: 'views/maps/ChinaMapView.vue',
        meta: { title: '中国地图' },
      },
      {
        path: 'new-china-map',
        name: 'NewChinaMap',
        component: 'views/maps/NewChianMapView.vue',
        meta: { title: '新版中国地图' },
      },
      {
        path: 'network-flow-map',
        name: 'NetworkFlowMap',
        component: 'views/maps/NetworkFlowMapView.vue',
        meta: { title: '网络流量地图' },
      },
      {
        path: 'olmap-demo',
        name: 'OLMapDemo',
        component: 'views/maps/OLMapDemo.vue',
        meta: { title: 'OLMap方法演示' },
      },
      {
        path: 'cesium-demo',
        name: 'CesiumMapDemo',
        component: 'views/maps/CesiumMapDemo.vue',
        meta: { title: 'Cesium地图演示' },
      },
    ],
  },
  {
    path: 'ai-demo',
    name: 'AIDemo',
    component: 'views/ai/AIDemo.vue',
    meta: {
      title: 'AI演示',
      icon: 'el-icon-cpu',
    },
  },
]

/*
 * 获取动态路由列表。
 * 真实项目里这里会改成 request.get('/api/menu') 之类的接口调用，
 * 返回结构保持一致即可，前端动态注入逻辑无需改动。
 */
export async function getDynamicRoutes() {
  await delay(300)
  return DYNAMIC_ROUTES
}

export default {
  getDynamicRoutes,
}
