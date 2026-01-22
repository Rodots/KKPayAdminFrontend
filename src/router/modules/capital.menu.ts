import type { RouteRecordRaw } from 'vue-router'

function Layout() {
  return import('@/layouts/index.vue')
}

const routes: RouteRecordRaw = {
  path: '/capital',
  component: Layout,
  redirect: '/capital/wallet_record',
  name: 'Capital',
  meta: {
    title: '资金管理',
    icon: 'i-ri:money-cny-box-line',
    activeIcon: 'i-ri:money-cny-box-fill',
    auth: ['super_admin', 'admin', 'service'],
  },
  children: [
    {
      path: 'withdrawal',
      name: 'CapitalWithdrawal',
      component: () => import('@/views/capital/withdrawal/list.vue'),
      meta: {
        title: '提款管理',
      },
    },
    {
      path: 'wallet_record',
      name: 'CapitalWalletRecord',
      component: () => import('@/views/capital/wallet_record/list.vue'),
      meta: {
        title: '余额变动记录',
      },
    },
    {
      path: 'wallet_prepaid_record',
      name: 'CapitalWalletPerpaidRecord',
      component: () => import('@/views/capital/wallet_prepaid_record/list.vue'),
      meta: {
        title: '预付金变动记录',
      },
    },
  ],
}

export default routes
