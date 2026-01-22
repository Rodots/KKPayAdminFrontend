<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import { toast } from 'vue-sonner'
import api from '@/api/modules/merchant'

const props = defineProps<{
  id?: number | string
  merchantNumber?: string
  mode?: 'create' | 'edit'
}>()

const emit = defineEmits<{
  (e: 'success'): void
}>()

const loading = ref(false)
const formRef = ref<FormInstance>()

interface PayeeTypeField {
  key: string
  label: string
  placeholder: string
  required?: boolean
  component?: 'input' | 'select'
  options?: { label: string, value: string }[]
}

interface PayeeTypeConfig {
  value: string
  label: string
  fields: PayeeTypeField[]
}

const payeeTypeOptions: PayeeTypeConfig[] = [
  {
    value: 'bank',
    label: '银行卡',
    fields: [
      { key: 'account_name', label: '开户名', placeholder: '请输入开户名', required: true },
      { key: 'bank_name', label: '开户行', placeholder: '例如：中国银行', required: true },
      { key: 'bank_account', label: '银行账号', placeholder: '请输入银行卡号', required: true },
      { key: 'bank_branch', label: '开户支行', placeholder: '可选：请输入开户支行', required: false },
    ],
  },
  {
    value: 'alipay',
    label: '支付宝',
    fields: [
      { key: 'alipay_account', label: '支付宝账号', placeholder: '手机号或邮箱', required: true },
      { key: 'name', label: '姓名', placeholder: '可选：请输入姓名', required: false },
    ],
  },
  {
    value: 'usdt',
    label: '泰达币USDT',
    fields: [
      { key: 'wallet_address', label: '钱包地址', placeholder: '请输入钱包地址', required: true },
      {
        key: 'network',
        label: '网络',
        placeholder: '请选择网络',
        required: true,
        component: 'select',
        options: [
          { label: 'TRC20', value: 'TRC20' },
          { label: 'ERC20', value: 'ERC20' },
          { label: 'Avalanche C-Chain', value: 'AVAX' },
          { label: 'Arbitrum One', value: 'ARBITRUM' },
          { label: 'Polygon', value: 'POLYGON' },
        ],
      },
    ],
  },
  {
    value: 'usdc',
    label: '美元币USDC',
    fields: [
      { key: 'wallet_address', label: '钱包地址', placeholder: '请输入钱包地址', required: true },
      {
        key: 'network',
        label: '网络',
        placeholder: '请选择网络',
        required: true,
        component: 'select',
        options: [
          { label: 'ERC20', value: 'ERC20' },
          { label: 'Avalanche C-Chain', value: 'AVAX' },
          { label: 'Arbitrum One', value: 'ARBITRUM' },
          { label: 'Polygon', value: 'POLYGON' },
        ],
      },
    ],
  },
]

const form = ref({
  merchant_number: props.merchantNumber || '',
  type: 'bank',
  payee_data: {} as Record<string, string>,
})

const currentTypeConfig = computed(() => payeeTypeOptions.find(t => t.value === form.value.type) || payeeTypeOptions[0])

const rules = computed<FormRules>(() => {
  const commonRules = {
    merchant_number: [{ required: true, message: '请输入商户编号', trigger: 'blur' }],
  }

  const typeRules: Record<string, any> = {}
  currentTypeConfig.value.fields.forEach((field) => {
    if (field.required) {
      typeRules[`payee_data.${field.key}`] = [{
        required: true,
        message: `请输入${field.label}`,
        trigger: field.component === 'select' ? 'change' : 'blur',
      }]
    }
  })

  return { ...commonRules, ...typeRules }
})

onMounted(() => {
  if (props.id) {
    getDetail()
  }
})

async function getDetail() {
  loading.value = true
  try {
    const res = await api.payeeDetail(props.id!)
    const data = res.data
    const payeeInfo = data.payee_info || {}

    const type = payeeInfo.type?.val || 'bank'
    const payeeData: Record<string, string> = {}

    if (payeeInfo.data) {
      Object.keys(payeeInfo.data).forEach((key) => {
        payeeData[key] = payeeInfo.data[key]?.val || ''
      })
    }

    form.value = {
      merchant_number: data.merchant?.merchant_number || '',
      type,
      payee_data: { ...form.value.payee_data, ...payeeData },
    }
  }
  finally {
    loading.value = false
  }
}

async function submit() {
  if (!formRef.value) {
    return
  }

  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const payload = { ...form.value }
        const payeeInfoData: Record<string, { name: string, val: string }> = {}
        currentTypeConfig.value.fields.forEach((field) => {
          const val = payload.payee_data[field.key]
          if (val) {
            payeeInfoData[field.key] = { name: field.label, val }
          }
        })

        const payeeInfo = {
          type: { name: currentTypeConfig.value.label, val: payload.type },
          data: payeeInfoData,
        }

        const submitData: any = { payee_info: payeeInfo }

        if (props.id) {
          await api.payeeEdit({ id: props.id, ...submitData })
          toast.success('编辑成功')
        }
        else {
          submitData.merchant_number = payload.merchant_number
          await api.payeeCreate(submitData)
          toast.success('新增成功')
        }
        emit('success')
      }
      finally {
        loading.value = false
      }
    }
  })
}

defineExpose({ submit })
</script>

<template>
  <div v-loading="loading">
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="120px">
      <ElFormItem label="商户编号" prop="merchant_number">
        <ElInput v-model="form.merchant_number" placeholder="请输入商户编号" :disabled="!!props.id" />
      </ElFormItem>

      <ElFormItem label="收款类型">
        <ElSelect v-model="form.type" placeholder="请选择收款类型">
          <ElOption v-for="opt in payeeTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </ElSelect>
      </ElFormItem>

      <ElFormItem v-for="field in currentTypeConfig.fields" :key="field.key" :label="field.label" :prop="`payee_data.${field.key}`">
        <ElSelect v-if="field.component === 'select'" v-model="form.payee_data[field.key]" :placeholder="field.placeholder">
          <ElOption v-for="opt in field.options" :key="opt.value" :label="opt.label" :value="opt.value" />
        </ElSelect>
        <ElInput v-else v-model="form.payee_data[field.key]" :placeholder="field.placeholder" />
      </ElFormItem>
    </ElForm>
  </div>
</template>
