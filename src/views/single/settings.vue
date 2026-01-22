<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toast } from 'vue-sonner'
import * as z from 'zod'
import settingApi from '@/api/modules/setting'
import { useFaModal } from '@/ui/components/FaModal'
import { useGlobalSettings } from '@/utils/globalSettings'

// ===== 状态管理 =====
const isDirty = ref(false)
const loading = ref(false)
const saving = ref(false)
const activeAnchor = ref('system')
const { refreshCache } = useGlobalSettings()
const FaModal = useFaModal()

// ===== 导航与字段分组配置 =====
const navList = [
  { icon: 'i-ep-setting', label: '基础设置', value: 'system' },
  { icon: 'i-ep-money', label: '支付配置', value: 'payment' },
  { icon: 'i-ep-message', label: '邮件配置', value: 'email' },
  { icon: 'i-ep-promotion', label: '代理配置', value: 'proxy' },
] as const

// ===== 表单数据 =====
const systemForm = ref({
  site_name: '',
  notify_url: '',
  cdn_static_url: '/ajax/libs/',
})

const paymentForm = ref({
  max_amount: '',
  min_amount: '',
  order_expire_time: '1800',
  diy_order_subject: '',
  subject_blocked_keywords: '',
  subject_blocked_keywords_prompt: '温馨提示：该商品禁止出售，如有疑问请联系网站客服！',
  enable_merchant_channel_whitelist: 'on' as 'off' | 'on',
  qrcode_page_hide_order_subject: 'on' as 'on' | 'off',
  blacklist_order_action: '0' as '0' | '1',
  ip_order_limit: '',
  account_order_limit: '',
  api_refund_fee_bearer: 'merchant' as 'platform' | 'merchant',
})

const emailForm = ref({
  smtp_host: '',
  smtp_port: '465',
  smtp_user: '',
  smtp_password: '',
  smtp_encryption: 'ssl' as 'ssl' | 'tls' | 'none',
  sender_name: '',
})

const proxyForm = ref({
  proxy_switch: 'off' as 'off' | 'on',
  proxy_host: '',
  proxy_port: '',
  proxy_protocol: 'http' as 'http' | 'https' | 'socks5',
  proxy_user: '',
  proxy_password: '',
})

// 表单分组映射（用于字段分组判断）
const formGroups = {
  system: systemForm,
  payment: paymentForm,
  email: emailForm,
  proxy: proxyForm,
} as const

// ===== 表单校验 Schema =====
function createPortValidator(msg: string) {
  return z.string().refine(
    val => !val || (Number.parseInt(val, 10) >= 1 && Number.parseInt(val, 10) <= 65535),
    { message: msg },
  )
}

function createOptionalRangeValidator(min: number, max: number, msg: string) {
  return z.string().refine(
    (val) => {
      if (!val) {
        return true
      }
      const n = Number.parseInt(val, 10)
      return !Number.isNaN(n) && n >= min && n <= max
    },
    { message: msg },
  )
}

const validationSchema = z.object({
  // 系统配置
  site_name: z.string().min(1, '请输入网站名称').max(50, '网站名称不能超过50个字符'),
  notify_url: z.string().refine(val => !val || /^https?:\/\/.+\/$/.test(val), { message: '回调地址必须以 http(s):// 开头，以 / 结尾' }),
  cdn_static_url: z.string().min(1, '请选择公共静态资源库'),
  // 支付配置
  min_amount: z.string().refine(val => !val || Number.parseFloat(val) >= 0.01, { message: '最小金额必须是有效的正数' }),
  max_amount: z.string().refine(val => !val || Number.parseFloat(val) < 100000000, { message: '最大金额必须是有效的正数' }),
  order_expire_time: createOptionalRangeValidator(60, 86400, '订单过期时间必须在60-86400秒之间'),
  diy_order_subject: z.string().max(255, '自定义商品名称不能超过255个字符').optional(),
  blocked_keywords: z.string().optional(),
  blocked_keywords_prompt: z.string().max(500, '拦截提示内容不能超过500个字符').optional(),
  enable_merchant_channel_whitelist: z.enum(['off', 'on']),
  qrcode_page_hide_order_subject: z.enum(['off', 'on']),
  blacklist_order_action: z.enum(['0', '1']),
  ip_order_limit: createOptionalRangeValidator(1, 10000, '单IP限制必须在1-10000之间'),
  account_order_limit: createOptionalRangeValidator(1, 10000, '单账户限制必须在1-10000之间'),
  api_refund_fee_bearer: z.enum(['platform', 'merchant']),
  // 邮件配置
  smtp_host: z.string().optional(),
  smtp_port: createPortValidator('端口必须在1-65535之间'),
  smtp_user: z.string().optional(),
  smtp_password: z.string().optional(),
  smtp_encryption: z.enum(['ssl', 'tls', 'none']),
  sender_name: z.string().max(50, '发件人名称不能超过50个字符').optional(),
  // 代理配置
  proxy_switch: z.enum(['off', 'on']),
  proxy_host: z.string().optional(),
  proxy_port: createPortValidator('端口必须在1-65535之间'),
  proxy_protocol: z.enum(['http', 'https', 'socks5']),
  proxy_user: z.string().optional(),
  proxy_password: z.string().optional(),
}).superRefine((data, ctx) => {
  // 跨字段验证：最小金额 < 最大金额（两者都填写时才校验）
  const minVal = data.min_amount ? Number.parseFloat(data.min_amount) : null
  const maxVal = data.max_amount ? Number.parseFloat(data.max_amount) : null

  if (minVal !== null && maxVal !== null) {
    if (minVal >= maxVal) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '最小金额必须小于最大金额',
        path: ['min_amount'],
      })
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '最大金额必须大于最小金额',
        path: ['max_amount'],
      })
    }
  }
})

// ===== 表单管理 =====
const form = useForm({
  validationSchema,
  initialValues: {
    ...systemForm.value,
    ...paymentForm.value,
    ...emailForm.value,
    ...proxyForm.value,
  },
})

// 同步表单数据到 vee-validate 并标记 dirty
watch(
  [systemForm, paymentForm, emailForm, proxyForm],
  () => {
    form.setValues({ ...systemForm.value, ...paymentForm.value, ...emailForm.value, ...proxyForm.value } as any)
    isDirty.value = true
  },
  { deep: true },
)

const getFieldError = (fieldName: string) => (form.errors.value as Record<string, string | undefined>)[fieldName]

// ===== CDN 选项 =====
const cdnOptions = [
  { label: '【推荐】本地资源（服务器带宽高首选）', value: '/ajax/libs/' },
  { label: '【官方】CDNJS（海外用户多首选）', value: 'https://cdnjs.cloudflare.com/ajax/libs/' },
  { label: '【镜像】BootCDN', value: 'https://cdn.bootcdn.net/ajax/libs/' },
  { label: '【镜像】Staticfile CDN', value: 'https://cdn.staticfile.net/' },
  { label: '【镜像】Zstatic.net', value: 'https://s4.zstatic.net/ajax/libs/' },
  { label: '【镜像】南方科技大学', value: 'https://mirrors.sustech.edu.cn/cdnjs/ajax/libs/' },
  { label: '【镜像】未闻花名', value: 'https://cdnjs.snrat.com/ajax/libs/' },
  { label: '【镜像】7ED', value: 'https://use.sevencdn.com/ajax/libs/' },
  { label: '【镜像】渺软', value: 'https://cdnjs.onmicrosoft.cn/ajax/libs/' },
  { label: '【镜像】永至科技', value: 'https://cdnjs.znnu.com/ajax/libs/' },
]

// ===== 锚点定位 =====
function scrollToSection(sectionId: string) {
  document.getElementById(`section-${sectionId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  activeAnchor.value = sectionId
}

function handleScroll() {
  for (const { value: id } of navList) {
    const el = document.getElementById(`section-${id}`)
    if (el) {
      const { top, bottom } = el.getBoundingClientRect()
      if (top <= 200 && bottom > 100) {
        activeAnchor.value = id
        break
      }
    }
  }
}

// ===== 生命周期 =====
onMounted(() => {
  loadAllSettings()
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => window.removeEventListener('scroll', handleScroll))

onBeforeRouteLeave((_from, _to, next) => {
  if (isDirty.value) {
    FaModal.confirm({
      title: '温馨提醒',
      content: '当前页面还没有保存，是否确定要离开？',
      confirmButtonText: '确定离开',
      onConfirm: () => next(),
    })
  }
  else {
    next()
  }
})

// ===== API 调用 =====
async function loadAllSettings() {
  loading.value = true
  try {
    const { data } = await settingApi.getAll()
    if (data) {
      Object.assign(systemForm.value, data.system)
      Object.assign(paymentForm.value, data.payment)
      Object.assign(emailForm.value, data.email)
      Object.assign(proxyForm.value, data.proxy)
    }
  }
  finally {
    loading.value = false
    await nextTick()
    isDirty.value = false
  }
}

async function saveAllSettings() {
  const { valid } = await form.validate()
  if (!valid) {
    toast.error('请检查各配置项格式填写是否正确')
    // 使用 Object.groupBy (ES2024) 按分组归类字段，快速定位错误区域
    const firstErrorField = Object.keys(form.errors.value)[0]
    if (firstErrorField) {
      const group = (Object.entries(formGroups) as [string, typeof systemForm][])
        .find(([, formRef]) => firstErrorField in formRef.value)?.[0] ?? 'proxy'
      scrollToSection(group)
    }
    return
  }

  saving.value = true
  try {
    await settingApi.saveAll({
      system: { ...systemForm.value },
      payment: { ...paymentForm.value },
      email: { ...emailForm.value },
      proxy: { ...proxyForm.value },
    })
    await refreshCache()
    isDirty.value = false
    toast.success('配置保存成功')
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <div v-loading="loading">
    <FaPageHeader title="站点配置" description="管理系统站点的基础配置、支付配置、邮件配置等。" />

    <!-- 快捷导航（固定在右侧） -->
    <div class="fixed right-8 top-1/10 z-50 hidden xl:block">
      <div class="flex flex-col gap-1 border border-border rounded-lg bg-card/80 p-2 shadow-lg backdrop-blur-sm">
        <div
          v-for="item in navList"
          :key="item.value"
          class="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm transition-all duration-200 hover:bg-muted"
          :class="{ 'bg-primary/10 text-primary font-medium': activeAnchor === item.value }"
          @click="scrollToSection(item.value)"
        >
          <i :class="item.icon" class="size-4" />
          <span>{{ item.label }}</span>
        </div>
      </div>
    </div>

    <ElForm label-position="top" label-width="120px">
      <!-- 基础配置（分组: system） -->
      <FaPageMain id="section-system" class="scroll-mt-20">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="i-ep-setting size-5 text-primary" />
            <span>基础配置</span>
            <ElTag size="small" type="info">
              system
            </ElTag>
          </div>
        </template>
        <ElRow :gutter="20">
          <ElCol :md="8">
            <ElFormItem label="网站名称" :error="getFieldError('site_name')">
              <ElInput v-model="systemForm.site_name" placeholder="请输入网站名称" />
            </ElFormItem>
          </ElCol>
          <ElCol :md="8">
            <ElFormItem label="回调专用地址" :error="getFieldError('notify_url')">
              <template #label>
                <span>回调专用地址</span>
                <ElTooltip content="必须以 http(s):// 开头，以 / 结尾，填错会导致订单无法回调（不会填请留空）" placement="top">
                  <ElIcon class="ml-1 cursor-help">
                    <i class="i-ep-question-filled" />
                  </ElIcon>
                </ElTooltip>
              </template>
              <ElInput v-model="systemForm.notify_url" placeholder="请输入回调专用地址（可留空）" />
            </ElFormItem>
          </ElCol>
          <ElCol :md="8">
            <ElFormItem label="公共静态资源库" :error="getFieldError('cdn_static_url')">
              <ElSelect v-model="systemForm.cdn_static_url" placeholder="请选择公共静态资源库 CDN 提供方" class="w-full">
                <ElOption v-for="item in cdnOptions" :key="item.value" :label="item.label" :value="item.value" />
              </ElSelect>
            </ElFormItem>
          </ElCol>
        </ElRow>
      </FaPageMain>

      <!-- 支付配置（分组: payment） -->
      <FaPageMain id="section-payment" class="scroll-mt-20">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="i-ep-money size-5 text-primary" />
            <span>支付配置</span>
            <ElTag size="small" type="info">
              payment
            </ElTag>
          </div>
        </template>
        <ElRow :gutter="20">
          <ElCol :md="6">
            <ElFormItem label="最小支付金额" :error="getFieldError('min_amount')">
              <ElInput v-model="paymentForm.min_amount" placeholder="请输入最小支付金额" type="number">
                <template #suffix>
                  元
                </template>
              </ElInput>
            </ElFormItem>
          </ElCol>
          <ElCol :md="6">
            <ElFormItem label="最大支付金额" :error="getFieldError('max_amount')">
              <ElInput v-model="paymentForm.max_amount" placeholder="请输入最大支付金额" type="number">
                <template #suffix>
                  元
                </template>
              </ElInput>
            </ElFormItem>
          </ElCol>
          <ElCol :md="6">
            <ElFormItem label="订单过期时间" :error="getFieldError('order_expire_time')">
              <ElInput v-model="paymentForm.order_expire_time" placeholder="留空表示不限制" type="number">
                <template #suffix>
                  秒
                </template>
              </ElInput>
            </ElFormItem>
          </ElCol>
          <ElCol :md="3">
            <ElFormItem label="商户通道白名单">
              <ElRadioGroup v-model="paymentForm.enable_merchant_channel_whitelist">
                <ElRadioButton label="启用" value="on" />
                <ElRadioButton label="禁用" value="off" />
              </ElRadioGroup>
            </ElFormItem>
          </ElCol>
          <ElCol :md="3">
            <ElFormItem label="扫码页面商品名称">
              <ElRadioGroup v-model="paymentForm.qrcode_page_hide_order_subject">
                <ElRadioButton label="显示" value="on" />
                <ElRadioButton label="隐藏" value="off" />
              </ElRadioGroup>
            </ElFormItem>
          </ElCol>
          <ElCol :md="24">
            <ElFormItem label="自定义商品名称" :error="getFieldError('diy_order_subject')">
              <ElInput
                v-model="paymentForm.diy_order_subject"
                placeholder="自定义商品名，示例：[name]-[outorder] → 会员充值100元-TEST001"
                :maxlength="255"
              />
              <Transition name="fade">
                <ElText class="block pt-2 text-xs text-gray-500">
                  支持的变量：[name]原商品名称 [order]平台订单号 [outorder]商户订单号 [time]11位时间戳 [email]商户联系邮箱 [mobile]商户手机号
                </ElText>
              </Transition>
            </ElFormItem>
          </ElCol>
          <ElCol :md="24">
            <ElFormItem>
              <template #label>
                <span>商品名称屏蔽关键词</span>
                <ElTooltip content="多个关键词用竖线|分隔，创建订单时如商品名称包含这些关键词将被拦截" placement="top">
                  <ElIcon class="ml-1 cursor-help">
                    <i class="i-ep-question-filled" />
                  </ElIcon>
                </ElTooltip>
              </template>
              <ElInput v-model="paymentForm.subject_blocked_keywords" placeholder="请输入商品屏蔽关键词，多个用竖线|分隔，如：枪支|毒品|赌博" />
            </ElFormItem>
          </ElCol>
          <ElCol :md="24">
            <ElFormItem label="商品拦截后提示内容" :error="getFieldError('subject_blocked_keywords_prompt')">
              <ElInput v-model="paymentForm.subject_blocked_keywords_prompt" placeholder="请输入商品拦截后用户看到的提示内容，如：【温馨提示：该商品禁止出售，如有疑问请联系网站客服！】" />
            </ElFormItem>
          </ElCol>
          <ElCol :md="6">
            <ElFormItem>
              <template #label>
                <span>黑名单用户支付订单后</span>
                <ElTooltip content="有些支付网关无法在支付前拦截黑名单付款，可以设置该选项，当上游返回了黑名单账号信息后执行对应的操作" placement="top">
                  <ElIcon class="ml-1 cursor-help">
                    <i class="i-ep-question-filled" />
                  </ElIcon>
                </ElTooltip>
              </template>
              <ElSelect v-model="paymentForm.blacklist_order_action" placeholder="请选择操作">
                <ElOption value="0" label="无操作" />
                <ElOption value="1" label="该订单不回调下游" />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :md="6">
            <ElFormItem label="限制单IP每日可支付笔数" :error="getFieldError('ip_order_limit')">
              <ElInput v-model="paymentForm.ip_order_limit" placeholder="留空表示不限制" type="number">
                <template #suffix>
                  笔
                </template>
              </ElInput>
            </ElFormItem>
          </ElCol>
          <ElCol :md="6">
            <ElFormItem label="限制单支付账号每日可支付笔数" :error="getFieldError('account_order_limit')">
              <ElInput v-model="paymentForm.account_order_limit" placeholder="留空表示不限制" type="number">
                <template #suffix>
                  笔
                </template>
              </ElInput>
            </ElFormItem>
          </ElCol>
          <ElCol :md="6">
            <ElFormItem label="商户通过API退款订单时的手续费承担方" :error="getFieldError('api_refund_fee_bearer')">
              <ElSelect v-model="paymentForm.api_refund_fee_bearer" placeholder="请选择承担方">
                <ElOption value="platform" label="平台承担" />
                <ElOption value="merchant" label="商户承担" />
              </ElSelect>
            </ElFormItem>
          </ElCol>
        </ElRow>
      </FaPageMain>

      <!-- 邮件配置（分组: email） -->
      <FaPageMain id="section-email" class="scroll-mt-20">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="i-ep-message size-5 text-primary" />
            <span>邮件配置</span>
            <ElTag size="small" type="info">
              email
            </ElTag>
          </div>
        </template>
        <ElRow :gutter="20">
          <ElCol :md="8">
            <ElFormItem label="SMTP 服务器">
              <ElInput v-model="emailForm.smtp_host" placeholder="请输入 SMTP 服务器地址" />
            </ElFormItem>
          </ElCol>
          <ElCol :md="4">
            <ElFormItem label="端口" :error="getFieldError('smtp_port')">
              <ElInput v-model="emailForm.smtp_port" placeholder="端口" type="number" />
            </ElFormItem>
          </ElCol>
          <ElCol :md="4">
            <ElFormItem label="加密方式">
              <ElSelect v-model="emailForm.smtp_encryption" class="w-full">
                <ElOption label="SSL" value="ssl" />
                <ElOption label="TLS" value="tls" />
                <ElOption label="无" value="none" />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :md="8">
            <ElFormItem label="发件人名称" :error="getFieldError('sender_name')">
              <ElInput v-model="emailForm.sender_name" placeholder="请输入发件人名称" />
            </ElFormItem>
          </ElCol>
          <ElCol :md="12">
            <ElFormItem label="SMTP 账号">
              <ElInput v-model="emailForm.smtp_user" placeholder="请输入 SMTP 账号（邮箱地址）" />
            </ElFormItem>
          </ElCol>
          <ElCol :md="12">
            <ElFormItem label="SMTP 密码">
              <ElInput v-model="emailForm.smtp_password" type="password" placeholder="请输入 SMTP 密码或授权码" show-password />
            </ElFormItem>
          </ElCol>
        </ElRow>
      </FaPageMain>

      <!-- 代理配置（分组: proxy） -->
      <FaPageMain id="section-proxy" class="scroll-mt-20">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="i-ep-promotion size-5 text-primary" />
            <span>网关代理配置</span>
            <ElTag size="small" type="info">
              proxy
            </ElTag>
            <ElTooltip content="本功能开启后，在支付成功异步回调的时候，使用中转代理访问商户网站，可解决一些只能国内访问的网站回调问题，也可以防止本站服务器IP泄露。" placement="top">
              <ElIcon class="ml-1 cursor-help">
                <i class="i-ep-question-filled" />
              </ElIcon>
            </ElTooltip>
          </div>
        </template>
        <ElRow :gutter="20">
          <ElCol :md="4">
            <ElFormItem label="订单回调代理功能开关">
              <ElSelect v-model="proxyForm.proxy_switch" placeholder="请选择功能开关">
                <ElOption value="off" label="禁用" />
                <ElOption value="on" label="启用" />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :md="12">
            <ElFormItem label="代理服务器IP地址">
              <ElInput v-model="proxyForm.proxy_host" placeholder="请输入代理服务器IP地址" />
            </ElFormItem>
          </ElCol>
          <ElCol :md="4">
            <ElFormItem label="代理服务器端口" :error="getFieldError('proxy_port')">
              <ElInput v-model="proxyForm.proxy_port" placeholder="请输入代理服务器端口" type="number" />
            </ElFormItem>
          </ElCol>
          <ElCol :md="4">
            <ElFormItem label="代理协议">
              <ElSelect v-model="proxyForm.proxy_protocol" placeholder="请选择代理协议">
                <ElOption value="http" label="HTTP" />
                <ElOption value="https" label="HTTPS" />
                <ElOption value="socks5" label="SOCKS5" />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :md="12">
            <ElFormItem label="代理账号">
              <ElInput v-model="proxyForm.proxy_user" placeholder="请输入代理账号" />
            </ElFormItem>
          </ElCol>
          <ElCol :md="12">
            <ElFormItem label="代理密码">
              <ElInput v-model="proxyForm.proxy_password" type="password" placeholder="请输入代理密码" show-password />
            </ElFormItem>
          </ElCol>
        </ElRow>
      </FaPageMain>
    </ElForm>

    <FaFixedActionBar>
      <ElButton type="primary" size="large" :loading="saving" @click="saveAllSettings">
        保存配置
      </ElButton>
    </FaFixedActionBar>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
