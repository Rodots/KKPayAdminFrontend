import encryptionApi from '../encryptionApi'
import api from '../index'

export default {
  blackList: (data: {
    from: number
    limit: number
  }) => api.get('risk/blackList', {
    params: data,
  }),

  // 获取风控日志列表
  logList: (data: {
    from: number
    limit: number
  }) => api.get('risk/log', {
    params: data,
  }),

  blackCreate: (data: any) => encryptionApi.post('risk/blackCreate', data),

  blackDel: (id: number) => api.post('risk/delBlack', {
    id,
  }),

  batchBlackDel: (data: {
    ids: (number | string)[]
  }) => api.post('risk/batchDelBlack', data),
}
