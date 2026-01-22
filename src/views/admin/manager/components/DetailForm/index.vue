<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import api from '@/api/modules/admin'

const props = withDefaults(defineProps<{ id?: number | string }>(), { id: '' })

const loading = ref(false)
const formRef = useTemplateRef<FormInstance>('formRef')
const form = ref({
  id: props.id,
  role: '',
  account: '',
  nickname: '',
  email: '',
  password: '',
  new_password: '',
  status: '1',
})

const formRules = ref<FormRules>({
  password: [
    { required: true, message: '请输入登录密码', trigger: 'blur' },
    { min: 5, message: '登录密码长度不能小于5位', trigger: 'blur' },
  ],
  role: [{ required: true, message: '请选择角色', trigger: 'blur' }],
  account: [
    { required: true, message: '请输入账号/用户名', trigger: 'blur' },
    { max: 32, message: '账号/用户名长度不能大于32位', trigger: 'blur' },
  ],
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { max: 16, message: '昵称长度不能大于16位', trigger: 'blur' },
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱', trigger: 'blur' },
    { max: 64, message: '邮箱长度不能大于64位', trigger: 'blur' },
  ],
})

onMounted(() => {
  if (form.value.id !== '') {
    getInfo()
  }
})

function getInfo() {
  loading.value = true
  api.detail(form.value.id).then((res: any) => {
    form.value.role = res.data.role
    form.value.account = res.data.account
    form.value.nickname = res.data.nickname
    form.value.email = res.data.email
    form.value.status = res.data.status ? '1' : '0'
  }).finally(() => {
    loading.value = false
  })
}

defineExpose({
  submit: () => new Promise<void>((resolve) => {
    formRef.value?.validate((valid) => {
      if (valid) {
        const apiCall = form.value.id === '' ? api.create : api.edit
        apiCall(form.value).then(() => resolve())
      }
    })
  }),
})
</script>

<template>
  <div v-loading="loading">
    <ElForm ref="formRef" :model="form" :rules="formRules" label-width="100px" label-suffix="：">
      <ElFormItem label="角色" prop="role">
        <ElSelect v-model="form.role" clearable placeholder="请选择角色">
          <ElOption v-auth="'super_admin'" label="普通管理员" :value="1" />
          <ElOption label="客服" :value="2" />
          <ElOption label="牛马（慎选）" :value="255" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="账号" prop="account">
        <ElInput v-model="form.account" placeholder="请输入账号/用户名" :maxlength="32" />
      </ElFormItem>
      <ElFormItem label="昵称" prop="nickname">
        <ElInput v-model="form.nickname" placeholder="请输入昵称" :maxlength="16" />
      </ElFormItem>
      <ElFormItem label="邮箱" prop="email">
        <ElInput v-model="form.email" placeholder="请输入邮箱，可留空" :maxlength="64" />
      </ElFormItem>
      <ElFormItem v-if="form.id === ''" label="登录密码" prop="password">
        <ElInput v-model="form.password" type="password" placeholder="请输入登录密码" />
      </ElFormItem>
      <ElFormItem v-else label="登录密码" prop="new_password">
        <ElInput v-model="form.new_password" type="password" placeholder="请输入新登录密码，留空则不修改" />
      </ElFormItem>
      <ElFormItem label="账户状态" prop="status">
        <ElRadioGroup v-model="form.status">
          <ElRadio value="1" size="large">
            正常
          </ElRadio>
          <ElRadio value="0" size="large">
            封禁
          </ElRadio>
        </ElRadioGroup>
      </ElFormItem>
    </ElForm>
  </div>
</template>
