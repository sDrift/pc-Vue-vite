<template>
  <div class="async-loader-test">
    <el-card shadow="hover" class="main-card">
      <template #header>
        <div class="card-header">
          <span>异步组件按需加载测试</span>
          <el-tag type="success">defineAsyncComponent + 动态 import</el-tag>
        </div>
      </template>

      <!-- 三个按钮 -->
      <div class="btn-row">
        <el-button
          v-for="k in keys"
          :key="k"
          :type="isShown(k) ? 'primary' : 'default'"
          @click="showChild(k)"
        >
          {{ btnLabels[k] }}
        </el-button>

        <el-button
          type="warning"
          plain
          class="reset-btn"
          :disabled="!currents.length"
          @click="unmountAll"
        >
          全部卸载
        </el-button>
      </div>

      <!-- 状态信息 -->
      <div class="status-row">
        <div class="status-item">
          <span class="label">正在显示：</span>
          <el-tag
            v-for="c in currents"
            :key="c.key"
            size="small"
            type="success"
            style="margin-right: 6px"
          >
            {{ c.key.toUpperCase() }}
          </el-tag>
          <span v-if="!currents.length" class="empty">（暂无显示中的组件）</span>
        </div>
        <div class="status-item">
          <span class="label">已加载过的 chunk：</span>
          <el-tag
            v-for="k in loadedKeys"
            :key="k"
            size="small"
            :type="isShown(k) ? 'success' : 'info'"
            style="margin-right: 6px"
          >
            {{ k.toUpperCase() }}
          </el-tag>
          <span v-if="!loadedKeys.length" class="empty">（尚未加载任何组件）</span>
        </div>
      </div>

      <!-- 渲染区：所有点击过的组件并排显示 -->
      <div class="render-area">
        <!-- v-for：累加显示所有已激活的组件 -->
        <div
          v-for="c in currents"
          :key="c.key"
          class="render-card"
        >
          <div class="render-header">
            <span class="render-title">{{ c.key.toUpperCase() }} · {{ labels[c.key] }}</span>
            <el-button
              text
              size="small"
              type="danger"
              @click="unmount(c.key)"
            >
              卸载
            </el-button>
          </div>
          <component :is="c.comp" />
        </div>

        <!-- 占位提示 -->
        <div v-if="!currents.length" class="placeholder">
          <el-icon><MessageBox /></el-icon>
          <p>点击上方任一按钮，对应子组件将按需加载并显示</p>
          <p class="small">
            💡 点击多个按钮后，所有已加载的组件会同时显示在下方，互不影响<br />
            打开浏览器 DevTools → Network → 切到 JS 分类，<br />
            会看到 <code>ChildA.[hash].js</code> / <code>ChildB.[hash].js</code> / <code>ChildC.[hash].js</code> 只在点击对应按钮后才会出现
          </p>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
/**
 * AsyncLoaderTest — 异步组件按需加载测试
 *
 * 实现要点：
 *   1. 子组件【不】在文件顶部用 `import ChildA from '...'` 静态引入
 *      —— 静态引入会被打包到主 chunk，首屏就下载了
 *   2. 用 Vue 的 `defineAsyncComponent({ loader: () => import('...') })` 包装
 *      —— 工厂函数 `() => import(...)` 只有 wrapper 真正渲染时才执行
 *   3. 用 `shallowRef` 存当前组件（不要用 ref，深响应会无故触发异步组件更新）
 *   4. 用 `<component :is="current" />` 渲染当前组件
 *   5. 加 cache：同一个子组件第二次切换时不再重新创建 wrapper，
 *      Vite/Webpack 也会自动缓存已下载的 chunk
 */

import { shallowRef, ref, computed, provide, inject } from 'vue';
import { defineAsyncComponent } from 'vue';
import { MessageBox } from '@element-plus/icons-vue';

/* ====================================================================
 * withRetry — 自动重试辅助函数（指数退避）
 *
 *   作用：把普通的 () => import('...') 包成带重试的 Promise
 *   原因：defineAsyncComponent 一旦 loader reject 就永久卡死，
 *        在它"卡死"之前，先在 loader 内部自动重试 N 次处理网络抖动
 *
 *   参数：
 *     fn      : 原始的 () => import('...')，返回 Promise
 *     maxRetry: 最多重试次数（默认 3）
 *   返回值：返回一个 Promise，加载成功 resolve；最终失败 reject
 *
 *   退避策略：第 N 次重试等待 500 * N ms（500 / 1000 / 1500）
 * ==================================================================== */
const withRetry = (fn, maxRetry = 3) => {
  return new Promise((resolve, reject) => {
    let attempt = 0;
    const run = () => {
      fn()
        .then((mod) => resolve(mod))
        .catch((err) => {
          attempt += 1;
          if (attempt <= maxRetry) {
            const wait = 500 * attempt;
            console.warn(
              `[AsyncLoader] 加载失败，${wait}ms 后进行第 ${attempt}/${maxRetry} 次自动重试…`,
              err
            );
            setTimeout(run, wait);
          } else {
            console.error(`[AsyncLoader] 自动重试 ${maxRetry} 次后仍失败，等待手动重试`, err);
            reject(err);
          }
        });
    };
    run();
  });
};

/* ====================================================================
 * 子组件 loader 工厂表
 *
 * 关键点：这里【不直接调用 defineAsyncComponent】，而是把"创建 wrapper"的动作
 *       包成一个函数 `() => defineAsyncComponent(...)`。
 *       这样一来：
 *         - 文件加载时，loader 表只是声明，没有真正创建 wrapper，更没有触发 import
 *         - 只有用户点击按钮，调用 `loaders[key]()` 时才创建 wrapper，
 *           wrapper 内部 `() => import('./async-children/ChildA.vue')` 才会被执行 → 才下载 chunk
 *
 * 另一个写法：直接写死 loaders.a = () => defineAsyncComponent(() => import('./async-children/ChildA.vue'))
 * 这里用模板字符串 `./async-children/Child${Key}.vue`，配合 Vite/Webpack 的"动态导入"
 * 会自动把目录下所有匹配的 .vue 各自打成独立 chunk，正好满足"按需下载"需求
 * ==================================================================== */
const makeLoader = (key) => () => {
  // 注意：key 必须是静态可推导的，所以用 map 而不是纯模板字符串
  const map = {
    a: () => import('./async-children/ChildA.vue'),
    b: () => import('./async-children/ChildB.vue'),
    c: () => import('./async-children/ChildC.vue'),
  };
  return defineAsyncComponent({
    // 用 withRetry 包装：loader 内部失败时自动重试 3 次（500/1000/1500ms）
    //   重试都失败后，loader 才真正 reject → wrapper 进入 error 状态
    loader: () => withRetry(map[key], 3),
    // 加载中显示的组件（可选）
    loadingComponent: {
      template: '<div class="async-loading">⏳ 正在加载组件…</div>',
    },
    // 加载失败显示的组件（可选）
    //   重试按钮通过 inject('reloadAsync') 拿到父组件提供的 reload 函数，
    //   点击后销毁当前 wrapper + 重建新 wrapper（defineAsyncComponent 的 error
    //   状态只能通过换实例来"重启"）
    errorComponent: {
      name: `AsyncError_${key.toUpperCase()}`,
      setup() {
        // inject：从父组件拿到 reloadAsync 函数
        //   默认值 () => {} 防止在没有 provide 的环境下报错
        const reloadAsync = inject('reloadAsync', () => {});
        const handleRetry = () => reloadAsync(key);
        return { handleRetry };
      },
      template: `
        <div class="async-error">
          <p>❌ 组件 ${key.toUpperCase()} 加载失败</p>
          <p class="err-tip">已自动重试 3 次仍失败，可手动重试</p>
          <button class="retry-btn" @click="handleRetry">手动重试</button>
        </div>
      `,
    },
    delay: 200,    // 200ms 内加载完不显示 loading
    timeout: 10000, // 10 秒还没好就显示 error
  });
};

const loaders = {
  a: makeLoader('a'),
  b: makeLoader('b'),
  c: makeLoader('c'),
};

/* ====================================================================
 * 状态
 *   currents: 已加入显示列表的组件数组 [{ key, comp }]，保持插入顺序
 *   loadedKeys: 已经触发过 import 的 key 列表（用于状态展示，不重复加入）
 *   cache: 每个 key 对应的 wrapper 缓存，避免重复创建
 * ==================================================================== */
const currents = ref([]);           // 正在显示的组件列表
const loadedKeys = ref([]);         // 已经加载过的 key 列表（用于展示状态）
const cache = {};                   // 缓存：避免每次点击都重新创建 wrapper

/* UI 展示用 */
const keys = ['a', 'b', 'c'];
const labels = { a: '数据概览', b: '图片画廊', c: '表单示例' };
const btnLabels = {
  a: '① 加载组件 A',
  b: '② 加载组件 B',
  c: '③ 加载组件 C',
};

/* 该 key 是否正在显示列表中（用于按钮高亮） */
const isShown = (k) => currents.value.some((c) => c.key === k);

/* ====================================================================
 * 点击按钮：加载并加入显示列表
 *   - 首次点击：创建 wrapper（开始下载 chunk）→ 加入 currents 显示
 *   - 已加载过但已卸载：复用缓存，重新加入显示（不重新下载）
 *   - 已在显示列表中：忽略重复点击
 * ==================================================================== */
const showChild = (key) => {
  // 已在显示列表，忽略
  if (isShown(key)) {
    console.log(`[AsyncLoader] 组件 ${key.toUpperCase()} 已在显示列表，忽略重复点击`);
    return;
  }

  // 首次点击才创建 wrapper（此时才开始下载 chunk）
  if (!cache[key]) {
    cache[key] = loaders[key]();
    loadedKeys.value.push(key);
    console.log(`[AsyncLoader] 首次加载组件 ${key.toUpperCase()}，已触发动态 import()`);
  } else {
    console.log(`[AsyncLoader] 重新显示组件 ${key.toUpperCase()}（复用缓存，不再下载）`);
  }

  // 追加到显示列表（保持插入顺序）
  currents.value = [...currents.value, { key, comp: cache[key] }];
};

/* 卸载单个组件：从显示列表移除（缓存保留，下次点回秒切） */
const unmount = (key) => {
  currents.value = currents.value.filter((c) => c.key !== key);
  console.log(`[AsyncLoader] 卸载组件 ${key.toUpperCase()}（缓存保留）`);
};

/* ====================================================================
 * reloadAsync — 手动重连函数（解决 defineAsyncComponent 卡死问题）
 *
 *   背景：defineAsyncComponent 一旦 loader reject，wrapper 进入 error 状态后
 *        不再调 loader。即使切换组件、重新挂载，它还是显示 errorComponent。
 *        必须销毁旧 wrapper 实例 + 创建新 wrapper 才能重新加载。
 *
 *   做法：
 *     1. 删除 cache[key]：旧 wrapper 实例被丢弃（GC 回收）
 *     2. 重新调 loaders[key]() 创建新 wrapper
 *     3. 用新 wrapper 替换 currents 数组里的对应项
 *        - 用 :key 不变 + comp 引用变化，触发 <component :is> 重新渲染
 *
 *   provide：把这个函数提供给子 errorComponent，让它的"重试"按钮能调用
 * ==================================================================== */
const reloadAsync = (key) => {
  console.log(`[AsyncLoader] 手动重连组件 ${key.toUpperCase()}，重建 wrapper…`);
  // 1) 丢弃旧 wrapper
  delete cache[key];
  // 2) 创建新 wrapper（会重新触发 loader → withRetry → import）
  cache[key] = loaders[key]();
  // 3) 替换 currents 里的对应项（保持顺序）
  currents.value = currents.value.map((c) =>
    c.key === key ? { key, comp: cache[key] } : c
  );
};

// 把 reloadAsync 提供给子组件的 errorComponent 用 inject 拿到
provide('reloadAsync', reloadAsync);

/* 卸载所有（缓存保留，下次重新点按钮仍可秒切） */
const unmountAll = () => {
  console.log('[AsyncLoader] 卸载所有显示中的组件');
  currents.value = [];
};

/* 清空缓存（强制下次重新下载，用于测试"重新加载"） */
const clearCache = () => {
  Object.keys(cache).forEach((k) => delete cache[k]);
  loadedKeys.value = [];
  currents.value = [];
  console.log('[AsyncLoader] 已清空组件缓存');
};
// 暴露给外部调试（可选）
defineExpose({ clearCache });
</script>

<style scoped lang="scss">
.async-loader-test {
  padding: 20px;
}
:deep(.render-card) {
  .tag {
    color: red;
  }
} 

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
}

.btn-row {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.reset-btn {
  margin-left: auto;
}

.status-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 13px;
}
.status-item {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}
.label {
  color: #606266;
  margin-right: 8px;
}
.empty {
  color: #c0c4cc;
  font-style: italic;
}

.render-area {
  min-height: 300px;
  padding: 16px;
  border: 1px dashed #dcdfe6;
  border-radius: 8px;
  background: #fafafa;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 16px;
  align-items: start;
}

/* 单个组件区块 */
.render-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  min-height: 300px;
}
.render-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
  font-size: 13px;
}
.render-title {
  color: #303133;
  font-weight: 600;
}

/* 加载中 */
.async-loading {
  text-align: center;
  padding: 30px;
  color: #409eff;
  width: 100%;
}

/* 失败提示 + 手动重试按钮 */
.async-error {
  text-align: center;
  padding: 30px 16px;
  color: #f56c6c;
  width: 100%;
}
.async-error p {
  margin: 6px 0;
}
.async-error .err-tip {
  font-size: 12px;
  color: #909399;
}
.async-error .retry-btn {
  margin-top: 12px;
  padding: 6px 16px;
  background: #409eff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.2s;
}
.async-error .retry-btn:hover {
  background: #66b1ff;
}

.placeholder {
  text-align: center;
  padding: 40px 20px;
  color: #909399;
}
.placeholder .el-icon {
  font-size: 40px;
  color: #c0c4cc;
}
.placeholder p {
  margin: 12px 0;
}
.placeholder .small {
  font-size: 12px;
  color: #c0c4cc;
  line-height: 1.8;
}
.placeholder code {
  background: #fff;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 12px;
  color: #606266;
}

/* 子组件内部用的 loading/error 样式（因为 loadingComponent 是内联组件，scoped 样式覆盖不到，写在全局） */
:deep(.async-loading) {
  padding: 30px;
  text-align: center;
  color: #409eff;
  font-size: 14px;
}
:deep(.async-error) {
  padding: 30px;
  text-align: center;
  color: #f56c6c;
  font-size: 14px;
}
</style>
