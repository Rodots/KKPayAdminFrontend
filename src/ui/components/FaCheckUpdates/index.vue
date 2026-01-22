<script setup lang="ts">
import { useFaModal } from '@/ui/components/FaModal'

defineOptions({
  name: 'FaCheckUpdates',
})

const settingsStore = useSettingsStore()

const visible = ref(false)
const lastVersionTag = ref('')
const checkUpdatesInterval = ref(Number.NaN)

async function getVersionTag() {
  try {
    const response = await fetch(`${location.origin}${location.pathname}`, {
      cache: 'no-cache',
      method: 'HEAD',
    })
    return response.headers.get('etag') || response.headers.get('last-modified')
  }
  catch {
    console.error('检查更新失败')
  }
}

async function checkUpdates() {
  const versionTag = await getVersionTag()
  if (!versionTag) {
    return
  }
  if (!lastVersionTag.value) {
    lastVersionTag.value = versionTag
    return
  }
  if (visible.value) {
    return
  }
  if (lastVersionTag.value !== versionTag && versionTag) {
    stopInterval()
    visible.value = true
    useFaModal().confirm({
      title: '有新版本可用',
      content: '点击刷新按钮获取最新版本',
      confirmButtonText: '刷新',
      cancelButtonText: '稍后',
      onConfirm: () => location.reload(),
    })
  }
}

function startInterval() {
  checkUpdates()
  checkUpdatesInterval.value = window.setInterval(checkUpdates, 60_000)
}

function stopInterval() {
  clearInterval(checkUpdatesInterval.value)
}

function handleVisibilitychange() {
  if (document.hidden) {
    stopInterval()
  }
  else {
    startInterval()
  }
}

onMounted(() => {
  if (import.meta.env.PROD && settingsStore.settings.app.enableCheckUpdates) {
    startInterval()
    document.addEventListener('visibilitychange', handleVisibilitychange)
  }
})

onUnmounted(() => {
  if (import.meta.env.PROD && settingsStore.settings.app.enableCheckUpdates) {
    stopInterval()
    document.removeEventListener('visibilitychange', handleVisibilitychange)
  }
})
</script>

<template>
  <div />
</template>
