import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue';
import DiffView from '@/views/DiffView.vue';
import ToolsView from '@/views/ToolsView.vue';
import JSView from '@/views/JSView.vue';
import JsonView from '@/views/JsonView.vue';
import ExcelView from '@/views/ExcelView.vue';
import TestView from '@/views/TestView.vue';
import store from '@/store'; // NEW


const routes = [
  {
    path: '/',
    name: "Home",
    component: HomeView,
  },
  {
    path: '/diff',
    name: 'Diff',
    component: DiffView,
  },
  {
    path: '/tools',
    name: 'Tools',
    component: ToolsView,
  },
  {
    path: '/json',
    name: 'Json',
    component: JsonView,
  },
  {
    path: '/excel',
    name: 'Excel',
    component: ExcelView,
  },
  {
    path: '/js',
    name: 'JS',
    component: JSView,
  },
  {
    path: '/test',
    name: 'Test',
    component: TestView,
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

router.beforeEach((to, _, next) => {
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (store.getters.isAuthenticated) {
      next();
      return;
    }
    next('/login');
  } else {
    next();
  }
});

export default router;
