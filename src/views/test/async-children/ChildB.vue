<template>
  <div class="child child-b">
    <div class="child-header">
      <span class="tag">组件 B</span>
      <span class="load-time">⏱ 加载完成于 {{ loadTime }} ms</span>
    </div>
    <h2>🖼 图片画廊</h2>
    <p>这是子组件 B —— 模拟一个图片画廊</p>

    <div class="gallery">
      <div
        v-for="(c, i) in colors"
        :key="i"
        class="gallery-item"
        :style="{ background: c }"
      >
        <span>#{{ i + 1 }}</span>
      </div>
    </div>

    <div class="hint">
      💡 每次切换到此组件，如果已加载过会直接复用缓存；如果首次点击会看到 chunk 下载
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const loadTime = ref(0);
const colors = [
  'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
  'linear-gradient(135deg, #fdcbf1 0%, #e6dee9 100%)',
  'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
  'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
];

onMounted(() => {
  const t = performance.now();
  console.log('[ChildB] 已挂载，时间戳:', t.toFixed(2));
  loadTime.value = t.toFixed(0);
});
</script>

<style scoped>
.child {
  padding: 24px;
  border-radius: 10px;
  animation: fade-in 0.35s ease;
}
.child-b {
  background: linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%);
  border: 1px solid #f48fb1;
}
.child-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.tag {
  padding: 2px 10px;
  background: #c2185b;
  color: #fff;
  border-radius: 4px;
  font-size: 12px;
}
.load-time {
  font-size: 12px;
  color: #880e4f;
}
h2 { margin: 0 0 8px; color: #880e4f; }
p { margin: 0 0 18px; color: #ad1457; }
.gallery {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}
.gallery-item {
  height: 90px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-size: 18px;
  text-shadow: 0 1px 3px rgba(0,0,0,0.2);
  cursor: pointer;
  transition: transform 0.2s;
}
.gallery-item:hover { transform: scale(1.05); }
.hint {
  margin-top: 12px;
  padding: 10px 14px;
  background: rgba(255,255,255,0.5);
  border-radius: 6px;
  font-size: 13px;
  color: #4a148c;
}
@keyframes fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
