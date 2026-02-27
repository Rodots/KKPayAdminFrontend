<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import { ElForm, ElFormItem, ElInput, ElInputNumber } from 'element-plus'
import { toast } from 'vue-sonner'
import api from '@/api/modules/payment'
import { useFaModal } from '@/ui/components/FaModal'
import '@/assets/styles/list.css'

defineOptions({ name: 'PaymentChannelAccountList' })

const route = useRoute()
const router = useRouter()
const { pagination, getParams, onSizeChange, onCurrentChange, onSortChange } = usePagination()
const { copy, copied, text } = useClipboard()
const channelId = computed(() => route.params.channelId as string ?? '')
const tableAutoHeight = ref(true)
const loading = ref(false)
const dataList = ref<any[]>([])

const searchDefault = {
  name: '',
  inherit_config: '',
  status: '',
  maintenance: '',
  remark: '',
}
const search = ref({ ...searchDefault })
const searchReset = () => Object.assign(search.value, searchDefault)

const batch = ref({
  enable: true,
  selectionDataList: [] as any[],
})

onMounted(() => {
  getDataList()
})

function getDataList() {
  if (!channelId.value) {
    return router.close({ name: 'PaymentChannel' })
  }
  loading.value = true
  const params = {
    ...getParams(),
    channel_id: channelId.value ? Number(channelId.value) : 0,
    ...(search.value.name && { name: search.value.name }),
    ...(search.value.inherit_config !== '' && { inherit_config: search.value.inherit_config }),
    ...(search.value.status !== '' && { status: search.value.status }),
    ...(search.value.maintenance !== '' && { maintenance: search.value.maintenance }),
    ...(search.value.remark && { remark: search.value.remark }),
  }
  api.channelAccountList(params).then((res: any) => {
    dataList.value = res.data.list
    pagination.value.total = res.data.total
  }).catch(() => {
    dataList.value = []
    pagination.value.total = 0
  }).finally(() => {
    loading.value = false
  })
}

const sizeChange = (size: number) => onSizeChange(size).then(getDataList)
const currentChange = (page = 1) => onCurrentChange(page).then(getDataList)
const sortChange = ({ prop, order }: { prop: string, order: string }) => onSortChange(prop, order).then(getDataList)

function onCreate() {
  router.push({ name: 'PaymentChannelAccountCreate', params: { channelId: channelId.value } })
}

function onEdit(row: any) {
  router.push({ name: 'PaymentChannelAccountEdit', params: { channelId: channelId.value, id: row.id } })
}

function onChangeStatus(row: any, field = 'status') {
  const currentStatus = row[field]
  const actionText = !currentStatus ? '启用' : '禁用'
  return new Promise<boolean>((resolve) => {
    useFaModal().confirm({
      title: '确认信息',
      content: `确认${actionText}吗？`,
      onConfirm: () => {
        row.statusLoading = true
        api.channelAccountChangeStatus({ ids: [row.id], status: !currentStatus, field }).then(() => {
          row.statusLoading = false
          toast.success(`${actionText}成功`)
          resolve(true)
        }).catch(() => {
          row.statusLoading = false
          resolve(false)
        })
      },
    })
  })
}

function onCopy(row: any) {
  const copyQuantity = ref(1)
  useFaModal().confirm({
    title: '复制子账户',
    content: () => h('div', { class: 'space-y-4' }, [
      h('p', `确认复制子账户「${row.name}」吗？`),
      h('div', [
        h('label', '复制数量：'),
        h(ElInputNumber, {
          'modelValue': copyQuantity.value,
          'onUpdate:modelValue': (value: number | undefined) => {
            copyQuantity.value = value || 1
          },
          'min': 1,
          'max': 100,
          'size': 'small',
          'class': 'w-30',
        }),
      ]),
    ]),
    confirmButtonText: '确认复制',
    onConfirm: () => api.channelAccountCopy({ id: row.id, number: copyQuantity.value }).then(() => {
      getDataList()
      toast.success(`复制成功，已创建 ${copyQuantity.value} 个子账户`)
    }),
  })
}

function onDel(row: any) {
  useFaModal().confirm({
    title: '确认信息',
    content: `确认删除该子账户吗？`,
    onConfirm: () => api.channelAccountDelete({ ids: [row.id] }).then(() => {
      getDataList()
      toast.success('删除成功')
    }),
  })
}

function onBatchDelete() {
  const ids = batch.value.selectionDataList.map((item: any) => item.id)
  if (!ids.length) {
    toast.warning('请先选择需要操作的数据')
    return
  }
  useFaModal().confirm({
    title: '确认信息',
    content: `确认删除所选的 ${ids.length} 个子账户吗？此操作不可恢复！`,
    onConfirm: () => api.channelAccountDelete({ ids }).then(() => {
      toast.success('删除成功')
      getDataList()
      batch.value.selectionDataList = []
    }),
  })
}

function handleBatchOperating(command: string) {
  const actions: Record<string, () => void> = {
    enable: () => onBatchChangeStatus(true),
    disable: () => onBatchChangeStatus(false),
    delete: () => onBatchDelete(),
  }
  actions[command]?.()
}

function onBatchChangeStatus(status: boolean) {
  const ids = batch.value.selectionDataList.map((item: any) => item.id)
  if (!ids.length) {
    toast.warning('请先选择需要操作的数据')
    return
  }
  const action = status ? '启用' : '禁用'
  useFaModal().confirm({
    title: '确认信息',
    content: `确认${action}所选的 ${ids.length} 个子账户吗？`,
    onConfirm: () => api.channelAccountChangeStatus({ ids, status }).then(() => {
      toast.success(`${action}成功`)
      getDataList()
      batch.value.selectionDataList = []
    }),
  })
}

function handleMoreOperating(command: string, row: any) {
  const actions: Record<string, () => void> = {
    viewOrder: () => router.push({ name: 'OrderManager', state: { payment_channel_account_id: row.id } }),
    copy: () => onCopy(row),
    delete: () => onDel(row),
  }
  actions[command]?.()
}

function onPaymentTest(row: any) {
  const formData = reactive({ amount: '1.00', subject: '测试商品' })
  useFaModal().confirm({
    title: '发起支付测试',
    content: () => h(ElForm, { labelWidth: '100px', class: 'pt-4' }, () => [
      h(ElFormItem, { label: '子账户名称' }, () => h('span', row.name)),
      h(ElFormItem, { label: '支付金额', required: true }, () => h(ElInput, {
        'modelValue': formData.amount,
        'onUpdate:modelValue': (v: string) => formData.amount = v,
        'placeholder': '请输入支付金额（≥0.01）',
      }, {
        suffix: () => '元',
      })),
      h(ElFormItem, { label: '商品名称', required: true }, () => h(ElInput, {
        'modelValue': formData.subject,
        'onUpdate:modelValue': (v: string) => formData.subject = v,
        'placeholder': '请输入商品名称（≤255字符）',
        'maxlength': 255,
        'showWordLimit': true,
      })),
    ]),
    confirmButtonText: '创建订单',
    onConfirm: () => {
      if (!formData.amount || Number(formData.amount) < 0.01) {
        toast.warning('支付金额不能小于 0.01')
        return Promise.reject(new Error('金额校验失败'))
      }
      if (!formData.subject?.trim()) {
        toast.warning('商品名称不能为空')
        return Promise.reject(new Error('商品名称校验失败'))
      }
      return api.paymentTest({
        id: row.id,
        amount: formData.amount,
        subject: formData.subject.trim(),
      }).then((res: any) => {
        const paymentUrl = res.data?.payment_url
        if (paymentUrl) {
          showPaymentUrlModal(paymentUrl, row.name)
        }
      })
    },
  })
}

function showPaymentUrlModal(url: string, accountName: string) {
  const { open, close } = useFaModal().create({
    closable: false,
    border: false,
    alignCenter: true,
    showCancelButton: true,
    closeOnClickOverlay: false,
    destroyOnClose: true,
    openAutoFocus: true,
    contentClass: 'py-0 min-h-auto',
    footerClass: 'p-4',
    title: '订单创建成功，请指定下一步操作',
    confirmButtonText: '新窗口打开',
    content: () => h('div', { class: 'space-y-3 pt-2' }, [
      // 支付链接展示 + 复制按钮
      h('div', { class: 'flex items-start gap-2 rounded-lg bg-gray-50 dark:bg-gray-800 p-3' }, [
        h('p', { class: 'flex-1 text-sm break-all select-all text-blue-600 dark:text-blue-400' }, url),
        h(resolveComponent('FaButton'), {
          variant: 'outline',
          size: 'icon',
          class: 'shrink-0 h-7 w-7',
          onClick: () => copy(url),
        }, () => h(resolveComponent('FaIcon'), {
          name: copied.value && text.value === url ? 'i-ri:check-line' : 'i-ri:file-copy-2-line',
          class: ['h-4 w-4', copied.value && text.value === url && 'text-green-500'],
        })),
      ]),
      // 其他打开方式
      h('div', { class: 'flex gap-2' }, [
        h(resolveComponent('FaButton'), {
          variant: 'outline',
          size: 'sm',
          class: 'flex-1',
          onClick: () => {
            close()
            router.push({
              name: 'PaymentChannelAccountTest',
              query: { title: `支付测试 - ${accountName}`, iframe: url },
            })
          },
        }, () => [h(resolveComponent('FaIcon'), { name: 'i-ep:monitor' }), ' 内嵌 Iframe 打开']),
        h(resolveComponent('FaButton'), {
          variant: 'outline',
          size: 'sm',
          class: 'flex-1',
          onClick: () => { window.location.href = url },
        }, () => [h(resolveComponent('FaIcon'), { name: 'i-ep:right' }), ' 当前页面打开']),
      ]),
    ]),
    onConfirm: () => { window.open(url, '_blank') },
  })
  open()
}

const onCancel = () => router.close({ name: 'PaymentChannel' })

function formatRate(row: any) {
  const isInherit = row.inherit_config
  const parentRate = row.payment_channel?.rate ?? 0
  const selfRate = row.rate ?? 0
  const rate = isInherit ? parentRate : selfRate
  const label = `${(rate * 100).toFixed(2)}%`
  return isInherit ? `继承 (${label})` : label
}

function formatAmount(row: any, field: string) {
  const isInherit = row.inherit_config
  const parentValue = row.payment_channel?.[field] ?? 0
  const selfValue = row[field] ?? 0
  const displayValue = isInherit ? parentValue : selfValue
  const label = displayValue > 0 ? `￥${displayValue}` : '无限制'
  return isInherit ? `继承 (${label})` : label
}
</script>

<template>
  <div :class="{ 'absolute-container': tableAutoHeight }">
    <FaPageHeader title="支付通道子账户列表" class="mb-0">
      <FaButton variant="outline" size="sm" class="rounded-full" @click="onCancel">
        <FaIcon name="i-ep:arrow-left" />
        返回
      </FaButton>
    </FaPageHeader>
    <FaPageMain :class="{ 'flex-1 overflow-auto': tableAutoHeight }" :main-class="{ 'flex-1 flex flex-col overflow-auto': tableAutoHeight }">
      <FaSearchBar :show-toggle="false">
        <template #default="{ fold, toggle }">
          <ElForm :model="search" size="default" label-width="100px" inline-message inline class="search-form">
            <ElFormItem label="子账户名称">
              <ElInput v-model="search.name" placeholder="请输入子账户名称，支持模糊搜索" clearable @keydown.enter="currentChange()" @clear="currentChange()" />
            </ElFormItem>
            <ElFormItem v-show="!fold" label="备注">
              <ElInput v-model="search.name" placeholder="请输入备注，支持模糊搜索" clearable @keydown.enter="currentChange()" @clear="currentChange()" />
            </ElFormItem>
            <ElFormItem v-show="!fold" label="是否继承配置">
              <ElRadioGroup v-model="search.status" @change="currentChange()">
                <ElRadioButton value="">
                  全部
                </ElRadioButton>
                <ElRadioButton :value="0">
                  继承
                </ElRadioButton>
                <ElRadioButton :value="1">
                  自定义
                </ElRadioButton>
              </ElRadioGroup>
            </ElFormItem>
            <ElFormItem label="状态">
              <ElRadioGroup v-model="search.status" @change="currentChange()">
                <ElRadioButton value="">
                  全部
                </ElRadioButton>
                <ElRadioButton :value="1">
                  启用
                </ElRadioButton>
                <ElRadioButton :value="0">
                  禁用
                </ElRadioButton>
              </ElRadioGroup>
            </ElFormItem>
            <ElFormItem label="维护状态">
              <ElRadioGroup v-model="search.maintenance" @change="currentChange()">
                <ElRadioButton value="">
                  全部
                </ElRadioButton>
                <ElRadioButton :value="1">
                  维护中
                </ElRadioButton>
                <ElRadioButton :value="0">
                  正常
                </ElRadioButton>
              </ElRadioGroup>
            </ElFormItem>
            <ElFormItem>
              <ElButton @click="searchReset(); currentChange()">
                重置
              </ElButton>
              <ElButton type="primary" @click="currentChange()">
                <template #icon>
                  <FaIcon name="i-ep:search" />
                </template>
                筛选
              </ElButton>
              <ElButton link @click="toggle">
                <template #icon>
                  <FaIcon :name="fold ? 'i-ep:caret-bottom' : 'i-ep:caret-top'" />
                </template>
                {{ fold ? '展开' : '收起' }}
              </ElButton>
            </ElFormItem>
          </ElForm>
        </template>
      </FaSearchBar>
      <ElDivider border-style="dashed" />
      <ElSpace wrap>
        <ElButton type="primary" size="default" @click="onCreate">
          <template #icon>
            <FaIcon name="i-ep:plus" />
          </template>
          新增
        </ElButton>
        <ElDropdown v-if="batch.enable" :disabled="!batch.selectionDataList.length" @command="handleBatchOperating">
          <ElButton :disabled="!batch.selectionDataList.length">
            批量操作
            <FaIcon name="i-ep:arrow-down" class="el-icon--right" />
          </ElButton>
          <template #dropdown>
            <ElDropdownMenu>
              <ElDropdownItem command="enable">
                批量启用
              </ElDropdownItem>
              <ElDropdownItem command="disable">
                批量禁用
              </ElDropdownItem>
              <ElDropdownItem command="delete" divided>
                批量删除
              </ElDropdownItem>
            </ElDropdownMenu>
          </template>
        </ElDropdown>
      </ElSpace>
      <ElTable v-loading="loading" class="my-4" :data="dataList" stripe highlight-current-row border height="100%" @sort-change="sortChange" @selection-change="batch.selectionDataList = $event">
        <ElTableColumn v-if="batch.enable" type="selection" align="center" fixed />
        <ElTableColumn prop="id" label="ID" width="80" sortable />
        <ElTableColumn prop="name" label="子账户名称" min-width="100" show-overflow-tooltip />
        <ElTableColumn prop="inherit_config_text" label="继承状态" width="85" align="center">
          <template #default="{ row }">
            <ElTag v-if="row.inherit_config" type="success">
              继承
            </ElTag>
            <ElTag v-else type="info">
              自定义
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="rate" label="抽成费率" width="120" sortable>
          <template #default="{ row }">
            {{ formatRate(row) }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="min_amount" label="单笔最小金额" width="150" sortable>
          <template #default="{ row }">
            {{ formatAmount(row, 'min_amount') }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="max_amount" label="单笔最大金额" width="150" sortable>
          <template #default="{ row }">
            {{ formatAmount(row, 'max_amount') }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="daily_limit" label="单日收款限额" width="150" sortable>
          <template #default="{ row }">
            {{ formatAmount(row, 'daily_limit') }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="status" label="账户状态" width="85" align="center">
          <template #default="{ row }">
            <ElSwitch v-model="row.status" :loading="row.statusLoading" inline-prompt active-text="启用" inactive-text="禁用" :before-change="() => onChangeStatus(row)" />
          </template>
        </ElTableColumn>
        <ElTableColumn prop="maintenance" label="维护状态" width="85" align="center">
          <template #default="{ row }">
            <ElSwitch v-model="row.maintenance" :loading="row.statusLoading" inline-prompt active-text="维护中" inactive-text="正常" :before-change="() => onChangeStatus(row, 'maintenance')" :style="{ '--el-switch-on-color': '#ff4949', '--el-switch-off-color': '#13ce66' }" />
          </template>
        </ElTableColumn>
        <ElTableColumn prop="remark" label="备注" show-overflow-tooltip />
        <ElTableColumn prop="created_at" label="创建时间" width="165" />
        <ElTableColumn label="操作" width="250" align="center">
          <template #default="{ row }">
            <ElSpace>
              <ElButton type="primary" size="small" plain @click="onEdit(row)">
                编辑
              </ElButton>
              <ElButton type="warning" size="small" plain @click="onPaymentTest(row)">
                测试
              </ElButton>
              <ElDropdown @command="handleMoreOperating($event, row)">
                <ElButton size="small">
                  更多操作
                  <FaIcon name="i-ep:arrow-down" class="el-icon--right" />
                </ElButton>
                <template #dropdown>
                  <ElDropdownMenu>
                    <ElDropdownItem command="viewOrder">
                      查看订单
                    </ElDropdownItem>
                    <ElDropdownItem command="copy">
                      复制子账户
                    </ElDropdownItem>
                    <ElDropdownItem command="delete" divided>
                      删除
                    </ElDropdownItem>
                  </ElDropdownMenu>
                </template>
              </ElDropdown>
            </ElSpace>
          </template>
        </ElTableColumn>
      </ElTable>
      <ElPagination :current-page="pagination.page" :total="pagination.total" :page-size="pagination.size" :page-sizes="pagination.sizes" :layout="pagination.layout" :hide-on-single-page="false" class="pagination" background @current-change="currentChange" @size-change="sizeChange" />
    </FaPageMain>
  </div>
</template>
