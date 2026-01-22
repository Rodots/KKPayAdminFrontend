<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import api from '@/api/modules/risk'

const props = withDefaults(defineProps<{
  entityType?: string | null
  entityValue?: string | null
  reason?: string | null
}>(), {
  entityType: null,
  entityValue: null,
  reason: null,
})

const loading = ref(false)
const formRef = useTemplateRef<FormInstance>('formRef')
const form = ref({
  entity_type: props.entityType,
  entity_value: props.entityValue,
  reason: props.reason,
  expired_at: null as string | null,
})

const formRules = ref<FormRules>({
  entity_type: [{ required: true, message: '请选择黑名单类型', trigger: 'change' }],
  entity_value: [{ required: true, message: '请输入黑名单内容', trigger: 'blur' }],
  reason: [{ required: true, message: '请输入封禁理由', trigger: 'blur' }],
})

defineExpose({
  submit: () => new Promise<void>((resolve) => {
    formRef.value?.validate((valid) => {
      if (valid) {
        api.blackCreate(form.value).then(() => resolve())
      }
    })
  }),
})
</script>

<template>
  <div v-loading="loading">
    <ElForm ref="formRef" :model="form" :rules="formRules" label-width="110px" label-suffix="：">
      <ElFormItem label="黑名单类型" prop="entity_type">
        <ElSelect v-model="form.entity_type" clearable placeholder="选择类型">
          <ElOption label="用户ID" value="USER_ID" />
          <ElOption label="银行卡号" value="BANK_CARD" />
          <ElOption label="身份证号" value="ID_CARD" />
          <ElOption label="手机号" value="MOBILE" />
          <ElOption label="IP地址" value="IP_ADDRESS" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="黑名单内容" prop="entity_value">
        <ElInput v-model="form.entity_value" placeholder="请输入内容" :maxlength="512" />
      </ElFormItem>
      <ElFormItem label="封禁理由" prop="reason">
        <ElInput v-model="form.reason" type="textarea" :autosize="{ minRows: 2, maxRows: 4 }" :maxlength="1024" placeholder="请输入封禁理由, 最多输入1024个字符" />
      </ElFormItem>
      <ElFormItem label="过期时间" prop="expired_at">
        <ElDatePicker v-model="form.expired_at" type="datetime" placeholder="选择过期时间，留空表示永久封禁" format="YYYY-MM-DD HH:mm:ss" value-format="YYYY-MM-DD HH:mm:ss" class="!w-full" />
      </ElFormItem>
    </ElForm>
    <FaDivider>如该黑名单条目已存在，则以本次提交的信息为准进行更新。</FaDivider>
  </div>
</template>
