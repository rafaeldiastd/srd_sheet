<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useWizardStore } from '@/stores/wizardStore'
import { supabase } from '@/lib/supabase'
import { SKILLS_DATA, CLASS_SKILLS, CLASS_SKILL_POINTS } from '@/data/dnd35'
import type { CharacterAttributes } from '@/stores/wizardStore'
import {
  Upload, CheckCircle, Search, Plus, Trash2, User
} from 'lucide-vue-next'
import FoundryImportModal from '@/components/wizard/FoundryImportModal.vue'

const store = useWizardStore()
const router = useRouter()
const route = useRoute()

const showFoundryModal = ref(false)
const saving = ref(false)
const activeTab = ref('info')

const TABS = [
  { id: 'info',    label: 'Identidade',  icon: 'User'    },
  { id: 'attrs',   label: 'Atributos',   icon: 'Star'    },
  { id: 'combat',  label: 'Combate',     icon: 'Sword'   },
  { id: 'skills',  label: 'Perícias',    icon: 'Book'    },
  { id: 'feats',   label: 'Talentos',    icon: 'Shield'  },
  { id: 'equip',   label: 'Equipamento', icon: 'Package' },
  { id: 'bio',     label: 'Biografia',   icon: 'Scroll'  },
]

const ch = computed(() => store.character)

// ── Atributos ──────────────────────────────────────────────────────────────
const ATTR_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha']
const ATTR_LABELS: Record<string, string> = {
  str: 'Força', dex: 'Destreza', con: 'Constituição',
  int: 'Inteligência', wis: 'Sabedoria', cha: 'Carisma'
}
function attrMod(base: number) {
  const mod = Math.floor((base - 10) / 2)
  return (mod >= 0 ? '+' : '') + mod
}

// ── Sistema de Rolagem — Pool de 6 valores ─────────────────────────────
interface DiceRoll {
  id: number         // identificador único
  dice: number[]     // 4 dados rolados
  dropped: number    // índice do descartado
  total: number
  assignedTo: string | null  // chave do atributo ou null
}

const rollPool = ref<DiceRoll[]>([])  // pool de 6 valores
const selectedRollId = ref<number | null>(null)  // roll selecionado para atribuir
const isRolling = ref(false)
const rollAnimDice = ref<number[][]>([])  // valores animados durante rolagem
let rollIdCounter = 0

function d6() { return Math.floor(Math.random() * 6) + 1 }

function makeRoll(): DiceRoll {
  const dice = [d6(), d6(), d6(), d6()]
  const min = Math.min(...dice)
  const dropped = dice.indexOf(min)
  const total = dice.reduce((s, v) => s + v, 0) - min
  return { id: rollIdCounter++, dice, dropped, total, assignedTo: null }
}

async function rollPool6() {
  isRolling.value = true
  selectedRollId.value = null
  // Limpa atribuições anteriores ao rerolar
  rollPool.value = []
  rollAnimDice.value = Array.from({ length: 6 }, () => [d6(), d6(), d6(), d6()])

  const start = Date.now()
  while (Date.now() - start < 700) {
    rollAnimDice.value = Array.from({ length: 6 }, () => [d6(), d6(), d6(), d6()])
    await new Promise(r => setTimeout(r, 60))
  }

  // Resultado final
  rollPool.value = Array.from({ length: 6 }, makeRoll)
  rollAnimDice.value = []
  isRolling.value = false
}

// Mapa: atributo -> id do roll atribuído
const attrAssignment = ref<Record<string, number | null>>(
  Object.fromEntries(ATTR_KEYS.map(k => [k, null]))
)

const selectedRoll = computed(() =>
  rollPool.value.find(r => r.id === selectedRollId.value) ?? null
)

function isRollUsed(rollId: number): boolean {
  return Object.values(attrAssignment.value).includes(rollId)
}

function selectRoll(rollId: number) {
  // toggle
  selectedRollId.value = selectedRollId.value === rollId ? null : rollId
}

function assignToAttr(key: string) {
  if (!selectedRoll.value) return

  // Se já havia um roll atribuído a este atributo, libera-o
  const prev = attrAssignment.value[key]
  if (prev !== null) {
    // nada a fazer, apenas sobrescreve
  }

  // Desatribui o roll selecionado de qualquer outro atributo
  for (const k of ATTR_KEYS) {
    if (attrAssignment.value[k] === selectedRoll.value!.id) {
      attrAssignment.value[k] = null
    }
  }

  // Se clicou no mesmo atributo que já está com esse roll → desatribui
  if (prev === selectedRoll.value!.id) {
    attrAssignment.value[key] = null
    selectedRollId.value = null
    return
  }

  attrAssignment.value[key] = selectedRoll.value!.id
  // Aplica ao store
  ch.value.attributes[key as keyof typeof ch.value.attributes].base = selectedRoll.value!.total
  selectedRollId.value = null
}

function unassign(key: string) {
  attrAssignment.value[key] = null
  ch.value.attributes[key as keyof typeof ch.value.attributes].base = 10
}

const poolSum = computed(() => rollPool.value.reduce((s, r) => s + r.total, 0))
const allAssigned = computed(() =>
  rollPool.value.length === 6 && ATTR_KEYS.every(k => attrAssignment.value[k] !== null)
)

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
  const perLevel = Math.max(1, base + intMod.value)
  const lvl1 = perLevel * 4 + (isHuman.value ? 4 : 0)
  const rest = Math.max(0, ch.value.level - 1) * (perLevel + (isHuman.value ? 1 : 0))
  return lvl1 + rest
})

watch(calcSkillPoints, v => { if (!ch.value.skillPoints) ch.value.skillPoints = v }, { immediate: true })

const usedPoints = computed(() => {
  let t = 0
  for (const [n, r] of Object.entries(ch.value.skills)) {
    t += isClassSkill(n) ? (r as number) : (r as number) * 2
  }
  return t
})

const remainingPoints = computed(() => (ch.value.skillPoints || 0) - usedPoints.value)

const filteredSkills = computed(() => {
  const q = skillSearch.value.toLowerCase()
  return SKILLS_DATA.filter(s => {
    if (showOnlySelected.value && !ch.value.skills[s.name]) return false
    return !q || s.name.toLowerCase().includes(q)
  })
})

function getAbilityMod(ability: string) {
  const attr = ch.value.attributes[ability as keyof CharacterAttributes]
  return Math.floor((attr.base + (attr.temp || 0) - 10) / 2)
}

function getSkillTotal(skillName: string, ability: string) {
  return (ch.value.skills[skillName] || 0) + getAbilityMod(ability)
}

function toggleSkill(n: string) {
  const s = { ...ch.value.skills }
  if (s[n] !== undefined) delete s[n]
  else s[n] = 0
  ch.value.skills = s
}

function setRank(name: string, value: number) {
  ch.value.skills = { ...ch.value.skills, [name]: Math.max(0, value || 0) }
}

// ── Talentos ───────────────────────────────────────────────────────────────
function addFeat() {
  ch.value.feats.push({ title: '', description: '', featType: 'feat' })
}
function removeFeat(i: number) {
  ch.value.feats.splice(i, 1)
}

// ── Equipamentos ───────────────────────────────────────────────────────────
function addItem() {
  ch.value.equipment.push({ title: '', description: '', equipped: false, weight: 0, price: 0, quantity: 1 })
}
function removeItem(i: number) {
  ch.value.equipment.splice(i, 1)
}

// ── Cancel / Save ──────────────────────────────────────────────────────────
function handleCancel() {
  const id = route.query.campaignId
  router.push(id ? `/campaign/${id}` : '/dashboard')
}

function handleFoundryImport(data: any) {
  store.setFromFoundry(data)
  showFoundryModal.value = false
}

async function handleSave() {
  if (!ch.value.name.trim()) { alert('Informe o nome do personagem.'); activeTab.value = 'info'; return }
  saving.value = true
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { alert('Você precisa estar logado.'); saving.value = false; return }
  const campaignId = route.query.campaignId as string | undefined
  const { error } = await supabase.from('sheets').insert({
    user_id: user.id,
    campaign_id: campaignId || null,
    name: ch.value.name,
    class: ch.value.class,
    level: ch.value.level,
    race: ch.value.race,
    data: ch.value
  })
  saving.value = false
  if (error) { alert('Falha ao salvar: ' + error.message); return }
  router.push(campaignId ? `/campaign/${campaignId}` : '/dashboard')
}

// ── Sizes ─────────────────────────────────────────────────────────────────
const SIZES = ['Mínimo', 'Diminuto', 'Miúdo', 'Pequeno', 'Médio', 'Grande', 'Enorme', 'Imenso', 'Colossal']
const ALIGNMENTS = [
  'Leal e Bom', 'Neutro e Bom', 'Caótico e Bom',
  'Leal e Neutro', 'Neutro', 'Caótico e Neutro',
  'Leal e Mau', 'Neutro e Mau', 'Caótico e Mau'
]
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">

    <!-- ── TOP BAR ─────────────────────────────────────────────────────── -->
    <div class="sticky top-0 z-40 bg-card/90 backdrop-blur-md border-b border-border px-4 py-3">
      <div class="max-w-5xl mx-auto flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
            <User class="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 class="text-base font-serif font-bold text-white leading-tight">
              {{ ch.name || 'Novo Personagem' }}
            </h1>
            <p class="text-[11px] text-muted-foreground leading-tight">
              {{ [ch.race, ch.class, ch.level ? `Nível ${ch.level}` : ''].filter(Boolean).join(' · ') || 'Criar Personagem' }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button @click="showFoundryModal = true"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary/50 text-xs transition-colors">
            <Upload class="w-3.5 h-3.5" /> Importar Foundry
          </button>
          <button @click="handleCancel"
            class="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-red-400 text-xs transition-colors">
            Cancelar
          </button>
          <button @click="handleSave" :disabled="saving"
            class="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 shadow-lg shadow-primary/20">
            <CheckCircle class="w-3.5 h-3.5" />
            {{ saving ? 'Salvando...' : 'Criar Ficha' }}
          </button>
        </div>
      </div>
    </div>

    <div class="max-w-5xl mx-auto px-4 py-6">

      <!-- ── TABS ──────────────────────────────────────────────────────── -->
      <div class="flex gap-1 bg-muted/50 rounded-xl p-1 border border-border mb-6 overflow-x-auto">
        <button v-for="tab in TABS" :key="tab.id" @click="activeTab = tab.id"
          class="flex-1 min-w-fit flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
          :class="activeTab === tab.id
            ? 'bg-accent text-white shadow-sm'
            : 'text-muted-foreground hover:text-foreground/80'">
          <span>{{ tab.label }}</span>
        </button>
      </div>

      <!-- ══════════════════════════════════════════════════════════════ -->
      <!-- TAB: IDENTIDADE                                                -->
      <!-- ══════════════════════════════════════════════════════════════ -->
      <div v-show="activeTab === 'info'" class="space-y-6">

        <!-- Avatar + Nome -->
        <div class="flex gap-6 items-start">
          <div class="shrink-0">
            <div class="w-24 h-24 rounded-xl border-2 border-border bg-muted overflow-hidden relative group">
              <img v-if="ch.avatar_url" :src="ch.avatar_url" class="w-full h-full object-cover" />
              <div v-else class="w-full h-full flex items-center justify-center">
                <User class="w-10 h-10 text-muted-foreground/40" />
              </div>
            </div>
          </div>
          <div class="flex-1 grid grid-cols-2 md:grid-cols-3 gap-3">
            <div class="col-span-2 md:col-span-3">
              <label class="form-label">URL do Avatar</label>
              <input v-model="ch.avatar_url" class="form-input" placeholder="https://..." />
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <!-- Nome -->
          <div class="col-span-2 md:col-span-1">
            <label class="form-label">Nome <span class="text-red-400">*</span></label>
            <input v-model="ch.name" class="form-input" placeholder="Nome do personagem" />
          </div>
          <!-- Raça -->
          <div>
            <label class="form-label">Raça</label>
            <input v-model="ch.race" class="form-input" placeholder="Humano, Elfo..." />
          </div>
          <!-- Classe -->
          <div>
            <label class="form-label">Classe</label>
            <input v-model="ch.class" class="form-input" placeholder="Guerreiro, Mago..." />
          </div>
          <!-- Nível -->
          <div>
            <label class="form-label">Nível</label>
            <input v-model.number="ch.level" type="number" min="1" max="40" class="form-input" />
          </div>
          <!-- Tamanho -->
          <div>
            <label class="form-label">Tamanho</label>
            <select v-model="ch.size" class="form-input">
              <option v-for="s in SIZES" :key="s">{{ s }}</option>
            </select>
          </div>
          <!-- Tendência -->
          <div>
            <label class="form-label">Tendência</label>
            <select v-model="ch.alignment" class="form-input">
              <option value="">— Selecione —</option>
              <option v-for="a in ALIGNMENTS" :key="a">{{ a }}</option>
            </select>
          </div>
          <!-- Divindade -->
          <div>
            <label class="form-label">Divindade</label>
            <input v-model="ch.deity" class="form-input" placeholder="Pantheon..." />
          </div>
          <!-- Idade -->
          <div>
            <label class="form-label">Idade</label>
            <input v-model="ch.age" class="form-input" placeholder="Ex: 25 anos" />
          </div>
          <!-- Gênero -->
          <div>
            <label class="form-label">Gênero</label>
            <input v-model="ch.gender" class="form-input" placeholder="Gênero" />
          </div>
          <!-- Altura -->
          <div>
            <label class="form-label">Altura</label>
            <input v-model="ch.height" class="form-input" placeholder="Ex: 1,75m" />
          </div>
          <!-- Peso -->
          <div>
            <label class="form-label">Peso</label>
            <input v-model="ch.weight" class="form-input" placeholder="Ex: 70kg" />
          </div>
          <!-- Olhos -->
          <div>
            <label class="form-label">Olhos</label>
            <input v-model="ch.eyes" class="form-input" placeholder="Cor dos olhos" />
          </div>
          <!-- Cabelo -->
          <div>
            <label class="form-label">Cabelo</label>
            <input v-model="ch.hair" class="form-input" placeholder="Cor do cabelo" />
          </div>
          <!-- Pele -->
          <div>
            <label class="form-label">Pele</label>
            <input v-model="ch.skin" class="form-input" placeholder="Tom de pele" />
          </div>
          <!-- XP -->
          <div>
            <label class="form-label">Experiência (XP)</label>
            <input v-model.number="ch.xp" type="number" min="0" class="form-input" />
          </div>
        </div>
      </div>

      <!-- ════════════════════════════════════════════════════════════ -->
      <!-- TAB: ATRIBUTOS                                               -->
      <!-- ════════════════════════════════════════════════════════════ -->
      <div v-show="activeTab === 'attrs'" class="space-y-5">

        <!-- Grade de Atributos -->
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <div v-for="key in ATTR_KEYS" :key="key"
            @click="assignToAttr(key)"
            class="flex flex-col items-center gap-2 p-4 rounded-xl border transition-all"
            :class="[
              selectedRoll
                ? isRolling
                  ? 'opacity-60 cursor-not-allowed'
                  : 'cursor-pointer border-amber-600/60 bg-amber-950/20 hover:bg-amber-900/30 hover:border-amber-500'
                : 'cursor-default border-border bg-muted/50 hover:border-border',
              attrAssignment[key] !== null ? 'ring-2 ring-primary/40' : ''
            ]">

            <!-- Label -->
            <span class="text-[10px] font-bold uppercase tracking-widest"
              :class="attrAssignment[key] !== null ? 'text-primary' : 'text-muted-foreground'">
              {{ ATTR_LABELS[key] }}
            </span>

            <!-- Valor base -->
            <div class="relative w-full text-center">
              <input v-model.number="ch.attributes[key as keyof typeof ch.attributes].base"
                type="number" min="1" max="40"
                @click.stop
                class="w-full text-center text-2xl font-bold bg-transparent border-b focus:outline-none text-white py-1 transition-colors"
                :class="attrAssignment[key] !== null
                  ? 'border-primary text-primary'
                  : 'border-border focus:border-primary'" />
            </div>

            <!-- Modificador -->
            <div class="text-sm font-bold px-3 py-0.5 rounded-full transition-all"
              :class="Math.floor((ch.attributes[key as keyof typeof ch.attributes].base - 10) / 2) >= 0
                ? 'bg-primary/20 text-primary' : 'bg-red-950/50 text-red-400'">
              {{ attrMod(ch.attributes[key as keyof typeof ch.attributes].base) }}
            </div>

            <!-- Badge do roll atribuído + botão remover -->
            <div v-if="attrAssignment[key] !== null" class="flex items-center gap-1">
              <span class="text-[10px] bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-full font-bold">
                {{ rollPool.find(r => r.id === attrAssignment[key])?.total }}
              </span>
              <button @click.stop="unassign(key)"
                class="text-muted-foreground hover:text-red-400 transition-colors text-[10px] font-bold">
                ×
              </button>
            </div>

            <!-- Indicação de aguardando atribuição -->
            <div v-else-if="selectedRoll"
              class="text-[10px] text-amber-400 font-bold animate-pulse">
              ← clicar para aplicar {{ selectedRoll.total }}
            </div>

            <!-- Temp -->
            <div class="w-full">
              <label class="text-[10px] text-muted-foreground/60 text-center block mb-0.5">Temp</label>
              <input v-model.number="ch.attributes[key as keyof typeof ch.attributes].temp"
                type="number" min="0" @click.stop
                class="w-full text-center text-sm bg-accent/50 border border-border rounded focus:outline-none focus:border-primary text-foreground/80 px-2 py-1 transition-colors" />
            </div>
          </div>
        </div>

        <!-- Pool de dados rolados -->
        <div class="border border-border rounded-xl overflow-hidden">
          <!-- Header -->
          <div class="flex items-center justify-between px-4 py-3 bg-muted/80 border-b border-border">
            <div class="flex items-center gap-3">
              <span class="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pool de Rolagem (4d6 drop lowest)</span>
              <span v-if="rollPool.length > 0" class="text-[11px] text-muted-foreground/60">
                Soma: <strong class="text-muted-foreground">{{ poolSum }}</strong>
                <span v-if="allAssigned" class="text-primary font-bold ml-2"> Todos atribuídos!</span>
              </span>
            </div>
            <button @click="rollPool6"
              :disabled="isRolling"
              class="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-900/40 border border-amber-700/50 text-amber-300 text-xs font-bold hover:bg-amber-800/50 transition-all disabled:opacity-50 active:scale-95">
              <span :class="{ 'inline-block animate-bounce': isRolling }"></span>
              {{ isRolling ? 'Rolando...' : rollPool.length ? 'Rolar Novamente' : 'Rolar 6 Atributos' }}
            </button>
          </div>

          <!-- Instrução -->
          <div v-if="rollPool.length > 0 && !selectedRoll"
            class="px-4 py-2 bg-card/50 text-[11px] text-muted-foreground border-b border-border">
            Clique em um valor abaixo para selecioná-lo, depois clique no atributo acima onde deseja aplicá-lo.
          </div>
          <div v-else-if="selectedRoll"
            class="px-4 py-2 bg-amber-950/30 border-b border-amber-800/40 text-[11px] text-amber-300 font-semibold">
             Valor <strong>{{ selectedRoll.total }}</strong> selecionado — clique no atributo desejado para aplicar, ou clique novamente para cancelar.
          </div>

          <!-- Dados em animação -->
          <div v-if="isRolling" class="p-4 grid grid-cols-6 gap-3">
            <div v-for="(anim, ai) in rollAnimDice" :key="ai"
              class="flex flex-col items-center gap-2 p-3 bg-accent/60 rounded-lg border border-border/50">
              <div class="flex flex-wrap justify-center gap-1">
                <div v-for="(d, di) in anim" :key="di"
                  class="w-6 h-6 rounded bg-amber-900/60 border border-amber-700/50 flex items-center justify-center text-[10px] font-bold text-amber-300 transition-all">
                  {{ d }}
                </div>
              </div>
              <div class="text-base font-bold text-muted-foreground">―</div>
            </div>
          </div>

          <!-- Pool final -->
          <div v-else-if="rollPool.length > 0" class="p-4 grid grid-cols-3 sm:grid-cols-6 gap-3">
            <button v-for="roll in rollPool" :key="roll.id"
              @click="isRollUsed(roll.id) ? null : selectRoll(roll.id)"
              class="flex flex-col items-center gap-2 p-3 rounded-lg border transition-all"
              :class="[
                selectedRollId === roll.id
                  ? 'bg-amber-900/50 border-amber-500 shadow-lg shadow-amber-900/40 scale-105'
                  : isRollUsed(roll.id)
                  ? 'bg-muted/30 border-border/50 opacity-40 cursor-not-allowed'
                  : 'bg-accent/40 border-border hover:border-amber-600/60 hover:bg-amber-950/30 cursor-pointer'
              ]">
              <!-- Faces -->
              <div class="flex flex-wrap justify-center gap-1">
                <div v-for="(d, di) in roll.dice" :key="di"
                  class="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold transition-all"
                  :class="di === roll.dropped
                    ? 'bg-accent text-muted-foreground/60'
                    : selectedRollId === roll.id
                    ? 'bg-amber-700/70 border border-amber-500/60 text-amber-200'
                    : 'bg-accent/70 border border-border/50 text-foreground/80'">
                  {{ d }}
                </div>
              </div>
              <!-- Total -->
              <div class="text-xl font-bold tabular-nums leading-none"
                :class="selectedRollId === roll.id ? 'text-amber-300' : isRollUsed(roll.id) ? 'text-muted-foreground/60' : 'text-white'">
                {{ roll.total }}
              </div>
              <!-- Status -->
              <div v-if="isRollUsed(roll.id)" class="text-[9px] font-bold text-primary">
                {{ Object.entries(attrAssignment).find(([,v]) => v === roll.id)?.[0]?.toUpperCase() }}
              </div>
            </button>
          </div>

          <!-- Estado vazio -->
          <div v-else class="p-8 text-center text-muted-foreground/60 text-sm">
            Clique em <strong class="text-muted-foreground"> Rolar 6 Atributos</strong> para gerar os valores e distribuir entre os atributos.
          </div>
        </div>

        <!-- Dica -->
        <p class="text-[11px] text-muted-foreground/60">
           4d6 drop lowest · Você pode editar qualquer valor manualmente mesmo após rolar · Clique × no atributo para remover a atribuição
        </p>
      </div>

      <!-- ══════════════════════════════════════════════════════════════ -->
      <!-- TAB: COMBATE                                                   -->
      <!-- ══════════════════════════════════════════════════════════════ -->
      <div v-show="activeTab === 'combat'" class="space-y-6">

        <!-- PV & Combate Básico -->
        <div>
          <h3 class="section-title">Pontos de Vida & Combate</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label class="form-label">PV Máximos</label>
              <input v-model.number="ch.hp_max" type="number" min="1" class="form-input form-input-lg" />
            </div>
            <div>
              <label class="form-label">BBA (Bônus Base de Ataque)</label>
              <input v-model.number="ch.bab" type="number" min="0" class="form-input" />
            </div>
            <div>
              <label class="form-label">Deslocamento (m)</label>
              <input v-model.number="ch.speed" type="number" min="0" step="1.5" class="form-input" />
            </div>
            <div>
              <label class="form-label">Iniciativa (bônus misc)</label>
              <input v-model.number="ch.initiative_misc" type="number" class="form-input" />
            </div>
          </div>
        </div>

        <!-- Testes de Resistência -->
        <div>
          <h3 class="section-title">Testes de Resistência</h3>
          <div class="grid grid-cols-3 gap-4">
            <div class="p-4 bg-muted/50 border border-border rounded-xl text-center">
              <label class="form-label text-center block">Fortitude</label>
              <input v-model.number="ch.save_fort" type="number" class="form-input text-center text-xl font-bold text-primary" />
            </div>
            <div class="p-4 bg-muted/50 border border-border rounded-xl text-center">
              <label class="form-label text-center block">Reflexos</label>
              <input v-model.number="ch.save_ref" type="number" class="form-input text-center text-xl font-bold text-primary" />
            </div>
            <div class="p-4 bg-muted/50 border border-border rounded-xl text-center">
              <label class="form-label text-center block">Vontade</label>
              <input v-model.number="ch.save_will" type="number" class="form-input text-center text-xl font-bold text-primary" />
            </div>
          </div>
        </div>

        <!-- Classe de Armadura -->
        <div>
          <h3 class="section-title">Classe de Armadura (CA)</h3>
          <div class="grid grid-cols-3 md:grid-cols-5 gap-3">
            <div class="md:col-span-1 p-4 bg-primary/10 border border-primary/30 rounded-xl text-center">
              <label class="form-label text-center block text-primary">Total</label>
              <input v-model.number="ch.ac.total" type="number" class="form-input text-center text-2xl font-bold text-primary bg-transparent border-none focus:outline-none" />
            </div>
            <div class="p-3 bg-muted/50 border border-border rounded-xl text-center">
              <label class="form-label text-center block">Contato</label>
              <input v-model.number="ch.ac.touch" type="number" class="form-input text-center font-bold" />
            </div>
            <div class="p-3 bg-muted/50 border border-border rounded-xl text-center">
              <label class="form-label text-center block">Surpreso</label>
              <input v-model.number="ch.ac.flatFooted" type="number" class="form-input text-center font-bold" />
            </div>
            <div class="p-3 bg-muted/50 border border-border rounded-xl text-center">
              <label class="form-label text-center block">Armadura</label>
              <input v-model.number="ch.ac.armor" type="number" class="form-input text-center" />
            </div>
            <div class="p-3 bg-muted/50 border border-border rounded-xl text-center">
              <label class="form-label text-center block">Escudo</label>
              <input v-model.number="ch.ac.shield" type="number" class="form-input text-center" />
            </div>
            <div class="p-3 bg-muted/50 border border-border rounded-xl text-center">
              <label class="form-label text-center block">Natural</label>
              <input v-model.number="ch.ac.natural" type="number" class="form-input text-center" />
            </div>
            <div class="p-3 bg-muted/50 border border-border rounded-xl text-center">
              <label class="form-label text-center block">Deflexão</label>
              <input v-model.number="ch.ac.deflection" type="number" class="form-input text-center" />
            </div>
            <div class="p-3 bg-muted/50 border border-border rounded-xl text-center">
              <label class="form-label text-center block">Misc</label>
              <input v-model.number="ch.ac.misc" type="number" class="form-input text-center" />
            </div>
            <div class="p-3 bg-muted/50 border border-border rounded-xl text-center">
              <label class="form-label text-center block">Tam</label>
              <input v-model.number="ch.ac.size" type="number" class="form-input text-center" />
            </div>
          </div>
        </div>

        <!-- Pontos de Vida por Dados -->
        <div>
          <h3 class="section-title">Classe Personalizada</h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="form-label">Dado de Vida (DV)</label>
              <select v-model.number="ch.customHitDie" class="form-input">
                <option v-for="d in [4,6,8,10,12]" :key="d" :value="d">d{{ d }}</option>
              </select>
            </div>
            <div>
              <label class="form-label">Pontos de Perícia por Nível</label>
              <input v-model.number="ch.customSkillPoints" type="number" min="1" max="12" class="form-input" />
            </div>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════════════ -->
      <!-- TAB: PERÍCIAS                                                  -->
      <!-- ══════════════════════════════════════════════════════════════ -->
      <div v-show="activeTab === 'skills'" class="space-y-4">

        <!-- Points bar -->
        <div class="grid grid-cols-3 gap-3 p-4 bg-muted/50 border border-border rounded-xl text-center">
          <div>
            <p class="text-[10px] text-muted-foreground uppercase font-bold mb-1">Total de Pontos</p>
            <div class="flex flex-col items-center gap-1">
              <input v-model.number="ch.skillPoints" type="number" class="w-20 text-center text-xl font-bold bg-transparent text-white border-b border-border focus:outline-none focus:border-primary" />
              <span class="text-[10px] text-muted-foreground/60">Sugerido: {{ calcSkillPoints }}</span>
            </div>
          </div>
          <div>
            <p class="text-[10px] text-muted-foreground uppercase font-bold mb-1">Distribuídos</p>
            <p class="text-2xl font-bold text-foreground/80">{{ usedPoints }}</p>
          </div>
          <div>
            <p class="text-[10px] text-muted-foreground uppercase font-bold mb-1">Restantes</p>
            <p class="text-2xl font-bold" :class="remainingPoints < 0 ? 'text-red-400' : 'text-primary'">{{ remainingPoints }}</p>
          </div>
        </div>

        <!-- Filters -->
        <div class="flex gap-2">
          <div class="relative flex-1">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input v-model="skillSearch" placeholder="Buscar perícia..." class="form-input pl-8 py-1.5 text-sm" />
          </div>
          <button @click="showOnlySelected = !showOnlySelected"
            class="px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors"
            :class="showOnlySelected ? 'border-primary bg-primary/20 text-primary' : 'border-border text-muted-foreground hover:border-muted-foreground'">
            Só selecionadas
          </button>
        </div>

        <!-- Skill table -->
        <div class="border border-border rounded-xl overflow-hidden">
          <div class="grid grid-cols-[1fr_48px_48px_80px_56px_40px] px-3 py-2 bg-accent/60 text-[10px] font-bold uppercase text-muted-foreground gap-2">
            <div>Perícia</div>
            <div class="text-center">Hab</div>
            <div class="text-center">Mod</div>
            <div class="text-center">Ranks</div>
            <div class="text-center">Total</div>
            <div class="text-center">Cls</div>
          </div>
          <div class="divide-y divide-border/50 max-h-[500px] overflow-y-auto">
            <div v-for="skill in filteredSkills" :key="skill.name"
              class="grid grid-cols-[1fr_48px_48px_80px_56px_40px] px-3 py-2 items-center gap-2 text-sm transition-colors hover:bg-accent/30"
              :class="[
                ch.skills[skill.name] !== undefined ? 'bg-primary/5' : '',
                isClassSkill(skill.name) ? 'border-l-2 border-primary/30' : ''
              ]">
              <button @click="toggleSkill(skill.name)" class="flex items-center gap-2 text-left">
                <div class="w-3 h-3 rounded border flex items-center justify-center shrink-0 transition-colors"
                  :class="ch.skills[skill.name] !== undefined ? 'bg-primary border-primary' : 'border-border'">
                  <span v-if="ch.skills[skill.name] !== undefined" class="text-primary-foreground text-[8px]"></span>
                </div>
                <span class="truncate text-xs" :class="ch.skills[skill.name] !== undefined ? 'text-foreground' : 'text-muted-foreground'">
                  {{ skill.name }}
                  <span v-if="skill.trainedOnly" class="text-muted-foreground/60 text-[10px]">*</span>
                </span>
              </button>
              <div class="text-center text-[11px] text-muted-foreground font-mono uppercase">{{ skill.ability }}</div>
              <div class="text-center text-muted-foreground text-xs">
                {{ getAbilityMod(skill.ability) >= 0 ? '+' : '' }}{{ getAbilityMod(skill.ability) }}
              </div>
              <div class="flex justify-center">
                <input v-if="ch.skills[skill.name] !== undefined"
                  :value="ch.skills[skill.name]"
                  @input="(e) => setRank(skill.name, +(e.target as HTMLInputElement).value)"
                  type="number" min="0"
                  class="w-16 text-center text-xs bg-accent border border-border rounded px-1 py-1 text-primary font-bold focus:outline-none focus:border-primary" />
                <span v-else class="text-muted-foreground/40 text-xs">—</span>
              </div>
              <div class="text-center text-xs font-bold tabular-nums"
                :class="ch.skills[skill.name] !== undefined ? 'text-primary' : 'text-muted-foreground/40'">
                <template v-if="ch.skills[skill.name] !== undefined">
                  {{ getSkillTotal(skill.name, skill.ability) >= 0 ? '+' : '' }}{{ getSkillTotal(skill.name, skill.ability) }}
                </template>
                <template v-else>—</template>
              </div>
              <div class="text-center">
                <span v-if="isClassSkill(skill.name)" class="text-[9px] font-bold text-primary bg-primary/15 px-1 py-0.5 rounded">C</span>
              </div>
            </div>
          </div>
        </div>
        <p class="text-[11px] text-muted-foreground/60">* Somente Treinada · C = Perícia de Classe (1 ponto/rank) · Cruzada = 2 pontos/rank</p>
      </div>

      <!-- ══════════════════════════════════════════════════════════════ -->
      <!-- TAB: TALENTOS                                                  -->
      <!-- ══════════════════════════════════════════════════════════════ -->
      <div v-show="activeTab === 'feats'" class="space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="section-title mb-0">Talentos <span class="text-muted-foreground/60 font-normal text-sm ml-1">{{ ch.feats.length }}</span></h3>
          <button @click="addFeat"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/20 border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/30 transition-colors">
            <Plus class="w-3 h-3" /> Adicionar Talento
          </button>
        </div>

        <div v-if="ch.feats.length === 0" class="text-center py-12 text-muted-foreground/60 text-sm border border-dashed border-border rounded-xl">
          Nenhum talento ainda. Clique em "Adicionar Talento" para começar.
        </div>

        <div v-for="(feat, i) in ch.feats" :key="i"
          class="bg-muted/50 border border-border rounded-xl p-4 space-y-3 group hover:border-border transition-colors">
          <div class="flex items-start gap-3">
            <div class="flex-1 space-y-2">
              <input v-model="feat.title" placeholder="Nome do talento"
                class="form-input font-semibold text-foreground" />
              <textarea v-model="feat.description" placeholder="Descrição do talento..." rows="2"
                class="form-input text-sm text-muted-foreground resize-none" />
              <div class="flex gap-2">
                <select v-model="feat.featType" class="form-input text-xs flex-1">
                  <option value="feat">Talento</option>
                  <option value="classFeat">Habilidade de Classe</option>
                  <option value="trait">Traço</option>
                  <option value="racial">Racial</option>
                  <option value="misc">Miscelânea</option>
                </select>
                <input v-model="feat.requirements" placeholder="Pré-requisitos..." class="form-input text-xs flex-1" />
              </div>
            </div>
            <button @click="removeFeat(i)"
              class="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/60 hover:text-red-400 hover:bg-red-950/30 transition-colors opacity-0 group-hover:opacity-100">
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════════════ -->
      <!-- TAB: EQUIPAMENTO                                               -->
      <!-- ══════════════════════════════════════════════════════════════ -->
      <div v-show="activeTab === 'equip'" class="space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="section-title mb-0">Equipamentos <span class="text-muted-foreground/60 font-normal text-sm ml-1">{{ ch.equipment.length }}</span></h3>
          <button @click="addItem"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/20 border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/30 transition-colors">
            <Plus class="w-3 h-3" /> Adicionar Item
          </button>
        </div>

        <div v-if="ch.equipment.length === 0" class="text-center py-12 text-muted-foreground/60 text-sm border border-dashed border-border rounded-xl">
          Nenhum item ainda. Clique em "Adicionar Item" para começar.
        </div>

        <div v-for="(item, i) in ch.equipment" :key="i"
          class="bg-muted/50 border border-border rounded-xl p-4 group hover:border-border transition-colors">
          <div class="flex items-start gap-3">
            <div class="flex-1 space-y-2">
              <input v-model="item.title" placeholder="Nome do item"
                class="form-input font-semibold text-foreground" />
              <div class="grid grid-cols-3 gap-2">
                <div>
                  <label class="form-label">Quantidade</label>
                  <input v-model.number="item.quantity" type="number" min="1" class="form-input" />
                </div>
                <div>
                  <label class="form-label">Peso (kg)</label>
                  <input v-model.number="item.weight" type="number" min="0" step="0.1" class="form-input" />
                </div>
                <div>
                  <label class="form-label">Preço (po)</label>
                  <input v-model.number="item.price" type="number" min="0" class="form-input" />
                </div>
              </div>
              <div class="flex items-center gap-3">
                <label class="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground">
                  <input v-model="item.equipped" type="checkbox"
                    class="rounded border-border bg-accent text-primary focus:ring-primary" />
                  Equipado
                </label>
                <input v-model="item.description" placeholder="Notas sobre o item..." class="form-input text-xs flex-1" />
              </div>
            </div>
            <button @click="removeItem(i)"
              class="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/60 hover:text-red-400 hover:bg-red-950/30 transition-colors opacity-0 group-hover:opacity-100">
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <!-- Peso total -->
        <div v-if="ch.equipment.length > 0" class="text-right text-xs text-muted-foreground pt-2">
          Peso total: <span class="font-bold text-foreground/80">
            {{ ch.equipment.reduce((s, e) => s + (e.weight || 0) * (e.quantity || 1), 0).toFixed(1) }} kg
          </span>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════════════ -->
      <!-- TAB: BIOGRAFIA                                                 -->
      <!-- ══════════════════════════════════════════════════════════════ -->
      <div v-show="activeTab === 'bio'" class="space-y-4">
        <div>
          <label class="form-label">Biografia / Histórico</label>
          <textarea v-model="ch.bio" rows="10"
            placeholder="Descreva a história, personalidade e motivações do seu personagem..."
            class="form-input resize-none text-sm leading-relaxed" />
        </div>
      </div>

    </div><!-- /max-w -->
  </div>

  <!-- Foundry Import Modal -->
  <FoundryImportModal
    v-if="showFoundryModal"
    @close="showFoundryModal = false"
    @import="handleFoundryImport"
  />
</template>

<style scoped>
.form-label {
  display: block;
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.075em;
  text-transform: uppercase;
  color: var(--muted-foreground);
  margin-bottom: 0.375rem;
}

.form-input {
  width: 100%;
  background-color: var(--muted);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: var(--foreground);
  transition: border-color 0.15s;
}
.form-input:focus {
  outline: none;
  border-color: hsl(var(--primary));
}
.form-input::placeholder {
  color: var(--muted-foreground);
  opacity: 0.6;
}
.form-input-lg {
  font-size: 1.125rem;
  font-weight: 700;
  text-align: center;
}

.section-title {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted-foreground);
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border);
}
</style>
