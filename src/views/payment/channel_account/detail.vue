<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import api from '@/api/modules/payment'
import eventBus from '@/utils/eventBus'

defineOptions({
  name: 'PaymentChannelAccountDetail',
})

const route = useRoute()
const router = useRouter()

const channelId = computed(() => route.params.channelId as string || '')
const formId = computed(() => route.params.id as string || '')
const isEdit = computed(() => formId.value !== '')
const pageTitle = computed(() => isEdit.value ? '编辑通道子账户' : '新增通道子账户')

const loading = ref(false)
const loadingConfig = ref(false)
const channelRollMode = ref(0)

const formRef = useTemplateRef<FormInstance>('formRef')
const dynamicFormRef = useTemplateRef<InstanceType<typeof DynamicForm>>('dynamicFormRef')
const dynamicFormConfig = ref<any[]>([])
const dynamicFormNotes = ref('')
const dynamicFormData = ref<Record<string, any>>({})

const form = ref({
  id: formId.value,
  payment_channel_id: channelId.value,
  name: '',
  inherit_config: true,
  roll_weight: 1,
  rate: 0,
  min_amount: null as number | null,
  max_amount: null as number | null,
  daily_limit: null as number | null,
  earliest_time: null as string | null,
  latest_time: null as string | null,
  config: [] as any[],
  diy_order_subject: '',
  status: true,
  remark: '',
  updated_at: '',
})

// 时间转分钟数，用于比较
function toMinutes(time: string): number {
  if (!time) {
    return Number.NaN
  }
  const [hh, mm] = time.split(':').map(Number)
  return Number.isNaN(hh) || Number.isNaN(mm) ? Number.NaN : hh * 60 + mm
}

// 金额范围校验
function validateAmountRange(_rule: any, _value: any, callback: any) {
  const { min_amount, max_amount } = form.value
  if (min_amount != null && max_amount != null && min_amount > max_amount) {
    callback(new Error('单笔最小金额不能大于单笔最大金额'))
  }
  else {
    callback()
  }
}

// 时间范围校验
function validateTimeRange(_rule: any, _value: any, callback: any) {
  const { earliest_time, latest_time } = form.value
  if (!earliest_time || !latest_time) {
    return callback()
  }
  const e = toMinutes(earliest_time)
  const l = toMinutes(latest_time)
  if (!Number.isNaN(e) && !Number.isNaN(l) && e >= l) {
    return callback(new Error('最早可用时间需早于最晚可用时间'))
  }
  callback()
}

// 表单校验规则
const formRules = computed<FormRules>(() => {
  const rules: FormRules = {
    name: [
      { required: true, message: '请输入子账户名称', trigger: 'blur' },
      { max: 64, message: '子账户名称长度不能超过64位', trigger: 'blur' },
    ],
    inherit_config: [{ required: true, message: '请选择是否继承配置', trigger: 'change' }],
    status: [{ required: true, message: '请选择状态', trigger: 'change' }],
  }

  // 按权重随机轮询时，校验轮询权重
  if (channelRollMode.value === 2) {
    rules.roll_weight = [
      { required: true, message: '请输入轮询权重', trigger: 'blur' },
      { type: 'number', message: '轮询权重必须是数字', trigger: 'blur' },
    ]
  }

  // 自定义配置时的额外校验
  if (!form.value.inherit_config) {
    Object.assign(rules, {
      rate: [
        { required: true, message: '请输入费率', trigger: 'blur' },
        { type: 'number', message: '费率必须是数字', trigger: 'blur' },
      ],
      min_amount: [{ type: 'number', message: '单笔最小金额必须是数字', trigger: 'blur' }],
      max_amount: [
        { type: 'number', message: '单笔最大金额必须是数字', trigger: 'blur' },
        { validator: validateAmountRange, trigger: 'blur' },
      ],
      daily_limit: [{ type: 'number', message: '单日收款限额必须是数字', trigger: 'blur' }],
      earliest_time: [{ pattern: /^([01]\d|2[0-3]):([0-5]\d)$/, message: '时间格式不正确，应为 HH:MM', trigger: 'blur' }],
      latest_time: [
        { pattern: /^([01]\d|2[0-3]):([0-5]\d)$/, message: '时间格式不正确，应为 HH:MM', trigger: 'blur' },
        { validator: validateTimeRange, trigger: 'blur' },
      ],
    })
  }

  return rules
})

// 获取通道配置表单
async function fetchChannelConfig() {
  loadingConfig.value = true
  try {
    const [configRes, channelRes] = await Promise.all([
      api.getChannelConfigForm(channelId.value),
      api.channelDetail(channelId.value),
    ])
    dynamicFormConfig.value = configRes?.data?.config || []
    dynamicFormNotes.value = configRes?.data?.notes || ''
    channelRollMode.value = Number(channelRes?.data?.roll_mode) || 0
  }
  catch {
    onCancel()
  }
  finally {
    loadingConfig.value = false
  }
}

// 获取子账户详情
async function fetchAccountDetail() {
  loading.value = true
  try {
    const res = await api.channelAccountDetail(formId.value)
    const data = res?.data || {}
    Object.assign(form.value, {
      name: data.name ?? '',
      inherit_config: Boolean(Number(data.inherit_config)),
      rate: Number(data.rate) || 0,
      min_amount: data.min_amount != null ? Number(data.min_amount) : null,
      max_amount: data.max_amount != null ? Number(data.max_amount) : null,
      daily_limit: data.daily_limit != null ? Number(data.daily_limit) : null,
      earliest_time: data.earliest_time || null,
      latest_time: data.latest_time || null,
      config: data.config || [],
      diy_order_subject: data.diy_order_subject ?? '',
      roll_weight: Number(data.roll_weight) || 1,
      status: Boolean(Number(data.status)),
      remark: data.remark ?? '',
      updated_at: data.updated_at,
    })
    if (data.config && typeof data.config === 'object') {
      dynamicFormData.value = { ...dynamicFormData.value, ...data.config }
    }
  }
  catch {
    onCancel()
  }
  finally {
    loading.value = false
  }
}

// 提交表单
async function onSubmit() {
  const formValid = await formRef.value?.validate().catch(() => false)
  if (!formValid) {
    return
  }

  const dynamicValid = await dynamicFormRef.value?.validate()
  if (!dynamicValid) {
    return
  }

  const submitData = { ...form.value, config: dynamicFormData.value }
  const apiCall = isEdit.value ? api.channelAccountEdit : api.channelAccountCreate
  await apiCall(submitData)
  eventBus.emit('get-data-list')
  onCancel()
}

function onCancel() {
  router.close({ path: `/payment/channel_account/${channelId.value}` })
}

onMounted(() => {
  fetchChannelConfig()
  if (isEdit.value) {
    fetchAccountDetail()
  }
})
</script>

<template>
  <div>
    <FaPageHeader :title="pageTitle">
      <FaButton variant="outline" size="sm" class="rounded-full" @click="onCancel">
        <FaIcon name="i-ep:arrow-left" />
        返回
      </FaButton>
    </FaPageHeader>
    <FaPageMain>
      <ElRow>
        <ElCol :lg="4" />
        <ElCol :lg="16">
          <div v-loading="loading">
            <ElForm ref="formRef" :model="form" :rules="formRules" :validate-on-rule-change="false" label-width="121px" label-suffix="：">
              <FaPageMain title="基本信息">
                <ElFormItem v-if="isEdit" label="上次更新时间">
                  {{ form.updated_at }}
                </ElFormItem>
                <ElFormItem label="子账户名称" prop="name">
                  <ElInput v-model="form.name" placeholder="请输入子账户名称" maxlength="64" />
                </ElFormItem>
                <ElFormItem label="是否继承配置" prop="inherit_config">
                  <ElRadioGroup v-model="form.inherit_config">
                    <ElRadioButton label="继承" :value="true" />
                    <ElRadioButton label="自定义" :value="false" />
                  </ElRadioGroup>
                </ElFormItem>

                <!-- 自定义配置区域 -->
                <template v-if="!form.inherit_config">
                  <ElFormItem label="费率(%)" prop="rate">
                    <ElInputNumber v-model="form.rate" class="w-full" placeholder="请输入费率" :min="0" :max="100" :precision="2" :step="0.5" />
                  </ElFormItem>
                  <ElRow>
                    <ElCol :md="12">
                      <ElFormItem label="单笔最小金额" prop="min_amount">
                        <ElTooltip content="填0或留空则表示不限制" placement="top">
                          <ElInputNumber v-model="form.min_amount" class="w-full" placeholder="请输入单笔最小金额" :min="0" :precision="2" />
                        </ElTooltip>
                      </ElFormItem>
                    </ElCol>
                    <ElCol :md="12">
                      <ElFormItem label="单笔最大金额" prop="max_amount">
                        <ElTooltip content="填0或留空则表示不限制" placement="top">
                          <ElInputNumber v-model="form.max_amount" class="w-full" placeholder="请输入单笔最大金额" :min="0" :precision="2" />
                        </ElTooltip>
                      </ElFormItem>
                    </ElCol>
                  </ElRow>
                  <ElRow>
                    <ElCol :md="12">
                      <ElFormItem label="单日收款限额" prop="daily_limit">
                        <ElTooltip content="填0或留空则表示不限制" placement="top">
                          <ElInputNumber v-model="form.daily_limit" class="w-full" placeholder="请输入单日收款限额" :min="0" :precision="2" :step="1000" />
                        </ElTooltip>
                      </ElFormItem>
                    </ElCol>
                    <ElCol :md="6">
                      <ElFormItem label="最早可用时间" prop="earliest_time">
                        <ElTimePicker v-model="form.earliest_time" value-format="HH:mm" placeholder="留空则不限制" format="HH:mm" class="!w-full" />
                      </ElFormItem>
                    </ElCol>
                    <ElCol :md="6">
                      <ElFormItem label="最晚可用时间" prop="latest_time">
                        <ElTimePicker v-model="form.latest_time" value-format="HH:mm" placeholder="留空则不限制" format="HH:mm" class="!w-full" />
                      </ElFormItem>
                    </ElCol>
                  </ElRow>
                </template>

                <ElFormItem label="商品名称" prop="diy_order_subject">
                  <ElTooltip content="留空则表示不设置（默认继承通道配置），最多可输入255个字。">
                    <ElInput v-model="form.diy_order_subject" placeholder="自定义商品名，示例：[name]-[outorder] → 会员充值100元-TEST001" :maxlength="255" />
                  </ElTooltip>
                  <ElText class="pt-1 text-xs text-gray-500">
                    支持的变量：[name]原商品名称 [order]平台订单号 [outorder]商户订单号 [time]11位时间戳 [email]商户联系邮箱 [mobile]商户手机号
                  </ElText>
                </ElFormItem>
                <ElFormItem v-if="channelRollMode === 2" prop="roll_weight">
                  <template #label>
                    <span>轮询权重</span>
                    <ElTooltip content="权重越大，被选中的概率越高，但注意拉满100不代表百分百命中，如果多个子账户都为100，实际上等同于各占50%的概率" placement="top">
                      <ElIcon class="text-gray-400">
                        <span class="text-xs">?</span>
                      </ElIcon>
                    </ElTooltip>
                  </template>
                  <ElSlider v-model="form.roll_weight" class="w-full" :min="1" :max="100" show-input />
                </ElFormItem>
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
                <ElFormItem label="备注" prop="remark">
                  <ElInput v-model="form.remark" type="textarea" placeholder="可为此子账户添加备注，内容可为空；备注长度请勿超过1024个字符。" maxlength="1024" />
                </ElFormItem>
              </FaPageMain>
              <FaPageMain title="对接信息">
                <DynamicForm ref="dynamicFormRef" v-model="dynamicFormData" :config="dynamicFormConfig" :notes="dynamicFormNotes" :loading="loadingConfig" />
              </FaPageMain>
            </ElForm>
          </div>
        </ElCol>
      </ElRow>
    </FaPageMain>
    <FaFixedActionBar>
      <div class="flex-center gap-4">
        <FaButton @click="onSubmit">
          提交
        </FaButton>
        <FaButton variant="outline" @click="onCancel">
          取消
        </FaButton>
      </div>
    </FaFixedActionBar>
  </div>
</template>
