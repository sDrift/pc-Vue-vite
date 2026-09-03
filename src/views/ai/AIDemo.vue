<template>
  <div class="ai-container">
    <!-- 背景装饰 -->
    <div class="background-decorations">
      <div v-for="i in 50" :key="i" class="particle" :style="getParticleStyle(i)"></div>
      <div v-for="i in 20" :key="`line-${i}`" class="vertical-line" :style="getLineStyle(i)"></div>
    </div>

    <!-- AI球体 -->
    <div class="ai-globe-container">
      <div class="ai-globe">
        <!-- 网格线 -->
        <div
          v-for="i in 10"
          :key="`grid-${i}`"
          class="grid-circle"
          :style="{ transform: `rotate(${i * 18}deg)` }"
        ></div>
        <div
          v-for="i in 10"
          :key="`grid-vert-${i}`"
          class="grid-vertical"
          :style="{ transform: `rotate(${i * 18}deg)` }"
        ></div>

        <!-- 连接点 -->
        <div
          v-for="i in 100"
          :key="`node-${i}`"
          class="connection-node"
          :style="getNodeStyle(i)"
        ></div>

        <!-- AI文字 -->
        <div class="ai-text">AI</div>
      </div>

      <!-- 底部发光效果 -->
      <div class="glow-effect"></div>
    </div>

    <!-- 波浪效果 -->
    <div class="wave-container">
      <div class="wave wave-1"></div>
      <div class="wave wave-2"></div>
      <div class="wave wave-3"></div>
    </div>

    <!-- 页面标题和描述 -->
    <div class="page-content">
      <h1 class="page-title">探索人工智能的未来</h1>
      <p class="page-description">
        人工智能正在改变我们的世界，从智能家居到自动驾驶，从医疗诊断到个性化推荐，AI技术的应用无处不在。
        随着技术的不断进步，我们正迈向一个更加智能化的未来。
      </p>

      <!-- 功能卡片 -->
      <div class="feature-cards">
        <div v-for="feature in features" :key="feature.id" class="feature-card">
          <div class="feature-icon">{{ feature.icon }}</div>
          <h3 class="feature-title">{{ feature.title }}</h3>
          <p class="feature-description">{{ feature.description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// 定义功能卡片数据
const features = ref([
  {
    id: 1,
    icon: '🧠',
    title: '机器学习',
    description: '通过数据训练模型，让计算机能够自主学习和决策',
  },
  {
    id: 2,
    icon: '👁️',
    title: '计算机视觉',
    description: '让计算机能够理解和分析图像内容',
  },
  {
    id: 3,
    icon: '💬',
    title: '自然语言处理',
    description: '实现计算机与人类语言的有效交互',
  },
  {
    id: 4,
    icon: '🤖',
    title: '智能机器人',
    description: '结合AI技术的智能机器人系统',
  },
])

// 计算粒子样式
const getParticleStyle = (index) => {
  const size = Math.random() * 4 + 1
  const top = `${Math.random() * 100}%`
  const left = `${Math.random() * 100}%`
  const delay = Math.random() * 5
  const duration = Math.random() * 10 + 5

  return {
    width: `${size}px`,
    height: `${size}px`,
    top,
    left,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
  }
}

// 计算垂直线样式
const getLineStyle = (index) => {
  const height = `${Math.random() * 300 + 50}px`
  const left = `${index * 5}%`
  const delay = Math.random() * 2
  const duration = Math.random() * 5 + 3

  return {
    height,
    left,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
  }
}

// 计算节点样式
const getNodeStyle = (index) => {
  // 使用球体表面的点分布算法
  const phi = Math.acos(-1 + (2 * index) / 100)
  const theta = Math.sqrt(100 * Math.PI) * phi

  const x = Math.cos(theta) * Math.sin(phi)
  const y = Math.sin(theta) * Math.sin(phi)
  const z = Math.cos(phi)

  // 转换为2D坐标
  const radius = 120 // 球体半径
  const center = 150 // 球体中心

  const left = `${center + x * radius}px`
  const top = `${center + y * radius}px`
  const size = Math.random() * 3 + 1
  const opacity = Math.random() * 0.8 + 0.2

  return {
    width: `${size}px`,
    height: `${size}px`,
    left,
    top,
    opacity,
    animationDelay: `${Math.random() * 3}s`,
  }
}
</script>

<style scoped>
/* 基础容器样式 */
.ai-container {
  position: relative;
  width: 100%;
  height: 100vh;
  background: linear-gradient(135deg, #0a1128, #1e3a8a, #0f172a);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

/* 背景装饰 */
.background-decorations {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  pointer-events: none;
}

.particle {
  position: absolute;
  background: white;
  border-radius: 50%;
  opacity: 0.6;
  animation: floatUp linear infinite;
}

@keyframes floatUp {
  0% {
    transform: translateY(100vh) scale(0);
    opacity: 0;
  }

  10% {
    opacity: 0.6;
  }

  90% {
    opacity: 0.6;
  }

  100% {
    transform: translateY(-10vh) scale(1);
    opacity: 0;
  }
}

.vertical-line {
  position: absolute;
  width: 1px;
  background: rgb(173 216 230 / 30%);
  bottom: 0;
  transform-origin: bottom center;
  animation: growUp linear infinite;
}

@keyframes growUp {
  0% {
    height: 0;
    opacity: 0;
  }

  10% {
    opacity: 0.3;
  }

  90% {
    opacity: 0.3;
  }

  100% {
    height: 300px;
    opacity: 0;
  }
}

/* AI球体 */
.ai-globe-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 2;
}

.ai-globe {
  position: relative;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 30%,
    rgb(173 216 230 / 30%),
    rgb(25 118 210 / 20%),
    transparent 70%
  );
  box-shadow: 0 0 100px rgb(173 216 230 / 50%);
  animation: rotateGlobe 60s linear infinite;
  backdrop-filter: blur(2px);
}

@keyframes rotateGlobe {
  0% {
    transform: rotateY(0deg);
  }

  100% {
    transform: rotateY(360deg);
  }
}

/* 网格线 */
.grid-circle {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 1px solid rgb(173 216 230 / 30%);
  border-radius: 50%;
}

.grid-vertical {
  position: absolute;
  top: 0;
  left: 50%;
  width: 1px;
  height: 100%;
  background: rgb(173 216 230 / 30%);
  transform-origin: center;
}

/* 连接点 */
.connection-node {
  position: absolute;
  background: rgb(173 216 230 / 100%);
  border-radius: 50%;
  box-shadow: 0 0 5px rgb(173 216 230 / 80%);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.8;
  }

  50% {
    transform: scale(1.2);
    opacity: 0.4;
  }
}

/* AI文字 */
.ai-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 80px;
  font-weight: bold;
  color: rgb(255 255 255 / 90%);
  text-shadow:
    0 0 30px rgb(173 216 230 / 80%),
    0 0 50px rgb(173 216 230 / 50%);
  animation: glowText 3s ease-in-out infinite alternate;
}

@keyframes glowText {
  0% {
    text-shadow:
      0 0 30px rgb(173 216 230 / 80%),
      0 0 50px rgb(173 216 230 / 50%);
  }

  100% {
    text-shadow:
      0 0 40px rgb(173 216 230 / 100%),
      0 0 70px rgb(173 216 230 / 80%);
  }
}

/* 底部发光效果 */
.glow-effect {
  width: 350px;
  height: 100px;
  background: radial-gradient(circle, rgb(173 216 230 / 50%), transparent 70%);
  filter: blur(20px);
  margin-top: -30px;
}

/* 波浪效果 */
.wave-container {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 150px;
  overflow: hidden;
}

.wave {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 200%;
  height: 100px;
  background: rgb(173 216 230 / 10%);
  border-radius: 50% 50% 0 0;
  animation: waveMove 15s ease-in-out infinite;
}

.wave-1 {
  bottom: 10px;
  height: 80px;
  animation-delay: 0s;
}

.wave-2 {
  bottom: 5px;
  height: 60px;
  animation-delay: -5s;
  background: rgb(173 216 230 / 5%);
}

.wave-3 {
  bottom: 0;
  height: 40px;
  animation-delay: -10s;
  background: rgb(173 216 230 / 3%);
}

@keyframes waveMove {
  0% {
    transform: translateX(0) translateY(0);
  }

  50% {
    transform: translateX(-25%) translateY(-10px);
  }

  100% {
    transform: translateX(-50%) translateY(0);
  }
}

/* 页面内容 */
.page-content {
  position: relative;
  z-index: 2;
  text-align: center;
  margin-top: 30px;
  padding: 20px;
}

.page-title {
  font-size: 3rem;
  font-weight: bold;
  color: white;
  margin-bottom: 20px;
  text-shadow: 0 2px 10px rgb(0 0 0 / 30%);
  animation: fadeInUp 1s ease-out;
}

.page-description {
  font-size: 1.2rem;
  color: rgb(255 255 255 / 80%);
  max-width: 800px;
  margin: 0 auto 40px;
  line-height: 1.6;
  animation: fadeInUp 1s ease-out 0.2s both;
}

/* 功能卡片 */
.feature-cards {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.feature-card {
  background: rgb(255 255 255 / 10%);
  border-radius: 15px;
  padding: 30px;
  width: 250px;
  backdrop-filter: blur(10px);
  border: 1px solid rgb(255 255 255 / 20%);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
  animation: fadeInUp 1s ease-out;
}

.feature-card:nth-child(1) {
  animation-delay: 0.4s;
  animation-fill-mode: both;
  opacity: 0;
}

.feature-card:nth-child(2) {
  animation-delay: 0.6s;
  animation-fill-mode: both;
  opacity: 0;
}

.feature-card:nth-child(3) {
  animation-delay: 0.8s;
  animation-fill-mode: both;
  opacity: 0;
}

.feature-card:nth-child(4) {
  animation-delay: 1s;
  animation-fill-mode: both;
  opacity: 0;
}

.feature-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 10px 30px rgb(173 216 230 / 30%);
}

.feature-icon {
  font-size: 40px;
  margin-bottom: 20px;
}

.feature-title {
  font-size: 1.4rem;
  font-weight: bold;
  color: white;
  margin-bottom: 15px;
}

.feature-description {
  color: rgb(255 255 255 / 70%);
  line-height: 1.5;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计 */
@media (width <= 768px) {
  .ai-globe {
    width: 200px;
    height: 200px;
  }

  .ai-text {
    font-size: 50px;
  }

  .glow-effect {
    width: 250px;
    height: 70px;
  }

  .page-title {
    font-size: 2rem;
  }

  .page-description {
    font-size: 1rem;
    padding: 0 20px;
  }

  .feature-card {
    width: 200px;
    padding: 20px;
  }

  .feature-cards {
    gap: 15px;
  }
}

@media (width <= 480px) {
  .feature-cards {
    flex-direction: column;
    align-items: center;
  }

  .feature-card {
    width: 90%;
    max-width: 300px;
  }
}
</style>
