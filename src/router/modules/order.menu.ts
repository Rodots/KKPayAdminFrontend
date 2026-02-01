import type { RouteRecordRaw } from 'vue-router'

function Layout() {
  return import('@/layouts/index.vue')
}

const routes: RouteRecordRaw = {
  path: '/order',
  component: Layout,
  redirect: '/order/manager',
  name: 'Order',
  meta: {
    title: '订单管理',
    icon: 'i-ri:order-play-line',
    activeIcon: 'i-ri:order-play-fill',
    auth: ['super_admin', 'admin', 'service'],
  },
  children: [
    {
      path: 'manager',
      name: 'OrderManager',
      component: () => import('@/views/order/manager/list.vue'),
      meta: {
        title: '订单列表',
        menu: false,
        activeMenu: '/order',
        cache: true,
        copyright: false,
      },
    },
  ],
}

export default routes
