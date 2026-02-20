import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomeView
        },
        {
            path: '/login',
            name: 'login',
            component: () => import('../views/LoginView.vue')
        },
        {
            path: '/register',
            name: 'register',
            component: () => import('../views/RegisterView.vue')
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
            path: '/campaign/:id',
            name: 'campaign',
            component: () => import('../views/CampaignView.vue'),
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
    } else if ((to.name === 'login' || to.name === 'register') && isAuthenticated) {
        return '/dashboard'
    }
})

export default router
