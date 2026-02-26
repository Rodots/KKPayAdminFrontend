import encryptionApi from '../encryptionApi'
import api from '../index'

export default {
  // 【支付通道】
  // 获取支付通道列表
  channelList: (data: {
    from: number
    limit: number
    sort?: string
    order?: string
  }) => api.get('paymentChannel', {
    params: data,
  }),

  // 获取单个支付通道详情
  channelDetail: (id: number | string) => api.get('paymentChannel/detail', {
    params: {
      id,
    },
  }),

  // 创建支付通道（使用加密传输）
  channelCreate: (data: any) => encryptionApi.post('paymentChannel/create', data),

  // 编辑支付通道（使用加密传输）
  channelEdit: (data: any) => encryptionApi.post('paymentChannel/edit', data),

  // 切换支付通道状态（支持批量）
  channelChangeStatus: (data: {
    ids: (number | string)[]
    status: boolean
  }) => api.post('paymentChannel/changeStatus', data),

  // 复制支付通道
  channelCopy: (data: {
    id: number | string
    number: number
  }) => api.post('paymentChannel/copy', data),

  // 删除支付通道（支持批量）
  channelDelete: (data: {
    ids: (number | string)[]
  }) => api.post('paymentChannel/delete', data),

  // 获取支付通道配置表单
  getChannelConfigForm: (channelId: number | string) => api.get('paymentChannel/configForm', {
    params: {
      channel_id: channelId,
    },
  }),

  // 【支付通道子账户】
  // 获取支付通道子账户列表
  channelAccountList: (data: {
    from: number
    limit: number
    sort?: string
    order?: string
    channel_id?: number
  }) => api.get('paymentChannelAccount', {
    params: data,
  }),

  // 获取单个支付通道子账户详情
  channelAccountDetail: (id: number | string) => api.get('paymentChannelAccount/detail', {
    params: {
      id,
    },
  }),

  // 创建支付通道子账户（使用加密传输）
  channelAccountCreate: (data: any) => encryptionApi.post('paymentChannelAccount/create', data),

  // 编辑支付通道子账户（使用加密传输）
  channelAccountEdit: (data: any) => encryptionApi.post('paymentChannelAccount/edit', data),

  // 切换支付通道子账户状态（支持批量）
  channelAccountChangeStatus: (data: {
    ids: (number | string)[]
    status: boolean
    field?: string
  }) => api.post('paymentChannelAccount/changeStatus', data),

  // 复制支付通道子账户
  channelAccountCopy: (data: {
    id: number | string
    number: number
  }) => api.post('paymentChannelAccount/copy', data),

  // 删除支付通道子账户（支持批量）
  channelAccountDelete: (data: {
    ids: (number | string)[]
  }) => api.post('paymentChannelAccount/delete', data),

  // 发起支付测试
  paymentTest: (data: {
    id: number
    amount: string
    subject: string
  }) => api.post('paymentChannelAccount/paymentTest', data),
}
