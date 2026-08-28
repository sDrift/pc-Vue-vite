<template>
  <div class="underline-animation-container">
    <div class="text-container">
      <div class="text-wrapper" ref="textWrapper">
        <!-- 文本行 -->
        <div 
          v-for="(line, index) in lines" 
          :key="index" 
          class="text-line"
          ref="lineRefs"
        >
          {{ line }}
          <!-- 下划线 -->
          <div 
            class="line-underline"
            :style="{ 
              width: getLineWidth(index),
              opacity: getLineOpacity(index)
            }"
          ></div>
        </div>
      </div>
    </div>
    <button 
      @click="startAnimation"
      :disabled="isAnimating"
      class="start-button"
    >
      {{ isAnimating ? '动画进行中...' : '开始下划线动画' }}
    </button>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue';

// 响应式数据
const textWrapper = ref(null);
const lineRefs = ref([]);
const lines = ref([]);
const lineProgress = ref([]);
const currentLine = ref(-1);
const isAnimating = ref(false);
let animationFrameId = null;
let startTime = 0;
const DURATION = 5000; // 5秒动画时间

// 文本内容
const text = '这是一段示例文字，点击下面的按钮后，这段文字将在5秒内从开头到结尾逐渐显示下划线动画效果。这段文字将会自动换行显示为多行，下划线动画将从第一行开始，一行一行地显示，直到最后一行完成。每行都会有自己的下划线，并且会按照顺序依次出现，形成一个流畅的逐行下划线动画效果。';

// 初始化函数
const initializeText = () => {
  // 手动将文本分割成多行
  // 为了确保多行效果，这里根据字数大概分割
  const words = text.split('');
  const charsPerLine = 25; // 每行大约字符数
  const newLines = [];
  
  for (let i = 0; i < words.length; i += charsPerLine) {
    newLines.push(words.slice(i, i + charsPerLine).join(''));
  }
  
  lines.value = newLines;
  lineProgress.value = new Array(newLines.length).fill(0);
};

// 获取行下划线宽度
const getLineWidth = (index) => {
  if (index < currentLine.value || (index === currentLine.value && lineProgress.value[index] > 0)) {
    return `${lineProgress.value[index]}%`;
  }
  return '0%';
};

// 获取行下划线透明度
const getLineOpacity = (index) => {
  if (index < currentLine.value) {
    return 1;
  } else if (index === currentLine.value) {
    return lineProgress.value[index] / 100;
  }
  return 0;
};

// 开始动画函数
const startAnimation = () => {
  if (isAnimating.value || lines.value.length === 0) return;
  
  // 重置状态
  isAnimating.value = true;
  currentLine.value = 0;
  lineProgress.value = new Array(lines.value.length).fill(0);
  startTime = performance.now();
  
  // 计算每行动画时间（包括行内动画时间和行切换时间）
  const lineAnimationTime = DURATION / lines.value.length;
  const lineInnerTime = lineAnimationTime * 0.7; // 70%时间用于行内动画
  const lineSwitchTime = lineAnimationTime * 0.3; // 30%时间用于行切换
  
  // 使用requestAnimationFrame进行平滑动画
  const animate = (currentTime) => {
    const elapsed = currentTime - startTime;
    
    // 计算当前应该在哪一行
    const currentLineIndex = Math.floor(elapsed / lineAnimationTime);
    
    if (currentLineIndex < lines.value.length) {
      currentLine.value = currentLineIndex;
      
      // 计算当前行的动画进度
      const timeInLine = elapsed - (currentLineIndex * lineAnimationTime);
      
      if (timeInLine <= lineInnerTime) {
        // 行内下划线动画进行中
        const progressInLine = (timeInLine / lineInnerTime) * 100;
        lineProgress.value[currentLineIndex] = progressInLine;
      } else {
        // 行内下划线动画已完成，等待下一行开始
        lineProgress.value[currentLineIndex] = 100;
      }
      
      // 前一行的下划线应该完全显示
      for (let i = 0; i < currentLineIndex; i++) {
        lineProgress.value[i] = 100;
      }
      
      // 继续动画
      animationFrameId = requestAnimationFrame(animate);
    } else {
      // 所有行都完成动画
      for (let i = 0; i < lines.value.length; i++) {
        lineProgress.value[i] = 100;
      }
      currentLine.value = lines.value.length - 1;
      isAnimating.value = false;
    }
  };
  
  // 启动动画
  animationFrameId = requestAnimationFrame(animate);
};

// 组件挂载后初始化
onMounted(() => {
  initializeText();
});
</script>

<style scoped>
.underline-animation-container {
  max-width: 800px;
  margin: 50px auto;
  padding: 20px;
  text-align: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

.text-container {
  margin-bottom: 30px;
  position: relative;
}

.text-wrapper {
  position: relative;
  max-width: 600px;
  margin: 0 auto;
  text-align: left;
}

.text-line {
  font-size: 24px;
  line-height: 1.6;
  color: #333;
  margin-bottom: 8px; /* 行间距 */
  position: relative;
  padding-bottom: 4px; /* 为下划线留出空间 */
  overflow: hidden;
}

.line-underline {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 4px;
  width: 0%;
  background: url("data:image/svg+xml,%3Csvg width='100' height='4' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 0,2 Q 5,4 10,2 T 20,2 T 30,2 T 40,2 T 50,2 T 60,2 T 70,2 T 80,2 T 90,2 T 100,2' fill='none' stroke='%23ff0000' stroke-width='2'/%3E%3C/svg%3E") repeat-x 0 bottom/20px 100%;
  transition: width 0.05s linear, opacity 0.05s linear;
}

.start-button {
  padding: 12px 24px;
  font-size: 16px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.start-button:hover:not(:disabled) {
  background-color: #40a9ff;
  transform: translateY(-1px);
}

.start-button:active:not(:disabled) {
  transform: translateY(0);
}

.start-button:disabled {
  background-color: #d9d9d9;
  cursor: not-allowed;
}
</style>