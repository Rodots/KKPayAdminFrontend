<script setup lang="ts">
import api from '@/api/modules/admin'
import { dateTimeShortcuts } from '@/utils/dateTimeShortcuts'
import '@/assets/styles/list.css'

const { pagination, getParams, onSizeChange, onCurrentChange, onSortChange } = usePagination(35)

const tableAutoHeight = ref(true)
const loading = ref(false)
const dataList = ref<any[]>([])

const searchDefault = {
  account: '',
  content: '',
  ip: '',
  created_at: [] as string[],
}
const search = ref({ ...searchDefault })
const searchReset = () => Object.assign(search.value, searchDefault)

onMounted(getDataList)

function getDataList() {
  loading.value = true
  const params = {
    ...getParams(),
    ...(search.value.account && { account: search.value.account }),
    ...(search.value.content && { content: search.value.content }),
    ...(search.value.ip && { ip: search.value.ip }),
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
const sortChange = ({ prop, order }: { prop: string, order: string }) => onSortChange(prop, order).then(getDataList)
</script>

<template>
  <div :class="{ 'absolute-container': tableAutoHeight }">
    <FaPageMain :class="{ 'flex-1 overflow-auto': tableAutoHeight }" :main-class="{ 'flex-1 flex flex-col overflow-auto': tableAutoHeight }">
      <FaSearchBar :show-toggle="false">
        <template #default>
          <ElForm :model="search" size="default" label-width="100px" inline-message inline class="search-form">
            <ElFormItem label="管理员账号">
              <ElInput v-model="search.account" placeholder="请输入管理员账号" clearable maxlength="32" @keydown.enter="currentChange()" @clear="currentChange()" />
            </ElFormItem>
            <ElFormItem label="操作内容">
              <ElInput v-model="search.content" placeholder="请输入操作内容，支持模糊查询" clearable maxlength="32" @keydown.enter="currentChange()" @clear="currentChange()" />
            </ElFormItem>
            <ElFormItem label="操作IP">
              <ElInput v-model="search.ip" placeholder="请输入操作IP" clearable maxlength="45" @keydown.enter="currentChange()" @clear="currentChange()" />
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
        <ElTableColumn prop="id" label="编号" width="100" sortable />
        <ElTableColumn prop="admin_id" label="管理员账号" width="150" sortable show-overflow-tooltip>
          <template #default="{ row }">
            [{{ row.admin_id }}] {{ row.admin.account }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="content" label="操作内容" show-overflow-tooltip />
        <ElTableColumn prop="ip" label="操作IP" sortable />
        <ElTableColumn prop="user_agent" label="操作设备" show-overflow-tooltip />
        <ElTableColumn prop="created_at" label="操作时间" width="165" />
      </ElTable>
      <ElPagination :current-page="pagination.page" :total="pagination.total" :page-size="pagination.size" :page-sizes="pagination.sizes" :layout="pagination.layout" :hide-on-single-page="false" class="pagination" background @current-change="currentChange" @size-change="sizeChange" />
    </FaPageMain>
  </div>
</template>
