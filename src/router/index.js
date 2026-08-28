import { createRouter, createWebHistory } from 'vue-router';
import { getDynamicRoutes } from '../api/menu.js';
import { buildRoutes } from './dynamic.js';

/* ------------------------------------------------------------------
 * 静态路由
 * ------------------------------------------------------------------
 * 只放「任何用户进来都一定有」的基础路由：
 *   - Layout 外壳（含 Dashboard / Users / Products / Settings /
 *     Scence / WaterloggingTable 等基础菜单）
 *   - 登录页、404 兜底
 *
 * 「图表相关 / 测试功能 / 地图相关 / AI相关」改为接口下发，
 *   见 src/api/menu.js，由 loadDynamicRoutes() 注入。
 */
const routes = [
  {
    path: '/',
    name: 'Layout',
    redirect: '/dashboard',
    component: () => import('../layout/Layout.vue'),
    children: [
      // 基础功能
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/dashboard/Dashboard.vue'),
        meta: {
          title: '仪表盘',
          icon: 'el-icon-data-line'
        }
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('../views/users/Users.vue'),
        meta: {
          title: '用户管理',
          icon: 'el-icon-user'
        }
      },
      {
        path: 'products',
        name: 'Products',
        component: () => import('../views/products/Products.vue'),
        meta: {
          title: '产品管理',
          icon: 'el-icon-goods'
        }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('../views/settings/Settings.vue'),
        meta: {
          title: '系统设置',
          icon: 'el-icon-setting'
        }
      },

      // 城市内涝治理
      // {
      //   path: 'scence',
      //   name: 'Scence',
      //   component: () => import('../views/scence/index.vue'),
      //   meta: {
      //     title: '城市内涝治理',
      //     icon: 'el-icon-cloud-rain'
      //   }
      // },
      // 内涝预警表格
      // {
      //   path: 'waterlogging-table',
      //   name: 'WaterloggingTable',
      //   component: () => import('../views/scence/WaterloggingTable.vue'),
      //   meta: {
      //     title: '内涝预警表格',
      //     icon: 'el-icon-data-table'
      //   }
      // }
    ]
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/auth/Login.vue'),
    meta: {
      title: '登录'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/auth/NotFound.vue'),
    meta: {
      title: '页面不存在'
    }
  }
];

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes
});

/* 动态路由是否已加载（幂等控制，避免重复注入） */
let dynamicRoutesLoaded = false

/* 最近一次注入的动态路由（解析后的 vue-router 格式），供 Layout 渲染菜单 */
let lastInjectedRoutes = []

/* 已注入的顶层路由 name，登出时按 name 移除，避免下次登录重复注入 */
let addedRouteNames = []

/*
 * 拉取接口并注入动态路由。
 *
 * 流程：
 *   1. 调 getDynamicRoutes() 拿到「字符串 component」的路由数据
 *   2. 用 buildRoutes() 把字符串路径解析成懒加载函数
 *   3. 逐条 router.addRoute('Layout', route) 注入到 Layout 的 children
 *   4. 记录顶层 name 用于后续移除
 *   5. 标记已加载，返回注入后的路由供菜单使用
 *
 * 幂等：已加载过则直接返回上次结果。注意 flag 在入口就置 true，
 *   即使加载失败也不再重试，防止 beforeEach 里 next({...to}) 引发无限重导。
 *   失败后本会话不再有动态路由；刷新页面模块重载，flag 复位会重新尝试。
 */
export async function loadDynamicRoutes() {
  if (dynamicRoutesLoaded) return lastInjectedRoutes
  dynamicRoutesLoaded = true // 入口置位，防重试死循环

  try {
    const rawRoutes = await getDynamicRoutes()
    const resolved = buildRoutes(rawRoutes)

    resolved.forEach((route) => {
      router.addRoute('Layout', route)
      if (route.name) addedRouteNames.push(route.name)
    })

    lastInjectedRoutes = resolved
    return resolved
  } catch (err) {
    console.error('[动态路由] 加载失败:', err)
    return []
  }
}

/*
 * 重置动态路由（登出时调用）。
 * 按 name 从路由表移除已注入项，并复位标记，下次登录会重新拉接口注入。
 */
export function resetDynamicRoutes() {
  addedRouteNames.forEach((name) => router.removeRoute(name))
  addedRouteNames = []
  dynamicRoutesLoaded = false
  lastInjectedRoutes = []
}

/*
 * 路由守卫
 *
 * 关键：动态路由必须在「路由匹配前」注册，否则刷新到动态路由地址时，
 * 路由表里还没有该条目，会直接命中 404，根本进不到 Layout.onMounted。
 *
 * 因此把 loadDynamicRoutes() 放在 beforeEach 里：首次（含刷新）进入时
 * 先 await 加载，再用「按 path 重新导航」触发一次匹配，让刚注册的
 * 动态路由参与解析。用 path 而不是 ...to 是为了避免 to 已被解析成
 * NotFound（带 name: 'NotFound'）时按 name 重导仍然落到 404。
 */
router.beforeEach(async (to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title || '后台管理系统';

  // 检查是否需要登录
  const isLogin = localStorage.getItem('isLogin') === 'true';
  if (!isLogin && to.path !== '/login') {
    return next('/login');
  }
  // 已登录还去登录页，直接送回首页
  if (isLogin && to.path === '/login') {
    return next('/dashboard');
  }
  // 登录页本身放行
  if (to.path === '/login') {
    return next();
  }

  // 已登录且动态路由未加载：先加载，再按原 path 重新导航触发匹配
  if (!dynamicRoutesLoaded) {
    await loadDynamicRoutes();
    return next({ path: to.path, query: to.query, hash: to.hash, replace: true });
  }

  next();
});

export default router;