<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { Plus, LogOut, Scroll, Sword, Wand2, Leaf, Music, Skull, ShieldCheck, Trash2, Users, Key } from 'lucide-vue-next'
import CreateCampaignModal from '@/components/campaign/CreateCampaignModal.vue'
import JoinCampaignModal from '@/components/campaign/JoinCampaignModal.vue'

const authStore = useAuthStore()
const router = useRouter()
const sheets = ref<any[]>([])
const campaigns = ref<any[]>([])
const loading = ref(true)
const loadingCampaigns = ref(true)
const deletingId = ref<string | null>(null)
const showCreateModal = ref(false)
const showJoinModal = ref(false)

async function fetchSheets() {
  loading.value = true
  const { data, error } = await supabase
    .from('sheets')
    .select('*')
    .order('created_at', { ascending: false })
  if (!error) sheets.value = data || []
  loading.value = false
}

async function deleteSheet(id: string, name: string) {
  if (!confirm(`Deletar "${name}"? Esta ação não pode ser desfeita.`)) return
  deletingId.value = id
  const { error } = await supabase.from('sheets').delete().eq('id', id)
  if (!error) sheets.value = sheets.value.filter(s => s.id !== id)
  if (!error) sheets.value = sheets.value.filter(s => s.id !== id)
  deletingId.value = null
}

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

function viewSheet(id: string) { router.push(`/sheet/${id}`) }
function createSheet() { router.push('/create') }

const ATTR_KEYS = [
  { key: 'str', label: 'FOR' },
  { key: 'dex', label: 'DES' },
  { key: 'con', label: 'CON' },
  { key: 'int', label: 'INT' },
  { key: 'wis', label: 'SAB' },
  { key: 'cha', label: 'CAR' },
]

const CLASS_CONFIG: Record<string, { icon: any; gradient: string; accent: string }> = {
  'Bárbaro': { icon: Sword, gradient: 'from-red-950 via-red-900/80 to-zinc-950', accent: '#ef4444' },
  'Guerreiro': { icon: ShieldCheck, gradient: 'from-orange-950 via-orange-900/70 to-zinc-950', accent: '#f97316' },
  'Paladino': { icon: ShieldCheck, gradient: 'from-yellow-950 via-yellow-900/70 to-zinc-950', accent: '#eab308' },
  'Ladino': { icon: Skull, gradient: 'from-zinc-900 via-zinc-800/70 to-zinc-950', accent: '#a1a1aa' },
  'Ranger': { icon: Leaf, gradient: 'from-green-950 via-green-900/70 to-zinc-950', accent: '#22c55e' },
  'Druida': { icon: Leaf, gradient: 'from-emerald-950 via-emerald-900/70 to-zinc-950', accent: '#10b981' },
  'Clérigo': { icon: ShieldCheck, gradient: 'from-amber-950 via-amber-900/60 to-zinc-950', accent: '#f59e0b' },
  'Monge': { icon: Skull, gradient: 'from-slate-900 via-slate-800/70 to-zinc-950', accent: '#94a3b8' },
  'Mago': { icon: Wand2, gradient: 'from-blue-950 via-blue-900/70 to-zinc-950', accent: '#3b82f6' },
  'Feiticeiro': { icon: Wand2, gradient: 'from-indigo-950 via-indigo-900/70 to-zinc-950', accent: '#6366f1' },
  'Bardo': { icon: Music, gradient: 'from-rose-950 via-rose-900/70 to-zinc-950', accent: '#f43f5e' },
}

function classConfig(cls: string) {
  return CLASS_CONFIG[cls] || { icon: Scroll, gradient: 'from-zinc-900 via-zinc-800/50 to-zinc-950', accent: '#dfd4bd' }
}

function calcMod(score: number) {
  const m = Math.floor((score - 10) / 2)
  return m >= 0 ? `+${m}` : `${m}`
}

onMounted(() => {
  if (authStore.user) {
    fetchSheets()
    fetchCampaigns()
  }
})
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">

    <!-- Sticky top bar -->
    <header
      class="border-b border-border px-8 py-4 flex items-center justify-between bg-background/80 backdrop-blur-sm sticky top-0 z-10">
      <div class="flex items-center gap-3">
        <Scroll class="w-5 h-5 text-primary" />
        <span class="font-serif font-bold text-primary tracking-wide">Grimório</span>
      </div>
      <div class="flex items-center gap-3">
        <Button @click="createSheet" size="sm" class="gap-2">
          <Plus class="w-4 h-4" /> Novo Personagem
        </Button>
        <Button variant="ghost" size="sm" @click="authStore.signOut"
          class="text-muted-foreground hover:text-destructive">
          <LogOut class="w-4 h-4" />
        </Button>
      </div>
    </header>

    <main class="max-w-6xl mx-auto px-6 py-10 space-y-12">

      <!-- ── CAMPAIGNS SECTION ── -->
      <section>
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
        <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div v-for="camp in campaigns" :key="camp.id"
            class="group relative bg-zinc-900 border border-zinc-800 hover:border-primary/50 rounded-xl p-5 cursor-pointer transition-all hover:bg-zinc-900/80"
            @click="router.push(`/campaign/${camp.id}`)">
            <div class="flex justify-between items-start mb-2">
              <h3 class="font-bold text-lg font-serif group-hover:text-primary transition-colors">{{ camp.name }}</h3>
              <span v-if="camp.dm_id === authStore.user?.id"
                class="text-[10px] font-bold bg-primary/20 text-primary px-2 py-0.5 rounded border border-primary/30">MESTRE</span>
            </div>
            <div class="text-xs text-muted-foreground flex items-center gap-4">
              <div class="flex items-center gap-1">
                <Users class="w-3 h-3" /> <span>Entrar</span>
              </div>
              <span>{{ new Date(camp.created_at).toLocaleDateString() }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Title row -->
      <div>
        <h1 class="text-2xl font-serif font-bold text-foreground">Seus Personagens</h1>
        <p class="text-sm text-muted-foreground mt-0.5">
          {{ sheets.length }} {{ sheets.length === 1 ? 'aventureiro' : 'aventureiros' }} encontrado{{ sheets.length ===
            1 ? '' : 's' }}
        </p>
      </div>

      <!-- Skeletons -->
      <div v-if="loading" class="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <div v-for="i in 3" :key="i" class="h-80 rounded-xl bg-card animate-pulse border border-border" />
      </div>

      <!-- Empty state -->
      <div v-else-if="sheets.length === 0"
        class="flex flex-col items-center justify-center text-center py-24 space-y-5">
        <div class="w-20 h-20 rounded-full border-2 border-dashed border-border flex items-center justify-center">
          <Scroll class="w-8 h-8 text-muted-foreground" />
        </div>
        <div>
          <h2 class="text-lg font-semibold">Nenhum personagem ainda</h2>
          <p class="text-sm text-muted-foreground mt-1 max-w-xs">Comece criando sua primeira ficha de aventureiro</p>
        </div>
        <Button @click="createSheet" size="lg" class="gap-2">
          <Plus class="w-4 h-4" /> Criar Personagem
        </Button>
      </div>

      <!-- Character Cards -->
      <div v-else class="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

        <div v-for="sheet in sheets" :key="sheet.id"
          class="relative rounded-xl overflow-hidden border border-white/5 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group"
          :class="deletingId === sheet.id ? 'opacity-50 pointer-events-none' : ''">
          <!-- ── Background image / gradient ── -->
          <div class="absolute inset-0">
            <img v-if="sheet.data?.avatar_url" :src="sheet.data.avatar_url" :alt="sheet.name"
              class="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105" />
            <div v-else class="w-full h-full bg-gradient-to-b flex items-end justify-end p-4"
              :class="classConfig(sheet.class).gradient">
              <component :is="classConfig(sheet.class).icon"
                class="w-36 h-36 opacity-10 group-hover:opacity-20 transition-opacity duration-300 -rotate-12"
                :style="{ color: classConfig(sheet.class).accent }" />
            </div>
          </div>

          <!-- Gradient overlays -->
          <div
            class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-zinc-950/10 pointer-events-none">
          </div>

          <!-- Delete button — top right, visible on hover -->
          <div class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
            <button @click.stop="deleteSheet(sheet.id, sheet.name)"
              class="w-8 h-8 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-900/50 flex items-center justify-center text-red-400 hover:text-red-300 transition-colors backdrop-blur-sm"
              title="Deletar personagem">
              <Trash2 class="w-4 h-4" />
            </button>
          </div>

          <!-- Card content — clickable -->
          <div @click="viewSheet(sheet.id)"
            class="relative z-10 flex flex-col h-full cursor-pointer p-5 space-y-4 min-h-80">
            <!-- Level badge -->
            <div class="flex items-start justify-between">
              <span class="text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border" :style="{
                color: classConfig(sheet.class).accent,
                borderColor: classConfig(sheet.class).accent + '44',
                backgroundColor: classConfig(sheet.class).accent + '18'
              }">
                Nível {{ sheet.level }}
              </span>
            </div>

            <!-- Spacer pushes content to bottom -->
            <div class="flex-1"></div>

            <!-- Name -->
            <div>
              <h2
                class="text-2xl font-serif font-bold text-white leading-tight group-hover:text-primary transition-colors duration-200">
                {{ sheet.name }}
              </h2>
              <!-- Race · Class -->
              <p class="text-sm mt-0.5 font-medium" :style="{ color: classConfig(sheet.class).accent + 'bb' }">
                {{ sheet.data?.race }} · {{ sheet.class }}
              </p>
            </div>

            <!-- 6 Attributes grid -->
            <div class="grid grid-cols-6 gap-1 pt-1">
              <div v-for="attr in ATTR_KEYS" :key="attr.key"
                class="flex flex-col items-center py-1.5 px-1 rounded bg-zinc-900/70 border border-white/5">
                <span class="text-[9px] font-bold uppercase text-zinc-500 leading-none mb-0.5">{{ attr.label }}</span>
                <span class="text-sm font-bold text-zinc-100 leading-none">{{ sheet.data?.attributes?.[attr.key]?.base
                  || 10 }}</span>
                <span class="text-[9px] text-zinc-500 leading-none mt-0.5">
                  {{ calcMod(sheet.data?.attributes?.[attr.key]?.base || 10) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Hover border glow -->
          <div
            class="absolute inset-0 border-2 border-transparent group-hover:border-primary/30 rounded-xl transition-all duration-300 pointer-events-none z-20">
          </div>
        </div>

        <!-- ── Add new card ── -->
        <div @click="createSheet"
          class="min-h-80 rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-300 hover:bg-card text-muted-foreground hover:text-primary group">
          <div
            class="w-12 h-12 rounded-full border-2 border-current flex items-center justify-center transition-transform group-hover:scale-110">
            <Plus class="w-5 h-5" />
          </div>
          <span class="text-sm font-medium">Novo Personagem</span>
        </div>

      </div>
    </main>

    <CreateCampaignModal v-if="showCreateModal" @close="showCreateModal = false; fetchCampaigns()" />
    <JoinCampaignModal v-if="showJoinModal" @close="showJoinModal = false; fetchCampaigns()" />
  </div>
</template>
