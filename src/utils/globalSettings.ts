import { computed, ref } from 'vue'
import settingApi from '@/api/modules/setting'

export interface GlobalSettings {
  site_name: string
  [key: string]: any
}

const CACHE_KEY = 'global_settings'

const settings = ref<GlobalSettings>({
  site_name: import.meta.env.VITE_APP_TITLE,
})

let isInitialized = false

export function useGlobalSettings() {
  // 确保在 storage 代理生效后再读取缓存
  if (!isInitialized) {
    isInitialized = true
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      try {
        Object.assign(settings.value, JSON.parse(cached))
      }
      catch {
        localStorage.removeItem(CACHE_KEY)
        fetchFromServer()
      }
    }
    else {
      fetchFromServer()
    }
  }

  async function refreshCache() {
    const { state, data } = await settingApi.frontendGet() as any
    if (state && data) {
      Object.assign(settings.value, data)
      localStorage.setItem(CACHE_KEY, JSON.stringify(data))
    }
  }

  return {
    settings,
    siteName: computed(() => settings.value.site_name),
    refreshCache,
  }
}

function fetchFromServer() {
  settingApi.frontendGet().then((res: any) => {
    if (res.state && res.data) {
      Object.assign(settings.value, res.data)
      localStorage.setItem(CACHE_KEY, JSON.stringify(res.data))
    }
  }).catch((err) => {
    console.error('无法获取全局配置:', err)
  })
}
