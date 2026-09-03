<template>
  <div class="image-container">
    <div class="image-wrapper">
      <img src="./QQ20260106-171844.png" alt="展示图片" class="display-image" />
    </div>
  </div>
</template>

<script setup></script>

<style scoped lang="scss">
.image-container {
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #0a1128, #1e3a8a, #0f172a);
}

.image-wrapper {
  max-width: 90%;
  max-height: 90%;
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.display-image {
  max-width: 100%;
  max-height: 80vh;
  display: block;
  border-radius: 10px;
  object-fit: contain;
}
</style>
