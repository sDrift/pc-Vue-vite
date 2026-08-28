<template>
  <div class="app-container">
    <div class="sidebar">
      <div class="logo">
        <h2>后台管理系统</h2>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="el-menu-vertical-demo"
        @select="handleMenuSelect"
        router
      >
        <template v-for="route in routes" :key="route.path">
          <!-- 无子菜单的路由 -->
          <el-menu-item
            v-if="!route.children || route.children.length === 0"
            :index="`/${route.path}`"
          >
            <component :is="route.meta.icon" />
            <template #title>{{ route.meta.title }}</template>
          </el-menu-item>
          
          <!-- 有子菜单的路由 -->
          <el-sub-menu
            v-else
            :index="route.path"
          >
            <template #title>
              <component :is="route.meta.icon" />
              <span>{{ route.meta.title }}</span>
            </template>
            <el-menu-item
              v-for="child in route.children"
              :key="child.path"
              :index="`/${route.path}/${child.path}`"
            >
              {{ child.meta.title }}
            </el-menu-item>
          </el-sub-menu>
        </template>
      </el-menu>
    </div>
    <div class="main-content">
      <header class="header">
        <div class="header-left">
          <el-button type="text" @click="toggleSidebar">
            <el-icon><Menu /></el-icon></el-button>
        </div>
        <div class="header-right">
          <el-dropdown>
            <span class="user-info">
              <el-icon><User /></el-icon> {{ userInfo?.username || '管理员' }}
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>
      <main class="content">
        <router-view></router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '../store/modules/user';
import { Menu, User } from '@element-plus/icons-vue';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
// 确保所有必要的Element Plus图标都已注册

// 注册Element Plus图标
const icons = {
  'el-icon-data-line': ElementPlusIconsVue.DataLine,
  'el-icon-user': ElementPlusIconsVue.User,
  'el-icon-goods': ElementPlusIconsVue.Goods,
  'el-icon-setting': ElementPlusIconsVue.Setting,
  'el-icon-menu': ElementPlusIconsVue.Menu,
  'el-icon-map-location': ElementPlusIconsVue.MapLocation,
  'el-icon-cpu': ElementPlusIconsVue.Cpu,
  'el-icon-pie-chart': ElementPlusIconsVue.PieChart,
  'el-icon-document-copy': ElementPlusIconsVue.DocumentCopy,
  'el-icon-cloud-rain': ElementPlusIconsVue.DataLine
};

// 创建组件对象
const components = {
  'el-icon-data-line': icons['el-icon-data-line'],
  'el-icon-user': icons['el-icon-user'],
  'el-icon-goods': icons['el-icon-goods'],
  'el-icon-setting': icons['el-icon-setting'],
  'el-icon-menu': icons['el-icon-menu'],
  'el-icon-map-location': icons['el-icon-map-location'],
  'el-icon-cpu': icons['el-icon-cpu'],
  'el-icon-pie-chart': icons['el-icon-pie-chart'],
  'el-icon-document-copy': icons['el-icon-document-copy'],
  'el-icon-cloud-rain': icons['el-icon-cloud-rain']
};

// 获取路由和用户store
const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

// 侧边栏状态
const isSidebarOpen = ref(true);

// 从路由中获取子路由
const routes = computed(() => {
  return router.options.routes.find(r => r.name === 'Layout')?.children || [];
});

// 当前激活的菜单
const activeMenu = computed(() => {
  return route.path;
});

// 用户信息
const userInfo = computed(() => {
  return userStore.userInfo;
});

// 切换侧边栏
const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

// 处理菜单选择
const handleMenuSelect = (index) => {
  router.push(index);
};

// 处理登出
const handleLogout = () => {
  userStore.logout();
  router.push('/login');
};

// 组件挂载时加载用户信息
onMounted(() => {
  userStore.loadUserInfo();
});
</script>

<style scoped>
.app-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  width: 240px;
  background-color: #2c3e50;
  color: white;
  transition: width 0.3s;
  overflow-y: auto;
}

.sidebar.collapsed {
  width: 60px;
}

.logo {
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid #34495e;
}

.logo h2 {
  margin: 0;
  font-size: 18px;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  height: 60px;
  background-color: white;
  border-bottom: 1px solid #e5e5e5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 4px;
}

.user-info:hover {
  background-color: #f5f5f5;
}

.content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background-color: #f5f5f5;
}

/* 自定义Element Plus样式 */
.el-menu-vertical-demo {
  background-color: transparent;
  border-right: none;
}

.el-menu-item {
  color: white;
  border-right: none;
}

.el-menu-item.is-active {
  background-color: #34495e;
  color: white;
}

.el-menu-item:hover {
  background-color: #34495e;
}

/* 子菜单样式 */
.el-sub-menu {
  color: white !important;
}

.el-sub-menu__title span,
.el-menu-vertical-demo {
  color: white !important;
}

:deep(.el-sub-menu__title:hover) {
  background-color: #34495e ;
  color: white !important;
}

.el-sub-menu.is-active{
  background-color: #34495e;
  color: white !important;
}

/* 子菜单展开的背景 */
.el-menu--vertical .el-menu {
  background-color: #34495e;
}

/* 子菜单项样式 */
.el-menu--vertical .el-menu .el-menu-item {
  background-color: #34495e;
  color: white;
}

.el-menu--vertical .el-menu .el-menu-item:hover {
  background-color: #4a637b;
}

.el-menu--vertical .el-menu .el-menu-item.is-active {
  background-color: #4a637b;
  color: white;
}
</style>