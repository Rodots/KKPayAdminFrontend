import type { RouteRecordRaw } from 'vue-router'

function Layout() {
  return import('@/layouts/index.vue')
}

const routes: RouteRecordRaw = {
  path: '/merchant',
  component: Layout,
  redirect: '/merchant/manager',
  name: 'Merchant',
  meta: {
    title: '商户管理',
    icon: 'i-ri:team-line',
    activeIcon: 'i-ri:team-fill',
    auth: ['super_admin', 'admin', 'service'],
  },
  children: [
    {
      path: 'manager',
      name: 'MerchantManager',
      component: () => import('@/views/merchant/manager/list.vue'),
      meta: {
        title: '商户列表',
      },
    },
    {
      path: 'log',
      name: 'MerchantLog',
      component: () => import('@/views/merchant/log/list.vue'),
      meta: {
        title: '商户操作日志',
      },
    },
    {
      path: 'payee',
      name: 'MerchantPayee',
      component: () => import('@/views/merchant/payee/list.vue'),
      meta: {
        title: '收款信息管理',
      },
    },
    {
      path: 'channel/:merchantId',
      name: 'MerchantChannel',
      component: () => import('@/views/merchant/channel/list.vue'),
      meta: {
        title: '商户通道管理',
        menu: false,
        activeMenu: '/merchant/manager',
      },
    },
  ],
}

export default routes
