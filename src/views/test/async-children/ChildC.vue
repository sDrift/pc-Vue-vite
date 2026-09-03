<template>
  <div class="child child-c">
    <div class="child-header">
      <span class="tag">组件 C</span>
      <span class="load-time">⏱ 加载完成于 {{ loadTime }} ms</span>
    </div>
    <h2>📝 表单示例</h2>
    <p>这是子组件 C —— 模拟一个表单</p>

    <el-form :model="form" label-width="80px" class="form">
      <el-form-item label="姓名">
        <el-input v-model="form.name" placeholder="请输入姓名" />
      </el-form-item>
      <el-form-item label="邮箱">
        <el-input v-model="form.email" placeholder="请输入邮箱" />
      </el-form-item>
      <el-form-item label="性别">
        <el-radio-group v-model="form.gender">
          <el-radio value="male">男</el-radio>
          <el-radio value="female">女</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="爱好">
        <el-checkbox-group v-model="form.hobbies">
          <el-checkbox value="music">音乐</el-checkbox>
          <el-checkbox value="sport">运动</el-checkbox>
          <el-checkbox value="code">编程</el-checkbox>
        </el-checkbox-group>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSubmit">提交</el-button>
        <el-button @click="onReset">重置</el-button>
      </el-form-item>
    </el-form>

    <div class="hint">
      💡 表单状态随组件卸载销毁；切回会重新初始化（这就是异步组件的"按需加载 + 自然销毁"）
    </div>
  </div>
</template>

<script setup>
import { ElMessage } from 'element-plus'
import { ref, reactive, onMounted } from 'vue'

const loadTime = ref(0)
const form = reactive({
  name: '',
  email: '',
  gender: 'male',
  hobbies: [],
})

onMounted(() => {
  const t = performance.now()

  console.log('[ChildC] 已挂载，时间戳:', t.toFixed(2))
  loadTime.value = t.toFixed(0)
})

const onSubmit = () => {
  if (!form.name) {
    ElMessage.warning('请输入姓名')

    return
  }
  ElMessage.success(`提交成功：${form.name}`)
  console.log('[ChildC] 提交：', { ...form })
}

const onReset = () => {
  form.name = ''
  form.email = ''
  form.gender = 'male'
  form.hobbies = []
}
</script>

<style scoped>
.child {
  padding: 24px;
  border-radius: 10px;
  animation: fade-in 0.35s ease;
}

.child-c {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  border: 1px solid #81c784;
}

.child-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.tag {
  padding: 2px 10px;
  background: #2e7d32;
  color: #fff;
  border-radius: 4px;
  font-size: 12px;
}

.load-time {
  font-size: 12px;
  color: #1b5e20;
}

h2 {
  margin: 0 0 8px;
  color: #1b5e20;
}

p {
  margin: 0 0 18px;
  color: #2e7d32;
}

.form {
  background: rgb(255 255 255 / 60%);
  padding: 18px 18px 4px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.hint {
  margin-top: 12px;
  padding: 10px 14px;
  background: rgb(255 255 255 / 50%);
  border-radius: 6px;
  font-size: 13px;
  color: #1b5e20;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
