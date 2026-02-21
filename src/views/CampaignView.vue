<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { Copy, BookOpen, Scroll, FileText, LogOut } from 'lucide-vue-next'
import ChatSidebar from '@/components/campaign/ChatSidebar.vue'
import QuickNpcModal from '@/components/campaign/QuickNpcModal.vue'
import SheetView from '@/views/SheetView.vue'
import { useCampaignRolls } from '@/lib/useCampaignRolls'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const campaignId = route.params.id as string
const campaign = ref<any>(null)
const members = ref<any[]>([])
const loading = ref(true)
const isDM = ref(false)
const showNpcModal = ref(false)

// Sheet selector state
const mySheets = ref<any[]>([])
const selectedSheetId = ref<string>('')
const myMemberId = ref<string>('')
const savingSheet = ref(false)
const sheetSaved = ref(false)

const notepadContent = ref('')

// Load notepad and last selected sheet from localStorage based on campaign + user
onMounted(() => {
    const savedNote = localStorage.getItem(`notepad_${campaignId}_${authStore.user?.id}`)
    if (savedNote) {
        notepadContent.value = savedNote
    }

    const lastSheet = localStorage.getItem(`last_sheet_${campaignId}_${authStore.user?.id}`)
    if (lastSheet && !selectedSheetId.value) {
        selectedSheetId.value = lastSheet
    }
})

function saveNotepad() {
    localStorage.setItem(`notepad_${campaignId}_${authStore.user?.id}`, notepadContent.value)
}

const myCurrentSheetId = computed(() => {
    const me = members.value.find(m => m.user_id === authStore.user?.id)
    const dbId = me?.sheet_id
    if (dbId) return dbId

    // Fallback to the ref (which might be loaded from localStorage)
    if (selectedSheetId.value && selectedSheetId.value !== 'none') {
        return selectedSheetId.value
    }

    return null
})

const myMemberName = computed(() => {
    if (isDM.value) return 'Mestre'
    const activeSheet = mySheets.value.find(s => s.id === selectedSheetId.value)
    if (activeSheet) return activeSheet.name
    return authStore.user?.user_metadata?.name || 'Jogador'
})

const recipientId = ref('all')

const { sendRoll, sendDualRoll } = useCampaignRolls(campaignId, myMemberName, recipientId)

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
            const dbSheetId = me.sheet_id ?? 'none'
            selectedSheetId.value = dbSheetId
            localStorage.setItem(`last_sheet_${campaignId}_${authStore.user?.id}`, dbSheetId)
        }
    }

    loading.value = false
}

async function fetchMySheets() {
    const { data } = await supabase
        .from('sheets')
        .select('id, name, class, level')
        .order('name')
    if (data) mySheets.value = data
}

function handleNpcSaved(sheetId: string) {
    showNpcModal.value = false
    fetchMySheets().then(() => {
        selectedSheetId.value = sheetId
        saveActiveSheet()
    })
}

async function saveActiveSheet() {
    if (!myMemberId.value) return
    savingSheet.value = true
    sheetSaved.value = false

    const sheetIdToSave = selectedSheetId.value === 'none' ? null : selectedSheetId.value
    const { error } = await supabase
        .from('campaign_members')
        .update({ sheet_id: sheetIdToSave })
        .eq('id', myMemberId.value)

    if (!error) {
        // Update local state and localStorage
        const me = members.value.find(m => m.user_id === authStore.user?.id)
        if (me) me.sheet_id = sheetIdToSave

        localStorage.setItem(`last_sheet_${campaignId}_${authStore.user?.id}`, selectedSheetId.value)

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

onMounted(async () => {
    await fetchCampaign()
    await fetchMySheets()
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

                <!-- Sheet Selector in Header -->
                <div class="flex items-center gap-2 bg-zinc-900/50 p-1 rounded-lg border border-zinc-800">
                    <Select v-model="selectedSheetId" @update:modelValue="saveActiveSheet">
                        <SelectTrigger class="h-8 w-[200px] text-xs bg-zinc-950 border-zinc-700">
                            <SelectValue placeholder="Escolher ficha..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Nenhuma / Espectador</SelectItem>
                            <SelectItem v-for="s in mySheets" :key="s.id" :value="s.id">
                                {{ s.name }}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    <div class="w-20 text-xs text-muted-foreground flex items-center h-8 px-2">
                        <span v-if="savingSheet">Salvando...</span>
                        <span v-else-if="sheetSaved" class="text-green-500">Salvo!</span>
                    </div>
                </div>

                <div class="flex items-center gap-3">
                    <Button v-if="isDM" @click="showNpcModal = true" variant="outline" size="sm"
                        class="h-8 text-xs border-zinc-700 hover:bg-zinc-800">
                        Criar NPC
                    </Button>

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

            <!-- Two Column Setup: Notepad (Left) + Sheet (Center) -->
            <!-- The ChatSidebar (Right) is completely outside this element -->
            <div class="flex-1 flex overflow-hidden">
                <div v-if="loading" class="flex-1 flex justify-center py-20">
                    <div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>

                <template v-else>
                    <!-- Notepad (Left Panel) -->
                    <div class="w-80 border-r border-border bg-zinc-950/30 flex flex-col hidden lg:flex">
                        <div class="h-10 border-b border-border flex items-center px-4 bg-zinc-950/50 shrink-0">
                            <h2
                                class="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <BookOpen class="w-3.5 h-3.5" /> Anotações
                            </h2>
                        </div>
                        <div class="flex-1 p-3">
                            <Textarea v-model="notepadContent" @input="saveNotepad"
                                placeholder="Anotações da campanha... Suas notas são salvas apenas para você."
                                class="w-full h-full resize-none border-none bg-transparent focus-visible:ring-0 p-1 text-sm text-zinc-300 placeholder:text-zinc-600 font-mono" />
                        </div>
                    </div>

                    <!-- Character Sheet (Center Panel) -->
                    <div
                        class="flex-1 overflow-y-auto bg-background px-4 lg:px-8 py-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent hover:scrollbar-thumb-zinc-700">
                        <div v-if="myCurrentSheetId">
                            <SheetView :sheet-id="myCurrentSheetId" is-embedded :on-roll="sendRoll"
                                :on-dual-roll="sendDualRoll" />
                        </div>
                        <div v-else class="flex flex-col items-center justify-center h-full text-center gap-4">
                            <FileText class="w-12 h-12 text-zinc-800" />
                            <h2 class="text-xl font-bold">Nenhuma Ficha Ativa</h2>
                            <p class="text-muted-foreground max-w-sm">Você precisa selecionar uma ficha no cabeçalho
                                acima para visualizá-la e realizar rolagens de atributos, testes e ataques.</p>
                        </div>
                    </div>
                </template>
            </div>
        </main>

        <!-- Chat Sidebar -->
        <ChatSidebar :campaign-id="campaignId" :member-name="myMemberName" :members="members" :dm-id="campaign?.dm_id"
            v-model:recipientId="recipientId" />

        <!-- NPC Modal -->
        <QuickNpcModal v-if="showNpcModal" @close="showNpcModal = false" @saved="handleNpcSaved" />
    </div>
</template>
