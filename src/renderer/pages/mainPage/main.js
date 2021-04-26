import Vue from 'vue'
import axios from 'axios'
import App from './App'
import router from './router'
import store from './../../store'
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/antd.css';
import db from './../../datastore.js'
import * as custom  from './../../filter/index.js'

/* 其它代码 */

Vue.prototype.$db = db;
if (!process.env.IS_WEB) Vue.use(require('vue-electron'));
Vue.http = Vue.prototype.$http = axios;
Vue.config.productionTip = false;
Vue.use(Antd);
Object.keys(custom).forEach(key => {
    Vue.filter(key, custom[key])
})
/* eslint-disable no-new */
new Vue({
    components: { App },
    router,
    store,
    template: '<App/>'
}).$mount('#app')
