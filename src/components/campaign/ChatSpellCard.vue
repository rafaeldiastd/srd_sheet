<script setup lang="ts">
import { Sparkles, Dice5 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import ChatRollResult from './ChatRollResult.vue'

const props = defineProps<{
    label: string
    spellLevel: number
    school?: string
    description?: string
    isOwn: boolean
    isWhisper?: boolean
    
    // Se for ataque
    isAttack?: boolean
    attack?: { formula: string; result: number; breakdown: string } | null
    damagePending?: boolean
    damageFormula?: string
    damage?: { formula: string; result: number; breakdown: string } | null
    
    // Se for apenas roll de efeito
    hasRoll?: boolean
    rollPending?: boolean
    rollFormula?: string
    roll?: { formula: string; result: number; breakdown: string } | null
}>()

const emit = defineEmits<{
    (e: 'roll-effect', formula: string, isAttack: boolean): void
}>()
</script>

<template>
    <div class="space-y-2">
        <div class="flex items-center gap-2 font-bold" :class="isWhisper ? 'text-fuchsia-400' : 'text-blue-400'">
            <Sparkles class="w-4 h-4" />
            <span>{{ label }}</span>
            <span class="ml-auto text-[10px] uppercase font-bold px-1.5 py-0.5 rounded" 
                  :class="isWhisper ? 'bg-fuchsia-900/50' : 'bg-blue-900/50'">
                {{ spellLevel === 0 ? 'Truque' : `Nv. ${spellLevel}` }}
            </span>
        </div>
        <div v-if="school" class="text-[10px] uppercase tracking-wider opacity-70 mt-[-4px]" :class="isWhisper ? 'text-fuchsia-300' : 'text-blue-300'">
            {{ school }}
        </div>

        <div v-if="description" class="text-xs p-2 rounded border" 
             :class="isWhisper ? 'text-fuchsia-200/80 bg-fuchsia-950/20 border-fuchsia-900/30' : 'text-blue-200/80 bg-blue-950/20 border-blue-900/30'">
            {{ description }}
        </div>

        <template v-if="isAttack && attack">
            <ChatRollResult title="Acerto ⚔️" :formula="attack.formula" :breakdown="attack.breakdown" :result="attack.result" :color-scheme="isWhisper ? 'fuchsia' : 'amber'" />

            <template v-if="damagePending && damageFormula">
                <div class="mt-2 text-center">
                    <Button v-if="isOwn" size="sm" variant="secondary" @click="emit('roll-effect', damageFormula, true)"
                        class="w-full bg-red-950/20 text-red-400 hover:bg-red-900/40 border border-red-900/50 h-8 text-xs">
                        <Dice5 class="w-3.5 h-3.5 mr-1.5" />
                        Rolar Dano ({{ damageFormula }})
                    </Button>
                    <div v-else class="text-xs text-red-500/50 italic py-1.5 border border-red-900/20 rounded bg-red-950/10">
                        Dano pendente...
                    </div>
                </div>
            </template>
            <template v-else-if="damage">
                <ChatRollResult title="Dano 💥" :formula="damage.formula" :breakdown="damage.breakdown" :result="damage.result" color-scheme="red" />
            </template>
        </template>

        <template v-else-if="hasRoll && rollFormula">
            <template v-if="rollPending">
                <div class="mt-2 text-center">
                    <Button v-if="isOwn" size="sm" variant="secondary" @click="emit('roll-effect', rollFormula, false)"
                        class="w-full bg-emerald-950/20 text-emerald-400 hover:bg-emerald-900/40 border border-emerald-900/50 h-8 text-xs">
                        <Dice5 class="w-3.5 h-3.5 mr-1.5" />
                        Rolar Efeito ({{ rollFormula }})
                    </Button>
                    <div v-else class="text-xs text-emerald-500/50 italic py-1.5 border border-emerald-900/20 rounded bg-emerald-950/10">
                        Rolagem pendente...
                    </div>
                </div>
            </template>
            <template v-else-if="roll">
                <ChatRollResult title="Efeito ✨" :formula="roll.formula" :breakdown="roll.breakdown" :result="roll.result" color-scheme="emerald" />
            </template>
        </template>
    </div>
</template>
