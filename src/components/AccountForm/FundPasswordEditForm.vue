<script setup lang="ts">
import { useForm } from 'vee-validate'
import * as z from 'zod'
import { FormControl, FormField, FormItem, FormMessage } from '@/ui/shadcn/ui/form'

defineOptions({
  name: 'TransferPasswordEditForm',
})

const userStore = useUserStore()

const loading = ref(false)

const form = useForm({
  validationSchema: z.object({
    password: z.string().min(1, '请输入原密码'),
    newPassword: z.string().min(1, '请输入新密码').min(5, '新密码长度必须5个字符以上'),
    checkPassword: z.string().min(1, '请二次确认新密码'),
    totp: z.string()
      .refine((val) => {
        if (!val) {
          return true
        } // 如果为空，通过校验
        return /^\d{6}$/.test(val) // 如果有值，必须是6位数字
      }, {
        message: 'TOTP一次性密码必须为6位数字',
      }),
  }).refine(data => data.newPassword === data.checkPassword, {
    message: '两次输入的密码不一致',
    path: ['checkPassword'],
  }),
  initialValues: {
    password: '',
    newPassword: '',
    checkPassword: '',
    totp: '',
  },
})
const onSubmit = form.handleSubmit((values) => {
  loading.value = true
  userStore.editPassword({
    type: 'fund',
    ...values,
  }).then(async () => {
    userStore.requestLogout()
  }).finally(() => {
    loading.value = false
  })
})
</script>

<template>
  <div class="w-full flex-col-stretch-center">
    <FaBlurReveal :delay="0.2" :duration="0.4" class="mb-6 space-y-2">
      <h3 class="text-4xl color-[var(--el-text-color-primary)] font-bold">
        修改资金密码
      </h3>
      <p class="text-sm text-muted-foreground lg:text-base">
        请输入原密码、新密码以及二次确认新密码
      </p>
    </FaBlurReveal>
    <form @submit="onSubmit">
      <FormField v-slot="{ componentField, errors }" name="password">
        <FormItem class="relative pb-6 space-y-0">
          <FormControl>
            <FaInput type="password" placeholder="原资金密码" class="w-full" :class="errors.length && 'border-destructive'" v-bind="componentField" />
          </FormControl>
          <Transition enter-active-class="transition-opacity" enter-from-class="opacity-0" leave-active-class="transition-opacity" leave-to-class="opacity-0">
            <FormMessage class="absolute bottom-1 text-xs" />
          </Transition>
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField, errors }" name="newPassword">
        <FormItem class="relative pb-6 space-y-0">
          <FormControl>
            <FaInput type="password" placeholder="新资金密码" class="w-full" :class="errors.length && 'border-destructive'" v-bind="componentField" />
          </FormControl>
          <Transition enter-active-class="transition-opacity" enter-from-class="opacity-0" leave-active-class="transition-opacity" leave-to-class="opacity-0">
            <FormMessage class="absolute bottom-1 text-xs" />
          </Transition>
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField, errors }" name="checkPassword">
        <FormItem class="relative pb-6 space-y-0">
          <FormControl>
            <FaInput type="password" placeholder="二次确认新密码" class="w-full" :class="errors.length && 'border-destructive'" v-bind="componentField" />
          </FormControl>
          <Transition enter-active-class="transition-opacity" enter-from-class="opacity-0" leave-active-class="transition-opacity" leave-to-class="opacity-0">
            <FormMessage class="absolute bottom-1 text-xs" />
          </Transition>
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField, errors }" name="totp">
        <FormItem class="relative pb-6 space-y-0">
          <FormControl>
            <FaInput type="text" placeholder="TOTP一次性密码（如未设置可不填）" class="w-full" :class="errors.length && 'border-destructive'" v-bind="componentField" maxlength="6" />
          </FormControl>
          <Transition enter-active-class="transition-opacity" enter-from-class="opacity-0" leave-active-class="transition-opacity" leave-to-class="opacity-0">
            <FormMessage class="absolute bottom-1 text-xs" />
          </Transition>
        </FormItem>
      </FormField>
      <FaButton :loading="loading" size="lg" class="mt-5 w-full" type="submit">
        保存
      </FaButton>
    </form>
  </div>
</template>
