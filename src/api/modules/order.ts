import encryptionApi from '../encryptionApi'
import api from '../index'

export default {
  list: (data: {
    from: number
    limit: number
    sort?: string
    order?: string
  }) => api.get('order', {
    params: data,
  }),

  detail: (trade_no: string) => api.get('order/detail', {
    params: {
      trade_no,
    },
  }),

  refundInfo: (trade_no: string) => api.get('order/refundInfo', {
    params: {
      trade_no,
    },
  }),

  refund: (data: {
    trade_no: string
    amount: number
    refund_type: string
    fee_bearer: string
    reason: string
  }) => encryptionApi.post('order/refund', data),

  repair: (trade_no: string) => api.post('order/repair', {
    trade_no,
  }),

  reNotification: (data: {
    trade_no: string
    type: string
  }) => api.post('order/reNotification', data),

  delete: (trade_no: string) => api.post('order/delete', {
    trade_no,
  }),

  freezeOrThaw: (data: {
    trade_no: string
    target_state: string
  }) => api.post('order/freezeOrThaw', data),

  batchRepair: (data: {
    ids: (number | string)[]
  }) => api.post('order/batchRepair', data),

  batchReNotification: (data: {
    ids: (number | string)[]
  }) => api.post('order/batchReNotification', data),

  batchDelete: (data: {
    ids: (number | string)[]
  }) => api.post('order/batchDelete', data),
}
