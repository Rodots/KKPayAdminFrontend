import api from '../index'

/** 图表数据值类型 - 近七日交易额 */
export type WeeklyTransactionRow = [string, string, string, string, string]

/** 图表数据值类型 - 近七日订单数 */
export type WeeklyOrderRow = [string, string, number, number]

/** 图表数据结构 */
export interface ChartData<T> {
  type: string
  data: {
    fields: string[]
    values: T[]
  }
}

/** 仪表盘响应数据类型 */
export interface DashboardData {
  merchant_count: number
  available_balance_sum: string
  unavailable_balance_sum: string
  margin_sum: string
  prepaid_sum: string
  withdrawal_completed_sum: string
  order_count: number
  today_order_count: number
  today_success_order_count: number
  today_success_rate: number
  today_profit_sum: string
  today_risk_count: number
  charts: {
    weekly_transaction: ChartData<WeeklyTransactionRow>
    weekly_order: ChartData<WeeklyOrderRow>
  }
}

export default {
  /** 获取仪表盘数据 */
  getData: () => api.get<DashboardData>('index/index'),
}
