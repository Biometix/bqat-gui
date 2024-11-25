import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';

import App from './App.vue'
import router from './router'

// Bootstrap
import 'bootstrap-icons/font/bootstrap-icons.css'


const app = createApp(App)


fetch('config.json')
    .then((response) => {
        if (!response.ok) {
            throw new Error(`Failed to load config.json: ${response.statusText}`);
        }
        return response.json();
    })
    .then((config) => {
      console.log(config)
        // Add parsed config.json variables to global properties
        app.config.globalProperties.$config = config;
        app.provide('config', app.config.globalProperties.$config);

        // Proceed with mounting the app
        app.use(createPinia());
        app.use(router);
        app.use(Antd);

        app.mount('#app');
    })
    .catch((error) => {
        console.error('Failed to load config.json file:', error);
    });

// app.use(createPinia())
// app.use(router)
// app.use(Antd);
// app.mount('#app')
