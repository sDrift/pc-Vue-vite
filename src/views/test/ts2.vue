<script setup lang="ts">
// 1. 定义 Props 类型（用 interface 更清晰）
interface Props {
  title: string                // 必传
  count?: number               // 可选
  status: 'loading' | 'success' | 'error' // 固定值校验
}

// 2. 带默认值的 Props（用 withDefaults）
const props = withDefaults(defineProps<Props>(), {
  count: 0,                    // 没传 count 就默认 0
  status: 'loading'            // 没传 status 就默认 loading
})

// 3. 定义 Emits 类型（这里的语法是固定的，照抄就行）
const emit = defineEmits<{
  (e: 'update', value: number): void  // 触发 update 事件，传 number 类型
  (e: 'close'): void                   // 触发 close 事件，不传参
}>()

// 使用示例：点击按钮触发事件
const handleClick = () => {
  emit('update', props.count + 1)
}
</script>

<template>
  <div>
    <h1>{{ props.title }}</h1>
    <p>计数：{{ props.count }}</p>
    <button @click="handleClick">点我触发更新</button>
  </div>
</template>