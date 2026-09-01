<script lang="ts" setup>
// import { defineComponent } from 'vue'

// import { ref } from 'vue'

// // 1. 正确的泛型用法
// const list = ref<string[]>(['aaa']) 

// // 2. 联合类型 + 类型守卫
// function processData(data: string | string[]) {
//   if (Array.isArray(data)) { // 这是最常用的守卫！
//     return data.join(',')
//   }
//   return data.toUpperCase()//字符串
// }

// // 3. 接口 + 可选属性 + 实用类型
// interface User {
//   name: string
//   age?: number
// }
// // 用 Partial 让所有属性都可选，常用于组件Props
// type UpdateUser = Partial<User> 
// 直接复制到 Vue 文件中使用，存任何类型的数据都自动推导类型
import { ref, watch } from 'vue'

// 泛型 <T>：调用时传什么类型，返回值就是什么类型
export function useLocalStorage<T>(key: string, defaultValue: T) {
  // 读取数据，返回 T 类型（或是默认值）
  const read = (): T => {
    const stored = localStorage.getItem(key)
    if (stored === null) return defaultValue
    try {
      // 用 as T 告诉 TS：JSON.parse 出来的东西就是 T 类型
      return JSON.parse(stored) as T
    } catch {
      return defaultValue
    }
  }

  // 响应式数据，类型是 T（泛型）
  const data = ref<T>(read())

  // 监听变化，自动存回 localStorage
  watch(data, (newVal) => {
    localStorage.setItem(key, JSON.stringify(newVal))
  }, { deep: true })

  return data // 返回的类型是 Ref<T>
}

// ========== 调用示例（在 setup 里这样用） ==========
// 存字符串数组
const tags = useLocalStorage<string[]>('tags', ['默认标签'])
tags.value.push('新标签') // TS 知道 tags.value 是 string[]，支持 push

// 存复杂对象
interface Config {
  theme: 'dark' | 'light'
  fontSize: number
}
const config = useLocalStorage<Config>('appConfig', { theme: 'light', fontSize: 14 })
config.value.fontSize = 16 // TS 自动提示 fontSize 是 number，完美！
</script>
<!-- <script setup>

</script> -->
