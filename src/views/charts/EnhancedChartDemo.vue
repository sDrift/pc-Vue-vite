<template>
  <div class="chart-demo-container">
    <div class="demo-header">
      <h2>增强版3D饼图示例</h2>
      <p>这个示例展示了优化后的3D饼图组件，支持动态数据更新和更多交互功能</p>
    </div>

    <div class="demo-content">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>访问来源统计</span>
            <el-button type="primary" size="small" @click="refreshData">刷新数据</el-button>
          </div>
        </template>
        <enhanced-three-d-pie-chart
          ref="chartComponent"
          :data="chartData"
          :internal-diameter-ratio="internalDiameterRatio"
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

          <!-- 内圆比例控制 -->
          <div class="control-group">
            <span>内圆比例：{{ Math.round(internalDiameterRatio * 100) }}%</span>
            <el-slider
              v-model="internalDiameterRatio"
              :min="0.1"
              :max="0.9"
              :step="0.05"
              style="width: 200px"
            ></el-slider>
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
              <p>
                <strong>占比：</strong>
                {{ selectedData.percentage }}%
              </p>
            </el-alert>
          </div>

          <!-- 图表说明 -->
          <div class="chart-info">
            <h3>增强版3D饼图功能说明</h3>
            <ul>
              <li>通过曲面参数方程实现真正的3D效果</li>
              <li>支持动态调整内圆比例，改变饼图外观</li>
              <li>支持自动旋转及速度调节</li>
              <li>实现完整的点击交互，可选中和取消选中扇区</li>
              <li>支持悬停高亮，显示详细数据</li>
              <li>提供图表准备就绪、点击和悬停事件回调</li>
              <li>自动响应窗口大小变化</li>
              <li>支持动态更新数据，无需重建图表</li>
            </ul>
            <div class="tips">
              <el-alert title="提示" type="info" :closable="false">
                点击饼图区块可选中该扇区，拖动可旋转视角，点击"刷新数据"按钮可重新生成随机数据。
              </el-alert>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

import EnhancedThreeDPieChart from '@/components/EnhancedThreeDPieChart.vue'

// 初始化图表实例引用
const chartComponent = ref(null)

// 图表数据
const chartData = ref([])

// 控制选项
const autoRotate = ref(true)
const rotateSpeed = ref(Number(10)) // 确保是数字类型
const internalDiameterRatio = ref(Number(0.59)) // 确保是数字类型

// 选中的数据信息
const selectedData = ref(null)

// 生成随机数据
const generateRandomData = () => {
  const categories = ['类别A', '类别B', '类别C', '类别D', '类别E']
  const colors = ['#f77b66', '#3edce0', '#f94e76', '#018ef1', '#9e60f9']
  const data = []

  for (let i = 0; i < 5; i++) {
    data.push({
      name: categories[i],
      value: Math.floor(Math.random() * 50) + 10,
      itemStyle: {
        color: colors[i],
      },
    })
  }

  return data
}

// 刷新图表数据
const refreshData = () => {
  chartData.value = generateRandomData()
  selectedData.value = null

  // 如果图表已准备好，可以直接调用更新方法
  if (chartComponent.value && chartComponent.value.isReady()) {
    chartComponent.value.updateChart(chartData.value)
  }
}

// 处理图表点击事件
const handleChartClick = (event) => {
  console.log('Chart clicked:', event)
  selectedData.value = event.data
}

// 处理图表悬停事件
const handleChartHover = (event) => {
  console.log('Chart hovered:', event)
  // 可以在这里添加悬停时的额外处理逻辑
}

// 处理图表就绪事件
const handleChartReady = (instance) => {
  console.log('Chart is ready:', instance)
  // 图表实例已准备好，可以在这里进行额外的配置
}

// 组件挂载时初始化数据
onMounted(() => {
  refreshData()
})

// 组件卸载时清理资源
onUnmounted(() => {
  if (chartComponent.value) {
    chartComponent.value.cleanup()
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
  /* display: flex; */
  flex-direction: column;
  gap: 20px;
  height: calc(100% - 80px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.options-card {
  max-height: 400px;
  overflow-y: auto;
}

.chart-controls {
  padding: 10px 0;
}

.control-group {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.speed-control {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: 20px;
}

.selected-data-info {
  margin-bottom: 20px;
}

.chart-info {
  margin-top: 20px;
}

.chart-info h3 {
  margin: 0 0 10px;
  color: #303133;
  font-size: 16px;
}

.chart-info ul {
  margin: 0 0 20px;
  padding-left: 20px;
}

.chart-info li {
  margin-bottom: 5px;
  color: #606266;
}

.tips {
  margin-top: 20px;
}

@media (width >= 1200px) {
  .demo-content {
    flex-direction: row;
    height: calc(100% - 100px);
  }

  .demo-content > el-card:first-child {
    flex: 2;
    min-height: 500px;
  }

  .options-card {
    flex: 1;
    min-height: 500px;
    max-height: none;
  }
}
</style>
