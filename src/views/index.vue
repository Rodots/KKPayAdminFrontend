<script setup lang="ts">
import type { DashboardData } from '@/api/modules/dashboard'
import VChart from '@visactor/vchart'
import dashboardApi from '@/api/modules/dashboard'

defineOptions({ name: 'Dashboard' })

const { reload } = useMainPage()

// 仪表盘数据
const dashboardData = ref<DashboardData | null>(null)
const loading = ref(true)
const lastUpdateTime = ref(new Date())

// 图表实例
const transactionChartRef = ref<HTMLElement | null>(null)
const orderChartRef = ref<HTMLElement | null>(null)
let transactionChart: VChart | null = null
let orderChart: VChart | null = null

// 获取仪表盘数据
async function fetchData() {
  try {
    const res = await dashboardApi.getData()
    if (res.data) {
      dashboardData.value = res.data
      lastUpdateTime.value = new Date()
      // 渲染图表
      nextTick(() => {
        renderCharts()
      })
    }
  }
  finally {
    loading.value = false
  }
}

// 渲染图表
function renderCharts() {
  if (!dashboardData.value?.charts) {
    return
  }

  // 近七日交易额柱状图
  if (transactionChartRef.value && dashboardData.value.charts.weekly_transaction) {
    const chartData = dashboardData.value.charts.weekly_transaction.data.values.map(row => ({
      date: row[0],
      paymentType: row[1],
      amount: Number.parseFloat(row[2]),
      refund: Number.parseFloat(row[3]),
      profit: Number.parseFloat(row[4]),
    }))

    transactionChart?.release()
    transactionChart = new VChart({
      type: 'bar',
      data: [{ values: chartData }],
      xField: 'date',
      yField: 'amount',
      seriesField: 'paymentType',
      stack: true,
      legends: { visible: true, orient: 'top' },
      title: { visible: true, text: '近七日交易额' },
      tooltip: {
        mark: {
          content: [
            { key: '支付方式', value: (datum: any) => datum.paymentType },
            { key: '交易额', value: (datum: any) => `¥${datum.amount.toFixed(2)}` },
            { key: '退款', value: (datum: any) => `¥${datum.refund.toFixed(2)}` },
            { key: '利润', value: (datum: any) => `¥${datum.profit.toFixed(2)}` },
          ],
        },
      },
    }, { dom: transactionChartRef.value })
    transactionChart.renderSync()
  }

  // 近七日订单数柱状图
  if (orderChartRef.value && dashboardData.value.charts.weekly_order) {
    const chartData = dashboardData.value.charts.weekly_order.data.values.map(row => ({
      date: row[0],
      paymentType: row[1],
      totalCount: row[2],
      successCount: row[3],
    }))

    orderChart?.release()
    orderChart = new VChart({
      type: 'bar',
      data: [{ values: chartData }],
      xField: 'date',
      yField: 'totalCount',
      seriesField: 'paymentType',
      stack: true,
      legends: { visible: true, orient: 'top' },
      title: { visible: true, text: '近七日订单数' },
      tooltip: {
        mark: {
          content: [
            { key: '支付方式', value: (datum: any) => datum.paymentType },
            { key: '总订单', value: (datum: any) => datum.totalCount },
            { key: '成功订单', value: (datum: any) => datum.successCount },
          ],
        },
      },
    }, { dom: orderChartRef.value })
    orderChart.renderSync()
  }
}

// 手动刷新
function handleRefresh() {
  reload()
}

// 格式化金额
function formatMoney(value: string | number) {
  const num = typeof value === 'string' ? Number.parseFloat(value) : value
  return `¥${num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// 格式化数字
function formatNumber(value: number) {
  return value.toLocaleString('zh-CN')
}

// 根据时间段生成暖心问候语
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 9) {
    return '早上好，新的一天开始了 ☀️'
  }
  else if (hour >= 9 && hour < 12) {
    return '上午好，工作顺利 💼'
  }
  else if (hour >= 12 && hour < 14) {
    return '中午好，记得吃饭哦 🍜'
  }
  else if (hour >= 14 && hour < 17) {
    return '下午好，继续加油 💪'
  }
  else if (hour >= 17 && hour < 19) {
    return '傍晚好，用美食犒劳自己吧 🌅'
  }
  else if (hour >= 19 && hour < 22) {
    return '晚上好，放松一下吧 🌙'
  }
  else {
    return '夜深了，注意休息 😴'
  }
})

onMounted(() => {
  fetchData()
})

onBeforeUnmount(() => {
  transactionChart?.release()
  orderChart?.release()
})
</script>

<template>
  <div>
    <FaPageMain>
      <template #title>
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <FaBlurReveal class="p-8">
            <h2 class="text-4xl font-bold tracking-tighter">
              欢迎回来 👋
            </h2>
            <div class="mt-4 text-pretty text-xl tracking-tighter">
              {{ greeting }}
            </div>
          </FaBlurReveal>
          <FaButton variant="outline" :disabled="loading" class="self-start md:self-auto" @click="handleRefresh">
            <FaIcon name="i-ep:refresh" :class="{ 'animate-spin': loading }" />
            数据更新于<FaTimeAgo :date="lastUpdateTime" :update-interval="1000" :show-second="true" />
          </FaButton>
        </div>
      </template>

      <!-- 统计卡片区 - 骨架屏 -->
      <template v-if="loading">
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-4 sm:grid-cols-2">
          <FaCard v-for="i in 12" :key="i" class="w-full">
            <template #header>
              <div class="flex items-center justify-between">
                <div class="h-4 w-20 animate-pulse rounded bg-muted" />
                <div class="size-6 animate-pulse rounded bg-muted" />
              </div>
            </template>
            <template #footer>
              <div class="h-8 w-32 animate-pulse rounded bg-muted" />
            </template>
          </FaCard>
        </div>

        <!-- 图表区骨架 -->
        <div class="grid grid-cols-1 mt-6 gap-4 md:grid-cols-2">
          <FaCard v-for="i in 2" :key="i" class="w-full">
            <div class="h-160 animate-pulse rounded bg-muted" />
          </FaCard>
        </div>
      </template>

      <!-- 统计卡片区 - 真实数据 -->
      <template v-else-if="dashboardData">
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-4 sm:grid-cols-2">
          <!-- 第一行：商户与订单总览 -->
          <FaDigitalCard title="商户总数" icon="i-carbon:user-multiple" :digital="formatNumber(dashboardData.merchant_count)" />
          <FaDigitalCard title="可用余额总和" icon="i-carbon:wallet" :digital="formatMoney(dashboardData.available_balance_sum)" />
          <FaDigitalCard title="不可用余额总和" icon="i-carbon:warning-alt" :digital="formatMoney(dashboardData.unavailable_balance_sum)" />
          <FaDigitalCard title="保证金总和" icon="i-carbon:security" :digital="formatMoney(dashboardData.margin_sum)" />

          <!-- 第二行：资金相关 -->
          <FaDigitalCard title="预付总金额" icon="i-carbon:money" :digital="formatMoney(dashboardData.prepaid_sum)" />
          <FaDigitalCard title="已提款总金额" icon="i-carbon:currency-dollar" :digital="formatMoney(dashboardData.withdrawal_completed_sum)" />
          <FaDigitalCard title="订单总数" icon="i-carbon:document" :digital="formatNumber(dashboardData.order_count)" />
          <FaDigitalCard title="今日订单数" icon="i-carbon:calendar" :digital="formatNumber(dashboardData.today_order_count)" />

          <!-- 第三行：今日实时数据 -->
          <FaDigitalCard title="今日成功订单" icon="i-carbon:checkmark-filled" :digital="formatNumber(dashboardData.today_success_order_count)" />
          <FaDigitalCard title="今日成功率" icon="i-carbon:analytics" :digital="`${dashboardData.today_success_rate}%`" :trend="dashboardData.today_success_rate >= 70 ? 'up' : 'down'" />
          <FaDigitalCard title="今日利润" icon="i-carbon:growth" :digital="formatMoney(dashboardData.today_profit_sum)" />
          <FaDigitalCard title="今日触发风控次数" icon="i-carbon:warning" :digital="formatNumber(dashboardData.today_risk_count)" />
        </div>

        <!-- 图表区 -->
        <div class="grid grid-cols-1 mt-6 gap-4 md:grid-cols-2">
          <FaCard class="w-full">
            <div ref="transactionChartRef" class="h-160 w-full" />
          </FaCard>
          <FaCard class="w-full">
            <div ref="orderChartRef" class="h-160 w-full" />
          </FaCard>
        </div>
      </template>
    </FaPageMain>
    <FaCheckUpdates />
  </div>
</template>
