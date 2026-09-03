import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: null,
    token: '',
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
  },

  actions: {
    // 登录
    login(userInfo) {
      // 模拟登录逻辑
      this.userInfo = userInfo
      this.token = `mock-token-${Date.now()}`
      localStorage.setItem('isLogin', 'true')
      localStorage.setItem('userInfo', JSON.stringify(userInfo))
      localStorage.setItem('token', this.token)
    },

    // 登出
    logout() {
      this.userInfo = null
      this.token = ''
      localStorage.removeItem('isLogin')
      localStorage.removeItem('userInfo')
      localStorage.removeItem('token')
    },

    // 加载用户信息
    loadUserInfo() {
      const isLogin = localStorage.getItem('isLogin') === 'true'

      if (isLogin) {
        const userInfo = localStorage.getItem('userInfo')
        const token = localStorage.getItem('token')

        if (userInfo) {
          this.userInfo = JSON.parse(userInfo)
          this.token = token
        }
      }
    },
  },
})
