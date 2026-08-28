import { createRouter, createWebHistory } from 'vue-router';

// 定义路由
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
      
      // 图表相关
      {
        path: 'charts',
        name: 'Charts',
        meta: {
          title: '图表演示',
          icon: 'el-icon-pie-chart'
        },
        children: [
          {
            path: 'chart-demo',
            name: 'ChartDemo',
            component: () => import('../views/charts/ChartDemo.vue'),
            meta: {
              title: '3D饼图演示'
            }
          },
          {
            path: 'enhanced-chart-demo',
            name: 'EnhancedChartDemo',
            component: () => import('../views/charts/EnhancedChartDemo.vue'),
            meta: {
              title: '增强版3D饼图'
            }
          },
          {
            path: 'three-d-pie-chart',
            name: 'ThreeDPieChart',
            component: () => import('../views/charts/ThreeDPieChartView.vue'),
            meta: {
              title: '自定义3D饼图'
            }
          },
          {
            path: 'three-d-demo',
            name: 'ThreeDDemo',
            component: () => import('../views/charts/ThreeDDemo.vue'),
            meta: {
              title: '3D可视化演示'
            }
          },
          {
            path: 'three-js-demo',
            name: 'ThreeJsDemo',
            component: () => import('../views/charts/ThreeJsDemo.vue'),
            meta: {
              title: 'Three.js 3D演示'
            }
          },
          {
            path: 'particles-demo',
            name: 'ParticlesDemo',
            component: () => import('../views/charts/ParticlesDemo.vue'),
            meta: {
              title: 'Three.js 粒子系统'
            }
          },
          {
            path: 'character-demo',
            name: 'CharacterDemo',
            component: () => import('../views/charts/CharacterDemo.vue'),
            meta: {
              title: '3D 人物模型'
            }
          }
        ]
      },
      
      // 测试功能
      {
        path: 'tests',
        name: 'Tests',
        meta: {
          title: '测试功能',
          icon: 'el-icon-document-copy'
        },
        children: [
          // 下划线动画演示
          {
            path: 'underline-animation',
            name: 'UnderlineAnimation',
            component: () => import('../components/UnderlineAnimation.vue'),
            meta: {
              title: '下划线动画演示'
            }
          },
          {
            path: 'underline-animation-test',
            name: 'UnderlineAnimationTest',
            component: () => import('@/views/test/UnderlineAnimationTest.vue'),
            meta: {
              title: '下划线动画测试'
            }
          },
          {
            path: 'blank-test',
            name: 'BlankTest',
            component: () => import('@/views/test/BlankTest.vue'),
            meta: {
              title: '空白测试页面'
            }
          },
          {
            path: 'calendar-test',
            name: 'CalendarTest',
            component: () => import('../views/test/CalendarTest.vue'),
            meta: {
              title: '日历测试页面'
            }
          },
          {
            path: 'async-loader-test',
            name: 'AsyncLoaderTest',
            component: () => import('../views/test/AsyncLoaderTest.vue'),
            meta: {
              title: '异步组件按需加载测试'
            }
          },
          {
            path: 'dynamic-form-test',
            name: 'DynamicFormTest',
            component: () => import('../views/test/DynamicFormTest.vue'),
            meta: {
              title: '动态表单生成器'
            }
          }
        ]
      },
      
      // 地图相关
      {
        path: 'maps',
        name: 'Maps',
        meta: {
          title: '地图功能',
          icon: 'el-icon-map-location'
        },
        children: [
          {
            path: 'map-demo',
            name: 'MapDemo',
            component: () => import('../views/maps/MapDemo.vue'),
            meta: {
              title: '地图演示'
            }
          },
          {
            path: 'china-map',
            name: 'ChinaMap',
            component: () => import('../views/maps/ChinaMapView.vue'),
            meta: {
              title: '中国地图'
            }
          },
          {
            path: 'new-china-map',
            name: 'NewChinaMap',
            component: () => import('../views/maps/NewChianMapView.vue'),
            meta: {
              title: '新版中国地图'
            }
          },
          {
            path: 'network-flow-map',
            name: 'NetworkFlowMap',
            component: () => import('../views/maps/NetworkFlowMapView.vue'),
            meta: {
              title: '网络流量地图'
            }
          },
          {
            path: 'olmap-demo',
            name: 'OLMapDemo',
            component: () => import('../views/maps/OLMapDemo.vue'),
            meta: {
              title: 'OLMap方法演示'
            }
          },
          {
            path: 'cesium-demo',
            name: 'CesiumMapDemo',
            component: () => import('../views/maps/CesiumMapDemo.vue'),
            meta: {
              title: 'Cesium地图演示'
            }
          }
        ]
      },
      
      // AI相关
      {
        path: 'ai-demo',
        name: 'AIDemo',
        component: () => import('../views/ai/AIDemo.vue'),
        meta: {
          title: 'AI演示',
          icon: 'el-icon-cpu'
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