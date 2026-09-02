/* ============================================================================
 * ESLint 配置（Flat Config 格式，ESLint 9+ 专用）
 * ============================================================================
 *
 * 【文件作用】
 *   .js / .mjs / .cjs / .vue 源码的代码质量 + 风格规范。
 *   命令行 `npx eslint .` 扫描，`--fix` 自动修复，pre-commit 钩子里
 *   自动跑（通过 lint-staged 只扫暂存区文件）。
 *
 * 【配置结构】
 *   Flat Config 用一个数组，每个元素是一个 config 对象，按顺序合并。
 *   越靠后的元素优先级越高（rules 会覆盖前面）。
 *
 *   本文件 7 段：
 *     1. ignores              忽略文件
 *     2. js.configs.recommended      JS 基础推荐规则
 *     3. stylistic.configs.customize 代码风格（缩进、分号、引号等）
 *     4. import-x.flatConfigs       import 顺序 / 未用导入
 *     5. pluginVue.flat/recommended Vue SFC 规范 + 解析器
 *     6. prettierPlugin            关闭与 Prettier 冲突的规则 + 把 Prettier 作为规则
 *     7. 自定义 rules              项目特定规则（不强制阻断提交，多数是 warn）
 *
 * 【使用】
 *   npx eslint .                         扫描全项目
 *   npx eslint . --fix                   自动修复可修的
 *   npx eslint src/xxx.vue               扫描单个文件
 *   npm run lint                         等价 npx eslint . --cache
 *   npm run lint:check                   严格模式（有 warning 也报错，CI 用）
 * ============================================================================ */

import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import prettierPlugin from 'eslint-plugin-prettier/recommended'
import importX from 'eslint-plugin-import-x'
import stylistic from '@stylistic/eslint-plugin'
import tsParser from '@typescript-eslint/parser'

export default [
  /* ========================================================================
   * 1. ignores —— 忽略文件，不参与 lint
   * ========================================================================
   * 这些目录/文件 ESLint 根本不读，节省扫描时间。
   * 注意：Flat Config 用 ignores 字段，不是 .eslintignore 文件。
   * ====================================================================== */
  {
    ignores: [
      '**/dist/**',              // 构建产物
      '**/node_modules/**',      // 第三方依赖
      '**/public/cesium/**',     // Cesium 静态资源（从 node_modules 拷贝的）
      '**/*.config.{js,cjs,mjs}', // vite/eslint/stylelint 等配置文件
      '**/.husky/**',            // git 钩子脚本
      '**/coverage/**',          // 测试覆盖率报告
    ],
  },

  /* ========================================================================
   * 2. @eslint/js recommended —— JS 基础推荐规则
   * ========================================================================
   * 包含 no-undef / no-unused-vars / no-console 等通用规则。
   * 官方维护，跟着 ESLint 版本升级，是所有项目的起点。
   * ====================================================================== */
  js.configs.recommended,

  /* ========================================================================
   * 3. @stylistic —— 代码风格规则（缩进、分号、引号、空格等）
   * ========================================================================
   * customize() 工厂方法生成一份规则集，参数控制风格。
   * 跟 Prettier 协同：Prettier 管整体格式，@stylistic 管细粒度风格
   * （比如 padding-line-between-statements 这种 Prettier 不管的规则）。
   * ====================================================================== */
  stylistic.configs.customize({
    indent: 2,            // 2 空格缩进（跟 .prettierrc / .editorconfig 一致）
    quotes: 'single',     // 单引号（跟 Prettier 一致）
    semi: false,          // 不加分号（跟 Prettier 一致）
    arrowParens: 'always', // 箭头函数参数始终加括号
    braceStyle: '1tbs',   // 1tbs 风格：{ 跟 if 同行，} 单独一行
    commaDangle: 'only-multiline', // 多行尾随逗号，单行不加
  }),

  /* ========================================================================
   * 4. eslint-plugin-import-x —— import 规范
   * ========================================================================
   * 检查 import 顺序、重复导入、未用导入。
   * import-x 是 import 插件的重写版，性能更好。
   * ====================================================================== */
  importX.flatConfigs.recommended,
  {
    /* settings：配置 import-x 的解析器，让它认 Vite 的 @ alias */
    settings: {
      'import-x/resolver': {
        alias: {
          map: [['@', './src']],         // @ → src 目录
          extensions: ['.js', '.vue', '.json'],
        },
      },
    },
    rules: {
      /* import 顺序：内置模块 → 第三方 → 内部 → 父级 → 兄弟 → 当前目录
       * 分组之间空一行，组内按字母升序 */
      'import-x/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object', 'type'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import-x/no-unresolved': 'off',     // Vite alias 由打包器解析，不严格要求
      'import-x/no-duplicates': 'warn',    // 同一模块重复 import 警告
      'import-x/no-unused-modules': 'off',  // Vue 路由动态 import 解决，不强求
    },
  },

  /* ========================================================================
   * 5. eslint-plugin-vue flat/recommended —— Vue SFC 规范
   * ========================================================================
   * 内置用 vue-eslint-parser 解析 .vue 文件，分离 template / script /
   * style 三段。检查 Vue 特定规则：组件命名、prop 顺序、v-html 等。
   *
   * flat/recommended 是 Vue 9+ 提供的 Flat Config 版本。
   * ====================================================================== */
  ...pluginVue.configs['flat/recommended'],

  /* Vue 文件专用配置：声明 globals（避免 no-undef 误报）
   *
   * unplugin-auto-import 自动注入 Vue API（ref / reactive / onMounted 等），
   * 没显式 import 的话 ESLint 会以为未定义，所以在这里声明成全局。
   * 还声明了浏览器全局（window / document / console 等）。 */
  {
    files: ['**/*.vue'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // 浏览器全局
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        performance: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        fetch: 'readonly',
        encodeURIComponent: 'readonly',
        decodeURIComponent: 'readonly',
        Promise: 'readonly',
        // Node 全局（构建脚本可能用到）
        process: 'readonly',
        // unplugin-auto-import 注入的 Vue API
        ref: 'readonly',
        reactive: 'readonly',
        computed: 'readonly',
        watch: 'readonly',
        watchEffect: 'readonly',
        onMounted: 'readonly',
        onUnmounted: 'readonly',
        onBeforeUnmount: 'readonly',
        onBeforeMount: 'readonly',
        defineProps: 'readonly',
        defineEmits: 'readonly',
        defineExpose: 'readonly',
        defineOptions: 'readonly',
      },
      /* parser：vue-eslint-parser 把 <script> 块交给这个解析器解析。
         配 @typescript-eslint/parser —— 同时兼容 JS 和 TS 语法：
           - <script setup>（纯 JS）照常解析
           - <script lang="ts" setup>（TS 泛型 / 类型注解）也能解析
         不配的话默认用 espree，遇到 TS 语法（如 <T>）报 Unexpected token */
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        parser: tsParser,
      },
    },
  },

  /* ========================================================================
   * 6. eslint-plugin-prettier —— 把 Prettier 规则接入 ESLint
   * ========================================================================
   * prettierPlugin 内部做两件事：
   *   a. 引入 eslint-config-prettier，关闭所有 ESLint 里跟 Prettier
   *      冲突的格式化规则（比如 ESLint 的 quotes / semi / indent）
   *   b. 把 Prettier 的检查作为 ESLint 规则跑（规则名 prettier/prettier）
   *
   * 好处：统一在 ESLint 里跑 Prettier，不用分别执行两个工具。
   * ====================================================================== */
  prettierPlugin,

  /* ========================================================================
   * 7. 自定义规则（项目特定，覆盖前面所有段）
   * ========================================================================
   * 这里所有 rules 是项目实际想要的检查项。
   * 严重级别：off / warn / error
   *   - off:    关闭
   *   - warn:   警告但不阻断提交（pre-commit 钩子不会因 warn 失败）
   *   - error:  错误，会阻断 git commit
   * ====================================================================== */
  {
    files: ['**/*.{js,mjs,cjs,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      /* ---- 代码质量（eslint 核心）---- */
      'no-console': 'off',                                   // 关闭 console 检查（开发调试常用，不强制）
      'no-debugger': 'warn',                                 // 禁用 debugger（生产代码必须清掉）
      'no-unused-vars': ['warn', {                           // 未使用变量警告
        argsIgnorePattern: '^_',                             // 以下划线开头的参数忽略（约定未用）
        varsIgnorePattern: '^_',
      }],
      'no-undef': 'error',                                   // 未定义变量直接报错
      'no-var': 'error',                                     // 禁用 var，强制 let/const
      'prefer-const': 'warn',                                // 未重新赋值用 const
      'eqeqeq': ['warn', 'always', { null: 'ignore' }],      // 强等 ===，但允许跟 null 用 ==（惯例）
      'no-shadow': 'off',                                    // 关闭变量遮蔽检查（Vue ref 场景常见重名）
      'no-use-before-define': 'off',                         // 关闭先用后定义检查（Vue <script setup> 里事件处理函数互相调用常见，强约束反而碍事）
      'no-empty': ['warn', { allowEmptyCatch: true }],       // 空 catch 允许（异常处理不强制）
      'no-useless-escape': 'off',                            // 关闭无用转义检查（正则/模板里常见）
      'prefer-template': 'warn',                             // 字符串拼接改模板字符串
      'prefer-arrow-callback': 'warn',                      // 回调用箭头函数（保留 this）
      'object-shorthand': ['warn', 'always'],                // { x: x } → { x }

      /* ---- Vue 组件规则 ---- */
      'vue/multi-word-component-names': 'off',                // 允许单词组件名（如 App / Main）
      'vue/no-v-html': 'warn',                                // v-html 有 XSS 风险，警告
      'vue/html-self-closing': 'off',                         // 自闭合标签交给 Prettier 管
      'vue/require-default-prop': 'off',                     // 允许 prop 没默认值
      'vue/require-prop-types': 'warn',                      // prop 必须有类型
      'vue/no-mutating-props': 'warn',                       // 禁止直接改 props
      'vue/attribute-hyphenation': 'off',                    // 属性名不强求 kebab-case
      'vue/no-unused-vars': ['warn', { ignorePattern: '^_' }], // 模板里未用变量
      'vue/component-tags-order': ['warn', {                 // SFC 顺序：template → script → style
        order: ['template', 'script', 'style'],
      }],
      'vue/max-attributes-per-line': 'off',                  // 每行属性数交给 Prettier
      'vue/html-indent': 'off',                              // HTML 缩进交给 Prettier
      'vue/singleline-html-element-content-newline': 'off',
      'vue/first-attribute-linebreak': 'off',

      /* ---- Stylistic（Prettier 之外的细粒度风格）---- */
      '@stylistic/spaced-comment': ['warn', 'always', { markers: ['/'] }], // 注释 // 后加空格
      '@stylistic/padding-line-between-statements': [        // 语句间空行规则
        'warn',
        { blankLine: 'always', prev: '*', next: 'return' },                // return 前空行
        { blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' }, // 变量声明后空行
        { blankLine: 'any', prev: ['const', 'let', 'var'], next: ['const', 'let', 'var'] }, // 连续声明不强制空行
        { blankLine: 'always', prev: 'directive', next: '*' },             // 'use strict' 等指令后空行
        { blankLine: 'any', prev: 'directive', next: 'directive' },
      ],

      /* ---- Prettier（接入 Prettier 作为规则）---- */
      'prettier/prettier': 'warn',  // 格式不对就 warn，不强制 error 避免阻断提交
    },
  },
]
