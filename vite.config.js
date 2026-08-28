import { defineConfig, loadEnv } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import viteCompression from 'vite-plugin-compression'
import cdn from 'vite-plugin-cdn-import'

import { buildCdnModules } from './build/cdn.js'
import { addSriToCdnAssets } from './build/sri-plugin.js'
import { manualChunks } from './build/chunks.js'
import { optimizeDepsInclude, warmupClientFiles } from './build/optimize.js'

/* 路径辅助：使用 URL 形式更兼容 ESM */
const r = (p) => fileURLToPath(new URL(p, import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isProd = mode === 'production'

  /* 后端代理地址（可在 .env.development 中配） */
  const apiTarget = env.VITE_API_TARGET || 'http://localhost:8080'
  const apiPrefix = env.VITE_API_PREFIX || '/api'

  /* CDN 源：dev 永远 off，prod 默认 jsdelivr，可改 bootcdn/unpkg/off */
  const cdnProvider = isProd ? (env.VITE_CDN_PROVIDER || 'jsdelivr') : 'off'
  const cdnModules = buildCdnModules(cdnProvider)
  const isCdnEnabled = isProd && cdnProvider !== 'off' && cdnModules.length > 0

  return {
    /* ============================== 插件 ============================== */
    plugins: [
      vue(),

      /* 按需引入 1：自动 import Vue / Vue Router / Pinia / Element Plus 命令式 API */
      AutoImport({
        imports: ['vue', 'vue-router', 'pinia'],
        resolvers: [ElementPlusResolver()],
        dts: 'src/types/auto-imports.d.ts',
        eslintrc: { enabled: false },
      }),

      /* 按需引入 2：Element Plus 组件 + 样式按需注入 */
      Components({
        resolvers: [ElementPlusResolver()],
        dts: 'src/types/components.d.ts',
        dirs: [],
        extensions: ['vue'],
        deep: false,
      }),

      /* CDN 引入（仅生产构建启用；dev 走本地） */
      cdn({
        modules: cdnModules,
        verbose: isCdnEnabled,
        prodUrl: true,
        buildExcept: isCdnEnabled ? [] : undefined,
      }),

      /* SRI 防篡改：仅 CDN 启用时注入 integrity + crossorigin */
      isCdnEnabled && addSriToCdnAssets(cdnModules.map((m) => m.path)),

      /* gzip 压缩（生产构建时把 dist 里的 .js/.css 压成 .gz） */
      viteCompression({
        verbose: true,
        disable: !isProd,
        threshold: 10240,
        algorithm: 'gzip',
        ext: '.gz',
        deleteOriginFile: false,
      }),
    ],

    /* ============================== 路径别名 ============================== */
    resolve: {
      alias: { '@': r('./src') },
    },

    /* ============================== dev 预构建 ============================== */
    optimizeDeps: {
      include: optimizeDepsInclude,
    },

    /* ============================== dev 服务器 + 代理 ============================== */
    server: {
      host: '0.0.0.0',
      port: 5173,
      open: true,
      strictPort: false,
      warmup: { clientFiles: warmupClientFiles },
      proxy: {
        [apiPrefix]: {
          target: apiTarget,
          changeOrigin: true,
          rewrite: (p) => p.replace(new RegExp(`^${apiPrefix}`), ''),
          secure: false,
        },
        '/ws': {
          target: apiTarget.replace(/^http/, 'ws'),
          ws: true,
          changeOrigin: true,
        },
      },
    },

    /* ============================== 构建配置 ============================== */
    build: {
      target: 'es2018',
      cssTarget: 'chrome80',
      sourcemap: isProd ? false : true,
      chunkSizeWarningLimit: 2000,
      minify: 'esbuild',
      outDir: 'dist',
      assetsDir: 'assets',
      assetsInlineLimit: 4096,
      rollupOptions: {
        input: { main: r('./index.html') },
        output: {
          entryFileNames: 'assets/js/[name].[hash].js',
          chunkFileNames: 'assets/js/[name].[hash].js',
          assetFileNames: 'assets/[ext]/[name].[hash].[ext]',
          manualChunks,
          experimentalMinChunkSize: 1024,
        },
      },
    },

    /* ============================== esbuild / define ============================== */
    esbuild: {
      drop: isProd ? ['console', 'debugger'] : [],
    },
    define: {
      __APP_VERSION__: JSON.stringify(env.npm_package_version || '0.0.0'),
    },
  }
})
