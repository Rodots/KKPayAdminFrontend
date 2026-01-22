import apiUser from '@/api/modules/user'
import router from '@/router'
import eventBus from '@/utils/eventBus'

export const useUserStore = defineStore(
  // 唯一ID
  'user',
  () => {
    const settingsStore = useSettingsStore()
    const tabbarStore = useTabbarStore()
    const routeStore = useRouteStore()
    const menuStore = useMenuStore()

    const account = ref(localStorage.getItem('account') ?? '')
    const nickname = ref(localStorage.getItem('nickname') ?? '')
    const token = ref(localStorage.getItem('token') ?? '')
    const avatar = ref(localStorage.getItem('avatar') ?? '')
    const email = ref(localStorage.getItem('email') ?? '')
    const role_name = ref(localStorage.getItem('role_name') ?? '')
    const totpState = ref(false)
    const permissions = ref<string[]>([])
    const isLogin = computed(() => {
      if (token.value) {
        return true
      }
      return false
    })

    // 登录
    async function login(data: {
      account: string
      password: string
      totp_code: string
    }) {
      const res = await apiUser.login(data)
      localStorage.setItem('account', res.data.account)
      localStorage.setItem('nickname', res.data.nickname)
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('avatar', res.data.avatar)
      localStorage.setItem('email', res.data.email)
      localStorage.setItem('role_name', res.data.role_name)
      account.value = res.data.account
      nickname.value = res.data.nickname
      token.value = res.data.token
      avatar.value = res.data.avatar
      email.value = res.data.email ?? ''
      role_name.value = res.data.role_name
      // eventBus.emit('relogin-success')
    }

    // 手动登出
    function logout(redirect = router.currentRoute.value.fullPath) {
      localStorage.removeItem('token')
      token.value = ''
      router.push({
        name: 'login',
        query: {
          ...(redirect !== settingsStore.settings.home.fullPath && router.currentRoute.value.name !== 'login' && { redirect }),
        },
      }).then(logoutCleanStatus)
    }
    // 请求登出
    function requestLogout() {
      if (settingsStore.settings.app.loginExpiredMode === 'redirect' || !routeStore.isGenerate) {
        localStorage.removeItem('token')
        token.value = ''
        router.push({
          name: 'login',
          query: {
            ...(
              router.currentRoute.value.fullPath !== settingsStore.settings.home.fullPath
              && router.currentRoute.value.name !== 'login'
              && {
                redirect: router.currentRoute.value.fullPath,
              }
            ),
          },
        }).then(logoutCleanStatus)
      }
      else {
        // 此处仅清除 localStorage 中登录状态的变量，以保证在弹出登录窗口模式下页面展示依旧正常
        localStorage.removeItem('token')
        eventBus.emit('global-login-again-visible')
      }
    }
    // 登出后清除状态
    function logoutCleanStatus() {
      localStorage.removeItem('account')
      localStorage.removeItem('nickname')
      localStorage.removeItem('avatar')
      localStorage.removeItem('email')
      account.value = ''
      nickname.value = ''
      avatar.value = ''
      email.value = ''
      role_name.value = ''
      permissions.value = []
      settingsStore.updateSettings({}, true)
      tabbarStore.clean()
      routeStore.removeRoutes()
      menuStore.setActived(0)
    }

    // 获取权限
    async function getPermissions() {
      const res = await apiUser.permission()
      permissions.value = res.data.permissions
    }

    // 获取个人信息
    async function getProfile() {
      const res = await apiUser.getProfile()
      if (res.data.account) {
        account.value = res.data.account
        nickname.value = res.data.nickname
        avatar.value = res.data.avatar
        email.value = res.data.email ?? ''
        role_name.value = res.data.role_name
        totpState.value = res.data.totp_state
      }
    }

    // 修改基本信息
    async function editBasic(data: {
      nickname: string
      email: string | null
    }) {
      const res = await apiUser.basicEdit(data)
      localStorage.setItem('nickname', res.data.nickname)
      localStorage.setItem('email', res.data.email ?? '')
      localStorage.setItem('avatar', res.data.avatar)
      nickname.value = res.data.nickname
      email.value = res.data.email ?? ''
      avatar.value = res.data.avatar
    }

    // 修改登录/资金密码
    async function editPassword(data: {
      type: 'login' | 'fund'
      password: string
      newPassword: string
    }) {
      await apiUser.passwordEdit(data)
    }

    // 生成TOTP
    async function setupTOTP(data?: { code: string }) {
      return await apiUser.totpGenerate(data)
    }

    // 验证TOTP
    async function verifyTOTP(data: { code: string }) {
      return await apiUser.totpVerify(data)
    }

    // 禁用TOTP
    async function disableTOTP(data: { code: string }) {
      return await apiUser.totpDisable(data)
    }

    return {
      account,
      nickname,
      token,
      avatar,
      email,
      role_name,
      totpState,
      permissions,
      isLogin,
      login,
      logout,
      requestLogout,
      getPermissions,
      getProfile,
      editBasic,
      editPassword,
      setupTOTP,
      verifyTOTP,
      disableTOTP,
    }
  },
)
