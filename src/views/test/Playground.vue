<template>
  <div class="playground">
    <!-- ===== 页面标题与说明 ===== -->
    <div class="pg-header">
      <h2 class="pg-title">Playground · 空白沙盒</h2>
      <p class="pg-desc">用于临时测试、写草稿。左侧编辑配置，右侧实时预览。</p>
    </div>

    <!-- ===== 主体：左右两栏 ===== -->
    <div class="pg-main">
      <!-- 左栏：配置编辑 -->
      <div class="pg-col pg-col-left">
        <div class="pg-card">
          <div class="pg-card-header">
            <h3 class="pg-card-title">配置编辑</h3>
          </div>
          <div class="pg-card-body">
            <div class="config-list">
              <div v-for="(item, index) in leftlist" :key="item.key" class="config-item">
                <div class="config-item-head">
                  <span class="config-item-index">{{ index + 1 }}</span>
                  <el-tag size="small" type="primary" effect="light">
                    {{ typeOptions.find((opt) => opt.value === item.type)?.name }}
                  </el-tag>
                  <el-select v-model="item.type" placeholder="请选择类型" size="small">
                    <el-option
                      v-for="opt in typeOptions"
                      :key="opt.value"
                      :label="opt.name"
                      :value="opt.value"
                    />
                  </el-select>
                </div>

                <el-form
                  v-if="item.type == 'input'"
                  :inline="true"
                  size="default"
                  label-width="44px"
                >
                  <el-form-item label="key">
                    <el-input v-model="item.key" placeholder="请输入 key" />
                  </el-form-item>
                  <el-form-item label="name">
                    <el-input v-model="item.name" placeholder="请输入 name" />
                  </el-form-item>
                  <el-form-item label="value">
                    <el-input v-model="item.value" placeholder="请输入 value" />
                  </el-form-item>
                </el-form>

                <div v-else-if="item.type == 'select'" class="select-zone">
                  <el-form :inline="true" size="default" label-width="44px" class="select-head-row">
                    <el-form-item label="key">
                      <el-input v-model="item.key" placeholder="请输入 key" />
                    </el-form-item>
                    <el-form-item label="name">
                      <el-input v-model="item.name" placeholder="请输入 name" />
                    </el-form-item>
                    <el-form-item label="value">
                      <el-input v-model="item.value" placeholder="请输入 value" />
                    </el-form-item>
                  </el-form>
                  <el-divider content-position="left" border-style="dashed">选项列表</el-divider>
                  <div class="option-list">
                    <el-button type="primary" size="small" @click="addOption(item)">
                      添加选项
                    </el-button>

                    <div v-for="(opt, optIdx) in item.options" :key="opt.key" class="option-row">
                      <span class="option-label">选项 {{ optIdx + 1 }}</span>
                      <el-input v-model="opt.key" placeholder="option key" size="default" />
                      <el-input v-model="opt.name" placeholder="option name" size="default" />
                      <el-input v-model="opt.value" placeholder="option value" size="default" />
                      <el-button type="danger" size="small" @click="deleteOption(item, optIdx)">
                        删除
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右栏：预览 -->
      <div class="pg-col pg-col-right">
        <div class="pg-card">
          <div class="pg-card-header">
            <h3 class="pg-card-title" @click="previewForm">实时预览</h3>
          </div>
          <div class="pg-card-body">
            <el-form label-position="left" label-width="100px" size="default">
              <template v-for="item in leftlist">
                <el-form-item v-if="showRuleFn(item)" :key="item.key" :label="item.name">
                  <el-input
                    v-if="item.type == 'input'"
                    v-model="item.value"
                    placeholder="请输入"
                    style="max-width: 360px"
                    @change="handleChange(item)"
                  />
                  <el-select
                    v-else-if="item.type == 'select'"
                    v-model="item.value"
                    placeholder="请选择"
                    :loading="loadingOptions[item.key]"
                    loading-text="加载中..."
                    style="max-width: 360px; width: 100%"
                  >
                    <!-- 本地静态选项数组：options 是数组 -->
                    <div v-if="typeof item.options !== 'string'">
                      <el-option
                        v-for="option in item.options"
                        :key="option.key"
                        :label="option.name"
                        :value="option.value"
                      />
                    </div>
                    <!-- 异步选项：options 是字符串函数名，从 resolvedOptions 缓存读 -->
                    <div v-else>
                      <el-option
                        v-for="option in resolvedOptions[item.key] || []"
                        :key="option.key"
                        :label="option.name"
                        :value="option.value"
                      />
                    </div>
                    <template #empty>
                      <div v-if="loadingOptions[item.key]">加载中...</div>
                      <div v-else>暂无数据</div>
                    </template>
                  </el-select>
                </el-form-item>
              </template>
            </el-form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// 常用 API，按需使用
import { ref, reactive, onMounted, onUnmounted } from 'vue'

const typeOptions = ref([
  { name: '输入框', value: 'input' },
  { name: '下拉选择', value: 'select' },
])

const leftlist = ref([
  {
    name: '选项1',
    value: '1',
    key: 'option1',
    type: 'input',
    showRule: [],
    changeList: [{ key: 'option4' }],
  },
  {
    name: '选项2',
    value: '2',
    key: 'option2',
    type: 'select',
    showRule: [],
    options: [
      { name: 'select选项1', value: 'sec1', key: 'id1' },
      { name: 'select选项2', value: 'sec2', key: 'id2' },
      { name: 'select选项3', value: 'sec3', key: 'id3' },
    ],
  },
  {
    name: '选项3',
    value: '3',
    key: 'option3',
    type: 'input',
    showRule: [
      { type: 'show', key: 'option1', value: '1' },
      { type: 'show', key: 'option2', value: 'sec1' },
    ],
  },
  {
    name: '选项4',
    value: '4',
    key: 'option4',
    type: 'select',
    showRule: [],
    options: 'getOption4',
  },
])

const addOption = (item) => {
  if (!item.options) {
    item.options = []
  }
  item.options.push({ name: '', value: '', key: '' })
}
const deleteOption = (item, optIdx) => {
  if (item.options && item.options.length > optIdx) {
    item.options.splice(optIdx, 1)
  }
}
const showRuleFn = (item) => {
  if (!item.showRule || item.showRule.length === 0) {
    return true
  }

  return item.showRule.reduce((acc, rule) => {
    acc = leftlist.value.find((i) => i.key === rule.key)?.value === rule.value && acc

    return acc
  }, true)
}

const getOptions = {
  getOption4: async (item) => {
    const opts = new Promise((resolve, reject) => {
      const op1value = leftlist.value.find((i) => i.key === 'option1')?.value
      let arr = []

      setTimeout(() => {
        if (op1value === '1') {
          arr = [
            { name: 'select选项1', value: 'sec1', key: 'id1' },
            { name: 'select选项2', value: 'sec2', key: 'id2' },
          ]
        } else if (op1value === '2') {
          arr = [
            { name: 'select选项1', value: 'sec1', key: 'id1' },
            { name: 'select选项2', value: 'sec2', key: 'id2' },
            { name: 'select选项3', value: 'sec3', key: 'id3' },
          ]
        }
        resolve(arr)
      }, 500)
    })

    console.log(opts)

    return opts
  },
}

const handleChange = (item) => {
  console.log(item)
  if (item.key === 'option1') {
    ensureOptions(leftlist.value.find((i) => i.key === item.changeList[0].key))
  }
}

const resolvedOptions = reactive({})
const loadingOptions = reactive({})

async function ensureOptions(item) {
  if (!item || item.type !== 'select' || typeof item.options !== 'string') return
  const fnName = item.options
  const cacheKey = item.key

  loadingOptions[cacheKey] = true
  const opts = await getOptions[fnName](item)

  loadingOptions[cacheKey] = false
  resolvedOptions[cacheKey] = opts || []

  return
}

const previewForm = async () => {
  console.log(getOptions.getOption4())
}

onMounted(() => {
  console.log('[Playground] 已挂载')
  leftlist.value.forEach((item) => ensureOptions(item))
})

onUnmounted(() => {
  console.log('[Playground] 已卸载')
})
</script>

<style scoped>
.playground {
  width: 100%;
  min-height: 100%;
  padding: 20px;
  box-sizing: border-box;
  background-color: #f5f7fa;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.pg-header {
  flex-shrink: 0;
}

.pg-title {
  margin: 0;
  color: #303133;
  font-size: 20px;
  font-weight: 600;
}

.pg-desc {
  margin: 6px 0 0;
  color: #909399;
  font-size: 13px;
  line-height: 1.6;
}

.pg-main {
  flex: 1;
  display: flex;
  gap: 20px;
  min-height: 0;
}

.pg-col {
  flex: 1;
  min-width: 0;
  display: flex;
}

.pg-col-left,
.pg-col-right {
  min-height: 400px;
}

.pg-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgb(0 0 0 / 8%);
  overflow: hidden;
}

.pg-card-header {
  flex-shrink: 0;
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
}

.pg-card-title {
  margin: 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.pg-card-body {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.config-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.config-item {
  padding: 16px;
  background: #fafbfc;
  border: 1px solid #ebeef5;
  border-radius: 6px;
}

.config-item-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.config-item-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #409eff;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
}

.select-head-row {
  margin-bottom: 8px;
}

.option-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-row {
  display: grid;
  grid-template-columns: 72px repeat(3, 1fr);
  align-items: center;
  gap: 8px;
}

.option-label {
  font-size: 12px;
  color: #909399;
}

@media (width <= 1024px) {
  .pg-main {
    flex-direction: column;
  }

  .pg-col-left,
  .pg-col-right {
    min-height: 300px;
  }
}

@media (width <= 768px) {
  .option-row {
    grid-template-columns: 72px 1fr;
  }
}
</style>
