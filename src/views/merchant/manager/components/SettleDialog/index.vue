<script setup lang="ts">
import api from '@/api/modules/merchant'

interface PayeeInfo {
  type: { name: string }
  data: Record<string, { name: string, val: string }>
}

interface Payee {
  id: number
  is_default: boolean
  payee_info: PayeeInfo
}

const props = defineProps<{
  id: number | string
  merchantNumber: string
}>()

const emit = defineEmits<{
  success: [message: string]
  error: [message: string]
}>()

const loading = ref(false)
const payeeList = ref<Payee[]>([])
const selectedPayeeId = ref<number | null>(null)

/** 获取收款人展示标签 */
function getPayeeLabel(payee: Payee): string {
  const info = payee.payee_info
  if (!info?.type || !info?.data) {
    return '未知收款人'
  }
  const typeName = info.type.name
  const entries = Object.values(info.data) as { name: string, val: string }[]
  // 限制输出 27 个字符，多余用 ... 表示
  const details = entries.map(item => `${item.name}: ${item.val}`).join(' | ').slice(0, 27)
  return `[${typeName}] ${details}${entries.length > 3 ? '...' : ''}`
}

/** 解析收款信息为多行文本 */
function formatPayeeInfo(payeeInfo: PayeeInfo | undefined): string {
  if (!payeeInfo?.data) {
    return '-'
  }
  const entries = Object.values(payeeInfo.data) as { name: string, val: string }[]
  return entries.map(item => `${item.name}: ${item.val}`).join('\n')
}

/** 选中收款人的详细信息 */
const selectedPayeeInfo = computed(() => {
  const payee = payeeList.value.find(p => p.id === selectedPayeeId.value)
  return formatPayeeInfo(payee?.payee_info)
})

/** 获取收款人列表 */
async function fetchPayeeList() {
  loading.value = true
  try {
    const res = await api.payeeListByMerchant({ merchant_id: props.id }) as any
    payeeList.value = res.data?.list || []

    if (payeeList.value.length === 0) {
      emit('error', '该商户没有收款信息，请先添加')
      return
    }

    // 默认选中默认收款人，若无则选第一个
    const defaultPayee = payeeList.value.find(p => p.is_default)
    selectedPayeeId.value = defaultPayee?.id ?? payeeList.value[0]?.id ?? null
  }
  catch {
    payeeList.value = []
    emit('error', '获取收款人列表失败')
  }
  finally {
    loading.value = false
  }
}

/** 提交清账请求 */
async function submit() {
  if (!selectedPayeeId.value) {
    emit('error', '请选择收款人')
    return
  }
  loading.value = true
  try {
    const res = await api.settleAccount({
      id: props.id,
      payee_id: selectedPayeeId.value,
    }) as any
    const message = res.message || '清账成功'
    emit('success', message)
  }
  catch {
    emit('error', '清账失败')
  }
  finally {
    loading.value = false
  }
}

onMounted(fetchPayeeList)

defineExpose({ submit })
</script>

<template>
  <div v-loading="loading" class="space-y-4">
    <p class="text-gray-700">
      商户：<span class="text-gray-900 font-medium">{{ merchantNumber }}</span>
    </p>

    <!-- 清账说明 -->
    <div class="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
      <p class="mb-1 font-medium">
        清账说明：
      </p>
      <ul class="ml-4 list-disc space-y-0.5">
        <li>若可用余额 ≤ 预付金：仅抵扣，不产生提款记录</li>
        <li>若可用余额 > 预付金：创建提款记录，清零余额和预付金</li>
      </ul>
    </div>

    <!-- 收款人选择 -->
    <div>
      <label class="mb-2 block text-gray-700 font-medium">选择收款人：</label>
      <ElSelect v-model="selectedPayeeId" :disabled="payeeList.length === 0" class="w-full">
        <ElOption v-for="payee in payeeList" :key="payee.id" :value="payee.id" :label="getPayeeLabel(payee)" />
      </ElSelect>
    </div>

    <!-- 收款信息预览 -->
    <div v-if="selectedPayeeId" class="mt-3">
      <label class="mb-2 block text-gray-700 font-medium">收款信息预览：</label>
      <pre class="whitespace-pre-wrap rounded-lg bg-gray-100 p-3 text-sm">{{ selectedPayeeInfo }}</pre>
    </div>
  </div>
</template>
