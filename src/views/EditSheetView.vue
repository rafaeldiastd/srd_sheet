<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { SKILLS_DATA, CLASS_SKILLS, CLASS_SKILL_POINTS } from '@/data/dnd35'
import {
  CheckCircle, Search, Plus, Trash2, User, ChevronLeft, Loader2
} from 'lucide-vue-next'
import FoundryImportModal from '@/components/wizard/FoundryImportModal.vue'

const router = useRouter()
const route = useRoute()
const sheetId = route.params.id as string

const loading = ref(true)
const saving = ref(false)
const activeTab = ref('info')
const showFoundryModal = ref(false)

const TABS = [
  { id: 'info',    label: 'Identidade'  },
  { id: 'attrs',   label: 'Atributos'   },
  { id: 'combat',  label: 'Combate'     },
  { id: 'skills',  label: 'Perícias'    },
  { id: 'feats',   label: 'Talentos'    },
  { id: 'equip',   label: 'Equipamento' },
  { id: 'bio',     label: 'Biografia'   },
]

// ── editable character state ──────────────────────────────────────────────
const ch = ref<any>({
  name: '', race: '', class: '', level: 1, size: 'Médio',
  alignment: '', deity: '', age: '', gender: '', height: '', weight: '',
  eyes: '', hair: '', skin: '', xp: 0, bio: '',
  avatar_url: '', cover_url: '', token_url: '',
  hp_max: 0, hp_current: 0, bab: 0, speed: 9, initiative_misc: 0,
  save_fort: 0, save_ref: 0, save_will: 0,
  customHitDie: 8, customSkillPoints: null,
  ac: { armor: 0, shield: 0, natural: 0, deflection: 0, size: 0, misc: 0, dexMod: 0, total: 10, touch: 10, flatFooted: 10 },
  attributes: {
    str: { base: 10, temp: 0 }, dex: { base: 10, temp: 0 }, con: { base: 10, temp: 0 },
    int: { base: 10, temp: 0 }, wis: { base: 10, temp: 0 }, cha: { base: 10, temp: 0 },
  },
  skills: {}, feats: [], equipment: [], skillPoints: 0,
})


async function loadSheet() {
  loading.value = true
  const { data, error } = await supabase.from('sheets').select('*').eq('id', sheetId).maybeSingle()
  if (error || !data) { router.push('/dashboard'); return }
  const d = typeof data.data === 'string' ? JSON.parse(data.data) : data.data
  ch.value = {
    // Meta columns
    name:  data.name  ?? '',
    race:  data.race  ?? '',
    class: data.class ?? '',
    level: data.level ?? 1,
    // Data fields
    size:            d.size            ?? 'Médio',
    alignment:       d.alignment       ?? '',
    deity:           d.deity           ?? '',
    age:             d.age             ?? '',
    gender:          d.gender          ?? '',
    height:          d.height          ?? '',
    weight:          d.weight_char     ?? d.weight ?? '',
    eyes:            d.eyes            ?? '',
    hair:            d.hair            ?? '',
    skin:            d.skin            ?? '',
    xp:              d.xp              ?? 0,
    bio:             d.bio             ?? '',
    avatar_url:      d.avatar_url      ?? '',
    cover_url:       d.cover_url       ?? '',
    token_url:       d.token_url       ?? '',
    hp_max:          d.hp_max          ?? 0,
    hp_current:      d.hp_current      ?? d.hp_max ?? 0,
    bab:             d.bab             ?? 0,
    speed:           d.speed           ?? 9,
    initiative_misc: d.initiative_misc ?? 0,
    save_fort:       d.save_fort       ?? 0,
    save_ref:        d.save_ref        ?? 0,
    save_will:       d.save_will       ?? 0,
    customHitDie:    d.customHitDie    ?? 8,
    customSkillPoints: d.customSkillPoints ?? null,
    skillPoints:     d.skillPoints     ?? 0,
    ac:              d.ac              ?? { armor: 0, shield: 0, natural: 0, deflection: 0, size: 0, misc: 0, dexMod: 0, total: 10, touch: 10, flatFooted: 10 },
    attributes:      d.attributes      ?? {
      str: { base: 10, temp: 0 }, dex: { base: 10, temp: 0 }, con: { base: 10, temp: 0 },
      int: { base: 10, temp: 0 }, wis: { base: 10, temp: 0 }, cha: { base: 10, temp: 0 },
    },
    skills:    d.skills    ?? {},
    feats:     d.feats     ?? [],
    equipment: d.equipment ?? [],
    // preserve dynamic fields
    buffs:     d.buffs     ?? [],
    resources: d.resources ?? [],
    shortcuts: d.shortcuts ?? [],
    bonuses:   d.bonuses,
    conditions: d.conditions,
  }
  loading.value = false
}

onMounted(loadSheet)

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

// ── Sistema de Rolagem ─────────────────────────────────────────────────────
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
const poolSum = computed(() => rollPool.value.reduce((s, r) => s + r.total, 0))
const allAssigned = computed(() => rollPool.value.length === 6 && ATTR_KEYS.every(k => attrAssignment.value[k] !== null))
function isRollUsed(id: number) { return Object.values(attrAssignment.value).includes(id) }
function selectRoll(id: number) { selectedRollId.value = selectedRollId.value === id ? null : id }
function assignToAttr(key: string) {
  if (!selectedRoll.value) return
  for (const k of ATTR_KEYS) { if (attrAssignment.value[k] === selectedRoll.value.id) attrAssignment.value[k] = null }
  const prev = attrAssignment.value[key]
  if (prev === selectedRoll.value.id) { attrAssignment.value[key] = null; selectedRollId.value = null; return }
  attrAssignment.value[key] = selectedRoll.value.id
  ch.value.attributes[key].base = selectedRoll.value.total
  selectedRollId.value = null
}
function unassign(key: string) { attrAssignment.value[key] = null; ch.value.attributes[key].base = 10 }

// ── Perícias ───────────────────────────────────────────────────────────────
const skillSearch = ref('')
const showOnlySelected = ref(false)
const intMod = computed(() => Math.floor((ch.value.attributes.int.base - 10) / 2))
const isHuman = computed(() => ch.value.race?.toLowerCase().includes('human') || ch.value.race?.toLowerCase().includes('humano'))
const classSkillList = computed(() => CLASS_SKILLS[ch.value.class] || [])
function isClassSkill(name: string) {
  if (ch.value.class === 'Personalizada') return true
  if (classSkillList.value.includes(name)) return true
  if (name.startsWith('Conhecimento') && classSkillList.value.includes('Conhecimento (Todos)')) return true
  if (ch.value.class === 'Bardo' && name.startsWith('Conhecimento')) return true
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
function setRank(n: string, v: number) { ch.value.skills = { ...ch.value.skills, [n]: Math.max(0, v || 0) } }

// ── Talentos / Itens ───────────────────────────────────────────────────────
function addFeat() { ch.value.feats.push({ title: '', description: '', featType: 'feat' }) }
function removeFeat(i: number | string) { ch.value.feats.splice(Number(i), 1) }
function addItem() { ch.value.equipment.push({ title: '', description: '', equipped: false, weight: 0, price: 0, quantity: 1 }) }
function removeItem(i: number | string) { ch.value.equipment.splice(Number(i), 1) }

// ── Foundry Import ─────────────────────────────────────────────────────────
function handleFoundryImport(data: any) {
  // Merge imported data
  Object.assign(ch.value, data)
  showFoundryModal.value = false
}

// ── Constantes ─────────────────────────────────────────────────────────────
const SIZES = ['Mínimo', 'Diminuto', 'Miúdo', 'Pequeno', 'Médio', 'Grande', 'Enorme', 'Imenso', 'Colossal']
const ALIGNMENTS = ['Leal e Bom', 'Neutro e Bom', 'Caótico e Bom', 'Leal e Neutro', 'Neutro', 'Caótico e Neutro', 'Leal e Mau', 'Neutro e Mau', 'Caótico e Mau']

// ── Save ───────────────────────────────────────────────────────────────────
async function handleSave() {
  if (!ch.value.name?.trim()) { alert('Nome obrigatório.'); activeTab.value = 'info'; return }
  saving.value = true
  const { name, race, class: cls, level, weight, ...rest } = ch.value
  const dataPayload = {
    ...rest,
    weight_char: weight,
  }
  const { error } = await supabase.from('sheets').update({
    name, race, class: cls, level,
    data: dataPayload,
  }).eq('id', sheetId)
  saving.value = false
  if (error) { alert('Erro ao salvar: ' + error.message); return }
  router.push(`/sheet/${sheetId}`)
}
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">

    <!-- ── TOP BAR ──────────────────────────────────────────────────────── -->
    <div class="sticky top-0 z-40 bg-card/90 backdrop-blur-md border-b border-border px-4 py-3">
      <div class="max-w-5xl mx-auto flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <button @click="router.push(`/sheet/${sheetId}`)"
            class="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground/80 transition-colors mr-1">
            <ChevronLeft class="w-4 h-4" />
          </button>
          <div class="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
            <img v-if="ch.avatar_url" :src="ch.avatar_url" class="w-full h-full object-cover" />
            <User v-else class="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 class="text-base font-serif font-bold text-white leading-tight">
              {{ ch.name || 'Editar Personagem' }}
            </h1>
            <p class="text-[11px] text-muted-foreground leading-tight">
              {{ [ch.race, ch.class, ch.level ? `Nível ${ch.level}` : ''].filter(Boolean).join(' · ') || 'Editar Ficha' }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button @click="router.push(`/sheet/${sheetId}`)"
            class="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-red-400 text-xs transition-colors">
            Cancelar
          </button>
          <button @click="handleSave" :disabled="saving"
            class="btn-primary flex items-center gap-1.5 px-4 py-1.5 text-xs">
            <CheckCircle class="w-3.5 h-3.5" />
            {{ saving ? 'Salvando...' : 'Salvar Ficha' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── Loading ──────────────────────────────────────────────────────── -->
    <div v-if="loading" class="flex items-center justify-center py-28">
      <div class="flex flex-col items-center gap-3 text-muted-foreground/60">
        <Loader2 class="w-8 h-8 animate-spin" />
        <span class="text-sm">Carregando ficha...</span>
      </div>
    </div>

    <div v-else class="max-w-5xl mx-auto px-4 py-6">

      <!-- ── TABS ──────────────────────────────────────────────────────── -->
      <div class="flex gap-1 bg-muted/50 rounded-xl p-1 border border-border mb-6 overflow-x-auto">
        <button v-for="tab in TABS" :key="tab.id" @click="activeTab = tab.id"
          class="flex-1 min-w-fit flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
          :class="activeTab === tab.id ? 'bg-accent text-white shadow-sm' : 'text-muted-foreground hover:text-foreground/80'">
          {{ tab.label }}
        </button>
      </div>

      <!-- ══ IDENTIDADE ══════════════════════════════════════════════════ -->
      <div v-show="activeTab === 'info'" class="space-y-6">

        <!-- Imagens -->
        <div>
          <h3 class="section-title">Imagens do Personagem</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Avatar -->
            <div class="space-y-2">
              <label class="form-label">Avatar</label>
              <div class="flex items-center gap-4">
                <div class="w-16 h-16 shrink-0 rounded-xl border-2 border-border bg-muted overflow-hidden relative">
                  <img v-if="ch.avatar_url" :src="ch.avatar_url" class="w-full h-full object-cover" />
                  <div v-else class="w-full h-full flex items-center justify-center text-muted-foreground/40"><User class="w-6 h-6" /></div>
                </div>
                <div class="flex-1 space-y-1">
                  <input v-model="ch.avatar_url" class="form-input text-xs" placeholder="https://..." />
                  <p class="text-[10px] text-muted-foreground/60 leading-tight">Aparece no cabeçalho e no chat</p>
                </div>
              </div>
            </div>
            <!-- Capa -->
            <div class="space-y-2">
              <label class="form-label">Imagem de Capa</label>
              <div class="flex items-center gap-4">
                <div class="w-24 h-16 shrink-0 rounded-xl border-2 border-border bg-muted overflow-hidden relative">
                  <img v-if="ch.cover_url" :src="ch.cover_url" class="w-full h-full object-cover" />
                  <div v-else class="w-full h-full flex items-center justify-center text-muted-foreground/40 text-[10px]">Capa</div>
                </div>
                <div class="flex-1 space-y-1">
                  <input v-model="ch.cover_url" class="form-input text-xs" placeholder="https://..." />
                  <p class="text-[10px] text-muted-foreground/60 leading-tight">Exibida como fundo do cabeçalho da ficha</p>
                </div>
              </div>
            </div>
            <!-- Token -->
            <div class="space-y-2">
              <label class="form-label">Token</label>
              <div class="flex items-center gap-4">
                <div class="w-16 h-16 shrink-0 rounded-full border-2 border-border bg-muted overflow-hidden relative">
                  <img v-if="ch.token_url" :src="ch.token_url" class="w-full h-full object-cover" />
                  <div v-else class="w-full h-full flex items-center justify-center text-muted-foreground/40 text-[10px]">Token</div>
                </div>
                <div class="flex-1 space-y-1">
                  <input v-model="ch.token_url" class="form-input text-xs" placeholder="https://..." />
                  <p class="text-[10px] text-muted-foreground/60 leading-tight">Imagem circular usada no mapa</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Dados básicos -->
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div class="col-span-2 md:col-span-1">
            <label class="form-label">Nome <span class="text-red-400">*</span></label>
            <input v-model="ch.name" class="form-input" placeholder="Nome do personagem" />
          </div>
          <div><label class="form-label">Raça</label><input v-model="ch.race" class="form-input" /></div>
          <div><label class="form-label">Classe</label><input v-model="ch.class" class="form-input" /></div>
          <div><label class="form-label">Nível</label><input v-model.number="ch.level" type="number" min="1" max="40" class="form-input" /></div>
          <div>
            <label class="form-label">Tamanho</label>
            <select v-model="ch.size" class="form-input">
              <option v-for="s in SIZES" :key="s">{{ s }}</option>
            </select>
          </div>
          <div>
            <label class="form-label">Tendência</label>
            <select v-model="ch.alignment" class="form-input">
              <option value="">— Selecione —</option>
              <option v-for="a in ALIGNMENTS" :key="a">{{ a }}</option>
            </select>
          </div>
          <div><label class="form-label">Divindade</label><input v-model="ch.deity" class="form-input" /></div>
          <div><label class="form-label">Idade</label><input v-model="ch.age" class="form-input" /></div>
          <div><label class="form-label">Gênero</label><input v-model="ch.gender" class="form-input" /></div>
          <div><label class="form-label">Altura</label><input v-model="ch.height" class="form-input" /></div>
          <div><label class="form-label">Peso</label><input v-model="ch.weight" class="form-input" /></div>
          <div><label class="form-label">Olhos</label><input v-model="ch.eyes" class="form-input" /></div>
          <div><label class="form-label">Cabelo</label><input v-model="ch.hair" class="form-input" /></div>
          <div><label class="form-label">Pele</label><input v-model="ch.skin" class="form-input" /></div>
          <div><label class="form-label">Experiência (XP)</label><input v-model.number="ch.xp" type="number" min="0" class="form-input" /></div>
        </div>
      </div>

      <!-- ══ ATRIBUTOS ══════════════════════════════════════════════════ -->
      <div v-show="activeTab === 'attrs'" class="space-y-5">
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <div v-for="key in ATTR_KEYS" :key="key"
            @click="assignToAttr(key)"
            class="flex flex-col items-center gap-2 p-4 rounded-xl border transition-all"
            :class="[
              selectedRoll
                ? 'cursor-pointer border-amber-600/60 bg-amber-950/20 hover:bg-amber-900/30 hover:border-amber-500'
                : 'cursor-default border-border bg-muted/50 hover:border-border',
              attrAssignment[key] !== null ? 'ring-2 ring-primary/40' : ''
            ]">
            <span class="text-[10px] font-bold uppercase tracking-widest"
              :class="attrAssignment[key] !== null ? 'text-primary' : 'text-muted-foreground'">
              {{ ATTR_LABELS[key] }}
            </span>
            <input v-model.number="ch.attributes[key].base" type="number" min="1" max="40" @click.stop
              class="w-full text-center text-2xl font-bold bg-transparent border-b focus:outline-none text-white py-1 transition-colors"
              :class="attrAssignment[key] !== null ? 'border-primary text-primary' : 'border-border focus:border-primary'" />
            <div class="text-sm font-bold px-3 py-0.5 rounded-full transition-all"
              :class="Math.floor((ch.attributes[key].base - 10) / 2) >= 0 ? 'bg-primary/20 text-primary' : 'bg-red-950/50 text-red-400'">
              {{ attrMod(ch.attributes[key].base) }}
            </div>
            <div v-if="attrAssignment[key] !== null" class="flex items-center gap-1">
              <span class="text-[10px] bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-full font-bold">
                {{ rollPool.find(r => r.id === attrAssignment[key])?.total }}
              </span>
              <button @click.stop="unassign(key)" class="text-muted-foreground hover:text-red-400 text-[10px] font-bold">×</button>
            </div>
            <div v-else-if="selectedRoll" class="text-[10px] text-amber-400 font-bold animate-pulse">← aplicar {{ selectedRoll.total }}</div>
            <div class="w-full">
              <label class="text-[10px] text-muted-foreground/60 text-center block mb-0.5">Temp</label>
              <input v-model.number="ch.attributes[key].temp" type="number" min="0" @click.stop
                class="w-full text-center text-sm bg-accent/50 border border-border rounded focus:outline-none focus:border-primary text-foreground/80 px-2 py-1" />
            </div>
          </div>
        </div>

        <!-- Pool de dados -->
        <div class="border border-border rounded-xl overflow-hidden">
          <div class="flex items-center justify-between px-4 py-3 bg-muted/80 border-b border-border">
            <div class="flex items-center gap-3">
              <span class="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pool de Rolagem (4d6 drop lowest)</span>
              <span v-if="rollPool.length > 0" class="text-[11px] text-muted-foreground/60">
                Soma: <strong class="text-muted-foreground">{{ poolSum }}</strong>
                <span v-if="allAssigned" class="text-primary font-bold ml-2"> Todos atribuídos!</span>
              </span>
            </div>
            <button @click="rollPool6" :disabled="isRolling"
              class="btn-secondary flex items-center gap-2 text-xs px-4 py-2 disabled:opacity-50">
              <span :class="{ 'inline-block animate-bounce': isRolling }"></span>
              {{ isRolling ? 'Rolando...' : rollPool.length ? 'Rolar Novamente' : 'Rolar 6 Atributos' }}
            </button>
          </div>
          <div v-if="rollPool.length > 0 && !selectedRoll" class="px-4 py-2 bg-card/50 text-[11px] text-muted-foreground border-b border-border">
            Selecione um valor do pool e clique no atributo para aplicar.
          </div>
          <div v-else-if="selectedRoll" class="px-4 py-2 bg-amber-950/30 border-b border-amber-800/40 text-[11px] text-amber-300 font-semibold">
             Valor <strong>{{ selectedRoll.total }}</strong> selecionado — clique no atributo desejado.
          </div>
          <div v-if="isRolling" class="p-4 grid grid-cols-6 gap-3">
            <div v-for="(anim, ai) in rollAnimDice" :key="ai" class="flex flex-col items-center gap-2 p-3 bg-accent/60 rounded-lg border border-border/50">
              <div class="flex flex-wrap justify-center gap-1">
                <div v-for="(fv, di) in anim" :key="di" class="w-6 h-6 rounded bg-amber-900/60 border border-amber-700/50 flex items-center justify-center text-[10px] font-bold text-amber-300">{{ fv }}</div>
              </div>
              <div class="text-base font-bold text-muted-foreground">―</div>
            </div>
          </div>
          <div v-else-if="rollPool.length > 0" class="p-4 grid grid-cols-3 sm:grid-cols-6 gap-3">
            <button v-for="roll in rollPool" :key="roll.id" @click="isRollUsed(roll.id) ? null : selectRoll(roll.id)"
              class="flex flex-col items-center gap-2 p-3 rounded-lg border transition-all"
              :class="[
                selectedRollId === roll.id ? 'bg-amber-900/50 border-amber-500 scale-105' :
                isRollUsed(roll.id) ? 'bg-muted/30 border-border/50 opacity-40 cursor-not-allowed' :
                'bg-accent/40 border-border hover:border-amber-600/60 hover:bg-amber-950/30 cursor-pointer'
              ]">
              <div class="flex flex-wrap justify-center gap-1">
                <div v-for="(fv, di) in roll.dice" :key="di"
                  class="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold"
                  :class="di === roll.dropped ? 'bg-accent text-muted-foreground/60' : selectedRollId === roll.id ? 'bg-amber-700/70 border border-amber-500/60 text-amber-200' : 'bg-accent/70 border border-border/50 text-foreground/80'">
                  {{ fv }}
                </div>
              </div>
              <div class="text-xl font-bold" :class="selectedRollId === roll.id ? 'text-amber-300' : isRollUsed(roll.id) ? 'text-muted-foreground/60' : 'text-white'">{{ roll.total }}</div>
              <div v-if="isRollUsed(roll.id)" class="text-[9px] font-bold text-primary">{{ Object.entries(attrAssignment).find(([,v]) => v === roll.id)?.[0]?.toUpperCase() }}</div>
            </button>
          </div>
          <div v-else class="p-8 text-center text-muted-foreground/60 text-sm">
            Clique em <strong class="text-muted-foreground"> Rolar 6 Atributos</strong> para gerar e distribuir entre os atributos.
          </div>
        </div>
        <p class="text-[11px] text-muted-foreground/60"> 4d6 drop lowest · Edite qualquer valor manualmente · Clique × para remover a atribuição</p>
      </div>

      <!-- ══ COMBATE ══════════════════════════════════════════════════════ -->
      <div v-show="activeTab === 'combat'" class="space-y-6">
        <div>
          <h3 class="section-title">Pontos de Vida & Combate</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><label class="form-label">PV Máximos</label><input v-model.number="ch.hp_max" type="number" min="1" class="form-input form-input-lg" /></div>
            <div><label class="form-label">BBA</label><input v-model.number="ch.bab" type="number" min="0" class="form-input" /></div>
            <div><label class="form-label">Deslocamento (m)</label><input v-model.number="ch.speed" type="number" min="0" class="form-input" /></div>
            <div><label class="form-label">Iniciativa (misc)</label><input v-model.number="ch.initiative_misc" type="number" class="form-input" /></div>
          </div>
        </div>
        <div>
          <h3 class="section-title">Testes de Resistência</h3>
          <div class="grid grid-cols-3 gap-4">
            <div class="p-4 bg-muted/50 border border-border rounded-xl text-center"><label class="form-label text-center block">Fortitude</label><input v-model.number="ch.save_fort" type="number" class="form-input text-center text-xl font-bold text-primary" /></div>
            <div class="p-4 bg-muted/50 border border-border rounded-xl text-center"><label class="form-label text-center block">Reflexos</label><input v-model.number="ch.save_ref" type="number" class="form-input text-center text-xl font-bold text-primary" /></div>
            <div class="p-4 bg-muted/50 border border-border rounded-xl text-center"><label class="form-label text-center block">Vontade</label><input v-model.number="ch.save_will" type="number" class="form-input text-center text-xl font-bold text-primary" /></div>
          </div>
        </div>
        <div>
          <h3 class="section-title">Classe de Armadura (CA)</h3>
          <div class="grid grid-cols-3 md:grid-cols-5 gap-3">
            <div class="md:col-span-1 p-4 bg-primary/10 border border-primary/30 rounded-xl text-center"><label class="form-label text-center block text-primary">Total</label><input v-model.number="ch.ac.total" type="number" class="form-input text-center text-2xl font-bold text-primary bg-transparent border-none focus:outline-none" /></div>
            <div class="p-3 bg-muted/50 border border-border rounded-xl text-center"><label class="form-label text-center block">Contato</label><input v-model.number="ch.ac.touch" type="number" class="form-input text-center font-bold" /></div>
            <div class="p-3 bg-muted/50 border border-border rounded-xl text-center"><label class="form-label text-center block">Surpreso</label><input v-model.number="ch.ac.flatFooted" type="number" class="form-input text-center font-bold" /></div>
            <div class="p-3 bg-muted/50 border border-border rounded-xl text-center"><label class="form-label text-center block">Armadura</label><input v-model.number="ch.ac.armor" type="number" class="form-input text-center" /></div>
            <div class="p-3 bg-muted/50 border border-border rounded-xl text-center"><label class="form-label text-center block">Escudo</label><input v-model.number="ch.ac.shield" type="number" class="form-input text-center" /></div>
            <div class="p-3 bg-muted/50 border border-border rounded-xl text-center"><label class="form-label text-center block">Natural</label><input v-model.number="ch.ac.natural" type="number" class="form-input text-center" /></div>
            <div class="p-3 bg-muted/50 border border-border rounded-xl text-center"><label class="form-label text-center block">Deflexão</label><input v-model.number="ch.ac.deflection" type="number" class="form-input text-center" /></div>
            <div class="p-3 bg-muted/50 border border-border rounded-xl text-center"><label class="form-label text-center block">Misc</label><input v-model.number="ch.ac.misc" type="number" class="form-input text-center" /></div>
          </div>
        </div>
        <div>
          <h3 class="section-title">Classe Personalizada</h3>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="form-label">Dado de Vida (DV)</label><select v-model.number="ch.customHitDie" class="form-input"><option v-for="d in [4,6,8,10,12]" :key="d" :value="d">d{{ d }}</option></select></div>
            <div><label class="form-label">Pontos de Perícia/Nível</label><input v-model.number="ch.customSkillPoints" type="number" min="1" max="12" class="form-input" /></div>
          </div>
        </div>
      </div>

      <!-- ══ PERÍCIAS ════════════════════════════════════════════════════ -->
      <div v-show="activeTab === 'skills'" class="space-y-4">
        <div class="grid grid-cols-3 gap-3 p-4 bg-muted/50 border border-border rounded-xl text-center">
          <div><p class="text-[10px] text-muted-foreground uppercase font-bold mb-1">Total de Pontos</p><div class="flex flex-col items-center gap-1"><input v-model.number="ch.skillPoints" type="number" class="w-20 text-center text-xl font-bold bg-transparent text-white border-b border-border focus:outline-none focus:border-primary" /><span class="text-[10px] text-muted-foreground/60">Sugerido: {{ calcSkillPoints }}</span></div></div>
          <div><p class="text-[10px] text-muted-foreground uppercase font-bold mb-1">Distribuídos</p><p class="text-2xl font-bold text-foreground/80">{{ usedPoints }}</p></div>
          <div><p class="text-[10px] text-muted-foreground uppercase font-bold mb-1">Restantes</p><p class="text-2xl font-bold" :class="remainingPoints < 0 ? 'text-red-400' : 'text-primary'">{{ remainingPoints }}</p></div>
        </div>
        <div class="flex gap-2">
          <div class="relative flex-1"><Search class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" /><input v-model="skillSearch" placeholder="Buscar perícia..." class="form-input pl-8 py-1.5 text-sm" /></div>
          <button @click="showOnlySelected = !showOnlySelected" class="px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors" :class="showOnlySelected ? 'border-primary bg-primary/20 text-primary' : 'border-border text-muted-foreground hover:border-muted-foreground'">Só selecionadas</button>
        </div>
        <div class="border border-border rounded-xl overflow-hidden">
          <div class="grid grid-cols-[1fr_48px_48px_80px_56px_40px] px-3 py-2 bg-accent/60 text-[10px] font-bold uppercase text-muted-foreground gap-2">
            <div>Perícia</div><div class="text-center">Hab</div><div class="text-center">Mod</div><div class="text-center">Ranks</div><div class="text-center">Total</div><div class="text-center">Cls</div>
          </div>
          <div class="divide-y divide-border/50 max-h-[500px] overflow-y-auto">
            <div v-for="skill in filteredSkills" :key="skill.name"
              class="grid grid-cols-[1fr_48px_48px_80px_56px_40px] px-3 py-2 items-center gap-2 text-sm transition-colors hover:bg-accent/30"
              :class="[ch.skills[skill.name] !== undefined ? 'bg-primary/5' : '', isClassSkill(skill.name) ? 'border-l-2 border-primary/30' : '']">
              <button @click="toggleSkill(skill.name)" class="flex items-center gap-2 text-left">
                <div class="w-3 h-3 rounded border flex items-center justify-center shrink-0 transition-colors" :class="ch.skills[skill.name] !== undefined ? 'bg-primary border-primary' : 'border-border'">
                  <span v-if="ch.skills[skill.name] !== undefined" class="text-primary-foreground text-[8px]"></span>
                </div>
                <span class="truncate text-xs" :class="ch.skills[skill.name] !== undefined ? 'text-foreground' : 'text-muted-foreground'">{{ skill.name }}</span>
              </button>
              <div class="text-center text-[11px] text-muted-foreground font-mono uppercase">{{ skill.ability }}</div>
              <div class="text-center text-muted-foreground text-xs">{{ getAbilityMod(skill.ability) >= 0 ? '+' : '' }}{{ getAbilityMod(skill.ability) }}</div>
              <div class="flex justify-center">
                <input v-if="ch.skills[skill.name] !== undefined" :value="ch.skills[skill.name]"
                  @input="(e) => setRank(skill.name, +(e.target as HTMLInputElement).value)"
                  type="number" min="0" class="w-16 text-center text-xs bg-accent border border-border rounded px-1 py-1 text-primary font-bold focus:outline-none" />
                <span v-else class="text-muted-foreground/40 text-xs">—</span>
              </div>
              <div class="text-center text-xs font-bold tabular-nums" :class="ch.skills[skill.name] !== undefined ? 'text-primary' : 'text-muted-foreground/40'">
                <template v-if="ch.skills[skill.name] !== undefined">{{ getSkillTotal(skill.name, skill.ability) >= 0 ? '+' : '' }}{{ getSkillTotal(skill.name, skill.ability) }}</template>
                <template v-else>—</template>
              </div>
              <div class="text-center"><span v-if="isClassSkill(skill.name)" class="text-[9px] font-bold text-primary bg-primary/15 px-1 py-0.5 rounded">C</span></div>
            </div>
          </div>
        </div>
      </div>

      <!-- ══ TALENTOS ════════════════════════════════════════════════════ -->
      <div v-show="activeTab === 'feats'" class="space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="section-title mb-0">Talentos <span class="text-muted-foreground/60 font-normal text-sm ml-1">{{ ch.feats.length }}</span></h3>
          <button @click="addFeat" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/20 border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/30 transition-colors"><Plus class="w-3 h-3" /> Adicionar</button>
        </div>
        <div v-if="ch.feats.length === 0" class="text-center py-12 text-muted-foreground/60 text-sm border border-dashed border-border rounded-xl">Nenhum talento ainda.</div>
        <div v-for="(feat, i) in ch.feats" :key="i" class="bg-muted/50 border border-border rounded-xl p-4 space-y-3 group hover:border-border transition-colors">
          <div class="flex items-start gap-3">
            <div class="flex-1 space-y-2">
              <input v-model="feat.title" placeholder="Nome do talento" class="form-input font-semibold" />
              <textarea v-model="feat.description" placeholder="Descrição..." rows="2" class="form-input text-sm resize-none" />
              <div class="flex gap-2">
                <select v-model="feat.featType" class="form-input text-xs flex-1"><option value="feat">Talento</option><option value="classFeat">Habilidade de Classe</option><option value="trait">Traço</option><option value="racial">Racial</option></select>
                <input v-model="feat.requirements" placeholder="Pré-requisitos..." class="form-input text-xs flex-1" />
              </div>
            </div>
            <button @click="removeFeat(i)" class="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/60 hover:text-red-400 hover:bg-red-950/30 transition-colors opacity-0 group-hover:opacity-100"><Trash2 class="w-3.5 h-3.5" /></button>
          </div>
        </div>
      </div>

      <!-- ══ EQUIPAMENTO ════════════════════════════════════════════════ -->
      <div v-show="activeTab === 'equip'" class="space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="section-title mb-0">Itens <span class="text-muted-foreground/60 font-normal text-sm ml-1">{{ ch.equipment.length }}</span></h3>
          <button @click="addItem" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/20 border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/30 transition-colors"><Plus class="w-3 h-3" /> Adicionar Item</button>
        </div>
        <div v-if="ch.equipment.length === 0" class="text-center py-12 text-muted-foreground/60 text-sm border border-dashed border-border rounded-xl">Nenhum item ainda.</div>
        <div v-for="(item, i) in ch.equipment" :key="i" class="bg-muted/50 border border-border rounded-xl p-4 group hover:border-border transition-colors">
          <div class="flex items-start gap-3">
            <div class="flex-1 space-y-2">
              <input v-model="item.title" placeholder="Nome do item" class="form-input font-semibold" />
              <div class="grid grid-cols-3 gap-2">
                <div><label class="form-label">Qtd</label><input v-model.number="item.quantity" type="number" min="1" class="form-input" /></div>
                <div><label class="form-label">Peso (kg)</label><input v-model.number="item.weight" type="number" min="0" class="form-input" /></div>
                <div><label class="form-label">Preço (po)</label><input v-model.number="item.price" type="number" min="0" class="form-input" /></div>
              </div>
              <div class="flex items-center gap-3">
                <label class="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground"><input v-model="item.equipped" type="checkbox" class="rounded border-border bg-accent text-primary" /> Equipado</label>
                <input v-model="item.description" placeholder="Notas..." class="form-input text-xs flex-1" />
              </div>
            </div>
            <button @click="removeItem(i)" class="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/60 hover:text-red-400 hover:bg-red-950/30 transition-colors opacity-0 group-hover:opacity-100"><Trash2 class="w-3.5 h-3.5" /></button>
          </div>
        </div>
        <div v-if="ch.equipment.length > 0" class="text-right text-xs text-muted-foreground pt-2">
          Peso total: <span class="font-bold text-foreground/80">{{ ch.equipment.reduce((s: number, e: any) => s + (e.weight || 0) * (e.quantity || 1), 0).toFixed(1) }} kg</span>
        </div>
      </div>

      <!-- ══ BIOGRAFIA ═══════════════════════════════════════════════════ -->
      <div v-show="activeTab === 'bio'" class="space-y-4">
        <div>
          <label class="form-label">Biografia / Histórico</label>
          <textarea v-model="ch.bio" rows="12" placeholder="Descreva a história, personalidade e motivações do seu personagem..." class="form-input resize-none text-sm leading-relaxed" />
        </div>
      </div>

    </div><!-- /max-w -->

    <FoundryImportModal
      v-if="showFoundryModal"
      @close="showFoundryModal = false"
      @import="handleFoundryImport"
    />
  </div>
</template>

<style scoped>
.form-label {
  display: block;
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.075em;
  text-transform: uppercase;
  color: rgb(113 113 122);
  margin-bottom: 0.375rem;
}
.form-input {
  width: 100%;
  background-color: rgb(24 24 27);
  border: 1px solid rgb(63 63 70);
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: rgb(228 228 231);
  transition: border-color 0.15s;
}
.form-input:focus { outline: none; border-color: hsl(var(--primary)); }
.form-input::placeholder { color: rgb(82 82 91); }
.form-input-lg { font-size: 1.125rem; font-weight: 700; text-align: center; }
.section-title {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgb(161 161 170);
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgb(39 39 42);
}
</style>
