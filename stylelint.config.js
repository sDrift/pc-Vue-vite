/* ============================================================================
 * Stylelint 配置（ES Module 格式）
 * ============================================================================
 *
 * 【文件作用】
 *   CSS / Less / SCSS / Vue <style> 的代码规范。
 *   命令行用 npx stylelint 扫描（glob 匹配 css / less / scss / vue 文件）。
 *   pre-commit 钩子通过 lint-staged 自动跑（只扫暂存区文件）。
 *
 * 【注意】
 *   块注释里不能写含星杠星杠（星杠= slash）的 glob 路径，否则会被当成
 *   注释结束符提前截断，后面文字变成非法语法触发 SyntaxError。
 *   所以本注释里只用文字描述命令，不写完整 glob。
 *
 * 【配置结构】
 *   用 ES Module 默认导出一个对象，stylelint 16+ 支持。
 *   字段含义：
 *     - extends:      继承预设规则集（在 rules 之前应用）
 *     - plugins:     额外插件（提供新规则，但不自动启用，要靠 rules 启用）
 *     - overrides:    针对特定文件扩展名用不同解析器
 *     - ignoreFiles:  忽略的文件/目录
 *     - rules:        实际规则（覆盖 extends 的同名规则）
 *
 * 【使用】
 *   npm run lint:style          扫描全项目（带缓存）
 *   npm run lint:style:fix      扫描 + 自动修复
 *   npx stylelint <文件路径>    扫描单个文件
 *   npx stylelint --fix <文件>  修复单个文件
 * ============================================================================ */

export default {
  /* ========================================================================
   * overrides —— 不同文件用不同解析器
   * ========================================================================
   * Vue SFC 的 <style> 需要特殊解析器（postcss-html）。
   * Less / SCSS 也要各自解析器，否则语法不识别。
   * ====================================================================== */
  overrides: [
    {
      files: ['**/*.vue'],
      customSyntax: 'postcss-html', // Vue SFC 解析器（识别 <style> 标签）
    },
    {
      files: ['**/*.less'],
      customSyntax: 'postcss-less', // Less 解析器
    },
    {
      files: ['**/*.scss'],
      customSyntax: 'postcss-scss', // SCSS 解析器
    },
  ],

  /* ========================================================================
   * extends —— 继承预设规则集
   * ========================================================================
   * stylelint-config-standard:           CSS 标准规则集（颜色、命名、单位等）
   * stylelint-config-recommended-vue:     Vue SFC 兼容（不报 /deep/ 等错误）
   * ====================================================================== */
  extends: [
    'stylelint-config-standard',
    'stylelint-config-recommended-vue',
  ],

  /* ========================================================================
   * plugins —— 额外插件（提供规则，但不自动启用）
   * ========================================================================
   * stylelint-order:                属性书写顺序（用 rules.order/properties-order 启用）
   * @stylistic/stylelint-plugin:    格式化风格规则（缩进、引号、空格）
   * ====================================================================== */
  plugins: [
    'stylelint-order',
    '@stylistic/stylelint-plugin',
  ],

  /* ========================================================================
   * ignoreFiles —— 忽略的文件/目录（不参与检查）
   * ======================================================================== */
  ignoreFiles: [
    '**/dist/**',            // 构建产物
    '**/node_modules/**',     // 第三方依赖
    '**/public/cesium/**',    // Cesium 拷贝来的资源
    '**/*.min.css',           // 压缩文件
  ],

  /* ========================================================================
   * rules —— 实际规则（覆盖 extends 的同名规则）
   * ========================================================================
   * 严重级别：null / off / warn / error
   *   - null:  关闭
   *   - warn:  警告
   *   - error: 报错
   * ====================================================================== */
  rules: {
    /* ---- 属性书写顺序（stylelint-order）----
     * 标准 CSS 书写顺序，方便阅读 + 减少 specificity 冲突：
     *   1. 定位（position / z-index）
     *   2. 盒模型（display / width / margin / padding / border）
     *   3. 背景/视觉（background / color / font）
     *   4. 动效（transform / transition / animation）
     * unspecified: bottomAlphabetical —— 未列出的属性按字母序排在末尾 */
    'order/properties-order': [
      [
        'position', 'top', 'right', 'bottom', 'left', 'z-index',
        'display', 'flex-direction', 'flex-wrap', 'justify-content', 'align-items',
        'align-content', 'flex-grow', 'flex-shrink', 'flex-basis',
        'float', 'clear', 'overflow',
        'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
        'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
        'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
        'border', 'border-top', 'border-right', 'border-bottom', 'border-left',
        'border-radius',
        'background', 'background-color', 'background-image', 'background-repeat',
        'background-size', 'background-position',
        'color', 'font-size', 'font-weight', 'line-height', 'letter-spacing',
        'text-align', 'vertical-align',
        'cursor', 'user-select',
        'transform', 'transition', 'animation', 'opacity', 'visibility',
        'box-shadow',
      ],
      { unspecified: 'bottomAlphabetical' },
    ],

    /* ---- 兼容 Vue / Less / Sass 语法 ---- */
    // 允许 :deep() / :global 这类 Vue scoped 选择器伪类
    'selector-pseudo-class-no-unknown': [true, { ignorePseudoClasses: ['deep', 'global'] }],
    // 允许 ::v-deep 这类 Vue 伪元素
    'selector-pseudo-element-no-unknown': [true, { ignorePseudoElements: ['v-deep'] }],
    // 允许 @use / @for / @each 等 Less / SCSS at-rules
    'at-rule-no-unknown': [true, {
      ignoreAtRules: ['tailwind', 'apply', 'screen', 'use', 'for', 'each', 'mixin', 'include', 'keyframes-rollback'],
    }],
    // 允许 vendor 前缀属性（-webkit- / -moz- 等）和 scrollbar 自定义属性
    'property-no-unknown': [true, { ignoreProperties: [/^-/, '/^vue-/', '/^scrollbar-/'] }],
    // 关闭选择器优先级降序检查（nested 写法会触发）
    'no-descending-specificity': null,

    /* ---- 格式化（@stylistic）---- */
    '@stylistic/indentation': 2,                          // 2 空格缩进
    '@stylistic/string-quotes': 'single',                 // 字符串单引号
    '@stylistic/no-missing-end-of-source-newline': true,  // 文件末尾保留空行
    '@stylistic/selector-list-comma-space-after': 'always', // 选择器逗号后加空格
    '@stylistic/declaration-block-trailing-semicolon': 'always', // 声明块尾随分号
    '@stylistic/block-opening-brace-space-before': 'always', // { 前加空格

    /* ---- 质量 ---- */
    'color-hex-length': 'short',               // hex 颜色用短格式：#fff 不写 #ffffff
    'color-no-invalid-hex': true,               // 禁止无效 hex 颜色
    'no-duplicate-selectors': true,             // 禁止重复选择器
    'declaration-block-no-duplicate-properties': true, // 禁止重复属性
    'block-no-empty': true,                     // 禁止空规则块
  },
}
