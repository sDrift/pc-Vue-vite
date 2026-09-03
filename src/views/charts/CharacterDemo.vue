<template>
  <div class="character-demo">
    <el-card shadow="hover" class="main-card">
      <template #header>
        <div class="card-header">
          <span>Three.js 3D 人物模型</span>
          <el-tag type="warning" effect="dark">程序化建模 · 骨骼驱动</el-tag>
        </div>
      </template>

      <el-row :gutter="20">
        <!-- 控制面板 -->
        <el-col :span="6">
          <div class="panel">
            <h4>动作</h4>
            <el-radio-group v-model="action" size="default">
              <el-radio-button value="idle">站立</el-radio-button>
              <el-radio-button value="walk">走路</el-radio-button>
              <el-radio-button value="wave">挥手</el-radio-button>
            </el-radio-group>

            <div v-if="action === 'walk'" class="field">
              <el-switch v-model="moveForward" active-text="向前位移" inactive-text="原地踏步" />
            </div>

            <el-divider />

            <h4>参数</h4>

            <div class="field">
              <div class="label-row">
                <span>速度</span>
                <span class="num">{{ speed.toFixed(2) }}x</span>
              </div>
              <el-slider v-model="speed" :min="0.1" :max="3" :step="0.05" />
            </div>

            <div class="field">
              <div class="label-row">
                <span>模型缩放</span>
                <span class="num">{{ scale.toFixed(2) }}x</span>
              </div>
              <el-slider v-model="scale" :min="0.5" :max="2.5" :step="0.05" />
            </div>

            <div class="field inline">
              <el-switch v-model="autoRotate" active-text="镜头自动旋转" />
            </div>
            <div class="field inline">
              <el-switch v-model="showGround" active-text="显示地面/网格" />
            </div>

            <el-divider />

            <h4>外观颜色</h4>

            <div class="color-row">
              <span>皮肤</span>
              <el-color-picker v-model="skinColor" />
            </div>
            <div class="color-row">
              <span>衣服</span>
              <el-color-picker v-model="shirtColor" />
            </div>
            <div class="color-row">
              <span>裤子</span>
              <el-color-picker v-model="pantsColor" />
            </div>
            <div class="color-row">
              <span>鞋子</span>
              <el-color-picker v-model="shoeColor" />
            </div>
            <div class="color-row">
              <span>头发</span>
              <el-color-picker v-model="hairColor" />
            </div>
            <div class="color-row">
              <span>背景</span>
              <el-color-picker v-model="backgroundColor" show-alpha />
            </div>

            <el-divider />

            <h4>快速外观</h4>
            <div class="presets">
              <el-button size="small" @click="applyPreset('student')">学生</el-button>
              <el-button size="small" type="success" @click="applyPreset('soldier')">
                士兵
              </el-button>
              <el-button size="small" type="warning" @click="applyPreset('fireman')">
                消防员
              </el-button>
              <el-button size="small" type="danger" @click="applyPreset('zombie')">丧尸</el-button>
            </div>

            <el-button type="primary" class="rebuild-btn" @click="rebuild">重建人物</el-button>
          </div>
        </el-col>

        <!-- 预览画布 -->
        <el-col :span="18">
          <div class="canvas-wrap">
            <Character3D
              ref="charRef"
              :action="action"
              :speed="speed"
              :move-forward="moveForward"
              :scale="scale"
              :skin-color="skinColor"
              :shirt-color="shirtColor"
              :pants-color="pantsColor"
              :shoe-color="shoeColor"
              :hair-color="hairColor"
              :background-color="backgroundColor"
              :show-ground="showGround"
              :auto-rotate="autoRotate"
              :interactive="true"
              @ready="onReady"
            />
            <div class="tips">💡 鼠标左键旋转 / 右键平移 / 滚轮缩放</div>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'

import Character3D from '../../components/Character3D.vue'

const charRef = ref(null)

/* 动作 */
const action = ref('idle')
const moveForward = ref(false)

/* 参数 */
const speed = ref(1.0)
const scale = ref(1.0)
const autoRotate = ref(false)
const showGround = ref(true)

/* 颜色 */
const skinColor = ref('#f2c6a0')
const shirtColor = ref('#4a90e2')
const pantsColor = ref('#2c3e50')
const shoeColor = ref('#1a1a1a')
const hairColor = ref('#3d2817')
const backgroundColor = ref('#f0f0f0')

/* 预设 */
const presets = {
  student: {
    skin: '#f7d2b0',
    shirt: '#ffffff',
    pants: '#274b8a',
    shoes: '#222222',
    hair: '#1f1712',
  },
  soldier: {
    skin: '#cfa37b',
    shirt: '#4b5320',
    pants: '#3a3f1a',
    shoes: '#1d1d1d',
    hair: '#2a1a10',
  },
  fireman: {
    skin: '#f2c6a0',
    shirt: '#e63946',
    pants: '#ffb703',
    shoes: '#000000',
    hair: '#2a1a10',
  },
  zombie: {
    skin: '#8aa66a',
    shirt: '#6b4226',
    pants: '#4e4137',
    shoes: '#3b2f26',
    hair: '#5c4a35',
  },
}
const applyPreset = (key) => {
  const p = presets[key]

  if (!p) return
  skinColor.value = p.skin
  shirtColor.value = p.shirt
  pantsColor.value = p.pants
  shoeColor.value = p.shoes
  hairColor.value = p.hair
}

const onReady = (info) => {
  console.log('Character3D ready:', info)
}

const rebuild = () => {
  charRef.value?.rebuild()
}
</script>

<style scoped>
.character-demo {
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

.color-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 13px;
  color: #606266;
}

.presets {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.rebuild-btn {
  width: 100%;
  margin-top: 14px;
}

.canvas-wrap {
  position: relative;
  width: 100%;
  height: 640px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: inset 0 0 0 1px #ebeef5;
  background: #f0f0f0;
}

.tips {
  position: absolute;
  left: 12px;
  bottom: 10px;
  padding: 4px 10px;
  background: rgb(0 0 0 / 45%);
  color: #fff;
  border-radius: 4px;
  font-size: 12px;
  pointer-events: none;
}
</style>
