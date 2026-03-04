<script setup lang="ts">
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { SKILLS_DATA, CLASS_SKILLS, CLASS_SKILL_POINTS } from '@/data/dnd35'
import type { SheetData } from '@/types/sheet'
import { X, CheckCircle, Search, Plus, Trash2, User } from 'lucide-vue-next'

const props = defineProps<{
    sheetId: string
    initialData: SheetData
    sheetName: string
    sheetRace: string
    sheetClass: string
    sheetLevel: number
}>()

const emit = defineEmits<{
    (e: 'close'): void
    (e: 'saved', payload: { meta: { name: string; class: string; level: number; race: string }, data: any }): void
}>()

// ── Local editable copy ────────────────────────────────────────────────────
const saving = ref(false)
const activeTab = ref('info')

const TABS = [
    { id: 'info',   label: 'Identidade'  },
    { id: 'attrs',  label: 'Atributos'   },
    { id: 'combat', label: 'Combate'     },
    { id: 'skills', label: 'Perícias'    },
    { id: 'feats',  label: 'Talentos'    },
    { id: 'equip',  label: 'Equipamento' },
    { id: 'bio',    label: 'Biografia'   },
]

const ch = ref<any>(JSON.parse(JSON.stringify({
    name:            props.sheetName,
    race:            props.sheetRace,
    class:           props.sheetClass,
    level:           props.sheetLevel,
    // spread data after so top-level fields override
    hp_max:          props.initialData.hp_max,
    xp:              props.initialData.xp ?? 0,
    bab:             props.initialData.bab ?? 0,
    speed:           props.initialData.speed ?? 9,
    initiative_misc: props.initialData.initiative_misc ?? 0,
    save_fort:       props.initialData.save_fort ?? 0,
    save_ref:        props.initialData.save_ref ?? 0,
    save_will:       props.initialData.save_will ?? 0,
    size:            props.initialData.size ?? 'Médio',
    alignment:       props.initialData.alignment ?? '',
    deity:           props.initialData.deity ?? '',
    age:             props.initialData.age ?? '',
    gender:          props.initialData.gender ?? '',
    height:          props.initialData.height ?? '',
    weight_char:     props.initialData.weight_char ?? '',
    eyes:            props.initialData.eyes ?? '',
    hair:            props.initialData.hair ?? '',
    skin:            props.initialData.skin ?? '',
    avatar_url:      props.initialData.avatar_url ?? '',
    cover_url:       props.initialData.cover_url ?? '',
    token_url:       props.initialData.token_url ?? '',
    bio:             props.initialData.bio ?? '',
    customSkillPoints: props.initialData.customSkillPoints,
    skillPoints:     props.initialData.skillPoints,
    // complex objects
    attributes: props.initialData.attributes ?? {
        str: { base: 10, temp: 0 }, dex: { base: 10, temp: 0 },
        con: { base: 10, temp: 0 }, int: { base: 10, temp: 0 },
        wis: { base: 10, temp: 0 }, cha: { base: 10, temp: 0 },
    },
    ac: props.initialData.ac ?? { armor: 0, shield: 0, natural: 0, deflection: 0, size: 0, misc: 0, dexMod: 0, total: 10, touch: 10, flatFooted: 10 },
    skills:    props.initialData.skills    ?? {},
    feats:     props.initialData.feats     ?? [],
    equipment: props.initialData.equipment ?? [],
})))

// ── Atributos ──────────────────────────────────────────────────────────────
const ATTR_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha']
const ATTR_LABELS: Record<string, string> = {
    str: 'Força', dex: 'Destreza', con: 'Constituição',
    int: 'Inteligência', wis: 'Sabedoria', cha: 'Carisma'
}
function attrMod(base: number) {
    const m = Math.floor((base - 10) / 2)
    return (m >= 0 ? '+' : '') + m
}

// ── Rolagem ────────────────────────────────────────────────────────────────
interface DiceRoll { id: number; dice: number[]; dropped: number; total: number }
const rollPool = ref<DiceRoll[]>([])
const selectedRollId = ref<number | null>(null)
const isRolling = ref(false)
const rollAnimDice = ref<number[][]>([])
let rollIdCounter = 0
const attrAssignment = ref<Record<string, number | null>>(
    Object.fromEntries(ATTR_KEYS.map(k => [k, null]))
)
function d6() { return Math.floor(Math.random() * 6) + 1 }
function makeRoll(): DiceRoll {
    const dice = [d6(), d6(), d6(), d6()]
    const min = Math.min(...dice)
    const dropped = dice.indexOf(min)
    return { id: rollIdCounter++, dice, dropped, total: dice.reduce((s, v) => s + v, 0) - min }
}
async function rollPool6() {
    isRolling.value = true; selectedRollId.value = null; rollPool.value = []
    rollAnimDice.value = Array.from({ length: 6 }, () => [d6(), d6(), d6(), d6()])
    const start = Date.now()
    while (Date.now() - start < 700) {
        rollAnimDice.value = Array.from({ length: 6 }, () => [d6(), d6(), d6(), d6()])
        await new Promise(r => setTimeout(r, 60))
    }
    rollPool.value = Array.from({ length: 6 }, makeRoll)
    rollAnimDice.value = []; isRolling.value = false
}
const selectedRoll = computed(() => rollPool.value.find(r => r.id === selectedRollId.value) ?? null)
function isRollUsed(id: number) { return Object.values(attrAssignment.value).includes(id) }
function selectRoll(id: number) { selectedRollId.value = selectedRollId.value === id ? null : id }
function assignToAttr(key: string) {
    if (!selectedRoll.value) return
    for (const k of ATTR_KEYS) { if (attrAssignment.value[k] === selectedRoll.value.id) attrAssignment.value[k] = null }
    if (attrAssignment.value[key] === selectedRoll.value.id) { attrAssignment.value[key] = null; selectedRollId.value = null; return }
    attrAssignment.value[key] = selectedRoll.value.id
    ch.value.attributes[key].base = selectedRoll.value.total
    selectedRollId.value = null
}
function unassignAttr(key: string) { attrAssignment.value[key] = null; ch.value.attributes[key].base = 10 }
const poolSum = computed(() => rollPool.value.reduce((s, r) => s + r.total, 0))

// ── Perícias ───────────────────────────────────────────────────────────────
const skillSearch = ref('')
const showOnlySelected = ref(false)
const intMod = computed(() => Math.floor((ch.value.attributes.int.base - 10) / 2))
const isHuman = computed(() => ch.value.race?.toLowerCase().includes('humano') || ch.value.race?.toLowerCase().includes('human'))
const classSkillList = computed(() => CLASS_SKILLS[ch.value.class] || [])
function isClassSkill(n: string) {
    if (ch.value.class === 'Personalizada') return true
    if (classSkillList.value.includes(n)) return true
    if (n.startsWith('Conhecimento') && classSkillList.value.includes('Conhecimento (Todos)')) return true
    if (ch.value.class === 'Bardo' && n.startsWith('Conhecimento')) return true
    return false
}
const calcSkillPoints = computed(() => {
    const base = ch.value.customSkillPoints || CLASS_SKILL_POINTS[ch.value.class] || 2
    const per = Math.max(1, base + intMod.value)
    return per * 4 + (isHuman.value ? 4 : 0) + Math.max(0, ch.value.level - 1) * (per + (isHuman.value ? 1 : 0))
})
const usedPoints = computed(() => {
    let t = 0
    for (const [n, r] of Object.entries(ch.value.skills || {})) t += isClassSkill(n) ? (r as number) : (r as number) * 2
    return t
})
const remainingPoints = computed(() => (ch.value.skillPoints || 0) - usedPoints.value)
const filteredSkills = computed(() => {
    const q = skillSearch.value.toLowerCase()
    return SKILLS_DATA.filter(s => {
        if (showOnlySelected.value && ch.value.skills[s.name] === undefined) return false
        return !q || s.name.toLowerCase().includes(q)
    })
})
function getAbilityMod(ability: string) {
    const a = ch.value.attributes[ability]
    return Math.floor((a.base + (a.temp || 0) - 10) / 2)
}
function getSkillTotal(n: string, ability: string) { return (ch.value.skills[n] || 0) + getAbilityMod(ability) }
function toggleSkill(n: string) {
    const s = { ...ch.value.skills }
    if (s[n] !== undefined) delete s[n]; else s[n] = 0
    ch.value.skills = s
}
function setRank(n: string, v: number | string) { ch.value.skills = { ...ch.value.skills, [n]: Math.max(0, Number(v) || 0) } }

// ── Talentos / Itens ───────────────────────────────────────────────────────
function addFeat() { ch.value.feats = [...(ch.value.feats || []), { title: '', description: '', featType: 'feat' }] }
function removeFeat(i: number | string) { ch.value.feats.splice(Number(i), 1) }
function addItem() { ch.value.equipment = [...(ch.value.equipment || []), { title: '', description: '', equipped: false, weight: 0, price: 0, quantity: 1 }] }
function removeItem(i: number | string) { ch.value.equipment.splice(Number(i), 1) }

// ── Sizes / Alignments ────────────────────────────────────────────────────
const SIZES = ['Mínimo', 'Diminuto', 'Miúdo', 'Pequeno', 'Médio', 'Grande', 'Enorme', 'Imenso', 'Colossal']
const ALIGNMENTS = ['Leal e Bom', 'Neutro e Bom', 'Caótico e Bom', 'Leal e Neutro', 'Neutro', 'Caótico e Neutro', 'Leal e Mau', 'Neutro e Mau', 'Caótico e Mau']

// ── Save ───────────────────────────────────────────────────────────────────
async function handleSave() {
    if (!ch.value.name?.trim()) { alert('Nome obrigatório.'); activeTab.value = 'info'; return }
    saving.value = true

    // Constrói o data sem duplicar name/race/class/level no payload de data
    const { name, race, class: cls, level, ...rest } = ch.value
    const dataPayload = {
        ...props.initialData,
        ...rest,
        // garante que não sobrescreve campos gerenciados dinamicamente
    }

    const meta = {
        name:  name  ?? props.sheetName,
        race:  race  ?? props.sheetRace,
        class: cls   ?? props.sheetClass,
        level: level ?? props.sheetLevel,
    }

    const { error } = await supabase.from('sheets').update({
        ...meta,
        data: dataPayload,
    }).eq('id', props.sheetId)

    saving.value = false
    if (error) { alert('Erro ao salvar: ' + error.message); return }
    emit('saved', { meta, data: dataPayload })
    emit('close')
}
</script>

<template>
    <Teleport to="body">
        <div class="fixed inset-0 z-[200] bg-black/85 backdrop-blur-sm overflow-y-auto" @click.self="emit('close')">
            <div class="min-h-screen flex items-start justify-center py-8 px-4">
                <div class="w-full max-w-5xl bg-card border border-border rounded-2xl shadow-2xl flex flex-col">

                    <!-- ── HEADER ─────────────────────────────────────── -->
                    <div class="sticky top-0 z-10 bg-card/95 backdrop-blur-md border-b border-border px-5 py-3 rounded-t-2xl flex items-center justify-between gap-4">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                                <User class="w-4 h-4 text-primary" />
                            </div>
                            <div>
                                <h2 class="text-sm font-bold text-white leading-tight">{{ ch.name || 'Personagem' }}</h2>
                                <p class="text-[11px] text-muted-foreground leading-tight">
                                    {{ [ch.race, ch.class, ch.level ? `Nível ${ch.level}` : ''].filter(Boolean).join(' · ') }}
                                </p>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <button @click="handleSave" :disabled="saving"
                                class="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 shadow-lg shadow-primary/20">
                                <CheckCircle class="w-3.5 h-3.5" />
                                {{ saving ? 'Salvando...' : 'Salvar' }}
                            </button>
                            <button @click="emit('close')"
                                class="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-white hover:bg-accent transition-colors">
                                <X class="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <!-- ── TABS ───────────────────────────────────────── -->
                    <div class="flex gap-1 bg-muted/50 m-4 mb-0 rounded-xl p-1 border border-border overflow-x-auto shrink-0">
                        <button v-for="tab in TABS" :key="tab.id" @click="activeTab = tab.id"
                            class="flex-1 min-w-fit px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
                            :class="activeTab === tab.id ? 'bg-accent text-white shadow-sm' : 'text-muted-foreground hover:text-foreground/80'">
                            {{ tab.label }}
                        </button>
                    </div>

                    <!-- ── CONTENT ────────────────────────────────────── -->
                    <div class="p-4 space-y-5 overflow-y-auto">

                        <!-- IDENTIDADE -->
                        <div v-show="activeTab === 'info'" class="space-y-4">
                            <div class="flex gap-4 items-start">
                                <div class="shrink-0">
                                    <div class="w-20 h-20 rounded-xl border-2 border-border bg-muted overflow-hidden">
                                        <img v-if="ch.avatar_url" :src="ch.avatar_url" class="w-full h-full object-cover" />
                                        <div v-else class="w-full h-full flex items-center justify-center"><User class="w-8 h-8 text-muted-foreground/40" /></div>
                                    </div>
                                </div>
                                <div class="flex-1">
                                    <label class="fi-label">URL do Avatar</label>
                                    <input v-model="ch.avatar_url" class="fi-input" placeholder="https://..." />
                                </div>
                            </div>
                            <!-- Cover image -->
                            <div>
                                <label class="fi-label">URL da Imagem de Capa</label>
                                <input v-model="ch.cover_url" class="fi-input" placeholder="https://..." />
                                <div v-if="ch.cover_url" class="mt-2 h-24 rounded-lg overflow-hidden border border-border">
                                    <img :src="ch.cover_url" class="w-full h-full object-cover" />
                                </div>
                            </div>
                            <!-- Token -->
                            <div>
                                <label class="fi-label">URL do Token</label>
                                <input v-model="ch.token_url" class="fi-input" placeholder="https://..." />
                            </div>
                            <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                                <div class="col-span-2 md:col-span-1">
                                    <label class="fi-label">Nome <span class="text-red-400">*</span></label>
                                    <input v-model="ch.name" class="fi-input" />
                                </div>
                                <div><label class="fi-label">Raça</label><input v-model="ch.race" class="fi-input" /></div>
                                <div><label class="fi-label">Classe</label><input v-model="ch.class" class="fi-input" /></div>
                                <div><label class="fi-label">Nível</label><input v-model.number="ch.level" type="number" min="1" max="40" class="fi-input" /></div>
                                <div>
                                    <label class="fi-label">Tamanho</label>
                                    <select v-model="ch.size" class="fi-input">
                                        <option v-for="s in SIZES" :key="s">{{ s }}</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="fi-label">Tendência</label>
                                    <select v-model="ch.alignment" class="fi-input">
                                        <option value="">— Selecione —</option>
                                        <option v-for="a in ALIGNMENTS" :key="a">{{ a }}</option>
                                    </select>
                                </div>
                                <div><label class="fi-label">Divindade</label><input v-model="ch.deity" class="fi-input" /></div>
                                <div><label class="fi-label">Idade</label><input v-model="ch.age" class="fi-input" /></div>
                                <div><label class="fi-label">Gênero</label><input v-model="ch.gender" class="fi-input" /></div>
                                <div><label class="fi-label">Altura</label><input v-model="ch.height" class="fi-input" /></div>
                                <div><label class="fi-label">Peso</label><input v-model="ch.weight_char" class="fi-input" /></div>
                                <div><label class="fi-label">Olhos</label><input v-model="ch.eyes" class="fi-input" /></div>
                                <div><label class="fi-label">Cabelo</label><input v-model="ch.hair" class="fi-input" /></div>
                                <div><label class="fi-label">Pele</label><input v-model="ch.skin" class="fi-input" /></div>
                                <div><label class="fi-label">XP</label><input v-model.number="ch.xp" type="number" min="0" class="fi-input" /></div>
                            </div>
                        </div>

                        <!-- ATRIBUTOS -->
                        <div v-show="activeTab === 'attrs'" class="space-y-4">
                            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                                <div v-for="key in ATTR_KEYS" :key="key"
                                    @click="assignToAttr(key)"
                                    class="flex flex-col items-center gap-2 p-4 rounded-xl border transition-all"
                                    :class="[
                                        selectedRoll ? 'cursor-pointer border-amber-600/60 bg-amber-950/20 hover:bg-amber-900/30' : 'cursor-default border-border bg-muted/50',
                                        attrAssignment[key] !== null ? 'ring-2 ring-primary/40' : ''
                                    ]">
                                    <span class="text-[10px] font-bold uppercase tracking-widest" :class="attrAssignment[key] !== null ? 'text-primary' : 'text-muted-foreground'">{{ ATTR_LABELS[key] }}</span>
                                    <input v-model.number="ch.attributes[key].base" type="number" min="1" max="40" @click.stop
                                        class="w-full text-center text-2xl font-bold bg-transparent border-b focus:outline-none text-white py-1 transition-colors"
                                        :class="attrAssignment[key] !== null ? 'border-primary' : 'border-border'" />
                                    <div class="text-sm font-bold px-3 py-0.5 rounded-full"
                                        :class="Math.floor((ch.attributes[key].base - 10) / 2) >= 0 ? 'bg-primary/20 text-primary' : 'bg-red-950/50 text-red-400'">
                                        {{ attrMod(ch.attributes[key].base) }}
                                    </div>
                                    <div v-if="attrAssignment[key] !== null" class="flex items-center gap-1">
                                        <span class="text-[10px] bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-full font-bold">
                                            {{ rollPool.find(r => r.id === attrAssignment[key])?.total }}
                                        </span>
                                        <button @click.stop="unassignAttr(key)" class="text-muted-foreground hover:text-red-400 text-[10px] font-bold">×</button>
                                    </div>
                                    <div v-else-if="selectedRoll" class="text-[10px] text-amber-400 font-bold animate-pulse">← {{ selectedRoll.total }}</div>
                                    <div class="w-full">
                                        <label class="text-[10px] text-muted-foreground/60 text-center block mb-0.5">Temp</label>
                                        <input v-model.number="ch.attributes[key].temp" type="number" min="0" @click.stop
                                            class="w-full text-center text-sm bg-accent/50 border border-border rounded focus:outline-none focus:border-primary text-foreground/80 px-2 py-1" />
                                    </div>
                                </div>
                            </div>
                            <!-- Pool -->
                            <div class="border border-border rounded-xl overflow-hidden">
                                <div class="flex items-center justify-between px-4 py-3 bg-muted/80 border-b border-border">
                                    <span class="text-xs font-bold text-muted-foreground uppercase">Pool de Rolagem (4d6 drop lowest)</span>
                                    <span v-if="rollPool.length > 0" class="text-[11px] text-muted-foreground/60 mr-auto ml-3">Soma: <strong class="text-muted-foreground">{{ poolSum }}</strong></span>
                                    <button @click="rollPool6" :disabled="isRolling"
                                        class="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-900/40 border border-amber-700/50 text-amber-300 text-xs font-bold hover:bg-amber-800/50 transition-all disabled:opacity-50">
                                        <span :class="{ 'animate-bounce': isRolling }"></span>
                                        {{ isRolling ? 'Rolando...' : rollPool.length ? 'Rolar Novamente' : 'Rolar 6 Atributos' }}
                                    </button>
                                </div>
                                <div v-if="selectedRoll" class="px-4 py-2 bg-amber-950/30 border-b border-amber-800/40 text-[11px] text-amber-300 font-semibold">
                                     Valor <strong>{{ selectedRoll.total }}</strong> — clique no atributo para aplicar
                                </div>
                                <div v-if="isRolling" class="p-4 grid grid-cols-6 gap-3">
                                    <div v-for="(anim, ai) in rollAnimDice" :key="ai" class="flex flex-col items-center gap-2 p-3 bg-accent/60 rounded-lg border border-border/50">
                                        <div class="flex flex-wrap justify-center gap-1">
                                            <div v-for="(d, di) in anim" :key="di" class="w-6 h-6 rounded bg-amber-900/60 border border-amber-700/50 flex items-center justify-center text-[10px] font-bold text-amber-300">{{ d }}</div>
                                        </div>
                                        <div class="text-base font-bold text-muted-foreground">―</div>
                                    </div>
                                </div>
                                <div v-else-if="rollPool.length > 0" class="p-4 grid grid-cols-3 sm:grid-cols-6 gap-3">
                                    <button v-for="roll in rollPool" :key="roll.id" @click="isRollUsed(roll.id) ? null : selectRoll(roll.id)"
                                        class="flex flex-col items-center gap-2 p-3 rounded-lg border transition-all"
                                        :class="[
                                            selectedRollId === roll.id ? 'bg-amber-900/50 border-amber-500 scale-105' :
                                            isRollUsed(roll.id) ? 'opacity-40 cursor-not-allowed border-border/50 bg-muted/30' :
                                            'bg-accent/40 border-border hover:border-amber-600/60 cursor-pointer'
                                        ]">
                                        <div class="flex flex-wrap justify-center gap-1">
                                            <div v-for="(d, di) in roll.dice" :key="di"
                                                class="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold"
                                                :class="di === roll.dropped ? 'bg-accent text-muted-foreground/60' : selectedRollId === roll.id ? 'bg-amber-700/70 border border-amber-500/60 text-amber-200' : 'bg-accent/70 border border-border/50 text-foreground/80'">
                                                {{ d }}
                                            </div>
                                        </div>
                                        <div class="text-xl font-bold" :class="selectedRollId === roll.id ? 'text-amber-300' : isRollUsed(roll.id) ? 'text-muted-foreground/60' : 'text-white'">{{ roll.total }}</div>
                                        <div v-if="isRollUsed(roll.id)" class="text-[9px] font-bold text-primary">{{ Object.entries(attrAssignment).find(([,v]) => v === roll.id)?.[0]?.toUpperCase() }}</div>
                                    </button>
                                </div>
                                <div v-else class="p-6 text-center text-muted-foreground/60 text-sm">Clique em  para gerar valores e atribuir aos atributos.</div>
                            </div>
                        </div>

                        <!-- COMBATE -->
                        <div v-show="activeTab === 'combat'" class="space-y-5">
                            <div>
                                <h3 class="fi-section-title">PV & Combate</h3>
                                <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div><label class="fi-label">PV Máximos</label><input v-model.number="ch.hp_max" type="number" class="fi-input" /></div>
                                    <div><label class="fi-label">BBA</label><input v-model.number="ch.bab" type="number" class="fi-input" /></div>
                                    <div><label class="fi-label">Deslocamento (m)</label><input v-model.number="ch.speed" type="number" class="fi-input" /></div>
                                    <div><label class="fi-label">Iniciativa (misc)</label><input v-model.number="ch.initiative_misc" type="number" class="fi-input" /></div>
                                </div>
                            </div>
                            <div>
                                <h3 class="fi-section-title">Resistências</h3>
                                <div class="grid grid-cols-3 gap-3">
                                    <div class="p-3 bg-muted/50 border border-border rounded-xl text-center"><label class="fi-label text-center block">Fortitude</label><input v-model.number="ch.save_fort" type="number" class="fi-input text-center text-xl font-bold text-primary" /></div>
                                    <div class="p-3 bg-muted/50 border border-border rounded-xl text-center"><label class="fi-label text-center block">Reflexos</label><input v-model.number="ch.save_ref" type="number" class="fi-input text-center text-xl font-bold text-primary" /></div>
                                    <div class="p-3 bg-muted/50 border border-border rounded-xl text-center"><label class="fi-label text-center block">Vontade</label><input v-model.number="ch.save_will" type="number" class="fi-input text-center text-xl font-bold text-primary" /></div>
                                </div>
                            </div>
                            <div>
                                <h3 class="fi-section-title">Classe de Armadura</h3>
                                <div class="grid grid-cols-3 md:grid-cols-5 gap-2">
                                    <div class="p-3 bg-primary/10 border border-primary/30 rounded-xl text-center"><label class="fi-label text-center block text-primary">Total</label><input v-model.number="ch.ac.total" type="number" class="fi-input text-center text-2xl font-bold text-primary bg-transparent border-none focus:outline-none" /></div>
                                    <div class="p-2 bg-muted/50 border border-border rounded-xl text-center"><label class="fi-label text-center block">Contato</label><input v-model.number="ch.ac.touch" type="number" class="fi-input text-center" /></div>
                                    <div class="p-2 bg-muted/50 border border-border rounded-xl text-center"><label class="fi-label text-center block">Surpreso</label><input v-model.number="ch.ac.flatFooted" type="number" class="fi-input text-center" /></div>
                                    <div class="p-2 bg-muted/50 border border-border rounded-xl text-center"><label class="fi-label text-center block">Armadura</label><input v-model.number="ch.ac.armor" type="number" class="fi-input text-center" /></div>
                                    <div class="p-2 bg-muted/50 border border-border rounded-xl text-center"><label class="fi-label text-center block">Escudo</label><input v-model.number="ch.ac.shield" type="number" class="fi-input text-center" /></div>
                                    <div class="p-2 bg-muted/50 border border-border rounded-xl text-center"><label class="fi-label text-center block">Natural</label><input v-model.number="ch.ac.natural" type="number" class="fi-input text-center" /></div>
                                    <div class="p-2 bg-muted/50 border border-border rounded-xl text-center"><label class="fi-label text-center block">Deflexão</label><input v-model.number="ch.ac.deflection" type="number" class="fi-input text-center" /></div>
                                    <div class="p-2 bg-muted/50 border border-border rounded-xl text-center"><label class="fi-label text-center block">Misc</label><input v-model.number="ch.ac.misc" type="number" class="fi-input text-center" /></div>
                                </div>
                            </div>
                        </div>

                        <!-- PERÍCIAS -->
                        <div v-show="activeTab === 'skills'" class="space-y-3">
                            <div class="grid grid-cols-3 gap-3 p-3 bg-muted/50 border border-border rounded-xl text-center">
                                <div><p class="fi-label text-center">Pontos</p><input v-model.number="ch.skillPoints" type="number" class="w-16 text-center text-xl font-bold bg-transparent text-white border-b border-border focus:outline-none mx-auto block" /><span class="text-[10px] text-muted-foreground/60">Sugerido: {{ calcSkillPoints }}</span></div>
                                <div><p class="fi-label text-center">Usados</p><p class="text-2xl font-bold text-foreground/80">{{ usedPoints }}</p></div>
                                <div><p class="fi-label text-center">Restantes</p><p class="text-2xl font-bold" :class="remainingPoints < 0 ? 'text-red-400' : 'text-primary'">{{ remainingPoints }}</p></div>
                            </div>
                            <div class="flex gap-2">
                                <div class="relative flex-1"><Search class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" /><input v-model="skillSearch" placeholder="Buscar..." class="fi-input pl-8 py-1.5 text-sm" /></div>
                                <button @click="showOnlySelected = !showOnlySelected" class="px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors" :class="showOnlySelected ? 'border-primary bg-primary/20 text-primary' : 'border-border text-muted-foreground'">Só selecionadas</button>
                            </div>
                            <div class="border border-border rounded-xl overflow-hidden">
                                <div class="grid grid-cols-[1fr_48px_48px_80px_56px_40px] px-3 py-2 bg-accent/60 text-[10px] font-bold uppercase text-muted-foreground gap-2">
                                    <div>Perícia</div><div class="text-center">Hab</div><div class="text-center">Mod</div><div class="text-center">Ranks</div><div class="text-center">Total</div><div class="text-center">Cls</div>
                                </div>
                                <div class="divide-y divide-border/50 max-h-[400px] overflow-y-auto">
                                    <div v-for="skill in filteredSkills" :key="skill.name"
                                        class="grid grid-cols-[1fr_48px_48px_80px_56px_40px] px-3 py-2 items-center gap-2 text-sm hover:bg-accent/30 transition-colors"
                                        :class="ch.skills[skill.name] !== undefined ? 'bg-primary/5' : ''">
                                        <button @click="toggleSkill(skill.name)" class="flex items-center gap-2 text-left">
                                            <div class="w-3 h-3 rounded border flex items-center justify-center shrink-0 transition-colors" :class="ch.skills[skill.name] !== undefined ? 'bg-primary border-primary' : 'border-border'">
                                                <span v-if="ch.skills[skill.name] !== undefined" class="text-primary-foreground text-[8px]"></span>
                                            </div>
                                            <span class="truncate text-xs" :class="ch.skills[skill.name] !== undefined ? 'text-foreground' : 'text-muted-foreground'">{{ skill.name }}</span>
                                        </button>
                                        <div class="text-center text-[11px] text-muted-foreground font-mono uppercase">{{ skill.ability }}</div>
                                        <div class="text-center text-muted-foreground text-xs">{{ getAbilityMod(skill.ability) >= 0 ? '+' : '' }}{{ getAbilityMod(skill.ability) }}</div>
                                        <div class="flex justify-center">
                                            <input v-if="ch.skills[skill.name] !== undefined" :value="ch.skills[skill.name]" @input="(e) => setRank(skill.name, +(e.target as HTMLInputElement).value)" type="number" min="0" class="w-16 text-center text-xs bg-accent border border-border rounded px-1 py-1 text-primary font-bold focus:outline-none" />
                                            <span v-else class="text-muted-foreground/40 text-xs">—</span>
                                        </div>
                                        <div class="text-center text-xs font-bold" :class="ch.skills[skill.name] !== undefined ? 'text-primary' : 'text-muted-foreground/40'">
                                            <template v-if="ch.skills[skill.name] !== undefined">{{ getSkillTotal(skill.name, skill.ability) >= 0 ? '+' : '' }}{{ getSkillTotal(skill.name, skill.ability) }}</template>
                                            <template v-else>—</template>
                                        </div>
                                        <div class="text-center"><span v-if="isClassSkill(skill.name)" class="text-[9px] font-bold text-primary bg-primary/15 px-1 py-0.5 rounded">C</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- TALENTOS -->
                        <div v-show="activeTab === 'feats'" class="space-y-3">
                            <div class="flex justify-end">
                                <button @click="addFeat" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/20 border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/30 transition-colors"><Plus class="w-3 h-3" /> Adicionar</button>
                            </div>
                            <div v-if="!ch.feats?.length" class="text-center py-10 text-muted-foreground/60 text-sm border border-dashed border-border rounded-xl">Nenhum talento.</div>
                            <div v-for="(feat, i) in ch.feats" :key="i" class="bg-muted/50 border border-border rounded-xl p-4 space-y-2 group hover:border-border transition-colors">
                                <div class="flex gap-3 items-start">
                                    <div class="flex-1 space-y-2">
                                        <input v-model="feat.title" placeholder="Nome do talento" class="fi-input font-semibold" />
                                        <textarea v-model="feat.description" placeholder="Descrição..." rows="2" class="fi-input text-sm resize-none" />
                                        <div class="flex gap-2">
                                            <select v-model="feat.featType" class="fi-input text-xs flex-1"><option value="feat">Talento</option><option value="classFeat">Habilidade de Classe</option><option value="trait">Traço</option><option value="racial">Racial</option></select>
                                            <input v-model="feat.requirements" placeholder="Pré-requisitos..." class="fi-input text-xs flex-1" />
                                        </div>
                                    </div>
                                    <button @click="removeFeat(i)" class="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/60 hover:text-red-400 hover:bg-red-950/30 transition-colors opacity-0 group-hover:opacity-100"><Trash2 class="w-3.5 h-3.5" /></button>
                                </div>
                            </div>
                        </div>

                        <!-- EQUIPAMENTO -->
                        <div v-show="activeTab === 'equip'" class="space-y-3">
                            <div class="flex justify-end">
                                <button @click="addItem" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/20 border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/30 transition-colors"><Plus class="w-3 h-3" /> Adicionar Item</button>
                            </div>
                            <div v-if="!ch.equipment?.length" class="text-center py-10 text-muted-foreground/60 text-sm border border-dashed border-border rounded-xl">Nenhum item.</div>
                            <div v-for="(item, i) in ch.equipment" :key="i" class="bg-muted/50 border border-border rounded-xl p-4 group hover:border-border transition-colors">
                                <div class="flex gap-3 items-start">
                                    <div class="flex-1 space-y-2">
                                        <input v-model="item.title" placeholder="Nome do item" class="fi-input font-semibold" />
                                        <div class="grid grid-cols-3 gap-2">
                                            <div><label class="fi-label">Qtd</label><input v-model.number="item.quantity" type="number" min="1" class="fi-input" /></div>
                                            <div><label class="fi-label">Peso (kg)</label><input v-model.number="item.weight" type="number" min="0" class="fi-input" /></div>
                                            <div><label class="fi-label">Preço (po)</label><input v-model.number="item.price" type="number" min="0" class="fi-input" /></div>
                                        </div>
                                        <label class="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground"><input v-model="item.equipped" type="checkbox" class="rounded border-border bg-accent text-primary" /> Equipado</label>
                                    </div>
                                    <button @click="removeItem(i)" class="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/60 hover:text-red-400 hover:bg-red-950/30 transition-colors opacity-0 group-hover:opacity-100"><Trash2 class="w-3.5 h-3.5" /></button>
                                </div>
                            </div>
                        </div>

                        <!-- BIOGRAFIA -->
                        <div v-show="activeTab === 'bio'" class="space-y-3">
                            <textarea v-model="ch.bio" rows="10" placeholder="Biografia do personagem..." class="fi-input w-full resize-none text-sm leading-relaxed" />
                        </div>

                    </div><!-- /content -->
                </div>
            </div>
        </div>
    </Teleport>
</template>

<style scoped>
.fi-label {
    display: block;
    font-size: 0.625rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: rgb(113 113 122);
    margin-bottom: 0.3rem;
}
.fi-input {
    width: 100%;
    background: rgb(24 24 27);
    border: 1px solid rgb(63 63 70);
    border-radius: 0.5rem;
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
    color: rgb(228 228 231);
    transition: border-color 0.15s;
}
.fi-input:focus { outline: none; border-color: hsl(var(--primary)); }
.fi-input::placeholder { color: rgb(82 82 91); }
.fi-section-title {
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: rgb(161 161 170);
    margin-bottom: 0.75rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid rgb(39 39 42);
}
</style>
