import encryptionApi from '../encryptionApi'
import api from '../index'

export default {
  // 登录
  login: (data: {
    account: string
    password: string
    totp_code: string
  }) => encryptionApi.post('account/login', data),

  // 获取权限
  permission: () => api.get('account/permission'),

  // 获取用户个人信息
  getProfile: () => api.get('account/getProfile'),

  // 修改基本信息
  basicEdit: (data: {
    nickname: string
    email: string | null
  }) => encryptionApi.post('account/basicEdit', data),

  // 修改密码
  passwordEdit: (data: {
    type: 'login' | 'fund'
    password: string
    newPassword: string
  }) => encryptionApi.post('account/passwordEdit', data),

  // 生成TOTP
  totpGenerate: (data?: { code: string }) => api.post('account/totpGenerate', data),

  // 验证TOTP
  totpVerify: (data: { code: string }) => api.post('account/totpVerify', data),

  // 禁用TOTP
  totpDisable: (data: { code: string }) => api.post('account/totpDisable', data),

  // 获取标签栏固定标签页数据
  tabbar: () => api.get('user/tabbar'),

  // 修改标签栏固定标签页数据
  tabbarEdit: (tabbar: string) => encryptionApi.post('user/tabbar/edit', {
    tabbar,
  }),

  // 获取收藏夹
  favorites: () => api.get('user/favorites'),

  // 修改收藏夹
  favoritesEdit: (favorites: string) => encryptionApi.post('user/favorites/edit', {
    favorites,
  }),
}
