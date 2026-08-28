<template>
  <div class="china-map-view">
    <h1 class="page-title">中国地图数据可视化</h1>
    <ChinaMap />
  </div>
</template>

<script>
import ChinaMap from '@/components/ChinaMap.vue';

export default {
  name: 'ChinaMapView',
  components: {
    ChinaMap
  }
};
</script>

<style scoped>
.china-map-view {
  padding: 20px;
}

.page-title {
  text-align: center;
  margin-bottom: 20px;
  font-size: 24px;
  color: #333;
}
</style>