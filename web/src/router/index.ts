import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomeView
        },
        {
            path: '/scan',
            name: 'scan',
            // route level code-splitting
            // this generates a separate chunk for this route
            // which is lazy-loaded when the route is visited.
            component: () => import('../views/InputView.vue')
        },
        {
            path: '/task',
            name: 'task',
            component: () => import('../views/ProcessView.vue')
        },
        {
            path: '/result',
            name: 'result',
            component: () => import('../views/OutputView.vue')
        },
        {
            path: '/:catchAll(.*)',
            redirect: '/'
        }

    ]
})

export default router
