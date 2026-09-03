<template>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <h2>中国单身人口统计地图</h2>
    </div>

    <!-- 统计卡片区域 -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-number">{{ totalSingleCount }}</div>
        <div class="stat-label">全国单身人口</div>
      </div>
      <div class="stat-card success">
        <div class="stat-number">{{ totalMatchedCount }}</div>
        <div class="stat-label">已脱单人数</div>
      </div>
      <div class="stat-card warning">
        <div class="stat-number">{{ totalUnmatchedCount }}</div>
        <div class="stat-label">未脱单人数</div>
      </div>
      <div class="stat-card info">
        <div class="stat-number">{{ overallMatchedRate }}%</div>
        <div class="stat-label">整体脱单率</div>
      </div>
    </div>

    <!-- 地图区域 -->
    <div class="map-container">
      <div ref="mapRef" class="china-map"></div>
    </div>

    <!-- 城市详情面板 -->
    <div v-if="selectedCity" class="city-detail">
      <div class="detail-header">
        <h3>{{ selectedCity.name }} 详细信息</h3>
        <button class="close-btn" @click="resetSelectedCity">×</button>
      </div>
      <div class="detail-content">
        <div class="detail-item">
          <span class="detail-label">单身人口：</span>
          <span class="detail-value">{{ selectedCity.singleCount || 0 }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">已脱单人数：</span>
          <span class="detail-value success">{{ selectedCity.matchedCount || 0 }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">未脱单人数：</span>
          <span class="detail-value warning">{{ selectedCity.unmatchedCount || 0 }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">脱单率：</span>
          <span class="detail-value info">{{ selectedCity.matchedRate || 0 }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import * as echarts from 'echarts'
import { ref, onMounted, onUnmounted, computed } from 'vue'

import testImg from '@/assets/test.jpg'

import chinaGeoJSON from './json/china.json'

// 将图片转换为base64的函数
const getBase64Image = (imgUrl) => {
  return new Promise((resolve) => {
    const img = new Image()

    img.crossOrigin = 'Anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')

      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')

      ctx.drawImage(img, 0, 0)
      const dataURL = canvas.toDataURL('image/jpeg')

      resolve(dataURL)
    }
    img.onerror = () => {
      // 如果图片加载失败，使用默认的SVG飞机图标
      resolve(
        'path://M1705.06,1318.313v-89.254l-319.9-221.799l0.073-208.063c0.521-84.662-26.629-121.796-63.961-121.491c-37.332-0.305-64.482,36.829-63.961,121.491l0.073,208.063l-319.9,221.799v89.254l319.9,221.799l0.073,208.063c0.521,84.662,26.629,121.796,63.961,121.491c37.332-0.305,64.482-36.829,63.961-121.491l0.073-208.063L1705.06,1318.313z',
      )
    }
    img.src = imgUrl
  })
}

// 存储base64图片的变量
const planeBase64Image = ref('')

// 地图实例和DOM引用
let mapChart = null
const mapRef = ref(null)
const selectedCity = ref(null)

// 模拟城市数据
const cityData = ref([
  { name: '北京', singleCount: 350, matchedCount: 180, unmatchedCount: 170, matchedRate: 51.4 },
  { name: '上海', singleCount: 400, matchedCount: 210, unmatchedCount: 190, matchedRate: 52.5 },
  { name: '广州', singleCount: 320, matchedCount: 160, unmatchedCount: 160, matchedRate: 50.0 },
  { name: '深圳', singleCount: 330, matchedCount: 170, unmatchedCount: 160, matchedRate: 51.5 },
  { name: '杭州', singleCount: 280, matchedCount: 130, unmatchedCount: 150, matchedRate: 46.4 },
  { name: '成都', singleCount: 310, matchedCount: 140, unmatchedCount: 170, matchedRate: 45.2 },
  { name: '武汉', singleCount: 260, matchedCount: 110, unmatchedCount: 150, matchedRate: 42.3 },
  { name: '西安', singleCount: 240, matchedCount: 100, unmatchedCount: 140, matchedRate: 41.7 },
  { name: '南京', singleCount: 250, matchedCount: 120, unmatchedCount: 130, matchedRate: 48.0 },
  { name: '重庆', singleCount: 290, matchedCount: 130, unmatchedCount: 160, matchedRate: 44.8 },
  { name: '天津', singleCount: 220, matchedCount: 100, unmatchedCount: 120, matchedRate: 45.5 },
  { name: '苏州', singleCount: 230, matchedCount: 110, unmatchedCount: 120, matchedRate: 47.8 },
  { name: '郑州', singleCount: 200, matchedCount: 80, unmatchedCount: 120, matchedRate: 40.0 },
  { name: '长沙', singleCount: 190, matchedCount: 90, unmatchedCount: 100, matchedRate: 47.4 },
  { name: '青岛', singleCount: 180, matchedCount: 85, unmatchedCount: 95, matchedRate: 47.2 },
])

// 城市坐标映射表
const cityCoordinates = {
  北京: [116.36832397, 39.91508569],
  上海: [121.472644, 31.231706],
  广州: [113.264385, 23.129163],
  深圳: [114.057868, 22.543099],
  杭州: [120.15507, 30.274084],
  成都: [104.066541, 30.572269],
  武汉: [114.305542, 30.592755],
  西安: [108.948024, 34.341568],
  南京: [118.767413, 32.041544],
  重庆: [106.550763, 29.563009],
  天津: [117.190182, 39.343479],
  苏州: [120.585316, 31.298892],
  郑州: [113.625368, 34.746599],
  长沙: [112.982279, 28.19409],
  青岛: [120.382639, 36.067141],
  昆明: [102.712251, 25.040609],
  贵阳: [106.70915, 26.646452],
}

// 计算总数据
const totalSingleCount = computed(() =>
  cityData.value.reduce((sum, city) => sum + city.singleCount, 0),
)

const totalMatchedCount = computed(() =>
  cityData.value.reduce((sum, city) => sum + city.matchedCount, 0),
)

const totalUnmatchedCount = computed(() =>
  cityData.value.reduce((sum, city) => sum + city.unmatchedCount, 0),
)

const overallMatchedRate = computed(
  () => Math.round((totalMatchedCount.value / totalSingleCount.value) * 100 * 10) / 10,
)

// 准备散点数据
const prepareScatterData = () => {
  return cityData.value
    .filter((city) => cityCoordinates[city.name])
    .map((city) => {
      const [lon, lat] = cityCoordinates[city.name]

      return {
        name: city.name,
        value: [lon, lat, city.singleCount],
        singleCount: city.singleCount,
        matchedCount: city.matchedCount,
        unmatchedCount: city.unmatchedCount,
        matchedRate: city.matchedRate,
      }
    })
}

// 初始化地图
const initMap = async () => {
  if (!mapRef.value) {
    console.error('mapRef is not available')

    return
  }

  // 先将图片转换为base64
  try {
    const base64Data = await getBase64Image(testImg)

    planeBase64Image.value = base64Data
    console.log('Image converted to base64 successfully')
  } catch (error) {
    console.error('Failed to convert image to base64:', error)
    // 使用默认SVG路径作为后备
    planeBase64Image.value =
      'path://M1705.06,1318.313v-89.254l-319.9-221.799l0.073-208.063c0.521-84.662-26.629-121.796-63.961-121.491c-37.332-0.305-64.482,36.829-63.961,121.491l0.073,208.063l-319.9,221.799v89.254l319.9,221.799l0.073,208.063c0.521,84.662,26.629,121.796,63.961,121.491c37.332-0.305,64.482-36.829,63.961-121.491l0.073-208.063L1705.06,1318.313z'
  }

  console.log('Initializing map chart...')
  mapChart = echarts.init(mapRef.value)

  // Register the China GeoJSON with ECharts
  console.log('Registering China map...')
  echarts.registerMap('china', chinaGeoJSON)
  console.log('China map registered successfully')

  // 准备散点数据
  const scatterData = prepareScatterData()

  console.log('Scatter data prepared:', scatterData)

  // 图表配置
  const option = {
    tooltip: {
      trigger: 'item',
      formatter(params) {
        console.log('Tooltip params:', params)
        try {
          if (params.seriesType === 'scatter') {
            const data = params.data || {}

            return `${data.name}<br/>单身人口：${data.singleCount || 0}<br/>已脱单：${data.matchedCount || 0}<br/>未脱单：${data.unmatchedCount || 0}<br/>脱单率：${data.matchedRate || 0}%`
          }

          return params.name || '未知区域'
        } catch (error) {
          console.warn('Tooltip error:', error)

          return params.name || '未知区域'
        }
      },
    },
    geo: {
      map: 'china',
      roam: true, // 禁用geo的缩放，由map series控制
      zoom: 1, // 初始缩放级别
      center: [105, 35], // 初始中心点
      show: true,
      itemStyle: {
        areaColor: '#e6f7ff',
        borderColor: '#1890ff',
      },
      label: {
        show: false,
        fontSize: 12,
        position: 'top',
      },
      tooltip: {
        formatter(params) {
          const data = cityData.value.find((city) => city.name.includes(params.name)) || {}

          return `${params.name}<br/>单身人口：${data.singleCount || 0}<br/>已脱单：${data.matchedCount || 0}<br/>未脱单：${data.unmatchedCount || 0}<br/>脱单率：${data.matchedRate || 0}%`
        },
      },
      emphasis: {
        label: {
          show: true,
          textStyle: {
            color: '#1890ff',
          },
        },
      },
    },
    series: [
      // 北京到上海经过武汉的飞线
      {
        name: '北京-武汉-上海飞线',
        type: 'lines',
        zlevel: 2,
        effect: {
          show: false,
          symbol: 'arrow',
          symbolSize: 6,
          period: 3,
        },
        lineStyle: {
          normal: {
            color: '#1890ff',
            width: 2,
            opacity: 0.8,
            curveness: 0.2,
          },
        },
        data: [
          // 北京到武汉
          [
            { name: '北京', coord: cityCoordinates['北京'] },
            { name: '武汉', coord: cityCoordinates['武汉'] },
          ],
          // 武汉到上海
          [
            { name: '武汉', coord: cityCoordinates['武汉'] },
            { name: '上海', coord: cityCoordinates['上海'] },
          ],
        ],
      },
      // 北京-武汉-上海飞线的飞机动画段1（北京到武汉）
      {
        name: '北京-武汉飞线动画',
        type: 'lines',
        zlevel: 3,
        effect: {
          show: false, // 初始隐藏
          symbol: planeBase64Image.value.startsWith('data:image')
            ? `image://${planeBase64Image.value}`
            : planeBase64Image.value,
          symbolSize: 10,
          period: 4, // 动画周期
          loop: false,
        },
        lineStyle: {
          normal: {
            color: '#1890ff',
            width: 2,
            opacity: 0,
            curveness: 0.2,
          },
        },
        data: [
          [
            { name: '北京', coord: cityCoordinates['北京'] },
            { name: '武汉', coord: cityCoordinates['武汉'] },
          ],
        ],
      },
      // 北京-武汉-上海飞线的飞机动画段2（武汉到上海）
      {
        name: '武汉-上海飞线动画',
        type: 'lines',
        zlevel: 3,
        effect: {
          show: false, // 初始隐藏
          symbol: planeBase64Image.value.startsWith('data:image')
            ? `image://${planeBase64Image.value}`
            : planeBase64Image.value,
          symbolSize: 10,
          period: 4, // 动画周期
          loop: false,
        },
        lineStyle: {
          normal: {
            color: '#1890ff',
            width: 2,
            opacity: 0,
            curveness: 0.2,
          },
        },
        data: [
          [
            { name: '武汉', coord: cityCoordinates['武汉'] },
            { name: '上海', coord: cityCoordinates['上海'] },
          ],
        ],
      },
      // 昆明到贵阳的线
      {
        name: '昆明-贵阳线',
        type: 'lines',
        zlevel: 2,
        // effect: {
        //   show: true,
        //   symbol: planeBase64Image.value.startsWith('data:image') ? `image://${planeBase64Image.value}` : planeBase64Image.value,
        //   symbolSize: 6,
        //   period: 5, // 与动画控制逻辑时间匹配
        //   loop: false
        // },
        lineStyle: {
          normal: {
            color: '#52c41a',
            width: 2.5,
            opacity: 0.7,
            curveness: 0.15,
            type: 'dashed',
          },
        },
        data: [
          [
            { name: '昆明', coord: cityCoordinates['昆明'] },
            { name: '贵阳', coord: cityCoordinates['贵阳'] },
          ],
        ],
      },
      {
        name: '昆明-贵阳线2',
        type: 'lines',
        zlevel: 2,
        effect: {
          show: true,
          symbol: planeBase64Image.value.startsWith('data:image')
            ? `image://${planeBase64Image.value}`
            : planeBase64Image.value,
          symbolSize: 6,
          period: 5, // 与动画控制逻辑时间匹配
          loop: false,
        },
        lineStyle: {
          normal: {
            color: '#52c41a',
            width: 2.5,
            opacity: 0,
            curveness: 0.15,
            type: 'dashed',
          },
        },
        data: [
          [
            { name: '昆明', coord: cityCoordinates['昆明'] },
            { name: '贵阳', coord: cityCoordinates['贵阳'] },
          ],
        ],
      },
      // 贵阳到成都的线
      {
        name: '贵阳-成都线',
        type: 'lines',
        zlevel: 2,
        // effect: {
        //   show: false, // 初始隐藏
        //   symbol: planeBase64Image.value.startsWith('data:image') ? `image://${planeBase64Image.value}` : planeBase64Image.value,
        //   symbolSize: 6,
        //   period: 5,
        //   loop: false
        // },
        lineStyle: {
          normal: {
            color: '#52c41a',
            width: 2.5,
            opacity: 0.7,
            curveness: 0.15,
            type: 'dashed',
          },
        },
        data: [
          [
            { name: '贵阳', coord: cityCoordinates['贵阳'] },
            { name: '成都', coord: cityCoordinates['成都'] },
          ],
        ],
      },
      {
        name: '贵阳-成都线2',
        type: 'lines',
        zlevel: 2,
        effect: {
          show: false, // 初始隐藏
          symbol: planeBase64Image.value.startsWith('data:image')
            ? `image://${planeBase64Image.value}`
            : planeBase64Image.value,
          symbolSize: 6,
          period: 5,
          loop: false,
        },
        lineStyle: {
          normal: {
            color: '#52c41a',
            width: 2.5,
            opacity: 0,
            curveness: 0.15,
            type: 'dashed',
          },
        },
        data: [
          [
            { name: '贵阳', coord: cityCoordinates['贵阳'] },
            { name: '成都', coord: cityCoordinates['成都'] },
          ],
        ],
      },
      {
        name: '城市点',
        type: 'scatter',
        coordinateSystem: 'geo',
        data: scatterData,
        symbolSize(data) {
          // 根据单身人口数量动态调整大小
          return Math.max(10, Math.min(30, data[2] / 20))
        },
        itemStyle: {
          color(params) {
            try {
              // 安全地获取和处理脱单率
              const data = params.data || {}
              const rate = parseFloat(data.matchedRate) || 0

              if (rate > 50) return '#67c23a' // 高脱单率
              if (rate > 40) return '#e6a23c' // 中等脱单率

              return '#f56c6c' // 低脱单率
            } catch (error) {
              console.warn('Color function error:', error)

              return '#4096ff' // 默认颜色
            }
          },
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: '{b}',
          fontSize: 12,
          position: 'top',
        },
        emphasis: {
          itemStyle: {
            color: '#ff7875',
            shadowBlur: 10,
            shadowColor: '#ff4d4f',
          },
        },
      },
    ],
  }

  console.log('Setting chart option...')
  mapChart.setOption(option)
  console.log('Map initialized successfully')

  // 动画路径数据存储数组 - 支持后续通过push动态添加新路径
  const animationPaths = [
    // {
    //   name: '昆明-贵阳-成都',
    //   segments: [
    //     { name: '昆明-贵阳线2', duration: 5000 },
    //     { name: '贵阳-成都线2', duration: 5000 }
    //   ]
    // },
    // {
    //   name: '北京-武汉-上海',
    //   segments: [
    //     { name: '北京-武汉飞线动画', duration: 4000 },
    //     { name: '武汉-上海飞线动画', duration: 4000 }
    //   ]
    // }
  ]

  // 封装的动画控制函数
  const animateFlight = (pathData) => {
    // 内部递归函数，处理动画分段
    const animateSegment = (segmentIndex) => {
      // 构建当前帧的配置
      const seriesConfig = []

      // 隐藏所有该路径的动画段
      pathData.segments.forEach((segment, idx) => {
        seriesConfig.push({
          name: segment.name,
          effect: { show: idx === segmentIndex },
        })
      })

      // 应用当前帧配置
      mapChart.setOption({ series: seriesConfig })

      // 获取当前段的持续时间
      const currentSegment = pathData.segments[segmentIndex]

      // 安排下一帧或重新开始循环
      setTimeout(() => {
        // 计算下一段索引，如果是最后一段则回到第一段开始循环
        const nextSegmentIndex = (segmentIndex + 1) % pathData.segments.length

        animateSegment(nextSegmentIndex)
      }, currentSegment.duration)
    }

    // 从第一段开始动画
    animateSegment(0)
  }

  // 启动所有已配置路径的动画
  animationPaths.forEach((path) => {
    animateFlight(path)
  })

  // 公开一个方法，允许外部或后续代码通过push添加新的动画路径
  // 示例：addAnimationPath({
  //   name: '新路径名称',
  //   segments: [
  //     { name: '段1名称', duration: 4000 },
  //     { name: '段2名称', duration: 4000 }
  //   ]
  // });
  const addAnimationPath = (pathData) => {
    if (
      pathData &&
      pathData.segments &&
      Array.isArray(pathData.segments) &&
      pathData.segments.length > 0
    ) {
      // 使用push方式添加新路径
      animationPaths.push(pathData)
      // 启动新添加路径的动画
      animateFlight(pathData)
      console.log(`添加了新的动画路径: ${pathData.name}`)
    }
  }

  // 可以将addAnimationPath方法暴露给外部使用
  // 例如通过ref或其他方式暴露给父组件

  // 添加点击事件处理
  mapChart.on('click', (params) => {
    console.log('Clicked params:', params)
    if (params.data) {
      selectedCity.value = params.data
    }
  })
}

// 重置选中的城市
const resetSelectedCity = () => {
  selectedCity.value = null
}

// 响应窗口大小变化
const handleResize = () => {
  if (mapChart) {
    mapChart.resize()
  }
}

onMounted(async () => {
  try {
    await initMap()
  } catch (error) {
    console.error('Failed to initialize map:', error)
  }
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (mapChart) {
    mapChart.dispose()
    mapChart = null
  }
})
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-header {
  margin-bottom: 20px;
}

.dashboard-header h2 {
  color: #262626;
  font-size: 24px;
  font-weight: 600;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgb(0 0 0 / 15%);
}

.stat-card.success .stat-number {
  color: #52c41a;
}

.stat-card.warning .stat-number {
  color: #faad14;
}

.stat-card.info .stat-number {
  color: #1890ff;
}

.stat-number {
  font-size: 32px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #8c8c8c;
}

.map-container {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
  padding: 20px;
  margin-bottom: 30px;
}

.china-map {
  width: 100%;
  height: 600px;
}

.city-detail {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
  padding: 20px;
  margin-top: 20px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.detail-header h3 {
  color: #262626;
  font-size: 18px;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #8c8c8c;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f5f5f5;
  color: #595959;
}

.detail-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
}

.detail-label {
  font-size: 14px;
  color: #8c8c8c;
}

.detail-value {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}

.detail-value.success {
  color: #52c41a;
}

.detail-value.warning {
  color: #faad14;
}

.detail-value.info {
  color: #1890ff;
}
</style>
