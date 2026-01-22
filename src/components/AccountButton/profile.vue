<script setup lang="ts">
import { onMounted } from 'vue'
import BasicSettingsForm from '@/components/AccountForm/BasicSettingsForm.vue'
import FundPasswordEditForm from '@/components/AccountForm/FundPasswordEditForm.vue'
import LoginPasswordEditForm from '@/components/AccountForm/LoginPasswordEditForm.vue'
import SecuritySettingsForm from '@/components/AccountForm/SecuritySettingsForm.vue'
// import eventBus from '@/utils/eventBus'

const userStore = useUserStore()

const active = ref(0)
const tabs = ref([
  {
    title: '基本设置',
    description: '修改当前登录账号的基本信息，昵称、邮箱等',
  },
  {
    title: '登录密码',
    description: '定期修改密码可以提高帐号安全性',
  },
  {
    title: '资金密码',
    description: '定期修改密码可以提高帐号安全性',
  },
  {
    title: '双重验证',
    description: '设置TOTP双重验证（谷歌验证）',
  },
])

onMounted(() => {
  userStore.getProfile()
})

// eventBus.on('relogin-success', () => {
//   userStore.getProfile()
// })

// onUnmounted(() => {
//   eventBus.off('relogin-success')
// })
</script>

<template>
  <div class="min-h-full w-full">
    <div class="fixed right-0 top-0 z-1 flex flex-row overflow-auto border-b border-e bg-background md:(inset-s-0 bottom-0 h-full w-40 flex-col)">
      <div v-for="(tab, index) in tabs" :key="index" class="flex-shrink-0 cursor-pointer px-4 py-3 transition-background-color space-y-2 hover-bg-accent/50" :class="{ 'bg-accent hover-bg-accent!': active === index }" @click="active = index">
        <div class="text-base text-accent-foreground leading-tight">
          {{ tab.title }}
        </div>
        <div class="text-xs text-accent-foreground/50">
          {{ tab.description }}
        </div>
      </div>
    </div>
    <div class="min-h-full flex-col-center p-10 pt-20 md:(ms-40 pt-10)">
      <BasicSettingsForm v-show="active === 0" />
      <LoginPasswordEditForm v-show="active === 1" />
      <FundPasswordEditForm v-show="active === 2" />
      <SecuritySettingsForm v-show="active === 3" :totp-state="userStore.totpState" />
    </div>
  </div>
</template>
