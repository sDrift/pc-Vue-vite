let loaded = false

// let loaded = false
let loadingPromise = null

function loadScript(url) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${url}"]`)

    if (existing) {
      resolve()

      return
    }

    const script = document.createElement('script')

    script.src = url
    script.onload = resolve
    script.onerror = () => reject(new Error(`加载失败: ${url}`))
    document.head.appendChild(script)
  })
}

function loadCSS(url) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`link[href="${url}"]`)

    if (existing) {
      resolve()

      return
    }
    const link = document.createElement('link')

    link.rel = 'stylesheet'
    link.href = url
    link.onload = resolve
    link.onerror = () => reject(new Error(`加载失败: ${url}`))
    document.head.appendChild(link)
  })
}

// 核心：加载组件库，并返回组件库对象
export async function loadComponentLib() {
  if (loaded) {
    return Promise.resolve(window.MyTable)
  }

  if (loadingPromise) {
    return loadingPromise
  }

  loadingPromise = async () => {
    try {
      const baseUrl = '/libs/my-test-lib'

      // 1. 加载样式
      await loadCSS(`${baseUrl}/style.css`)

      // 2. 加载 JS
      await loadScript(`${baseUrl}/my-lib.umd.js`)
      console.log(window.MyLib)
      // 3. 获取组件库对象
      const lib = window.MyLib?.default || window.MyLib

      if (!lib) {
        throw new Error('组件库对象未找到，请检查全局变量名')
      }

      loaded = true
      console.log('✅ 组件库加载完成')

      return lib
    } catch (error) {
      loadingPromise = null
      console.error('❌ 组件库加载失败:', error)
      throw error
    }
  }

  const MyTable = await loadingPromise()

  console.log(MyTable, 11)

  return MyTable
}
