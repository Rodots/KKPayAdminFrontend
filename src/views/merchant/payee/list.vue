<script setup lang="ts">
import { toast } from 'vue-sonner'
import api from '@/api/modules/merchant'
import { useFaModal } from '@/ui/components/FaModal'
import { dateTimeShortcuts } from '@/utils/dateTimeShortcuts'
import DetailForm from './components/DetailForm.vue'
import '@/assets/styles/list.css'

const { pagination, getParams, onSizeChange, onCurrentChange, onSortChange } = usePagination()

const tableAutoHeight = ref(true)
const loading = ref(false)
const dataList = ref<any[]>([])

const searchDefault = {
  merchant_number: '',
  created_at: [] as string[],
}
const search = ref({ ...searchDefault })
const searchReset = () => Object.assign(search.value, searchDefault)

const formRef = ref<InstanceType<typeof DetailForm>>()
const formModeProps = ref({
  id: '',
  merchantNumber: '',
  mode: 'create' as 'create' | 'edit',
})

const { open: openModal, update: updateModal } = useFaModal().create({
  destroyOnClose: true,
  beforeClose: (action, done) => {
    if (action === 'confirm') {
      formRef.value?.submit().then(() => {
        done()
        getDataList()
      })
    }
    else {
      done()
    }
  },
  content: () => h(DetailForm, {
    ref: formRef,
    id: formModeProps.value.id,
    merchantNumber: formModeProps.value.merchantNumber,
    mode: formModeProps.value.mode,
    onSuccess: getDataList,
  }),
})

function getDataList() {
  loading.value = true
  const params = {
    ...getParams(),
    ...(search.value.merchant_number && { merchant_number: search.value.merchant_number }),
    ...(search.value.created_at?.length && { created_at: search.value.created_at }),
  }
  api.payeeList(params).then((res: any) => {
    dataList.value = res.data.list
    pagination.value.total = res.data.total
  }).catch(() => {
    dataList.value = []
    pagination.value.total = 0
  }).finally(() => {
    loading.value = false
  })
}

onMounted(() => {
  const state = history.state
  if (state?.merchant_number) {
    search.value.merchant_number = state.merchant_number
  }
  getDataList()
})

const sizeChange = (size: number) => onSizeChange(size).then(getDataList)
const currentChange = (page = 1) => onCurrentChange(page).then(getDataList)
const sortChange = ({ prop, order }: { prop: string, order: string }) => onSortChange(prop, order).then(getDataList)

function onCreate() {
  formModeProps.value.id = ''
  formModeProps.value.merchantNumber = search.value.merchant_number || ''
  formModeProps.value.mode = 'create'
  updateModal({ title: '新增收款人' })
  openModal()
}

function onEdit(row: any) {
  formModeProps.value.id = row.id
  formModeProps.value.merchantNumber = ''
  formModeProps.value.mode = 'edit'
  updateModal({ title: '编辑收款人' })
  openModal()
}

function onSetDefault(row: any) {
  useFaModal().confirm({
    title: '确认信息',
    content: '确认将该收款人设为默认吗？同一商户下的其他收款人将自动禁用。',
    onConfirm: () => api.payeeSetDefault({ id: row.id }).then(() => {
      toast.success('设置成功')
      getDataList()
    }),
  })
}

function onDel(row: any) {
  useFaModal().confirm({
    title: '确认信息',
    content: '确认删除该收款人吗？',
    onConfirm: () => api.payeeDelete({ id: row.id }).then(() => {
      toast.success('删除成功')
      getDataList()
    }),
  })
}

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
</script>

<template>
  <div :class="{ 'absolute-container': tableAutoHeight }">
    <FaPageMain :class="{ 'flex-1 overflow-auto': tableAutoHeight }" :main-class="{ 'flex-1 flex flex-col overflow-auto': tableAutoHeight }">
      <FaSearchBar :show-toggle="false">
        <template #default>
          <ElForm :model="search" size="default" label-width="100px" inline-message inline class="search-form">
            <ElFormItem label="商户编号">
              <ElInput v-model="search.merchant_number" placeholder="请输入商户编号" clearable @keydown.enter="currentChange()" @clear="currentChange()" />
            </ElFormItem>
            <ElFormItem label="创建时间">
              <ElDatePicker v-model="search.created_at" type="datetimerange" start-placeholder="开始时间" end-placeholder="结束时间" value-format="YYYY-MM-DD HH:mm:ss.000Z" format="YYYY-MM-DD HH:mm:ss" :shortcuts="dateTimeShortcuts" @change="currentChange()" />
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
      <ElSpace wrap>
        <ElButton type="primary" @click="onCreate">
          <template #icon>
            <FaIcon name="i-ep:plus" />
          </template>
          新增收款人
        </ElButton>
      </ElSpace>
      <ElTable v-loading="loading" class="my-4" :data="dataList" stripe highlight-current-row border height="100%" @sort-change="sortChange">
        <ElTableColumn label="商户编号" width="200">
          <template #default="{ row }">
            <ElTooltip :content="row.merchant.remark" placement="top" :disabled="!row.merchant.remark">
              <span>{{ row.merchant.merchant_number }}</span>
            </ElTooltip>
          </template>
        </ElTableColumn>
        <ElTableColumn label="收款信息" min-width="300">
          <template #default="{ row }">
            {{ formatPayeeInfo(row) }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="is_default" label="是否默认" width="100" align="center">
          <template #default="{ row }">
            <ElTag v-if="row.is_default" type="success">
              默认
            </ElTag>
            <ElTag v-else type="info">
              备选
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="created_at" label="创建时间" width="180" />
        <ElTableColumn label="操作" width="250" align="center" fixed="right">
          <template #default="{ row }">
            <ElSpace>
              <ElButton type="primary" size="small" plain @click="onEdit(row)">
                编辑
              </ElButton>
              <ElButton v-if="!row.is_default" type="warning" size="small" plain @click="onSetDefault(row)">
                设为默认
              </ElButton>
              <ElButton type="danger" size="small" plain @click="onDel(row)">
                删除
              </ElButton>
            </ElSpace>
          </template>
        </ElTableColumn>
      </ElTable>
      <ElPagination :current-page="pagination.page" :total="pagination.total" :page-size="pagination.size" :page-sizes="pagination.sizes" :layout="pagination.layout" background @current-change="currentChange" @size-change="sizeChange" />
    </FaPageMain>
  </div>
</template>
