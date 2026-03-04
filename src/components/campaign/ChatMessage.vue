<script setup lang="ts">
import { computed } from 'vue'
import { Trash2, Dice5 } from 'lucide-vue-next'

import ChatAttackCard from './ChatAttackCard.vue'
import ChatRollResult from './ChatRollResult.vue'
import ChatDescriptionCard from './ChatDescriptionCard.vue'

export interface ParsedMessage {
    id: string
    user_id: string
    created_at: string
    sender_name: string
    character_name?: string
    avatar_url?: string
    type: 'text' | 'roll' | 'whisper' | 'system'
    content: string
    rollData?: any 
}

const props = defineProps<{
    message: ParsedMessage
    isOwn: boolean
    isDM: boolean
}>()

const emit = defineEmits<{
    (e: 'delete', id: string): void
    (e: 'roll-damage', id: string, formula: string): void
}>()

const displayName = computed(() => {
    if (props.isDM && !props.message.character_name) return 'Mestre'
    return props.message.character_name || props.message.sender_name || 'Desconhecido'
})

const timeStr = computed(() => {
    const date = new Date(props.message.created_at)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
})

const dateStr = computed(() => {
    const date = new Date(props.message.created_at)
    const now = new Date()
    if (date.toDateString() === now.toDateString()) return ''
    return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' })
})

const initials = computed(() => {
    return displayName.value.substring(0, 2).toUpperCase()
})

const avatarColors = computed(() => {
    const colors = [
        'bg-muted text-muted-foreground',
        'bg-muted/80 text-foreground/80',
        'bg-muted/50 text-foreground'
    ]
    const idx = Array.from(displayName.value).reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
    return colors[idx]
})

function handleDelete() {
    if (confirm('Tem certeza que deseja apagar esta mensagem?')) {
        emit('delete', props.message.id)
    }
}
</script>

<template>
    <div class="group flex gap-3 w-full px-1 animate-in fade-in slide-in-from-bottom-2 duration-200"
        :class="[message.type === 'system' ? 'justify-center py-1' : 'py-2']">
        
        <!-- System Message Layout -->
        <template v-if="message.type === 'system'">
             <div class="text-[10px] text-muted-foreground/50 italic tracking-wide text-center uppercase border-t border-border/50 pt-2 w-full mt-2">
                {{ message.content }}
             </div>
        </template>

        <!-- Standard Message Layout -->
        <template v-else>
            <!-- Avatar Sidebar -->
            <div class="flex-shrink-0 mt-0.5">
                <img v-if="message.avatar_url" :src="message.avatar_url" 
                    class="w-10 h-10 rounded-xl object-cover ring-1 ring-border shadow-lg bg-muted transition-transform hover:scale-105" />
                <div v-else class="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold border border-border/50" 
                    :class="avatarColors">
                    {{ initials }}
                </div>
            </div>

            <!-- Message Body -->
            <div class="flex-1 min-w-0 flex flex-col gap-1.5">
                <!-- Meta -->
                <div class="flex items-center gap-2 leading-none">
                    <span class="text-xs font-bold transition-colors truncate max-w-[150px]" 
                        :class="isOwn ? 'text-foreground' : 'text-muted-foreground'">
                        {{ displayName }}
                    </span>
                    <span v-if="message.type === 'whisper'"
                        class="text-[8px] uppercase font-black text-fuchsia-400/80 bg-fuchsia-950/20 px-1.5 py-0.5 rounded border border-fuchsia-900/30 tracking-tighter">
                        Sussurro
                    </span>
                    <div class="flex items-center gap-1 ml-auto opacity-40 group-hover:opacity-100 transition-opacity">
                        <span class="text-[9px] font-medium text-muted-foreground tabular-nums">
                            {{ dateStr }} {{ timeStr }}
                        </span>
                        <button v-if="isOwn" @click="handleDelete" 
                            class="p-1 text-muted-foreground/60 hover:text-red-400/80 rounded-md transition-all hover:bg-red-500/10 pointer-events-auto" 
                            title="Apagar">
                            <Trash2 class="w-3 h-3" />
                        </button>
                    </div>
                </div>

                <!-- Bubble Container -->
                <div class="text-sm rounded-2xl border transition-all duration-300"
                    :class="[
                        message.type === 'roll' ? 'border-border bg-card/40 p-3' : 
                        message.type === 'whisper' ? 'border-fuchsia-900/30 bg-fuchsia-950/5 p-3' : 
                        'border-border/50 bg-card/20 px-4 py-2.5'
                    ]">
                    
                    <!-- Roll Content -->
                    <template v-if="message.type === 'roll' || (message.type === 'whisper' && message.rollData?.is_roll)">
                        <div v-if="message.rollData" class="space-y-3">
                            <!-- Card based on structure -->
                            <template v-if="message.rollData.is_attack">
                                <ChatAttackCard 
                                    :label="message.rollData.label"
                                    :is-own="isOwn"
                                    :attack="message.rollData.attack"
                                    :damage-pending="message.rollData.damage_pending"
                                    :damage-formula="message.rollData.damage_formula"
                                    :damage="message.rollData.damage"
                                    :is-whisper="message.type === 'whisper'"
                                    @roll-damage="(f) => emit('roll-damage', message.id, f)"
                                />
                            </template>
                            <template v-else-if="message.rollData.formula">
                                <template v-if="message.rollData.breakdown">
                                     <div class="flex items-center gap-2 font-bold mb-1" :class="message.type === 'whisper' ? 'text-fuchsia-400/90' : 'text-foreground'">
                                        <Dice5 class="w-3.5 h-3.5 opacity-50" />
                                        <span class="text-[10px] uppercase tracking-widest">{{ message.rollData.label || 'Rolagem' }}</span>
                                    </div>
                                    <ChatRollResult 
                                        :formula="message.rollData.formula" 
                                        :breakdown="message.rollData.breakdown" 
                                        :result="message.rollData.result" 
                                        :color-scheme="message.type === 'whisper' ? 'fuchsia' : 'amber'" />
                                </template>
                                <template v-else>
                                     <ChatDescriptionCard 
                                        :title="message.rollData.label" 
                                        :description="message.rollData.formula" />
                                </template>
                            </template>
                        </div>
                        <div v-else class="flex items-center gap-2 font-mono font-bold text-foreground/80">
                            <Dice5 class="w-4 h-4 opacity-50" />
                            {{ message.content }}
                        </div>
                    </template>

                    <!-- Text / Whisper Content -->
                    <template v-else-if="message.type === 'whisper'">
                        <p class="text-foreground leading-relaxed break-words whitespace-pre-wrap selection:bg-fuchsia-500/20">
                            {{ message.rollData?.text || message.content }}
                        </p>
                    </template>

                    <template v-else>
                         <p class="text-foreground/80 leading-relaxed break-words whitespace-pre-wrap selection:bg-primary/20">
                            {{ message.content }}
                        </p>
                    </template>
                </div>
            </div>
        </template>
    </div>
</template>

