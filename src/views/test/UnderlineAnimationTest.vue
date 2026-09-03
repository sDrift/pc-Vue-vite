<template>
  <div class="draggable-test-page">
    <!-- 拖动组件测试 - 仅保留此部分 -->
    <div class="test-section">
      <h2>Vue指令拖动组件测试</h2>
      <div class="draggable-container">
        <div class="draggable-info">
          <h3>使用自定义v-draggable指令实现的拖动功能</h3>
          <p>点击下方元素并拖动来测试全屏拖动功能</p>
        </div>

        <!-- 可拖动元素 - 全屏拖动 -->
        <div v-draggable class="draggable-element" @click="handleElementClick('main', $event)">
          <div class="draggable-handle">
            <span>📌 拖动我 (全屏范围内)</span>
          </div>
          <div class="draggable-content">
            <p>这是一个使用Vue自定义指令实现的可拖动元素</p>
            <p>位置: {{ elementPosition.x }}, {{ elementPosition.y }}</p>
            <p>点击次数: {{ clickCount }}</p>
            <p v-if="lastClickedElement">最后点击: {{ lastClickedElement }}</p>
          </div>
        </div>

        <!-- 多个可拖动元素示例 - 全屏拖动 -->
        <div class="multiple-draggables">
          <h4>多个可拖动元素 (全屏范围内)</h4>
          <div v-draggable class="draggable-small blue" @click="handleElementClick('blue', $event)">
            元素1
          </div>
          <div
            v-draggable
            class="draggable-small green"
            @click="handleElementClick('green', $event)"
          >
            元素2
          </div>
          <div v-draggable class="draggable-small red" @click="handleElementClick('red', $event)">
            元素3
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// 拖动元素位置
const elementPosition = ref({ x: 0, y: 0 })
// 点击事件状态
const clickCount = ref(0)
const lastClickedElement = ref(null)

// 处理元素点击事件
const handleElementClick = (elementId, event) => {
  clickCount.value++
  lastClickedElement.value = elementId
  console.log(`元素 ${elementId} 被点击了！点击次数: ${clickCount.value}`)
}

// 自定义拖动指令
const vDraggable = {
  mounted(el, binding) {
    let isDragging = false
    let hasMoved = false
    let initialX, initialY, currentX, currentY, initialLeft, initialTop
    let startTime
    const CLICK_THRESHOLD = 5 // 移动距离阈值，超过这个值视为拖动而非点击
    const TIME_THRESHOLD = 200 // 时间阈值，超过这个时间视为拖动而非点击

    // 设置元素样式使其可定位（使用fixed定位确保全屏拖动）
    el.style.position = 'fixed'
    el.style.cursor = 'move'
    el.style.userSelect = 'none'
    el.style.zIndex = '100' // 确保元素在其他内容之上

    // 鼠标按下事件
    const mouseDownHandler = (e) => {
      // 记录初始状态
      isDragging = true
      hasMoved = false
      startTime = Date.now()

      // 记录初始位置
      initialX = e.clientX
      initialY = e.clientY

      // 获取元素当前位置
      const computedStyle = window.getComputedStyle(el)

      initialLeft = parseInt(computedStyle.left) || 0
      initialTop = parseInt(computedStyle.top) || 0

      // 添加移动和释放事件监听
      document.addEventListener('mousemove', mouseMoveHandler)
      document.addEventListener('mouseup', mouseUpHandler)

      // 防止文本选择，但不阻止点击事件
    }

    // 鼠标移动事件
    const mouseMoveHandler = (e) => {
      if (!isDragging) return

      // 计算移动距离
      currentX = e.clientX - initialX
      currentY = e.clientY - initialY

      // 如果移动距离超过阈值，标记为已移动
      if (Math.abs(currentX) > CLICK_THRESHOLD || Math.abs(currentY) > CLICK_THRESHOLD) {
        hasMoved = true
      }

      // 计算新位置（全屏范围内自由拖动）
      const newLeft = initialLeft + currentX
      const newTop = initialTop + currentY

      // 设置新位置
      el.style.left = `${newLeft}px`
      el.style.top = `${newTop}px`

      // 更新位置数据
      elementPosition.value = { x: newLeft, y: newTop }
    }

    // 鼠标释放事件
    const mouseUpHandler = (e) => {
      // 计算点击时间
      const clickTime = Date.now() - startTime

      // 如果没有移动且点击时间在阈值内，且不是拖动结束，触发点击事件
      if (!hasMoved && clickTime < TIME_THRESHOLD) {
        // 创建并派发点击事件
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window,
          clientX: e.clientX,
          clientY: e.clientY,
        })

        el.dispatchEvent(clickEvent)
      }

      // 结束拖动
      isDragging = false

      // 移除事件监听
      document.removeEventListener('mousemove', mouseMoveHandler)
      document.removeEventListener('mouseup', mouseUpHandler)
    }

    // 添加鼠标按下事件监听
    el.addEventListener('mousedown', mouseDownHandler)

    // 存储事件处理函数引用，以便卸载时移除
    el._dragHandlers = {
      mouseDownHandler,
      mouseMoveHandler,
      mouseUpHandler,
    }
  },

  unmounted(el) {
    // 移除所有事件监听器
    if (el._dragHandlers) {
      el.removeEventListener('mousedown', el._dragHandlers.mouseDownHandler)
      document.removeEventListener('mousemove', el._dragHandlers.mouseMoveHandler)
      document.removeEventListener('mouseup', el._dragHandlers.mouseUpHandler)
      delete el._dragHandlers
    }
  },
}
</script>

<style scoped>
.draggable-test-page {
  padding: 20px;
  background: #f0f2f5;
  min-height: 100vh;
}

.test-section {
  max-width: 1200px;
  margin: 0 auto;
}

.test-section h2 {
  color: #2c3e50;
  text-align: center;
  margin-bottom: 30px;
  font-size: 28px;
}

/* 拖动组件样式 */
.draggable-container {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 10px;
  margin-top: 20px;
  position: relative;
  min-height: 400px;
}

.draggable-info {
  margin-bottom: 30px;
  text-align: center;
  position: relative;
  z-index: 10;
}

.draggable-info h3 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.draggable-info p {
  color: #7f8c8d;
}

/* 可拖动元素 - 使用fixed定位实现全屏拖动 */
.draggable-element {
  width: 300px;
  background: white;
  border: 2px solid #3498db;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgb(0 0 0 / 10%);
  overflow: hidden;
}

.draggable-handle {
  background: #3498db;
  color: white;
  padding: 12px 20px;
  font-weight: 500;
  cursor: move;
}

.draggable-content {
  padding: 20px;
  color: #333;
}

.draggable-content p {
  margin: 10px 0;
}

/* 多个可拖动元素区域 */
.multiple-draggables {
  margin-top: 50px;
  padding: 20px;
  position: relative;
  min-height: 200px;
}

.multiple-draggables h4 {
  color: #2c3e50;
  margin-bottom: 20px;
  text-align: center;
  position: relative;
  z-index: 10;
}

/* 小型可拖动元素 - 使用fixed定位实现全屏拖动 */
.draggable-small {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  box-shadow: 0 2px 8px rgb(0 0 0 / 15%);
}

.draggable-small.blue {
  background: #3498db;
}

.draggable-small.green {
  background: #2ecc71;
}

.draggable-small.red {
  background: #e74c3c;
}

/* 响应式调整 */
@media (width <= 768px) {
  .draggable-element {
    width: 250px;
  }

  .draggable-container {
    min-height: 300px;
  }
}
</style>
