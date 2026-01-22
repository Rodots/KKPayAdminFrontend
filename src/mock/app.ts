import { defineFakeRoute } from 'vite-plugin-fake-server/client'

export default defineFakeRoute([
  {
    url: '/mock/app/route/list',
    method: 'get',
    response: () => {
      return {
        error: '',
        status: 1,
        data: [
          // 主导航
          {
            meta: {
              title: '演示',
              icon: 'uim:box',
            },
            children: [
              // 次导航（一级路由）
              {
                path: '/multilevel_menu_example',
                component: 'Layout',
                name: 'multilevelMenuExample',
                meta: {
                  title: 'route.multimenu.root',
                  icon: 'heroicons-solid:menu-alt-3',
                },
                children: [
                  // 次导航（二级路由）
                  {
                    path: 'page',
                    name: 'multilevelMenuExample1',
                    component: 'multilevel_menu_example/page.vue',
                    meta: {
                      title: 'route.multimenu.page',
                    },
                  },
                  {
                    path: 'level2',
                    name: 'multilevelMenuExample2',
                    meta: {
                      title: 'route.multimenu.level2.root',
                    },
                    children: [
                      // 次导航（三级路由）
                      {
                        path: 'page',
                        name: 'multilevelMenuExample2-1',
                        component: 'multilevel_menu_example/level2/page.vue',
                        meta: {
                          title: 'route.multimenu.level2.page',
                        },
                      },
                      {
                        path: 'level3',
                        name: 'multilevelMenuExample2-2',
                        meta: {
                          title: 'route.multimenu.level2.level3.root',
                        },
                        children: [
                          // 次导航（四级路由）
                          {
                            path: 'page1',
                            name: 'multilevelMenuExample2-2-1',
                            component: 'multilevel_menu_example/level2/level3/page1.vue',
                            meta: {
                              title: 'route.multimenu.level2.level3.page1',
                            },
                          },
                          {
                            path: 'page2',
                            name: 'multilevelMenuExample2-2-2',
                            component: 'multilevel_menu_example/level2/level3/page2.vue',
                            meta: {
                              title: 'route.multimenu.level2.level3.page2',
                            },
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                path: '/permission_example',
                component: 'Layout',
                name: 'permissionExample',
                meta: {
                  title: 'route.permission',
                  icon: 'ri:shield-keyhole-line',
                },
                children: [
                  {
                    path: 'index',
                    name: 'permissionExampleIndex',
                    component: 'permission_example/index.vue',
                    meta: {
                      title: 'route.permission',
                      menu: false,
                      breadcrumb: false,
                      activeMenu: '/permission_example',
                    },
                  },
                  {
                    path: 'test',
                    name: 'permissionExampleTest',
                    component: 'permission_example/test.vue',
                    meta: {
                      title: '测试页面',
                      auth: ['permission.browse'],
                      menu: false,
                      breadcrumb: false,
                      activeMenu: '/permission_example',
                    },
                  },
                ],
              },
            ],
          },
          {
            meta: {
              title: '页面',
              icon: 'ri:pages-line',
              auth: 'permission.browse',
            },
            children: [
              {
                path: '/pages_example/general',
                component: 'Layout',
                name: 'pagesExampleGeneral',
                meta: {
                  title: '通用',
                  icon: 'ri:function-line',
                },
                children: [
                  {
                    path: 'manager',
                    name: 'pagesExampleGeneralManager',
                    meta: {
                      title: '管理员管理',
                    },
                    children: [
                      {
                        path: '',
                        name: 'pagesExampleGeneralManagerList',
                        component: 'pages_example/manager/list.vue',
                        meta: {
                          title: '管理员列表',
                          menu: false,
                          breadcrumb: false,
                        },
                      },
                      {
                        path: 'detail',
                        name: 'pagesExampleGeneralManagerCreate',
                        component: 'pages_example/manager/detail.vue',
                        meta: {
                          title: '新增管理员',
                          menu: false,
                          activeMenu: '/pages_example/general/manager',
                        },
                      },
                      {
                        path: 'detail/:id',
                        name: 'pagesExampleGeneralManagerEdit',
                        component: 'pages_example/manager/detail.vue',
                        meta: {
                          title: '编辑管理员',
                          menu: false,
                          activeMenu: '/pages_example/general/manager',
                        },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      }
    },
  },
  {
    url: '/mock/app/menu/list',
    method: 'get',
    response: () => {
      return {
        error: '',
        status: 1,
        data: [
          {
            meta: {
              title: '演示',
              icon: 'uim:box',
            },
            children: [
              {
                meta: {
                  title: '多级导航',
                  icon: 'heroicons-solid:menu-alt-3',
                },
                children: [
                  {
                    path: '/multilevel_menu_example/page',
                    meta: {
                      title: '导航1',
                    },
                  },
                  {
                    meta: {
                      title: '导航2',
                    },
                    children: [
                      {
                        path: '/multilevel_menu_example/level2/page',
                        meta: {
                          title: '导航2-1',
                        },
                      },
                      {
                        meta: {
                          title: '导航2-2',
                        },
                        children: [
                          {
                            path: '/multilevel_menu_example/level2/level3/page1',
                            meta: {
                              title: '导航2-2-1',
                            },
                          },
                          {
                            path: '/multilevel_menu_example/level2/level3/page2',
                            meta: {
                              title: '导航2-2-2',
                            },
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                path: '/permission_example',
                meta: {
                  title: '权限验证',
                  icon: 'ri:shield-keyhole-line',
                },
              },
            ],
          },
        ],
      }
    },
  },
])
