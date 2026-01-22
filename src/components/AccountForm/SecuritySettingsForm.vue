<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import { ref } from 'vue'
import { toast } from 'vue-sonner'

defineOptions({
  name: 'SecuritySettingsForm',
})

const props = defineProps<{
  totpState: boolean
}>()

const userStore = useUserStore()
const { copy, copied } = useClipboard()

watch(copied, (val) => {
  val && toast.success('复制成功')
})

const loading = ref(false)
const totpSecret = ref('')
const totpQrCode = ref('')
const totpCode = ref('')

async function setupTOTP() {
  loading.value = true
  try {
    let res
    if (props.totpState) {
      res = await userStore.setupTOTP({ code: totpCode.value })
    }
    else {
      res = await userStore.setupTOTP()
    }
    if (res.data.secret) {
      toast.success('Success', {
        description: '生成TOTP密钥成功，请在5分钟内完成绑定',
      })
      totpSecret.value = res.data.secret
      totpQrCode.value = res.data.qr_code
    }
  }
  catch {
    userStore.getProfile()
  }
  finally {
    loading.value = false
  }
}

async function verifyTOTP() {
  loading.value = true
  try {
    await userStore.verifyTOTP({ code: totpCode.value })
    toast.success('Success', {
      description: 'TOTP双重验证启用成功',
    })
    userStore.getProfile()
  }
  catch {
    userStore.getProfile()
  }
  finally {
    loading.value = false
  }
}

async function disableTOTP() {
  loading.value = true
  try {
    await userStore.disableTOTP({ code: totpCode.value })
    toast.success('Success', {
      description: 'TOTP双重验证禁用成功',
    })
    userStore.getProfile()
  }
  catch {
    userStore.getProfile()
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="w-full flex-col-stretch-center">
    <FaBlurReveal :delay="0.2" :duration="0.4" class="mb-6 space-y-2">
      <h3 class="text-4xl color-[var(--el-text-color-primary)] font-bold">
        安全设置
      </h3>
      <p class="text-sm text-muted-foreground lg:text-base">
        设置TOTP双重验证等安全选项
      </p>
    </FaBlurReveal>

    <!-- 已启用TOTP -->
    <div v-if="props.totpState" class="mb-6 border rounded-lg p-4">
      <h4 class="font-medium">
        TOTP双重验证已启用
      </h4>
      <p class="text-sm text-muted-foreground">
        输入验证码以禁用或重置TOTP双重验证。
      </p>
      <FaPageMain title="请输入6位数验证码完成验证">
        <FaPinInput v-model="totpCode" class="mb-2 text-center" />
        <div class="flex justify-center gap-2">
          <FaButton :loading="loading" @click="disableTOTP">
            禁用
          </FaButton>
          <FaButton variant="outline" :loading="loading" @click="setupTOTP">
            重置
          </FaButton>
        </div>
      </FaPageMain>
    </div>

    <!-- 未启用TOTP -->
    <div v-else class="mb-6 border rounded-lg p-4">
      <div v-if="!totpSecret">
        <h4 class="font-medium">
          启用TOTP双重验证
        </h4>
        <p class="text-sm text-muted-foreground">
          点击下方按钮生成您的TOTP密钥和二维码。
        </p>
        <FaButton :loading="loading" class="mt-4" @click="setupTOTP">
          生成密钥
        </FaButton>
      </div>

      <!-- 生成后显示 -->
      <div v-if="totpSecret" class="space-y-4">
        <p class="text-sm text-muted-foreground">
          请使用您的TOTP应用扫描下方二维码，或手动输入密钥进行配置。
        </p>
        <div class="flex justify-center">
          <img :src="totpQrCode" alt="TOTP QR Code">
        </div>
        <div class="text-center">
          <FaPopover>
            <FaButton>
              无法扫描？手动输入密钥
              <FaIcon name="i-ep:caret-bottom" />
            </FaButton>
            <template #panel>
              <p>账户：{{ userStore.account }}</p>
              <div class="flex items-center gap-2">
                <p>密钥：{{ totpSecret }}</p>
                <FaButton size="sm" variant="outline" @click="copy(totpSecret)">
                  复制
                </FaButton>
              </div>
            </template>
          </FaPopover>
        </div>
        <FaPageMain title="请输入6位数验证码并完成验证">
          <FaPinInput v-model="totpCode" class="mb-2 text-center" />
          <div class="flex justify-center gap-2">
            <FaButton :loading="loading" @click="verifyTOTP">
              验证并启用
            </FaButton>
            <FaButton variant="outline" :loading="loading" @click="setupTOTP">
              重新生成
            </FaButton>
          </div>
        </FaPageMain>
      </div>
    </div>
  </div>
</template>
