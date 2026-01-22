import { loadingFadeOut } from 'virtual:app-loading'
import { createRouter, createWebHashHistory } from 'vue-router'
import setupExtensions from './extensions'
import setupGuards from './guards'
// 路由相关数据
import { constantRoutes } from './routes'

const router = createRouter({
  history: createWebHashHistory(),
  routes: constantRoutes,
})

setupGuards(router)
setupExtensions(router)

router.isReady().then(() => {
  loadingFadeOut()
})

export default router
