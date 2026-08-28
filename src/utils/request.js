/**
 * request.js — Axios 请求封装
 *
 * 功能：
 *   1. 统一 baseURL（来自 .env 的 VITE_API_PREFIX，默认 /api）
 *   2. 超时控制（默认 15s，可在调用时覆盖）
 *   3. 请求拦截：自动注入 token / Content-Type
 *   4. 响应拦截：统一解构 res.data → 业务 code 判定 → 自动 ElMessage 提示
 *   5. 取消重复请求（AbortController）：同 URL+method+params 的请求未完成时再发会被取消
 *   6. 业务错误码处理（401 → 退出登录、403 → 无权限、500 → 服务器错误）
 *   7. 文件上传 / 下载便捷方法
 *
 * 使用：
 *   import request from '@/utils/request'
 *   request.get('/users', { params: { page: 1 } })
 *   request.post('/user', { name: 'Tom' })
 *   request.upload('/upload', file)
 *   request.download('/export', { params: { id: 1 } })
 */
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'

/* ======================================================================
 * 配置项（从 env 读取，便于不同环境不同配置）
 * ====================================================================== */
const BASE_URL = import.meta.env.VITE_API_PREFIX || '/api'
const TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 15000

/* ======================================================================
 * 取消请求管理：同 URL + method + 序列化参数 视为重复请求
 *   pending map 结构：key -> { controller, cancelTime }
 * ====================================================================== */
const pendingMap = new Map()

/** 生成请求唯一 key */
const genKey = (config) => {
  const { method, url, params, data } = config
  return [method, url, JSON.stringify(params || {}), JSON.stringify(data || {})].join('&')
}

/** 加入 pending */
const addPending = (config) => {
  const key = genKey(config)
  if (pendingMap.has(key)) {
    // 已有同 key 在飞：取消掉旧的（保留新的）
    pendingMap.get(key).controller.abort()
  }
  const controller = new AbortController()
  config.signal = controller.signal
  pendingMap.set(key, { controller, time: Date.now() })
}

/** 移除 pending */
const removePending = (config) => {
  const key = genKey(config)
  pendingMap.delete(key)
}

/* ======================================================================
 * token 管理：从 localStorage / sessionStorage 取，可按项目实际改
 * ====================================================================== */
const getToken = () => {
  return (
    localStorage.getItem('token') ||
    sessionStorage.getItem('token') ||
    ''
  )
}

/* ======================================================================
 * 创建 axios 实例
 * ====================================================================== */
const service = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  withCredentials: false,   // 跨域是否带 cookie
  headers: {
    'X-Requested-with': 'XMLHttpRequest',
  },
})

/* ======================================================================
 * 请求拦截器
 * ====================================================================== */
service.interceptors.request.use(
  (config) => {
    // 1. 注入 token
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // 2. 默认 Content-Type
    if (!config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json;charset=utf-8'
    }

    // 3. 防重复请求（除非显式声明 noCancel: true）
    if (config.noCancel !== true) {
      addPending(config)
    }

    return config
  },
  (err) => {
    // 请求未发出（极少见）
    return Promise.reject(err)
  }
)

/* ======================================================================
 * 响应拦截器
 *   假设后端返回格式：{ code: 0, message: '...', data: ... }
 *   - code === 0：业务成功，直接返回 data
 *   - code === 401：token 失效，弹登录框
 *   - code === 403：无权限
 *   - 其它 code：业务错误，弹 ElMessage.error
 *   - HTTP 状态非 2xx：走 catch 分支（见下方 errorHandler）
 * ====================================================================== */
service.interceptors.response.use(
  (response) => {
    // 1. 移除 pending
    if (response.config.noCancel !== true) {
      removePending(response.config)
    }

    // 2. blob/arraybuffer 直接返回（文件下载）
    if (response.config.responseType === 'blob' || response.config.responseType === 'arraybuffer') {
      return response
    }

    const res = response.data
    // 3. 不是标准对象结构，直接返回（如纯字符串）
    if (res == null || typeof res !== 'object') {
      return res
    }

    // 4. 业务 code 判定
    const code = res.code ?? res.status ?? 0
    const message = res.message || res.msg || '请求失败'

    if (code === 0 || code === 200 || code === '0' || code === '200') {
      // 业务成功：返回 data（如果没 data 字段就返回整个 res）
      return res.data !== undefined ? res.data : res
    }

    // 5. 401：token 失效
    if (code === 401) {
      ElMessageBox.confirm('登录状态已过期，请重新登录', '提示', {
        confirmButtonText: '重新登录',
        cancelButtonText: '取消',
        type: 'warning',
      }).then(() => {
        localStorage.removeItem('token')
        sessionStorage.removeItem('token')
        location.reload()
      }).catch(() => {})
      return Promise.reject(new Error(message))
    }

    // 6. 403：无权限
    if (code === 403) {
      ElMessage.error(`无权限：${message}`)
      return Promise.reject(new Error(message))
    }

    // 7. 其它业务错误
    ElMessage.error(message)
    return Promise.reject(new Error(message))
  },
  (error) => {
    // 取消的请求不提示（用户主动触发的）
    if (axios.isCancel(error) || error?.name === 'CanceledError') {
      return Promise.reject(error)
    }

    // 网络错误 / HTTP 错误统一处理
    const { response, config, message } = error
    let errMsg = '请求失败'

    if (response) {
      // HTTP 状态码错误
      const status = response.status
      switch (status) {
        case 400: errMsg = '请求参数错误'; break
        case 401:
          errMsg = '未授权，请重新登录'
          ElMessageBox.confirm('登录状态已过期，请重新登录', '提示', {
            confirmButtonText: '重新登录',
            type: 'warning',
          }).then(() => {
            localStorage.removeItem('token')
            sessionStorage.removeItem('token')
            location.reload()
          }).catch(() => {})
          break
        case 403: errMsg = '拒绝访问'; break
        case 404: errMsg = '请求地址不存在'; break
        case 408: errMsg = '请求超时'; break
        case 500: errMsg = '服务器内部错误'; break
        case 502: errMsg = '网关错误'; break
        case 503: errMsg = '服务不可用'; break
        case 504: errMsg = '网关超时'; break
        default: errMsg = `HTTP ${status}：${response.statusText || '请求失败'}`
      }
      // 移除 pending
      if (config && config.noCancel !== true) {
        removePending(config)
      }
    } else if (message && message.includes('timeout')) {
      errMsg = '请求超时，请检查网络'
    } else if (message && message.includes('Network Error')) {
      errMsg = '网络异常，请检查网络连接'
    } else if (error instanceof Error) {
      errMsg = error.message
    }

    // 不需要自动提示的请求（silent: true）
    if (config?.silent !== true) {
      ElMessage.error(errMsg)
    }
    return Promise.reject(error)
  }
)

/* ======================================================================
 * 对外暴露便捷方法
 * ====================================================================== */
const request = {
  /** GET */
  get(url, config = {}) {
    return service.get(url, config)
  },
  /** POST */
  post(url, data = {}, config = {}) {
    return service.post(url, data, config)
  },
  /** PUT */
  put(url, data = {}, config = {}) {
    return service.put(url, data, config)
  },
  /** PATCH */
  patch(url, data = {}, config = {}) {
    return service.patch(url, data, config)
  },
  /** DELETE */
  delete(url, config = {}) {
    return service.delete(url, config)
  },

  /**
   * 文件上传
   * @param {string} url      上传地址
   * @param {File|File[]|FormData} file
   * @param {object} extra    额外字段（拼到 FormData）
   * @param {object} config   axios 配置（可含 onUploadProgress）
   */
  upload(url, file, extra = {}, config = {}) {
    let form = file
    if (!(file instanceof FormData)) {
      form = new FormData()
      if (Array.isArray(file)) {
        file.forEach((f) => form.append('files', f))
      } else {
        form.append('file', file)
      }
      Object.keys(extra).forEach((k) => form.append(k, extra[k]))
    }
    return service.post(url, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,   // 上传给足时间
      ...config,
    })
  },

  /**
   * 文件下载
   * @param {string} url
   * @param {object} config
   * @returns {Promise<Blob>}
   */
  download(url, config = {}) {
    return service.get(url, {
      responseType: 'blob',
      ...config,
    }).then((res) => {
      // res 是 axios response（responseType=blob 时拦截器直接返回 response）
      const blob = res.data || res
      // 从 Content-Disposition 解析文件名
      const disposition = res.headers?.['content-disposition'] || ''
      let filename = 'download'
      const match = /filename\*?=(?:UTF-8'')?([^;]+)/i.exec(disposition)
      if (match && match[1]) {
        filename = decodeURIComponent(match[1].replace(/^["']|["']$/g, ''))
      }
      // 触发浏览器下载
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)
      return blob
    })
  },

  /** 取消所有正在飞的请求（路由切换时用） */
  cancelAll() {
    pendingMap.forEach((p) => p.controller.abort())
    pendingMap.clear()
  },
}

/* 暴露原始实例 + 便捷方法 */
export default request
export { service as axiosInstance }
