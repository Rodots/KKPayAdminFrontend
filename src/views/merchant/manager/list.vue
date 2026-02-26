<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import { ElInput, ElInputNumber, ElRadio, ElRadioGroup } from 'element-plus'
import { toast } from 'vue-sonner'
import api from '@/api/modules/merchant'
import { useFaModal } from '@/ui/components/FaModal'
import { dateTimeShortcuts } from '@/utils/dateTimeShortcuts'

import ChannelDialog from '../channel/components/ChannelDialog.vue'
import DetailForm from './components/DetailForm/index.vue'
import EncryptionDialog from './components/EncryptionDialog/index.vue'
import RecycleBin from './components/RecycleBin/index.vue'
import SettleDialog from './components/SettleDialog/index.vue'

import '@/assets/styles/list.css'

const router = useRouter()
const { pagination, getParams, onSizeChange, onCurrentChange, onSortChange } = usePagination()
const { copy, copied, text } = useClipboard()

const tableAutoHeight = ref(true)
const formModeProps = ref({ id: '' })

// 搜索
const searchDefault = {
  merchant_number: '',
  nickname: '',
  email: '',
  phone: '',
  remark: '',
  created_at: [],
  status: '',
  risk_status: '',
}
const search = ref({ ...searchDefault })
const searchReset = () => Object.assign(search.value, searchDefault)

// 批量操作
const batch = ref({
  enable: true,
  selectionDataList: [] as any[],
})

// 列表数据
const loading = ref(false)
const dataList = ref<any[]>([])

onMounted(() => getDataList())

function getDataList() {
  loading.value = true
  const params = {
    ...getParams(),
    ...(search.value.merchant_number && { merchant_number: search.value.merchant_number }),
    ...(search.value.nickname && { nickname: search.value.nickname }),
    ...(search.value.email && { email: search.value.email }),
    ...(search.value.phone && { phone: search.value.phone }),
    ...(search.value.remark && { remark: search.value.remark }),
    ...(search.value.created_at?.length && { created_at: search.value.created_at }),
    ...(search.value.status !== '' && { status: search.value.status }),
    ...(search.value.risk_status !== '' && { risk_status: search.value.risk_status }),
  }
  api.list(params).then((res: any) => {
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

// ==================== 弹窗表单相关 ====================
const formRef = ref<InstanceType<typeof DetailForm>>()

const { open: openModal, update: updateModal } = useFaModal().create({
  destroyOnClose: true,
  closeOnClickOverlay: false,
  closeOnPressEscape: false,
  class: 'max-w-xl',
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
  content: () => h(DetailForm, { ref: formRef, id: formModeProps.value.id }),
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

// ==================== 辅助函数 ====================
/** 渲染必填标签 */
function renderRequiredLabel(text: string) {
  return h('label', { class: 'block mb-2' }, [
    h('span', { class: 'text-red-500 mr-1' }, '*'),
    h('span', text),
  ])
}

// ==================== 业务操作 ====================
function viewOrder(row: any) {
  router.push({ name: 'OrderManager', state: { merchant_number: row.merchant_number } })
}

function onPayeeInfo(row: any) {
  router.push({ name: 'MerchantPayee', state: { merchant_number: row.merchant_number } })
}

// ==================== 通道管理弹窗 ====================
const channelDialogRef = ref<InstanceType<typeof ChannelDialog>>()
const channelModeProps = ref({ merchantId: '', merchantNumber: '' })

const { open: openChannelModal, update: updateChannelModal, close: closeChannelModal } = useFaModal().create({
  class: '!max-w-300 !w-full',
  destroyOnClose: true,
  closeOnClickOverlay: false,
  beforeClose: (action, done) => {
    if (action === 'confirm') {
      channelDialogRef.value?.submit().then(() => {
        getDataList()
        done()
      }).catch(() => {})
    }
    else {
      done()
    }
  },
  content: () => h(ChannelDialog, {
    ref: channelDialogRef,
    merchantId: channelModeProps.value.merchantId,
    onSuccess: getDataList,
    onOpenInNewPage: closeChannelModal,
  }),
})

function onChannelManage(row: any) {
  channelModeProps.value.merchantId = row.id
  channelModeProps.value.merchantNumber = row.merchant_number
  updateChannelModal({ title: `通道管理 - ${row.merchant_number}` })
  openChannelModal()
}

function onChangeStatus(row: any) {
  const action = !row.status ? '启用' : '禁用'
  return new Promise<boolean>((resolve) => {
    useFaModal().confirm({
      title: '确认信息',
      content: `确认${action}「${row.merchant_number}」商户吗？`,
      onConfirm: () => {
        row.statusLoading = true
        api.changeStatus({ id: row.id, status: !row.status })
          .then(() => {
            toast.success(`${action}成功`)
            resolve(true)
          })
          .catch(() => resolve(false))
          .finally(() => { row.statusLoading = false })
      },
    })
  })
}

function onChangeRiskStatus(row: any) {
  const action = !row.risk_status ? '启用' : '禁用'
  return new Promise<boolean>((resolve) => {
    useFaModal().confirm({
      title: '确认信息',
      content: `确认${action}「${row.merchant_number}」商户的风控状态吗？`,
      onConfirm: () => {
        row.statusLoading = true
        api.changeRiskStatus({ id: row.id, risk_status: !row.risk_status })
          .then(() => {
            toast.success(`${action}风控状态成功`)
            resolve(true)
          })
          .catch(() => resolve(false))
          .finally(() => { row.statusLoading = false })
      },
    })
  })
}

function onResetPassword(row: any) {
  const password = ref('')
  useFaModal().confirm({
    title: '重置密码',
    content: () => h('div', { class: 'space-y-4' }, [
      h('p', `您正在重置商户「${row.merchant_number}」的登录密码。`),
      h('div', [
        h('div', { class: 'mb-2 text-sm text-gray-500' }, '请输入新密码：'),
        h(ElInput, {
          'modelValue': password.value,
          'onUpdate:modelValue': (val: string) => password.value = val,
          'placeholder': '可留空，默认密码为 123456',
          'showPassword': true,
          'clearable': true,
        }),
      ]),
    ]),
    confirmButtonText: '确认修改',
    onConfirm: () => api.resetPassword({ id: row.id, password: password.value || '123456' }).then(() => {
      toast.success(`密码重置成功${!password.value ? '，默认密码为 123456' : ''}`)
    }),
  })
}

function onSimulateLogin(row: any) {
  useFaModal().confirm({
    title: '确认信息',
    content: `确认模拟登录「${row.merchant_number}」商户吗？`,
    onConfirm: () => api.simulateLogin({ id: row.id }).then(() => toast.success('待开发，敬请期待')),
  })
}

function onRetrySettlement(row: any) {
  const days = ref(0)
  useFaModal().confirm({
    title: '重试结算的订单',
    content: () => h('div', { class: 'space-y-4' }, [
      h('p', `确认重试「${row.merchant_number}」商户结算失败的订单吗？`),
      h('div', [
        h('label', '多少天前至今的订单（0为全部）：'),
        h(ElInputNumber, {
          'modelValue': days.value,
          'onUpdate:modelValue': (val: number | undefined) => days.value = val || 0,
          'min': 0,
          'max': 365,
          'size': 'small',
          'class': 'w-30',
        }),
      ]),
    ]),
    confirmButtonText: '确认执行',
    onConfirm: () => api.retrySettlement({ id: row.id, days: days.value }).then(() => {
      getDataList()
      toast.success('执行成功')
    }),
  })
}

function onAdjustBalance(row: any) {
  const balanceType = ref<'available' | 'unavailable' | 'prepaid'>('available')
  const amount = ref(0)
  const remark = ref('')

  useFaModal().confirm({
    title: '余额变动',
    content: () => h('div', { class: 'space-y-4' }, [
      h('p', `商户：${row.merchant_number}`),
      h('div', [
        renderRequiredLabel('选择变动类型：'),
        h(ElRadioGroup, {
          'modelValue': balanceType.value,
          'onUpdate:modelValue': (val: string | number | boolean | undefined) => {
            if (val === 'available' || val === 'unavailable' || val === 'prepaid') {
              balanceType.value = val
            }
          },
        }, () => [
          h(ElRadio, { value: 'available' }, () => '可用余额'),
          h(ElRadio, { value: 'unavailable' }, () => '不可用余额'),
          h(ElRadio, { value: 'prepaid' }, () => '预付金'),
        ]),
      ]),
      h('div', [
        renderRequiredLabel('变更金额（正数为增加，负数为减少）：'),
        h(ElInputNumber, {
          'modelValue': amount.value,
          'onUpdate:modelValue': (val: number | undefined) => amount.value = val || 0,
          'step': 0.01,
          'precision': 2,
          'class': 'w-full',
        }),
      ]),
      h('div', [
        renderRequiredLabel('本次操作备注：'),
        h(ElInput, {
          'modelValue': remark.value,
          'onUpdate:modelValue': (val: string) => remark.value = val,
          'type': 'textarea',
          'rows': 3,
          'placeholder': '请输入备注信息',
        }),
      ]),
    ]),
    confirmButtonText: '确认操作',
    onConfirm: () => {
      if (amount.value === 0) {
        toast.warning('变更金额不能为0')
        return Promise.reject(new Error('变更金额不能为0'))
      }
      if (!remark.value.trim()) {
        toast.warning('请输入本次操作备注')
        return Promise.reject(new Error('请输入本次操作备注'))
      }
      return api.adjustBalance({
        id: row.id,
        balance_type: balanceType.value,
        amount: amount.value,
        remark: remark.value,
      }).then(getDataList)
    },
  })
}

// ==================== 清账弹窗 ====================
const settleDialogRef = ref<InstanceType<typeof SettleDialog>>()
const settleModeProps = ref({ id: '', merchantNumber: '' })

const { open: openSettleModal, update: updateSettleModal } = useFaModal().create({
  destroyOnClose: true,
  closeOnClickOverlay: false,
  beforeClose: (action, done) => {
    if (action === 'confirm') {
      settleDialogRef.value?.submit().then(() => {
        getDataList()
        done()
      })
    }
    else {
      done()
    }
  },
  content: () => h(SettleDialog, {
    ref: settleDialogRef,
    id: settleModeProps.value.id,
    merchantNumber: settleModeProps.value.merchantNumber,
    onSuccess: (message: string) => toast.success(message),
    onError: (message: string) => toast.error(message),
  }),
})

function onSettleAccount(row: any) {
  settleModeProps.value.id = row.id
  settleModeProps.value.merchantNumber = row.merchant_number
  updateSettleModal({ title: '商户清账' })
  openSettleModal()
}

function onDel(row: any) {
  useFaModal().confirm({
    title: '确认信息',
    content: `确认删除「${row.merchant_number}」商户吗？`,
    onConfirm: () => api.delete({ id: row.id }).then(() => {
      getDataList()
      toast.success('删除成功')
    }),
  })
}

function onBatchChangeStatus(status: 0 | 1) {
  const ids = batch.value.selectionDataList.map((item: any) => item.id)
  if (!ids.length) {
    toast.warning('请先选择需要操作的数据')
    return
  }
  const action = status ? '启用' : '禁用'
  useFaModal().confirm({
    title: '确认信息',
    content: `确认${action}所选的 ${ids.length} 个商户吗？`,
    onConfirm: () => api.batchChangeStatus({ ids, status }).then(() => {
      toast.success(`${action}成功`)
      getDataList()
      batch.value.selectionDataList = []
    }),
  })
}

// ==================== 更多操作菜单 ====================
function handleMoreOperating(command: string, row: any) {
  const actions: Record<string, () => void> = {
    balanceRecord: () => router.push({ name: 'CapitalWalletRecord', state: { merchant_number: row.merchant_number } }),
    perpaidRecord: () => router.push({ name: 'CapitalWalletPerpaidRecord', state: { merchant_number: row.merchant_number } }),
    payeeInfo: () => onPayeeInfo(row),
    encryption: () => onEncryptionManage(row),
    retrySettlement: () => onRetrySettlement(row),
    resetPassword: () => onResetPassword(row),
    simulateLogin: () => onSimulateLogin(row),
    delete: () => onDel(row),
  }
  actions[command]?.()
}

// ==================== 回收站弹窗 ====================
const { open: openRecycleBin } = useFaModal().create({
  title: '商户回收站',
  class: '!max-w-250 !w-full',
  footer: false,
  destroyOnClose: true,
  content: () => h(RecycleBin, { onSuccess: getDataList }),
})

// ==================== 密钥管理弹窗 ====================
const encryptionDialogRef = ref<InstanceType<typeof EncryptionDialog>>()
const encryptionModeProps = ref({ id: '' })

const { open: openEncryptionModal, update: updateEncryptionModal } = useFaModal().create({
  class: '!max-w-150',
  destroyOnClose: true,
  closeOnClickOverlay: false,
  beforeClose: (action, done) => {
    if (action === 'confirm') {
      encryptionDialogRef.value?.submit().then(() => done())
    }
    else {
      done()
    }
  },
  content: () => h(EncryptionDialog, { ref: encryptionDialogRef, id: encryptionModeProps.value.id }),
})

function onEncryptionManage(row: any) {
  encryptionModeProps.value.id = row.id
  updateEncryptionModal({ title: `密钥管理 - ${row.merchant_number}` })
  openEncryptionModal()
}
</script>

<template>
  <div :class="{ 'absolute-container': tableAutoHeight }">
    <FaPageMain :class="{ 'flex-1 overflow-auto': tableAutoHeight }" :main-class="{ 'flex-1 flex flex-col overflow-auto': tableAutoHeight }">
      <FaSearchBar :show-toggle="false">
        <template #default="{ fold, toggle }">
          <ElForm :model="search" size="default" label-width="100px" inline-message inline class="search-form">
            <ElFormItem label="商户编号">
              <ElInput v-model="search.merchant_number" placeholder="请输入商户编号" clearable @keydown.enter="currentChange()" @clear="currentChange()" />
            </ElFormItem>
            <ElFormItem label="商户昵称">
              <ElInput v-model="search.nickname" placeholder="请输入商户昵称，支持模糊查询" clearable @keydown.enter="currentChange()" @clear="currentChange()" />
            </ElFormItem>
            <ElFormItem v-show="!fold" label="邮箱">
              <ElInput v-model="search.email" placeholder="请输入邮箱，支持模糊查询" clearable @keydown.enter="currentChange()" @clear="currentChange()" />
            </ElFormItem>
            <ElFormItem v-show="!fold" label="手机号">
              <ElInput v-model="search.phone" placeholder="请输入手机号，支持模糊查询" clearable @keydown.enter="currentChange()" @clear="currentChange()" />
            </ElFormItem>
            <ElFormItem v-show="!fold" label="备注">
              <ElInput v-model="search.remark" placeholder="请输入备注，支持模糊查询" clearable @keydown.enter="currentChange()" @clear="currentChange()" />
            </ElFormItem>
            <ElFormItem v-show="!fold" label="创建时间">
              <ElDatePicker v-model="search.created_at" type="datetimerange" start-placeholder="开始时间" end-placeholder="结束时间" value-format="YYYY-MM-DD HH:mm:ss.000Z" format="YYYY-MM-DD HH:mm:ss" date-format="YYYY-MM-DD" time-format="HH:mm:ss" :shortcuts="dateTimeShortcuts" @change="currentChange()" />
            </ElFormItem>
            <ElFormItem label="状态">
              <ElRadioGroup v-model="search.status" @change="currentChange()">
                <ElRadioButton value="">
                  全部
                </ElRadioButton>
                <ElRadioButton :value="1">
                  正常
                </ElRadioButton>
                <ElRadioButton :value="0">
                  封禁
                </ElRadioButton>
              </ElRadioGroup>
            </ElFormItem>
            <ElFormItem label="风控状态">
              <ElRadioGroup v-model="search.risk_status" @change="currentChange()">
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
      <ElSpace v-auth="['super_admin', 'admin']" wrap>
        <ElButton type="primary" size="default" @click="onCreate">
          <template #icon>
            <FaIcon name="i-ep:plus" />
          </template>
          新增
        </ElButton>
        <div v-if="batch.enable">
          <ElButtonGroup>
            <ElButton :disabled="!batch.selectionDataList.length" @click="onBatchChangeStatus(1)">
              批量启用
            </ElButton>
            <ElButton :disabled="!batch.selectionDataList.length" @click="onBatchChangeStatus(0)">
              批量禁用
            </ElButton>
          </ElButtonGroup>
        </div>
        <ElButton @click="openRecycleBin">
          <template #icon>
            <FaIcon name="i-ep:delete" />
          </template>
          回收站
        </ElButton>
      </ElSpace>
      <ElTable v-loading="loading" class="my-4" :data="dataList" stripe highlight-current-row border height="100%" @sort-change="sortChange" @selection-change="batch.selectionDataList = $event">
        <ElTableColumn v-if="batch.enable" v-auth="['super_admin', 'admin']" type="selection" align="center" fixed />
        <ElTableColumn width="220">
          <template #header>
            商户编号<br>商户昵称
          </template>
          <template #default="scope">
            <div class="flex items-center">
              <ElTooltip :content="scope.row.remark" placement="top" :disabled="!scope.row.remark">
                <span>{{ scope.row.merchant_number }}</span>
              </ElTooltip>
              <FaButton variant="outline" size="icon" class="ml-1 h-5 w-5 text-gray-500 hover:text-gray-700" @click="copy(scope.row.merchant_number)">
                <FaIcon :name="copied && text === scope.row.merchant_number ? 'i-ri:check-line' : 'i-ri:file-copy-2-line'" class="h-4 w-4" :class="[copied && text === scope.row.merchant_number && 'text-green-500']" />
              </FaButton>
            </div>
            <div class="mt-1 text-sm text-gray-500">
              {{ scope.row.nickname }}
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn width="120" show-overflow-tooltip :tooltip-formatter="({ row }) => row.email">
          <template #header>
            邮箱<br>手机号
          </template>
          <template #default="scope">
            {{ scope.row.email }}<br>{{ scope.row.phone }}
          </template>
        </ElTableColumn>
        <ElTableColumn min-width="150">
          <template #header>
            可用余额<br>不可用余额
          </template>
          <template #default="scope">
            ￥{{ scope.row.wallet.available_balance }}<br>￥{{ scope.row.wallet.unavailable_balance }}
          </template>
        </ElTableColumn>
        <ElTableColumn min-width="150">
          <template #header>
            保证金<br>预付金
          </template>
          <template #default="scope">
            ￥{{ scope.row.wallet.margin }}<br>￥{{ scope.row.wallet.prepaid }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="status" label="账户状态" width="100">
          <template #default="scope">
            <ElSwitch v-model="scope.row.status" :loading="scope.row.statusLoading" inline-prompt active-text="正常" inactive-text="封禁" :before-change="() => onChangeStatus(scope.row)" />
          </template>
        </ElTableColumn>
        <ElTableColumn prop="risk_status" label="风控状态" width="100">
          <template #default="scope">
            <ElSwitch v-model="scope.row.risk_status" :loading="scope.row.statusLoading" inline-prompt active-text="风控中" inactive-text="正常" :before-change="() => onChangeRiskStatus(scope.row)" :style="{ '--el-switch-on-color': '#ff4949', '--el-switch-off-color': '#13ce66' }" />
          </template>
        </ElTableColumn>
        <ElTableColumn prop="created_at" label="开户时间" width="165" />
        <ElTableColumn label="操作" min-width="250" align="center">
          <template #default="scope">
            <div class="flex flex-col items-center justify-center gap-y-2 min-[2000px]:flex-row min-[2000px]:gap-x-2">
              <ElSpace wrap>
                <ElButton type="warning" size="small" plain @click="onAdjustBalance(scope.row)">
                  余额变动
                </ElButton>
                <ElButton type="danger" size="small" plain @click="onSettleAccount(scope.row)">
                  清账
                </ElButton>
                <ElButton type="info" size="small" plain @click="onChannelManage(scope.row)">
                  通道
                </ElButton>
              </ElSpace>
              <ElSpace wrap>
                <ElButton type="primary" size="small" plain @click="onEdit(scope.row)">
                  编辑
                </ElButton>
                <ElButton type="success" size="small" plain @click="viewOrder(scope.row)">
                  订单
                </ElButton>
                <ElDropdown @command="handleMoreOperating($event, scope.row)">
                  <ElButton size="small">
                    更多操作
                    <FaIcon name="i-ep:arrow-down" class="el-icon--right" />
                  </ElButton>
                  <template #dropdown>
                    <ElDropdownMenu>
                      <ElDropdownItem command="payeeInfo">
                        收款信息
                      </ElDropdownItem>
                      <ElDropdownItem command="encryption">
                        密钥管理
                      </ElDropdownItem>
                      <ElDropdownItem command="balanceRecord" divided>
                        余额流水
                      </ElDropdownItem>
                      <ElDropdownItem command="perpaidRecord">
                        预付金流水
                      </ElDropdownItem>
                      <ElDropdownItem command="retrySettlement">
                        重试结算
                      </ElDropdownItem>
                      <ElDropdownItem command="resetPassword" divided>
                        重置密码
                      </ElDropdownItem>
                      <FaAuth value="super_admin">
                        <ElDropdownItem command="simulateLogin">
                          模拟登录
                        </ElDropdownItem>
                      </FaAuth>
                      <ElDropdownItem command="delete" divided>
                        删除
                      </ElDropdownItem>
                    </ElDropdownMenu>
                  </template>
                </ElDropdown>
              </ElSpace>
            </div>
          </template>
        </ElTableColumn>
      </ElTable>
      <ElPagination :current-page="pagination.page" :total="pagination.total" :page-size="pagination.size" :page-sizes="pagination.sizes" :layout="pagination.layout" :hide-on-single-page="false" class="pagination" background @current-change="currentChange" @size-change="sizeChange" />
    </FaPageMain>
  </div>
</template>
