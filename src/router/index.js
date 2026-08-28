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
      {
        path: 'scence',
        name: 'Scence',
        component: () => import('../views/scence/index.vue'),
        meta: {
          title: '城市内涝治理',
          icon: 'el-icon-cloud-rain'
        }
      },
      // 内涝预警表格
      {
        path: 'waterlogging-table',
        name: 'WaterloggingTable',
        component: () => import('../views/scence/WaterloggingTable.vue'),
        meta: {
          title: '内涝预警表格',
          icon: 'el-icon-data-table'
        }
      }
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

/*
 * 拉取接口并注入动态路由。
 *
 * 流程：
 *   1. 调 getDynamicRoutes() 拿到「字符串 component」的路由数据
 *   2. 用 buildRoutes() 把字符串路径解析成懒加载函数
 *   3. 逐条 router.addRoute('Layout', route) 注入到 Layout 的 children
 *   4. 标记已加载，返回注入后的路由供菜单使用
 *
 * 幂等：已加载过则直接返回上次结果，避免重复 addRoute 导致
 * 「NavigationDuplicated」或路由表膨胀。
 */
export async function loadDynamicRoutes() {
  if (dynamicRoutesLoaded) return lastInjectedRoutes

  const rawRoutes = await getDynamicRoutes()
  const resolved = buildRoutes(rawRoutes)

  resolved.forEach((route) => {
    router.addRoute('Layout', route)
  })

  lastInjectedRoutes = resolved
  dynamicRoutesLoaded = true
  return resolved
}

/* 重置动态路由（登出时调用，清掉已注入的菜单并允许下次重新加载） */
export function resetDynamicRoutes() {
  dynamicRoutesLoaded = false
  lastInjectedRoutes = []
}

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title || '后台管理系统';
  
  // 检查是否需要登录
  const isLogin = localStorage.getItem('isLogin') === 'true';
  if (to.path !== '/login' && !isLogin) {
    next('/login');
  } else {
    next();
  }
});

export default router;