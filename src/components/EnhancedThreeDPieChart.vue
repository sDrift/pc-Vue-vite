<template>
  <div class="three-d-pie-chart-container">
    <div ref="chartRef" class="chart"></div>
  </div>
</template>

<script setup>
import * as echarts from 'echarts'
import { onMounted, ref, onUnmounted, watch } from 'vue'
import 'echarts-gl'

// 定义props
const props = defineProps({
  data: {
    type: Array,
    default: () => [],
  },
  internalDiameterRatio: {
    type: Number,
    default: 0.59,
  },
  autoRotate: {
    type: Boolean,
    default: true,
  },
  rotateSpeed: {
    type: Number,
    default: 10,
  },
})

// 定义emits
const emit = defineEmits(['chartClick', 'chartHover', 'chartReady'])

const chartRef = ref(null)
let chartInstance = null
let selectedIndex = ''
let hoveredIndex = ''
let option = null

// 生成扇形的曲面参数方程
function getParametricEquation(startRatio, endRatio, isSelected, isHovered, k, h) {
  const midRatio = (startRatio + endRatio) / 2
  const startRadian = startRatio * Math.PI * 2
  const endRadian = endRatio * Math.PI * 2
  const midRadian = midRatio * Math.PI * 2

  if (startRatio === 0 && endRatio === 1) {
    isSelected = false
  }

  k = typeof k !== 'undefined' ? k : 1 / 3

  const offsetX = isSelected ? Math.cos(midRadian) * 0.1 : 0
  const offsetY = isSelected ? Math.sin(midRadian) * 0.1 : 0
  const hoverRate = isHovered ? 1.05 : 1

  return {
    u: {
      min: -Math.PI,
      max: Math.PI * 3,
      step: Math.PI / 32,
    },
    v: {
      min: 0,
      max: Math.PI * 2,
      step: Math.PI / 20,
    },
    x(u, v) {
      if (u < startRadian) {
        return offsetX + Math.cos(startRadian) * (1 + Math.cos(v) * k) * hoverRate
      }
      if (u > endRadian) {
        return offsetX + Math.cos(endRadian) * (1 + Math.cos(v) * k) * hoverRate
      }

      return offsetX + Math.cos(u) * (1 + Math.cos(v) * k) * hoverRate
    },
    y(u, v) {
      if (u < startRadian) {
        return offsetY + Math.sin(startRadian) * (1 + Math.cos(v) * k) * hoverRate
      }
      if (u > endRadian) {
        return offsetY + Math.sin(endRadian) * (1 + Math.cos(v) * k) * hoverRate
      }

      return offsetY + Math.sin(u) * (1 + Math.cos(v) * k) * hoverRate
    },
    z(u, v) {
      if (u < -Math.PI * 0.5) {
        return Math.sin(u)
      }
      if (u > Math.PI * 2.5) {
        return Math.sin(u) * h * 0.1
      }

      return Math.sin(v) > 0 ? 1 * h * 0.1 : -1
    },
  }
}

// 生成模拟 3D 饼图的配置项
function getPie3D(pieData, internalDiameterRatio) {
  const series = []
  let sumValue = 0
  let startValue = 0
  let endValue = 0
  // 确保internalDiameterRatio是数字类型
  const safeInternalDiameterRatio = Number(internalDiameterRatio)
  const k =
    typeof internalDiameterRatio !== 'undefined'
      ? (1 - safeInternalDiameterRatio) / (1 + safeInternalDiameterRatio)
      : 1 / 3

  for (let i = 0; i < pieData.length; i += 1) {
    sumValue += pieData[i].value

    const seriesItem = {
      name: typeof pieData[i].name === 'undefined' ? `series${i}` : pieData[i].name,
      type: 'surface',
      parametric: true,
      wireframe: {
        show: false,
      },
      pieData: pieData[i],
      pieStatus: {
        selected: false,
        hovered: false,
        k,
      },
    }

    if (typeof pieData[i].itemStyle !== 'undefined') {
      seriesItem.itemStyle = pieData[i].itemStyle
    }
    series.push(seriesItem)
  }

  for (let i = 0; i < series.length; i += 1) {
    endValue = startValue + series[i].pieData.value

    series[i].pieData.startRatio = startValue / sumValue
    series[i].pieData.endRatio = endValue / sumValue
    series[i].parametricEquation = getParametricEquation(
      series[i].pieData.startRatio,
      series[i].pieData.endRatio,
      false,
      false,
      k,
      series[i].pieData.value === series[0].pieData.value ? 35 : 10,
    )

    startValue = endValue
  }

  const option = {
    tooltip: {
      formatter: (params) => {
        if (params.seriesName !== 'mouseoutSeries') {
          return `${
            params.seriesName
          }<br/><span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${
            params.color
          };"></span>${option.series[params.seriesIndex].pieData.value}`
        }

        return ''
      },
    },
    xAxis3D: {
      min: -1,
      max: 1,
    },
    yAxis3D: {
      min: -1,
      max: 1,
    },
    zAxis3D: {
      min: -1,
      max: 1,
    },
    grid3D: {
      show: false,
      boxHeight: 5,
      top: '-20%',
      viewControl: {
        alpha: 35,
        rotateSensitivity: 1,
        zoomSensitivity: 0,
        panSensitivity: 0,
        autoRotate: props.autoRotate,
        // 确保rotateSpeed是数字类型，防止TypeError: value.toFixed is not a function错误
        autoRotateSpeed: Number(props.rotateSpeed),
        distance: 150,
      },
      postEffect: {
        enable: false,
        bloom: {
          enable: true,
          bloomIntensity: 0.1,
        },
        SSAO: {
          enable: true,
          quality: 'medium',
          radius: 2,
        },
      },
    },
    series,
  }

  return option
}

// 初始化图表
const initChart = () => {
  console.log('EnhancedThreeDPieChart: 开始初始化3D饼图')
  if (!chartRef.value) {
    console.log('EnhancedThreeDPieChart: 图表容器未找到')

    return
  }

  if (chartInstance) {
    chartInstance.dispose()
  }

  try {
    chartInstance = echarts.init(chartRef.value)
    console.log('EnhancedThreeDPieChart: 图表实例创建成功')
    emit('chartReady', chartInstance)
  } catch (error) {
    console.error('EnhancedThreeDPieChart: 创建图表实例失败', error)

    return
  }

  // 使用props传入的数据或默认数据
  const pieData =
    props.data.length > 0
      ? props.data
      : [
          {
            name: 'cc',
            value: 47,
            itemStyle: {
              color: '#f77b66',
            },
          },
          {
            name: 'aa',
            value: 44,
            itemStyle: {
              color: '#3edce0',
            },
          },
          {
            name: 'bb',
            value: 32,
            itemStyle: {
              color: '#f94e76',
            },
          },
          {
            name: 'ee',
            value: 16,
            itemStyle: {
              color: '#018ef1',
            },
          },
          {
            name: 'dd',
            value: 23,
            itemStyle: {
              color: '#9e60f9',
            },
          },
        ]

  option = getPie3D(pieData, props.internalDiameterRatio)

  try {
    chartInstance.setOption(option)
    console.log('EnhancedThreeDPieChart: 3D饼图配置应用成功')
    addChartEvents()
  } catch (error) {
    console.error('EnhancedThreeDPieChart: 应用图表配置失败', error)
  }
}

// 更新图表数据
const updateChart = (newData = null) => {
  if (!chartInstance || !option) return

  console.log('EnhancedThreeDPieChart: 更新图表数据')
  const pieData =
    newData && newData.length > 0
      ? newData
      : props.data.length > 0
        ? props.data
        : option.series.map((item) => item.pieData)

  try {
    // 重置选择状态
    selectedIndex = ''
    hoveredIndex = ''

    // 更新选项
    option = getPie3D(pieData, props.internalDiameterRatio)

    // 更新自动旋转设置
    option.grid3D.viewControl.autoRotate = props.autoRotate
    // 确保rotateSpeed是数字类型，防止TypeError: value.toFixed is not a function错误
    option.grid3D.viewControl.autoRotateSpeed = Number(props.rotateSpeed)

    // 应用新选项
    chartInstance.setOption(option, true)
    console.log('EnhancedThreeDPieChart: 图表数据更新成功')

    // 重新绑定事件
    addChartEvents()
  } catch (error) {
    console.error('EnhancedThreeDPieChart: 更新图表数据失败', error)
  }
}

// 添加图表事件
const addChartEvents = () => {
  if (!chartInstance) return

  // 先移除所有事件监听器，避免重复绑定
  chartInstance.off('mouseover')
  chartInstance.off('globalout')
  chartInstance.off('click')

  chartInstance.on('mouseover', (params) => {
    let isSelected
    let isHovered
    let startRatio
    let endRatio
    let k
    let i

    if (hoveredIndex === params.seriesIndex) {
      return
    }

    if (hoveredIndex !== '') {
      isSelected = option.series[hoveredIndex].pieStatus.selected
      isHovered = false
      startRatio = option.series[hoveredIndex].pieData.startRatio
      endRatio = option.series[hoveredIndex].pieData.endRatio
      k = option.series[hoveredIndex].pieStatus.k
      i = option.series[hoveredIndex].pieData.value === option.series[0].pieData.value ? 35 : 10

      option.series[hoveredIndex].parametricEquation = getParametricEquation(
        startRatio,
        endRatio,
        isSelected,
        isHovered,
        k,
        i,
      )
      option.series[hoveredIndex].pieStatus.hovered = isHovered
      hoveredIndex = ''
    }

    if (params.seriesName !== 'mouseoutSeries') {
      isSelected = option.series[params.seriesIndex].pieStatus.selected
      isHovered = true
      startRatio = option.series[params.seriesIndex].pieData.startRatio
      endRatio = option.series[params.seriesIndex].pieData.endRatio
      k = option.series[params.seriesIndex].pieStatus.k

      option.series[params.seriesIndex].parametricEquation = getParametricEquation(
        startRatio,
        endRatio,
        isSelected,
        isHovered,
        k,
        option.series[params.seriesIndex].pieData.value + 5,
      )
      option.series[params.seriesIndex].pieStatus.hovered = isHovered
      hoveredIndex = params.seriesIndex

      // 触发hover事件
      emit('chartHover', {
        data: option.series[params.seriesIndex].pieData,
        seriesIndex: params.seriesIndex,
      })
    }

    chartInstance.setOption(option)
  })

  chartInstance.on('globalout', () => {
    if (hoveredIndex !== '') {
      const isSelected = option.series[hoveredIndex].pieStatus.selected
      const isHovered = false
      const k = option.series[hoveredIndex].pieStatus.k
      const startRatio = option.series[hoveredIndex].pieData.startRatio
      const endRatio = option.series[hoveredIndex].pieData.endRatio
      const i =
        option.series[hoveredIndex].pieData.value === option.series[0].pieData.value ? 35 : 10

      option.series[hoveredIndex].parametricEquation = getParametricEquation(
        startRatio,
        endRatio,
        isSelected,
        isHovered,
        k,
        i,
      )
      option.series[hoveredIndex].pieStatus.hovered = isHovered
      hoveredIndex = ''
    }

    chartInstance.setOption(option)
  })

  // 添加点击事件处理
  chartInstance.on('click', (params) => {
    if (params.seriesName !== 'mouseoutSeries') {
      const isSelected = selectedIndex === params.seriesIndex ? false : true

      // 取消之前的选择
      if (selectedIndex !== '' && selectedIndex !== params.seriesIndex) {
        const prevSeries = option.series[selectedIndex]

        prevSeries.pieStatus.selected = false
        prevSeries.parametricEquation = getParametricEquation(
          prevSeries.pieData.startRatio,
          prevSeries.pieData.endRatio,
          false,
          prevSeries.pieStatus.hovered,
          prevSeries.pieStatus.k,
          prevSeries.pieData.value,
        )
      }

      // 更新当前选择
      selectedIndex = isSelected ? params.seriesIndex : ''
      const currentSeries = option.series[params.seriesIndex]

      currentSeries.pieStatus.selected = isSelected

      // 更新当前系列的参数方程
      currentSeries.parametricEquation = getParametricEquation(
        currentSeries.pieData.startRatio,
        currentSeries.pieData.endRatio,
        isSelected,
        currentSeries.pieStatus.hovered,
        currentSeries.pieStatus.k,
        currentSeries.pieData.value,
      )

      // 应用更新
      chartInstance.setOption(option)

      // 触发点击事件
      emit('chartClick', {
        data: currentSeries.pieData,
        seriesIndex: params.seriesIndex,
        isSelected,
      })
    }
  })
}

// 处理窗口大小变化
const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}

// 清理资源
const cleanup = () => {
  console.log('EnhancedThreeDPieChart: 执行清理资源')
  window.removeEventListener('resize', handleResize)
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
  option = null
  selectedIndex = ''
  hoveredIndex = ''
}

// 监听props变化
watch(
  () => [props.data, props.internalDiameterRatio, props.autoRotate, props.rotateSpeed],
  () => {
    if (chartInstance && option) {
      updateChart()
    }
  },
  { deep: true },
)

// 组件挂载时初始化图表
onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
})

// 组件卸载时清理资源
onUnmounted(() => {
  cleanup()
})

// 导出方法以便在父组件中调用
defineExpose({
  cleanup,
  isReady: () => !!chartInstance,
  updateChart,
  getInstance: () => chartInstance,
})
</script>

<style scoped>
.three-d-pie-chart-container {
  width: 100%;
  height: 100%;
  min-height: 400px;
  padding: 20px;
  box-sizing: border-box;
}

.chart {
  width: 100%;
  height: 100%;
  min-height: 360px;
  background-color: #fafafa;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgb(0 0 0 / 10%);
  cursor: grab;
}

.chart:active {
  cursor: grabbing;
}
</style>
