<template>
  <div class="network-flow-map">
    <div id="chart-panel" ref="chartPanel" class="chart-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import * as echarts from 'echarts';
import chinaMapData from './json/china.json';

const chartPanel = ref(null);
let myChart = null;

// 地理坐标映射
const geoCoordMap = {
  "江苏": [118.8062, 31.9208],
  '黑龙江': [127.9688, 45.368],
  '内蒙古': [110.3467, 41.4899],
  "吉林": [125.8154, 44.2584],
  '北京市': [116.4551, 40.2539],
  "辽宁": [123.1238, 42.1216],
  "河北": [114.4995, 38.1006],
  "天津": [117.4219, 39.4189],
  "山西": [112.3352, 37.9413],
  "陕西": [109.1162, 34.2004],
  "甘肃": [103.5901, 36.3043],
  "宁夏": [106.3586, 38.1775],
  "青海": [101.4038, 36.8207],
  "新疆": [87.9236, 43.5883],
  "四川": [103.9526, 30.7617],
  "重庆": [108.384366, 30.439702],
  "山东": [117.1582, 36.8701],
  "河南": [113.4668, 34.6234],
  "安徽": [117.29, 32.0581],
  "湖北": [114.3896, 30.6628],
  "浙江": [119.5313, 29.8773],
  "福建": [119.4543, 25.9222],
  "江西": [116.0046, 28.6633],
  "湖南": [113.0823, 28.2568],
  "贵州": [106.6992, 26.7682],
  "云南": [102.9199, 25.4663],
  "广东": [113.12244, 23.009505],
  "广西": [108.479, 23.1152],
  "海南": [110.3893, 19.8516],
  '上海': [121.4648, 31.2891],
  "西藏": [91.11, 29.97],
};

// 模拟数据
const monthlyData = [
  {
    '江苏':10041,
    '黑龙江':4093,
    '内蒙古':1157,
    '吉林':4903,
    '北京市':2667,
    '辽宁':8331,
    '河北':23727,
    '天津':681,
    '山西':5352,
    '陕西':38,
    '甘肃':77,
    '宁夏':65,
    '青海':10,
    '新疆':22000,
    '四川':309,
    '重庆':77,
    '山东':21666,
    '河南':15717,
    '安徽':15671,
    '湖北':3714,
    '浙江':3141,
    '福建':955,
    '江西':4978,
    '湖南':778,
    '贵州':33,
    '云南':149,
    '广东':1124,
    '广西':125,
    '海南':7,
    '上海':2155,
    '西藏':0
  },
  {
    '江苏':159,
    '黑龙江':5,
    '内蒙古':54,
    '吉林':10,
    '北京市':0,
    '辽宁':0,
    '河北':1679,
    '天津':1,
    '山西':2698,
    '陕西':1744,
    '甘肃':362,
    '宁夏':429,
    '青海':122,
    '新疆':731,
    '四川':3925,
    '重庆':1480,
    '山东':79,
    '河南':1017,
    '安徽':208,
    '湖北':1209,
    '浙江':1418,
    '福建':1237,
    '江西':1004,
    '湖南':1511,
    '贵州':345,
    '云南':1429,
    '广东':2242,
    '广西':2271,
    '海南':59,
    '上海':8,
    '西藏':0
  },
  {
    '江苏':11788,
    '黑龙江':1944,
    '内蒙古':2954,
    '吉林':3482,
    '北京市':1808,
    '辽宁':5488,
    '河北':27035,
    '天津':2270,
    '山西':13623,
    '陕西':4221,
    '甘肃':754,
    '宁夏':1783,
    '青海':91,
    '新疆':1907,
    '四川':4905,
    '重庆':1420,
    '山东':39781,
    '河南':16154,
    '安徽':7914,
    '湖北':6802,
    '浙江':5812,
    '福建':3345,
    '江西':4996,
    '湖南':5627,
    '贵州':1504,
    '云南':2725,
    '广东':6339,
    '广西':1009,
    '海南':0,
    '上海':1988,
    '西藏':0
  },
  {
    '江苏':10041,
    '黑龙江':4093,
    '内蒙古':1157,
    '吉林':4903,
    '北京市':2667,
    '辽宁':8331,
    '河北':23727,
    '天津':681,
    '山西':5352,
    '陕西':38,
    '甘肃':77,
    '宁夏':65,
    '青海':10,
    '新疆':193,
    '四川':309,
    '重庆':77,
    '山东':21666,
    '河南':15717,
    '安徽':15671,
    '湖北':3714,
    '浙江':3141,
    '福建':955,
    '江西':4978,
    '湖南':778,
    '贵州':33,
    '云南':149,
    '广东':1124,
    '广西':125,
    '海南':7,
    '上海':2155,
    '西藏':0
  },
  {
    '江苏':159,
    '黑龙江':5,
    '内蒙古':54,
    '吉林':10,
    '北京市':0,
    '辽宁':0,
    '河北':1679,
    '天津':1,
    '山西':2698,
    '陕西':1744,
    '甘肃':362,
    '宁夏':429,
    '青海':122,
    '新疆':731,
    '四川':3925,
    '重庆':1480,
    '山东':79,
    '河南':1017,
    '安徽':208,
    '湖北':1209,
    '浙江':1418,
    '福建':1237,
    '江西':1004,
    '湖南':1511,
    '贵州':345,
    '云南':1429,
    '广东':2242,
    '广西':2271,
    '海南':59,
    '上海':8,
    '西藏':0
  },
  {
    '江苏':11788,
    '黑龙江':1944,
    '内蒙古':2954,
    '吉林':3482,
    '北京市':1808,
    '辽宁':5488,
    '河北':27035,
    '天津':2270,
    '山西':13623,
    '陕西':4221,
    '甘肃':754,
    '宁夏':1783,
    '青海':91,
    '新疆':1907,
    '四川':4905,
    '重庆':1420,
    '山东':39781,
    '河南':16154,
    '安徽':7914,
    '湖北':6802,
    '浙江':5812,
    '福建':3345,
    '江西':4996,
    '湖南':5627,
    '贵州':1504,
    '云南':2725,
    '广东':6339,
    '广西':1009,
    '海南':0,
    '上海':1988,
    '西藏':0
  }
];

const colors = ["#1DE9B6", "#EEDD78", "#32C5E9", "#FFDB5C", "#37A2DA", "#04B9FF"];
const year = ["2020-01", "2020-02", "2020-03", "2020-04", "2020-05", "2020-06"];
const geoGpsMap = [121.4648, 31.2891]; // 上海坐标

// 准备地图数据
const prepareMapData = () => {
  const mapData = [];
  const barData = [];
  const categoryData = [];

  for (let i = 0; i < year.length; i++) {
    mapData[i] = [];
    for (const key in geoCoordMap) {
      mapData[i].push({
        "year": year[i],
        "name": key,
        "value": monthlyData[i][key] / 100,
        "value1": monthlyData[i][key] / 100,
      });
    }
  }

  for (let i = 0; i < mapData.length; i++) {
    mapData[i].sort((a, b) => a.value - b.value);
    barData.push([]);
    categoryData.push([]);
    for (let j = 0; j < mapData[i].length; j++) {
      barData[i].push(mapData[i][j].value1);
      categoryData[i].push(mapData[i][j].name);
    }
  }

  return { mapData, barData, categoryData };
};

// 转换数据为地图散点格式
const convertData = (data) => {
  const res = [];
  for (let i = 0; i < data.length; i++) {
    const geoCoord = geoCoordMap[data[i].name];
    if (geoCoord) {
      res.push({
        name: data[i].name,
        value: [geoCoord[0], geoCoord[1], data[i].value]
      });
    }
  }
  return res;
};

// 转换数据为流向线格式
const convertToLineData = (data, gps) => {
  let t = 1; // 流入流出控制
  const res = [];
  for (let i = 0; i < data.length; i++) {
    const dataItem = data[i];
    const toCoord = geoCoordMap[dataItem.name];
    const fromCoord = gps; // 上海
    
    if (fromCoord && toCoord) {
      if (t === 1) {
        res.push([
          { coord: [toCoord[0], toCoord[1]] },
          { coord: [fromCoord[0], fromCoord[1]], value: dataItem.value }
        ]);
      } else {
        res.push([
          { coord: [fromCoord[0], fromCoord[1]], value: dataItem.value },
          { coord: [toCoord[0], toCoord[1]] }
        ]);
      }
    }
  }
  return res;
};

// 创建ECharts配置
const createChartOption = () => {
  const { mapData, barData, categoryData } = prepareMapData();
  let r = 1; // 右侧流入流出文字控制

  const option = {
    timeline: {
      data: year,
      autoPlay: true,
      playInterval: 5000
    },
    baseOption: {
      animation: true,
      grid: {
        right: '2%',
        top: '10%',
        bottom: '10%',
        width: '18%'
      },
      tooltip: {
        trigger: 'axis'
      },
      visualMap: {
        min: 0,
        max: 250,
        left: 'left',
        top: 'bottom',
        text: ['高', '低'],
        calculable: true,
        color: ['#c05050', '#e5cf0d', '#5ab1ef']
      },
      geo: {
        show: true,
        map: 'china',
        roam: true,
        zoom: 1,
        center: [113.83531246, 34.0267395887]
      }
    },
    options: []
  };

  // 为每个时间点创建配置
  for (let n = 0; n < year.length; n++) {
    const statistic_name = `各省${r === 1 ? '流入' : '流出'}流量`;
    option.options.push({
      title: [
        {
          text: '上海市网络流量监测',
          left: '25%',
          top: '1%',
          textStyle: {
            color: '#fff',
            fontSize: 25
          }
        },
        {
          id: 'statistic',
          text: statistic_name,
          left: '75%',
          top: '3%',
          textStyle: {
            color: '#fff',
            fontSize: 16
          }
        }
      ],
      xAxis: {
        type: 'value',
        position: 'top'
      },
      yAxis: {
        type: 'category',
        data: categoryData[n]
      },
      series: [
        // 地图
        {
          type: 'map',
          map: 'china',
          geoIndex: 0,
          roam: false,
          data: mapData[n]
        },
        // 流向线
        {
          type: 'lines',
          zlevel: 2,
          effect: {
            show: true,
            symbol: 'arrow'
          },
          lineStyle: {
            normal: {
              color: colors[n],
              width: 1,
              curveness: 0.3
            }
          },
          data: convertToLineData(mapData[n], geoGpsMap)
        },
        // 柱状图
        {
          type: 'bar',
          zlevel: 1.5,
          data: barData[n]
        }
      ]
    });
    r = r === 0 ? 1 : 0;
  }

  return option;
};

// 初始化图表
const initChart = () => {
  if (!chartPanel.value) return;
  
  myChart = echarts.init(chartPanel.value);
  
  // 注册中国地图
  echarts.registerMap('china', chinaMapData);
  
  // 设置配置项
  const option = createChartOption();
  myChart.setOption(option);
};

// 处理窗口大小变化
const handleResize = () => {
  if (myChart) {
    myChart.resize();
  }
};

onMounted(() => {
  initChart();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  if (myChart) {
    myChart.dispose();
    myChart = null;
  }
});
</script>

<style scoped>
.network-flow-map {
  width: 100%;
  height: 100%;
}

.chart-container {
  width: 100%;
  height: 600px;
  background-color: #031525;
}
</style>