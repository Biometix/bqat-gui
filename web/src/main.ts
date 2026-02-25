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

// TODO: Potential Google Analytics embed
// const script = document.createElement('script')
// script.setAttribute('async', '')
// script.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX'
// document.head.appendChild(script)

// window.dataLayer = window.dataLayer || []
// function gtag() {
//   window.dataLayer.push(arguments)
// }
// gtag('js', new Date())
// gtag('config', 'G-XXXXXXXXXX') // Replace with your Measurement ID


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

