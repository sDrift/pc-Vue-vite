<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="formRules"
    :label-width="labelWidth"
    :label-position="labelPosition"
    :disabled="disabled"
  >
    <el-row :gutter="gutter">
      <template v-for="item in schema" :key="item.field">
        <el-col v-if="visibleState[item.field]" :span="item.span || 24">
          <el-form-item :label="item.label" :prop="item.field" :required="item.required">
            <!-- 文本输入 -->
            <el-input
              v-if="item.type === 'input'"
              v-model="formData[item.field]"
              :placeholder="item.placeholder || `请输入${item.label}`"
              :clearable="item.clearable !== false"
              :maxlength="item.maxlength"
              :show-word-limit="!!item.maxlength"
              :prefix-icon="item.prefixIcon"
            />

            <!-- 文本域 -->
            <el-input
              v-else-if="item.type === 'textarea'"
              v-model="formData[item.field]"
              type="textarea"
              :rows="item.rows || 3"
              :placeholder="item.placeholder || `请输入${item.label}`"
              :maxlength="item.maxlength"
              :show-word-limit="!!item.maxlength"
            />

            <!-- 数字 -->
            <el-input-number
              v-else-if="item.type === 'number'"
              v-model="formData[item.field]"
              :min="item.min"
              :max="item.max"
              :step="item.step || 1"
              :precision="item.precision"
              :controls-position="item.controlsPosition || 'right'"
              style="width: 100%"
            />

            <!-- 下拉选择 -->
            <el-select
              v-else-if="item.type === 'select'"
              v-model="formData[item.field]"
              :multiple="item.multiple"
              :clearable="item.clearable !== false"
              :filterable="item.filterable"
              :placeholder="item.placeholder || `请选择${item.label}`"
              style="width: 100%"
            >
              <el-option
                v-for="opt in item.options"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>

            <!-- 单选 -->
            <el-radio-group v-else-if="item.type === 'radio'" v-model="formData[item.field]">
              <el-radio v-for="opt in item.options" :key="opt.value" :label="opt.value">
                {{ opt.label }}
              </el-radio>
            </el-radio-group>

            <!-- 多选 -->
            <el-checkbox-group v-else-if="item.type === 'checkbox'" v-model="formData[item.field]">
              <el-checkbox v-for="opt in item.options" :key="opt.value" :label="opt.value">
                {{ opt.label }}
              </el-checkbox>
            </el-checkbox-group>

            <!-- 开关 -->
            <el-switch
              v-else-if="item.type === 'switch'"
              v-model="formData[item.field]"
              :active-text="item.activeText"
              :inactive-text="item.inactiveText"
              :active-value="item.activeValue ?? true"
              :inactive-value="item.inactiveValue ?? false"
            />

            <!-- 滑块 -->
            <el-slider
              v-else-if="item.type === 'slider'"
              v-model="formData[item.field]"
              :min="item.min ?? 0"
              :max="item.max ?? 100"
              :step="item.step || 1"
              :show-input="item.showInput"
              :range="item.range"
            />

            <!-- 评分 -->
            <el-rate
              v-else-if="item.type === 'rate'"
              v-model="formData[item.field]"
              :max="item.max || 5"
              :allow-half="item.allowHalf"
              :show-text="item.showText"
              :texts="item.texts"
            />

            <!-- 日期 -->
            <el-date-picker
              v-else-if="item.type === 'date'"
              v-model="formData[item.field]"
              :type="item.dateType || 'date'"
              :placeholder="item.placeholder || '请选择日期'"
              :value-format="item.valueFormat || 'YYYY-MM-DD'"
              :format="item.format"
              style="width: 100%"
            />

            <!-- 时间 -->
            <el-time-picker
              v-else-if="item.type === 'time'"
              v-model="formData[item.field]"
              :value-format="item.valueFormat || 'HH:mm:ss'"
              :placeholder="item.placeholder || '请选择时间'"
              style="width: 100%"
            />

            <!-- 颜色 -->
            <el-color-picker
              v-else-if="item.type === 'color'"
              v-model="formData[item.field]"
              :show-alpha="item.showAlpha"
            />

            <!-- 级联 -->
            <el-cascader
              v-else-if="item.type === 'cascader'"
              v-model="formData[item.field]"
              :options="item.options"
              :props="item.cascaderProps"
              :clearable="item.clearable !== false"
              style="width: 100%"
            />

            <!-- 不支持的字段类型 -->
            <div v-else class="unknown-type">⚠ 未知字段类型: {{ item.type }}</div>

            <!-- 字段提示 -->
            <div v-if="item.tip" class="field-tip">{{ item.tip }}</div>
          </el-form-item>
        </el-col>
      </template>

      <!-- 提交按钮 -->
      <el-col v-if="showSubmit" :span="24">
        <el-form-item>
          <el-button type="primary" @click="handleSubmit">提交</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button @click="handleValidate">校验</el-button>
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>

<script setup>
/**
 * DynamicFormGenerator — 根据配置化 schema 动态渲染表单
 *
 * 一个 schema item 的字段：
 *   field    : 必填，表单字段名（对应 v-model 的 key）
 *   label    : 必填，字段标签
 *   type     : 必填，控件类型，见下方 TYPE 列表
 *   required : 是否必填（true 时自动加校验）
 *   span     : 栅格宽度，默认 24（满行）
 *   default  : 默认值
 *   tip      : 字段下方提示文字
 *
 * 各类型独有参数见 README（或 DynamicFormTest.vue 的 schema 示例）
 */
import { ref, reactive, computed, watch } from 'vue'

const props = defineProps({
  /* schema 数组：每个 item 描述一个表单字段 */
  schema: {
    type: Array,
    default: () => [],
  },
  /* 表单初始值（可选，会覆盖 schema 中的 default） */
  modelValue: {
    type: Object,
    default: () => ({}),
  },
  /* 标签宽度 */
  labelWidth: {
    type: [String, Number],
    default: '100px',
  },
  /* 标签位置：left / right / top */
  labelPosition: {
    type: String,
    default: 'right',
  },
  /* 栅格间距 */
  gutter: {
    type: Number,
    default: 16,
  },
  /* 是否禁用整个表单 */
  disabled: {
    type: Boolean,
    default: false,
  },
  /* 是否显示底部提交按钮 */
  showSubmit: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['submit', 'reset', 'validate', 'update:modelValue'])

/* 支持的字段类型 */
const SUPPORTED_TYPES = [
  'input',
  'textarea',
  'number',
  'select',
  'radio',
  'checkbox',
  'switch',
  'slider',
  'rate',
  'date',
  'time',
  'color',
  'cascader',
]

const formRef = ref(null)

/* 根据 schema 生成 formData（响应式） */
const buildFormData = () => {
  const obj = {}

  console.log(props.schema)
  props.schema.forEach((item) => {
    // 默认值优先级：modelValue > item.default > 类型默认值
    if (props.modelValue[item.field] !== undefined) {
      obj[item.field] = props.modelValue[item.field]
    } else if (item.default !== undefined) {
      obj[item.field] = item.default
    } else {
      // 根据类型给默认值，避免 v-model 警告
      switch (item.type) {
        case 'checkbox':
          obj[item.field] = []
          break
        case 'switch':
          obj[item.field] = false
          break
        case 'number':
        case 'rate':
        case 'slider':
          obj[item.field] = item.min ?? 0
          break
        default:
          obj[item.field] = ''
      }
    }
  })
  console.log(obj)

  return reactive(obj)
}

const formData = buildFormData()

/* 根据 schema 生成校验规则（required + 自定义 validator） */
const formRules = computed(() => {
  const rules = {}

  props.schema.forEach((item) => {
    // 隐藏的字段不参与校验（避免隐藏必填项挡住提交）
    if (visibleState.value && visibleState.value[item.field] === false) return
    const arr = []

    if (item.required) {
      arr.push({
        required: true,
        message: `${item.label}不能为空`,
        trigger: ['blur', 'change'],
        // checkbox 类型默认空数组，用 type: 'array' 校验
        type: item.type === 'checkbox' ? 'array' : undefined,
      })
    }
    if (item.validator) {
      arr.push({ validator: item.validator, trigger: ['blur', 'change'] })
    }
    if (arr.length) rules[item.field] = arr
  })

  return rules
})

/* ====================================================================
 * 联动：visibleWhen 条件评估
 *
 *   schema item 可选 visibleWhen 字段：
 *     方式 1（单条件）：
 *       { visibleWhen: { field: 'has_car', op: 'eq', value: 'yes' } }
 *     方式 2（多条件 AND/OR，默认 AND）：
 *       { visibleWhen: [{...}, {...}], visibleWhenLogic: 'or' }
 *
 *   支持的运算符（op）：
 *     eq / ne      : 等于 / 不等于
 *     in / notIn   : 在数组 / 不在数组（value 必须是数组）
 *     gt / lt      : 大于 / 小于
 *     gte / lte    : 大于等于 / 小于等于
 *     contains     : 字符串包含
 *     truthy/falsy : 有值 / 无值（value 留空）
 *
 *   隐藏时默认清空字段值（避免提交无关数据），可用 clearWhenHidden: false 关闭
 * ==================================================================== */
const checkCondition = (cond, data) => {
  if (!cond || !cond.field) return true
  const actual = data[cond.field]
  const expected = cond.value

  switch (cond.op) {
    case 'eq':
      return actual === expected
    case 'ne':
      return actual !== expected
    case 'in':
      return Array.isArray(expected) && expected.includes(actual)
    case 'notIn':
      return Array.isArray(expected) && !expected.includes(actual)
    case 'gt':
      return typeof actual === 'number' && actual > expected
    case 'lt':
      return typeof actual === 'number' && actual < expected
    case 'gte':
      return typeof actual === 'number' && actual >= expected
    case 'lte':
      return typeof actual === 'number' && actual <= expected
    case 'contains':
      return String(actual ?? '').includes(expected)
    case 'truthy':
      return !!actual && !(Array.isArray(actual) && actual.length === 0)
    case 'falsy':
      return !actual || (Array.isArray(actual) && actual.length === 0)
    default:
      return true
  }
}

const checkVisible = (item, data) => {
  if (!item.visibleWhen) return true
  const conds = Array.isArray(item.visibleWhen) ? item.visibleWhen : [item.visibleWhen]
  const logic = item.visibleWhenLogic || 'and'

  return logic === 'or'
    ? conds.some((c) => checkCondition(c, data))
    : conds.every((c) => checkCondition(c, data))
}

/* 各字段当前是否可见的映射表 */
const visibleState = computed(() => {
  const state = {}
  // 用 spread 拿一份快照，避免在 computed 里读 reactive 触发循环
  const data = { ...formData }

  props.schema.forEach((item) => {
    state[item.field] = checkVisible(item, data)
  })
  console.log(state)

  return state
})

/* 监听可见性变化：字段从可见→隐藏时清空值（除非 clearWhenHidden=false） */
watch(
  visibleState,
  (state) => {
    props.schema.forEach((item) => {
      if (state[item.field] === false && item.clearWhenHidden !== false) {
        const cur = formData[item.field]

        // 已是空值就跳过
        if (cur === '' || cur === undefined || cur === null) return
        if (Array.isArray(cur) && cur.length === 0) return
        // 按类型给默认空值
        if (item.type === 'checkbox') formData[item.field] = []
        else if (item.type === 'switch') formData[item.field] = item.inactiveValue ?? false
        else if (['number', 'rate', 'slider'].includes(item.type))
          formData[item.field] = item.min ?? 0
        else formData[item.field] = ''
      }
    })
  },
  { deep: true },
)

/* 监听 schema 变化重建 formData（保留旧值如果字段还在） */
watch(
  () => props.schema,
  (newSchema) => {
    const oldData = { ...formData }
    const newObj = {}

    newSchema.forEach((item) => {
      // 旧值优先；其次用 default；最后类型默认
      if (oldData[item.field] !== undefined) {
        newObj[item.field] = oldData[item.field]
      } else if (item.default !== undefined) {
        newObj[item.field] = item.default
      } else if (item.type === 'checkbox') {
        newObj[item.field] = []
      } else if (item.type === 'switch') {
        newObj[item.field] = false
      } else if (['number', 'rate', 'slider'].includes(item.type)) {
        newObj[item.field] = item.min ?? 0
      } else {
        newObj[item.field] = ''
      }
    })
    // 替换 formData 的字段（保持 reactive 引用）
    Object.keys(formData).forEach((k) => delete formData[k])
    Object.assign(formData, newObj)
  },
  { deep: true },
)

/* 监听 formData 变化同步给父组件 */
watch(
  formData,
  (val) => {
    emit('update:modelValue', { ...val })
  },
  { deep: true },
)

/* 提交：先校验再 emit */
const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    emit('submit', { ...formData })
  } catch (err) {
    console.warn('[DynamicForm] 校验失败', err)
  }
}

/* 重置 */
const handleReset = () => {
  formRef.value.resetFields()
  emit('reset', { ...formData })
}

/* 单独触发校验 */
const handleValidate = async () => {
  try {
    await formRef.value.validate()
    emit('validate', { valid: true, data: { ...formData } })
  } catch (err) {
    emit('validate', { valid: false, error: err })
  }
}

/* 暴露方法给父组件调用 */
defineExpose({
  validate: () => formRef.value?.validate(),
  resetFields: () => formRef.value?.resetFields(),
  clearValidate: () => formRef.value?.clearValidate(),
  getFormData: () => ({ ...formData }),
  setFormData: (newData) => Object.assign(formData, newData),
})
</script>

<style scoped>
.field-tip {
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
  margin-top: 4px;
}

.unknown-type {
  color: #f56c6c;
  font-size: 13px;
  padding: 6px 0;
}
</style>
