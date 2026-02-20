<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, User as UserIcon, Dice5 } from 'lucide-vue-next'

const props = defineProps<{
    campaignId: string
}>()

const authStore = useAuthStore()
const messages = ref<any[]>([])
const newMessage = ref('')
const messageContainer = ref<HTMLElement | null>(null)
let subscription: any = null

async function fetchMessages() {
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('campaign_id', props.campaignId)
        .order('created_at', { ascending: true })
        .limit(50)

    if (!error && data) {
        messages.value = data
        scrollToBottom()
    }
}

function scrollToBottom() {
    nextTick(() => {
        if (messageContainer.value) {
            messageContainer.value.scrollTop = messageContainer.value.scrollHeight
        }
    })
}

async function sendMessage() {
    if (!newMessage.value.trim()) return

    const content = newMessage.value.trim()
    const senderName = authStore.user?.user_metadata?.name || 'Unknown' // Ideally link to sheet name or user profile

    const { error } = await supabase
        .from('messages')
        .insert({
            campaign_id: props.campaignId,
            user_id: authStore.user?.id,
            sender_name: senderName, // Placeholder for now
            content: content,
            type: 'text'
        })

    if (!error) {
        newMessage.value = ''
    } else {
        console.error('Error sending message:', error)
    }
}

function setupRealtime() {
    subscription = supabase
        .channel(`campaign-chat:${props.campaignId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `campaign_id=eq.${props.campaignId}`
            },
            (payload) => {
                messages.value.push(payload.new)
                scrollToBottom()
            }
        )
        .subscribe()
}

onMounted(() => {
    fetchMessages()
    setupRealtime()
})

onUnmounted(() => {
    if (subscription) subscription.unsubscribe()
})
</script>

<template>
    <div class="flex flex-col h-full bg-zinc-950 border-l border-border w-72 md:w-80">
        <!-- Header -->
        <div class="p-3 border-b border-border bg-zinc-900/50">
            <h3 class="font-bold text-sm">Chat da Campanha</h3>
        </div>

        <!-- Messages -->
        <div ref="messageContainer" class="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            <div v-if="messages.length === 0" class="text-center text-muted-foreground text-xs py-10 opacity-50">
                Nenhuma mensagem ainda.
            </div>
            <div v-for="msg in messages" :key="msg.id" class="flex flex-col gap-1">
                <div class="flex items-center gap-2">
                    <span class="text-xs font-bold"
                        :class="msg.user_id === authStore.user?.id ? 'text-primary' : 'text-zinc-400'">
                        {{ msg.sender_name }}
                    </span>
                    <span class="text-[10px] text-muted-foreground">{{ new Date(msg.created_at).toLocaleTimeString([],
                        { hour: '2-digit', minute:'2-digit'}) }}</span>
                </div>
                <div class="text-sm bg-zinc-900/80 px-3 py-2 rounded-lg border border-border/50 text-zinc-200 break-words"
                    :class="msg.type === 'roll' ? 'border-amber-500/30 bg-amber-950/10' : ''">
                    <div v-if="msg.type === 'roll'" class="flex items-center gap-2 text-amber-400 font-mono font-bold">
                        <Dice5 class="w-4 h-4" />
                        {{ msg.content }}
                    </div>
                    <span v-else>{{ msg.content }}</span>
                </div>
            </div>
        </div>

        <!-- Input -->
        <div class="p-3 border-t border-border bg-zinc-900/50">
            <form @submit.prevent="sendMessage" class="flex gap-2">
                <Input v-model="newMessage" placeholder="Digite sua mensagem..."
                    class="flex-1 bg-zinc-950 border-zinc-800 focus-visible:ring-primary/50" />
                <Button type="submit" size="icon" :disabled="!newMessage.trim()">
                    <Send class="w-4 h-4" />
                </Button>
            </form>
        </div>
    </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #3f3f46;
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #52525b;
}
</style>
