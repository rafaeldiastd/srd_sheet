import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            redirect: '/login'
        },
        {
            path: '/login',
            name: 'login',
            component: () => import('../views/LoginView.vue')
        },
        {
            path: '/register',
            redirect: '/login'
        },
        {
            path: '/dashboard',
            name: 'dashboard',
            component: () => import('../views/DashboardView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/create',
            name: 'create',
            component: () => import('../views/CreateSheetView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/sheet/:id',
            name: 'sheet',
            component: () => import('../views/SheetView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/sheet/:id/edit',
            name: 'sheet-edit',
            component: () => import('../views/EditSheetView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/campaign/:id',
            name: 'campaign',
            component: () => import('../views/CampaignView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/campaign/:id/grimoire',
            name: 'grimoire',
            component: () => import('../views/GrimoireView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/design',
            name: 'design',
            component: () => import('../views/DesignSystemView.vue')
        }
    ]
})

router.beforeEach(async (to, _from) => {
    const authStore = useAuthStore()

    // Ensure auth state is initialized
    if (authStore.loading) {
        await authStore.initialize()
    }

    const isAuthenticated = !!authStore.user

    if (to.meta.requiresAuth && !isAuthenticated) {
        return '/login'
    } else if (to.name === 'login' && isAuthenticated) {
        return '/dashboard'
    }
})

export default router
