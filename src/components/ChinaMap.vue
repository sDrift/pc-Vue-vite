<template>
  <div class="china-map-container">
    <h2>中国地图展示</h2>
    <div class="map-wrapper">
      <div id="chinaMap" ref="chinaMap" class="china-map"></div>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'

import chinaMapData from './json/china.json'

export default {
  name: 'ChinaMap',
  data() {
    return {
      chartInstance: null,
      nanhaiChartInstance: null,
      mapProvinceNames: [],
      // 模拟数据，实际应用中可以从API获取
      provinceData: [
        { name: '北京', value: 300 },
        { name: '天津', value: 200 },
        { name: '河北', value: 180 },
        { name: '山西', value: 150 },
        { name: '内蒙古', value: 120 },
        { name: '辽宁', value: 220 },
        { name: '吉林', value: 190 },
        { name: '黑龙江', value: 160 },
        { name: '上海', value: 320 },
        { name: '江苏', value: 280 },
        { name: '浙江', value: 310 },
        { name: '安徽', value: 210 },
        { name: '福建', value: 240 },
        { name: '江西', value: 170 },
        { name: '山东', value: 290 },
        { name: '河南', value: 260 },
        { name: '湖北', value: 230 },
        { name: '湖南', value: 250 },
        { name: '广东', value: 330 },
        { name: '广西', value: 140 },
        { name: '海南', value: 100 },
        { name: '重庆', value: 190 },
        { name: '四川', value: 200 },
        { name: '贵州', value: 130 },
        { name: '云南', value: 160 },
        { name: '西藏', value: 80 },
        { name: '陕西', value: 180 },
        { name: '甘肃', value: 110 },
        { name: '青海', value: 70 },
        { name: '宁夏', value: 90 },
        { name: '新疆', value: 100 },
        { name: '香港', value: 150 },
        { name: '澳门', value: 60 },
        { name: '台湾', value: 120 },
      ],
    }
  },
  mounted() {
    this.initChart()
    window.addEventListener('resize', this.handleResize)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize)
    this.destroyCharts()
  },
  methods: {
    initChart() {
      // 注册中国地图和海南省地图
      echarts.registerMap('china', chinaMapData)

      // 初始化主地图实例
      this.chartInstance = echarts.init(this.$refs.chinaMap)

      // 创建省份名称映射
      const nameMap = {
        北京市: '北京',
        天津市: '天津',
        河北省: '河北',
        山西省: '山西',
        内蒙古自治区: '内蒙古',
        辽宁省: '辽宁',
        吉林省: '吉林',
        黑龙江省: '黑龙江',
        上海市: '上海',
        江苏省: '江苏',
        浙江省: '浙江',
        安徽省: '安徽',
        福建省: '福建',
        江西省: '江西',
        山东省: '山东',
        河南省: '河南',
        湖北省: '湖北',
        湖南省: '湖南',
        广东省: '广东',
        广西壮族自治区: '广西',
        海南省: '海南',
        重庆市: '重庆',
        四川省: '四川',
        贵州省: '贵州',
        云南省: '云南',
        西藏自治区: '西藏',
        陕西省: '陕西',
        甘肃省: '甘肃',
        青海省: '青海',
        宁夏回族自治区: '宁夏',
        新疆维吾尔自治区: '新疆',
        香港特别行政区: '香港',
        澳门特别行政区: '澳门',
        台湾省: '台湾',
      }

      // 设置主地图配置项
      const mainOption = {
        title: {
          text: '中国地图数据可视化',
          left: 'center',
          textStyle: {
            fontSize: 20,
          },
        },
        tooltip: {
          trigger: 'item',
          // formatter: '{b}: {c}'
        },
        visualMap: {
          min: 50,
          max: 350,
          text: ['高', '低'],
          realtime: false,
          calculable: true,
          inRange: {
            color: ['#e0f3ff', '#0050b3'],
          },
          left: 'left',
        },
        series: [
          {
            name: '数据',
            type: 'map',
            map: 'china',
            roam: true,
            label: {
              show: true,
              fontSize: 10,
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 12,
                fontWeight: 'bold',
              },
              itemStyle: {
                areaColor: '#ffcc99',
              },
            },
            itemStyle: {
              normal: {
                areaColor: '#1890ff',
                borderColor: '#001529',
                borderWidth: 0.5,
              },
            },
            nameMap,
            data: this.provinceData,
          },
        ],
      }

      // 设置图表配置项
      this.chartInstance.setOption(mainOption)
    },
    handleResize() {
      if (this.chartInstance) {
        this.chartInstance.resize()
      }
    },
    destroyCharts() {
      if (this.chartInstance) {
        this.chartInstance.dispose()
        this.chartInstance = null
      }
    },
  },
}
</script>

<style scoped>
.china-map-container {
  width: 100%;
  height: 100%;
}

.map-wrapper {
  position: relative;
  width: 100%;
  height: 600px;
}

.china-map {
  width: 100%;
  height: 100%;
}

.nanhai-map {
  position: absolute;
  right: 20px;
  bottom: 20px;
  width: 200px;
  height: 240px;
  border: 1px solid #ccc;
  box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
}

.debug-info {
  margin-top: 10px;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
}
</style>
