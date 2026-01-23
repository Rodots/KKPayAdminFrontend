<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import api from '@/api/modules/order'

const props = defineProps<{ tradeNo: string }>()

const form = ref({
  trade_no: props.tradeNo,
  amount: 0,
  refund_type: 'manual',
  fee_bearer: 'merchant',
  reason: '',
  out_trade_no: '',
  amount_input_tooltip: '',
  allow_auto_refund: true,
  allow_refund: false,
})

const formRules = ref<FormRules>({
  amount: [
    { required: true, message: '请输入退款金额', trigger: 'blur' },
    { min: 0.01, message: '退款金额不能小于0.01元', trigger: 'blur' },
  ],
})

const loading = ref(true)
const formRef = useTemplateRef<FormInstance>('formRef')

function getInfo() {
  api.refundInfo(props.tradeNo).then((res) => {
    form.value.out_trade_no = res.data.out_trade_no
    form.value.amount_input_tooltip = `该订单用户实付：${res.data.buyer_pay_amount}元，剩余可退款：${res.data.remaining_amount}元`
    form.value.amount = res.data.remaining_amount
    if (res.data.allow_auto_refund) {
      form.value.refund_type = 'auto'
    }
    if (!['TRADE_SUCCESS', 'TRADE_REFUND'].includes(res.data.trade_state)) {
      form.value.allow_refund = true
    }
  }).finally(() => {
    loading.value = false
  })
}

onMounted(getInfo)

defineExpose({
  submit: () => new Promise<void>((resolve) => {
    if (form.value.allow_refund) {
      return resolve()
    }
    formRef.value?.validate((valid) => {
      if (valid) {
        api.refund(form.value).then(() => resolve())
      }
    })
  }),
})
</script>

<template>
  <div v-loading="loading">
    <ElForm ref="formRef" label-width="100px" label-position="right" :rules="formRules" :model="form">
      <ElFormItem label="平台订单号">
        <span class="font-bold">{{ form.trade_no }}</span>
      </ElFormItem>
      <ElFormItem label="商户订单号">
        <FaSortText class="text-orange font-bold" :text="form.out_trade_no" :string-length="32" />
      </ElFormItem>

      <!-- 当订单状态不支持退款时显示提示 -->
      <ElAlert v-if="form.allow_refund" type="warning" description="当前订单状态不支持退款" :closable="false" show-icon />

      <!-- 退款表单 -->
      <template v-else>
        <ElFormItem label="退款方式">
          <ElRadioGroup v-model="form.refund_type">
            <ElRadio value="auto" :disabled="!form.allow_auto_refund">
              自动退款
            </ElRadio>
            <ElRadio value="manual">
              手动退款
            </ElRadio>
          </ElRadioGroup>
        </ElFormItem>
        <ElFormItem label="退款金额" prop="amount" :required="true">
          <ElTooltip :content="form.amount_input_tooltip">
            <ElInput v-model="form.amount" type="number" placeholder="请输入退款金额" min="0" :step="0.01">
              <template #append>
                元
              </template>
            </ElInput>
          </ElTooltip>
        </ElFormItem>
        <ElFormItem label="服务费承担方">
          <ElRadioGroup v-model="form.fee_bearer">
            <ElRadio value="platform">
              平台承担
            </ElRadio>
            <ElRadio value="merchant">
              商户承担
            </ElRadio>
          </ElRadioGroup>
        </ElFormItem>
      </template>
    </ElForm>
  </div>
</template>
