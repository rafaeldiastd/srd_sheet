<script setup lang="ts">
import { ref, computed } from 'vue'
import { mapFoundryToSheet } from '@/lib/foundryMapper'
import { X, Upload, CheckCircle, ChevronDown, ChevronUp, User, Swords, Shield, BookOpen, Package, Star } from 'lucide-vue-next'

const emit = defineEmits<{
    (e: 'close'): void
    (e: 'import', data: any): void
}>()

// ── State ────────────────────────────────────────────────────────────────
const fileInput = ref<HTMLInputElement | null>(null)
const step = ref<'upload' | 'review'>('upload')
const dragging = ref(false)
const mapped = ref<any>(null)
const rawJson = ref<any>(null)

// Sections expand/collapse
const expandedSections = ref<Record<string, boolean>>({
    info: true,
    attributes: true,
    combat: true,
    saves: true,
    ac: false,
    skills: true,
    feats: true,
    equipment: true,
    bio: false,
})

const ATTR_LABELS: Record<string, string> = {
    str: 'Força', dex: 'Destreza', con: 'Constituição',
    int: 'Inteligência', wis: 'Sabedoria', cha: 'Carisma'
}

// ── File Handling ─────────────────────────────────────────────────────────
function onDrop(e: DragEvent) {
    dragging.value = false
    const file = e.dataTransfer?.files?.[0]
    if (file) processFile(file)
}

function onFileChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) processFile(file)
}

async function processFile(file: File) {
    try {
        const text = await file.text()
        const json = JSON.parse(text)
        rawJson.value = json
        // O mapper agora cobre todos os campos
        mapped.value = mapFoundryToSheet(json)
        // Garante campos que o wizard precisa mas o mapper pode omitir
        if (!mapped.value.avatar_url) mapped.value.avatar_url = ''
        if (!mapped.value.bio) mapped.value.bio = ''
        step.value = 'review'
    } catch (err) {
        console.error(err)
        alert('Arquivo inválido. Verifique se é um JSON exportado do Foundry VTT (D35E).')
    }
}

// ── Computed helpers ──────────────────────────────────────────────────────
const skillCount = computed(() => Object.keys(mapped.value?.skills || {}).filter(k => (mapped.value.skills[k] ?? 0) > 0).length)
const featCount = computed(() => (mapped.value?.feats || []).length)
const equipCount = computed(() => (mapped.value?.equipment || []).length)

function toggleSection(key: string) {
    expandedSections.value[key] = !expandedSections.value[key]
}

// ── Confirm import ────────────────────────────────────────────────────────
function confirmImport() {
    emit('import', mapped.value)
    emit('close')
}
</script>

<template>
    <div class="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        @click.self="emit('close')">
        <div
            class="w-full max-w-3xl bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Upload class="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <h2 class="font-bold text-lg text-white">Importar do Foundry VTT</h2>
                        <p class="text-xs text-muted-foreground">Formato D35E (JSON exportado)</p>
                    </div>
                </div>
                <button @click="emit('close')"
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-white hover:bg-accent transition-colors">
                    <X class="w-4 h-4" />
                </button>
            </div>

            <!-- Step: Upload -->
            <div v-if="step === 'upload'" class="flex-1 flex flex-col items-center justify-center p-8">
                <input ref="fileInput" type="file" accept=".json" class="hidden" @change="onFileChange" />

                <!-- Drop Zone -->
                <div @dragover.prevent="dragging = true" @dragleave="dragging = false" @drop.prevent="onDrop"
                    @click="fileInput?.click()"
                    class="w-full border-2 border-dashed rounded-2xl p-12 flex flex-col items-center gap-4 cursor-pointer transition-all duration-200"
                    :class="dragging
                        ? 'border-primary bg-primary/10 scale-[1.01]'
                        : 'border-border hover:border-muted-foreground hover:bg-muted/50'">
                    <div class="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                        <Upload class="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div class="text-center">
                        <p class="font-semibold text-foreground">Arraste o arquivo JSON aqui</p>
                        <p class="text-sm text-muted-foreground mt-1">ou <span class="text-primary underline">clique para
                                selecionar</span></p>
                    </div>
                    <div class="flex flex-col gap-1.5 text-xs text-muted-foreground/60 text-center mt-2">
                        <p> Exportado pelo Foundry VTT com o sistema D35E</p>
                        <p> Arquivo no formato <code class="bg-accent px-1 rounded">.json</code></p>
                    </div>
                </div>

                <!-- How to export hint -->
                <div class="mt-6 w-full bg-muted/50 border border-border rounded-xl p-4 text-xs text-muted-foreground space-y-1">
                    <p class="font-semibold text-muted-foreground mb-2">Como exportar do Foundry:</p>
                    <p>1. Abra o Foundry VTT e acesse a ficha do personagem</p>
                    <p>2. Clique com o botão direito no ator na lista de Atores</p>
                    <p>3. Selecione <strong class="text-foreground/80">Exportar Dados</strong></p>
                    <p>4. Salve o arquivo <code class="bg-accent px-1 rounded">.json</code> e importe aqui</p>
                </div>
            </div>

            <!-- Step: Review -->
            <div v-else-if="step === 'review' && mapped" class="flex-1 overflow-y-auto">
                <div class="p-6 space-y-3">

                    <!-- Success banner -->
                    <div class="flex items-center gap-3 bg-green-950/50 border border-green-800/50 rounded-xl px-4 py-3">
                        <CheckCircle class="w-5 h-5 text-green-400 shrink-0" />
                        <div class="flex-1">
                            <p class="text-sm font-semibold text-green-300">Ficha detectada com sucesso!</p>
                            <p class="text-xs text-green-600">Revise os dados abaixo e edite o que precisar antes de
                                confirmar.</p>
                        </div>
                        <div class="flex gap-3 text-xs text-muted-foreground shrink-0">
                            <span class="bg-accent px-2 py-0.5 rounded">{{ skillCount }} perícias</span>
                            <span class="bg-accent px-2 py-0.5 rounded">{{ featCount }} talentos</span>
                            <span class="bg-accent px-2 py-0.5 rounded">{{ equipCount }} itens</span>
                        </div>
                    </div>

                    <!-- ── INFORMAÇÕES BÁSICAS ── -->
                    <div class="bg-muted/50 border border-border rounded-xl overflow-hidden">
                        <button @click="toggleSection('info')"
                            class="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-accent/50 transition-colors">
                            <div class="flex items-center gap-2 text-sm font-semibold text-white">
                                <User class="w-4 h-4 text-primary" /> Informações Básicas
                            </div>
                            <ChevronUp v-if="expandedSections.info" class="w-4 h-4 text-muted-foreground" />
                            <ChevronDown v-else class="w-4 h-4 text-muted-foreground" />
                        </button>
                        <div v-show="expandedSections.info" class="px-4 pb-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                            <div class="col-span-2 md:col-span-1 grid gap-1">
                                <label class="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Nome</label>
                                <input v-model="mapped.name" class="foundry-input" placeholder="Nome do personagem" />
                            </div>
                            <div class="grid gap-1">
                                <label class="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Raça</label>
                                <input v-model="mapped.race" class="foundry-input" placeholder="Raça" />
                            </div>
                            <div class="grid gap-1">
                                <label class="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Classe</label>
                                <input v-model="mapped.class" class="foundry-input" placeholder="Classe" />
                            </div>
                            <div class="grid gap-1">
                                <label class="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Nível</label>
                                <input v-model.number="mapped.level" type="number" min="1" max="30" class="foundry-input" />
                            </div>
                            <div class="grid gap-1">
                                <label class="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Tendência</label>
                                <input v-model="mapped.alignment" class="foundry-input" placeholder="Tendência" />
                            </div>
                            <div class="grid gap-1">
                                <label class="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Divindade</label>
                                <input v-model="mapped.deity" class="foundry-input" placeholder="Divindade" />
                            </div>
                            <div class="grid gap-1">
                                <label class="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Idade</label>
                                <input v-model="mapped.age" class="foundry-input" placeholder="Idade" />
                            </div>
                            <div class="grid gap-1">
                                <label class="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Gênero</label>
                                <input v-model="mapped.gender" class="foundry-input" placeholder="Gênero" />
                            </div>
                            <div class="grid gap-1">
                                <label class="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Altura</label>
                                <input v-model="mapped.height" class="foundry-input" placeholder="Altura" />
                            </div>
                            <div class="grid gap-1">
                                <label class="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Peso</label>
                                <input v-model="mapped.weight" class="foundry-input" placeholder="Peso" />
                            </div>
                            <div class="grid gap-1">
                                <label class="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">XP</label>
                                <input v-model.number="mapped.xp" type="number" class="foundry-input" />
                            </div>
                            <div class="col-span-2 md:col-span-3 grid gap-1">
                                <label class="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">URL do Avatar (opcional)</label>
                                <input v-model="mapped.avatar_url" class="foundry-input" placeholder="https://..." />
                            </div>
                        </div>
                    </div>

                    <!-- ── ATRIBUTOS ── -->
                    <div class="bg-muted/50 border border-border rounded-xl overflow-hidden">
                        <button @click="toggleSection('attributes')"
                            class="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-accent/50 transition-colors">
                            <div class="flex items-center gap-2 text-sm font-semibold text-white">
                                <Star class="w-4 h-4 text-primary" /> Atributos
                            </div>
                            <ChevronUp v-if="expandedSections.attributes" class="w-4 h-4 text-muted-foreground" />
                            <ChevronDown v-else class="w-4 h-4 text-muted-foreground" />
                        </button>
                        <div v-show="expandedSections.attributes" class="px-4 pb-4 grid grid-cols-3 md:grid-cols-6 gap-3">
                            <div v-for="(label, key) in ATTR_LABELS" :key="key" class="grid gap-1 text-center">
                                <label class="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{{ label.slice(0, 3) }}</label>
                                <input
                                    v-model.number="mapped.attributes[key].base"
                                    type="number" min="1" max="40"
                                    class="foundry-input text-center text-lg font-bold text-primary" />
                                <p class="text-[10px] text-muted-foreground/60">
                                    {{ mapped.attributes[key].base >= 10
                                        ? '+' + Math.floor((mapped.attributes[key].base - 10) / 2)
                                        : Math.floor((mapped.attributes[key].base - 10) / 2) }}
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- ── COMBATE ── -->
                    <div class="bg-muted/50 border border-border rounded-xl overflow-hidden">
                        <button @click="toggleSection('combat')"
                            class="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-accent/50 transition-colors">
                            <div class="flex items-center gap-2 text-sm font-semibold text-white">
                                <Swords class="w-4 h-4 text-primary" /> Combate
                            </div>
                            <ChevronUp v-if="expandedSections.combat" class="w-4 h-4 text-muted-foreground" />
                            <ChevronDown v-else class="w-4 h-4 text-muted-foreground" />
                        </button>
                        <div v-show="expandedSections.combat" class="px-4 pb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div class="grid gap-1">
                                <label class="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">PV Máximos</label>
                                <input v-model.number="mapped.hp_max" type="number" class="foundry-input" />
                            </div>
                            <div class="grid gap-1">
                                <label class="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">PV Atuais</label>
                                <input v-model.number="mapped.hp_current" type="number" class="foundry-input" />
                            </div>
                            <div class="grid gap-1">
                                <label class="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">BBA</label>
                                <input v-model.number="mapped.bab" type="number" class="foundry-input" />
                            </div>
                            <div class="grid gap-1">
                                <label class="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Deslocamento (m)</label>
                                <input v-model.number="mapped.speed" type="number" class="foundry-input" />
                            </div>
                            <div class="grid gap-1">
                                <label class="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Iniciativa (misc)</label>
                                <input v-model.number="mapped.initiative_misc" type="number" class="foundry-input" />
                            </div>
                        </div>
                    </div>

                    <!-- ── TESTES DE RESISTÊNCIA ── -->
                    <div class="bg-muted/50 border border-border rounded-xl overflow-hidden">
                        <button @click="toggleSection('saves')"
                            class="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-accent/50 transition-colors">
                            <div class="flex items-center gap-2 text-sm font-semibold text-white">
                                <Shield class="w-4 h-4 text-primary" /> Testes de Resistência
                            </div>
                            <ChevronUp v-if="expandedSections.saves" class="w-4 h-4 text-muted-foreground" />
                            <ChevronDown v-else class="w-4 h-4 text-muted-foreground" />
                        </button>
                        <div v-show="expandedSections.saves" class="px-4 pb-4 grid grid-cols-3 gap-3">
                            <div class="grid gap-1">
                                <label class="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Fortitude</label>
                                <input v-model.number="mapped.save_fort" type="number" class="foundry-input" />
                            </div>
                            <div class="grid gap-1">
                                <label class="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Reflexos</label>
                                <input v-model.number="mapped.save_ref" type="number" class="foundry-input" />
                            </div>
                            <div class="grid gap-1">
                                <label class="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Vontade</label>
                                <input v-model.number="mapped.save_will" type="number" class="foundry-input" />
                            </div>
                        </div>
                    </div>

                    <!-- ── CLASSE DE ARMADURA ── -->
                    <div class="bg-muted/50 border border-border rounded-xl overflow-hidden">
                        <button @click="toggleSection('ac')"
                            class="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-accent/50 transition-colors">
                            <div class="flex items-center gap-2 text-sm font-semibold text-white">
                                <Shield class="w-4 h-4 text-amber-400" /> Classe de Armadura (CA)
                            </div>
                            <ChevronUp v-if="expandedSections.ac" class="w-4 h-4 text-muted-foreground" />
                            <ChevronDown v-else class="w-4 h-4 text-muted-foreground" />
                        </button>
                        <div v-show="expandedSections.ac" class="px-4 pb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div class="grid gap-1">
                                <label class="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total</label>
                                <input v-model.number="mapped.ac.total" type="number" class="foundry-input text-primary font-bold" />
                            </div>
                            <div class="grid gap-1">
                                <label class="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Contato</label>
                                <input v-model.number="mapped.ac.touch" type="number" class="foundry-input" />
                            </div>
                            <div class="grid gap-1">
                                <label class="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Surpreendido</label>
                                <input v-model.number="mapped.ac.flatFooted" type="number" class="foundry-input" />
                            </div>
                            <div class="grid gap-1">
                                <label class="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Armadura</label>
                                <input v-model.number="mapped.ac.armor" type="number" class="foundry-input" />
                            </div>
                            <div class="grid gap-1">
                                <label class="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Escudo</label>
                                <input v-model.number="mapped.ac.shield" type="number" class="foundry-input" />
                            </div>
                            <div class="grid gap-1">
                                <label class="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Natural</label>
                                <input v-model.number="mapped.ac.natural" type="number" class="foundry-input" />
                            </div>
                            <div class="grid gap-1">
                                <label class="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Deflexão</label>
                                <input v-model.number="mapped.ac.deflection" type="number" class="foundry-input" />
                            </div>
                            <div class="grid gap-1">
                                <label class="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Misc</label>
                                <input v-model.number="mapped.ac.misc" type="number" class="foundry-input" />
                            </div>
                        </div>
                    </div>

                    <!-- ── PERÍCIAS ── -->
                    <div class="bg-muted/50 border border-border rounded-xl overflow-hidden">
                        <button @click="toggleSection('skills')"
                            class="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-accent/50 transition-colors">
                            <div class="flex items-center gap-2 text-sm font-semibold text-white">
                                <BookOpen class="w-4 h-4 text-primary" /> Perícias
                                <span class="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full ml-1">{{ skillCount }} com graduação</span>
                            </div>
                            <ChevronUp v-if="expandedSections.skills" class="w-4 h-4 text-muted-foreground" />
                            <ChevronDown v-else class="w-4 h-4 text-muted-foreground" />
                        </button>
                        <div v-show="expandedSections.skills" class="px-4 pb-4">
                            <div v-if="Object.keys(mapped.skills || {}).length === 0"
                                class="text-sm text-muted-foreground/60 py-4 text-center">Nenhuma perícia com graduação encontrada.</div>
                            <div v-else class="grid grid-cols-2 md:grid-cols-3 gap-2">
                                <div v-for="(ranks, skillName) in mapped.skills" :key="skillName"
                                    class="flex items-center justify-between bg-accent/50 rounded-lg px-3 py-2 gap-2">
                                    <span class="text-xs text-foreground/80 flex-1 min-w-0 truncate" :title="String(skillName)">{{ skillName }}</span>
                                    <div class="flex items-center gap-1 shrink-0">
                                        <span class="text-[10px] text-muted-foreground/60">ranks</span>
                                        <input v-model.number="mapped.skills[skillName]" type="number" min="0"
                                            class="w-12 bg-muted border border-border rounded px-2 py-1 text-xs text-center text-primary font-bold focus:outline-none" style="border-color: rgb(63 63 70)" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- ── TALENTOS ── -->
                    <div class="bg-muted/50 border border-border rounded-xl overflow-hidden">
                        <button @click="toggleSection('feats')"
                            class="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-accent/50 transition-colors">
                            <div class="flex items-center gap-2 text-sm font-semibold text-white">
                                <Star class="w-4 h-4 text-amber-400" /> Talentos
                                <span class="text-xs bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full ml-1">{{ featCount }} importados</span>
                            </div>
                            <ChevronUp v-if="expandedSections.feats" class="w-4 h-4 text-muted-foreground" />
                            <ChevronDown v-else class="w-4 h-4 text-muted-foreground" />
                        </button>
                        <div v-show="expandedSections.feats" class="px-4 pb-4 space-y-2">
                            <div v-if="featCount === 0" class="text-sm text-muted-foreground/60 py-4 text-center">Nenhum talento importado.</div>
                            <div v-for="(feat, i) in mapped.feats" :key="i"
                                class="bg-accent/50 rounded-lg px-3 py-2.5">
                                <div class="flex items-start justify-between gap-2">
                                    <div class="flex-1 min-w-0">
                                        <input v-model="feat.title"
                                            class="w-full bg-transparent text-sm font-semibold text-foreground focus:outline-none focus:text-white border-b border-transparent focus:border-border pb-0.5 mb-1" />
                                        <p v-if="feat.description" class="text-[11px] text-muted-foreground line-clamp-2">{{ feat.description }}</p>
                                        <span v-if="feat.featType"
                                            class="inline-block mt-1 text-[10px] bg-accent text-muted-foreground px-1.5 py-0.5 rounded capitalize">
                                            {{ feat.featType }}
                                        </span>
                                    </div>
                                    <button @click="mapped.feats.splice(i, 1)"
                                        class="shrink-0 text-muted-foreground/60 hover:text-red-400 transition-colors mt-0.5">
                                        <X class="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- ── EQUIPAMENTOS ── -->
                    <div class="bg-muted/50 border border-border rounded-xl overflow-hidden">
                        <button @click="toggleSection('equipment')"
                            class="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-accent/50 transition-colors">
                            <div class="flex items-center gap-2 text-sm font-semibold text-white">
                                <Package class="w-4 h-4 text-primary" /> Equipamentos
                                <span class="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full ml-1">{{ equipCount }} importados</span>
                            </div>
                            <ChevronUp v-if="expandedSections.equipment" class="w-4 h-4 text-muted-foreground" />
                            <ChevronDown v-else class="w-4 h-4 text-muted-foreground" />
                        </button>
                        <div v-show="expandedSections.equipment" class="px-4 pb-4 space-y-2">
                            <div v-if="equipCount === 0" class="text-sm text-muted-foreground/60 py-4 text-center">Nenhum equipamento importado.</div>
                            <div v-for="(item, i) in mapped.equipment" :key="i"
                                class="bg-accent/50 rounded-lg px-3 py-2.5">
                                <div class="flex items-start justify-between gap-2">
                                    <div class="flex-1 min-w-0">
                                        <input v-model="item.title"
                                            class="w-full bg-transparent text-sm font-semibold text-foreground focus:outline-none focus:text-white border-b border-transparent focus:border-border pb-0.5 mb-1" />
                                        <div class="flex items-center gap-3 text-[11px] text-muted-foreground">
                                            <span>Qtd:
                                                <input v-model.number="item.quantity" type="number" min="1"
                                                    class="w-12 bg-muted border border-border rounded px-1 py-0.5 text-center text-primary focus:outline-none focus:border-primary" />
                                            </span>
                                            <span>Peso:
                                                <input v-model.number="item.weight" type="number" min="0"
                                                    class="w-14 bg-muted border border-border rounded px-1 py-0.5 text-center focus:outline-none focus:border-primary" />
                                                kg
                                            </span>
                                            <label class="flex items-center gap-1 cursor-pointer">
                                                <input v-model="item.equipped" type="checkbox"
                                                    class="rounded border-border" />
                                                Equipado
                                            </label>
                                        </div>
                                    </div>
                                    <button @click="mapped.equipment.splice(i, 1)"
                                        class="shrink-0 text-muted-foreground/60 hover:text-red-400 transition-colors mt-0.5">
                                        <X class="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- ── BIOGRAFIA ── -->
                    <div class="bg-muted/50 border border-border rounded-xl overflow-hidden">
                        <button @click="toggleSection('bio')"
                            class="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-accent/50 transition-colors">
                            <div class="flex items-center gap-2 text-sm font-semibold text-white">
                                <User class="w-4 h-4 text-muted-foreground" /> Biografia
                            </div>
                            <ChevronUp v-if="expandedSections.bio" class="w-4 h-4 text-muted-foreground" />
                            <ChevronDown v-else class="w-4 h-4 text-muted-foreground" />
                        </button>
                        <div v-show="expandedSections.bio" class="px-4 pb-4">
                            <textarea v-model="mapped.bio" rows="5" placeholder="Biografia do personagem..."
                                class="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground resize-vertical outline-none focus:border-primary transition-colors" />
                        </div>
                    </div>

                </div>
            </div>

            <!-- Footer -->
            <div class="px-6 py-4 border-t border-border flex items-center justify-between shrink-0 bg-card/50">
                <button v-if="step === 'review'" @click="step = 'upload'"
                    class="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Upload class="w-4 h-4" /> Trocar arquivo
                </button>
                <span v-else class="text-xs text-muted-foreground/60">Arquivo .json do Foundry VTT (sistema D35E)</span>

                <button v-if="step === 'review'" @click="confirmImport"
                    class="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                    <CheckCircle class="w-4 h-4" /> Confirmar Importação
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.foundry-input {
    width: 100%;
    background-color: var(--muted);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
    line-height: 1.25rem;
    color: var(--foreground);
    transition: border-color 0.15s, box-shadow 0.15s;
}
.foundry-input::placeholder {
    color: var(--muted-foreground);
    opacity: 0.6;
}
.foundry-input:focus {
    outline: none;
    border-color: hsl(var(--primary));
    box-shadow: 0 0 0 1px hsl(var(--primary) / 0.3);
}
</style>
