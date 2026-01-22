<script setup lang="ts">
import api from '@/api/modules/capital'
import { dateTimeShortcuts } from '@/utils/dateTimeShortcuts'
import '@/assets/styles/list.css'

defineOptions({ name: 'CapitalWalletRecord' })

const { pagination, getParams, onSizeChange, onCurrentChange, onSortChange } = usePagination()

const tableAutoHeight = ref(true)
const loading = ref(false)
const dataList = ref<any[]>([])

const searchDefault = {
  merchant_number: '',
  type: '',
  remark: '',
  trade_no: '',
  created_at: [] as string[],
}
const search = ref({ ...searchDefault })
const searchReset = () => Object.assign(search.value, searchDefault)

onMounted(() => {
  if (window.history.state) {
    search.value.merchant_number = window.history.state.merchant_number as string || ''
    search.value.trade_no = window.history.state.trade_no as string || ''
    window.history.replaceState({}, '', window.location.href)
  }
  getDataList()
})

function getDataList() {
  loading.value = true
  const params = {
    ...getParams(),
    ...(search.value.merchant_number && { merchant_number: search.value.merchant_number }),
    ...(search.value.type && { type: search.value.type }),
    ...(search.value.remark && { remark: search.value.remark }),
    ...(search.value.trade_no && { trade_no: search.value.trade_no }),
    ...(search.value.created_at?.length && { created_at: search.value.created_at }),
  }
  api.walletRecord(params).then((res: any) => {
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

/** 格式化金额显示 */
function formatAmount(amount: number) {
  return amount > 0 ? `+${amount}` : String(amount)
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
            <ElFormItem label="操作类型">
              <ElInput v-model="search.type" placeholder="请输入操作类型" clearable maxlength="32" @keydown.enter="currentChange()" @clear="currentChange()" />
            </ElFormItem>
            <ElFormItem label="备注">
              <ElInput v-model="search.remark" placeholder="请输入备注，支持模糊查询" clearable maxlength="255" @keydown.enter="currentChange()" @clear="currentChange()" />
            </ElFormItem>
            <ElFormItem label="关联订单号">
              <ElInput v-model="search.trade_no" placeholder="请输入关联订单号" clearable maxlength="24" @keydown.enter="currentChange()" @clear="currentChange()" />
            </ElFormItem>
            <ElFormItem label="操作时间">
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
        <ElTableColumn prop="id" label="序号" width="80" sortable>
          <template #default="{ $index }">
            {{ $index + 1 }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="merchant.merchant_number" label="商户编号" width="200" />
        <ElTableColumn prop="type" label="操作类型" sortable />
        <ElTableColumn prop="old_available_balance" label="变更前可用金额">
          <template #default="{ row }">
            <ElTag type="primary">
              {{ row.old_available_balance }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="available_amount" label="变更金额">
          <template #default="{ row }">
            <ElTag :type="row.available_amount >= 0 ? 'success' : 'danger'">
              {{ formatAmount(row.available_amount) }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="new_available_balance" label="变更后可用金额">
          <template #default="{ row }">
            <ElTag type="primary">
              {{ row.new_available_balance }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="old_unavailable_balance" label="变更前不可用余额">
          <template #default="{ row }">
            <ElTag type="info">
              {{ row.old_unavailable_balance }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="unavailable_amount" label="变更金额">
          <template #default="{ row }">
            <ElTag :type="row.unavailable_amount >= 0 ? 'success' : 'danger'">
              {{ formatAmount(row.unavailable_amount) }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="new_unavailable_balance" label="变更后不可用余额">
          <template #default="{ row }">
            <ElTag type="info">
              {{ row.new_unavailable_balance }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="remark" label="备注" show-overflow-tooltip />
        <ElTableColumn prop="trade_no" label="关联平台订单号" width="240" sortable />
        <ElTableColumn prop="created_at" label="操作时间" width="165" />
      </ElTable>
      <ElPagination :current-page="pagination.page" :total="pagination.total" :page-size="pagination.size" :page-sizes="pagination.sizes" :layout="pagination.layout" :hide-on-single-page="false" class="pagination" background @current-change="currentChange" @size-change="sizeChange" />
    </FaPageMain>
  </div>
</template>
