<script setup lang="ts">
import { computed } from 'vue'
import { Trash2, Dice5 } from 'lucide-vue-next'

import ChatAttackCard from './ChatAttackCard.vue'
import ChatSpellCard from './ChatSpellCard.vue'
import ChatRollResult from './ChatRollResult.vue'

export interface ParsedMessage {
    id: string
    user_id: string
    created_at: string
    sender_name: string
    character_name?: string
    avatar_url?: string
    type: 'text' | 'roll' | 'whisper' | 'system' | 'spell'
    content: string
    rollData?: any // O conteúdo parseado como JSON
}

const props = defineProps<{
    message: ParsedMessage
    isOwn: boolean
    isDM: boolean
}>()

const emit = defineEmits<{
    (e: 'delete', id: string): void
    (e: 'roll-damage', id: string, formula: string): void
    (e: 'roll-spell-effect', id: string, formula: string, isAttack: boolean): void
}>()

const displayName = computed(() => {
    if (props.isDM && !props.message.character_name) return 'Mestre'
    return props.message.character_name || props.message.sender_name || 'Desconhecido'
})

const timeStr = computed(() => {
    return new Date(props.message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
})

const initials = computed(() => {
    return displayName.value.substring(0, 2).toUpperCase()
})

const avatarColors = computed(() => {
    // Generate a consistent color based on name
    const colors = ['bg-red-900/50 text-red-200', 'bg-blue-900/50 text-blue-200', 'bg-emerald-900/50 text-emerald-200', 'bg-amber-900/50 text-amber-200', 'bg-purple-900/50 text-purple-200', 'bg-pink-900/50 text-pink-200', 'bg-cyan-900/50 text-cyan-200']
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
    <div class="flex flex-col gap-1 relative group w-full animate-in fade-in slide-in-from-bottom-2 duration-200">
        <!-- Header: Avatar + Nome + Tempo -->
        <div class="flex items-center gap-2">
            <template v-if="message.type !== 'system'">
                <img v-if="message.avatar_url" :src="message.avatar_url" class="w-6 h-6 rounded-full object-cover bg-zinc-800" />
                <div v-else class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border border-white/5" :class="avatarColors">
                    {{ initials }}
                </div>
            </template>
            <span class="text-xs font-bold" :class="isOwn ? 'text-primary' : 'text-zinc-400'">
                {{ displayName }}
            </span>
            <span v-if="message.type === 'whisper'"
                class="text-[9px] uppercase font-bold text-fuchsia-400 bg-fuchsia-950/40 px-1 py-0.5 rounded border border-fuchsia-900/50">SUSSURRO</span>
            <span class="text-[10px] text-muted-foreground ml-auto">{{ timeStr }}</span>
            <button v-if="isOwn" @click="handleDelete" class="w-5 h-5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-zinc-500 hover:text-red-400 rounded hover:bg-zinc-800 cursor-pointer" title="Apagar mensagem">
                <Trash2 class="w-3 h-3" />
            </button>
        </div>

        <!-- Conteúdo -->
        <div class="text-sm px-3 py-2 rounded-lg border break-words shadow-sm relative ml-8"
            :class="[
                message.type === 'roll' ? 'border-amber-500/20 bg-amber-950/10' : 
                message.type === 'spell' ? 'border-blue-500/20 bg-blue-950/10' :
                message.type === 'whisper' ? 'border-fuchsia-500/30 bg-fuchsia-950/10 text-fuchsia-100' : 
                message.type === 'system' ? 'border-zinc-800 bg-zinc-900/30 text-zinc-400 italic text-center ml-0' :
                'border-border/50 bg-zinc-900/80 text-zinc-200'
            ]">
            
            <template v-if="message.type === 'roll' || (message.type === 'whisper' && message.rollData?.is_roll)">
                <div v-if="message.rollData" class="space-y-1.5 pt-0.5">
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
                    <template v-else-if="message.rollData.is_dual_roll">
                        <!-- Backward compatibility for old dual rolls -->
                         <div class="flex items-center gap-2 font-bold mb-2" :class="message.type === 'whisper' ? 'text-fuchsia-400' : 'text-amber-500'">
                            <Dice5 class="w-4 h-4" />
                            <span>{{ message.rollData.label || 'Rolagem' }}</span>
                        </div>
                        <ChatRollResult title="Ataque" :formula="message.rollData.attack.formula" :breakdown="message.rollData.attack.breakdown" :result="message.rollData.attack.result" :color-scheme="message.type === 'whisper' ? 'fuchsia' : 'amber'" />
                        <ChatRollResult title="Dano" :formula="message.rollData.damage.formula" :breakdown="message.rollData.damage.breakdown" :result="message.rollData.damage.result" color-scheme="red" />
                    </template>
                    <template v-else>
                        <div class="flex items-center gap-2 font-bold mb-2" :class="message.type === 'whisper' ? 'text-fuchsia-400' : 'text-amber-500'">
                            <Dice5 class="w-4 h-4" />
                            <span>{{ message.rollData.label || 'Rolagem' }}</span>
                        </div>
                        <ChatRollResult :formula="message.rollData.formula" :breakdown="message.rollData.breakdown" :result="message.rollData.result" :color-scheme="message.type === 'whisper' ? 'fuchsia' : 'amber'" />
                    </template>
                </div>
                <div v-else class="flex items-center gap-2 font-mono font-bold text-amber-500">
                    <Dice5 class="w-4 h-4" />
                    {{ message.content }}
                </div>
            </template>

            <template v-else-if="message.type === 'spell' || (message.type === 'whisper' && message.rollData?.spell_level !== undefined)">
                <div v-if="message.rollData" class="space-y-1.5 pt-0.5">
                    <ChatSpellCard 
                        :label="message.rollData.label"
                        :spell-level="message.rollData.spell_level"
                        :school="message.rollData.school"
                        :description="message.rollData.description"
                        :is-own="isOwn"
                        :is-whisper="message.type === 'whisper'"
                        :is-attack="message.rollData.is_attack"
                        :attack="message.rollData.attack"
                        :damage-pending="message.rollData.damage_pending"
                        :damage-formula="message.rollData.damage_formula"
                        :damage="message.rollData.damage"
                        :has-roll="message.rollData.has_roll"
                        :roll-pending="message.rollData.roll_pending"
                        :roll-formula="message.rollData.roll_formula"
                        :roll="message.rollData.roll"
                        @roll-effect="(f, a) => emit('roll-spell-effect', message.id, f, a)"
                    />
                </div>
                <div v-else>{{ message.content }}</div>
            </template>

            <template v-else-if="message.type === 'whisper'">
                {{ message.rollData?.text || message.content }}
            </template>

            <template v-else>
                {{ message.content }}
            </template>
        </div>
    </div>
</template>
