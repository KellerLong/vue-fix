import { RouteRecordRaw, createRouter as _createRouter, createWebHistory,  createMemoryHistory } from 'vue-router';

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        name: 'Login',
        component: () => import('./views/auth/Login'),

    }
];

export const createRouter = () => {
    return  _createRouter({
        history: import.meta.env.SSR ? createMemoryHistory() : createWebHistory(),
        routes,
    });
}
