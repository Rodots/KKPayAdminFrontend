<script setup lang="ts">
import { toast } from 'vue-sonner'
import api from '@/api/modules/risk'
import { useFaModal } from '@/ui/components/FaModal'
import BlackAddFrom from './components/BlackAddFrom/index.vue'
import '@/assets/styles/list.css'

const { pagination, getParams, onSizeChange, onCurrentChange } = usePagination()

const tableAutoHeight = ref(true)
const loading = ref(false)
const dataList = ref<any[]>([])

const searchDefault = {
  entity_type: '',
  entity_value: '',
  origin: '',
  expired_at: '' as string | string[],
}
const search = ref({ ...searchDefault })
const searchReset = () => Object.assign(search.value, searchDefault)

const batch = ref({
  enable: true,
  selectionDataList: [] as any[],
})

onMounted(getDataList)

function getDataList() {
  loading.value = true
  const params = {
    ...getParams(),
    ...(search.value.entity_type && { entity_type: search.value.entity_type }),
    ...(search.value.entity_value && { entity_value: search.value.entity_value }),
    ...(search.value.origin && { origin: search.value.origin }),
    ...(search.value.expired_at && (search.value.expired_at as string[]).length > 0 && { expired_at: search.value.expired_at }),
  }
  api.blackList(params).then((res: any) => {
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

const formRef = ref<InstanceType<typeof BlackAddFrom>>()

const { open: openModal } = useFaModal().create({
  title: '新增黑名单',
  destroyOnClose: true,
  closeOnClickOverlay: false,
  closeOnPressEscape: false,
  beforeClose: (action, done) => {
    if (action === 'confirm') {
      formRef.value?.submit().then(() => {
        getDataList()
        done()
      })
    }
    else {
      done()
    }
  },
  content: () => h(BlackAddFrom, { ref: formRef }),
})

const onCreate = () => openModal()

function onDel(row: any) {
  useFaModal().confirm({
    title: '确认信息',
    content: `确认解除该黑名单吗？`,
    onConfirm: () => api.blackDel(row.id).then(() => {
      toast.success(`解除成功`)
      getDataList()
    }),
  })
}

function onBatchDel() {
  const ids = batch.value.selectionDataList.map((item: any) => item.id)
  if (!ids.length) {
    toast.warning('请先选择需要操作的数据')
    return
  }
  useFaModal().confirm({
    title: '确认信息',
    content: `确认解除所选的 ${ids.length} 个黑名单吗？`,
    onConfirm: () => api.batchBlackDel({ ids }).then(() => {
      toast.success(`批量解除成功`)
      getDataList()
      batch.value.selectionDataList = []
    }),
  })
}
</script>

<template>
  <div :class="{ 'absolute-container': tableAutoHeight }">
    <FaPageMain :class="{ 'flex-1 overflow-auto': tableAutoHeight }" :main-class="{ 'flex-1 flex flex-col overflow-auto': tableAutoHeight }">
      <FaSearchBar :show-toggle="false">
        <template #default>
          <ElForm :model="search" size="default" label-width="100px" inline-message inline class="search-form">
            <ElFormItem label="黑名单内容">
              <ElInput v-model="search.entity_value" placeholder="请输入内容" clearable maxlength="512" @keydown.enter="currentChange()" @clear="currentChange()">
                <template #prepend>
                  <ElSelect v-model="search.entity_type" placeholder="选择类型" class="w-26" @change="currentChange()">
                    <ElOption label="全部" value="" />
                    <ElOption label="用户ID" value="USER_ID" />
                    <ElOption label="银行卡号" value="BANK_CARD" />
                    <ElOption label="身份证号" value="ID_CARD" />
                    <ElOption label="手机号" value="MOBILE" />
                    <ElOption label="IP地址" value="IP_ADDRESS" />
                    <ElOption label="设备指纹" value="DEVICE_FINGERPRINT" />
                  </ElSelect>
                </template>
              </ElInput>
            </ElFormItem>
            <ElFormItem label="拉黑来源">
              <ElSelect v-model="search.origin" placeholder="请选择来源" @change="currentChange()">
                <ElOption label="全部" value="" />
                <ElOption label="人工审核" value="MANUAL_REVIEW" />
                <ElOption label="自动检测" value="AUTO_DETECTION" />
                <ElOption label="第三方" value="THIRD_PARTY" />
                <ElOption label="商户报备" value="MERCHANT_REPORT" />
              </ElSelect>
            </ElFormItem>
            <ElFormItem label="过期时间">
              <ElDatePicker v-model="search.expired_at" type="datetimerange" start-placeholder="开始时间" end-placeholder="结束时间" value-format="YYYY-MM-DD HH:mm:ss.000Z" format="YYYY-MM-DD HH:mm:ss" date-format="YYYY-MM-DD" time-format="HH:mm:ss" @change="currentChange()" />
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
        <ElButton type="primary" size="default" @click="onCreate">
          <template #icon>
            <FaIcon name="i-ep:plus" />
          </template>
          新增
        </ElButton>
        <div v-if="batch.enable">
          <ElButtonGroup>
            <ElButton :disabled="!batch.selectionDataList.length" @click="onBatchDel()">
              批量解黑
            </ElButton>
          </ElButtonGroup>
        </div>
      </ElSpace>
      <ElTable v-loading="loading" class="my-4" :data="dataList" stripe highlight-current-row border height="100%" @selection-change="batch.selectionDataList = $event">
        <ElTableColumn v-if="batch.enable" type="selection" align="center" fixed />
        <ElTableColumn prop="id" label="ID" width="100" />
        <ElTableColumn prop="entity_type_text" label="黑名单类型" width="100" />
        <ElTableColumn prop="entity_value" label="黑名单内容" />
        <ElTableColumn prop="reason" label="封禁理由" show-overflow-tooltip />
        <ElTableColumn prop="origin_text" label="来源" width="100" />
        <ElTableColumn prop="created_at" label="首次拉黑时间" width="165" />
        <ElTableColumn prop="updated_at" label="最后更新时间" width="165" />
        <ElTableColumn prop="expired_at_text" label="过期时间" width="165" />
        <ElTableColumn label="操作" width="150" align="center">
          <template #default="{ row }">
            <ElSpace>
              <ElButton type="primary" size="small" plain @click="onDel(row)">
                解除拉黑
              </ElButton>
            </ElSpace>
          </template>
        </ElTableColumn>
      </ElTable>
      <ElPagination :current-page="pagination.page" :total="pagination.total" :page-size="pagination.size" :page-sizes="pagination.sizes" :layout="pagination.layout" :hide-on-single-page="false" class="pagination" background @current-change="currentChange" @size-change="sizeChange" />
    </FaPageMain>
  </div>
</template>
