<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { BookOpen, Search, Plus, Trash2, Edit2, ChevronLeft, Loader2, Save, X } from 'lucide-vue-next'
import type { Spell } from '@/types/sheet'

const route = useRoute()
const router = useRouter()
const campaignId = route.params.id as string

const loading = ref(true)
const saving = ref(false)
const spells = ref<Spell[]>([])
const searchQuery = ref('')

const showModal = ref(false)
const editSpell = ref<Partial<Spell>>({})

async function fetchSpells() {
    loading.value = true
    const { data } = await supabase
        .from('spells')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('level', { ascending: true })
        .order('name', { ascending: true })

    if (data) {
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
            modifiers: d.formulas || [],
        }))
    }
    loading.value = false
}

onMounted(fetchSpells)

const filteredSpells = computed(() => {
    const q = searchQuery.value.toLowerCase()
    return spells.value.filter(s => s.name.toLowerCase().includes(q))
})

function openCreate() {
    editSpell.value = {
        name: '', level: 0, school: '', castTime: '', range: '', target: '', 
        duration: '', savingThrow: '', description: '', rollMode: 'none'
    }
    showModal.value = true
}

function openEdit(s: Spell) {
    editSpell.value = { ...s }
    showModal.value = true
}

async function saveSpell() {
    if (!editSpell.value.name) return
    saving.value = true

    const payload: any = {
        campaign_id: campaignId,
        name: editSpell.value.name,
        level: editSpell.value.level,
        school: editSpell.value.school,
        cast_time: editSpell.value.castTime,
        range: editSpell.value.range,
        target: editSpell.value.target,
        duration: editSpell.value.duration,
        saving_throw: editSpell.value.savingThrow,
        spell_resistance: editSpell.value.spellResistance,
        description: editSpell.value.description,
        roll_mode: editSpell.value.rollMode || 'none',
        is_attack: editSpell.value.isAttack,
        attack_formula: editSpell.value.attackFormula,
        damage_formula: editSpell.value.damageFormula,
        heal_formula: editSpell.value.healFormula,
        roll_formula: editSpell.value.rollFormula,
        formulas: editSpell.value.modifiers || [],
    }

    try {
        if (editSpell.value.id) {
            const { error } = await supabase.from('spells').update(payload).eq('id', editSpell.value.id)
            if (error) throw error
        } else {
            const { error } = await supabase.from('spells').insert(payload)
            if (error) {
                if (error.code === '23505') throw new Error('Já existe uma magia com esse nome na campanha.')
                throw error
            }
        }
        showModal.value = false
        fetchSpells()
    } catch (e: any) {
        alert('Erro ao salvar: ' + e.message)
    } finally {
        saving.value = false
    }
}

async function removeSpell(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta magia permanentemente do grimório da campanha?')) return
    await supabase.from('spells').delete().eq('id', id)
    fetchSpells()
}
</script>

<template>
    <div class="min-h-screen bg-background text-foreground flex flex-col">
        <!-- Header -->
        <header class="h-16 border-b border-border bg-card/50 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
            <div class="flex items-center gap-4">
                <button @click="router.push(`/campaign/${campaignId}`)"
                    class="p-2 -mr-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors">
                    <ChevronLeft class="w-5 h-5" />
                </button>
                <div class="flex items-center gap-2 text-primary">
                    <BookOpen class="w-6 h-6" />
                    <div>
                        <h1 class="font-serif font-bold text-lg leading-tight text-foreground">Grimório da Campanha</h1>
                        <p class="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Repositório Geral</p>
                    </div>
                </div>
            </div>
            
            <button @click="openCreate"
                class="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                <Plus class="w-4 h-4" /> Nova Magia
            </button>
        </header>

        <!-- Main Content -->
        <main class="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6 space-y-6">
            
            <div class="relative max-w-md">
                <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input v-model="searchQuery" placeholder="Buscar magia..." 
                    class="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors shadow-sm" />
            </div>

            <div v-if="loading" class="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Loader2 class="w-8 h-8 animate-spin mb-3" />
                <p class="text-sm">Carregando grimório...</p>
            </div>

            <div v-else-if="filteredSpells.length === 0" class="text-center py-20 bg-card border border-dashed border-border rounded-2xl">
                <BookOpen class="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p class="text-muted-foreground mb-4">Nenhuma magia encontrada no grimório.</p>
                <button @click="openCreate" class="text-primary text-sm font-semibold hover:underline">
                    Criar a primeira magia
                </button>
            </div>

            <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div v-for="s in filteredSpells" :key="s.id" 
                    class="bg-card border border-border rounded-xl p-4 transition-all hover:bg-muted/40 hover:border-primary/50 group flex flex-col">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <div class="flex items-center gap-2 mb-1">
                                <h3 class="font-bold text-lg text-foreground leading-tight">{{ s.name }}</h3>
                                <span class="bg-primary/20 text-primary border border-primary/30 text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded">Círculo {{ s.level }}</span>
                            </div>
                            <p class="text-xs text-muted-foreground font-medium">{{ s.school }}</p>
                        </div>
                        <div class="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button @click="openEdit(s)" class="p-1.5 bg-accent text-muted-foreground rounded hover:text-foreground transition-colors" title="Editar">
                                <Edit2 class="w-4 h-4" />
                            </button>
                            <button @click="removeSpell(s.id!)" class="p-1.5 bg-red-950/30 text-red-500 rounded hover:text-red-400 hover:bg-red-900/50 transition-colors" title="Excluir">
                                <Trash2 class="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div class="flex flex-wrap gap-x-4 gap-y-1 mb-3 text-xs text-muted-foreground/80">
                        <span v-if="s.castTime" title="Tempo de Execução">🕒 {{ s.castTime }}</span>
                        <span v-if="s.range" title="Alcance">📏 {{ s.range }}</span>
                        <span v-if="s.duration" title="Duração">⏳ {{ s.duration }}</span>
                    </div>

                    <p class="text-sm text-foreground/80 line-clamp-3 mt-auto pt-2 border-t border-border/50">
                        {{ s.description || 'Nenhuma descrição fornecida.' }}
                    </p>
                </div>
            </div>

        </main>

        <!-- Spell Editor Modal -->
        <div v-if="showModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="showModal = false"></div>
            
            <div class="relative bg-card w-full max-w-3xl max-h-[90vh] rounded-2xl border border-border flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <!-- Modal Header -->
                <div class="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                    <div class="flex items-center gap-2">
                        <BookOpen class="w-5 h-5 text-primary" />
                        <h2 class="font-bold uppercase tracking-widest text-sm text-foreground">
                            {{ editSpell.id ? 'Editar Magia' : 'Nova Magia' }}
                        </h2>
                    </div>
                    <button @click="showModal = false" class="text-muted-foreground hover:text-foreground">
                        <X class="w-5 h-5" />
                    </button>
                </div>

                <!-- Modal Body -->
                <div class="flex-1 overflow-y-auto p-6 space-y-6">
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div class="col-span-2 md:col-span-3">
                            <label class="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Nome <span class="text-red-400">*</span></label>
                            <input v-model="editSpell.name" class="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="Ex: Bola de Fogo" />
                        </div>
                        <div>
                            <label class="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Círculo/Nível</label>
                            <input v-model.number="editSpell.level" type="number" min="0" max="9" class="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:border-primary font-bold" />
                        </div>
                    </div>

                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label class="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Escola</label>
                            <input v-model="editSpell.school" class="w-full bg-muted border border-border rounded-md px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none" placeholder="Ex: Evocação" />
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Tempo de Execução</label>
                            <input v-model="editSpell.castTime" class="w-full bg-muted border border-border rounded-md px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none" placeholder="Ex: 1 ação padrão" />
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Alcance</label>
                            <input v-model="editSpell.range" class="w-full bg-muted border border-border rounded-md px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none" placeholder="Ex: 9m" />
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Alvo/Área</label>
                            <input v-model="editSpell.target" class="w-full bg-muted border border-border rounded-md px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none" placeholder="Ex: Esfera de 6m" />
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Duração</label>
                            <input v-model="editSpell.duration" class="w-full bg-muted border border-border rounded-md px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none" placeholder="Ex: Instantânea" />
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Resistência</label>
                            <input v-model="editSpell.savingThrow" class="w-full bg-muted border border-border rounded-md px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none" placeholder="Ex: Reflexos reduz à metade" />
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">RM</label>
                            <input v-model="editSpell.spellResistance" class="w-full bg-muted border border-border rounded-md px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none" placeholder="Ex: Sim" />
                        </div>
                    </div>

                    <div>
                        <label class="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Descrição</label>
                        <textarea v-model="editSpell.description" rows="6" placeholder="Detalhes e efeitos da magia..." 
                            class="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary resize-y" />
                    </div>

                    <div>
                        <h3 class="text-xs font-bold uppercase tracking-wider text-primary mb-3 border-b border-border pb-2">Mecânica de Rolagem & Combate</h3>
                        <div class="grid md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Comportamento</label>
                                <select v-model="editSpell.rollMode" class="w-full bg-muted border border-border rounded-md px-2.5 py-2 text-xs text-foreground outline-none">
                                    <option value="none">Apenas Texto</option>
                                    <option value="attack">Ataque / Dano Combinado</option>
                                    <option value="generic">Fórmula Simples (Ex: Curar, Dano puro)</option>
                                </select>
                            </div>

                            <div v-if="editSpell.rollMode === 'attack'" class="col-span-2 space-y-3 p-4 border border-border rounded-xl bg-card">
                                <div>
                                    <label class="block text-[10px] uppercase text-muted-foreground">Fórmula de Ataque</label>
                                    <input v-model="editSpell.attackFormula" class="w-full bg-background border border-border rounded px-2.5 py-1.5 text-xs focus:border-primary outline-none" placeholder="Ex: 1d20+10" />
                                </div>
                                <div>
                                    <label class="block text-[10px] uppercase text-muted-foreground">Fórmula de Dano</label>
                                    <input v-model="editSpell.damageFormula" class="w-full bg-background border border-border rounded px-2.5 py-1.5 text-xs focus:border-primary outline-none" placeholder="Ex: 6d6+5" />
                                </div>
                            </div>

                            <div v-if="editSpell.rollMode === 'generic'" class="col-span-2 space-y-3 p-4 border border-border rounded-xl bg-card">
                                <div>
                                    <label class="block text-[10px] uppercase text-muted-foreground">Fórmula Simples</label>
                                    <input v-model="editSpell.rollFormula" class="w-full bg-background border border-border rounded px-2.5 py-1.5 text-xs focus:border-primary outline-none" placeholder="Ex: 8d6" />
                                    <p class="text-[9px] text-muted-foreground mt-1">Sera rolado ao clicar.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                <!-- Modal Footer -->
                <div class="p-4 border-t border-border bg-muted/30 flex justify-end gap-3">
                    <button @click="showModal = false" class="px-5 py-2 rounded-lg text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">
                        Cancelar
                    </button>
                    <button @click="saveSpell" :disabled="saving || !editSpell.name" 
                        class="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
                        <Save class="w-4 h-4" /> {{ saving ? 'Salvando...' : 'Salvar Magia' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
