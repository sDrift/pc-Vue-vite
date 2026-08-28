<template>
  <div class="map-demo-container">
    <div class="demo-header">
      <h2>OpenLayers 地图示例</h2>
      <p>这个示例展示了如何在Vue 3项目中集成和使用OpenLayers地图</p>
    </div>
    
    <div class="demo-content">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>交互式地图</span>
            <div class="map-controls">
              <el-button type="primary" size="small" @click="centerToBeijing">定位北京</el-button>
              <el-button type="primary" size="small" @click="centerToShanghai">定位上海</el-button>
              <el-button type="primary" size="small" @click="zoomIn">放大</el-button>
              <el-button type="primary" size="small" @click="zoomOut">缩小</el-button>
            </div>
          </div>
        </template>
        <OLMap ref="mapComponent" />
      </el-card>
      
      <el-card class="info-card">
        <template #header>
          <span>地图说明</span>
        </template>
        <div class="map-info">
          <h3>OpenLayers 地图实现说明</h3>
          <ul>
            <li>使用OpenStreetMap作为基础地图图层</li>
            <li>支持地图的平移、缩放、旋转等交互操作</li>
            <li>提供了API接口以便于父组件控制地图</li>
            <li>自动响应窗口大小变化</li>
            <li>支持地图点击事件处理</li>
          </ul>
          <div class="tips">
            <el-alert title="提示" type="info" :closable="false">
              点击上方按钮可测试地图的基本功能，如中心点切换和缩放控制。
            </el-alert>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue';
import OLMap from '@/components/OLMap.vue';

const mapComponent = ref(null);

// 定位到北京
const centerToBeijing = () => {
  if (mapComponent.value && typeof mapComponent.value.setCenter === 'function') {
    mapComponent.value.setCenter(116.397228, 39.9075);
  }
};

// 定位到上海
const centerToShanghai = () => {
  if (mapComponent.value && typeof mapComponent.value.setCenter === 'function') {
    mapComponent.value.setCenter(121.473701, 31.230416);
  }
};

// 放大地图
const zoomIn = () => {
  if (mapComponent.value && typeof mapComponent.value.setZoom === 'function') {
    // 先获取当前缩放级别，然后增加1
    const currentZoom = mapComponent.value.mapInstance?.getView()?.getZoom() || 10;
    mapComponent.value.setZoom(currentZoom + 1);
  }
};

// 缩小地图
const zoomOut = () => {
  if (mapComponent.value && typeof mapComponent.value.setZoom === 'function') {
    // 先获取当前缩放级别，然后减少1
    const currentZoom = mapComponent.value.mapInstance?.getView()?.getZoom() || 10;
    mapComponent.value.setZoom(currentZoom - 1);
  }
};

// 组件卸载时清理地图资源
onUnmounted(() => {
  if (mapComponent.value) {
    // 安全地调用cleanup方法
    if (typeof mapComponent.value.cleanup === 'function') {
      mapComponent.value.cleanup();
    }
  }
});
</script>

<style scoped>
.map-demo-container {
  padding: 20px;
  height: 100%;
  box-sizing: border-box;
}

.demo-header {
  margin-bottom: 20px;
  text-align: center;
}

.demo-header h2 {
  margin: 0 0 10px 0;
  color: #303133;
}

.demo-header p {
  margin: 0;
  color: #606266;
}

.demo-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: calc(100% - 80px);
}

.el-card {
  height: fit-content;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.map-controls {
  display: flex;
  gap: 10px;
}

.info-card {
  margin-top: 20px;
}

.map-info {
  padding: 10px 0;
}

.map-info h3 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #303133;
}

.map-info ul {
  margin: 0 0 20px 0;
  padding-left: 20px;
}

.map-info li {
  margin-bottom: 8px;
  color: #606266;
  line-height: 1.5;
}

.tips {
  margin-top: 15px;
}
</style>