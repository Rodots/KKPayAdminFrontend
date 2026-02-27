<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import api from '@/api/modules/merchant'

const props = withDefaults(defineProps<{ id?: number | string }>(), { id: '' })

const loading = ref(false)
const formRef = useTemplateRef<FormInstance>('formRef')
const form = ref({
  id: props.id,
  merchant_number: '',
  nickname: '',
  margin: '0.00',
  email: '',
  phone: '',
  password: '',
  new_password: '',
  remark: '',
  diy_order_subject: '',
  buyer_pay_fee: 0,
  status: 1,
  risk_status: 0,
  competence: props.id === '' ? ['pay', 'orderSettle'] : [] as string[],
})

const formRules = ref<FormRules>({
  nickname: [
    { required: true, message: '请输入商户昵称', trigger: 'blur' },
    { max: 10, message: '商户昵称不能超过10个字符', trigger: 'blur' },
  ],
  password: [
    { required: form.value.id === '', message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6位', trigger: 'blur' },
  ],
  margin: [
    { required: true, message: '请输入保证金', trigger: 'blur' },
    { pattern: /^\d+(\.\d{1,2})?$/, message: '保证金格式不正确', trigger: 'blur' },
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱', trigger: 'blur' },
    { max: 64, message: '邮箱长度不能大于64位', trigger: 'blur' },
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' },
  ],
  remark: [{ max: 255, message: '备注最多输入255个字符', trigger: 'blur' }],
  diy_order_subject: [{ max: 255, message: '商品名称最多输入255个字符', trigger: 'blur' }],
})

const competenceOptions = [
  { label: '登录', value: 'login' },
  { label: '支付', value: 'pay' },
  { label: '退款', value: 'refund' },
  { label: '订单结算', value: 'orderSettle' },
  { label: '自动清账', value: 'autoWithdraw' },
]

onMounted(() => {
  if (form.value.id !== '') {
    getInfo()
  }
})

function getInfo() {
  loading.value = true
  api.detail(form.value.id).then((res: any) => {
    form.value.merchant_number = res.data.merchant_number
    form.value.nickname = res.data.nickname ?? ''
    form.value.margin = res.data.margin
    form.value.email = res.data.email
    form.value.phone = res.data.phone
    form.value.remark = res.data.remark
    form.value.diy_order_subject = res.data.diy_order_subject
    form.value.status = res.data.status ? 1 : 0
    form.value.risk_status = res.data.risk_status ? 1 : 0
    if (Array.isArray(res.data.competence)) {
      form.value.competence = res.data.competence
    }
  }).finally(() => {
    loading.value = false
  })
}

defineExpose({
  submit: () => new Promise<void>((resolve) => {
    formRef.value?.validate((valid) => {
      if (valid) {
        const apiCall = form.value.id === '' ? api.create : api.edit
        apiCall({ ...form.value, competence: form.value.competence }).then(() => resolve())
      }
    })
  }),
})
</script>

<template>
  <div v-loading="loading">
    <ElForm ref="formRef" :model="form" :rules="formRules" label-width="100px" label-suffix="：">
      <ElFormItem v-if="form.id !== ''" label="商户编号">
        <span>{{ form.merchant_number }}</span>
      </ElFormItem>
      <ElFormItem label="商户昵称" prop="nickname">
        <ElInput v-model="form.nickname" placeholder="请输入商户昵称" :maxlength="10" />
      </ElFormItem>
      <ElFormItem label="保证金" prop="margin">
        <ElInput v-model="form.margin" placeholder="请输入保证金" />
      </ElFormItem>
      <ElFormItem label="邮箱" prop="email">
        <ElInput v-model="form.email" placeholder="请输入邮箱，可留空" :maxlength="64" />
      </ElFormItem>
      <ElFormItem label="手机号" prop="phone">
        <ElInput v-model="form.phone" placeholder="请输入手机号，可留空" :maxlength="11" />
      </ElFormItem>
      <ElFormItem v-if="form.id === ''" label="密码" prop="password">
        <ElInput v-model="form.password" type="password" placeholder="请输入密码" />
      </ElFormItem>
      <ElFormItem v-else label="密码" prop="new_password">
        <ElInput v-model="form.new_password" type="password" placeholder="请输入新密码，留空则不修改" />
      </ElFormItem>
      <ElFormItem label="备注" prop="remark">
        <ElInput v-model="form.remark" type="textarea" :autosize="{ minRows: 2, maxRows: 4 }" :maxlength="255" placeholder="请输入备注，可留空, 最多输入255个字符" />
      </ElFormItem>
      <ElFormItem label="商品名称" prop="diy_order_subject">
        <ElTooltip content="留空则表示不设置（默认继承全局配置），最多可输入255个字。">
          <ElInput v-model="form.diy_order_subject" placeholder="自定义商品名，示例：测试[outorder] → 测试TEST001" :maxlength="255" />
        </ElTooltip>
        <ElText class="pt-1 text-xs text-gray-500">
          支持的变量：[name]原商品名称 [order]平台订单号 [outorder]商户订单号 [time]11位时间戳 [email]商户联系邮箱 [mobile]商户手机号
        </ElText>
      </ElFormItem>
      <ElFormItem label="平台服务费" prop="buyer_pay_fee">
        <ElRadioGroup v-model="form.buyer_pay_fee">
          <ElRadio :value="1" size="large">
            买家承担
          </ElRadio>
          <ElRadio :value="0" size="large">
            商户承担
          </ElRadio>
        </ElRadioGroup>
      </ElFormItem>
      <ElFormItem label="账户状态" prop="status">
        <ElRadioGroup v-model="form.status">
          <ElRadio :value="1" size="large">
            正常
          </ElRadio>
          <ElRadio :value="0" size="large">
            封禁
          </ElRadio>
        </ElRadioGroup>
      </ElFormItem>
      <ElFormItem label="风控状态" prop="risk_status">
        <ElRadioGroup v-model="form.risk_status">
          <ElRadio :value="1" size="large">
            启用
          </ElRadio>
          <ElRadio :value="0" size="large">
            禁用
          </ElRadio>
        </ElRadioGroup>
      </ElFormItem>
      <ElFormItem label="权限" prop="competence">
        <ElCheckboxGroup v-model="form.competence">
          <ElCheckbox v-for="option in competenceOptions" :key="option.value" :value="option.value" :label="option.label" />
        </ElCheckboxGroup>
      </ElFormItem>
    </ElForm>
  </div>
</template>
