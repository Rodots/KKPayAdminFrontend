import type { RouteRecordRaw } from 'vue-router'

function Layout() {
  return import('@/layouts/index.vue')
}

const routes: RouteRecordRaw = {
  path: '/risk',
  component: Layout,
  redirect: '/risk/blackManager',
  name: 'Risk',
  meta: {
    title: '风控管理',
    icon: 'i-ri:sword-line',
    activeIcon: 'i-ri:sword-fill',
    auth: ['super_admin', 'admin'],
  },
  children: [
    {
      path: 'log',
      component: () => import('@/views/risk/log/list.vue'),
      name: 'RiskLog',
      meta: {
        title: '风控日志',
      },
    },
    {
      path: 'black_manager',
      component: () => import('@/views/risk/black_manager/list.vue'),
      name: 'BlackManager',
      meta: {
        title: '黑名单管理',
      },
    },
  ],
}

export default routes
