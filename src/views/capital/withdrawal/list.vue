<script setup lang="ts">
import { ElInput } from 'element-plus'
import { toast } from 'vue-sonner'
import api from '@/api/modules/capital'
import { useFaModal } from '@/ui/components/FaModal'
import { dateTimeShortcuts } from '@/utils/dateTimeShortcuts'
import '@/assets/styles/list.css'

defineOptions({ name: 'CapitalWithdrawal' })

const { pagination, getParams, onSizeChange, onCurrentChange, onSortChange } = usePagination()

const tableAutoHeight = ref(true)
const loading = ref(false)
const dataList = ref<any[]>([])

const statusOptions = [
  { value: '', label: '全部' },
  { value: 'PENDING', label: '待处理' },
  { value: 'PROCESSING', label: '处理中' },
  { value: 'COMPLETED', label: '已完成' },
  { value: 'FAILED', label: '失败' },
  { value: 'REJECTED', label: '驳回' },
  { value: 'CANCELED', label: '已取消' },
]

const statusColorMap: Record<string, string> = {
  PENDING: 'warning',
  PROCESSING: '',
  COMPLETED: 'success',
  FAILED: 'danger',
  REJECTED: 'danger',
  CANCELED: 'info',
}

const searchDefault = {
  merchant_number: '',
  status: '',
  created_at: [] as string[],
}
const search = ref({ ...searchDefault })
const searchReset = () => Object.assign(search.value, searchDefault)

onMounted(() => {
  if (window.history.state?.merchant_number) {
    search.value.merchant_number = window.history.state.merchant_number as string
    window.history.replaceState({}, '', window.location.href)
  }
  getDataList()
})

function getDataList() {
  loading.value = true
  const params = {
    ...getParams(),
    ...(search.value.merchant_number && { merchant_number: search.value.merchant_number }),
    ...(search.value.status && { status: search.value.status }),
    ...(search.value.created_at?.length && { created_at: search.value.created_at }),
  }
  api.withdrawalList(params).then((res: any) => {
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

function formatPayeeInfo(row: any) {
  const info = row.payee_info
  if (!info?.type || !info?.data) {
    return JSON.stringify(info)
  }
  const typeLabel = info.type.name
  const dataEntries = Object.values(info.data) as { name: string, val: string }[]
  const details = dataEntries.map(item => `${item.name}: ${item.val}`).join(' | ')
  return `[${typeLabel}] ${details}`
}

function onChangeStatus(row: any, status: string) {
  const needReason = ['REJECTED', 'FAILED'].includes(status)
  const statusText = statusOptions.find(opt => opt.value === status)?.label || status

  if (needReason) {
    const reason = ref('')
    useFaModal().confirm({
      title: `${statusText}原因`,
      content: () => h('div', [
        h('p', { class: 'mb-2' }, `请输入${statusText}原因：`),
        h(ElInput, {
          'modelValue': reason.value,
          'onUpdate:modelValue': (val: string) => {
            reason.value = val
          },
          'type': 'textarea',
          'rows': 3,
          'placeholder': `请输入${statusText}原因，可留空`,
        }),
      ]),
      confirmButtonText: '确认',
      onConfirm: () => {
        return api.changeWithdrawalStatus({
          id: row.id,
          status: status as any,
          reason: reason.value,
        }).then(() => {
          toast.success('操作成功')
          getDataList()
        })
      },
    })
  }
  else {
    useFaModal().confirm({
      title: '确认操作',
      content: `确认将此提款记录状态变更为「${statusText}」吗？`,
      onConfirm: () => api.changeWithdrawalStatus({
        id: row.id,
        status: status as any,
      }).then(() => {
        toast.success('操作成功')
        getDataList()
      }),
    })
  }
}
</script>

<template>
  <div :class="{ 'absolute-container': tableAutoHeight }">
    <FaPageMain :class="{ 'flex-1 overflow-auto': tableAutoHeight }" :main-class="{ 'flex-1 flex flex-col overflow-auto': tableAutoHeight }">
      <FaSearchBar :show-toggle="false">
        <template #default>
          <ElForm :model="search" size="default" label-width="100px" inline-message inline class="search-form">
            <ElFormItem label="商户编号">
              <ElInput v-model="search.merchant_number" placeholder="请输入商户编号" clearable maxlength="24" @keydown.enter="currentChange()" @clear="currentChange()" />
            </ElFormItem>
            <ElFormItem label="状态">
              <ElSelect v-model="search.status" placeholder="请选择状态" clearable @change="currentChange()">
                <ElOption v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
              </ElSelect>
            </ElFormItem>
            <ElFormItem label="申请时间">
              <ElDatePicker v-model="search.created_at" type="datetimerange" start-placeholder="开始时间" end-placeholder="结束时间" value-format="YYYY-MM-DD HH:mm:ss.000Z" format="YYYY-MM-DD HH:mm:ss" date-format="YYYY-MM-DD" time-format="HH:mm:ss" :shortcuts="dateTimeShortcuts" @change="currentChange()" />
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
            </ElFormItem>
          </ElForm>
        </template>
      </FaSearchBar>
      <ElDivider border-style="dashed" />
      <ElTable v-loading="loading" class="my-4" :data="dataList" stripe highlight-current-row border height="100%" @sort-change="sortChange">
        <ElTableColumn prop="id" label="提款流水号" width="185" sortable />
        <ElTableColumn prop="merchant.merchant_number" label="商户编号" width="200">
          <template #default="{ row }">
            <ElTooltip :content="row.merchant?.remark" placement="top" :disabled="!row.merchant?.remark">
              <span>{{ row.merchant?.merchant_number }}</span>
            </ElTooltip>
          </template>
        </ElTableColumn>
        <ElTableColumn label="提款金额" width="120" sortable>
          <template #default="{ row }">
            <span class="text-primary font-bold">￥{{ row.amount }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="prepaid_deducted" label="预付金抵扣" width="120">
          <template #default="{ row }">
            <span class="text-red-600 font-bold">￥{{ row.prepaid_deducted }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="received_amount" label="实际到账" width="120">
          <template #default="{ row }">
            <span class="text-green-600 font-bold">￥{{ row.received_amount }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="fee" label="手续费" width="150">
          <template #default="{ row }">
            <span>{{ row.fee_type_text }}</span>
            <br>
            <span class="text-gray-500 font-bold">￥{{ row.fee }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="status" label="状态" width="100" sortable>
          <template #default="{ row }">
            <ElTag :type="statusColorMap[row.status] as any" size="small">
              {{ row.status_text }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="收款信息" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            {{ formatPayeeInfo(row) }}
          </template>
        </ElTableColumn>
        <ElTableColumn v-if="dataList.some(r => r.reject_reason)" prop="reject_reason" label="驳回/失败原因" min-width="50" show-overflow-tooltip />
        <ElTableColumn prop="created_at" label="创建时间" width="165" />
        <ElTableColumn label="操作" width="220" align="center" fixed="right">
          <template #default="{ row }">
            <ElSpace v-if="row.status === 'PENDING'">
              <ElButton type="success" size="small" plain @click="onChangeStatus(row, 'PROCESSING')">
                通过
              </ElButton>
              <ElButton type="danger" size="small" plain @click="onChangeStatus(row, 'REJECTED')">
                驳回
              </ElButton>
            </ElSpace>
            <ElSpace v-else-if="row.status === 'PROCESSING'">
              <ElButton type="success" size="small" plain @click="onChangeStatus(row, 'COMPLETED')">
                完成
              </ElButton>
              <ElButton type="danger" size="small" plain @click="onChangeStatus(row, 'FAILED')">
                失败
              </ElButton>
              <ElButton type="info" size="small" plain @click="onChangeStatus(row, 'CANCELED')">
                取消
              </ElButton>
            </ElSpace>
            <ElSpace v-else>
              /
            </ElSpace>
          </template>
        </ElTableColumn>
      </ElTable>
      <ElPagination :current-page="pagination.page" :total="pagination.total" :page-size="pagination.size" :page-sizes="pagination.sizes" :layout="pagination.layout" :hide-on-single-page="false" class="pagination" background @current-change="currentChange" @size-change="sizeChange" />
    </FaPageMain>
  </div>
</template>
