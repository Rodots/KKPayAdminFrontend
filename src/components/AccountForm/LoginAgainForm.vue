<script setup lang="ts">
import { useForm } from 'vee-validate'
import * as z from 'zod'
import { FormControl, FormField, FormItem, FormMessage } from '@/ui/shadcn/ui/form'

defineOptions({
  name: 'LoginAgainForm',
})

const emits = defineEmits<{
  onAfterLogin: [account?: string]
}>()

const settingsStore = useSettingsStore()
const userStore = useUserStore()

const loading = ref(false)

const form = useForm({
  validationSchema: z.object({
    account: z.string().min(1, '请输入用户名'),
    password: z.string().min(1, '请输入密码'),
    totp_code: z.string()
      .refine((val) => {
        if (!val) {
          return true
        } // 如果为空，通过校验
        return /^\d{6}$/.test(val) // 如果有值，必须是6位数字
      }, {
        message: 'TOTP一次性密码必须为6位数字',
      }),
  }),
  initialValues: {
    account: userStore.account,
    password: '',
    totp_code: '',
  },
})

const onSubmit = form.handleSubmit((values) => {
  loading.value = true
  userStore.login(values).then(async () => {
    // 获取用户权限
    settingsStore.settings.app.enablePermission && await userStore.getPermissions()
    emits('onAfterLogin', values.account)
  }).finally(() => {
    loading.value = false
  })
})
</script>

<template>
  <div class="w-full flex-col-stretch-center p-12">
    <FaBlurReveal :delay="0.2" :duration="0.4" class="mb-6 space-y-2">
      <h3 class="text-4xl color-[var(--el-text-color-primary)] font-bold">
        请重新登录
      </h3>
      <p class="text-sm text-muted-foreground lg:text-base">
        您的登录状态已过期
      </p>
    </FaBlurReveal>
    <form @submit="onSubmit">
      <FormField v-slot="{ componentField, errors }" name="account">
        <FormItem class="relative pb-6 space-y-0">
          <FormControl>
            <FaInput type="text" placeholder="用户名" disabled class="w-full" :class="{ 'border-destructive': errors.length }" v-bind="componentField" />
          </FormControl>
          <Transition enter-active-class="transition-opacity" enter-from-class="opacity-0" leave-active-class="transition-opacity" leave-to-class="opacity-0">
            <FormMessage class="absolute bottom-1 text-xs" />
          </Transition>
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField, errors }" name="password">
        <FormItem class="relative pb-6 space-y-0">
          <FormControl>
            <FaInput type="password" placeholder="密码" class="w-full" :class="{ 'border-destructive': errors.length }" v-bind="componentField" />
          </FormControl>
          <Transition enter-active-class="transition-opacity" enter-from-class="opacity-0" leave-active-class="transition-opacity" leave-to-class="opacity-0">
            <FormMessage class="absolute bottom-1 text-xs" />
          </Transition>
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField, errors }" name="totp_code">
        <FormItem class="relative pb-6 space-y-0">
          <FormControl>
            <FaInput type="text" placeholder="TOTP一次性密码（如未设置可不填）" class="w-full" :class="{ 'border-destructive': errors.length }" v-bind="componentField" maxlength="6" />
          </FormControl>
          <Transition enter-active-class="transition-opacity" enter-from-class="opacity-0" leave-active-class="transition-opacity" leave-to-class="opacity-0">
            <FormMessage class="absolute bottom-1 text-xs" />
          </Transition>
        </FormItem>
      </FormField>
      <FaButton :loading="loading" size="lg" class="w-full" type="submit">
        登录
      </FaButton>
    </form>
  </div>
</template>
