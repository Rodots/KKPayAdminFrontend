import encryptionApi from '../encryptionApi'
import api from '../index'

export default {
  // 获取管理员列表（分页）
  list: (data: {
    from: number
    limit: number
    sort?: string
    order?: string
  }) => api.get('admin', {
    params: data,
  }),

  // 获取管理员操作日志列表（分页）
  logList: (data: {
    from: number
    limit: number
    sort?: string
    order?: string
  }) => api.get('admin/log', {
    params: data,
  }),

  // 获取管理员详情
  detail: (id: number | string) => api.get('admin/detail', {
    params: {
      id,
    },
  }),

  // 创建管理员
  create: (data: any) => encryptionApi.post('admin/create', data),

  // 编辑管理员
  edit: (data: any) => encryptionApi.post('admin/edit', data),

  // 修改管理员启用/禁用状态
  changeStatus: (data: {
    id: number | string
    status: boolean
  }) => api.post('admin/changeStatus', data),

  // 修改管理员风险状态（例如风控标记）
  changeRiskStatus: (data: {
    id: number | string
    risk_status: boolean
  }) => api.post('admin/changeRiskStatus', data),

  // 重置管理员密码（由后台生成或重置为默认）
  resetPassword: (data: {
    id: number | string
    type: string
  }) => api.post('admin/resetPassword', data),

  // 重置管理员的 TOTP（时间同步一次性密码）
  resetTotp: (data: {
    id: number | string
  }) => api.post('admin/resetTotp', data),

  // 批量变更管理员状态（例如批量启用/禁用）
  batchChangeStatus: (data: {
    ids: (number | string)[]
    status: number
  }) => api.post('admin/batchChangeStatus', data),
}
