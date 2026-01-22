<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import api from '@/api/modules/payment'

const props = withDefaults(defineProps<{ id?: number | string }>(), { id: '' })
const emit = defineEmits(['error'])

const loading = ref(false)
const formRef = useTemplateRef<FormInstance>('formRef')
const form = ref({
  id: props.id,
  code: '',
  name: '',
  payment_type: '',
  gateway: '',
  cost: 0,
  fixed_cost: 0,
  rate: 0,
  fixed_fee: 0,
  min_fee: null as number | null,
  max_fee: null as number | null,
  min_amount: null as number | null,
  max_amount: null as number | null,
  daily_limit: null as number | null,
  earliest_time: null as string | null,
  latest_time: null as string | null,
  roll_mode: '0',
  settle_cycle: 0,
  diy_order_subject: '',
  status: true,
  updated_at: '',
})

function toMinutes(time: string): number {
  if (!time) {
    return Number.NaN
  }
  const colonIndex = time.indexOf(':')
  if (colonIndex === -1) {
    return Number.NaN
  }
  const hh = Number(time.slice(0, colonIndex))
  const mm = Number(time.slice(colonIndex + 1))
  if (Number.isNaN(hh) || Number.isNaN(mm)) {
    return Number.NaN
  }
  return hh * 60 + mm
}

function validateAmountRange(_rule: any, _value: any, callback: any) {
  const { min_amount, max_amount } = form.value
  if (min_amount != null && max_amount != null && Number(min_amount) > Number(max_amount)) {
    callback(new Error('单笔最小金额不能大于单笔最大金额'))
  }
  else {
    callback()
  }
}

function validateFeeRange(_rule: any, _value: any, callback: any) {
  const { min_fee, max_fee } = form.value
  if (min_fee != null && max_fee != null && Number(min_fee) > Number(max_fee)) {
    callback(new Error('最低服务费不能大于最高服务费'))
  }
  else {
    callback()
  }
}

function validateTimeRange(_rule: any, _value: any, callback: any) {
  const { earliest_time, latest_time } = form.value
  if (!earliest_time || !latest_time) {
    return callback()
  }
  const e = toMinutes(earliest_time)
  const l = toMinutes(latest_time)
  if (Number.isNaN(e) || Number.isNaN(l)) {
    return callback()
  }
  if (e >= l) {
    return callback(new Error('最早可用时间需早于最晚可用时间'))
  }
  callback()
}

const formRules = ref<FormRules>({
  code: [
    { required: true, message: '请输入通道编码', trigger: 'blur' },
    { max: 16, message: '通道编码长度不能超过16位', trigger: 'blur' },
    { pattern: /^[A-Z0-9]+$/, message: '通道编码只能由大写字母和数字组成', trigger: 'blur' },
  ],
  name: [
    { required: true, message: '请输入通道名称', trigger: 'blur' },
    { max: 64, message: '通道名称长度不能超过64位', trigger: 'blur' },
  ],
  payment_type: [{ required: true, message: '请选择支付方式', trigger: 'change' }],
  gateway: [
    { required: true, message: '请输入网关代码', trigger: 'blur' },
    { max: 16, message: '网关代码长度不能超过16位', trigger: 'blur' },
    { pattern: /^[a-z0-9]+$/i, message: '网关代码只能由字母和数字组成', trigger: 'blur' },
  ],
  cost: [
    { required: true, message: '请输入费率成本', trigger: 'blur' },
    { type: 'number', message: '费率成本必须是数字', trigger: 'blur' },
  ],
  fixed_cost: [
    { required: true, message: '请输入固定成本', trigger: 'blur' },
    { type: 'number', message: '固定成本必须是数字', trigger: 'blur' },
  ],
  rate: [
    { required: true, message: '请输入费率', trigger: 'blur' },
    { type: 'number', message: '费率必须是数字', trigger: 'blur' },
  ],
  fixed_fee: [
    { required: true, message: '请输入固定服务费', trigger: 'blur' },
    { type: 'number', message: '固定服务费必须是数字', trigger: 'blur' },
  ],
  min_fee: [{ type: 'number', message: '最低服务费必须是数字', trigger: 'blur' }],
  max_fee: [
    { type: 'number', message: '最高服务费必须是数字', trigger: 'blur' },
    { validator: validateFeeRange, trigger: 'blur' },
  ],
  min_amount: [{ type: 'number', message: '单笔最小金额必须是数字', trigger: 'blur' }],
  max_amount: [
    { type: 'number', message: '单笔最大金额必须是数字', trigger: 'blur' },
    { validator: validateAmountRange, trigger: 'blur' },
  ],
  daily_limit: [{ type: 'number', message: '单日收款限额必须是数字', trigger: 'blur' }],
  earliest_time: [{ pattern: /^([01]\d|2[0-3]):([0-5]\d)$/, message: '最早可用时间格式不正确，应为 HH:MM 格式', trigger: 'blur' }],
  latest_time: [
    { pattern: /^([01]\d|2[0-3]):([0-5]\d)$/, message: '最晚可用时间格式不正确，应为 HH:MM 格式', trigger: 'blur' },
    { validator: validateTimeRange, trigger: 'blur' },
  ],
  roll_mode: [{ required: true, message: '请选择轮询模式', trigger: 'change' }],
  settle_cycle: [
    { required: true, message: '请输入结算周期', trigger: 'blur' },
    { type: 'number', message: '结算周期必须是数字', trigger: 'blur' },
  ],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
})

const paymentTypeOptions = [
  { label: '支付宝', value: 'Alipay' },
  { label: '微信支付', value: 'WechatPay' },
  { label: '银联/银行卡', value: 'Bank' },
  { label: '云闪付', value: 'UnionPay' },
  { label: 'QQ钱包', value: 'QQWallet' },
  { label: '京东支付', value: 'JDPay' },
  { label: 'PayPal', value: 'PayPal' },
]

const rollModeOptions = [
  { label: '按顺序依次轮询', value: '0' },
  { label: '随机轮询', value: '1' },
  { label: '按权重随机轮询', value: '2' },
  { label: '仅使用第一个可用账户', value: '3' },
]

onMounted(() => {
  if (form.value.id !== '') {
    getInfo()
  }
})

function getInfo() {
  loading.value = true
  api.channelDetail(form.value.id).then((res: any) => {
    const data = res?.data || {}
    form.value.code = data.code ?? ''
    form.value.name = data.name ?? ''
    form.value.payment_type = data.payment_type ?? ''
    form.value.gateway = data.gateway ?? ''
    form.value.cost = Number(data.cost ?? 0) * 100
    form.value.fixed_cost = Number(data.fixed_cost ?? 0)
    form.value.rate = Number(data.rate ?? 0) * 100
    form.value.fixed_fee = Number(data.fixed_cost ?? 0)
    form.value.min_fee = data.min_fee != null ? Number(data.min_fee) : null
    form.value.max_fee = data.max_fee != null ? Number(data.max_fee) : null
    form.value.min_amount = data.min_amount != null ? Number(data.min_amount) : null
    form.value.max_amount = data.max_amount != null ? Number(data.max_amount) : null
    form.value.daily_limit = data.daily_limit != null ? Number(data.daily_limit) : null
    form.value.earliest_time = data.earliest_time || null
    form.value.latest_time = data.latest_time || null
    form.value.roll_mode = data.roll_mode != null ? String(data.roll_mode) : '0'
    form.value.settle_cycle = data.settle_cycle != null ? Number(data.settle_cycle) : 0
    form.value.diy_order_subject = data.diy_order_subject ?? ''
    form.value.status = Boolean(Number(data.status))
    form.value.updated_at = data.updated_at
  }).catch((err: any) => {
    emit('error', err?.message || '获取详情失败')
  }).finally(() => {
    loading.value = false
  })
}

defineExpose({
  submit: () => new Promise<void>((resolve) => {
    formRef.value?.validate((valid) => {
      if (valid) {
        const apiCall = form.value.id === '' ? api.channelCreate : api.channelEdit
        apiCall(form.value).then(() => resolve())
      }
    })
  }),
})
</script>

<template>
  <div v-loading="loading">
    <ElForm ref="formRef" :model="form" :rules="formRules" label-width="121px" label-suffix="：">
      <ElFormItem v-if="form.id !== ''" label="上次更新时间">
        {{ form.updated_at }}
      </ElFormItem>
      <ElFormItem label="通道编码" prop="code">
        <ElInput v-model="form.code" placeholder="请输入通道编码，只能包含大写字母和数字" maxlength="16" />
      </ElFormItem>
      <ElFormItem label="通道名称" prop="name">
        <ElInput v-model="form.name" placeholder="请输入通道名称" maxlength="64" />
      </ElFormItem>
      <ElFormItem label="支付方式" prop="payment_type">
        <ElSelect v-model="form.payment_type" placeholder="请选择支付方式">
          <ElOption v-for="item in paymentTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem prop="gateway">
        <template #label>
          <span>网关代码</span>
          <ElTooltip content="此项不可随意填写，填错将导致无法正常支付，填写的内容请咨询技术人员！" placement="top">
            <ElIcon class="text-gray-400">
              <span class="text-xs">?</span>
            </ElIcon>
          </ElTooltip>
        </template>
        <ElInput v-model="form.gateway" placeholder="请输入网关代码（需严格按照后端支付网关实现的类名填写，如：Alipay）" maxlength="16" />
      </ElFormItem>
      <ElRow>
        <ElCol :md="12">
          <ElFormItem label="费率成本(%)" prop="cost">
            <ElInputNumber v-model="form.cost" class="w-full" placeholder="请输入费率成本" :min="0" :max="100" :precision="2" :step="0.5" />
          </ElFormItem>
        </ElCol>
        <ElCol :md="12">
          <ElFormItem label="固定成本" prop="fixed_cost">
            <ElInputNumber v-model="form.fixed_cost" class="w-full" placeholder="请输入固定成本" :min="0" :precision="2" :step="1" />
          </ElFormItem>
        </ElCol>
      </ElRow>
      <ElRow>
        <ElCol :md="12">
          <ElFormItem label="费率(%)" prop="rate">
            <ElInputNumber v-model="form.rate" class="w-full" placeholder="请输入费率" :min="0" :max="100" :precision="2" :step="0.5" />
          </ElFormItem>
        </ElCol>
        <ElCol :md="12">
          <ElFormItem label="固定服务费" prop="fixed_fee">
            <ElInputNumber v-model="form.fixed_fee" class="w-full" placeholder="请输入固定服务费" :min="0" :precision="2" :step="1" />
          </ElFormItem>
        </ElCol>
      </ElRow>
      <ElRow>
        <ElCol :md="12">
          <ElFormItem label="最低服务费" prop="min_fee">
            <ElTooltip content="填0或留空则默认为0.01" placement="top">
              <ElInputNumber v-model="form.min_fee" class="w-full" placeholder="请输入最低服务费" :min="0" :precision="2" :step="1" />
            </ElTooltip>
          </ElFormItem>
        </ElCol>
        <ElCol :md="12">
          <ElFormItem label="最高服务费" prop="max_fee">
            <ElTooltip content="填0或留空则表示不限制" placement="top">
              <ElInputNumber v-model="form.max_fee" class="w-full" placeholder="请输入最高服务费" :min="0" :precision="2" :step="1" />
            </ElTooltip>
          </ElFormItem>
        </ElCol>
      </ElRow>
      <ElRow>
        <ElCol :md="12">
          <ElFormItem label="单笔最小金额" prop="min_amount">
            <ElTooltip content="填0或留空则表示不限制" placement="top">
              <ElInputNumber v-model="form.min_amount" class="w-full" placeholder="请输入单笔最小金额" :min="0" :precision="2" :step="1" />
            </ElTooltip>
          </ElFormItem>
        </ElCol>
        <ElCol :md="12">
          <ElFormItem label="单笔最大金额" prop="max_amount">
            <ElTooltip content="填0或留空则表示不限制" placement="top">
              <ElInputNumber v-model="form.max_amount" class="w-full" placeholder="请输入单笔最大金额" :min="0" :precision="2" :step="1" />
            </ElTooltip>
          </ElFormItem>
        </ElCol>
      </ElRow>
      <ElFormItem label="单日收款限额" prop="daily_limit">
        <ElTooltip content="填0或留空则表示不限制" placement="top">
          <ElInputNumber v-model="form.daily_limit" class="w-full" placeholder="请输入单日收款限额" :min="0" :precision="2" :step="1000" />
        </ElTooltip>
      </ElFormItem>
      <ElRow>
        <ElCol :md="12">
          <ElFormItem label="最早可用时间" prop="earliest_time">
            <ElTimePicker v-model="form.earliest_time" value-format="HH:mm" placeholder="请选择最早可用时间，留空则不限制" format="HH:mm" class="!w-full" />
          </ElFormItem>
        </ElCol>
        <ElCol :md="12">
          <ElFormItem label="最晚可用时间" prop="latest_time">
            <ElTimePicker v-model="form.latest_time" value-format="HH:mm" placeholder="请选择最晚可用时间，留空则不限制" format="HH:mm" class="!w-full" />
          </ElFormItem>
        </ElCol>
      </ElRow>
      <ElFormItem label="商品名称" prop="diy_order_subject">
        <ElTooltip content="留空则表示不设置（默认继承商户配置），最多可输入255个字。">
          <ElInput v-model="form.diy_order_subject" placeholder="自定义商品名，示例：[name]-[outorder] → 会员充值100元-TEST001" :maxlength="255" />
        </ElTooltip>
        <ElText class="pt-1 text-xs text-gray-500">
          支持的变量：[name]原商品名称 [order]平台订单号 [outorder]商户订单号 [time]11位时间戳 [email]商户联系邮箱 [mobile]商户手机号
        </ElText>
      </ElFormItem>
      <ElRow>
        <ElCol :md="12">
          <ElFormItem label="轮询模式" prop="roll_mode">
            <ElSelect v-model="form.roll_mode" class="w-full" placeholder="请选择轮询模式">
              <ElOption v-for="item in rollModeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </ElSelect>
          </ElFormItem>
        </ElCol>
        <ElCol :md="12">
          <ElFormItem label="结算周期" prop="settle_cycle">
            <ElTooltip content="填0表示实时结算，填-1表示测试通道不结算" placement="top">
              <ElInputNumber v-model="form.settle_cycle" :min="-1" :max="365" :precision="0" class="w-full" placeholder="请输入天数">
                <template #prefix>
                  延迟
                </template>
                <template #suffix>
                  天结算
                </template>
              </ElInputNumber>
            </ElTooltip>
          </ElFormItem>
        </ElCol>
      </ElRow>
      <ElFormItem label="状态" prop="status">
        <ElRadioGroup v-model="form.status">
          <ElRadio :value="true" size="large">
            启用
          </ElRadio>
          <ElRadio :value="false" size="large">
            禁用
          </ElRadio>
        </ElRadioGroup>
      </ElFormItem>
    </ElForm>
  </div>
</template>
