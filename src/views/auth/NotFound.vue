<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <div class="not-found-code">404</div>
      <div class="not-found-message">抱歉，您访问的页面不存在</div>
      <div class="not-found-tip">可能是因为页面已被删除、移动或者您输入了错误的地址</div>
      <el-button type="primary" @click="goBack" class="go-back-button">返回首页</el-button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

// 返回首页
const goBack = () => {
  router.push('/dashboard');
};
</script>

<style scoped>
.not-found-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f5f5;
}

.not-found-content {
  text-align: center;
  padding: 60px 40px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.not-found-code {
  font-size: 120px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 20px;
  line-height: 1;
}

.not-found-message {
  font-size: 24px;
  color: #303133;
  margin-bottom: 10px;
}

.not-found-tip {
  font-size: 14px;
  color: #909399;
  margin-bottom: 30px;
}

.go-back-button {
  min-width: 120px;
}
</style>