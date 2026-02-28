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
