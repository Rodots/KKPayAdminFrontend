import type { RouteRecordRaw } from 'vue-router'

function Layout() {
  return import('@/layouts/index.vue')
}

const routes: RouteRecordRaw = {
  path: '/admin',
  component: Layout,
  redirect: '/admin/manager',
  name: 'Admin',
  meta: {
    title: '管理员管理',
    icon: 'i-ri:admin-line',
    activeIcon: 'i-ri:admin-fill',
    auth: ['super_admin', 'admin'],
  },
  children: [
    {
      path: 'manager',
      name: 'AdminManager',
      component: () => import('@/views/admin/manager/list.vue'),
      meta: {
        title: '管理员列表',
      },
    },
    {
      path: 'log',
      name: 'AdminLog',
      component: () => import('@/views/admin/log/list.vue'),
      meta: {
        title: '管理员操作日志',
        auth: ['super_admin'],
      },
    },
  ],
}

export default routes
