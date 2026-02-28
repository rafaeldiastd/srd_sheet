<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/stores/auth'
import { Eye, EyeOff } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const isLogin = ref(true)
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const loading = ref(false)
const error = ref('')

const formTitle = computed(() => isLogin.value ? 'Welcome Back' : 'Create an Account')
const formSubtitle = computed(() => isLogin.value 
  ? 'Enter your email and password to sign in to your account.' 
  : 'Enter your details below to create your account.')
const submitButtonText = computed(() => {
  if (loading.value) return isLogin.value ? 'Logging in...' : 'Creating account...'
  return isLogin.value ? 'Sign In' : 'Sign Up'
})
const switchPrompt = computed(() => isLogin.value ? 'New here?' : 'Already have an account?')
const switchAction = computed(() => isLogin.value ? 'Create an account' : 'Sign in')

function toggleForm() {
  isLogin.value = !isLogin.value
  error.value = ''
}

async function handleAuth() {
  // Validate passwords match for registration
  if (!isLogin.value && password.value !== confirmPassword.value) {
    error.value = "Passwords don't match"
    return
  }

  loading.value = true
  error.value = ''

  try {
    if (isLogin.value) {
      // Handle Login
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.value,
        password: password.value,
      })
      if (authError) throw authError
      await authStore.initialize()
      router.push('/dashboard')
    } else {
      // Handle Register
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.value,
        password: password.value,
      })
      if (signUpError) throw signUpError

      const { error: loginError } = await supabase.auth.signInWithPassword({
          email: email.value,
          password: password.value,
      })
      
      if (!loginError) {
          await authStore.initialize()
          router.push('/dashboard')
      } else {
          // If auto-login fails after sign up, switch to login form
          isLogin.value = true
      }
    }
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
    <!-- Image Section - hidden on mobile, visible on desktop -->
    <div class="hidden bg-muted lg:block relative">
      <img
        src="https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?q=80&w=2070&auto=format&fit=crop"
        alt="Authentication background"
        class="absolute inset-0 h-full w-full object-cover dark:brightness-[0.4] dark:grayscale"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-background/80 to-background/20" />
      <div class="relative z-20 flex h-full flex-col justify-end p-10 text-white">
        <div class="mt-auto">
          <blockquote class="space-y-4">
            <h3 class="text-xl font-medium">SRD Companion</h3>
            <p class="text-lg">
              "This sheet has saved me countless hours and transformed how we play our campaigns. Highly recommended for any party!"
            </p>
            <footer class="text-sm text-gray-300">Sofia Davis, Dungeon Master</footer>
          </blockquote>
        </div>
      </div>
    </div>

    <!-- Form Section -->
    <div class="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
      <div class="mx-auto w-full max-w-[400px] space-y-6">
        <div class="flex flex-col space-y-2 text-center">
          <h1 class="text-3xl font-bold tracking-tight">{{ formTitle }}</h1>
          <p class="text-sm text-muted-foreground">
            {{ formSubtitle }}
          </p>
        </div>

        <div class="grid gap-6">
          <form @submit.prevent="handleAuth" class="grid gap-4">
            <div class="grid gap-2">
              <Label htmlFor="email" class="text-left">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="m@example.com" 
                v-model="email" 
                required 
                class="bg-background"
              />
            </div>
            
            <div class="grid gap-2">
              <div class="flex items-center justify-between">
                <Label htmlFor="password" class="text-left">Password</Label>
              </div>
              <div class="relative">
                <Input 
                  id="password" 
                  :type="showPassword ? 'text' : 'password'" 
                  v-model="password" 
                  placeholder="••••••••"
                  required 
                  class="bg-background pr-10"
                />
                <button
                  type="button"
                  class="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:text-foreground focus:outline-none transition-colors"
                  @click="showPassword = !showPassword"
                >
                  <Eye v-if="!showPassword" class="h-4 w-4" />
                  <EyeOff v-else class="h-4 w-4" />
                </button>
              </div>
            </div>

            <div v-if="!isLogin" class="grid gap-2">
              <div class="flex items-center justify-between">
                <Label htmlFor="confirmPassword" class="text-left">Confirm Password</Label>
              </div>
              <div class="relative">
                <Input 
                  id="confirmPassword" 
                  :type="showConfirmPassword ? 'text' : 'password'" 
                  v-model="confirmPassword" 
                  placeholder="••••••••"
                  required 
                  class="bg-background pr-10"
                />
                <button
                  type="button"
                  class="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:text-foreground focus:outline-none transition-colors"
                  @click="showConfirmPassword = !showConfirmPassword"
                >
                  <Eye v-if="!showConfirmPassword" class="h-4 w-4" />
                  <EyeOff v-else class="h-4 w-4" />
                </button>
              </div>
            </div>

            <div v-if="error" class="text-sm font-medium text-destructive">
              {{ error }}
            </div>

            <Button type="submit" class="w-full mt-2" :disabled="loading">
              {{ submitButtonText }}
            </Button>
          </form>

          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <span class="w-full border-t border-border" />
            </div>
            <div class="relative flex justify-center text-xs uppercase">
              <span class="bg-background px-2 text-muted-foreground">
                {{ switchPrompt }}
              </span>
            </div>
          </div>

          <div class="text-center text-sm">
            <button 
              type="button"
              @click="toggleForm" 
              class="font-medium text-primary underline underline-offset-4 hover:text-primary/80 bg-transparent border-none cursor-pointer"
            >
              {{ switchAction }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
