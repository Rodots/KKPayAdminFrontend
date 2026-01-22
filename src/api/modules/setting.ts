import api from '../index'

export default {
  /**
   * 获取所有配置
   * @returns 所有配置组及其配置项
   */
  getAll: () => api.get('setting/index'),

  /**
   * 保存所有配置（批量保存多个配置组）
   * @param configs 配置数据对象，键为组别，值为该组的配置键值对
   */
  saveAll: (configs: Record<string, Record<string, string>>) => api.post('setting/save', { configs }),

  /**
   * 获取前端配置
   */
  frontendGet: () => api.get('setting/frontendGet'),
}
