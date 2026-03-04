<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { Copy, BookOpen, Scroll, FileText, LayoutTemplate, MessageSquare, LogOut } from 'lucide-vue-next'
import ChatSidebar from '@/components/campaign/ChatSidebar.vue'
import QuickNpcModal from '@/components/campaign/QuickNpcModal.vue'
import SheetView from '@/views/SheetView.vue'
import { useCampaignRolls } from '@/lib/useCampaignRolls'
import SheetSelectorModal from '@/components/campaign/SheetSelectorModal.vue'
import NotepadPanel from '@/components/campaign/notepad/NotepadPanel.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const campaignId = route.params.id as string
const campaign = ref<any>(null)
const members = ref<any[]>([])
const loading = ref(true)
const isDM = ref(false)
const showNpcModal = ref(false)
const showSheetSelector = ref(false)

// UI state
const showChat = ref(true)
const showNotes = ref(false)

// Sheet selector state
const mySheets = ref<any[]>([])
const selectedSheetId = ref<string>('none')
const myMemberId = ref<string>('')
const savingSheet = ref(false)
const sheetSaved = ref(false)

const myCurrentSheetId = computed(() => {
    return selectedSheetId.value === 'none' ? null : selectedSheetId.value
})

const myMemberName = computed(() => {
    if (isDM.value) return 'Mestre'
    const activeSheet = mySheets.value.find(s => s.id === selectedSheetId.value)
    if (activeSheet) return activeSheet.name
    return authStore.user?.user_metadata?.name || 'Jogador'
})

const myAvatarUrl = computed(() => {
    if (isDM.value) return null
    const activeSheet = mySheets.value.find(s => s.id === selectedSheetId.value)
    if (!activeSheet?.data) return null
    const data = typeof activeSheet.data === 'string' 
      ? JSON.parse(activeSheet.data) 
      : activeSheet.data
    return data.avatar_url || null
})

const recipientId = ref('all')

const { sendRoll, sendAttackRoll, sendDescription } = useCampaignRolls(campaignId, myMemberName, recipientId, myAvatarUrl)

async function fetchCampaign() {
    loading.value = true

    const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single()

    if (campaignError) {
        console.error('Error fetching campaign:', campaignError)
        router.push('/dashboard')
        return
    }
    campaign.value = campaignData
    isDM.value = campaignData.dm_id === authStore.user?.id

    const { data: memberData } = await supabase
        .from('campaign_members')
        .select('*, sheets (id, name, class, level, data)')
        .eq('campaign_id', campaignId)

    if (memberData) {
        members.value = memberData
        const me = memberData.find((m: any) => m.user_id === authStore.user?.id)
        if (me) {
            myMemberId.value = me.id
            
            // Priority: LocalStorage > Database > 'none'
            const lastSheetId = localStorage.getItem(`last_sheet_${campaignId}_${authStore.user?.id}`)
            const dbSheetId = me.sheet_id
            
            if (lastSheetId && lastSheetId !== 'none') {
                selectedSheetId.value = lastSheetId
            } else if (dbSheetId) {
                selectedSheetId.value = dbSheetId
                // Keep localstorage synced
                localStorage.setItem(`last_sheet_${campaignId}_${authStore.user?.id}`, dbSheetId)
            } else {
                selectedSheetId.value = 'none'
            }
        }
    }

    loading.value = false
}

async function fetchMySheets() {
    // Busca as fichas atreladas rigorosamente a esta campanha
    const { data } = await supabase
        .from('sheets')
        .select('id, name, class, level, data, campaign_id')
        .eq('user_id', authStore.user?.id)
        .eq('campaign_id', campaignId)
        
    if (data) {
        mySheets.value = data
    }
}

function handleNpcSaved(sheetId: string) {
    showNpcModal.value = false
    fetchMySheets().then(() => {
        handleSheetSelected(sheetId)
    })
}

async function handleSheetSelected(sheetId: string) {
    if (!myMemberId.value) return
    savingSheet.value = true
    sheetSaved.value = false
    selectedSheetId.value = sheetId
    showSheetSelector.value = false // close modal

    const sheetIdToSave = sheetId === 'none' ? null : sheetId
    
    // Check if the sheet needs to be linked to this campaign first
    if (sheetIdToSave) {
        const sheet = mySheets.value.find(s => s.id === sheetIdToSave)
        if (sheet && sheet.campaign_id !== campaignId) {
             await supabase
                .from('sheets')
                .update({ campaign_id: campaignId })
                .eq('id', sheetIdToSave)
             sheet.campaign_id = campaignId // update locally
        }
    }

    // Set as active character in campaign
    const { error } = await supabase
        .from('campaign_members')
        .update({ sheet_id: sheetIdToSave })
        .eq('id', myMemberId.value)

    if (!error) {
        // Update local state
        const me = members.value.find(m => m.user_id === authStore.user?.id)
        if (me) me.sheet_id = sheetIdToSave

        localStorage.setItem(`last_sheet_${campaignId}_${authStore.user?.id}`, sheetIdToSave || 'none')

        sheetSaved.value = true
        setTimeout(() => { sheetSaved.value = false }, 2000)
    }
    savingSheet.value = false
}

function copyJoinCode() {
    if (campaign.value?.join_code) {
        navigator.clipboard.writeText(campaign.value.join_code)
    }
}

function leaveCampaign() {
    if (confirm('Sair da campanha?')) {
        router.push('/dashboard')
    }
}

function handleSheetDeleted(sheetId: string) {
    mySheets.value = mySheets.value.filter(s => s.id !== sheetId)
    if (selectedSheetId.value === sheetId) {
        selectedSheetId.value = 'none'
        localStorage.setItem(`last_sheet_${campaignId}_${authStore.user?.id}`, 'none')
    }
}

onMounted(async () => {
    await fetchCampaign()
    await fetchMySheets()

    // Validate if the selected sheet still exists 
    // (User might have deleted it from the database manually)
    if (selectedSheetId.value !== 'none') {
        const stillExists = mySheets.value.some(s => s.id === selectedSheetId.value)
        if (!stillExists) {
            selectedSheetId.value = 'none'
            localStorage.setItem(`last_sheet_${campaignId}_${authStore.user?.id}`, 'none')
            // Optionally update the DB as well if we are the user
            if (myMemberId.value) {
                await supabase.from('campaign_members').update({ sheet_id: null }).eq('id', myMemberId.value)
            }
        }
    }
})
</script>

<template>
    <div class="flex h-screen bg-background text-foreground overflow-hidden">
        <!-- Main Content Area -->
        <main class="flex-1 flex flex-col min-w-0" :class="{ 'hidden lg:flex': showChat && !myCurrentSheetId }">

            <!-- Top Bar -->
            <header class="h-16 border-b border-border flex items-center justify-between px-4 sm:px-6 bg-card/50">
                <div class="flex items-center gap-2 sm:gap-3">
                    <Button variant="ghost" size="icon" @click="router.push('/dashboard')">
                        <Scroll class="w-5 h-5 text-muted-foreground" />
                    </Button>
                    <div v-if="campaign" class="flex-1 min-w-0">
                        <h1 class="font-serif font-bold text-lg sm:text-xl truncate max-w-[120px] sm:max-w-xs">{{ campaign.name }}</h1>
                    </div>
                    <div v-else class="h-6 w-24 sm:w-32 bg-muted animate-pulse rounded"></div>
                </div>

                <!-- Navigation Controls -->
                <nav class="flex items-center gap-1">

                    <!-- Notas -->
                    <button
                      @click="showNotes = !showNotes"
                      :class="[
                        'flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium transition-colors',
                        showNotes
                          ? 'bg-primary/15 text-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      ]"
                    >
                      <BookOpen class="w-3.5 h-3.5 shrink-0" />
                      <span class="hidden sm:inline">Notas</span>
                    </button>

                    <!-- Chat -->
                    <button
                      @click="showChat = !showChat"
                      :class="[
                        'flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium transition-colors',
                        showChat
                          ? 'bg-primary/15 text-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      ]"
                    >
                      <MessageSquare class="w-3.5 h-3.5 shrink-0" />
                      <span class="hidden sm:inline">Chat</span>
                    </button>


                    <!-- Trocar Ficha -->
                    <button
                      @click="showSheetSelector = true"
                      :class="[
                        'flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium transition-colors border',
                        sheetSaved
                          ? 'border-green-600/40 bg-green-600/10 text-green-400'
                          : 'border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted'
                      ]"
                    >
                      <LayoutTemplate class="w-3.5 h-3.5 shrink-0" />
                      <span class="hidden sm:inline">{{ selectedSheetId === 'none' ? 'Espectador' : 'Trocar Ficha' }}</span>
                    </button>


                    <!-- DM: Join Code -->
                    <div v-if="campaign && isDM"
                        class="hidden md:flex items-center gap-2 bg-card px-3 py-1 rounded-md border border-border h-8">
                        <span class="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Código:</span>
                        <code class="text-xs font-mono text-primary font-bold">{{ campaign.join_code }}</code>
                        <button @click="copyJoinCode" class="text-muted-foreground hover:text-foreground">
                            <Copy class="w-3 h-3" />
                        </button>
                    </div>

                    <!-- DM: Criar NPC -->
                    <button v-if="isDM" @click="showNpcModal = true"
                        class="hidden md:flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                        Criar NPC
                    </button>

                    <!-- Sair -->
                    <button
                      @click="leaveCampaign"
                      class="flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut class="w-3.5 h-3.5 shrink-0" />
                      <span class="hidden sm:inline">Sair</span>
                    </button>
                </nav>

            </header>

            <!-- Workspace Setup: Notepad (Left) + Sheet (Center) -->
            <div class="flex-1 flex overflow-hidden relative">
                <div v-if="loading" class="absolute inset-0 z-10 bg-background/50 flex justify-center py-20 backdrop-blur-sm">
                    <div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>

                <!-- Notepad (Left Panel) -->
                <NotepadPanel 
                  v-if="showNotes"
                  :campaign-id="campaignId"
                  :visible="showNotes"
                  @close="showNotes = false"
                />

                <!-- Character Sheet (Center Panel) -->
                <div class="flex-1 overflow-y-auto bg-background px-0 sm:px-4 lg:px-8 py-0 sm:py-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground" 
                     :class="{ 'hidden lg:block': showNotes || (showChat && !myCurrentSheetId) }">
                    <div v-if="myCurrentSheetId" class="h-full">
                        <SheetView :sheet-id="myCurrentSheetId" is-embedded :on-roll="sendRoll"
                            :on-attack-roll="sendAttackRoll" :on-show-description="sendDescription" />
                    </div>
                    <div v-else class="flex flex-col items-center justify-center h-full text-center gap-4 p-8">
                        <FileText class="w-12 h-12 text-muted" />
                        <h2 class="text-xl font-bold">Espectador</h2>
                        <p class="text-muted-foreground max-w-sm">Você está acompanhando a campanha sem uma ficha ativa. Use o botão no topo para selecionar ou criar uma ficha para rolar dados.</p>
                        <Button @click="showSheetSelector = true" class="mt-4">
                             Selecionar Ficha
                        </Button>
                    </div>
                </div>
            </div>
        </main>

        <!-- Chat Sidebar -->
        <ChatSidebar v-show="showChat" :campaign-id="campaignId" :member-name="myMemberName" :avatar-url="myAvatarUrl" :members="members" :dm-id="campaign?.dm_id"
            v-model:recipientId="recipientId" class="w-full lg:w-96 flex-shrink-0" :class="{ 'hidden lg:flex': !showChat }" />

        <!-- Modals -->
        <QuickNpcModal v-if="showNpcModal" @close="showNpcModal = false" @saved="handleNpcSaved" />
        <SheetSelectorModal v-model="showSheetSelector" :sheets="mySheets" :active-sheet-id="selectedSheetId" @select-sheet="handleSheetSelected" @sheet-deleted="handleSheetDeleted" />
    </div>
</template>
