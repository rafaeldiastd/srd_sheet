<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Dice5 } from 'lucide-vue-next'
import { DiceRoller } from '@dice-roller/rpg-dice-roller'

const roller = new DiceRoller()

const props = defineProps<{
    campaignId: string
    memberName?: string
    members?: any[]
    dmId?: string
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
        messages.value = data.map(m => {
            if (m.type === 'roll' || m.type === 'whisper') {
                try { m.rollData = JSON.parse(m.content) } catch { }
            }
            return m
        })
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

const recipientId = defineModel<string>('recipientId', { default: 'all' })

async function sendMessage() {
    if (!newMessage.value.trim()) return

    const content = newMessage.value.trim()
    const senderName = props.memberName || authStore.user?.user_metadata?.name || 'Unknown'

    let type = recipientId.value === 'all' ? 'text' : 'whisper'
    let finalContent = content

    if (content.startsWith('/roll ')) {
        const formula = content.replace('/roll ', '').trim()
        try {
            const rollResult = roller.roll(formula)
            const roll = Array.isArray(rollResult) ? rollResult[0] : rollResult
            if (roll) {
                type = recipientId.value === 'all' ? 'roll' : 'whisper'
                const breakdown = roll.output.split(': ')[1] || roll.output
                const payload = {
                    label: 'Rolagem Manual',
                    formula,
                    result: roll.total,
                    breakdown,
                    is_roll: true,
                    target_id: recipientId.value === 'all' ? null : recipientId.value
                }
                finalContent = JSON.stringify(payload)
            }
        } catch (e) {
            console.error('Invalid roll formula:', e)
        }
    } else if (type === 'whisper') {
        const payload = {
            text: content,
            target_id: recipientId.value
        }
        finalContent = JSON.stringify(payload)
    }

    const { error } = await supabase
        .from('messages')
        .insert({
            campaign_id: props.campaignId,
            user_id: authStore.user?.id,
            sender_name: senderName,
            content: finalContent,
            type: type
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
                const newMsg = payload.new as any
                if (newMsg.type === 'roll' || newMsg.type === 'whisper') {
                    try { newMsg.rollData = JSON.parse(newMsg.content) } catch { }
                }
                messages.value.push(newMsg)
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
            <template v-for="msg in messages" :key="msg.id">
                <div v-if="msg.type !== 'whisper' || msg.user_id === authStore.user?.id || (msg.rollData?.target_id && msg.rollData.target_id === authStore.user?.id) || authStore.user?.id === props.dmId"
                    class="flex flex-col gap-1">
                    <div class="flex items-center gap-2">
                        <span class="text-xs font-bold"
                            :class="msg.user_id === authStore.user?.id ? 'text-primary' : 'text-zinc-400'">
                            {{ msg.sender_name }}
                        </span>
                        <span v-if="msg.type === 'whisper'"
                            class="text-[10px] uppercase font-bold text-fuchsia-400 bg-fuchsia-950/40 px-1 py-0.5 rounded border border-fuchsia-900/50">SUSSURRO</span>
                        <span class="text-[10px] text-muted-foreground">{{ new
                            Date(msg.created_at).toLocaleTimeString([],
                                { hour: '2-digit', minute: '2-digit' }) }}</span>
                    </div>
                    <div class="text-sm bg-zinc-900/80 px-3 py-2 rounded-lg border border-border/50 text-zinc-200 break-words"
                        :class="[
                            msg.type === 'roll' ? 'border-amber-500/30 bg-amber-950/10' : '',
                            msg.type === 'whisper' ? 'border-fuchsia-500/30 bg-fuchsia-950/10 text-fuchsia-100' : ''
                        ]">
                        <div v-if="msg.type === 'roll' || (msg.type === 'whisper' && msg.rollData?.is_roll)"
                            class="text-amber-400">
                            <div v-if="msg.rollData" class="space-y-1.5 pt-0.5">
                                <div class="flex items-center gap-2 font-bold"
                                    :class="msg.type === 'whisper' ? 'text-fuchsia-400' : 'text-amber-500'">
                                    <Dice5 class="w-4 h-4" />
                                    <span>{{ msg.rollData.label || 'Rolagem' }}</span>
                                </div>
                                <div v-if="msg.rollData.is_dual_roll" class="flex flex-col gap-2">
                                    <div class="flex flex-col gap-1 bg-black/20 p-2 rounded border relative"
                                        :class="msg.type === 'whisper' ? 'border-fuchsia-900/30' : 'border-amber-900/30'">
                                        <div
                                            class="absolute -top-2 left-2 text-[8px] bg-zinc-900 px-1 rounded-sm text-amber-500/70 uppercase tracking-wider font-bold">
                                            Ataque</div>
                                        <div class="flex items-center justify-between text-xs mt-1">
                                            <span class="font-mono"
                                                :class="msg.type === 'whisper' ? 'text-fuchsia-500/60' : 'text-amber-500/50'"
                                                title="Fórmula">{{ msg.rollData.attack.formula || '?' }}</span>
                                            <span class="font-mono text-right break-words max-w-[150px] leading-tight"
                                                :class="msg.type === 'whisper' ? 'text-fuchsia-500/90' : 'text-amber-500/80'">{{
                                                    msg.rollData.attack.breakdown }}</span>
                                        </div>
                                        <div class="text-3xl font-black text-center tracking-tighter mt-1"
                                            :class="msg.type === 'whisper' ? 'text-fuchsia-300' : 'text-amber-300'">
                                            {{ msg.rollData.attack.result }}
                                        </div>
                                    </div>
                                    <div
                                        class="flex flex-col gap-1 bg-red-950/10 p-2 rounded border border-red-900/20 relative mt-1">
                                        <div
                                            class="absolute -top-2 left-2 text-[8px] bg-zinc-900 px-1 rounded-sm text-red-500/70 uppercase tracking-wider font-bold">
                                            Dano / Efeito</div>
                                        <div class="flex items-center justify-between text-xs mt-1">
                                            <span class="font-mono text-red-500/50" title="Fórmula">{{
                                                msg.rollData.damage.formula || '?' }}</span>
                                            <span
                                                class="font-mono text-right text-red-500/80 break-words max-w-[150px] leading-tight">{{
                                                    msg.rollData.damage.breakdown }}</span>
                                        </div>
                                        <div class="text-3xl font-black text-center text-red-400 tracking-tighter mt-1">
                                            {{ msg.rollData.damage.result }}
                                        </div>
                                    </div>
                                </div>
                                <div v-else class="flex flex-col gap-1 bg-black/20 p-2 rounded border"
                                    :class="msg.type === 'whisper' ? 'border-fuchsia-900/30' : 'border-amber-900/30'">
                                    <div class="flex items-center justify-between text-xs">
                                        <span class="font-mono"
                                            :class="msg.type === 'whisper' ? 'text-fuchsia-500/60' : 'text-amber-500/50'"
                                            title="Fórmula">{{ msg.rollData.formula ||
                                                '?' }}</span>
                                        <span class="font-mono text-right break-words max-w-[150px] leading-tight"
                                            :class="msg.type === 'whisper' ? 'text-fuchsia-500/90' : 'text-amber-500/80'">{{
                                                msg.rollData.breakdown }}</span>
                                    </div>
                                    <div class="text-3xl font-black text-center tracking-tighter mt-1"
                                        :class="msg.type === 'whisper' ? 'text-fuchsia-300' : 'text-amber-300'">
                                        {{ msg.rollData.result }}
                                    </div>
                                </div>
                            </div>
                            <div v-else class="flex items-center gap-2 font-mono font-bold">
                                <!-- Fallback for old roll messages -->
                                <Dice5 class="w-4 h-4" />
                                {{ msg.content }}
                            </div>
                        </div>
                        <span v-else-if="msg.type === 'whisper'">{{ msg.rollData?.text || msg.content }}</span>
                        <span v-else>{{ msg.content }}</span>
                    </div>
                </div>
            </template>
        </div>

        <!-- Input -->
        <div class="p-3 border-t border-border bg-zinc-900/50 space-y-2">
            <div class="flex items-center justify-between gap-2">
                <span class="text-[10px] font-bold text-muted-foreground uppercase">Enviar para:</span>
                <select v-model="recipientId"
                    class="text-xs bg-zinc-950 border border-zinc-800 rounded px-1.5 py-0.5 text-zinc-300 focus:outline-none focus:border-primary">
                    <option value="all">Todos</option>
                    <option v-if="props.dmId && authStore.user?.id !== props.dmId" :value="props.dmId">Mestre</option>
                    <template v-if="props.members">
                        <option
                            v-for="m in props.members.filter(x => x.user_id !== authStore.user?.id && x.user_id !== props.dmId)"
                            :key="m.user_id" :value="m.user_id">
                            {{ m.sheets?.name || 'Jogador' }}
                        </option>
                    </template>
                </select>
            </div>
            <form @submit.prevent="sendMessage" class="flex gap-2">
                <Input v-model="newMessage"
                    :placeholder="recipientId === 'all' ? 'Digite sua mensagem...' : 'Sussurrar mensagem...'"
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
