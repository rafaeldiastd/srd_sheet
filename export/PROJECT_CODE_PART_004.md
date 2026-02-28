

---
## FILE: src/views/DashboardView.vue
```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { Plus, LogOut, Scroll, Sword, Users, Key } from 'lucide-vue-next'
import CreateCampaignModal from '@/components/campaign/CreateCampaignModal.vue'
import JoinCampaignModal from '@/components/campaign/JoinCampaignModal.vue'

const authStore = useAuthStore()
const router = useRouter()
const campaigns = ref<any[]>([])
const loadingCampaigns = ref(true)
const showCreateModal = ref(false)
const showJoinModal = ref(false)

async function fetchCampaigns() {
  loadingCampaigns.value = true

  if (!authStore.user) {
    campaigns.value = []
    loadingCampaigns.value = false
    return
  }

  // Fetch campaigns via the junction table
  const { data, error } = await supabase
    .from('campaign_members')
    .select('campaigns(*)')
    .eq('user_id', authStore.user.id)

  if (!error && data) {
    // data is an array of objects like { campaigns: { id: '...', name: '...' } }
    campaigns.value = data
      .map((item: any) => item.campaigns)
      .filter(Boolean)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  } else {
    campaigns.value = []
  }

  loadingCampaigns.value = false
}

onMounted(() => {
  if (authStore.user) {
    fetchCampaigns()
  }
})
</script>

<template>
  <div class="min-h-screen bg-background text-foreground flex flex-col">

    <!-- Sticky top bar -->
    <header
      class="border-b border-border px-8 py-4 flex items-center justify-between bg-background/80 backdrop-blur-sm sticky top-0 z-10 shrink-0">
      <div class="flex items-center gap-3">
        <Scroll class="w-5 h-5 text-primary" />
        <span class="font-serif font-bold text-primary tracking-wide">Grimório</span>
      </div>
      <div class="flex items-center gap-3">
        <Button variant="ghost" size="sm" @click="authStore.signOut"
          class="text-muted-foreground hover:text-destructive gap-2">
          <LogOut class="w-4 h-4" /> Sair
        </Button>
      </div>
    </header>

    <main class="flex-1 w-full max-w-6xl mx-auto px-6 py-10 space-y-12 flex flex-col">

      <!-- ── CAMPAIGNS SECTION ── -->
      <section class="flex-1">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
              <Sword class="w-6 h-6 text-primary" /> Campanhas
            </h1>
            <p class="text-sm text-muted-foreground mt-0.5" v-if="campaigns.length">
              Você está em {{ campaigns.length }} {{ campaigns.length === 1 ? 'aventura' : 'aventuras' }}
            </p>
          </div>
          <div class="flex gap-2">
            <Button variant="outline" size="sm" @click="showJoinModal = true" class="gap-2">
              <Key class="w-4 h-4" /> Entrar com Código
            </Button>
            <Button size="sm" @click="showCreateModal = true" class="gap-2">
              <Plus class="w-4 h-4" /> Nova Campanha
            </Button>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="loadingCampaigns" class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div v-for="i in 2" :key="i" class="h-40 rounded-xl bg-card animate-pulse border border-border" />
        </div>

        <!-- Empty -->
        <div v-else-if="campaigns.length === 0"
          class="flex flex-col items-center justify-center py-12 border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
          <Sword class="w-10 h-10 text-zinc-700 mb-3" />
          <p class="text-muted-foreground text-sm font-medium">Nenhuma campanha ativa</p>
          <p class="text-xs text-zinc-500 mt-1">Crie uma nova ou entre com um código</p>
        </div>

        <!-- List -->
        <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <div v-for="camp in campaigns" :key="camp.id"
            class="group relative bg-zinc-900 border border-zinc-800 hover:border-primary/50 rounded-xl p-5 cursor-pointer transition-all hover:bg-zinc-900/80 hover:-translate-y-1 hover:shadow-lg"
            @click="router.push(`/campaign/${camp.id}`)">
            <div class="flex flex-col h-full min-h-[120px]">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="font-bold text-lg font-serif group-hover:text-primary transition-colors leading-tight">{{ camp.name }}</h3>
                </div>
                <div class="flex-1"></div>
                
                <div class="flex items-center justify-between text-xs mt-4">
                    <span v-if="camp.dm_id === authStore.user?.id"
                            class="text-[10px] font-bold bg-primary/20 text-primary px-2 py-0.5 rounded border border-primary/30 uppercase">Mestre</span>
                    <span v-else class="text-[10px] font-bold bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded border border-zinc-700 uppercase">Aventureiro</span>
                    
                    <div class="text-muted-foreground flex items-center gap-1">
                            <Users class="w-3.5 h-3.5" /> Entrar
                    </div>
                </div>
            </div>
          </div>
        </div>
      </section>

    </main>

    <CreateCampaignModal v-if="showCreateModal" @close="showCreateModal = false; fetchCampaigns()" />
    <JoinCampaignModal v-if="showJoinModal" @close="showJoinModal = false; fetchCampaigns()" />
  </div>
</template>

```


---
## FILE: src/views/DesignSystemView.vue
```vue
<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

const colorTokens = [
    { label: 'Background', tailwind: 'bg-background', hex: '#09090B' },
    { label: 'Card', tailwind: 'bg-card', hex: '#18181B' },
    { label: 'Popover', tailwind: 'bg-popover', hex: '#18181B' },
    { label: 'Secondary', tailwind: 'bg-secondary', hex: '#27272A' },
    { label: 'Muted', tailwind: 'bg-muted', hex: '#27272A' },
    { label: 'Border', tailwind: 'bg-border', hex: '#27272A' },
    { label: 'Primary', tailwind: 'bg-primary', hex: '#DFD4BD' },
    { label: 'Foreground', tailwind: 'bg-foreground', hex: '#E4E4E7' },
]
</script>

<template>
    <div class="min-h-screen bg-background text-foreground">
        <div class="max-w-5xl mx-auto px-8 py-12 space-y-16">

            <!-- Header -->
            <header class="border-b border-border pb-8">
                <h1 class="text-4xl font-serif font-bold text-primary mb-3">Maestro Design System</h1>
                <p class="text-muted-foreground text-lg">Guia de estilos e componentes do projeto.</p>
            </header>

            <!-- 01 — Colors -->
            <section class="space-y-6">
                <h2 class="text-2xl font-serif font-bold text-foreground">
                    <span class="text-primary mr-2 font-mono text-sm font-normal">01</span>Cores
                </h2>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div v-for="t in colorTokens" :key="t.label" class="space-y-2">
                        <div :class="[t.tailwind, 'h-20 w-full rounded-md border border-border ring-1 ring-border/50']">
                        </div>
                        <div>
                            <p class="text-sm font-semibold text-foreground">{{ t.label }}</p>
                            <p class="text-xs text-muted-foreground font-mono">{{ t.tailwind }}</p>
                            <p class="text-xs text-muted-foreground font-mono">{{ t.hex }}</p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- 02 — Typography -->
            <section class="space-y-6">
                <h2 class="text-2xl font-serif font-bold text-foreground">
                    <span class="text-primary mr-2 font-mono text-sm font-normal">02</span>Tipografia
                </h2>
                <div class="space-y-4 p-6 bg-card border border-border rounded-lg">
                    <div class="border-b border-border pb-4 space-y-3">
                        <p class="text-4xl font-serif font-bold text-foreground">Merriweather — Títulos</p>
                        <p class="text-2xl font-serif font-semibold text-foreground">Heading 2 / font-serif</p>
                        <p class="text-xl font-serif text-foreground">Heading 3 / font-serif</p>
                        <p class="text-lg font-serif text-primary">Heading 4 / text-primary / Gold</p>
                    </div>
                    <div class="space-y-2">
                        <p class="text-base text-foreground">Inter — corpo de texto (text-base / text-foreground)</p>
                        <p class="text-sm text-muted-foreground">Texto secundário (text-sm / text-muted-foreground)</p>
                        <p class="text-xs text-muted-foreground font-mono">Fonte mono — código (font-mono / text-xs)</p>
                    </div>
                </div>
            </section>

            <!-- 03 — Buttons -->
            <section class="space-y-6">
                <h2 class="text-2xl font-serif font-bold text-foreground">
                    <span class="text-primary mr-2 font-mono text-sm font-normal">03</span>Botões
                </h2>
                <div class="flex flex-wrap gap-4 p-6 bg-card border border-border rounded-lg items-center">
                    <Button>Padrão (default)</Button>
                    <Button variant="secondary">Secundário</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="destructive">Perigo</Button>
                    <Button variant="link">Link</Button>
                    <Button size="sm">Pequeno</Button>
                    <Button size="lg">Grande</Button>
                </div>
            </section>

            <!-- 04 — Form Elements -->
            <section class="space-y-6">
                <h2 class="text-2xl font-serif font-bold text-foreground">
                    <span class="text-primary mr-2 font-mono text-sm font-normal">04</span>Formulários
                </h2>
                <div class="grid md:grid-cols-2 gap-8">

                    <!-- Inputs and Textarea -->
                    <Card>
                        <CardHeader>
                            <CardTitle>Inputs</CardTitle>
                        </CardHeader>
                        <CardContent class="space-y-4">
                            <div class="space-y-1">
                                <Label>Nome do personagem</Label>
                                <Input placeholder="Ex: Aragorn" />
                            </div>
                            <div class="space-y-1">
                                <Label>Descrição</Label>
                                <Textarea placeholder="Descreva seu personagem..." class="min-h-24" />
                            </div>
                        </CardContent>
                    </Card>

                    <!-- Select, Checkbox, Radio -->
                    <Card>
                        <CardHeader>
                            <CardTitle>Seleção</CardTitle>
                        </CardHeader>
                        <CardContent class="space-y-6">
                            <div class="space-y-1">
                                <Label>Classe</Label>
                                <Select>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Escolha uma classe" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="fighter">Guerreiro</SelectItem>
                                        <SelectItem value="wizard">Mago</SelectItem>
                                        <SelectItem value="rogue">Ladino</SelectItem>
                                        <SelectItem value="cleric">Clérigo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div class="space-y-3">
                                <Label>Opções</Label>
                                <div class="flex items-center gap-2">
                                    <Checkbox id="cb1" />
                                    <Label for="cb1">Personagem verificado</Label>
                                </div>
                                <div class="flex items-center gap-2">
                                    <Checkbox id="cb2" checked />
                                    <Label for="cb2">Aceitar termos</Label>
                                </div>
                            </div>
                            <div class="space-y-2">
                                <Label>Alinhamento</Label>
                                <RadioGroup default-value="lg" class="flex gap-4">
                                    <div class="flex items-center gap-2">
                                        <RadioGroupItem value="lg" id="lg" />
                                        <Label for="lg">Leal e Bom</Label>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <RadioGroupItem value="cn" id="cn" />
                                        <Label for="cn">Caótico Neutro</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </section>

            <!-- 05 — Cards -->
            <section class="space-y-6">
                <h2 class="text-2xl font-serif font-bold text-foreground">
                    <span class="text-primary mr-2 font-mono text-sm font-normal">05</span>Cards
                </h2>
                <div class="grid md:grid-cols-3 gap-4">
                    <Card v-for="i in 3" :key="i">
                        <CardHeader>
                            <CardTitle>Personagem {{ i }}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p class="text-sm text-muted-foreground">Guerreiro · Nível {{ i * 3 }} · Humano</p>
                            <div class="mt-4 flex gap-2">
                                <Button size="sm" variant="outline">Ver</Button>
                                <Button size="sm" variant="ghost">Editar</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>

        </div>
    </div>
</template>

```


---
## FILE: src/views/HomeView.vue
```vue
<script setup lang="ts">
</script>

<template>
  <main class="flex min-h-screen flex-col items-center justify-center p-24">
    <div class="z-10 max-w-5xl w-full flex-col items-center justify-between font-mono text-sm lg:flex">
      <h1 class="text-4xl font-bold mb-8">MaestroSheet</h1>
      <div class="flex gap-4">
        <RouterLink to="/login" class="text-primary hover:underline">Login</RouterLink>
        <RouterLink to="/register" class="text-primary hover:underline">Register</RouterLink>
      </div>
    </div>
  </main>
</template>

```


---
## FILE: src/views/LoginView.vue
```vue
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

```


---
## FILE: src/views/RegisterView.vue
```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/stores/auth'

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')
const router = useRouter()
const authStore = useAuthStore()

async function handleRegister() {
  if (password.value !== confirmPassword.value) {
    error.value = "Passwords don't match"
    return
  }

  loading.value = true
  error.value = ''

  try {
    const { error: authError } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
    })

    if (authError) throw authError

    // Auto login after sign up if configured in Supabase, or redirect to login
    // For now, let's try to login or just show success
    const { error: loginError } = await supabase.auth.signInWithPassword({
        email: email.value,
        password: password.value,
    })
    
    if (!loginError) {
        await authStore.initialize()
        router.push('/dashboard')
    } else {
        router.push('/login')
    }

  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center px-4">
    <Card class="w-full max-w-sm">
      <CardHeader>
        <CardTitle class="text-2xl">Create an account</CardTitle>
        <CardDescription>
          Enter your email below to create your account.
        </CardDescription>
      </CardHeader>
      <CardContent class="grid gap-4">
        <div class="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="m@example.com" v-model="email" required />
        </div>
        <div class="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" v-model="password" required />
        </div>
        <div class="grid gap-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input id="confirmPassword" type="password" v-model="confirmPassword" required />
        </div>
        <div v-if="error" class="text-sm text-destructive">
          {{ error }}
        </div>
      </CardContent>
      <CardFooter class="flex flex-col gap-4">
        <Button class="w-full" @click="handleRegister" :disabled="loading">
          {{ loading ? 'Creating account...' : 'Create account' }}
        </Button>
        <div class="text-center text-sm">
          Already have an account?
          <RouterLink to="/login" class="underline">
            Sign in
          </RouterLink>
        </div>
      </CardFooter>
    </Card>
  </div>
</template>

```


---
## FILE: src/views/SheetView.vue
```vue
<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'

// Tabs
import SummaryTab from '@/components/sheet/tabs/SummaryTab.vue'
import SkillsTab from '@/components/sheet/tabs/SkillsTab.vue'
import FeatsTab from '@/components/sheet/tabs/FeatsTab.vue'
import SpellsTab from '@/components/sheet/tabs/SpellsTab.vue'
import EquipmentTab from '@/components/sheet/tabs/EquipmentTab.vue'
import ResourcesTab from '@/components/sheet/tabs/ResourcesTab.vue'
import BuffsTab from '@/components/sheet/tabs/BuffsTab.vue'
import ConfigTab from '@/components/sheet/tabs/ConfigTab.vue'

// Shared components
import ItemEditorModal from '@/components/sheet/ItemEditorModal.vue'

// Icons
import {
  LayoutDashboard, Dices, Swords, Wand2, Package,
  Shield, Flame, Settings, ChevronLeft, Loader2
} from 'lucide-vue-next'

// Composables & types
import type { SheetData } from '@/types/sheet'
import { ATTR_KEYS, ATTR_LABELS } from '@/data/sheetConstants'
import { useSheet } from '@/composables/useSheet'
import { useSheetEdit } from '@/composables/useSheetEdit'
import { useDeleteConfirm } from '@/composables/useDeleteConfirm'
import { useDndCalculations } from '@/composables/useDndCalculations'
import { useRolls } from '@/composables/useRolls'
import { useSkills } from '@/composables/useSkills'
import { useSpellSlots } from '@/composables/useSpellSlots'

const route = useRoute()
const router = useRouter()

const props = defineProps<{
  sheetId?: string
  isEmbedded?: boolean
  onRoll?: (label: string, displayFormula: string, evalFormula?: string) => void
  onDualRoll?: (label: string, atkDisplay: string, dmgDisplay: string, atkEval: string, dmgEval: string) => void
}>()

const currentSheetId = computed(() => props.sheetId || route.params.id as string)

// ── Core Sheet ─────────────────────────────────────────────────────────
const { sheet, loading, fetchSheet: fetchSheetData, saveSheetMeta, saveSheetData } = useSheet()
const { editedData, headEditMode, tabsEditMode, toggleTabsEdit: toggleTabsEditComp, saveEdit: saveEditComp } = useSheetEdit(sheet, async (data) => {
  if (!sheet.value) return
  await saveSheetWithData(data)
})

const editMode = computed(() => headEditMode.value || tabsEditMode.value)
const d = computed(() => editMode.value ? editedData.value : sheet.value?.data)

// ── Calculations ──────────────────────────────────────────────────────
const {
  calcMod, modStr, modStrF, b, totalBonuses,
  attrTotal, totalCA, totalTouch, totalFlatFooted,
  totalBAB, totalInitiative, totalHP, totalSpeed,
  meleeAtk, rangedAtk, grappleAtk,
  totalFort, totalRef, totalWill,
  deathStatus, totalWeight, adjustField
} = useDndCalculations(d, editMode, editedData, sheet)

const { resolveFormula, handleRoll, handleItemRoll } = useRolls({
  attrTotal, calcMod, modStr,
  totalCA, totalTouch, totalFlatFooted,
  totalBAB, meleeAtk, rangedAtk, grappleAtk,
  totalHP, totalInitiative, totalFort, totalRef, totalWill,
  d, onRoll: props.onRoll, onDualRoll: props.onDualRoll
})

const { skillPhase, skillSearch, isClassSkill, filteredSkillsList, toggleSkillEdit, skillAbilityMod, skillTotal, adjustRank, addLevelUpSkillPoints, skillPointsSpent, activeSkills } = useSkills(d, editedData, editMode, sheet, calcMod, attrTotal, totalBonuses)
const { SPELL_LEVELS, spellSlotsMax, spellSlotsUsed, adjustSlotUsed, adjustSlotMax } = useSpellSlots(sheet)

// ── Tabs ───────────────────────────────────────────────────────────────
const TABS = [
  { id: 'summary', label: 'Resumo', icon: LayoutDashboard },
  { id: 'skills', label: 'Perícias', icon: Dices },
  { id: 'feats', label: 'Talentos', icon: Swords },
  { id: 'spells', label: 'Magias', icon: Wand2 },
  { id: 'equipment', label: 'Itens', icon: Package },
  { id: 'resources', label: 'Recursos', icon: Shield },
  { id: 'buffs', label: 'Buffs', icon: Flame },
  { id: 'config', label: 'Config', icon: Settings },
]

const activeTab = ref('summary')



// ── Save ───────────────────────────────────────────────────────────────
async function saveSheet() {
  if (!sheet.value) return
  await saveSheetWithData(sheet.value.data)
}

async function saveSheetWithData(data: SheetData) {
  if (!sheet.value) return
  try {
    await saveSheetMeta(sheet.value.id, {
      name: sheet.value.name, class: sheet.value.class,
      level: sheet.value.level, race: sheet.value.race
    })
    await saveSheetData(sheet.value.id, data)
  } catch (error: any) {
    alert('Erro ao salvar: ' + (error.message || error))
  }
}

async function saveCurrentHP() {
  if (!sheet.value) return
  await supabase.from('sheets').update({ data: { ...sheet.value.data } }).eq('id', sheet.value.id)
}

async function saveEdit() {
  await saveEditComp(spellSlotsMax.value, spellSlotsUsed.value)
}
function toggleTabsEdit() {
  if (!tabsEditMode.value) skillPhase.value = 'select'
  toggleTabsEditComp(async () => { await saveEdit() })
}

// ── Delete ─────────────────────────────────────────────────────────────
const { isDeleteOpen, deleteCountdown, confirmDelete, executeDelete, cancelDelete } = useDeleteConfirm(async (type, index) => {
  if (sheet.value?.data) {
    const map: Record<string, string> = { feat: 'feats', spell: 'spells', shortcut: 'shortcuts', equipment: 'equipment', buff: 'buffs', resource: 'resources' }
    const key = map[type]
    if (key && Array.isArray((sheet.value.data as any)[key])) {
      (sheet.value.data as any)[key].splice(index, 1)
      await saveSheet()
    }
  }
})

// ── Item Editor ────────────────────────────────────────────────────────
const editorOpen = ref(false)
const editorType = ref<'feat' | 'spell' | 'shortcut' | 'equipment' | 'buff'>('feat')
const editorItem = ref<any>(null)
const editorIndex = ref(-1)

function openEditor(type: string, item?: any, index = -1) {
  editorType.value = type as any
  editorItem.value = item || null
  editorIndex.value = index
  editorOpen.value = true
}

function openEquipmentEditor(item?: any, index = -1) {
  openEditor('equipment', item, index)
}

function handleEditorSave(data: any) {
  if (!sheet.value) return
  const map: Record<string, string> = { feat: 'feats', spell: 'spells', shortcut: 'shortcuts', equipment: 'equipment', buff: 'buffs' }
  const key = map[editorType.value]
  if (!key) return
  if (!(sheet.value.data as any)[key]) (sheet.value.data as any)[key] = []
  const list = (sheet.value.data as any)[key]
  if (editorIndex.value >= 0) list[editorIndex.value] = data
  else list.push(data)
  saveSheet()
}

// ── Resources ───────────────────────────────────────────────────────────
function addResource(name: string, max: number) {
  if (!sheet.value) return
  if (!sheet.value.data.resources) sheet.value.data.resources = []
  sheet.value.data.resources.push({ name, max, current: max })
  saveResources()
}
function adjustResource(i: number, delta: number) {
  if (!sheet.value?.data?.resources) return
  const res = sheet.value.data.resources[i]
  if (!res) return
  res.current = Math.max(0, Math.min(res.max, (res.current ?? res.max) + delta))
  saveResources()
}
function resetResources() {
  for (const res of (sheet.value?.data?.resources || [])) res.current = res.max
  saveResources()
}
async function saveResources() {
  if (!sheet.value) return
  await supabase.from('sheets').update({ data: { ...sheet.value.data } }).eq('id', sheet.value.id)
}
function deleteResource(i: number) {
  confirmDelete('resource', i)
}



// ── Equipment / Buff Toggles ───────────────────────────────────────────
function toggleEquipped(i: number) {
  if (sheet.value?.data?.equipment?.[i]) {
    const eq = sheet.value.data.equipment[i]
    eq.equipped = !eq.equipped
    supabase.from('sheets').update({ data: { ...sheet.value.data } }).eq('id', sheet.value.id)
  }
}
function toggleBuff(i: number) {
  if (sheet.value?.data?.buffs?.[i]) {
    const buf = sheet.value.data.buffs[i]
    buf.active = !buf.active
    supabase.from('sheets').update({ data: { ...sheet.value.data } }).eq('id', sheet.value.id)
  }
}

// ── Slot adjustments ───────────────────────────────────────────────────
function handleAdjustSlot(level: number, delta: number, field: 'used' | 'max') {
  if (field === 'used') adjustSlotUsed(level, delta)
  else adjustSlotMax(level, delta)
}

// ── Fetch ──────────────────────────────────────────────────────────────
async function fetchSheet() {
  if (!currentSheetId.value) return
  try { await fetchSheetData(currentSheetId.value) } catch { router.push('/dashboard') }
}
watch(currentSheetId, () => {
  headEditMode.value = false
  tabsEditMode.value = false
  editedData.value = null
  fetchSheet()
})
onMounted(fetchSheet)
</script>

<template>
  <div :class="[isEmbedded ? '' : 'min-h-screen bg-[#0a0a0b] text-foreground']">
    <div :class="[isEmbedded ? '' : 'max-w-5xl mx-auto px-3 py-4']">

      <!-- Back -->
      <div v-if="!isEmbedded" class="mb-3">
        <button @click="router.push('/dashboard')"
          class="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
          <ChevronLeft class="w-4 h-4" /> Voltar
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-28">
        <div class="flex flex-col items-center gap-3 text-zinc-600">
          <Loader2 class="w-8 h-8 animate-spin" />
          <span class="text-sm">Carregando ficha...</span>
        </div>
      </div>

      <template v-else-if="sheet && d">
        <!-- Character name bar -->
        <div class="mb-4 flex items-center justify-between gap-4">
          <div>
            <h1 class="text-xl font-extrabold font-serif text-zinc-100 leading-tight">{{ sheet.name }}</h1>
            <p class="text-xs text-zinc-500 mt-0.5">
              {{ sheet.race }} · {{ sheet.class }} · Nível {{ sheet.level }}
              <span v-if="d.alignment" class="ml-1 text-zinc-600">· {{ d.alignment }}</span>
            </p>
          </div>
          <!-- Edit mode badge -->
          <div v-if="editMode" class="flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-lg px-3 py-1.5 text-xs font-bold text-primary">
            ✏️ Modo Edição
            <button @click="toggleTabsEdit" class="hover:text-primary/70 transition-colors ml-1">Salvar</button>
          </div>
        </div>

        <!-- ═══ TAB BAR ═══ -->
        <div class="sticky top-0 z-30 mb-4 -mx-3 px-3" style="background: linear-gradient(to bottom, #0a0a0b 85%, transparent)">
          <div class="w-full overflow-x-auto scrollbar-hide pb-1">
            <div class="flex gap-1 min-w-max bg-zinc-950/90 border border-zinc-800/70 rounded-xl p-1.5 backdrop-blur-sm">
              <button
                v-for="tab in TABS"
                :key="tab.id"
                @click="activeTab = tab.id"
                class="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap"
                :class="activeTab === tab.id
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60'"
              >
                <component :is="tab.icon" class="w-4 h-4" />
                <span>{{ tab.label }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- ═══ TAB PANELS ═══ -->
        <div class="min-h-[50vh]">

          <!-- RESUMO -->
          <SummaryTab
            v-if="activeTab === 'summary'"
            :sheet="sheet"
            :d="d"
            :edit-mode="editMode"
            :edited-data="editedData"
            :total-h-p="totalHP"
            :total-c-a="totalCA"
            :total-touch="totalTouch"
            :total-flat-footed="totalFlatFooted"
            :total-b-a-b="totalBAB"
            :total-initiative="totalInitiative"
            :total-speed="totalSpeed"
            :melee-atk="meleeAtk"
            :ranged-atk="rangedAtk"
            :grapple-atk="grappleAtk"
            :total-fort="totalFort"
            :total-ref="totalRef"
            :total-will="totalWill"
            :death-status="deathStatus"
            :attr-total="attrTotal"
            :calc-mod="calcMod"
            :mod-str="modStr"
            :mod-str-f="modStrF"
            :resolve-formula="resolveFormula"
            :ATTR_KEYS="ATTR_KEYS"
            :ATTR_LABELS="ATTR_LABELS"
            @save-hp="saveCurrentHP"
            @roll="handleRoll"
            @roll-item="handleItemRoll"
            @add-shortcut="openEditor('shortcut')"
            @delete-shortcut="(i) => confirmDelete('shortcut', i)"
            @add-resource="addResource"
            @adjust-resource="adjustResource"
            @reset-resources="resetResources"
            @delete-resource="deleteResource"
          />

          <!-- PERÍCIAS -->
          <SkillsTab
            v-else-if="activeTab === 'skills'"
            :d="d"
            :edit-mode="editMode"
            :tabs-edit-mode="tabsEditMode"
            :edited-data="editedData"
            :skill-phase="skillPhase"
            :skill-search="skillSearch"
            :filtered-skills-list="filteredSkillsList"
            :active-skills="activeSkills"
            :skill-points-spent="skillPointsSpent"
            :mod-str="modStr"
            :mod-str-f="modStrF"
            :skill-ability-mod="skillAbilityMod"
            :skill-total="skillTotal"
            :is-class-skill="isClassSkill"
            :calc-mod="calcMod"
            :attr-total="attrTotal"
            @toggle-tabs-edit="toggleTabsEdit"
            @update:skill-phase="skillPhase = $event"
            @update:skill-search="skillSearch = $event"
            @toggle-skill-edit="toggleSkillEdit"
            @adjust-rank="adjustRank"
            @add-level-up-skill-points="addLevelUpSkillPoints"
            @roll="handleRoll"
          />

          <!-- TALENTOS & ATAQUES -->
          <FeatsTab
            v-else-if="activeTab === 'feats'"
            :d="d"
            :edit-mode="editMode"
            :mod-str="modStr"
            :resolve-formula="resolveFormula"
            :on-open-editor="openEditor"
            :on-delete="confirmDelete"
            :on-roll="handleRoll"
            :on-dual-roll="(label, atkF, dmgF) => handleItemRoll({ title: label, isAttack: true, attackFormula: atkF, damageFormula: dmgF })"
          />

          <!-- MAGIAS -->
          <SpellsTab
            v-else-if="activeTab === 'spells'"
            :d="d"
            :edit-mode="editMode"
            :tabs-edit-mode="tabsEditMode"
            :spell-slots-max="spellSlotsMax"
            :spell-slots-used="spellSlotsUsed"
            :SPELL_LEVELS="SPELL_LEVELS"
            :mod-str="modStr"
            :resolve-formula="resolveFormula"
            :on-open-editor="openEditor"
            :on-delete="confirmDelete"
            :on-roll-item="(spell: any) => handleItemRoll(spell)"
            :on-adjust-slot="handleAdjustSlot"
            :on-toggle-edit="toggleTabsEdit"
          />

          <!-- ITENS -->
          <EquipmentTab
            v-else-if="activeTab === 'equipment'"
            :d="d"
            :edit-mode="editMode"
            :total-weight="totalWeight"
            :on-open-editor="openEquipmentEditor"
            :on-delete="confirmDelete"
            :on-toggle-equipped="toggleEquipped"
          />

          <!-- RECURSOS -->
          <ResourcesTab
            v-else-if="activeTab === 'resources'"
            :sheet="sheet"
            :edit-mode="editMode"
            :on-adjust="adjustResource"
            :on-reset="resetResources"
            :on-add="addResource"
            :on-delete="deleteResource"
          />

          <!-- BUFFS -->
          <BuffsTab
            v-else-if="activeTab === 'buffs'"
            :d="d"
            :mod-str="modStr"
            :resolve-formula="resolveFormula"
            :on-open-editor="openEditor"
            :on-delete="confirmDelete"
            :on-toggle="toggleBuff"
          />

          <!-- CONFIG -->
          <ConfigTab
            v-else-if="activeTab === 'config'"
            :d="d"
            :b="b"
            :edit-mode="editMode"
            :tabs-edit-mode="tabsEditMode"
            :edited-data="editedData"
            :mod-str="modStr"
            :adjust-field="adjustField"
            :on-toggle-edit="toggleTabsEdit"
          />
        </div>
      </template>
    </div>

    <!-- Item Editor Modal -->
    <ItemEditorModal
      v-model="editorOpen"
      :type="editorType"
      :item="editorItem"
      :index="editorIndex"
      @save="handleEditorSave"
    />

    <!-- Delete confirm -->
    <Teleport to="body">
      <div v-if="isDeleteOpen" class="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4">
        <div class="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full text-center space-y-4">
          <div class="text-4xl">🗑️</div>
          <div>
            <p class="font-bold text-zinc-100">Confirmar exclusão?</p>
            <p class="text-sm text-zinc-500 mt-1">Esta ação não pode ser desfeita.</p>
          </div>
          <div class="flex gap-3">
            <button @click="cancelDelete"
              class="flex-1 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:bg-zinc-800 transition-colors text-sm">
              Cancelar
            </button>
            <button @click="executeDelete"
              class="flex-1 py-2 rounded-lg bg-red-900/80 border border-red-800 text-red-200 hover:bg-red-800 transition-colors text-sm font-bold"
              :class="deleteCountdown > 0 ? 'opacity-50 cursor-not-allowed' : ''">
              {{ deleteCountdown > 0 ? `Aguarde ${deleteCountdown}s...` : 'Excluir' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

```


---
## FILE: supabase_setup.sql
```sql
/**
 * REVISED Supabase Setup Script (v4 - Sheet Sharing)
 * Fixes: Infinite recursion using SECURITY DEFINER function.
 * Enables: Viewing sheets linked to campaigns.
 * Use this to UPDATE your database.
 */

-- Create tables if not exist
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  dm_id UUID REFERENCES auth.users(id) NOT NULL,
  join_code TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS campaign_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  sheet_id UUID REFERENCES sheets(id) ON DELETE SET NULL, 
  role TEXT DEFAULT 'player' CHECK (role IN ('dm', 'player', 'spectator')),
  UNIQUE(campaign_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  sender_name TEXT NOT NULL, 
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'roll', 'system'))
);

-- Enable RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
-- Assuming 'sheets' table already has RLS enabled. If not:
ALTER TABLE sheets ENABLE ROW LEVEL SECURITY;

-- 
-- HELPER FUNCTION: Get campaigns a user is a member of.
-- Prevents infinite recursion by bypassing RLS on table READ.
--
DROP FUNCTION IF EXISTS get_user_campaign_ids();

CREATE OR REPLACE FUNCTION get_user_campaign_ids()
RETURNS TABLE (campaign_id UUID) 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path = public
STABLE
AS $$
  SELECT campaign_id FROM campaign_members WHERE user_id = auth.uid();
$$;

-- CLEANUP OLD POLICIES
DROP POLICY IF EXISTS "Users can view campaigns they belong to" ON campaigns;
DROP POLICY IF EXISTS "Users can create campaigns" ON campaigns;
DROP POLICY IF EXISTS "DM can update campaign" ON campaigns;
DROP POLICY IF EXISTS "DM can delete campaign" ON campaigns;

DROP POLICY IF EXISTS "Members can view other members" ON campaign_members;
DROP POLICY IF EXISTS "Users can join campaigns" ON campaign_members;

DROP POLICY IF EXISTS "Members can view messages" ON messages;
DROP POLICY IF EXISTS "Members can send messages" ON messages;

DROP POLICY IF EXISTS "Campaign members can view linked sheets" ON sheets;


-- RECREATE POLICIES

-- Campaigns:
CREATE POLICY "Users can view campaigns they belong to" ON campaigns
  FOR SELECT USING (
    auth.uid() = dm_id OR 
    id IN (SELECT campaign_id FROM get_user_campaign_ids())
  );

CREATE POLICY "Users can create campaigns" ON campaigns
  FOR INSERT WITH CHECK (auth.uid() = dm_id);
  
CREATE POLICY "DM can update campaign" ON campaigns
  FOR UPDATE USING (auth.uid() = dm_id);

CREATE POLICY "DM can delete campaign" ON campaigns
  FOR DELETE USING (auth.uid() = dm_id);


-- Campaign Members:
CREATE POLICY "Members can view other members" ON campaign_members
  FOR SELECT USING (
    auth.uid() = user_id OR
    campaign_id IN (SELECT campaign_id FROM get_user_campaign_ids()) OR
    campaign_id IN (SELECT id FROM campaigns WHERE dm_id = auth.uid())
  );

CREATE POLICY "Users can join campaigns" ON campaign_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Messages:
CREATE POLICY "Members can view messages" ON messages
  FOR SELECT USING (
    campaign_id IN (SELECT campaign_id FROM get_user_campaign_ids()) OR
    campaign_id IN (SELECT id FROM campaigns WHERE dm_id = auth.uid())
  );

CREATE POLICY "Members can send messages" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND (
      campaign_id IN (SELECT campaign_id FROM get_user_campaign_ids()) OR
      campaign_id IN (SELECT id FROM campaigns WHERE dm_id = auth.uid())
    )
  );

-- Sheets:
-- Allow viewing sheets that are linked to a campaign I am also in (or DM of)
CREATE POLICY "Campaign members can view linked sheets" ON sheets
  FOR SELECT USING (
    -- Access if sheet is linked to a campaign I am in
    id IN (
      SELECT sheet_id FROM campaign_members 
      WHERE campaign_id IN (SELECT campaign_id FROM get_user_campaign_ids())
    ) 
    OR
    -- Access if sheet is linked to a campaign I DM
    id IN (
      SELECT sheet_id FROM campaign_members 
      WHERE campaign_id IN (SELECT id FROM campaigns WHERE dm_id = auth.uid())
    )
  );

-- Grants (To ensure authenticated user has access)
GRANT EXECUTE ON FUNCTION get_user_campaign_ids TO authenticated;
GRANT ALL ON campaign_members TO authenticated;
GRANT ALL ON campaigns TO authenticated;
GRANT ALL ON messages TO authenticated;

```


---
## FILE: tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{vue,js,ts,jsx,tsx}",
    ],
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                lumina: {
                    text: "#E4E4E7", // zinc-200
                    "text-muted": "#71717A", // zinc-500
                    detail: "#DFD4BD", // Gold/Beige
                    border: "#27272A", // zinc-800
                    card: "#18181B", // zinc-900
                    bg: "#09090B", // zinc-950
                },
            },
            borderRadius: {
                xl: "calc(var(--radius) + 4px)",
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            fontFamily: {
                sans: ["Inter", "sans-serif"],
                serif: ["Merriweather", "serif"],
            },
            keyframes: {},
        },
    },
    plugins: [
        require('tailwind-scrollbar'),
    ],
}

```


---
## FILE: tsconfig.app.json
```json
{
  "extends": "@vue/tsconfig/tsconfig.dom.json",
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "types": [
      "vite/client"
    ],
    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true,
    "baseUrl": ".",
    "paths": {
      "@/*": [
        "./src/*"
      ]
    }
  },
  "include": [
    "src/**/*.ts",
    "src/**/*.tsx",
    "src/**/*.vue"
  ]
}
```


---
## FILE: tsconfig.json
```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}

```


---
## FILE: tsconfig.node.json
```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "ES2023",
    "lib": ["ES2023"],
    "module": "ESNext",
    "types": ["node"],
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["vite.config.ts"]
}

```


---
## FILE: vercel.json
```json
{
    "rewrites": [
        {
            "source": "/(.*)",
            "destination": "/index.html"
        }
    ]
}
```


---
## FILE: vite.config.ts
```typescript
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})

```
