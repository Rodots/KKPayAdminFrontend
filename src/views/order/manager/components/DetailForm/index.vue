<script setup lang="ts">
import api from '@/api/modules/order'

const props = defineProps<{ tradeNo: string }>()
const emit = defineEmits<{
  reNotification: [type: string]
  refund: []
  freezeOrThaw: [state: string]
  delete: []
  close: []
  addBlacklist: [buyerId: string, type: string]
}>()

const loading = ref(true)
const orderDetail = ref<any>({})
const detailMode = ref<'order' | 'refund' | 'notification'>('order')

onMounted(getInfo)

function getInfo() {
  api.detail(props.tradeNo).then((res: any) => {
    orderDetail.value = res.data
  }).catch((err: any) => {
    console.error('获取订单详情失败:', err)
  }).finally(() => {
    loading.value = false
  })
}

defineExpose({ getInfo })

// 订单状态判断
const stateUtils = {
  isSuccess: (state: string) => state === 'TRADE_SUCCESS',
  isSuccessOrFinish: (state: string) => ['TRADE_SUCCESS', 'TRADE_REFUND', 'TRADE_FINISHED'].includes(state),
  isFrozenOrSuccess: (state: string) => ['TRADE_FROZEN', 'TRADE_SUCCESS', 'TRADE_REFUND', 'TRADE_FINISHED'].includes(state),
  isWaitPay: (state: string) => ['WAIT_PAY', 'WAIT_BUYER_PAY'].includes(state),
  isFrozen: (state: string) => state === 'TRADE_FROZEN',
}

const onReNotification = (type: string) => emit('reNotification', type)
const onRefund = () => emit('refund')
const onFreezeOrThaw = () => emit('freezeOrThaw', stateUtils.isFrozen(orderDetail.value.trade_state) ? 'TRADE_SUCCESS' : 'TRADE_FROZEN')
const onDelete = () => emit('delete')
const onClose = () => emit('close')
const onAddBlacklist = (buyerId: string, type: string) => emit('addBlacklist', buyerId, type)
</script>

<template>
  <div v-loading="loading">
    <FaDivider>
      <FaButtonGroup class="gap-0 space-x-[-1px]">
        <FaButton :variant="detailMode === 'order' ? 'default' : 'outline'" :class="{ 'z-1': detailMode === 'order' }" @click="detailMode = 'order'">
          订单信息
        </FaButton>
        <FaButton :variant="detailMode === 'refund' ? 'default' : 'outline'" :class="{ 'z-1': detailMode === 'refund' }" @click="detailMode = 'refund'">
          退款记录
        </FaButton>
        <FaButton :variant="detailMode === 'notification' ? 'default' : 'outline'" :class="{ 'z-1': detailMode === 'notification' }" @click="detailMode = 'notification'">
          通知记录
        </FaButton>
      </FaButtonGroup>
    </FaDivider>

    <!-- 订单信息 -->
    <div v-show="detailMode === 'order'">
      <ElDescriptions class="mt-5" :column="2" border>
        <template #title>
          基本信息
          <ElTag type="info" size="small">
            最后更新时间：{{ orderDetail.update_time ?? '未知' }}
          </ElTag>
        </template>
        <ElDescriptionsItem label="平台订单号">
          {{ orderDetail.trade_no ?? '无' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="商户订单号">
          {{ orderDetail.out_trade_no ?? '无' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="上游订单号">
          {{ orderDetail.api_trade_no ?? '无' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="真实交易流水号">
          {{ orderDetail.bill_trade_no ?? '无' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="渠道交易流水号">
          {{ orderDetail.mch_trade_no ?? '无' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="商户编号">
          {{ orderDetail.merchant?.merchant_number ?? '未知' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="支付方式">
          {{ orderDetail.payment_type_text ?? '未知' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="支付通道编码">
          {{ orderDetail.payment_channel_account?.payment_channel?.code ?? '未知' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="支付通道子账户">
          [{{ orderDetail.payment_channel_account?.id ?? '未知' }}] {{ orderDetail.payment_channel_account?.name ?? '未知' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="商品名称">
          {{ orderDetail.subject ?? '未知' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="订单金额">
          {{ orderDetail.total_amount ?? '无' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="用户支付金额">
          {{ orderDetail.buyer_pay_amount ?? '无' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="商户实收金额">
          {{ orderDetail.receipt_amount ?? '无' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="平台服务费金额">
          {{ orderDetail.fee_amount ?? '无' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="订单利润">
          {{ orderDetail.profit_amount ?? '无' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="结算周期">
          <template v-if="orderDetail.settle_cycle !== undefined && orderDetail.settle_cycle !== null">
            <span v-if="orderDetail.settle_cycle <= 0">实时</span>
            <span v-else>延迟{{ orderDetail.settle_cycle }}天</span>
          </template>
          <span v-else>未知</span>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="支付状态">
          <ElTag :type="orderDetail.trade_state === 'TRADE_SUCCESS' ? 'success' : (['TRADE_REFUND', 'TRADE_FINISHED', 'TRADE_FROZEN'].includes(orderDetail.trade_state) ? 'danger' : 'info')">
            {{ orderDetail.trade_state_text ?? '未知' }}
          </ElTag>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="结算状态">
          <ElTag type="success">
            {{ orderDetail.settle_state_text ?? '未知' }}
          </ElTag>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="通知状态">
          <ElTag :type="orderDetail.notify_state === 'SUCCESS' ? 'success' : 'danger'" class="mr-1">
            {{ orderDetail.notify_state_text ?? '未知' }}
          </ElTag>
          <ElTag type="info" size="small" class="ml-2">
            (已重试 {{ orderDetail.notify_retry_count ?? 0 }} 次)
          </ElTag>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="签名算法">
          {{ orderDetail.sign_type ?? '未知' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="订单创建时间">
          {{ orderDetail.create_time ?? '未知' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="订单支付时间">
          {{ orderDetail.payment_time ?? '待支付' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="订单付款耗时">
          {{ orderDetail.payment_duration ?? '未知' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="订单关闭时间">
          {{ orderDetail.close_time ?? '未设定' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="异步通知地址" :span="2">
          {{ orderDetail.notify_url ?? '未知' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="同步通知地址" :span="2">
          {{ orderDetail.return_url ?? '未知' }}
        </ElDescriptionsItem>
      </ElDescriptions>

      <ElDescriptions class="mt-5" :column="3" title="付款人信息" border>
        <ElDescriptionsItem label="用户行为摘要" :span="3">
          <span :class="orderDetail.user_behavior_summary?.is_blacklist ? 'font-bold' : ''">{{ orderDetail.user_behavior_summary?.message ?? '无记录' }}</span>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="user_id" :span="3">
          {{ orderDetail.buyer?.user_id ?? '无记录' }}
          <FaTooltip v-if="orderDetail.buyer?.user_id" text="拉黑该user_id">
            <FaButton variant="outline" size="icon" class="ml-1 h-5 w-5 text-gray-500 hover:text-gray-700" @click="onAddBlacklist(orderDetail.buyer.user_id, 'USER_ID')">
              <FaIcon name="i-ri:user-unfollow-line" />
            </FaButton>
          </FaTooltip>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="buyer_open_id" :span="3">
          {{ orderDetail.buyer?.buyer_open_id ?? '无记录' }}
          <FaTooltip v-if="orderDetail.buyer?.buyer_open_id" text="拉黑该open_id">
            <FaButton variant="outline" size="icon" class="ml-1 h-5 w-5 text-gray-500 hover:text-gray-700" @click="onAddBlacklist(orderDetail.buyer.buyer_open_id, 'USER_ID')">
              <FaIcon name="i-ri:user-unfollow-line" />
            </FaButton>
          </FaTooltip>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="限制付款人最小年龄">
          {{ orderDetail.buyer?.min_age === 0 ? '不限' : `${orderDetail.buyer?.min_age}岁` }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="手机号">
          {{ orderDetail.buyer?.phone ?? '无记录' }}
          <FaTooltip v-if="orderDetail.buyer?.phone" text="拉黑该手机号">
            <FaButton variant="outline" size="icon" class="ml-1 h-5 w-5 text-gray-500 hover:text-gray-700" @click="onAddBlacklist(orderDetail.buyer.phone, 'MOBILE')">
              <FaIcon name="i-ri:user-unfollow-line" />
            </FaButton>
          </FaTooltip>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="付款IP地址">
          {{ orderDetail.buyer?.ip ?? '无记录' }}
          <FaTooltip v-if="orderDetail.buyer?.ip" text="拉黑该IP地址">
            <FaButton variant="outline" size="icon" class="ml-1 h-5 w-5 text-gray-500 hover:text-gray-700" @click="onAddBlacklist(orderDetail.buyer.ip, 'IP_ADDRESS')">
              <FaIcon name="i-ri:user-unfollow-line" />
            </FaButton>
          </FaTooltip>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="真实姓名">
          {{ orderDetail.buyer?.real_name ?? '无记录' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="证件类型">
          {{ orderDetail.buyer?.card_type ?? '无记录' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="证件号">
          {{ orderDetail.buyer?.card_no ?? '无记录' }}
          <FaTooltip v-if="orderDetail.buyer?.card_no" text="拉黑该证件号">
            <FaButton variant="outline" size="icon" class="ml-1 h-5 w-5 text-gray-500 hover:text-gray-700" @click="onAddBlacklist(orderDetail.buyer.card_no, 'ID_CARD')">
              <FaIcon name="i-ri:user-unfollow-line" />
            </FaButton>
          </FaTooltip>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="浏览器UA" :span="3">
          <FaSortText :text="orderDetail.buyer?.user_agent ?? '无记录'" />
        </ElDescriptionsItem>
      </ElDescriptions>
    </div>

    <!-- 退款记录 -->
    <div v-show="detailMode === 'refund'">
      <ElTable v-loading="loading" class="my-4" :data="orderDetail.refunds" stripe highlight-current-row border>
        <ElTableColumn label="退款流水号" prop="id" width="165" />
        <ElTableColumn label="退款时间" prop="created_at" width="165" />
        <ElTableColumn label="发起类型" prop="initiate_type_text" width="82" />
        <ElTableColumn label="退款金额" prop="amount" min-width="82" />
        <ElTableColumn label="退还商户服务费" prop="refund_fee_amount" width="125" />
        <ElTableColumn label="接口退款流水号" prop="api_refund_no" min-width="130" show-overflow-tooltip />
        <ElTableColumn label="商户业务号" prop="out_biz_no" min-width="130" show-overflow-tooltip />
        <ElTableColumn label="理由" prop="reason" min-width="100" show-overflow-tooltip />
      </ElTable>
    </div>

    <!-- 通知记录 -->
    <div v-show="detailMode === 'notification'">
      <ElTable v-loading="loading" class="my-4" :data="orderDetail.notifications" stripe highlight-current-row border>
        <ElTableColumn label="通知流水号" prop="id" width="315" />
        <ElTableColumn label="通知时间" prop="created_at" width="165" />
        <ElTableColumn label="通知状态" width="93" align="center">
          <template #default="{ row }">
            <ElTag :type="row.status ? 'success' : 'danger'">
              {{ row.status ? '通知成功' : '通知失败' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="请求耗时" prop="request_duration" width="100" align="center">
          <template #default="{ row }">
            {{ row.request_duration }} ms
          </template>
        </ElTableColumn>
        <ElTableColumn label="响应内容" prop="response_content" show-overflow-tooltip />
      </ElTable>
      <FaDivider>此处只记录由服务器发出的请求，并只显示近20条</FaDivider>
    </div>

    <!-- 更多操作 -->
    <div class="el-descriptions__header mt-5">
      <div class="el-descriptions__title">
        更多操作
      </div>
    </div>
    <FaButtonGroup class="gap-0 space-x-[-1px]">
      <FaButton variant="outline" :disabled="!stateUtils.isSuccessOrFinish(orderDetail.trade_state)" @click="onReNotification('manual')">
        重新通知(手动异步)
      </FaButton>
      <FaButton variant="outline" :disabled="!stateUtils.isSuccessOrFinish(orderDetail.trade_state)" @click="onReNotification('server')">
        重新通知(由服务器异步)
      </FaButton>
      <FaButton variant="outline" :disabled="!stateUtils.isSuccessOrFinish(orderDetail.trade_state)" @click="onReNotification('sync')">
        重新通知(同步)
      </FaButton>
      <FaButton v-auth="['super_admin', 'admin']" variant="outline" :disabled="!stateUtils.isSuccess(orderDetail.trade_state)" @click="onRefund">
        发起退款
      </FaButton>
      <FaButton v-auth="['super_admin', 'admin']" variant="outline" :disabled="!stateUtils.isFrozenOrSuccess(orderDetail.trade_state)" @click="onFreezeOrThaw">
        {{ stateUtils.isFrozen(orderDetail.trade_state) ? '解冻' : '冻结' }}订单
      </FaButton>
      <FaButton variant="outline" :disabled="!stateUtils.isWaitPay(orderDetail.trade_state)" @click="onClose">
        关闭订单
      </FaButton>
      <FaButton v-auth="['super_admin', 'admin']" variant="outline" @click="onDelete">
        删除订单
      </FaButton>
    </FaButtonGroup>
  </div>
</template>

<style>
.el-descriptions__body .el-descriptions__table.is-bordered .el-descriptions__cell {
  padding: 6px 11px;
}
</style>
