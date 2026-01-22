<script setup lang="ts">
import { useGlobalSettings } from '@/utils/globalSettings'
import Provider from './ui/provider/index.vue'

const route = useRoute()

const settingsStore = useSettingsStore()

const { auth } = useAuth()
const { siteName } = useGlobalSettings()

const isAuth = computed(() => {
  return route.matched.every((item) => {
    return auth(item.meta.auth ?? '')
  })
})

// 设置网页 title
watch([
  () => settingsStore.settings.app.enableDynamicTitle,
  () => settingsStore.title,
  () => settingsStore.customTitleList,
  () => siteName.value,
], () => {
  nextTick(() => {
    if (settingsStore.settings.app.enableDynamicTitle && settingsStore.title) {
      const title = settingsStore.customTitleList.find(item => item.fullPath === route.fullPath)?.title || settingsStore.title
      document.title = `${title} - ${siteName.value}`
    }
    else {
      document.title = siteName.value
    }
  })
}, {
  immediate: true,
  deep: true,
})

onMounted(() => {
  settingsStore.setMode(document.documentElement.clientWidth)
  window.addEventListener('resize', () => {
    settingsStore.setMode(document.documentElement.clientWidth)
  })
})
</script>

<template>
  <Provider>
    <RouterView v-slot="{ Component }">
      <component :is="Component" v-if="isAuth" />
      <FaNotAllowed v-else />
    </RouterView>
    <FaBackToTop />
    <FaLoginAgain />
    <FaToast />
    <FaNotification />
  </Provider>
</template>
