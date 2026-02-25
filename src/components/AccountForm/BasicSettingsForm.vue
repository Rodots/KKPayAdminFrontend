<script setup lang="ts">
import { useForm } from 'vee-validate'
import * as z from 'zod'
import { FormControl, FormField, FormItem, FormMessage } from '@/ui/shadcn/ui/form'

defineOptions({
  name: 'BasicSettingsForm',
})

const userStore = useUserStore()

const loading = ref(false)

const form = useForm({
  validationSchema: z.object({
    nickname: z.string().min(1, '请输入昵称').max(16, '昵称长度不能超过16个字符'),
    email: z.string().nullable().refine(
      (val) => {
        if (val === '' || val === null) {
          return true
        } // 允许空字符串和undefined
        return z.email().safeParse(val).success // 其他值必须是有效邮箱
      },
      { message: '请输入有效的邮箱地址' },
    ),
  }),
})

watch(
  () => [userStore.nickname, userStore.email],
  ([nickname, email]) => {
    form.setValues({
      nickname,
      email,
    })
  },
  {
    immediate: true,
  },
)

const onSubmit = form.handleSubmit((values) => {
  loading.value = true
  userStore.editBasic(values).finally(() => {
    loading.value = false
  })
})
</script>

<template>
  <div class="w-full flex-col-stretch-center">
    <FaBlurReveal :delay="0.2" :duration="0.4" class="mb-6 space-y-2">
      <h3 class="text-4xl color-[var(--el-text-color-primary)] font-bold">
        基本设置
      </h3>
      <p class="text-sm text-muted-foreground lg:text-base">
        设置您的账号基本信息，包括昵称、邮箱等
      </p>
    </FaBlurReveal>
    <form @submit="onSubmit">
      <FormField v-slot="{ componentField, errors }" name="nickname">
        <FormItem class="relative pb-6 space-y-0">
          <FormControl>
            <div class="label mb-2">
              昵称
            </div>
            <FaInput placeholder="怎么称呼？仅用于后台展示使用" class="w-full" :class="{ 'border-destructive': errors.length }" v-bind="componentField" maxlength="16" />
          </FormControl>
          <Transition enter-active-class="transition-opacity" enter-from-class="opacity-0" leave-active-class="transition-opacity" leave-to-class="opacity-0">
            <FormMessage class="absolute bottom-1 text-xs" />
          </Transition>
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField, errors }" name="email">
        <FormItem class="relative pb-6 space-y-0">
          <FormControl>
            <div class="label mb-2">
              电子邮箱地址
            </div>
            <FaInput type="email" placeholder="请输入您的电子邮箱地址" class="w-full" :class="{ 'border-destructive': errors.length }" v-bind="componentField" maxlength="255" />
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
