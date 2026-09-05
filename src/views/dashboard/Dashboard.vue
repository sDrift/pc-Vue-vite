<template>
  <div class="dashboard-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>系统概览</span>
        </div>
      </template>

      <div class="stats-grid">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ totalUsers }}</div>
            <div class="stat-label">总用户数</div>
          </div>
          <div class="stat-icon">
            <el-icon-user size="28" />
          </div>
        </el-card>

        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ totalProducts }}</div>
            <div class="stat-label">产品总数</div>
          </div>
          <div class="stat-icon">
            <el-icon-goods size="28" />
          </div>
        </el-card>

        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ totalOrders }}</div>
            <div class="stat-label">订单总数</div>
          </div>
          <div class="stat-icon">
            <el-icon-shopping-cart size="28" />
          </div>
        </el-card>

        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ totalRevenue }}</div>
            <div class="stat-label">总销售额</div>
          </div>
          <div class="stat-icon">
            <el-icon-money size="28" />
          </div>
        </el-card>
      </div>
    </el-card>

    <div class="charts-container">
      <el-card class="chart-card">
        <template #header>
          <div class="card-header">
            <span>销售趋势</span>
          </div>
        </template>
        <div class="chart-wrapper">
          <!-- 这里可以放置图表，暂时用文字占位 -->
          <div class="chart-placeholder">
            <el-icon-data-line size="48" />
            <p>销售趋势图表区域</p>
          </div>
        </div>
      </el-card>

      <el-card class="chart-card">
        <template #header>
          <div class="card-header" @click="handleInit">
            <span>用户活跃度</span>
          </div>
        </template>
        <div class="chart-wrapper">
          <!-- 这里可以放置图表，暂时用文字占位 -->
          <div class="chart-placeholder">
            <el-icon-data-analysis size="48" />
            <p>用户活跃度图表区域</p>
          </div>
        </div>
      </el-card>
    </div>

    <el-card class="recent-activities">
      <template #header>
        <div class="card-header">
          <span>最近活动</span>
        </div>
      </template>
      <el-table :data="recentActivities" style="width: 100%">
        <el-table-column prop="time" label="时间" width="180" />
        <el-table-column prop="user" label="用户" width="120" />
        <el-table-column prop="action" label="操作" />
        <el-table-column prop="ip" label="IP地址" width="150" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { ref } from 'vue'

import { init as initUtils } from '@/utils/index.js'

const handleInit = () => {
  initUtils()
}

// 注册Element Plus图标
// const icons = {
//   'el-icon-user': ElementPlusIconsVue.User,
//   'el-icon-goods': ElementPlusIconsVue.Goods,
//   'el-icon-shopping-cart': ElementPlusIconsVue.ShoppingCart,
//   'el-icon-money': ElementPlusIconsVue.Money,
//   'el-icon-data-line': ElementPlusIconsVue.DataLine,
//   'el-icon-data-analysis': ElementPlusIconsVue.DataAnalysis,
// }

// // 创建组件对象
// const components = {
//   'el-icon-user': icons['el-icon-user'],
//   'el-icon-goods': icons['el-icon-goods'],
//   'el-icon-shopping-cart': icons['el-icon-shopping-cart'],
//   'el-icon-money': icons['el-icon-money'],
//   'el-icon-data-line': icons['el-icon-data-line'],
//   'el-icon-data-analysis': icons['el-icon-data-analysis'],
// }

// 统计数据
const totalUsers = ref(256)
const totalProducts = ref(128)
const totalOrders = ref(1024)
const totalRevenue = ref('¥1,280,000')

// 最近活动数据
const recentActivities = ref([
  {
    time: '2024-05-20 15:30:20',
    user: 'admin',
    action: '登录系统',
    ip: '192.168.1.100',
  },
  {
    time: '2024-05-20 15:25:10',
    user: 'user123',
    action: '修改了个人资料',
    ip: '192.168.1.101',
  },
  {
    time: '2024-05-20 15:10:45',
    user: 'editor',
    action: '发布了一篇新文章',
    ip: '192.168.1.102',
  },
  {
    time: '2024-05-20 14:55:30',
    user: 'admin',
    action: '添加了一个新用户',
    ip: '192.168.1.100',
  },
  {
    time: '2024-05-20 14:40:15',
    user: 'user456',
    action: '购买了一个产品',
    ip: '192.168.1.103',
  },
])
</script>

<style scoped>
.dashboard-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.stat-icon {
  color: #409eff;
}

.charts-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.chart-card {
  height: 300px;
}

.chart-wrapper {
  height: calc(100% - 40px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-placeholder {
  text-align: center;
  color: #909399;
}

.chart-placeholder p {
  margin-top: 10px;
}

.recent-activities {
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
