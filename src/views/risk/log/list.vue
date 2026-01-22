<script setup lang="ts">
import api from '@/api/modules/risk'
import { dateTimeShortcuts } from '@/utils/dateTimeShortcuts'
import '@/assets/styles/list.css'

const { pagination, getParams, onSizeChange, onCurrentChange } = usePagination()

const tableAutoHeight = ref(true)
const loading = ref(false)
const dataList = ref<any[]>([])

const searchDefault = {
  merchant_number: '',
  type: '',
  content: '',
  created_at: [] as string[],
}
const search = ref({ ...searchDefault })
const searchReset = () => Object.assign(search.value, searchDefault)

onMounted(getDataList)

function getDataList() {
  loading.value = true
  const params = {
    ...getParams(),
    ...(search.value.merchant_number && { merchant_number: search.value.merchant_number }),
    ...(search.value.type && { type: search.value.type }),
    ...(search.value.content && { content: search.value.content }),
    ...(search.value.created_at?.length && { created_at: search.value.created_at }),
  }
  api.logList(params).then((res: any) => {
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
            <ElFormItem label="风控类型">
              <ElSelect v-model="search.type" placeholder="请选择类型" @change="currentChange()">
                <ElOption label="全部" value="" />
                <ElOption label="命中黑名单" value="0" />
                <ElOption label="禁售商品" value="1" />
                <ElOption label="成功率过低" value="2" />
              </ElSelect>
            </ElFormItem>
            <ElFormItem label="风控内容">
              <ElInput v-model="search.content" placeholder="请输入风控内容，支持模糊查询" clearable maxlength="32" @keydown.enter="currentChange()" @clear="currentChange()" />
            </ElFormItem>
            <ElFormItem label="触发时间">
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
      <ElTable v-loading="loading" class="my-4" :data="dataList" stripe highlight-current-row border height="100%">
        <ElTableColumn prop="id" label="编号" width="100" />
        <ElTableColumn prop="merchant.merchant_number" label="商户编号" width="200" />
        <ElTableColumn prop="type_text" label="风控类型" width="100" />
        <ElTableColumn prop="created_at" label="触发时间" width="165" />
        <ElTableColumn prop="content" label="风控内容" show-overflow-tooltip />
      </ElTable>
      <ElPagination :current-page="pagination.page" :total="pagination.total" :page-size="pagination.size" :page-sizes="pagination.sizes" :layout="pagination.layout" :hide-on-single-page="false" class="pagination" background @current-change="currentChange" @size-change="sizeChange" />
    </FaPageMain>
  </div>
</template>
