<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import { toast } from 'vue-sonner'
import api from '@/api/modules/order'
import { useFaModal } from '@/ui/components/FaModal'
import { dateTimeShortcuts, getDefaultRange } from '@/utils/dateTimeShortcuts'
import BlackAddFrom from '@/views/risk/black_manager/components/BlackAddFrom/index.vue'
import DetailForm from './components/DetailForm/index.vue'
import RefundForm from './components/RefundForm/index.vue'
import ReNotification from './components/ReNotification/index.vue'
import '@/assets/styles/list.css'

defineOptions({ name: 'OrderManager' })

const router = useRouter()
const { pagination, getParams, onSizeChange, onCurrentChange, onSortChange } = usePagination()
const { text, copy, copied, isSupported } = useClipboard()

if (isSupported.value) {
  watch(copied, val => val && toast.success('复制成功'))
}
else {
  console.log('当前浏览器不支持快捷复制功能')
  toast.error('当前浏览器不支持快捷复制功能')
}

const tableAutoHeight = ref(true)

// 搜索
const searchDefault = {
  fuzzy_trade_no: '',
  trade_no: '',
  out_trade_no: '',
  api_trade_no: '',
  bill_trade_no: '',
  mch_trade_no: '',
  merchant_number: '',
  payment_type: '',
  payment_channel_code: '',
  payment_channel_account_id: '',
  subject: '',
  total_amount: '',
  receipt_amount: '',
  buyer_pay_amount: '',
  create_time: getDefaultRange(),
  payment_time: '',
  trade_state: '',
  settle_state: '',
  notify_state: '',
}
const search = ref({ ...searchDefault })
const searchReset = () => Object.assign(search.value, searchDefault)

// 批量操作
const batch = ref({
  selectionDataList: [] as any[],
})

// 列表数据
const loading = ref(false)
const dataList = ref<any[]>([])

function initializeSearchForm() {
  const state = window.history.state || {}
  const fields = ['merchant_number', 'payment_channel_code', 'payment_channel_account_id'] as const
  fields.forEach((key) => {
    if (state[key]) {
      search.value[key] = state[key]
    }
  })
  window.history.replaceState({}, '', window.location.href)
}

onMounted(() => {
  initializeSearchForm()
  getDataList()
})

function getDataList() {
  loading.value = true
  const params = {
    ...getParams(),
    ...(search.value.fuzzy_trade_no && { fuzzy_trade_no: search.value.fuzzy_trade_no }),
    ...(search.value.trade_no && { trade_no: search.value.trade_no }),
    ...(search.value.out_trade_no && { out_trade_no: search.value.out_trade_no }),
    ...(search.value.api_trade_no && { api_trade_no: search.value.api_trade_no }),
    ...(search.value.bill_trade_no && { bill_trade_no: search.value.bill_trade_no }),
    ...(search.value.merchant_number && { merchant_number: search.value.merchant_number }),
    ...(search.value.payment_type !== '' && { payment_type: search.value.payment_type }),
    ...(search.value.payment_channel_code && { payment_channel_code: search.value.payment_channel_code }),
    ...(search.value.payment_channel_account_id && { payment_channel_account_id: search.value.payment_channel_account_id }),
    ...(search.value.subject && { subject: search.value.subject }),
    ...(search.value.total_amount && { total_amount: search.value.total_amount }),
    ...(search.value.receipt_amount && { receipt_amount: search.value.receipt_amount }),
    ...(search.value.buyer_pay_amount && { buyer_pay_amount: search.value.buyer_pay_amount }),
    ...(search.value.create_time?.length && { create_time: search.value.create_time }),
    ...(search.value.payment_time?.length && { payment_time: search.value.payment_time }),
    ...(search.value.trade_state !== '' && { trade_state: search.value.trade_state }),
    ...(search.value.settle_state !== '' && { settle_state: search.value.settle_state }),
    ...(search.value.notify_state !== '' && { notify_state: search.value.notify_state }),
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

const stateUtils = {
  isSuccess: (state: string) => state === 'TRADE_SUCCESS',
  isSuccessOrFinish: (state: string) => ['TRADE_SUCCESS', 'TRADE_FINISHED'].includes(state),
  isSuccessOrFrozen: (state: string) => ['TRADE_SUCCESS', 'TRADE_FROZEN'].includes(state),
  isWaitPayOrClosed: (state: string) => ['WAIT_PAY', 'TRADE_CLOSED'].includes(state),
  isFrozen: (state: string) => state === 'TRADE_FROZEN',
}

const sizeChange = (size: number) => onSizeChange(size).then(getDataList)
const currentChange = (page = 1) => onCurrentChange(page).then(getDataList)
const sortChange = ({ prop, order }: { prop: string, order: string }) => onSortChange(prop, order).then(getDataList)

const { open: openModal, update: updateModal, close: closeModal } = useFaModal().create({ destroyOnClose: true })

const detailFormRef = ref<InstanceType<typeof DetailForm>>()
const refundFormRef = ref<InstanceType<typeof RefundForm>>()
const blackAddFromRef = ref<InstanceType<typeof BlackAddFrom>>()

function initModal(isDetail: boolean = false) {
  updateModal({
    icon: undefined,
    title: undefined,
    class: isDetail ? 'max-w-350' : undefined,
    description: undefined,
    content: undefined,
    footer: true,
  })
}

function onDetail(trade_no: string) {
  initModal(true)
  updateModal({
    title: '订单详情',
    content: () => h(DetailForm, {
      ref: detailFormRef,
      tradeNo: trade_no,
      onReNotification: (type: string) => {
        if (['manual', 'server', 'sync'].includes(type)) {
          onReNotification(trade_no, type, true)
        }
      },
      onRefund: () => onRefund(trade_no),
      onFreezeOrThaw: (state: string) => onFreezeOrThaw(trade_no, state, true),
      onDelete: () => onDel(trade_no, true),
    }),
  })
  openModal()
}

function onRefund(trade_no: string) {
  initModal()
  updateModal({
    title: '订单退款',
    beforeClose: (action, done) => {
      if (action === 'confirm') {
        refundFormRef.value?.submit().then(() => {
          getDataList()
          done()
        })
      }
      else {
        done()
      }
    },
    content: () => h(RefundForm, { ref: refundFormRef, tradeNo: trade_no }),
  })
  openModal()
}

function onRepair(trade_no: string) {
  initModal()
  useFaModal().confirm({
    title: '确认信息',
    content: `此操作将不管该订单是否真的支付，直接改为【交易成功】状态并给商户分成以及通知下游，是否确定？该操作不可逆！`,
    onConfirm: () => api.repair(trade_no).then(() => {
      getDataList()
      toast.success('补单成功')
    }),
  })
}

function onReNotification(trade_no: string, type: string = 'server', isDetail: boolean = false) {
  useFaModal().confirm({
    title: '确认信息',
    content: `确认重新通知该订单吗？`,
    onConfirm: () => api.reNotification({ trade_no, type }).then((res: any) => {
      initModal(isDetail)
      updateModal({
        icon: 'success',
        title: '受理成功',
        description: res.message,
        content: () => h(ReNotification, {
          type,
          signString: res.data.sign_string,
          curlCommand: res.data.curl_command,
          jsonBody: res.data.json_body,
          redirectUrl: res.data.redirect_url,
        }),
        footer: false,
      })
      openModal()
    }),
  })
}

function onDel(trade_no: string, isDetail = false) {
  useFaModal().confirm({
    title: '确认信息',
    content: `确认删除该订单及其关联信息吗？该操作不可撤销！`,
    onConfirm: () => api.delete(trade_no).then(() => {
      if (isDetail) {
        closeModal()
      }
      getDataList()
      toast.success('删除成功')
    }),
  })
}

function onFreezeOrThaw(trade_no: string, target_state: string, isDetail = false) {
  const actionText = stateUtils.isFrozen(target_state) ? '冻结订单' : '解冻订单'
  useFaModal().confirm({
    title: '确认信息',
    content: `确认${actionText}吗？`,
    onConfirm: () => api.freezeOrThaw({ trade_no, target_state }).then(() => {
      if (isDetail) {
        detailFormRef.value?.getInfo()
      }
      getDataList()
      toast.success(`${actionText}成功`)
    }),
  })
}

function onAddBlacklist(buyerId: string, type: string) {
  initModal()
  updateModal({
    title: '新增黑名单',
    beforeClose: (action, done) => {
      if (action === 'confirm') {
        blackAddFromRef.value?.submit().then(() => {
          getDataList()
          done()
        })
      }
      else {
        done()
      }
    },
    content: () => h(BlackAddFrom, {
      ref: blackAddFromRef,
      entityType: type,
      entityValue: buyerId,
      reason: '狗逼崽子',
    }),
  })
  openModal()
}

function onBatchRepair() {
  const ids = batch.value.selectionDataList.map((item: any) => item.trade_no)
  if (!ids.length) {
    toast.warning('请先选择需要操作的数据')
    return
  }
  useFaModal().confirm({
    title: '确认信息',
    content: `确定要批量补单吗？`,
    onConfirm: () => api.batchRepair({ ids }).then(() => {
      getDataList()
      toast.success('批量补单成功')
    }),
  })
}

function onBatchReNotification() {
  const ids = batch.value.selectionDataList.map((item: any) => item.trade_no)
  if (!ids.length) {
    toast.warning('请先选择需要操作的数据')
    return
  }
  useFaModal().confirm({
    title: '确认信息',
    content: `确定要批量重新通知订单吗？`,
    onConfirm: () => api.batchReNotification({ ids }).then(() => {
      getDataList()
      toast.success('批量重新通知成功')
    }),
  })
}

function onBatchDelete() {
  const ids = batch.value.selectionDataList.map((item: any) => item.trade_no)
  if (!ids.length) {
    toast.warning('请先选择需要操作的数据')
    return
  }
  useFaModal().confirm({
    title: '确认信息',
    content: `确定要批量删除订单及其关联信息吗？该操作不可撤销！`,
    onConfirm: () => api.batchDelete({ ids }).then(() => {
      getDataList()
      toast.success('批量删除成功')
    }),
  })
}

function handleMoreOperating(command: string, row: any) {
  const actions: Record<string, () => void> = {
    reNotification: () => onReNotification(row.trade_no),
    funds: () => router.push({ name: 'CapitalWalletRecord', state: { trade_no: row.trade_no } }),
    delete: () => onDel(row.trade_no),
    freezeOrThaw: () => onFreezeOrThaw(row.trade_no, stateUtils.isFrozen(row.trade_state) ? 'TRADE_SUCCESS' : 'TRADE_FROZEN'),
  }
  actions[command]?.()
}
</script>

<template>
  <div :class="{ 'absolute-container': tableAutoHeight }">
    <FaPageMain :class="{ 'flex-1 overflow-auto': tableAutoHeight }" :main-class="{ 'flex-1 flex flex-col overflow-auto': tableAutoHeight }">
      <FaSearchBar :show-toggle="false">
        <template #default="{ fold, toggle }">
          <ElForm :model="search" size="default" label-width="100px" inline-message inline class="search-form">
            <ElFormItem label="五合一单号">
              <template #label>
                五合一单号
                <ElTooltip content="输入单号，系统将精确匹配：平台订单号/商户订单号/上游订单号/真实交易流水号/渠道交易流水号中的任意一个，不支持模糊查询" placement="top">
                  <ElIcon class="text-gray-400">
                    <span class="text-xs">?</span>
                  </ElIcon>
                </ElTooltip>
              </template>
              <ElInput v-model="search.fuzzy_trade_no" placeholder="请输入单号，精确匹配平台/商户/上游/(真实/渠道)流水号之一，不支持模糊查询" clearable @keydown.enter="currentChange()" @clear="currentChange()" />
            </ElFormItem>
            <ElFormItem v-show="!fold" label="平台订单号">
              <ElInput v-model="search.trade_no" placeholder="请输入平台订单号，支持模糊查询" clearable maxlength="28" @keydown.enter="currentChange()" @clear="currentChange()" />
            </ElFormItem>
            <ElFormItem v-show="!fold" label="商户订单号">
              <ElInput v-model="search.out_trade_no" placeholder="请输入商户订单号，支持模糊查询" clearable @keydown.enter="currentChange()" @clear="currentChange()" />
            </ElFormItem>
            <ElFormItem v-show="!fold" label="上游订单号">
              <ElInput v-model="search.api_trade_no" placeholder="请输入上游订单号，支持模糊查询" clearable @keydown.enter="currentChange()" @clear="currentChange()" />
            </ElFormItem>
            <ElFormItem v-show="!fold" label="真实流水号">
              <ElInput v-model="search.bill_trade_no" placeholder="请输入真实交易流水号，支持模糊查询" clearable @keydown.enter="currentChange()" @clear="currentChange()" />
            </ElFormItem>
            <ElFormItem v-show="!fold" label="渠道流水号">
              <ElInput v-model="search.mch_trade_no" placeholder="请输入渠道交易流水号，支持模糊查询" clearable @keydown.enter="currentChange()" @clear="currentChange()" />
            </ElFormItem>
            <ElFormItem label="商户编号">
              <ElInput v-model="search.merchant_number" placeholder="请输入商户编号" clearable maxlength="24" @keydown.enter="currentChange()" @clear="currentChange()" />
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
            <ElFormItem v-show="!fold" label="支付通道编码">
              <ElInput v-model="search.payment_channel_code" placeholder="请输入支付通道编码" clearable @keydown.enter="currentChange()" @clear="currentChange()" />
            </ElFormItem>
            <ElFormItem v-show="!fold" label="通道子账户ID">
              <ElInput v-model="search.payment_channel_account_id" type="number" placeholder="请输入支付通道子账户ID" clearable @keydown.enter="currentChange()" @clear="currentChange()" />
            </ElFormItem>
            <ElFormItem v-show="!fold" label="商品名称">
              <ElInput v-model="search.subject" placeholder="请输入商品名称，支持模糊查询" clearable @keydown.enter="currentChange()" @clear="currentChange()" />
            </ElFormItem>
            <ElFormItem v-show="!fold" label="订单金额">
              <ElInput v-model="search.total_amount" placeholder="请输入订单金额" clearable @keydown.enter="currentChange()" @clear="currentChange()" />
            </ElFormItem>
            <ElFormItem v-show="!fold" label="用户付款金额">
              <ElInput v-model="search.receipt_amount" placeholder="请输入用户在交易中支付的金额" clearable @keydown.enter="currentChange()" @clear="currentChange()" />
            </ElFormItem>
            <ElFormItem v-show="!fold" label="商户分成金额">
              <ElInput v-model="search.buyer_pay_amount" placeholder="请输入商户实收金额(分成后)" clearable @keydown.enter="currentChange()" @clear="currentChange()" />
            </ElFormItem>
            <ElFormItem v-show="!fold" label="交易创建时间">
              <ElDatePicker v-model="search.create_time" type="datetimerange" start-placeholder="开始时间" end-placeholder="结束时间" value-format="YYYY-MM-DD HH:mm:ss.000Z" format="YYYY-MM-DD HH:mm:ss" date-format="YYYY-MM-DD" time-format="HH:mm:ss" :shortcuts="dateTimeShortcuts" @change="currentChange()" />
            </ElFormItem>
            <ElFormItem v-show="!fold" label="交易付款时间">
              <ElDatePicker v-model="search.payment_time" type="datetimerange" start-placeholder="开始时间" end-placeholder="结束时间" value-format="YYYY-MM-DD HH:mm:ss.000Z" format="YYYY-MM-DD HH:mm:ss" date-format="YYYY-MM-DD" time-format="HH:mm:ss" :shortcuts="dateTimeShortcuts" @change="currentChange()" />
            </ElFormItem>
            <ElFormItem v-show="!fold" label="交易状态">
              <ElSelect v-model="search.trade_state" placeholder="请选择交易状态" @change="currentChange()">
                <ElOption label="全部" value="" />
                <ElOption label="等待付款" value="WAIT_BUYER_PAY" />
                <ElOption label="交易关闭" value="TRADE_CLOSED" />
                <ElOption label="交易成功" value="TRADE_SUCCESS" />
                <ElOption label="交易完结" value="TRADE_FINISHED" />
                <ElOption label="交易冻结" value="TRADE_FROZEN" />
              </ElSelect>
            </ElFormItem>
            <ElFormItem v-show="!fold" label="结算状态">
              <ElSelect v-model="search.settle_state" placeholder="请选择结算状态" @change="currentChange()">
                <ElOption label="全部" value="" />
                <ElOption label="待结算" value="PENDING" />
                <ElOption label="结算中" value="PROCESSING" />
                <ElOption label="已结算" value="COMPLETED" />
                <ElOption label="结算失败" value="FAILED" />
              </ElSelect>
            </ElFormItem>
            <ElFormItem v-show="!fold" label="通知状态">
              <ElRadioGroup v-model="search.notify_state" @change="currentChange()">
                <ElRadioButton value="">
                  全部
                </ElRadioButton>
                <ElRadioButton value="SUCCESS">
                  成功
                </ElRadioButton>
                <ElRadioButton value="FAILED">
                  失败
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
      <ElButtonGroup v-show="batch.selectionDataList.length">
        <ElButton @click="onBatchRepair()">
          批量补单
        </ElButton>
        <ElButton @click="onBatchReNotification()">
          批量重新通知
        </ElButton>
        <ElButton v-auth="['super_admin', 'admin']" @click="onBatchDelete()">
          批量删除
        </ElButton>
      </ElButtonGroup>
      <ElTable v-loading="loading" class="my-4" :data="dataList" stripe highlight-current-row border height="100%" @sort-change="sortChange" @selection-change="batch.selectionDataList = $event">
        <ElTableColumn type="selection" align="center" fixed />
        <ElTableColumn width="290">
          <template #header>
            平台订单号<br>商户订单号
          </template>
          <template #default="{ row }">
            {{ row.trade_no }}<FaButton variant="outline" size="icon" class="ml-1 h-5 w-5 text-gray-500 hover:text-gray-700" @click="copy(row.trade_no)">
              <FaIcon :name="copied && text === row.trade_no ? 'i-ri:check-line' : 'i-ri:file-copy-2-line'" class="h-4 w-4" :class="[copied && text === row.trade_no && 'text-green-500']" />
            </FaButton><br>{{ row.out_trade_no }}<FaButton variant="outline" size="icon" class="ml-1 h-5 w-5 text-gray-500 hover:text-gray-700" @click="copy(row.out_trade_no)">
              <FaIcon :name="copied && text === row.out_trade_no ? 'i-ri:check-line' : 'i-ri:file-copy-2-line'" class="h-4 w-4" :class="[copied && text === row.out_trade_no && 'text-green-500']" />
            </FaButton>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="merchant.merchant_number" label="商户编号" width="200" />
        <ElTableColumn min-width="150">
          <template #header>
            支付方式(通道编码)<br>支付通道子账户
          </template>
          <template #default="{ row }">
            {{ row.payment_type_text }} ({{ row.payment_channel_account?.payment_channel?.code ?? '未知' }})<br>[{{ row.payment_channel_account_id }}] {{ row.payment_channel_account?.name ?? '未知' }}
          </template>
        </ElTableColumn>
        <ElTableColumn min-width="100">
          <template #header>
            商品名称<br>订单金额
          </template>
          <template #default="{ row }">
            {{ row.subject }}<br>￥{{ row.total_amount }}
          </template>
        </ElTableColumn>
        <ElTableColumn min-width="100">
          <template #header>
            支付IP地址<br>用户支付金额
          </template>
          <template #default="{ row }">
            {{ row.buyer.ip }}<FaTooltip text="拉黑该IP地址">
              <FaButton variant="outline" size="icon" class="ml-1 h-5 w-5 text-gray-500 hover:text-gray-700" @click="onAddBlacklist(row.buyer.ip, 'IP_ADDRESS')">
                <FaIcon name="i-ri:user-unfollow-line" />
              </FaButton>
            </FaTooltip><br>￥{{ row.buyer_pay_amount }}
          </template>
        </ElTableColumn>
        <ElTableColumn width="200">
          <template #header>
            支付状态[结算状态]<br>通知状态/付款耗时
          </template>
          <template #default="{ row }">
            {{ row.trade_state_text }} <span class="text-orange">[{{ row.settle_state_text }}]</span>
            <div v-if="row.payment_time">
              <span :class="row.notify_state === 'SUCCESS' ? 'text-green' : 'text-red'">{{ row.notify_state_text }}</span> <span class="text-blue">[{{ row.payment_duration }}]</span>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn width="165">
          <template #header>
            交易创建时间<br>交易付款时间
          </template>
          <template #default="{ row }">
            {{ row.create_time }}<br>{{ row.payment_time ?? '' }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="250" align="center">
          <template #default="{ row }">
            <FaAuth :value="['super_admin', 'admin']">
              <ElSpace>
                <ElButton type="primary" size="small" plain @click="onDetail(row.trade_no)">
                  详情
                </ElButton>
                <ElButton v-if="stateUtils.isSuccess(row.trade_state)" type="info" size="small" plain @click="onRefund(row.trade_no)">
                  退款
                </ElButton>
                <ElButton v-if="stateUtils.isWaitPayOrClosed(row.trade_state)" type="success" size="small" plain @click="onRepair(row.trade_no)">
                  补单
                </ElButton>
                <ElDropdown @command="handleMoreOperating($event, row)">
                  <ElButton size="small">
                    更多
                    <FaIcon name="i-ep:arrow-down" class="el-icon--right" />
                  </ElButton>
                  <template #dropdown>
                    <ElDropdownMenu>
                      <ElDropdownItem v-if="stateUtils.isSuccessOrFinish(row.trade_state)" command="reNotification">
                        重新通知
                      </ElDropdownItem>
                      <ElDropdownItem command="funds">
                        资金动向
                      </ElDropdownItem>
                      <ElDropdownItem command="delete" divided>
                        删除订单
                      </ElDropdownItem>
                      <ElDropdownItem v-if="stateUtils.isSuccessOrFrozen(row.trade_state)" command="freezeOrThaw">
                        {{ stateUtils.isFrozen(row.trade_state) ? '解冻' : '冻结' }}订单
                      </ElDropdownItem>
                    </ElDropdownMenu>
                  </template>
                </ElDropdown>
              </ElSpace>

              <template #no-auth>
                <ElSpace>
                  <ElButton type="primary" size="small" plain @click="onDetail(row.trade_no)">
                    详情
                  </ElButton>
                  <ElButton size="small" plain @click="onReNotification(row)">
                    重新通知
                  </ElButton>
                </ElSpace>
              </template>
            </FaAuth>
          </template>
        </ElTableColumn>
      </ElTable>
      <ElPagination :current-page="pagination.page" :total="pagination.total" :page-size="pagination.size" :page-sizes="pagination.sizes" :layout="pagination.layout" :hide-on-single-page="false" class="pagination" background @current-change="currentChange" @size-change="sizeChange" />
    </FaPageMain>
  </div>
</template>
