<template>
  <div class="three-d-pie-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>自定义3D饼图展示</span>
        </div>
      </template>
      <div class="chart-wrapper">
        <three-d-pie-h />
      </div>
    </el-card>
  </div>
</template>

<script>
import ThreeDPieH from '@/other/3DpieH.vue';

export default {
  name: 'ThreeDPieChartView',
  components: {
    ThreeDPieH
  },
  data() {
    return {
    };
  },
  mounted() {
    // 组件挂载后的逻辑
  }
};
</script>

<style scoped>
.three-d-pie-container {
  padding: 20px;
  height: 100%;
}

.box-card {
  height: 100%;
  background-color: #0a1931;
  border: 1px solid #1e3a8a;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #ffffff;
  font-size: 18px;
  font-weight: 500;
}

.chart-wrapper {
  width: 100%;
  height: 600px;
  position: relative;
  margin-top: 20px;
}
</style>