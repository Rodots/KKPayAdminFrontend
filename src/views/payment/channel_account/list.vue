<script setup lang="ts">
import { ElInputNumber } from 'element-plus'
import { toast } from 'vue-sonner'
import api from '@/api/modules/payment'
import { useFaModal } from '@/ui/components/FaModal'
import eventBus from '@/utils/eventBus'
import '@/assets/styles/list.css'

defineOptions({ name: 'PaymentChannelAccountList' })

const route = useRoute()
const router = useRouter()
const { pagination, getParams, onSizeChange, onCurrentChange, onSortChange } = usePagination()

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
  eventBus.on('get-data-list', getDataList)
})

onBeforeUnmount(() => {
  eventBus.off('get-data-list')
})

function getDataList() {
  loading.value = true
  const params = {
    ...getParams(),
    channel_id: route.params.channelId ? Number(route.params.channelId) : 0,
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
  router.push({ name: 'PaymentChannelAccountCreate', params: { channelId: route.params.channelId } })
}

function onEdit(row: any) {
  router.push({ name: 'PaymentChannelAccountEdit', params: { channelId: route.params.channelId, id: row.id } })
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
        <ElTableColumn prop="id" label="子账户ID" width="120" sortable />
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
        <ElTableColumn prop="updated_at" label="更新时间" width="165" />
        <ElTableColumn label="操作" width="200" align="center">
          <template #default="{ row }">
            <ElSpace>
              <ElButton type="primary" size="small" plain @click="onEdit(row)">
                编辑
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
