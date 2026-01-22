import type { Route } from '#/global'
import type { RouteRecordRaw } from 'vue-router'
import pinia from '@/store'
import AdminMenu from './modules/admin.menu'
import CapitalMenu from './modules/capital.menu'
import MerchantMenu from './modules/merchant.menu'
import OrderMenu from './modules/order.menu'
import PaymentMenu from './modules/payment.menu'
import RiskMenu from './modules/risk.menu'
import SingleMenu from './modules/single.menu'

// 固定路由（默认路由）
const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/login.vue'),
    meta: {
      whiteList: true,
      title: '登录',
    },
  },
  {
    path: '/:all(.*)*',
    name: 'notFound',
    component: () => import('@/views/[...all].vue'),
    meta: {
      title: '找不到页面',
    },
  },
]

// 系统路由
const systemRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/index.vue'),
    meta: {
      breadcrumb: false,
      auth: ['super_admin', 'admin', 'service'],
    },
    children: [
      {
        path: '',
        component: () => import('@/views/index.vue'),
        meta: {
          title: useSettingsStore(pinia).settings.home.title,
          breadcrumb: false,
          cache: true,
        },
      },
      {
        path: 'reload',
        name: 'reload',
        component: () => import('@/views/reload.vue'),
        meta: {
          title: '刷新',
          breadcrumb: false,
        },
      },
    ],
  },
]

// 动态路由（异步路由、导航栏路由）
const asyncRoutes: Route.recordMainRaw[] = [
  {
    meta: {
      title: '系统',
      icon: 'i-uim:box',
    },
    children: [
      AdminMenu,
      MerchantMenu,
      OrderMenu,
      PaymentMenu,
      RiskMenu,
      CapitalMenu,
      ...SingleMenu,
    ],
  },
]

export {
  asyncRoutes,
  constantRoutes,
  systemRoutes,
}
