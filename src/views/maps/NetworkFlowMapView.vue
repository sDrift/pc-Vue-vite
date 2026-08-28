<template>
  <div class="network-flow-map-view">
    <div class="page-header">
      <h1>上海市网络流量监测</h1>
      <p>展示各省市与上海之间的网络流量数据，支持时间轴切换查看2020年1-6月数据</p>
    </div>
    <div class="map-container">
      <NetworkFlowMap />
    </div>
  </div>
</template>

<script setup>
import NetworkFlowMap from '@/components/NetworkFlowMap.vue';
</script>

<style scoped>
.network-flow-map-view {
  width: 100%;
  height: 100%;
  padding: 20px;
  box-sizing: border-box;
  background-color: #031525;
}

.page-header {
  margin-bottom: 20px;
  color: #fff;
}

.page-header h1 {
  font-size: 28px;
  margin-bottom: 10px;
  font-weight: 500;
}

.page-header p {
  font-size: 14px;
  color: #aaa;
  margin: 0;
}

.map-container {
  width: 100%;
  height: calc(100% - 80px);
  background-color: #031525;
  border-radius: 8px;
  overflow: hidden;
}
</style>