import api from '../index'

export default {
  // 获取商户余额变动记录列表
  walletRecord: (data: {
    from: number
    limit: number
    sort?: string
    order?: string
  }) => api.get('capital/walletRecord', {
    params: data,
  }),

  // 获取商户预付金变动记录列表
  walletPrepaidRecord: (data: {
    from: number
    limit: number
    sort?: string
    order?: string
  }) => api.get('capital/walletPrepaidRecord', {
    params: data,
  }),

  // 获取提款记录列表
  withdrawalList: (data: {
    from: number
    limit: number
    sort?: string
    order?: string
    merchant_number?: string
    status?: string
    created_at?: string[]
  }) => api.get('capital/withdrawalList', {
    params: data,
  }),

  // 修改提款状态
  changeWithdrawalStatus: (data: {
    id: number | string
    status: 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REJECTED' | 'CANCELED'
    reason?: string
  }) => api.post('capital/changeWithdrawalStatus', data),
}
