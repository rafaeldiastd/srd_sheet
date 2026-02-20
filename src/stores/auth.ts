import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'
import { useRouter } from 'vue-router'

export const useAuthStore = defineStore('auth', () => {
    const user = ref<User | null>(null)
    const session = ref<Session | null>(null)
    const loading = ref(true)
    const router = useRouter()

    async function initialize() {
        loading.value = true
        const { data } = await supabase.auth.getSession()
        session.value = data.session
        user.value = data.session?.user ?? null

        supabase.auth.onAuthStateChange((_event, _session) => {
            session.value = _session
            user.value = _session?.user ?? null
            if (!_session) {
                // Handle logout or session expiry if needed
            }
        })
        loading.value = false
    }

    async function signOut() {
        await supabase.auth.signOut()
        user.value = null
        session.value = null
        router.push('/')
    }

    return {
        user,
        session,
        loading,
        initialize,
        signOut
    }
})
