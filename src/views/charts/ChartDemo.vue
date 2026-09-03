<template>
  <div class="chart-demo-container">
    <div class="demo-header">
      <h2>3D饼图示例</h2>
      <p>这个示例展示了如何使用ECharts创建具有3D效果的饼图</p>
    </div>

    <div class="demo-content">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>访问来源统计</span>
            <el-button type="primary" size="small" @click="refreshChart">刷新数据</el-button>
          </div>
        </template>
        <three-d-pie-chart
          ref="chartComponent"
          :data="chartData"
          :auto-rotate="autoRotate"
          :rotate-speed="rotateSpeed"
          @chart-click="handleChartClick"
          @chart-hover="handleChartHover"
          @chart-ready="handleChartReady"
        />
      </el-card>

      <el-card class="options-card">
        <template #header>
          <span>图表控制与信息</span>
        </template>
        <div class="chart-controls">
          <!-- 图表控制选项 -->
          <div class="control-group">
            <el-switch
              v-model="autoRotate"
              active-text="开启"
              inactive-text="关闭"
              @change="handleAutoRotateChange"
            >
              <template #default>
                <span>自动旋转</span>
              </template>
            </el-switch>
            <div v-if="autoRotate" class="speed-control">
              <span>旋转速度：{{ rotateSpeed }}</span>
              <el-slider
                v-model="rotateSpeed"
                :min="1"
                :max="50"
                :step="1"
                style="width: 200px"
              ></el-slider>
            </div>
          </div>

          <!-- 选中的数据信息 -->
          <div v-if="selectedData" class="selected-data-info">
            <el-alert title="当前选中" type="success" :closable="false">
              <p>
                <strong>名称：</strong>
                {{ selectedData.name }}
              </p>
              <p>
                <strong>数值：</strong>
                {{ selectedData.value }}
              </p>
            </el-alert>
          </div>

          <!-- 图表说明 -->
          <div class="chart-info">
            <h3>3D饼图实现说明</h3>
            <ul>
              <li>通过双层饼图实现3D视觉效果</li>
              <li>外圈添加阴影和透明度处理，增强立体感</li>
              <li>内圈添加边框和圆角，提升美观度</li>
              <li>支持悬停高亮显示详细数据</li>
              <li>支持点击选中扇区，再次点击取消选中</li>
              <li>自动响应窗口大小变化</li>
            </ul>
            <div class="tips">
              <el-alert title="提示" type="info" :closable="false">
                点击饼图区块可选中该扇区，点击"刷新数据"按钮可重新生成随机数据。
              </el-alert>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted, reactive } from 'vue'

import ThreeDPieChart from '@/components/ThreeDPieChart.vue'

const chartComponent = ref(null)
const autoRotate = ref(true)
const rotateSpeed = ref(Number(10)) // 确保是数字类型
const selectedData = ref(null)
const chartData = ref([])

// 组件数据
const labels = ['直接访问', '搜索引擎', '社交媒体', '邮件营销', '广告推广', '合作伙伴', '其他渠道']
const colors = ['#f77b66', '#3edce0', '#f94e76', '#018ef1', '#9e60f9', '#36cfc9', '#5cdbd3']

// 生成随机数据
const generateRandomData = () => {
  const data = []
  const count = Math.floor(Math.random() * 3) + 5 // 生成5-7个数据项
  let totalValue = 0

  // 先随机生成每个部分的值，总和不超过200
  for (let i = 0; i < count; i++) {
    const value = Math.floor(Math.random() * 50) + 10 // 每个部分的值在10-60之间

    data.push({
      name: labels[i % labels.length],
      value,
      itemStyle: {
        color: colors[i % colors.length],
      },
    })
    totalValue += value
  }

  return data
}

// 初始化图表数据
const initChartData = () => {
  chartData.value = generateRandomData()
}

// 刷新图表数据
const refreshChart = () => {
  console.log('刷新图表数据')

  // 生成新的随机数据
  const newData = generateRandomData()

  // 更新图表数据
  if (chartComponent.value && typeof chartComponent.value.updateChart === 'function') {
    chartComponent.value.updateChart(newData, 0.59)
    chartData.value = newData
    selectedData.value = null // 清除选中状态
    console.log('ChartDemo: 图表数据更新成功')
  } else {
    console.warn('ChartDemo: 图表组件未初始化或updateChart方法不存在')
    // 降级处理：直接更新数据，依靠watch来更新图表
    chartData.value = newData
  }
}

// 处理图表点击事件
const handleChartClick = (data, isSelected) => {
  console.log('图表点击事件:', data, isSelected)
  selectedData.value = isSelected ? data : null
}

// 处理图表悬停事件
const handleChartHover = (data) => {
  console.log('图表悬停事件:', data)
  // 可以在这里添加悬停时的额外处理
}

// 处理图表准备就绪事件
const handleChartReady = (instance) => {
  console.log('ChartDemo: 图表准备就绪')
}

// 处理自动旋转设置变化
const handleAutoRotateChange = () => {
  console.log('自动旋转设置变化:', autoRotate.value)
}

// 组件挂载时初始化数据
initChartData()

// 组件卸载时清理图表资源
onUnmounted(() => {
  if (chartComponent.value) {
    // 安全地调用cleanup方法
    if (typeof chartComponent.value.cleanup === 'function') {
      chartComponent.value.cleanup()
    }
  }
})
</script>

<style scoped>
.chart-demo-container {
  padding: 20px;
  height: 100%;
  box-sizing: border-box;
}

.demo-header {
  margin-bottom: 20px;
  text-align: center;
}

.demo-header h2 {
  margin: 0 0 10px;
  color: #303133;
}

.demo-header p {
  margin: 0;
  color: #606266;
}

.demo-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: calc(100% - 80px);
}

.el-card {
  height: fit-content;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.options-card {
  margin-top: 20px;
}

.chart-controls {
  padding: 10px 0;
}

.control-group {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.speed-control {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.speed-control span {
  min-width: 80px;
  color: #606266;
}

.selected-data-info {
  margin-bottom: 20px;
}

.chart-info {
  padding: 10px 0;
}

.chart-info h3 {
  margin: 0 0 15px;
  font-size: 16px;
  color: #303133;
}

.chart-info ul {
  margin: 0 0 20px;
  padding-left: 20px;
}

.chart-info li {
  margin-bottom: 8px;
  color: #606266;
  line-height: 1.5;
}

.tips {
  margin-top: 15px;
}
</style>
