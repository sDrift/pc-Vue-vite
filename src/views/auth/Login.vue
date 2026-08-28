<template>
  <div class="login-container">
    <div class="login-form-wrapper">
      <h2 class="login-title">后台管理系统登录</h2>
      <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="loginForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleLogin" :loading="loading" style="width: 100%">登录</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/modules/user';
import { ElMessage } from 'element-plus';

// 获取路由和用户store
const router = useRouter();
const userStore = useUserStore();

// 表单引用
const loginFormRef = ref();

// 加载状态
const loading = ref(false);

// 登录表单数据
const loginForm = ref({
  username: 'admin',
  password: 'admin123'
});

// 表单验证规则
const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
};

// 处理登录
const handleLogin = async () => {
  try {
    // 表单验证
    await loginFormRef.value.validate();
    
    // 设置加载状态
    loading.value = true;
    
    // 模拟登录请求延迟
    setTimeout(() => {
      // 这里可以添加实际的登录API调用
      // 模拟成功登录
      userStore.login(loginForm.value);
      
      // 显示成功消息
      ElMessage.success('登录成功');
      
      // 跳转到首页
      router.push('/dashboard');
      
      // 重置加载状态
      loading.value = false;
    }, 1000);
  } catch (error) {
    // 验证失败或登录失败
    console.error('登录失败:', error);
    loading.value = false;
    if (error.name !== 'validate') {
      ElMessage.error('登录失败，请检查用户名和密码');
    }
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f5f5;
}

.login-form-wrapper {
  width: 400px;
  padding: 40px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.login-title {
  text-align: center;
  margin-bottom: 30px;
  color: #303133;
}

.el-input {
  width: 100%;
}
</style>