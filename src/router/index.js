// src/router/index.js
import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView   from '@/views/HomeView.vue'
import DiffView   from '@/views/DiffView.vue'
import ToolsView  from '@/views/ToolsView.vue'
import JSView     from '@/views/JSView.vue'
import JsonView   from '@/views/JsonView.vue'
import JsonDiffView   from '@/views/JsonDiffView.vue'
import ExcelView  from '@/views/ExcelView.vue'
import TestView   from '@/views/TestView.vue'
import store      from '@/store'

const routes = [
  { path: '/',   redirect: '/diff' },
  { path: '/diff',  name: 'Diff',  component: DiffView },
  { path: '/tools', name: 'Tools', component: ToolsView },
  { path: '/json',  name: 'Json',  component: JsonView },
  { path: '/excel', name: 'Excel',component: ExcelView },
  { path: '/js',    name: 'JS',    component: JSView },
  { path: '/json-diff', name: 'JsonDiff', component: JsonDiffView},
  // { path: '/test',  name: 'Test',  component: TestView },
  // { path: '/home',  name: 'Home',  component: HomeView },
]

const router = createRouter({
  // ← 切换到 Hash 模式
  history: createWebHashHistory(process.env.BASE_URL),
  routes,
})

router.beforeEach((to, _, next) => {
  if (to.matched.some(r => r.meta.requiresAuth)) {
    store.getters.isAuthenticated ? next() : next('/login')
  } else {
    next()
  }
})

export default router
