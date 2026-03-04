<script setup lang="ts">
import { ref, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import { X, Search, Plus, Loader2, BookOpen } from 'lucide-vue-next'
import type { Spell } from '@/types/sheet'

const props = defineProps<{
    modelValue: boolean
    campaignId?: string
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', val: boolean): void
    (e: 'select', spell: Spell): void
}>()

const loading = ref(false)
const spells = ref<Spell[]>([])
const searchQuery = ref('')

async function fetchSpells() {
    if (!props.campaignId) return
    loading.value = true
    const { data } = await supabase
        .from('spells')
        .select('*')
        .eq('campaign_id', props.campaignId)
        .order('level', { ascending: true })
        .order('name', { ascending: true })
    
    if (data) {
        // Map database row to Spell type
        spells.value = data.map(d => ({
            id: d.id,
            name: d.name,
            level: d.level,
            school: d.school,
            castTime: d.cast_time,
            range: d.range,
            target: d.target,
            duration: d.duration,
            savingThrow: d.saving_throw,
            spellResistance: d.spell_resistance,
            description: d.description,
            rollMode: d.roll_mode || 'none',
            isAttack: d.is_attack,
            attackFormula: d.attack_formula,
            damageFormula: d.damage_formula,
            healFormula: d.heal_formula,
            rollFormula: d.roll_formula,
            passive_effects: d.passive_effects,
            active_effects: d.active_effects,
            formulas: d.formulas
        }))
    }
    loading.value = false
}

watch(() => props.modelValue, (val) => {
    if (val && spells.value.length === 0) {
        fetchSpells()
    }
})

function close() {
    emit('update:modelValue', false)
}

function handleSelect(s: Spell) {
    emit('select', s)
    close()
}
</script>

<template>
    <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="close"></div>
        <div class="relative bg-card w-full max-w-2xl max-h-[85vh] rounded-2xl border border-border flex flex-col shadow-2xl overflow-hidden">
            <!-- Header -->
            <div class="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
                <div class="flex items-center gap-2 text-primary">
                    <BookOpen class="w-5 h-5" />
                    <h2 class="font-bold uppercase tracking-widest text-sm text-foreground">Grimório da Campanha</h2>
                </div>
                <button @click="close" class="p-1 text-muted-foreground hover:text-foreground transition-colors">
                    <X class="w-5 h-5" />
                </button>
            </div>

            <!-- Body -->
            <div class="flex flex-col flex-1 min-h-0">
                <div class="p-4 border-b border-border">
                    <div class="relative">
                        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input v-model="searchQuery" placeholder="Buscar magia no grimório..." 
                               class="w-full bg-muted border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors" />
                    </div>
                </div>

                <div class="flex-1 overflow-y-auto p-4 space-y-2 relative">
                    <div v-if="loading" class="flex flex-col items-center justify-center py-10 text-muted-foreground">
                        <Loader2 class="w-8 h-8 animate-spin mb-2" />
                        <span class="text-sm">Buscando magias...</span>
                    </div>
                    <div v-else-if="spells.length === 0" class="text-center py-10 text-muted-foreground/60">
                        Nenhuma magia encontrada na campanha. Clique em "Grimório" (na aba de Magias) para adicionar novas magias ao compêndio da campanha.
                    </div>
                    <template v-else>
                        <div v-for="s in spells.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))" :key="s.id" 
                            class="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/50 hover:border-border transition-colors group">
                            <div>
                                <div class="flex items-center gap-2">
                                    <span class="font-bold text-sm text-foreground">{{ s.name }}</span>
                                    <span class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-accent px-1.5 py-0.5 rounded">
                                        Círculo {{ s.level }}
                                    </span>
                                </div>
                                <div class="text-xs text-muted-foreground mt-1 line-clamp-1 max-w-sm">
                                    {{ s.description || 'Sem descrição.' }}
                                </div>
                            </div>
                            <button @click="handleSelect(s)" 
                                class="flex items-center gap-1.5 px-3 py-1.5 bg-primary/20 text-primary border border-primary/30 rounded-lg text-xs font-semibold hover:bg-primary/40 transition-colors opacity-0 group-hover:opacity-100">
                                <Plus class="w-3.5 h-3.5" /> Adicionar
                            </button>
                        </div>
                    </template>
                </div>
            </div>
            
            <div class="p-4 border-t border-border bg-muted/40 text-xs text-muted-foreground flex justify-between items-center">
                <span>Não encontrou? Abra o Grimório completo para cadastrar.</span>
            </div>
        </div>
    </div>
</template>
