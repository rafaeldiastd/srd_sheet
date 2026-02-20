<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import ChatSidebar from '@/components/campaign/ChatSidebar.vue'
import CampaignRollPanel from '@/components/campaign/CampaignRollPanel.vue'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Scroll, Users, Copy, LogOut, Shield, Crown } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const campaignId = route.params.id as string
const campaign = ref<any>(null)
const members = ref<any[]>([])
const loading = ref(true)
const isDM = ref(false)

async function fetchCampaign() {
    loading.value = true
    // Get Campaign Details
    const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single()

    if (campaignError) {
        console.error('Error fetching campaign:', campaignError)
        router.push('/dashboard') // Redirect if not found or no access
        return
    }
    campaign.value = campaignData

    // Identify Role
    if (campaignData.dm_id === authStore.user?.id) {
        isDM.value = true
    }

    // Get Members with Sheet info
    // We join campaign_members -> sheets
    const { data: memberData, error: memberError } = await supabase
        .from('campaign_members')
        .select(`
        *,
        sheets (id, name, class, level, data)
    `)
        .eq('campaign_id', campaignId)

    if (memberData) {
        members.value = memberData
    }

    loading.value = false
}

function copyJoinCode() {
    if (campaign.value?.join_code) {
        navigator.clipboard.writeText(campaign.value.join_code)
        // Toast success?
    }
}

function leaveCampaign() {
    if (confirm('Sair da campanha?')) {
        router.push('/dashboard')
    }
}

onMounted(() => {
    fetchCampaign()
})
</script>

<template>
    <div class="flex h-screen bg-background text-foreground overflow-hidden">
        <!-- Main Content Area -->
        <main class="flex-1 flex flex-col min-w-0">

            <!-- Top Bar -->
            <header class="h-16 border-b border-border flex items-center justify-between px-6 bg-zinc-950/50">
                <div class="flex items-center gap-3">
                    <Button variant="ghost" size="icon" @click="router.push('/dashboard')">
                        <Scroll class="w-5 h-5 text-muted-foreground" />
                    </Button>
                    <div v-if="campaign">
                        <h1 class="font-serif font-bold text-xl">{{ campaign.name }}</h1>
                    </div>
                    <div v-else class="h-6 w-32 bg-zinc-800 animate-pulse rounded"></div>
                </div>

                <div class="flex items-center gap-3">
                    <div v-if="campaign && isDM"
                        class="flex items-center gap-2 bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-800">
                        <span class="text-xs text-muted-foreground uppercase font-bold">Código:</span>
                        <code class="text-sm font-mono text-primary font-bold">{{ campaign.join_code }}</code>
                        <button @click="copyJoinCode" class="text-muted-foreground hover:text-foreground">
                            <Copy class="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <Button variant="ghost" size="icon" @click="leaveCampaign">
                        <LogOut class="w-5 h-5 text-destructive" />
                    </Button>
                </div>
            </header>

            <!-- Dashboard Grid -->
            <div class="flex-1 p-6 overflow-y-auto">
                <div v-if="loading" class="flex justify-center py-20">
                    <div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>

                <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    <!-- Members Card -->
                    <Card class="bg-zinc-900/40 border-zinc-800 md:col-span-2">
                        <CardHeader>
                            <CardTitle class="flex items-center gap-2 text-base">
                                <Users class="w-4 h-4 text-primary" /> Aventureiros
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div v-if="members.length === 0" class="text-sm text-muted-foreground">Ninguém entrou ainda.
                            </div>
                            <ul v-else class="space-y-2">
                                <li v-for="member in members" :key="member.id"
                                    class="flex items-center justify-between p-3 rounded-lg bg-zinc-950/50 border border-zinc-900 transition-colors hover:border-zinc-800">
                                    <div class="flex items-center gap-3">
                                        <!-- Avatar / Icon -->
                                        <div v-if="member.sheets?.data?.avatar_url"
                                            class="w-10 h-10 rounded-full overflow-hidden border border-zinc-700 bg-zinc-900">
                                            <img :src="member.sheets.data.avatar_url"
                                                class="w-full h-full object-cover" />
                                        </div>
                                        <div v-else
                                            class="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                                            <component :is="member.role === 'dm' ? Crown : Shield"
                                                class="w-5 h-5 text-zinc-500" />
                                        </div>

                                        <div>
                                            <div class="flex items-center gap-2">
                                                <p class="text-sm font-bold text-zinc-200">
                                                    {{ member.sheets?.name || (member.user_id === authStore.user?.id ?
                                                        'Você' : 'Jogador') }}
                                                </p>
                                                <span v-if="member.role === 'dm'"
                                                    class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">MESTRE</span>
                                                <span v-if="member.user_id === authStore.user?.id"
                                                    class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">VOCÊ</span>
                                            </div>
                                            <p class="text-xs text-muted-foreground" v-if="member.sheets">
                                                {{ member.sheets.class }} Nvl {{ member.sheets.level }}
                                            </p>
                                            <p v-else class="text-xs text-zinc-600 italic">Sem ficha vinculada</p>
                                        </div>
                                    </div>

                                    <!-- Action -->
                                    <Button v-if="member.sheet_id" variant="ghost" size="sm"
                                        class="h-8 text-xs gap-1 hover:text-primary hover:bg-primary/10"
                                        @click="router.push(`/sheet/${member.sheet_id}`)">
                                        <Scroll class="w-3 h-3" /> Ver Ficha
                                    </Button>
                                </li>
                            </ul>
                        </CardContent>
                    </Card>

                    <!-- Quick Info / Status -->
                    <Card class="bg-zinc-900/40 border-zinc-800">
                        <CardHeader>
                            <CardTitle class="text-base">Mesa de Jogo</CardTitle>
                        </CardHeader>
                        <CardContent class="text-sm text-muted-foreground">
                            <p>Funcionalidade de rolagens públicas e mapas em breve.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>

        <!-- Roll Panel (left of chat) -->
        <CampaignRollPanel :campaign-id="campaignId" />

        <!-- Chat Sidebar -->
        <ChatSidebar :campaign-id="campaignId" />
    </div>
</template>
