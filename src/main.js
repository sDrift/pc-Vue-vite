import { createApp } from 'vue'
import './style.css'
import 'ol/ol.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import VueEasyPrint from 'vue-easy-print'

import App from './App.vue'
import router from './router/index.js'
import pinia from './store/index.js'

/* Cesium 静态资源基础路径，必须在 Cesium 模块加载之前设置。
   Cesium 内部读取 window.CESIUM_BASE_URL 去加载 Assets / Workers /
   Widgets / ThirdParty 等静态资源。
   这四类资源已预先拷贝到 public/cesium/ 下（见 package.json 的
   cesium:copy 脚本），Vite 在 dev 和 build 阶段都会把 public 目录
   原样输出到根路径，因此通过 /cesium/ 即可访问，无需额外插件，
   也避免 SPA fallback 把资源请求误返回 index.html 的问题。
   main.js 是应用入口，先于路由懒加载的 CesiumMap.vue 执行，时机正确。 */
window.CESIUM_BASE_URL = '/cesium/'

const app = createApp(App)

// Element Plus 组件 / 样式 / 命令式 API（ElMessage 等）已由 vite 插件按需引入：
//   - unplugin-vue-components    → 自动注册模板里的 <el-xxx> 组件
//   - unplugin-auto-import       → 自动 import ElMessage / ElMessageBox 等
//   - ElementPlusResolver        → 自动注入对应组件的 css 样式
// 此处只需全局注册 Element Plus 图标（图标不属于主包，需要单独注册）
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 使用路由、状态管理和打印插件
app.use(router)
app.use(pinia)
app.use(VueEasyPrint)

app.mount('#app')
