import type { RecursiveRequired, Settings } from '#/global'
import { cloneDeep } from 'es-toolkit'
import settingsDefault from '@/settings.default'
import { merge } from '@/utils/object'

const globalSettings: Settings.all = {
  app: {
    enablePermission: true,
    enableDynamicTitle: true,
    enableErrorLog: true,
    enableCheckUpdates: true,
    loginExpiredMode: 'popup',
  },
  home: {
    title: '主页',
  },
  layout: {
    enableMobileAdaptation: true,
  },
  menu: {
    mode: 'single',
    style: 'dot',
    subMenuAutoCollapse: true,
    enableSubMenuCollapseButton: true,
    enableHotkeys: true,
  },
  topbar: {
    mode: 'fixed',
  },
  tabbar: {
    enable: true,
    style: 'fashion',
    enableIcon: true,
    enableHotkeys: true,
  },
  toolbar: {
    fullscreen: true,
    pageReload: true,
    colorScheme: true,
  },
  breadcrumb: {
    style: 'modern',
    enableMainMenu: true,
  },
  mainPage: {
    iframeCacheMax: 9,
    transitionMode: 'slide-bottom',
  },
  copyright: {
    enable: true,
    company: '卡卡聚合支付系统',
  },
}

export default merge(globalSettings, cloneDeep(settingsDefault)) as RecursiveRequired<Settings.all>
