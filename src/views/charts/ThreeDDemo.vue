<template>
  <div class="three-d-demo">
    <el-card shadow="hover" class="main-card">
      <template #header>
        <div class="card-header">
          <span>3D 可视化演示</span>
          <el-space>
            <el-button type="primary" @click="changeChart('bar3d')">3D柱状图</el-button>
            <el-button @click="changeChart('scatter3d')">3D散点图</el-button>
            <el-button @click="changeChart('surface3d')">3D曲面图</el-button>
            <el-button @click="changeChart('map3d')">3D地图</el-button>
          </el-space>
        </div>
      </template>

      <div ref="chartRef" class="chart-container"></div>
    </el-card>
  </div>
</template>

<script setup>
import * as echarts from 'echarts'
import { ref, onMounted, onUnmounted } from 'vue'
import 'echarts-gl' // 自动注册到echarts中

const chartRef = ref(null)
let chart = null
let currentChart = 'bar3d'

// 3D柱状图数据
const bar3dData = [
  [0, 0, 5],
  [0, 1, 10],
  [0, 2, 15],
  [1, 0, 8],
  [1, 1, 12],
  [1, 2, 20],
  [2, 0, 12],
  [2, 1, 18],
  [2, 2, 25],
]

// 3D散点图数据
const scatter3dData = []

for (let i = 0; i < 200; i++) {
  scatter3dData.push([Math.random() * 100, Math.random() * 100, Math.random() * 100])
}

// 3D曲面图数据
const surface3dData = []

for (let i = 0; i < 50; i++) {
  const row = []

  for (let j = 0; j < 50; j++) {
    const x = (i / 50 - 0.5) * 20
    const y = (j / 50 - 0.5) * 20
    const z = (Math.sin(Math.sqrt(x * x + y * y)) / Math.sqrt(x * x + y * y)) * 10

    row.push([i, j, z])
  }
  surface3dData.push(row)
}

// 初始化图表
const initChart = () => {
  if (chartRef.value) {
    // 使用echarts-gl创建支持3D的图表实例
    chart = echarts.init(chartRef.value)
    // 确保所有3D组件都已注册
    updateChart()
  }
}

// 更新图表
const updateChart = () => {
  let option

  switch (currentChart) {
    case 'bar3d':
      option = {
        tooltip: {},
        grid3D: {
          boxWidth: 200,
          boxHeight: 100,
          boxDepth: 150,
          viewControl: {
            projection: 'perspective',
          },
        },
        xAxis3D: {
          type: 'category',
          data: ['类别A', '类别B', '类别C'],
        },
        yAxis3D: {
          type: 'category',
          data: ['项目1', '项目2', '项目3'],
        },
        zAxis3D: {
          type: 'value',
        },
        series: [
          {
            type: 'bar3D',
            data: bar3dData,
            shading: 'lambert',
            label: {
              show: true,
              formatter(params) {
                return params.value[2]
              },
            },
            itemStyle: {
              color(params) {
                const value = params.value[2]

                return value > 20 ? '#ff4d4f' : value > 15 ? '#faad14' : '#52c41a'
              },
            },
          },
        ],
      }
      break

    case 'scatter3d':
      option = {
        tooltip: {},
        grid3D: {
          viewControl: {
            projection: 'orthographic',
          },
        },
        xAxis3D: {
          type: 'value',
        },
        yAxis3D: {
          type: 'value',
        },
        zAxis3D: {
          type: 'value',
        },
        series: [
          {
            type: 'scatter3D',
            data: scatter3dData,
            symbolSize: 5,
            itemStyle: {
              color(params) {
                const value = params.value[2]

                // 使用更简单的颜色设置
                if (value < 33) return '#52c41a' // 绿色
                if (value < 66) return '#faad14' // 黄色

                return '#ff4d4f' // 红色
              },
            },
            emphasis: {
              label: {
                show: true,
                formatter(params) {
                  return params.value
                    .map((val) => {
                      return val.toFixed(1)
                    })
                    .join(', ')
                },
              },
            },
          },
        ],
      }
      break

    case 'surface3d':
      option = {
        tooltip: {},
        grid3D: {
          boxWidth: 200,
          boxHeight: 100,
          boxDepth: 200,
          viewControl: {
            projection: 'perspective',
          },
        },
        xAxis3D: {
          type: 'value',
        },
        yAxis3D: {
          type: 'value',
        },
        zAxis3D: {
          type: 'value',
        },
        series: [
          {
            type: 'surface3D',
            data: surface3dData,
            shading: 'color',
            itemStyle: {
              color(params) {
                const value = params.value[2]

                return value > 0 ? '#52c41a' : '#ff4d4f'
              },
            },
            wireframe: {
              show: true,
              lineStyle: {
                color: 'rgba(0, 0, 0, 0.2)',
              },
            },
          },
        ],
      }
      break

    case 'map3d':
      // 使用简化的3D散点图模拟地图上的点
      // eslint-disable-next-line no-case-declarations
      const cityData = [
        [116.46, 39.92, 100, '北京'],
        [121.48, 31.22, 150, '上海'],
        [113.23, 23.16, 80, '广州'],
        [114.07, 22.62, 120, '深圳'],
        [120.15, 30.28, 90, '杭州'],
      ]

      option = {
        tooltip: {
          formatter(params) {
            return `${params.data[3]}: ${params.data[2]}`
          },
        },
        grid3D: {
          viewControl: {
            projection: 'perspective',
          },
        },
        xAxis3D: {
          type: 'value',
          name: '经度',
        },
        yAxis3D: {
          type: 'value',
          name: '纬度',
        },
        zAxis3D: {
          type: 'value',
          name: '数值',
        },
        series: [
          {
            type: 'scatter3D',
            data: cityData,
            symbolSize: 15,
            itemStyle: {
              color: '#ff4d4f',
            },
          },
        ],
      }
      break
  }

  if (option) {
    chart.setOption(option)
  }
}

// 切换图表类型
const changeChart = (chartType) => {
  currentChart = chartType
  updateChart()
}

// 响应窗口大小变化
const handleResize = () => {
  chart && chart.resize()
}

// 生命周期钩子
onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chart && chart.dispose()
})
</script>

<style scoped>
.three-d-demo {
  padding: 20px;
}

.main-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
}

.chart-container {
  width: 100%;
  height: 600px;
  margin-top: 20px;
}
</style>
