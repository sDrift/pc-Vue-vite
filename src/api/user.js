/**
 * user API 模块示例
 *   展示如何使用封装后的 request 工具
 *
 * 文件命名约定：src/api/<模块>.js，模块名对应后端资源
 */
import request from '@/utils/request'

/**
 * 用户列表查询
 * @param {object} params - { page, size, keyword, ... }
 * @returns {Promise<{list: Array, total: number}>}
 */
export function getUserList(params) {
  return request.get('/users', { params })
}

/**
 * 用户详情
 * @param {number|string} id
 */
export function getUserDetail(id) {
  return request.get(`/users/${id}`)
}

/**
 * 新增用户
 * @param {object} data - { name, phone, email, ... }
 */
export function createUser(data) {
  return request.post('/users', data)
}

/**
 * 更新用户
 * @param {number|string} id
 * @param {object} data
 */
export function updateUser(id, data) {
  return request.put(`/users/${id}`, data)
}

/**
 * 删除用户
 * @param {number|string} id
 */
export function deleteUser(id) {
  return request.delete(`/users/${id}`)
}

/**
 * 批量删除用户（noCancel: true 避免重复点被取消）
 * @param {number[]} ids
 */
export function batchDeleteUsers(ids) {
  return request.post('/users/batch-delete', { ids }, { noCancel: true })
}

/**
 * 导出用户列表为 Excel
 * @param {object} params - 查询条件
 */
export function exportUsers(params) {
  return request.download('/users/export', { params })
}

/**
 * 上传用户头像
 * @param {File} file
 * @param {number} userId
 */
export function uploadAvatar(file, userId) {
  return request.upload(
    '/users/avatar',
    file,
    { userId },
    {
      onUploadProgress: (e) => {
        const percent = Math.round((e.loaded * 100) / e.total)

        console.log(`上传进度 ${percent}%`)
      },
    },
  )
}

export default {
  getUserList,
  getUserDetail,
  createUser,
  updateUser,
  deleteUser,
  batchDeleteUsers,
  exportUsers,
  uploadAvatar,
}
