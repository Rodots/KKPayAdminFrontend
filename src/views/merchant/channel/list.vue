<script setup lang="ts">
import { ElCheckbox, ElInputNumber, ElSwitch } from 'element-plus'
import { toast } from 'vue-sonner'
import api from '@/api/modules/merchant'
import { useFaModal } from '@/ui/components/FaModal'
import '@/assets/styles/list.css'

defineOptions({ name: 'MerchantChannel' })

const route = useRoute()
const router = useRouter()

const merchantId = computed(() => route.params.merchantId as string)
const merchantNumber = ref('')
const loading = ref(false)
const saving = ref(false)
const channels = ref<any[]>([])

// 记录修改状态
const hasChanges = ref(false)

// 展开行
const expandedRows = ref<any[]>([])

onMounted(() => getDataList())

function getDataList() {
  loading.value = true
  api.channelWhitelistDetail(merchantId.value).then((res: any) => {
    merchantNumber.value = res.data.merchant_number || ''
    channels.value = (res.data.channels || []).map((ch: any) => ({
      ...ch,
      // 确保 accounts 有响应式数据
      accounts: (ch.accounts || []).map((acc: any) => ({
        ...acc,
        // 使用后端返回的 is_configured 字段判断是否选中
        is_selected: !!acc.is_configured,
      })),
    }))
    hasChanges.value = false
    expandedRows.value = []
  }).catch(() => {
    channels.value = []
  }).finally(() => {
    loading.value = false
  })
}

// 切换通道配置状态（接收新值，不再自己切换）
function onChannelConfigChange(channel: any, newValue: boolean) {
  if (!newValue) {
    // 取消配置时重置
    channel.custom_rate = null
    channel.use_all_accounts = true
    channel.accounts.forEach((acc: any) => {
      acc.custom_rate = null
      acc.is_selected = false
    })
    // 收起展开行
    const idx = expandedRows.value.findIndex(r => r.id === channel.id)
    if (idx !== -1) {
      expandedRows.value.splice(idx, 1)
    }
  }
  hasChanges.value = true
}

// 切换展开行
function toggleExpand(row: any) {
  const idx = expandedRows.value.findIndex(r => r.id === row.id)
  if (idx !== -1) {
    expandedRows.value.splice(idx, 1)
  }
  else {
    expandedRows.value.push(row)
  }
}

// 处理展开行变化
function handleExpandChange(_row: any, expandedRowsList: any[]) {
  expandedRows.value = expandedRowsList
}

// 更新通道自定义费率
function updateChannelRate(channel: any, val: number | null | undefined) {
  channel.custom_rate = val !== null && val !== undefined ? String(val) : null
  hasChanges.value = true
}

// 切换使用全部子账户
function toggleUseAllAccounts(channel: any, val: boolean) {
  channel.use_all_accounts = val
  if (val) {
    channel.accounts.forEach((acc: any) => {
      acc.is_selected = false
      acc.custom_rate = null
    })
  }
  hasChanges.value = true
}

// 切换子账户选中状态
function toggleAccountSelected(acc: any, checked: boolean) {
  acc.is_selected = checked
  if (!checked) {
    acc.custom_rate = null
  }
  hasChanges.value = true
}

// 更新子账户自定义费率
function updateAccountRate(acc: any, val: number | null | undefined) {
  acc.custom_rate = val !== null && val !== undefined ? String(val) : null
  hasChanges.value = true
}

// 保存配置
function onSave() {
  const configuredChannels = channels.value.filter((ch: any) => ch.is_configured)

  // 验证：不使用全部子账户时必须至少选择一个
  const invalidChannel = configuredChannels.find((ch: any) =>
    !ch.use_all_accounts && !ch.accounts?.some((acc: any) => acc.is_selected),
  )
  if (invalidChannel) {
    toast.error(`通道"${invalidChannel.name}"未使用全部子账户，请至少选择一个子账户`)
    return
  }

  const payload = {
    id: merchantId.value,
    channels: configuredChannels.map((ch: any) => ({
      channel_id: ch.id,
      rate: ch.custom_rate ? Number.parseFloat(ch.custom_rate) : null,
      use_all_accounts: ch.use_all_accounts,
      accounts: ch.use_all_accounts
        ? []
        : ch.accounts
            .filter((acc: any) => acc.is_selected)
            .map((acc: any) => ({
              account_id: acc.id,
              rate: acc.custom_rate ? Number.parseFloat(acc.custom_rate) : null,
            })),
    })),
  }

  saving.value = true
  api.channelWhitelistSave(payload).then(() => {
    toast.success('保存成功')
    hasChanges.value = false
    getDataList()
  }).finally(() => {
    saving.value = false
  })
}

// 清空配置
function onClearAll() {
  const configuredCount = channels.value.filter((ch: any) => ch.is_configured).length
  if (configuredCount === 0) {
    toast.warning('当前没有配置任何通道')
    return
  }
  useFaModal().confirm({
    title: '确认清空',
    content: `确认清空该商户的所有通道配置吗？此操作不可恢复！`,
    onConfirm: () => api.channelWhitelistClear({ id: merchantId.value }).then(() => {
      toast.success('清空成功')
      getDataList()
    }),
  })
}

const onCancel = () => router.push({ name: 'MerchantManager' })

// 已配置通道数
const configuredCount = computed(() => channels.value.filter((ch: any) => ch.is_configured).length)
</script>

<template>
  <div class="absolute-container">
    <FaPageHeader :title="`商户通道管理 - ${merchantNumber}`" class="mb-0">
      <ElSpace>
        <FaButton variant="outline" size="sm" class="rounded-full" @click="onCancel">
          <FaIcon name="i-ep:arrow-left" />
          返回
        </FaButton>
      </ElSpace>
    </FaPageHeader>
    <FaPageMain class="flex-1 overflow-auto" main-class="flex-1 flex flex-col overflow-auto">
      <div class="mb-4 flex items-center justify-between">
        <ElSpace wrap>
          <ElButton type="primary" size="default" :loading="saving" :disabled="!hasChanges" @click="onSave">
            <template #icon>
              <FaIcon name="i-ep:check" />
            </template>
            保存配置
          </ElButton>
          <ElButton type="danger" size="default" plain @click="onClearAll">
            <template #icon>
              <FaIcon name="i-ep:delete" />
            </template>
            清空所有
          </ElButton>
        </ElSpace>
        <span class="text-sm text-gray-500">已配置 {{ configuredCount }} 个通道</span>
      </div>
      <ElTable v-loading="loading" class="my-4" :data="channels" stripe highlight-current-row border height="100%" row-key="id" :expand-row-keys="expandedRows.map((r: any) => r.id)" @expand-change="handleExpandChange">
        <!-- 展开行 -->
        <ElTableColumn type="expand">
          <template #default="{ row }">
            <div v-if="row.is_configured" class="bg-gray-50/80 px-6 py-3 dark:bg-gray-800/30">
              <!-- 配置项横向排列 -->
              <div class="flex flex-wrap items-center gap-x-8 gap-y-2">
                <!-- 自定义费率 -->
                <div class="flex items-center gap-2">
                  <span class="text-sm text-gray-600 dark:text-gray-400">自定义费率：</span>
                  <ElInputNumber
                    :model-value="row.custom_rate ? Number.parseFloat(row.custom_rate) : null"
                    :min="0" :max="100" :step="0.01" :precision="2"
                    placeholder="默认" size="small" class="w-24" :controls="false"
                    @update:model-value="(val: number | null | undefined) => updateChannelRate(row, val)"
                  />
                  <span class="text-xs text-gray-400">%（默认 {{ row.rate }}%）</span>
                </div>
                <!-- 使用全部子账户 -->
                <div class="flex items-center gap-2">
                  <span class="text-sm text-gray-600 dark:text-gray-400">全部子账户：</span>
                  <ElSwitch :model-value="row.use_all_accounts" size="small" @update:model-value="(val) => toggleUseAllAccounts(row, !!val)" />
                </div>
              </div>
              <!-- 子账户列表 -->
              <div v-if="!row.use_all_accounts && row.accounts?.length" class="mt-3 overflow-hidden border border-gray-200 rounded dark:border-gray-700">
                <div class="flex flex-wrap gap-0">
                  <div
                    v-for="acc in row.accounts" :key="acc.id"
                    class="flex items-center gap-2 border-b border-r border-gray-200 px-3 py-2 dark:border-gray-700"
                    :class="{ 'bg-blue-50/50 dark:bg-blue-900/20': acc.is_selected }"
                  >
                    <ElCheckbox :model-value="acc.is_selected" size="small" @update:model-value="(val) => toggleAccountSelected(acc, !!val)">
                      <span class="text-sm">{{ acc.name }}</span>
                    </ElCheckbox>
                    <template v-if="acc.is_selected">
                      <ElInputNumber
                        :model-value="acc.custom_rate ? Number.parseFloat(acc.custom_rate) : null"
                        :min="0" :max="100" :step="0.01" :precision="2"
                        placeholder="默认" size="small" class="w-20" :controls="false"
                        @update:model-value="(val: number | null | undefined) => updateAccountRate(acc, val)"
                      />
                      <span class="text-xs text-gray-400">%</span>
                    </template>
                    <span v-else class="text-xs text-gray-400">{{ acc.rate }}%</span>
                  </div>
                </div>
              </div>
              <div v-else-if="!row.use_all_accounts" class="mt-2 text-xs text-gray-400">
                暂无子账户
              </div>
            </div>
            <div v-else class="px-6 py-2 text-sm text-gray-400">
              请先启用该通道
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="启用" width="70" align="center">
          <template #default="{ row }">
            <ElSwitch v-model="row.is_configured" @change="(val) => onChannelConfigChange(row, !!val)" />
          </template>
        </ElTableColumn>
        <ElTableColumn prop="code" label="通道编码" width="160" />
        <ElTableColumn prop="name" label="通道名称" min-width="150" show-overflow-tooltip />
        <ElTableColumn prop="payment_type" label="支付方式" width="120" />
        <ElTableColumn label="默认费率" width="100">
          <template #default="{ row }">
            {{ row.rate }}%
          </template>
        </ElTableColumn>
        <ElTableColumn label="自定义费率" width="120">
          <template #default="{ row }">
            <template v-if="row.is_configured">
              <span v-if="row.custom_rate" class="text-primary">{{ row.custom_rate }}%</span>
              <span v-else class="text-gray-400">使用默认</span>
            </template>
            <span v-else class="text-gray-300">-</span>
          </template>
        </ElTableColumn>
        <ElTableColumn label="子账户配置" width="150">
          <template #default="{ row }">
            <template v-if="row.is_configured">
              <ElTag v-if="row.use_all_accounts" type="success" size="small">
                全部子账户
              </ElTag>
              <ElTag v-else type="info" size="small">
                {{ row.accounts?.filter((a: any) => a.is_selected || a.custom_rate).length || 0 }} 个子账户
              </ElTag>
            </template>
            <span v-else class="text-gray-300">-</span>
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="100" align="center">
          <template #default="{ row }">
            <ElButton v-if="row.is_configured" type="primary" size="small" link @click="toggleExpand(row)">
              {{ expandedRows.some((r: any) => r.id === row.id) ? '收起' : '配置' }}
            </ElButton>
            <span v-else class="text-gray-300">-</span>
          </template>
        </ElTableColumn>
      </ElTable>
    </FaPageMain>
  </div>
</template>
