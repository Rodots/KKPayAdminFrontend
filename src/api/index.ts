import axios from 'axios'
import { toast } from 'vue-sonner'

// 请求重试配置
const MAX_RETRY_COUNT = 2 // 最大重试次数
const RETRY_DELAY = 1000 // 重试延迟时间（毫秒）

// 扩展 AxiosRequestConfig 类型
declare module 'axios' {
  export interface AxiosRequestConfig {
    retry?: boolean
    retryCount?: number
  }
}

const api = axios.create({
  baseURL: (import.meta.env.DEV && import.meta.env.VITE_OPEN_PROXY) ? '/proxy/' : import.meta.env.VITE_APP_API_BASEURL,
  timeout: 1000 * 60,
  responseType: 'json',
})

api.interceptors.request.use(
  (request) => {
    // 全局拦截请求发送前提交的参数
    const userStore = useUserStore()
    // 设置请求头
    if (request.headers) {
      if (userStore.isLogin) {
        request.headers.Authorization = userStore.token
      }
    }
    return request
  },
)

// 处理错误信息的函数
function handleError(error: any) {
  let message = error.message
  if (message === 'Network Error') {
    message = '网络故障'
  }
  else if (message.includes('timeout')) {
    message = '接口请求超时'
  }
  else if (message.includes('Request failed with status code')) {
    message = `接口${message.substr(message.length - 3)}异常，请稍后重试或联系运维`
  }
  toast.error('Error', {
    description: message,
  })
  return Promise.reject(error)
}

api.interceptors.response.use(
  (response) => {
    /**
     * 全局拦截请求发送后返回的数据，如果数据有报错则在这做全局的错误提示
     * 请求出错时 error 会返回错误信息
     */
    // 检查response.data是否为对象
    if (typeof response.data !== 'object') {
      return Promise.reject(response.data)
    }

    // 处理 40001 错误码，即登录失效（优先处理）
    if (response.data.code === 40001) {
      useUserStore().requestLogout()
      return Promise.resolve(response.data)
    }

    // 成功态优先早返回
    if (response.data.state === true) {
      return Promise.resolve(response.data)
    }

    // 非成功态，统一提示
    toast.warning('Warning', {
      description: response.data.message || '未知错误',
    })
    return Promise.reject(response.data.message)
  },
  async (error) => {
    // 获取请求配置
    const config = error.config
    // 如果配置不存在或未启用重试，则直接处理错误
    if (!config || !config.retry) {
      return handleError(error)
    }
    // 设置重试次数
    config.retryCount = config.retryCount || 0
    // 判断是否超过重试次数
    if (config.retryCount >= MAX_RETRY_COUNT) {
      return handleError(error)
    }
    // 重试次数自增
    config.retryCount += 1
    // 延迟重试
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
    // 重新发起请求
    return api(config)
  },
)

export default api
