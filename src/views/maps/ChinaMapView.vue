<template>
  <div class="china-map-view">
    <h1 class="page-title">中国地图数据可视化</h1>
    <ChinaMap />
  </div>
</template>

<script>
import ChinaMap from '@/components/ChinaMap.vue'

export default {
  name: 'ChinaMapView',
  components: {
    ChinaMap,
  },
}
</script>

<style scoped>
.china-map-view {
  padding: 20px;
}

.page-title {
  margin-bottom: 20px;
  color: #333;
  font-size: 24px;
  text-align: center;
}
</style>
