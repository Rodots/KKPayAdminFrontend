import encryptionApi from '../encryptionApi'
import api from '../index'

export default {
  // 获取商户列表
  list: (data: {
    from: number
    limit: number
    sort?: string
    order?: string
  }) => api.get('merchant', {
    params: data,
  }),

  // 获取商户操作日志列表
  logList: (data: {
    from: number
    limit: number
    sort?: string
    order?: string
  }) => api.get('merchant/log', {
    params: data,
  }),

  // 获取单个商户详情
  detail: (id: number | string) => api.get('merchant/detail', {
    params: {
      id,
    },
  }),

  // 创建商户（使用加密传输）
  create: (data: any) => encryptionApi.post('merchant/create', data),

  // 编辑商户（使用加密传输）
  edit: (data: any) => encryptionApi.post('merchant/edit', data),

  // 切换商户启用/禁用状态
  changeStatus: (data: {
    id: number | string
    status: boolean
  }) => api.post('merchant/changeStatus', data),

  // 切换商户风险状态
  changeRiskStatus: (data: {
    id: number | string
    risk_status: boolean
  }) => api.post('merchant/changeRiskStatus', data),

  // 重置商户登录密码
  resetPassword: (data: {
    id: number | string
    password?: string
  }) => api.post('merchant/resetPassword', data),

  // 模拟商户登录
  simulateLogin: (data: {
    id: number | string
  }) => api.post('merchant/simulateLogin', data),

  // 重试结算失败的订单
  retrySettlement: (data: {
    id: number | string
    days: number
  }) => api.post('merchant/retrySettlement', data),

  // 删除商户
  delete: (data: {
    id: number | string
  }) => api.post('merchant/delete', data),

  // 批量变更商户状态
  batchChangeStatus: (data: {
    ids: (number | string)[]
    status: number
  }) => api.post('merchant/batchChangeStatus', data),

  // 余额增减
  adjustBalance: (data: {
    id: number | string
    balance_type: 'available' | 'unavailable' | 'prepaid'
    amount: number
    remark: string
  }) => encryptionApi.post('capital/adjustBalance', data),

  // 商户清账
  settleAccount: (data: {
    id: number | string
    payee_id: number | string
  }) => api.post('capital/settleAccount', data),

  // 获取回收站列表
  recycleBinList: () => api.get('merchant/recycleBin'),

  // 恢复已删除的商户
  recover: (data: {
    id: number | string
  }) => api.post('merchant/recover', data),

  // 收款人列表
  payeeList: (data: {
    from: number
    limit: number
    merchant_number?: string
    created_at?: string[]
  }) => api.get('merchant/payeeList', {
    params: data,
  }),

  // 新增收款人（加密传输）
  payeeCreate: (data: any) => encryptionApi.post('merchant/payeeCreate', data),

  // 编辑收款人（加密传输）
  payeeEdit: (data: any) => encryptionApi.post('merchant/payeeEdit', data),

  // 删除收款人
  payeeDelete: (data: {
    id: number | string
  }) => api.post('merchant/payeeDelete', data),

  // 收款人详情
  payeeDetail: (id: number | string) => api.get('merchant/payeeDetail', {
    params: {
      id,
    },
  }),

  // 商户收款人列表（不分页）
  payeeListByMerchant: (data: {
    merchant_id: number | string
  }) => api.get('merchant/payeeListByMerchant', {
    params: data,
  }),

  // 设置默认收款人
  payeeSetDefault: (data: {
    id: number | string
  }) => api.post('merchant/payeeSetDefault', data),

  // 获取商户密钥详情
  encryptionDetail: (id: number | string) => api.get('merchant/encryptionDetail', {
    params: { id },
  }),

  // 修改商户密钥配置（加密传输）
  encryptionEdit: (data: {
    id: number | string
    mode: 'open' | 'only_xxh' | 'only_sha3' | 'only_sm3' | 'only_rsa2'
    hash_key?: string
    aes_key?: string
  }) => encryptionApi.post('merchant/encryptionEdit', data),

  // 生成 RSA2 密钥对
  encryptionGenerateRsa2: (id: number | string) => api.get('merchant/encryptionGenerateRsa2', {
    params: { id },
  }),

  // ==================== 商户通道白名单管理 ====================
  // 获取商户通道白名单配置详情
  channelWhitelistDetail: (id: number | string) => api.get('merchant/channelWhitelistDetail', {
    params: { id },
  }),

  // 保存商户通道白名单配置（全量覆写）
  channelWhitelistSave: (data: {
    id: number | string
    channels: Array<{
      channel_id: number
      rate?: number | null
      use_all_accounts?: boolean
      accounts?: Array<{ account_id: number, rate?: number | null }>
    }>
  }) => api.post('merchant/channelWhitelistSave', data),

  // 清空商户通道白名单配置
  channelWhitelistClear: (data: {
    id: number | string
  }) => api.post('merchant/channelWhitelistClear', data),
}
