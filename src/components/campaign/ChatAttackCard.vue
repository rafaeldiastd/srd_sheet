<script setup lang="ts">
import { Sword, Dice5 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import ChatRollResult from './ChatRollResult.vue'

const props = defineProps<{
    label: string
    isOwn: boolean
    attack: { formula: string; result: number; breakdown: string }
    damagePending: boolean
    damageFormula: string
    damage: { formula: string; result: number; breakdown: string } | null
    isWhisper?: boolean
}>()

const emit = defineEmits<{
    (e: 'roll-damage', formula: string): void
}>()
</script>

<template>
    <div class="space-y-2">
        <div class="flex items-center gap-2 font-bold" :class="isWhisper ? 'text-fuchsia-400' : 'text-amber-500'">
            <Sword class="w-4 h-4" />
            <span>{{ label }}</span>
        </div>

        <ChatRollResult title="Acerto" :formula="attack.formula" :breakdown="attack.breakdown" :result="attack.result" :color-scheme="isWhisper ? 'fuchsia' : 'amber'" />

        <template v-if="damagePending">
            <div class="mt-2 text-center">
                <Button v-if="isOwn" size="sm" variant="secondary" @click="emit('roll-damage', damageFormula)"
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
    </div>
</template>
