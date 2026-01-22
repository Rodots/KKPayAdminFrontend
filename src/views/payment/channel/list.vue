<script setup lang="ts">
import { ElInputNumber } from 'element-plus'
import { toast } from 'vue-sonner'
import api from '@/api/modules/payment'
import { useFaModal } from '@/ui/components/FaModal'
import DetailForm from './components/DetailForm/index.vue'
import '@/assets/styles/list.css'

defineOptions({ name: 'PaymentChannel' })

const router = useRouter()
const { pagination, getParams, onSizeChange, onCurrentChange, onSortChange } = usePagination()

const tableAutoHeight = ref(true)
const loading = ref(false)
const dataList = ref<any[]>([])
const formModeProps = ref({ id: '' })

const searchDefault = {
  code: '',
  name: '',
  payment_type: '',
  gatway: '',
  status: '',
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
    ...(search.value.code && { code: search.value.code }),
    ...(search.value.name && { name: search.value.name }),
    ...(search.value.payment_type && { payment_type: search.value.payment_type }),
    ...(search.value.gatway !== '' && { gatway: search.value.gatway }),
    ...(search.value.status !== '' && { status: search.value.status }),
  }
  api.channelList(params).then((res: any) => {
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

// ==================== 弹窗相关 ====================
const formRef = ref<InstanceType<typeof DetailForm>>()

const { open: openModal, update: updateModal } = useFaModal().create({
  destroyOnClose: true,
  closeOnClickOverlay: false,
  closeOnPressEscape: false,
  showCancelButton: true,
  class: 'max-w-4xl',
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
  content: () => h(DetailForm, {
    ref: formRef,
    id: formModeProps.value.id,
  }),
})

function onCreate() {
  formModeProps.value.id = ''
  updateModal({ title: '新增' })
  openModal()
}

function onEdit(row: any) {
  formModeProps.value.id = row.id
  updateModal({ title: '编辑' })
  openModal()
}

function onChangeStatus(row: any) {
  const action = !row.status ? '启用' : '禁用'
  return new Promise<boolean>((resolve) => {
    useFaModal().confirm({
      title: '确认信息',
      content: `确认${action}「${row.code}」通道吗？`,
      onConfirm: () => {
        row.statusLoading = true
        api.channelChangeStatus({ ids: [row.id], status: !row.status }).then(() => {
          row.statusLoading = false
          toast.success(`${action}成功`)
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
    title: '复制通道',
    content: () => h('div', { class: 'space-y-4' }, [
      h('p', `确认复制通道「${row.name}」吗？（不含子账户）`),
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
    onConfirm: () => api.channelCopy({ id: row.id, number: copyQuantity.value }).then(() => {
      getDataList()
      toast.success(`复制成功，已创建 ${copyQuantity.value} 个通道`)
    }),
  })
}

function onDel(row: any) {
  useFaModal().confirm({
    title: '确认信息',
    content: `确认删除「${row.code}」通道吗？`,
    onConfirm: () => api.channelDelete({ ids: [row.id] }).then(() => {
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
    content: `确认删除所选的 ${ids.length} 个支付通道吗？此操作不可恢复！`,
    onConfirm: () => api.channelDelete({ ids }).then(() => {
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

function onConfigSubAccount(row: any) {
  router.push({ name: 'PaymentChannelAccountList', params: { channelId: row.id } })
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
    content: `确认${action}所选的 ${ids.length} 个支付通道吗？`,
    onConfirm: () => api.channelChangeStatus({ ids, status }).then(() => {
      toast.success(`${action}成功`)
      getDataList()
      batch.value.selectionDataList = []
    }),
  })
}

function handleMoreOperating(command: string, row: any) {
  const actions: Record<string, () => void> = {
    viewOrder: () => router.push({ name: 'OrderManager', state: { payment_channel_code: row.code } }),
    copy: () => onCopy(row),
    delete: () => onDel(row),
  }
  actions[command]?.()
}
</script>

<template>
  <div :class="{ 'absolute-container': tableAutoHeight }">
    <FaPageMain :class="{ 'flex-1 overflow-auto': tableAutoHeight }" :main-class="{ 'flex-1 flex flex-col overflow-auto': tableAutoHeight }">
      <FaSearchBar :show-toggle="false">
        <template #default>
          <ElForm :model="search" size="default" label-width="100px" inline-message inline class="search-form">
            <ElFormItem label="通道编码">
              <ElInput v-model="search.code" placeholder="请输入通道编码" clearable maxlength="16" @keydown.enter="currentChange()" @clear="currentChange()" />
            </ElFormItem>
            <ElFormItem label="通道名称">
              <ElInput v-model="search.name" placeholder="请输入通道名称，支持模糊搜索" clearable @keydown.enter="currentChange()" @clear="currentChange()" />
            </ElFormItem>
            <ElFormItem label="支付方式">
              <ElSelect v-model="search.payment_type" placeholder="请选择支付方式" @change="currentChange()">
                <ElOption label="全部" value="" />
                <ElOption label="支付宝" value="Alipay" />
                <ElOption label="微信" value="WechatPay" />
                <ElOption label="银联/银行卡" value="Bank" />
                <ElOption label="云闪付" value="UnionPay" />
                <ElOption label="QQ钱包" value="QQWallet" />
                <ElOption label="京东支付" value="JDPay" />
                <ElOption label="PayPal" value="PayPal" />
              </ElSelect>
            </ElFormItem>
            <ElFormItem label="网关代码">
              <ElInput v-model="search.gatway" placeholder="请输入网关代码" clearable @keydown.enter="currentChange()" @clear="currentChange()" />
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
        <ElTableColumn prop="code" label="通道编码" width="160" />
        <ElTableColumn prop="name" label="通道名称" show-overflow-tooltip />
        <ElTableColumn prop="cost" label="成本费率" width="110" sortable>
          <template #default="{ row }">
            <span v-if="row.fixed_cost > 0">￥{{ row.fixed_cost }} + </span>{{ row.cost * 100 }}%
          </template>
        </ElTableColumn>
        <ElTableColumn prop="rate" label="抽成费率" width="110" sortable>
          <template #default="{ row }">
            <span v-if="row.fixed_fee > 0">￥{{ row.fixed_fee }} + </span>{{ row.rate * 100 }}%
          </template>
        </ElTableColumn>
        <ElTableColumn prop="payment_type_text" label="支付方式" />
        <ElTableColumn prop="gateway" label="网关代码" />
        <ElTableColumn prop="min_amount" label="单笔最小金额" width="150" sortable>
          <template #default="{ row }">
            <span v-if="row.min_amount > 0">￥{{ row.min_amount }}</span>
            <span v-else>无限制</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="max_amount" label="单笔最大金额" width="150" sortable>
          <template #default="{ row }">
            <span v-if="row.max_amount > 0">￥{{ row.max_amount }}</span>
            <span v-else>无限制</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="daily_limit" label="单日收款限额" width="150" sortable>
          <template #default="{ row }">
            <span v-if="row.daily_limit > 0">￥{{ row.daily_limit }}</span>
            <span v-else>无限制</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="status" label="状态" width="100">
          <template #default="{ row }">
            <ElSwitch v-model="row.status" :loading="row.statusLoading" inline-prompt active-text="启用" inactive-text="禁用" :before-change="() => onChangeStatus(row)" />
          </template>
        </ElTableColumn>
        <ElTableColumn prop="created_at" label="创建时间" width="165" sortable />
        <ElTableColumn label="操作" width="300" align="center">
          <template #default="{ row }">
            <ElSpace>
              <ElButton type="primary" size="small" plain @click="onConfigSubAccount(row)">
                配置子账户
              </ElButton>
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
                      复制通道
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
