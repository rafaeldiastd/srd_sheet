<script setup lang="ts">
import { ref } from 'vue'
import { BookOpen, Plus, Trash2, ChevronDown, ChevronUp, MessageSquare } from 'lucide-vue-next'
import type { SheetData, SpellSlotStats, CharacterSpell } from '@/types/sheet'

const props = defineProps<{
    d: SheetData | null | undefined
    editMode: boolean
    resolveFormula: (formula: string) => string
    onRoll: (label: string, formula: string) => void
    onAttackRoll: (label: string, atkF: string, dmgF: string) => void
    onShowDescription: (title: string, desc: string) => void
    onOpenGrimoire: () => void
}>()

const emit = defineEmits<{
    (e: 'update:spellSlots', level: number, stats: SpellSlotStats): void
    (e: 'toggle-prepared', index: number): void
    (e: 'delete-spell', index: number): void
    (e: 'add-spell', spell: CharacterSpell): void
}>()

const expanded = ref<Set<string | number>>(new Set())
function toggleExpand(i: string | number) {
    if (expanded.value.has(i)) expanded.value.delete(i)
    else expanded.value.add(i)
}

const LEVELS = Array.from({ length: 10 }, (_, i) => i)

function getSpellsByLevel(level: number) {
    if (!props.d?.spells) return []
    return props.d.spells.map((s, idx) => ({ spell: s, originalIndex: idx }))
        .filter(item => item.spell.level === level)
}

function getStats(level: number): SpellSlotStats {
    if (props.d?.spellSlots && props.d.spellSlots[level]) {
        return props.d.spellSlots[level]
    }
    return { known: 0, perDay: 0, used: 0 }
}

function updateStat(level: number, key: keyof SpellSlotStats, value: number) {
    const stats = { ...getStats(level) }
    stats[key] = Math.max(0, value)
    emit('update:spellSlots', level, stats)
}

import SelectSpellModal from './SelectSpellModal.vue'
const selectModalOpen = ref(false)

function onSelectSpell(spell: any) {
    emit('add-spell', { ...spell, prepared: false })
}
</script>

<template>
    <div class="space-y-4 pb-8">
        <!-- Toolbar -->
        <div class="bg-muted/60 border border-border rounded-xl px-4 py-3 flex items-center justify-between">
            <div class="flex items-center gap-2 text-primary">
                <BookOpen class="w-5 h-5" />
                <span class="font-bold uppercase tracking-widest text-sm">Magias</span>
            </div>
            <div class="flex items-center gap-2">
                <button @click="selectModalOpen = true"
                    class="flex items-center gap-1.5 text-xs font-semibold bg-accent text-foreground hover:bg-muted border border-border rounded-lg px-3 py-1.5 transition-colors shadow-sm">
                    <Plus class="w-4 h-4" /> Adicionar Magia
                </button>
                <button @click="onOpenGrimoire"
                    class="flex items-center gap-1.5 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-3 py-1.5 transition-colors shadow-lg shadow-primary/20">
                    Grimório de Campanha
                </button>
            </div>
        </div>

        <div v-for="level in LEVELS" :key="level" class="space-y-2">
            <!-- Header do Nível -->
            <div class="flex items-center gap-4 bg-card/60 border border-border rounded-xl px-4 py-2">
                <div class="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg bg-accent/50 text-xl font-black text-primary border border-primary/20">
                    {{ level }}
                </div>
                
                <div class="flex-1 grid grid-cols-3 gap-3">
                    <div class="text-center">
                        <label class="block text-[9px] uppercase font-bold text-muted-foreground mb-1 tracking-wider">Conhece</label>
                        <input type="number" min="0" :value="getStats(level).known"
                            @input="e => updateStat(level, 'known', +(e.target as HTMLInputElement).value)"
                            class="w-full text-center text-sm font-bold bg-muted/50 border border-border rounded-md py-1 text-foreground focus:outline-none focus:border-primary transition-colors" />
                    </div>
                    <div class="text-center">
                        <label class="block text-[9px] uppercase font-bold text-muted-foreground mb-1 tracking-wider">Por Dia</label>
                        <input type="number" min="0" :value="getStats(level).perDay"
                            @input="e => updateStat(level, 'perDay', +(e.target as HTMLInputElement).value)"
                            class="w-full text-center text-sm font-bold bg-muted/50 border border-border rounded-md py-1 text-foreground focus:outline-none focus:border-primary transition-colors" />
                    </div>
                    <div class="text-center">
                        <label class="block text-[9px] uppercase font-bold text-muted-foreground mb-1 tracking-wider">Usadas</label>
                        <div class="flex items-center gap-1 justify-center">
                            <button @click="updateStat(level, 'used', getStats(level).used - 1)" class="w-6 h-6 rounded bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted border border-border flex items-center justify-center font-bold pb-0.5">-</button>
                            <span class="w-8 text-center text-sm font-bold" :class="getStats(level).used >= getStats(level).perDay && getStats(level).perDay > 0 ? 'text-red-400' : 'text-primary'">{{ getStats(level).used }}</span>
                            <button @click="updateStat(level, 'used', getStats(level).used + 1)" class="w-6 h-6 rounded bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted border border-border flex items-center justify-center font-bold pb-0.5">+</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Lista de Magias deste nível -->
            <div v-for="item in getSpellsByLevel(level)" :key="item.originalIndex"
                class="ml-6 rounded-xl border border-border bg-card/40 transition-all hover:bg-card/80 overflow-hidden group">
                <div class="flex items-center gap-3 px-4 py-2.5">
                    
                    <div class="flex-1 cursor-pointer" @click="toggleExpand(item.originalIndex)">
                        <div class="flex items-center gap-2">
                            <span class="font-bold text-foreground text-sm" :class="item.spell.prepared ? 'text-primary' : ''">{{ item.spell.name }}</span>
                            <span class="text-[9px] font-bold uppercase tracking-widest bg-accent text-muted-foreground px-1.5 py-0.5 rounded">{{ item.spell.school || 'Mágica' }}</span>
                        </div>
                        <div class="text-xs text-muted-foreground/60 mt-0.5" v-if="item.spell.castTime || item.spell.range">
                            {{ [item.spell.castTime, item.spell.range, item.spell.duration].filter(Boolean).join(' · ') }}
                        </div>
                    </div>

                    <div class="flex items-center gap-2">
                        <!-- Toggle Prepared -->
                        <button @click="emit('toggle-prepared', item.originalIndex)"
                            class="px-2 py-1 rounded border text-[10px] font-bold uppercase tracking-wider transition-colors"
                            :class="item.spell.prepared 
                                ? 'bg-primary/20 text-primary border-primary/40 shadow-sm' 
                                : 'bg-muted/30 text-muted-foreground border-border hover:bg-muted'">
                            {{ item.spell.prepared ? 'Preparada' : 'Preparar' }}
                        </button>
                        
                        <!-- Rolls -->
                        <button v-if="item.spell.isAttack || item.spell.rollMode === 'attack'"
                            @click="onAttackRoll(item.spell.name, item.spell.attackFormula || '', item.spell.damageFormula || '')"
                            class="text-xs font-bold px-2.5 py-1 rounded bg-accent border border-border text-foreground/80 hover:bg-muted transition-colors">
                            Atacar
                        </button>
                        <button v-else-if="item.spell.rollFormula"
                            @click="onRoll(item.spell.name, item.spell.rollFormula)"
                            class="text-xs font-bold px-2.5 py-1 rounded bg-accent border border-border text-foreground/80 hover:bg-muted transition-colors">
                            Rolar
                        </button>
                        
                        <button v-if="item.spell.description"
                            @click="onShowDescription(item.spell.name, item.spell.description)"
                            class="p-1.5 text-muted-foreground hover:text-primary transition-colors" title="Enviar para o chat">
                            <MessageSquare class="w-4 h-4" />
                        </button>
                        
                        <!-- Remover -->
                        <button @click="emit('delete-spell', item.originalIndex)" class="opacity-0 group-hover:opacity-100 p-1 text-red-800 hover:text-red-500 transition-colors">
                            <Trash2 class="w-4 h-4" />
                        </button>
                        
                        <!-- Expandir -->
                        <button @click="toggleExpand(item.originalIndex)" class="p-1 text-muted-foreground hover:text-foreground">
                            <ChevronDown v-if="!expanded.has(item.originalIndex)" class="w-4 h-4" />
                            <ChevronUp v-else class="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div v-if="expanded.has(item.originalIndex)" class="border-t border-border/50 px-4 py-3 bg-muted/20 text-sm text-muted-foreground/80 whitespace-pre-wrap leading-relaxed">
                    <div class="mb-2 grid grid-cols-2 gap-2 text-xs" v-if="item.spell.target || item.spell.savingThrow">
                        <div v-if="item.spell.target"><strong>Alvo/Área:</strong> {{ item.spell.target }}</div>
                        <div v-if="item.spell.savingThrow"><strong>Resistência:</strong> {{ item.spell.savingThrow }}</div>
                    </div>
                    {{ item.spell.description }}
                </div>
            </div>
            
        </div>

        <SelectSpellModal v-model="selectModalOpen" :campaign-id="d?.campaign_id" @select="onSelectSpell" />
    </div>
</template>
