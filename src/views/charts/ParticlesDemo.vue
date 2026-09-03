<template>
  <div class="particles-demo">
    <el-card shadow="hover" class="main-card">
      <template #header>
        <div class="card-header">
          <span>Three.js 粒子系统演示</span>
          <el-tag type="success" effect="light">{{ currentModeLabel }}</el-tag>
        </div>
      </template>

      <el-row :gutter="20">
        <!-- 左侧控制面板 -->
        <el-col :span="6">
          <div class="panel">
            <h4>粒子模式</h4>
            <el-radio-group v-model="mode" size="default">
              <el-radio-button value="nebula">星云</el-radio-button>
              <el-radio-button value="sphere">球体</el-radio-button>
              <el-radio-button value="text">文字</el-radio-button>
            </el-radio-group>

            <el-divider />

            <h4>基础参数</h4>

            <div class="field">
              <div class="label-row">
                <span>粒子数量</span>
                <span class="num">{{ count }}</span>
              </div>
              <el-slider v-model="count" :min="500" :max="15000" :step="500" show-stops />
            </div>

            <div class="field">
              <div class="label-row">
                <span>粒子尺寸</span>
                <span class="num">{{ size.toFixed(2) }}</span>
              </div>
              <el-slider v-model="size" :min="0.01" :max="0.25" :step="0.01" />
            </div>

            <div class="field">
              <div class="label-row">
                <span>运动速度</span>
                <span class="num">{{ speed.toFixed(1) }}</span>
              </div>
              <el-slider v-model="speed" :min="0" :max="5" :step="0.1" />
            </div>

            <div v-if="mode === 'sphere'" class="field">
              <div class="label-row">
                <span>球体半径</span>
                <span class="num">{{ sphereRadius.toFixed(1) }}</span>
              </div>
              <el-slider v-model="sphereRadius" :min="2" :max="12" :step="0.5" />
            </div>

            <div v-if="mode === 'text'" class="field">
              <div class="label-row"><span>显示文字</span></div>
              <el-input
                v-model="text"
                placeholder="输入要显示的文字"
                maxlength="12"
                show-word-limit
              />
            </div>

            <el-divider />

            <h4>颜色主题</h4>
            <el-radio-group v-model="themeKey" size="small">
              <el-radio-button value="ocean">海洋</el-radio-button>
              <el-radio-button value="sunset">晚霞</el-radio-button>
              <el-radio-button value="forest">森林</el-radio-button>
              <el-radio-button value="neon">霓虹</el-radio-button>
            </el-radio-group>

            <div class="custom-colors">
              <el-color-picker v-model="c1" size="small" title="颜色 1" />
              <el-color-picker v-model="c2" size="small" title="颜色 2" />
              <el-color-picker v-model="c3" size="small" title="颜色 3" />
              <el-color-picker v-model="c4" size="small" title="颜色 4" />
            </div>

            <el-divider />

            <h4>外观与交互</h4>
            <div class="field">
              <div class="label-row"><span>背景颜色</span></div>
              <el-color-picker v-model="backgroundColor" show-alpha />
            </div>

            <div class="field inline">
              <el-switch v-model="autoRotate" active-text="自动旋转" />
            </div>

            <div class="field inline">
              <el-switch v-model="interactive" active-text="允许鼠标拖拽" />
            </div>

            <el-button type="primary" class="rebuild-btn" @click="forceRebuild">
              重新生成粒子
            </el-button>
          </div>
        </el-col>

        <!-- 右侧粒子画布 -->
        <el-col :span="18">
          <div class="canvas-wrap">
            <ThreeParticles
              ref="particlesRef"
              :mode="mode"
              :count="count"
              :color="activeColors"
              :size="size"
              :speed="speed"
              :text="text"
              :sphere-radius="sphereRadius"
              :background-color="backgroundColor"
              :auto-rotate="autoRotate"
              :interactive="interactive"
              @ready="onReady"
              @click="onClick"
            />
            <div v-if="lastClick" class="click-tag">
              上次点击：x={{ lastClick.x.toFixed(3) }}, y={{ lastClick.y.toFixed(3) }}
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, watch, markRaw } from 'vue'

import ThreeParticles from '../../components/ThreeParticles.vue'

const particlesRef = ref(null)
const lastClick = ref(null)

/* ========== 模式 ========== */
const mode = ref('nebula')
const modeLabelMap = {
  nebula: '星云扩散模式',
  sphere: '粒子球体模式',
  text: '文字粒子模式',
}
const currentModeLabel = computed(() => modeLabelMap[mode.value] || '')

/* ========== 基础参数 ========== */
const count = ref(3000)
const size = ref(0.06)
const speed = ref(1.0)
const sphereRadius = ref(5)
const text = ref('THREE.JS')

/* ========== 颜色主题 ========== */
const themeKey = ref('ocean')
const themeMap = {
  ocean: ['#00c6ff', '#0072ff', '#8e2de2', '#4a00e0'],
  sunset: ['#ff512f', '#f09819', '#ff6a00', '#ee0979'],
  forest: ['#11998e', '#38ef7d', '#56ab2f', '#a8e063'],
  neon: ['#fc00ff', '#00dbde', '#f7ff00', '#ff0080'],
}
const c1 = ref(themeMap.ocean[0])
const c2 = ref(themeMap.ocean[1])
const c3 = ref(themeMap.ocean[2])
const c4 = ref(themeMap.ocean[3])

// 切换主题时更新自定义颜色
watch(themeKey, (k) => {
  const [a, b, c, d] = themeMap[k]

  c1.value = a
  c2.value = b
  c3.value = c
  c4.value = d
})

const activeColors = computed(() => {
  return [c1.value, c2.value, c3.value, c4.value].filter(Boolean)
})

/* ========== 外观 ========== */
const backgroundColor = ref('#03060d')
const autoRotate = ref(true)
const interactive = ref(true)

/* ========== 操作 ========== */
const forceRebuild = () => {
  particlesRef.value?.rebuild()
}

const onReady = (info) => {
  console.log('ThreeParticles ready:', info)
}

const onClick = (info) => {
  lastClick.value = { x: info.x, y: info.y }
}
</script>

<style scoped>
.particles-demo {
  padding: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 18px;
  font-weight: bold;
}

.panel {
  padding: 8px 4px;
}

.panel h4 {
  margin: 0 0 10px;
  font-size: 14px;
  color: #303133;
  font-weight: 600;
}

.field {
  margin-bottom: 16px;
}

.field.inline {
  display: flex;
  align-items: center;
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  font-size: 13px;
  color: #606266;
}

.num {
  color: #409eff;
  font-weight: 600;
  font-size: 13px;
}

.custom-colors {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.rebuild-btn {
  width: 100%;
  margin-top: 8px;
}

.canvas-wrap {
  position: relative;
  width: 100%;
  height: 640px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: inset 0 0 0 1px #ebeef5;
  background: #03060d;
}

.click-tag {
  position: absolute;
  left: 12px;
  bottom: 10px;
  padding: 4px 10px;
  background: rgb(0 0 0 / 50%);
  color: #fff;
  border-radius: 4px;
  font-size: 12px;
  pointer-events: none;
}
</style>
