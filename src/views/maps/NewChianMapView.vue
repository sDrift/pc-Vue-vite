<template>
  <div class="new-china-map-view">
    <h1 class="page-title">新版中国地图</h1>
    <NewChianMap />
  </div>
</template>

<script>
import NewChianMap from '@/components/NewChinaMap.vue'

export default {
  name: 'NewChianMapView',
  components: {
    NewChianMap,
  },
}
</script>

<style scoped>
.new-china-map-view {
  padding: 20px;
}

.page-title {
  text-align: center;
  margin-bottom: 20px;
  font-size: 24px;
  color: #333;
}
</style>
