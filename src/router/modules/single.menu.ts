import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/settings',
    component: () => import('@/views/single/settings.vue'),
    name: 'Settings',
    meta: {
      title: '站点配置',
      icon: 'i-ri:settings-4-line',
      activeIcon: 'i-ri:settings-4-fill',
      copyright: false,
      singleMenu: true,
      auth: ['super_admin', 'admin'],
    },
  },
]

export default routes
