<template>
  <div class="ol-map-demo">
    <h2>OLMap 共用方法演示</h2>
    
    <div class="demo-controls">
      <h3>点位操作</h3>
      <button @click="addDemoMarker">添加点位</button>
      <button @click="removeDemoMarker">移除点位</button>
      <button @click="clearAllMarkers">清除所有点位</button>
      
      <h3>遮罩层操作</h3>
      <button @click="addDemoMask">添加遮罩层</button>
      <button @click="toggleDemoMask">切换遮罩显示</button>
      
      <h3>飞线操作</h3>
      <button @click="addDemoFlightPath">添加飞线</button>
      <button @click="removeDemoFlightPath">移除飞线</button>
      
      <h3>地图控制</h3>
      <button @click="setCenterToBeijing">定位北京</button>
      <button @click="zoomIn">放大</button>
      <button @click="zoomOut">缩小</button>
    </div>
    
    <div class="event-log">
      <h3>事件日志</h3>
      <ul>
        <li v-for="(log, index) in eventLogs" :key="index" :class="log.type">
          {{ log.time }} - {{ log.message }}
        </li>
      </ul>
    </div>
    
    <OLMap ref="mapRef" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import OLMap from "./OLMap.vue";
import hainanGeoJSON from "./json/海南省.json";

const mapRef = ref(null);
const eventLogs = ref([]);
let demoMaskLayer = null;
let unsubscribeClick = null;
let unsubscribeMove = null;
let unsubscribeZoom = null;
let unsubscribeDragEnd = null;

const addLog = (type, message) => {
  const time = new Date().toLocaleTimeString();
  eventLogs.value.unshift({ time, type, message });
  if (eventLogs.value.length > 20) {
    eventLogs.value.pop();
  }
};

const waitForMapReady = async () => {
  return new Promise((resolve) => {
    const check = () => {
      if (mapRef.value && mapRef.value.isReady()) {
        resolve();
      } else {
        setTimeout(check, 100);
      }
    };
    check();
  });
};

const addDemoMarker = async () => {
  await waitForMapReady();
  const markerId = mapRef.value.addMarker({
    id: "demo_marker",
    longitude: 116.4074,
    latitude: 39.9042,
    title: "北京",
    color: "#FF5722",
    size: 16,
    icon: "📍",
  });
  addLog("success", `点位已添加: ${markerId}`);
};

const removeDemoMarker = async () => {
  await waitForMapReady();
  mapRef.value.removeMarker("demo_marker");
  addLog("info", "点位已移除");
};

const clearAllMarkers = async () => {
  await waitForMapReady();
  mapRef.value.clearMarkers();
  addLog("info", "所有点位已清除");
};

const addDemoMask = async () => {
  await waitForMapReady();
  if (demoMaskLayer) {
    mapRef.value.removeMaskLayer(demoMaskLayer);
  }
  const result = mapRef.value.addMaskLayer(hainanGeoJSON, {
    fillColor: "rgba(0, 150, 255, 0.3)",
    strokeColor: "#0096FF",
    strokeWidth: 3,
    zIndex: 5,
  });
  demoMaskLayer = result.layer;
  addLog("success", "遮罩层已添加（海南区域）");
};

const toggleDemoMask = async () => {
  await waitForMapReady();
  if (demoMaskLayer) {
    const visible = demoMaskLayer.getVisible();
    mapRef.value.toggleMask(demoMaskLayer, !visible);
    addLog("info", `遮罩层${!visible ? "显示" : "隐藏"}`);
  } else {
    addLog("warning", "请先添加遮罩层");
  }
};

const addDemoFlightPath = async () => {
  await waitForMapReady();
  mapRef.value.createCustomFlightPath(
    [116.4074, 39.9042], // 北京作为起点
    [
      { name: "上海", coords: [121.4737, 31.2304] },
      { name: "广州", coords: [113.2644, 23.1291] },
      { name: "深圳", coords: [114.0579, 22.5431] },
      { name: "杭州", coords: [120.1552, 30.2741] },
    ],
    {
      duration: 4000,
      lineWidth: 5,
      offsetFactor: 0.4,
      animate: true,
    }
  );
  addLog("success", "飞线已添加（北京到各城市）");
};

const removeDemoFlightPath = async () => {
  await waitForMapReady();
  mapRef.value.removeFlightPath();
  addLog("info", "所有飞线已移除");
};

const setCenterToBeijing = async () => {
  await waitForMapReady();
  mapRef.value.setCenter(116.4074, 39.9042);
  mapRef.value.setZoom(10);
  addLog("info", "已定位到北京");
};

const zoomIn = async () => {
  await waitForMapReady();
  const currentZoom = mapRef.value.mapInstance.getView().getZoom();
  mapRef.value.setZoom(currentZoom + 1);
  addLog("info", `放大到级别 ${currentZoom + 1}`);
};

const zoomOut = async () => {
  await waitForMapReady();
  const currentZoom = mapRef.value.mapInstance.getView().getZoom();
  mapRef.value.setZoom(currentZoom - 1);
  addLog("info", `缩小到级别 ${currentZoom - 1}`);
};

onMounted(async () => {
  await waitForMapReady();
  
  // 注册地图事件监听
  unsubscribeClick = mapRef.value.onMapClick((data) => {
    addLog("click", `点击: 经度 ${data.longitude.toFixed(4)}, 纬度 ${data.latitude.toFixed(4)}`);
  });
  
  unsubscribeMove = mapRef.value.onMapMove((data) => {
    // 鼠标移动事件频繁，只在控制台输出
    console.log("鼠标移动:", data.longitude, data.latitude);
  });
  
  unsubscribeZoom = mapRef.value.onMapZoom((data) => {
    addLog("zoom", `缩放级别: ${data.zoom.toFixed(1)}`);
  });
  
  unsubscribeDragEnd = mapRef.value.onMapDragEnd((data) => {
    addLog("drag", `拖拽结束: 中心经度 ${data.longitude.toFixed(4)}, 纬度 ${data.latitude.toFixed(4)}`);
  });
  
  addLog("info", "地图事件监听已注册");
});

onUnmounted(() => {
  if (unsubscribeClick) unsubscribeClick();
  if (unsubscribeMove) unsubscribeMove();
  if (unsubscribeZoom) unsubscribeZoom();
  if (unsubscribeDragEnd) unsubscribeDragEnd();
});
</script>

<style scoped>
.ol-map-demo {
  display: flex;
  gap: 20px;
  padding: 20px;
}

.demo-controls {
  width: 200px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.demo-controls h3 {
  margin: 10px 0 5px;
  font-size: 14px;
  color: #666;
  border-bottom: 1px solid #eee;
  padding-bottom: 5px;
}

.demo-controls button {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.demo-controls button:hover {
  background: #f5f5f5;
  border-color: #ccc;
}

.event-log {
  width: 300px;
  background: #f9f9f9;
  border-radius: 8px;
  padding: 15px;
}

.event-log h3 {
  margin: 0 0 10px;
  font-size: 14px;
}

.event-log ul {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 300px;
  overflow-y: auto;
}

.event-log li {
  padding: 5px 0;
  font-size: 12px;
  border-bottom: 1px solid #eee;
}

.event-log li:last-child {
  border-bottom: none;
}

.event-log li.success {
  color: #2ecc71;
}

.event-log li.info {
  color: #3498db;
}

.event-log li.warning {
  color: #f39c12;
}

.event-log li.click {
  color: #9b59b6;
}

.event-log li.zoom {
  color: #1abc9c;
}

.event-log li.drag {
  color: #e74c3c;
}
</style>
