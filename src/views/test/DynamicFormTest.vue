<template>
  <div class="dynamic-form-test">
    <el-page-header :icon="null" title="动态表单生成器" content="可视化 schema 编辑 + 实时预览" />

    <div class="layout">
      <!-- 左侧：schema 可视化编辑 -->
      <el-card class="schema-editor" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>📋 Schema 编辑</span>
            <el-space>
              <el-button size="small" @click="addField">+ 添加字段</el-button>
              <el-button size="small" @click="exportSchema">导出 JSON</el-button>
              <el-button size="small" @click="importSchemaDialog = true">导入 JSON</el-button>
              <el-button size="small" type="warning" @click="loadPreset('user')">
                用户表单
              </el-button>
              <el-button size="small" type="warning" @click="loadPreset('order')">
                订单表单
              </el-button>
              <el-button size="small" type="warning" @click="loadPreset('survey')">
                问卷表单
              </el-button>
            </el-space>
          </div>
        </template>

        <div class="field-list">
          <div v-for="(item, idx) in schema" :key="idx" class="field-row">
            <div class="field-row-head">
              <span class="field-idx">{{ idx + 1 }}</span>
              <el-tag size="small" type="info">{{ item.type }}</el-tag>
              <span class="field-name">{{ item.field }}</span>
              <el-button
                text
                size="small"
                type="danger"
                style="margin-left: auto"
                @click="removeField(idx)"
              >
                删除
              </el-button>
            </div>

            <el-row :gutter="10" class="field-row-body">
              <el-col :span="6">
                <el-input v-model="item.field" placeholder="字段名" size="small">
                  <template #prepend>field</template>
                </el-input>
              </el-col>
              <el-col :span="6">
                <el-input v-model="item.label" placeholder="标签" size="small">
                  <template #prepend>label</template>
                </el-input>
              </el-col>
              <el-col :span="6">
                <el-select v-model="item.type" size="small" @change="onTypeChange(item)">
                  <el-option
                    v-for="t in typeList"
                    :key="t.value"
                    :label="t.label"
                    :value="t.value"
                  />
                </el-select>
              </el-col>
              <el-col :span="6">
                <el-input-number
                  v-model="item.span"
                  :min="1"
                  :max="24"
                  size="small"
                  style="width: 100%"
                  controls-position="small"
                >
                  <template #prepend>span</template>
                </el-input-number>
              </el-col>
            </el-row>

            <el-row :gutter="10" class="field-row-body">
              <el-col :span="6">
                <el-checkbox v-model="item.required">必填</el-checkbox>
              </el-col>
              <el-col :span="9">
                <el-input v-model="item.placeholder" placeholder="placeholder" size="small" />
              </el-col>
              <el-col :span="9">
                <el-input v-model="item.tip" placeholder="字段提示" size="small" />
              </el-col>
            </el-row>

            <!-- 联动配置：visibleWhen -->
            <el-row :gutter="10" class="field-row-body link-row">
              <el-col :span="4">
                <el-checkbox
                  :model-value="!!item.visibleWhen"
                  @change="(v) => toggleVisibleWhen(item, v)"
                >
                  联动
                </el-checkbox>
              </el-col>
              <template v-if="item.visibleWhen">
                <el-col :span="7">
                  <el-select
                    v-model="item.visibleWhen.field"
                    placeholder="依赖字段"
                    size="small"
                    style="width: 100%"
                  >
                    <el-option
                      v-for="o in schema.filter((s) => s.field !== item.field)"
                      :key="o.field"
                      :label="o.label"
                      :value="o.field"
                    />
                  </el-select>
                </el-col>
                <el-col :span="5">
                  <el-select v-model="item.visibleWhen.op" size="small" style="width: 100%">
                    <el-option label="等于 =" value="eq" />
                    <el-option label="不等于 ≠" value="ne" />
                    <el-option label="在...中" value="in" />
                    <el-option label="不在...中" value="notIn" />
                    <el-option label="大于 >" value="gt" />
                    <el-option label="小于 <" value="lt" />
                    <el-option label="≥" value="gte" />
                    <el-option label="≤" value="lte" />
                    <el-option label="包含" value="contains" />
                    <el-option label="有值" value="truthy" />
                    <el-option label="无值" value="falsy" />
                  </el-select>
                </el-col>
                <el-col v-if="!['truthy', 'falsy'].includes(item.visibleWhen.op)" :span="8">
                  <el-input
                    v-model="valueText[item.field]"
                    placeholder="值（in/notIn 用逗号分隔）"
                    size="small"
                    @blur="commitVisibleWhenValue(item)"
                  />
                </el-col>
              </template>
            </el-row>

            <!-- 数字/滑块/评分专属 -->
            <el-row
              v-if="['number', 'slider', 'rate'].includes(item.type)"
              :gutter="10"
              class="field-row-body"
            >
              <el-col :span="8">
                <el-input-number
                  v-model="item.min"
                  placeholder="最小值"
                  size="small"
                  style="width: 100%"
                />
              </el-col>
              <el-col :span="8">
                <el-input-number
                  v-model="item.max"
                  placeholder="最大值"
                  size="small"
                  style="width: 100%"
                />
              </el-col>
              <el-col :span="8">
                <el-input-number
                  v-model="item.step"
                  placeholder="步长"
                  size="small"
                  style="width: 100%"
                />
              </el-col>
            </el-row>

            <!-- 输入框专属 -->
            <el-row
              v-if="['input', 'textarea'].includes(item.type)"
              :gutter="10"
              class="field-row-body"
            >
              <el-col :span="12">
                <el-input v-model="item.default" placeholder="默认值" size="small" />
              </el-col>
              <el-col :span="12">
                <el-input-number
                  v-model="item.maxlength"
                  :min="0"
                  placeholder="最大字数"
                  size="small"
                  style="width: 100%"
                >
                  <template #prepend>maxlength</template>
                </el-input-number>
              </el-col>
            </el-row>

            <!-- 选项型字段：options 编辑器 -->
            <div
              v-if="['select', 'radio', 'checkbox', 'cascader'].includes(item.type)"
              class="options-editor"
            >
              <div class="options-title">
                <span>选项列表</span>
                <el-button text size="small" @click="addOption(item)">+ 添加选项</el-button>
              </div>
              <div v-for="(opt, oi) in item.options" :key="oi" class="option-row">
                <el-input v-model="opt.label" placeholder="标签" size="small" style="flex: 1" />
                <el-input v-model="opt.value" placeholder="值" size="small" style="flex: 1" />
                <el-button text size="small" type="danger" @click="item.options.splice(oi, 1)">
                  删
                </el-button>
              </div>
              <el-empty
                v-if="!item.options || !item.options.length"
                description="暂无选项"
                :image-size="40"
              />
            </div>
          </div>

          <el-empty v-if="!schema.length" description="还没有字段，点击「添加字段」开始" />
        </div>
      </el-card>

      <!-- 右侧：实时预览 + 数据预览 -->
      <div class="right-side">
        <el-card class="preview-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>👁 表单实时预览</span>
              <el-space>
                <span class="ctrl-label">标签宽度</span>
                <el-input-number
                  v-model="labelWidth"
                  :min="60"
                  :max="200"
                  :step="10"
                  size="small"
                  controls-position="small"
                />
                <span class="ctrl-label">标签位置</span>
                <el-select v-model="labelPosition" size="small" style="width: 90px">
                  <el-option label="左" value="left" />
                  <el-option label="右" value="right" />
                  <el-option label="上" value="top" />
                </el-select>
                <span class="ctrl-label">间距</span>
                <el-input-number
                  v-model="gutter"
                  :min="0"
                  :max="40"
                  size="small"
                  controls-position="small"
                />
                <el-checkbox v-model="formDisabled">禁用</el-checkbox>
              </el-space>
            </div>
          </template>

          <DynamicFormGenerator
            ref="formRef"
            :schema="schema"
            :label-width="labelWidth + 'px'"
            :label-position="labelPosition"
            :gutter="gutter"
            :disabled="formDisabled"
            @submit="onSubmit"
            @reset="onReset"
            @validate="onValidate"
          />
        </el-card>

        <el-card class="data-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>📤 表单数据预览</span>
              <el-button size="small" @click="copyData">复制 JSON</el-button>
            </div>
          </template>
          <pre class="data-pre">{{ JSON.stringify(lastData, null, 2) }}</pre>
        </el-card>
      </div>
    </div>

    <!-- 导入 schema 对话框 -->
    <el-dialog v-model="importSchemaDialog" title="导入 Schema JSON" width="600">
      <el-input
        v-model="importText"
        type="textarea"
        :rows="10"
        placeholder='[{"field":"username","label":"用户名","type":"input","required":true}]'
      />
      <template #footer>
        <el-button @click="importSchemaDialog = false">取消</el-button>
        <el-button type="primary" @click="doImport">导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
/**
 * DynamicFormTest — 动态表单生成器测试页
 *
 * 左：schema 可视化编辑（增删字段、调类型、改属性、管理 options）
 * 右上：表单实时预览（可调 label 宽度/位置/间距/禁用）
 * 右下：表单数据 JSON 实时预览（提交后更新）
 */
import { ElMessage } from 'element-plus'
import { ref, reactive } from 'vue'

import DynamicFormGenerator from '@/components/DynamicFormGenerator.vue'

/* 联动配置辅助：valueText 缓存用户输入的字符串，commitVisibleWhenValue 时再转成 JS 值 */
const valueText = reactive({})

/* 启用 / 关闭某个字段的联动 */
const toggleVisibleWhen = (item, enabled) => {
  if (enabled) {
    item.visibleWhen = { field: '', op: 'eq', value: '' }
    valueText[item.field] = ''
  } else {
    delete item.visibleWhen
    delete valueText[item.field]
  }
}

/* 把输入字符串转成 JS 值并写入 visibleWhen.value
 *   - in / notIn 运算符：按逗号分隔成字符串数组
 *   - 数字比较运算符：转 number
 *   - 其它：先尝试 JSON.parse（支持 true/false/null/数字/带引号字符串），失败则用原字符串
 *
 * 这样用户输入 true / 123 / "abc" 都能正确转成对应类型
 */
const commitVisibleWhenValue = (item) => {
  const text = valueText[item.field] ?? ''
  const op = item.visibleWhen.op
  let val = text

  if (['in', 'notIn'].includes(op)) {
    val = text
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  } else if (['gt', 'lt', 'gte', 'lte'].includes(op)) {
    val = text === '' ? '' : Number(text)
  } else {
    // eq / ne / contains：尝试 JSON 解析，支持 true/false/null/number/"string"
    try {
      val = JSON.parse(text)
    } catch {
      val = text // 解析失败保留原字符串
    }
  }
  item.visibleWhen.value = val
}

const schema = ref([])
const formRef = ref(null)
const labelWidth = ref(100)
const labelPosition = ref('right')
const gutter = ref(16)
const formDisabled = ref(false)

/* 最近一次提交的数据（或最后实时数据） */
const lastData = ref({})

/* 支持的字段类型 */
const typeList = [
  { label: '文本输入 input', value: 'input' },
  { label: '文本域 textarea', value: 'textarea' },
  { label: '数字 number', value: 'number' },
  { label: '下拉选择 select', value: 'select' },
  { label: '单选 radio', value: 'radio' },
  { label: '多选 checkbox', value: 'checkbox' },
  { label: '开关 switch', value: 'switch' },
  { label: '滑块 slider', value: 'slider' },
  { label: '评分 rate', value: 'rate' },
  { label: '日期 date', value: 'date' },
  { label: '时间 time', value: 'time' },
  { label: '颜色 color', value: 'color' },
  { label: '级联 cascader', value: 'cascader' },
]

/* 默认字段模板（按类型生成合理默认值） */
const defaultField = (type = 'input') => {
  const idx = schema.value.length + 1
  const base = {
    field: `field_${idx}`,
    label: `字段 ${idx}`,
    type,
    span: 24,
    required: false,
    placeholder: '',
    tip: '',
  }

  if (['select', 'radio', 'checkbox'].includes(type)) {
    base.options = [
      { label: '选项一', value: 'opt1' },
      { label: '选项二', value: 'opt2' },
    ]
  } else if (type === 'cascader') {
    base.options = [
      {
        value: 'cat1',
        label: '分类一',
        children: [
          { value: 'sub1', label: '子分类一' },
          { value: 'sub2', label: '子分类二' },
        ],
      },
    ]
  }

  return base
}

const addField = () => {
  schema.value.push(defaultField('input'))
}

const removeField = (idx) => {
  schema.value.splice(idx, 1)
}

/* 类型切换时补默认 options（如果需要） */
const onTypeChange = (item) => {
  if (['select', 'radio', 'checkbox', 'cascader'].includes(item.type)) {
    if (!item.options || !item.options.length) {
      item.options = [
        { label: '选项一', value: 'opt1' },
        { label: '选项二', value: 'opt2' },
      ]
    }
  } else {
    delete item.options
  }
}

const addOption = (item) => {
  if (!item.options) item.options = []
  item.options.push({ label: '', value: '' })
}

/* 提交 / 重置 / 校验事件 */
const onSubmit = (data) => {
  lastData.value = data
  ElMessage.success('提交成功，数据已更新到下方')
  console.log('[DynamicFormTest] submit', data)
}

const onReset = (data) => {
  lastData.value = data
  ElMessage.info('已重置')
}

const onValidate = (result) => {
  if (result.valid) {
    ElMessage.success('校验通过')
    lastData.value = result.data
  } else {
    ElMessage.error('校验失败，请检查必填项')
  }
}

/* 实时同步当前表单数据到预览区 */
const syncData = () => {
  if (formRef.value) {
    lastData.value = formRef.value.getFormData()
  }
}

/* 周期性同步（轻量，1 秒一次） */
setInterval(syncData, 1000)

/* 导出 JSON */
const exportSchema = () => {
  const text = JSON.stringify(schema.value, null, 2)

  navigator.clipboard
    .writeText(text)
    .then(() => {
      ElMessage.success('Schema JSON 已复制到剪贴板')
    })
    .catch(() => {
      console.log(text)
      ElMessage.warning('复制失败，已输出到控制台')
    })
}

/* 导入 JSON */
const importSchemaDialog = ref(false)
const importText = ref('')

const doImport = () => {
  try {
    const arr = JSON.parse(importText.value)

    if (!Array.isArray(arr)) throw new Error('需要是数组')
    schema.value = arr
    importSchemaDialog.value = false
    importText.value = ''
    ElMessage.success(`已导入 ${arr.length} 个字段`)
  } catch (err) {
    ElMessage.error(`JSON 格式错误: ${err.message}`)
  }
}

/* 复制当前数据 */
const copyData = () => {
  const text = JSON.stringify(lastData.value, null, 2)

  navigator.clipboard
    .writeText(text)
    .then(() => {
      ElMessage.success('数据 JSON 已复制')
    })
    .catch(() => {
      console.log(text)
    })
}

/* 内置预设：用户 / 订单 / 问卷 */
const presets = {
  user: [
    {
      field: 'username',
      label: '用户名',
      type: 'input',
      required: true,
      span: 12,
      maxlength: 20,
      tip: '4-20 个字符',
    },
    { field: 'phone', label: '手机号', type: 'input', required: true, span: 12, maxlength: 11 },
    { field: 'email', label: '邮箱', type: 'input', span: 12 },
    { field: 'age', label: '年龄', type: 'number', span: 12, min: 0, max: 120, default: 18 },
    {
      field: 'gender',
      label: '性别',
      type: 'radio',
      span: 12,
      options: [
        { label: '男', value: 'male' },
        { label: '女', value: 'female' },
      ],
    },
    {
      field: 'hobby',
      label: '爱好',
      type: 'checkbox',
      span: 12,
      options: [
        { label: '阅读', value: 'read' },
        { label: '运动', value: 'sport' },
        { label: '音乐', value: 'music' },
      ],
    },
    {
      field: 'intro',
      label: '个人简介',
      type: 'textarea',
      span: 24,
      maxlength: 200,
      tip: '最多 200 字',
    },
  ],
  order: [
    {
      field: 'orderNo',
      label: '订单号',
      type: 'input',
      required: true,
      span: 12,
      default: 'ORD-001',
    },
    {
      field: 'orderType',
      label: '订单类型',
      type: 'select',
      span: 12,
      options: [
        { label: '普通', value: 'normal' },
        { label: '加急', value: 'urgent' },
        { label: '预约', value: 'booking' },
      ],
    },
    { field: 'amount', label: '金额', type: 'number', span: 12, min: 0, precision: 2, default: 0 },
    { field: 'quantity', label: '数量', type: 'slider', span: 12, min: 1, max: 100, default: 1 },
    { field: 'priority', label: '优先级', type: 'rate', span: 12, max: 5, default: 3 },
    { field: 'deliveryDate', label: '送货日期', type: 'date', span: 12, required: true },
    { field: 'deliveryTime', label: '送货时间', type: 'time', span: 12 },
    { field: 'remark', label: '备注', type: 'textarea', span: 24 },
  ],
  survey: [
    {
      field: 'satisfaction',
      label: '满意度',
      type: 'rate',
      span: 24,
      max: 10,
      showText: true,
      texts: ['极差', '失望', '一般', '满意', '惊喜'],
      default: 5,
    },

    /* —— 联动 1：是否推荐 → 显示"推荐理由" —— */
    {
      field: 'recommend',
      label: '是否推荐',
      type: 'switch',
      span: 12,
      activeText: '会',
      inactiveText: '不会',
    },
    {
      field: 'recommend_reason',
      label: '推荐理由',
      type: 'textarea',
      span: 24,
      maxlength: 200,
      tip: '只有"是否推荐"打开时才显示',
      visibleWhen: { field: 'recommend', op: 'eq', value: true },
    },

    /* —— 联动 2：使用频率 → 显示"使用场景" —— */
    {
      field: 'frequency',
      label: '使用频率',
      type: 'radio',
      span: 12,
      options: [
        { label: '每天', value: 'daily' },
        { label: '每周', value: 'weekly' },
        { label: '每月', value: 'monthly' },
        { label: '偶尔', value: 'rarely' },
      ],
    },
    {
      field: 'frequency_other',
      label: '其他频率',
      type: 'input',
      span: 12,
      placeholder: '请填写',
      visibleWhen: { field: 'frequency', op: 'eq', value: 'rarely' },
    },

    /* —— 联动 3：了解渠道（多选）包含"朋友推荐" → 显示"推荐人姓名" —— */
    {
      field: 'channel',
      label: '了解渠道',
      type: 'checkbox',
      span: 24,
      options: [
        { label: '搜索引擎', value: 'search' },
        { label: '社交媒体', value: 'social' },
        { label: '朋友推荐', value: 'friend' },
        { label: '广告', value: 'ad' },
      ],
    },
    {
      field: 'referrer',
      label: '推荐人姓名',
      type: 'input',
      span: 12,
      required: true,
      tip: '勾选了"朋友推荐"才会出现，且为必填',
      visibleWhen: { field: 'channel', op: 'contains', value: 'friend' },
    },

    /* —— 联动 4：评分 ≥ 8 才显示"高赞评价" —— */
    {
      field: 'praise',
      label: '高赞评价',
      type: 'textarea',
      span: 24,
      maxlength: 300,
      tip: '满意度 ≥ 8 分才显示',
      visibleWhen: { field: 'satisfaction', op: 'gte', value: 8 },
    },

    { field: 'theme', label: '主题色', type: 'color', span: 12, default: '#409eff' },
    {
      field: 'feedback',
      label: '反馈意见',
      type: 'textarea',
      span: 24,
      maxlength: 500,
      required: true,
    },
  ],
}

const loadPreset = (name) => {
  schema.value = JSON.parse(JSON.stringify(presets[name]))
  // 同步 valueText：把 visibleWhen.value 反向序列化到联动 UI 的输入框
  Object.keys(valueText).forEach((k) => delete valueText[k])
  console.log(schema.value)
  schema.value.forEach((item) => {
    if (item.visibleWhen) {
      const v = item.visibleWhen.value

      if (Array.isArray(v)) valueText[item.field] = v.join(',')
      else if (typeof v === 'object') valueText[item.field] = JSON.stringify(v)
      else valueText[item.field] = String(v ?? '')
    }
  })
  ElMessage.success(`已加载 ${name === 'user' ? '用户' : name === 'order' ? '订单' : '问卷'} 预设`)
}

/* 初始加载用户表单预设 */
loadPreset('user')
</script>

<style scoped>
.dynamic-form-test {
  padding: 20px;
}

.layout {
  display: grid;
  grid-template-columns: minmax(500px, 1fr) minmax(500px, 1fr);
  gap: 16px;
  margin-top: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 15px;
  font-weight: 600;
}

.right-side {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* schema 编辑器字段列表 */
.field-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field-row {
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background: #fafbfc;
}

.field-row-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.field-idx {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #409eff;
  color: #fff;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.field-name {
  font-weight: 500;
  color: #303133;
}

.field-row-body {
  margin-bottom: 8px;
}

/* 联动配置行 */
.link-row {
  background: #fdf6ec;
  padding: 6px 8px;
  border-radius: 4px;
  margin-bottom: 8px;
}

/* options 编辑器 */
.options-editor {
  margin-top: 8px;
  padding: 8px;
  background: #fff;
  border-radius: 4px;
  border: 1px dashed #dcdfe6;
}

.options-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  font-size: 12px;
  color: #606266;
}

.option-row {
  display: flex;
  gap: 6px;
  margin-bottom: 4px;
}

/* 数据预览 */
.data-pre {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 12px;
  border-radius: 6px;
  font-size: 13px;
  font-family: Consolas, Monaco, monospace;
  overflow: auto;
  max-height: 400px;
  margin: 0;
}

.ctrl-label {
  font-size: 12px;
  color: #909399;
  margin-right: 4px;
}

/* 响应式 */
@media (width <= 1100px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
</style>
