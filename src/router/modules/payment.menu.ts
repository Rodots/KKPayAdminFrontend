import type { RouteRecordRaw } from 'vue-router'

function Layout() {
  return import('@/layouts/index.vue')
}

const routes: RouteRecordRaw = {
  path: '/payment',
  component: Layout,
  redirect: '/payment/channel',
  name: 'Payment',
  meta: {
    title: '支付管理',
    icon: 'i-ri:secure-payment-line',
    activeIcon: 'i-ri:secure-payment-fill',
    auth: ['super_admin', 'admin'],
  },
  children: [
    {
      path: 'channel',
      name: 'PaymentChannel',
      component: () => import('@/views/payment/channel/list.vue'),
      meta: {
        title: '支付通道',
        menu: false,
        activeMenu: '/payment',
        cache: 'PaymentChannelAccountList',
      },
    },
    {
      path: 'channel_account',
      name: 'PaymentChannelAccount',
      meta: {
        title: '支付通道子账户',
        menu: false,
      },
      children: [
        {
          path: ':channelId',
          name: 'PaymentChannelAccountList',
          component: () => import('@/views/payment/channel_account/list.vue'),
          meta: {
            title: '支付通道子账户',
            menu: false,
            activeMenu: '/payment',
            breadcrumb: false,
            cache: ['PaymentChannelAccountCreate', 'PaymentChannelAccountEdit'],
            noCache: 'PaymentChannel',
          },
        },
        {
          path: ':channelId/detail',
          name: 'PaymentChannelAccountCreate',
          component: () => import('@/views/payment/channel_account/detail.vue'),
          meta: {
            title: '新增支付通道子账户',
            menu: false,
            activeMenu: '/payment',
            cache: true,
            noCache: 'PaymentChannelAccountList',
          },
        },
        {
          path: ':channelId/detail/:id',
          name: 'PaymentChannelAccountEdit',
          component: () => import('@/views/payment/channel_account/detail.vue'),
          meta: {
            title: '编辑支付通道子账户',
            menu: false,
            activeMenu: '/payment',
            cache: true,
            noCache: 'PaymentChannelAccountList',
          },
        },
      ],
    },
  ],
}

export default routes
