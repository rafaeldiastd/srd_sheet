<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import ChatSidebar from '@/components/campaign/ChatSidebar.vue'
import { Button } from '@/components/ui/button'
import { X, Sword } from 'lucide-vue-next'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const emit = defineEmits(['close'])
const authStore = useAuthStore()

const campaigns = ref<any[]>([])
const selectedCampaignId = ref<string>('')
const loading = ref(true)

async function fetchMyCampaigns() {
    loading.value = true
    // Fetch campaigns I am joined to
    // We can join campaign_members -> campaigns
    const { data, error } = await supabase
        .from('campaign_members')
        .select(`
            campaign_id,
            campaigns (id, name)
        `)
        .eq('user_id', authStore.user?.id)

    if (data) {
        campaigns.value = data.map((d: any) => d.campaigns) // Flatten
        if (campaigns.value.length > 0) {
            // Auto select first or restore from local storage?
            selectedCampaignId.value = campaigns.value[0].id
        }
    }
    loading.value = false
}

onMounted(() => {
    fetchMyCampaigns()
})
</script>

<template>
    <div
        class="fixed inset-y-0 right-0 w-80 md:w-96 bg-zinc-950 border-l border-zinc-900 z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        <!-- Header -->
        <div class="p-3 border-b border-zinc-900 flex items-center justify-between bg-zinc-900/50">
            <div class="flex items-center gap-2">
                <Sword class="w-4 h-4 text-primary" />
                <span class="font-bold text-sm">Chat da Mesa</span>
            </div>
            <Button variant="ghost" size="icon" @click="emit('close')"
                class="h-8 w-8 text-muted-foreground hover:text-foreground">
                <X class="w-4 h-4" />
            </Button>
        </div>

        <!-- Campaign Selector (if multiple) -->
        <div v-if="campaigns.length > 1" class="p-2 border-b border-zinc-900 bg-zinc-900/30">
            <Select v-model="selectedCampaignId">
                <SelectTrigger class="h-8 text-xs bg-zinc-950 border-zinc-800">
                    <SelectValue placeholder="Selecione a campanha" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem v-for="c in campaigns" :key="c.id" :value="c.id">
                        {{ c.name }}
                    </SelectItem>
                </SelectContent>
            </Select>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-hidden relative">
            <div v-if="loading" class="absolute inset-0 flex items-center justify-center">
                <div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>

            <div v-else-if="campaigns.length === 0"
                class="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
                <Sword class="w-10 h-10 text-zinc-800" />
                <p class="text-sm text-muted-foreground">Você não está em nenhuma campanha.</p>
                <p class="text-xs text-zinc-600">Volte ao Dashboard para criar ou entrar em uma.</p>
            </div>

            <ChatSidebar v-else-if="selectedCampaignId" :campaign-id="selectedCampaignId"
                class="h-full border-none w-full" />
        </div>
    </div>
</template>
