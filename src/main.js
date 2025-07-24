import 'bootstrap/dist/css/bootstrap.css';
import { createApp } from "vue";
import axios from 'axios';
// 引入组件库
import Antd from 'ant-design-vue'
// 引入样式表
import 'ant-design-vue/dist/antd.css'

import VueDiff from 'vue-diff';
import 'vue-diff/dist/index.css';
import CodeDiff from 'v-code-diff'

import VueExcelEditor from 'vue3-excel-editor'

import App from './App.vue';
import router from './router';
import store from './store';

const app = createApp(App);
axios.defaults.withCredentials = true;
axios.defaults.baseURL = 'http://localhost:5000/';  // the FastAPI backend

axios.interceptors.response.use(undefined, function (error) {
  if (error) {
    const originalRequest = error.config;
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      store.dispatch('logOut');
      return router.push('/login')
    }
  }
});

app.use(Antd);
app.use(router);
app.use(store);

app.use(CodeDiff);
app.use(VueExcelEditor);

// app.use(VueDiff);
app.mount("#app");
