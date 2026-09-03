/* global Buffer -- Node.js 构建脚本，用 Buffer 处理二进制 */
/**
 * sri-plugin.js — SRI 防篡改自定义 vite 插件
 *
 * 用法：
 *   import { addSriToCdnAssets } from './build/sri-plugin.js'
 *   plugins: [addSriToCdnAssets(cdnModules.map(m => m.path))]
 *
 * 功能：
 *   给 CDN 注入的 <script> / <link> 标签加防篡改属性：
 *     - integrity="sha512-..."          浏览器加载 CDN 文件后比对 hash，被篡改则拒绝执行
 *     - crossorigin="anonymous"         SRI 必须，否则跨域文件 hash 校验不生效
 *     - referrerpolicy="no-referrer"   不泄露 Referer 到 CDN 服务商
 *
 * 工作原理：
 *   1. transformIndexHtml 钩子（post 阶段，CDN 注入之后）扫描 HTML
 *   2. 找到 src/href 在 CDN 列表里的 <script> / <link> 标签
 *   3. fetch 每个 CDN 文件，计算 SHA-512 → base64
 *   4. 注入 integrity + crossorigin + referrerpolicy
 *
 * 失败降级：
 *   fetch 失败时不阻塞构建，仅警告，HTML 仍然注入 crossorigin + referrerpolicy（无 integrity）
 */
import crypto from 'node:crypto'

/** 计算 SRI hash（SHA-512 → base64） */
const computeIntegrity = async (url) => {
  try {
    const res = await fetch(url, { redirect: 'follow' })

    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const buf = Buffer.from(await res.arrayBuffer())
    const hash = crypto.createHash('sha512').update(buf).digest('base64')

    return `sha512-${hash}`
  } catch (err) {
    console.warn(`[SRI] 获取 ${url} 失败: ${err.message}，仅注入 crossorigin`)

    return null
  }
}

/** 清除属性字符串中的 integrity/crossorigin/referrerpolicy（避免重复） */
const stripOldAttrs = (s) =>
  s
    .replace(/\s*integrity="[^"]*"/gi, '')
    .replace(/\s*crossorigin="[^"]*"/gi, '')
    .replace(/\s*referrerpolicy="[^"]*"/gi, '')

export const addSriToCdnAssets = (cdnUrls) => {
  const urls = cdnUrls.filter(Boolean)

  return {
    name: 'add-sri-to-cdn-assets',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler: async (html) => {
        if (!urls.length) return html

        // 收集 HTML 中需要处理的 URL → 唯一去重
        const found = new Set()
        const scriptRe = /<script\b([^>]*)\bsrc="([^"]+)"([^>]*)><\/script>/g
        const linkRe = /<link\b([^>]*)\bhref="([^"]+)"([^>]*)>/g
        let m

        while ((m = scriptRe.exec(html)) !== null) {
          if (urls.includes(m[2])) found.add(m[2])
        }
        while ((m = linkRe.exec(html)) !== null) {
          if (urls.includes(m[2])) found.add(m[2])
        }

        // 并行获取所有 hash
        const hashEntries = await Promise.all(
          [...found].map(async (u) => [u, await computeIntegrity(u)]),
        )
        const hashMap = new Map(hashEntries)

        // 处理 <script src=...></script>
        // 注意：vite-plugin-cdn-import 默认已注入 crossorigin，要先去掉再加，避免重复
        html = html.replace(scriptRe, (full, pre, src, post) => {
          if (!urls.includes(src)) return full
          const integrity = hashMap.get(src)
          const newPre = stripOldAttrs(pre)
          const newPost = stripOldAttrs(post)
          const sriAttr = integrity ? ` integrity="${integrity}"` : ''

          return `<script${newPre} src="${src}"${newPost}${sriAttr} crossorigin="anonymous" referrerpolicy="no-referrer"></script>`
        })

        // 处理 <link href=...>
        html = html.replace(linkRe, (full, pre, href, post) => {
          if (!urls.includes(href)) return full
          const integrity = hashMap.get(href)
          const newPre = stripOldAttrs(pre)
          const newPost = stripOldAttrs(post)
          const sriAttr = integrity ? ` integrity="${integrity}"` : ''

          return `<link${newPre} href="${href}"${newPost}${sriAttr} crossorigin="anonymous" referrerpolicy="no-referrer">`
        })

        return html
      },
    },
  }
}
