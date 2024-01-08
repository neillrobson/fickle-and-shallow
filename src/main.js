import Vue from 'vue';
import store from './vuex/index.js';
import App from './App.vue';
import './assets/main.less';

Vue.config.productionTip = false;

new Vue({
    render: (h) => h(App),
    store
}).$mount('#app');
