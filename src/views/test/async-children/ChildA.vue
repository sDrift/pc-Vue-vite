<template>
  <div class="child child-a">
    <div class="child-header">
      <span class="tag">组件 A</span>
      <span class="load-time">⏱ 加载完成于 {{ loadTime }} ms</span>
    </div>
    <h2>📊 数据概览面板</h2>
    <p>这是子组件 A —— 模拟一个数据概览页</p>

    <div class="metrics">
      <div class="metric-card">
        <div class="metric-value">{{ stats.users }}</div>
        <div class="metric-label">用户数</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">{{ stats.orders }}</div>
        <div class="metric-label">订单数</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">¥{{ stats.revenue }}</div>
        <div class="metric-label">营收</div>
      </div>
    </div>

    <div class="hint">
      💡 你能在浏览器 Network 面板里看到
      <code>ChildA.[hash].js</code>
      是在点击按钮后才下载的
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const loadTime = ref(0)
const stats = ref({
  users: 0,
  orders: 0,
  revenue: 0,
})

onMounted(() => {
  const t = performance.now()

  console.log('[ChildA] 已挂载，时间戳:', t.toFixed(2))
  loadTime.value = t.toFixed(0)

  // 假装有接口请求 + 数字滚动动画
  const target = { users: 1280, orders: 356, revenue: 98500 }
  const duration = 800
  const start = performance.now()
  const tick = (now) => {
    const p = Math.min(1, (now - start) / duration)

    stats.value.users = Math.floor(target.users * p)
    stats.value.orders = Math.floor(target.orders * p)
    stats.value.revenue = Math.floor(target.revenue * p)
    if (p < 1) requestAnimationFrame(tick)
  }

  requestAnimationFrame(tick)
})
</script>

<style scoped>
.child {
  padding: 24px;
  border-radius: 10px;
  animation: fade-in 0.35s ease;
}

.child-a {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border: 1px solid #90caf9;
}

.child-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.tag {
  padding: 2px 10px;
  background: #1976d2;
  color: #fff;
  border-radius: 4px;
  font-size: 12px;
}

.load-time {
  font-size: 12px;
  color: #546e7a;
}

h2 {
  margin: 0 0 8px;
  color: #0d47a1;
}

p {
  margin: 0 0 18px;
  color: #1565c0;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.metric-card {
  background: rgb(255 255 255 / 70%);
  padding: 16px;
  border-radius: 8px;
  text-align: center;
}

.metric-value {
  font-size: 26px;
  font-weight: 700;
  color: #0d47a1;
}

.metric-label {
  margin-top: 4px;
  font-size: 12px;
  color: #546e7a;
}

.hint {
  margin-top: 12px;
  padding: 10px 14px;
  background: rgb(255 255 255 / 50%);
  border-radius: 6px;
  font-size: 13px;
  color: #37474f;
}

.hint code {
  background: #fff;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 12px;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
