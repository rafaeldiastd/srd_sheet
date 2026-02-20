<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ChevronLeft, Pencil, Save, X, Star, Zap,
  Heart, Wind, Settings, Shield, Sword, Plus, Trash2,
  Search, BookOpen, Package, Minus, MessageSquare, Flame, RefreshCw
} from 'lucide-vue-next'
import SheetChatOverlay from '@/components/campaign/SheetChatOverlay.vue'
import { SKILLS_DATA, CLASS_SKILLS, CLASS_SKILL_POINTS } from '@/data/dnd35'

const route = useRoute()
const router = useRouter()
const sheet = ref<any>(null)
const loading = ref(true)
const saving = ref(false)
const savingHP = ref(false)
const editMode = ref(false)
const editedData = ref<any>(null)
const skillPhase = ref<'select' | 'allocate'>('select')
const skillSearch = ref('')
// Generic Item Editor
const isEditorOpen = ref(false)
const editingType = ref<'feat' | 'spell' | 'shortcut'>('feat')
const editingIndex = ref(-1) // -1 = new
const tempItem = ref<any>({})
const newItem = ref('')
const showChat = ref(false)

// ── Spells UI State ──────────────────────────────────────────────────────────
const spellSearch = ref('')
const spellLevelFilter = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)
let dragSrcIndex: number | null = null

const SPELL_LEVELS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

const filteredSpells = computed(() => {
  if (!d.value?.spells) return []
  const search = spellSearch.value.toLowerCase()
  return d.value.spells
    .map((spell: any, i: number) => ({ spell, i }))
    .filter(({ spell }: { spell: any }) => {
      if (typeof spell === 'string') return spell.toLowerCase().includes(search)
      const matchSearch = !search ||
        spell.title?.toLowerCase().includes(search) ||
        spell.description?.toLowerCase().includes(search)
      const matchLevel = spellLevelFilter.value === null ||
        spell.spellLevel === spellLevelFilter.value
      return matchSearch && matchLevel
    })
})

function spellDragStart(e: DragEvent, i: number) {
  dragSrcIndex = i
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
}
function spellDragOver(e: DragEvent, i: number) {
  e.preventDefault()
  dragOverIndex.value = i
}
function spellDrop(e: DragEvent, targetIndex: number) {
  e.preventDefault()
  dragOverIndex.value = null
  if (dragSrcIndex === null || dragSrcIndex === targetIndex) return
  const spells = [...(d.value?.spells || [])]
  const [moved] = spells.splice(dragSrcIndex, 1)
  spells.splice(targetIndex, 0, moved)
  if (d.value) d.value.spells = spells
  dragSrcIndex = null
}
function spellDragEnd() {
  dragOverIndex.value = null
  dragSrcIndex = null
}

// ── Feats UI State ──────────────────────────────────────────────────────────
const featSearch = ref('')
const featTypeFilter = ref<'all' | 'attack' | 'passive'>('all')

const filteredFeats = computed(() => {
  if (!d.value?.feats) return []
  const search = featSearch.value.toLowerCase()
  return d.value.feats
    .map((feat: any, i: number) => ({ feat, i }))
    .filter(({ feat }: { feat: any }) => {
      const isAttack = typeof feat !== 'string' && feat.isAttack
      const matchSearch = !search ||
        (typeof feat === 'string' ? feat.toLowerCase().includes(search)
          : feat.title?.toLowerCase().includes(search) || feat.description?.toLowerCase().includes(search))
      const matchType = featTypeFilter.value === 'all' ||
        (featTypeFilter.value === 'attack' && isAttack) ||
        (featTypeFilter.value === 'passive' && !isAttack)
      return matchSearch && matchType
    })
})

// ── Spell Slots State ───────────────────────────────────────────────────
const spellSlotsMax = ref<Record<number, number>>({}) // max per level
const spellSlotsUsed = ref<Record<number, number>>({}) // used per level

function initSpellSlots() {
  // init missing levels to 0 so they are reactive
  SPELL_LEVELS.forEach(lvl => {
    if (spellSlotsMax.value[lvl] === undefined) spellSlotsMax.value[lvl] = 0
    if (spellSlotsUsed.value[lvl] === undefined) spellSlotsUsed.value[lvl] = 0
  })
}
function adjustSlotUsed(level: number, delta: number) {
  const max = spellSlotsMax.value[level] ?? 0
  const cur = spellSlotsUsed.value[level] ?? 0
  spellSlotsUsed.value[level] = Math.max(0, Math.min(max, cur + delta))
}
function adjustSlotMax(level: number, delta: number) {
  const cur = spellSlotsMax.value[level] ?? 0
  spellSlotsMax.value[level] = Math.max(0, cur + delta)
  // Clamp used to new max
  if ((spellSlotsUsed.value[level] ?? 0) > spellSlotsMax.value[level])
    spellSlotsUsed.value[level] = spellSlotsMax.value[level]
}

// Load slots from sheet.value on sheet load (persist as part of sheet data)
// We watch sheet.value.data rather than the computed `d` to avoid TDZ issues
watch(() => (sheet as any).value?.data, (newData) => {
  if (newData) {
    spellSlotsMax.value = newData.spellSlotsMax ?? {}
    spellSlotsUsed.value = newData.spellSlotsUsed ?? {}
    initSpellSlots()
  }
}, { immediate: true })

// ── Static config arrays (typed, avoids TS tuple inference issues in templates) ──
const ATTR_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const
const ATTR_LABELS: Record<string, string> = { str: 'FOR', dex: 'DES', con: 'CON', int: 'INT', wis: 'SAB', cha: 'CAR' }

interface Modifier { target: string; value: number }
const MODIFIER_TARGETS = [
  { value: 'str', label: 'Força (@str)' },
  { value: 'dex', label: 'Destreza (@dex)' },
  { value: 'con', label: 'Constituição (@con)' },
  { value: 'int', label: 'Inteligência (@int)' },
  { value: 'wis', label: 'Sabedoria (@wis)' },
  { value: 'cha', label: 'Carisma (@cha)' },
  { value: 'CA', label: 'Classe de Armadura (@CA)' },
  { value: 'hp', label: 'Pontos de Vida (@hp)' },
  { value: 'bab', label: 'Bônus Base Ataque (@BBA)' },
  { value: 'fort', label: 'Fortitude (@fort)' },
  { value: 'ref', label: 'Reflexos (@ref)' },
  { value: 'will', label: 'Vontade (@will)' },
  { value: 'iniciativa', label: 'Iniciativa (@iniciativa)' },
  { value: 'speed', label: 'Deslocamento (@speed)' },
]

interface FieldDef { field: string; label: string }
const CA_FIELDS: FieldDef[] = [
  { field: 'ca_armor', label: 'Armadura' },
  { field: 'ca_shield', label: 'Escudo' },
  { field: 'ca_natural', label: 'Natural' },
  { field: 'ca_deflect', label: 'Deflexão' },
]
const SAVE_FIELDS: FieldDef[] = [
  { field: 'save_fort', label: 'Fortitude base' },
  { field: 'save_ref', label: 'Reflexo base' },
  { field: 'save_will', label: 'Vontade base' },
]
const SAVE_BONUS_FIELDS: FieldDef[] = [
  { field: 'fort', label: 'Bônus Fort.' },
  { field: 'ref', label: 'Bônus Ref.' },
  { field: 'will', label: 'Bônus Von.' },
]
const ELEM_FIELDS: FieldDef[] = [
  { field: 'fire', label: 'Fogo' },
  { field: 'cold', label: 'Frio' },
  { field: 'acid', label: 'Ácido' },
  { field: 'electricity', label: 'Eletric.' },
  { field: 'sonic', label: 'Sônico' },
  { field: 'force', label: 'Força' },
]

const races = ['Humano', 'Anão', 'Elfo', 'Gnomo', 'Meio-Elfo', 'Meio-Orc', 'Halfling']
const classes = ['Bárbaro', 'Bardo', 'Clérigo', 'Druida', 'Guerreiro', 'Monge', 'Paladino', 'Ranger', 'Ladino', 'Feiticeiro', 'Mago']
const alignments = ['Leal e Bom', 'Neutro e Bom', 'Caótico e Bom', 'Leal e Neutro', 'Neutro', 'Caótico e Neutro', 'Leal e Mau', 'Neutro e Mau', 'Caótico e Mau']

function defaultBonuses() {
  return {
    attributes: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
    hp: 0, ca: 0, bab: 0, initiative: 0, speed: 0,
    saves: { fort: 0, ref: 0, will: 0 },
    resistances: { fire: 0, cold: 0, acid: 0, electricity: 0, sonic: 0, force: 0 },
    notes: '',
  }
}

// ── Fetch ─────────────────────────────────────────────────────────────────
async function fetchSheet() {
  loading.value = true
  const { data, error } = await supabase.from('sheets').select('*').eq('id', route.params.id).single()
  if (error) { console.error(error); router.push('/dashboard') }
  else {
    if (!data.data.bonuses) data.data.bonuses = defaultBonuses()
    if (!data.data.feats) data.data.feats = []
    if (!data.data.spells) data.data.spells = []
    if (!data.data.equipment) data.data.equipment = []
    sheet.value = data
  }
  loading.value = false
}

/** Save only hp_current — always available */
async function saveCurrentHP() {
  if (!sheet.value) return
  savingHP.value = true
  await supabase.from('sheets').update({ data: { ...sheet.value.data } }).eq('id', sheet.value.id)
  savingHP.value = false
}

function startEdit() {
  const copy = JSON.parse(JSON.stringify(sheet.value.data))
  if (!copy.bonuses) copy.bonuses = defaultBonuses()
  if (!copy.feats) copy.feats = []
  if (!copy.spells) copy.spells = []
  if (!copy.shortcuts) copy.shortcuts = []
  if (!copy.equipment) copy.equipment = []
  editedData.value = copy
  editMode.value = true
  skillPhase.value = 'select'
}
function cancelEdit() { editMode.value = false; editedData.value = null }

async function saveEdit() {
  saving.value = true
  // Persist spell slots as part of sheet data
  if (editedData.value) {
    editedData.value.spellSlotsMax = { ...spellSlotsMax.value }
    editedData.value.spellSlotsUsed = { ...spellSlotsUsed.value }
  }
  const { error } = await supabase.from('sheets').update({
    name: editedData.value.name,
    class: editedData.value.class,
    level: editedData.value.level,
    race: editedData.value.race,
    data: editedData.value,
  }).eq('id', sheet.value.id)
  if (error) { alert('Erro ao salvar: ' + error.message) }
  else {
    sheet.value.data = editedData.value
    sheet.value.name = editedData.value.name
    editMode.value = false; editedData.value = null
  }
  saving.value = false
}

// ── Computed ──────────────────────────────────────────────────────────────
const d = computed(() => editMode.value ? editedData.value : sheet.value?.data)
const b = computed(() => d.value?.bonuses || defaultBonuses())

const featBonuses = computed(() => {
  const bonuses: Record<string, number> = {}
  if (!d.value?.feats) return bonuses
  for (const f of d.value.feats) {
    if (typeof f === 'string') continue
    f.modifiers?.forEach((m: Modifier) => bonuses[m.target] = (bonuses[m.target] || 0) + (Number(m.value) || 0))
  }
  return bonuses
})
const spellBonuses = computed(() => {
  const bonuses: Record<string, number> = {}
  if (!d.value?.spells) return bonuses
  for (const s of d.value.spells) {
    if (typeof s === 'string') continue
    s.modifiers?.forEach((m: Modifier) => bonuses[m.target] = (bonuses[m.target] || 0) + (Number(m.value) || 0))
  }
  return bonuses
})
const shortcutBonuses = computed(() => {
  const bonuses: Record<string, number> = {}
  if (!d.value?.shortcuts) return bonuses
  for (const s of d.value.shortcuts) {
    s.modifiers?.forEach((m: Modifier) => bonuses[m.target] = (bonuses[m.target] || 0) + (Number(m.value) || 0))
  }
  return bonuses
})

function getBonus(key: string) {
  return (featBonuses.value[key] ?? 0) + (spellBonuses.value[key] ?? 0) + (shortcutBonuses.value[key] ?? 0)
}

function attrTotal(key: string) {
  const a = d.value?.attributes?.[key]
  return Number(a?.base ?? 10) + Number(a?.temp ?? 0) + Number(b.value.attributes?.[key] ?? 0) + getBonus(key)
}
function calcMod(n: number) { return Math.floor((n - 10) / 2) }
function modStr(n: number) { return n >= 0 ? `+${n}` : `${n}` }
function modStrF(n: number) { return n >= 0 ? `+${n}` : `${n}` }  // same, for clarity in template

const totalCA = computed(() => {
  if (!d.value) return 10
  return 10 + (d.value.ca_armor ?? 0) + calcMod(attrTotal('dex'))
    + (d.value.ca_shield ?? 0) + (d.value.ca_natural ?? 0)
    + (d.value.ca_deflect ?? 0) + (b.value.ca ?? 0) + (featBonuses.value['CA'] ?? 0)
})
const totalTouch = computed(() => !d.value ? 10 : 10 + calcMod(attrTotal('dex')) + (d.value.ca_deflect ?? 0) + (b.value.ca ?? 0))
const totalFlatFooted = computed(() => !d.value ? 10 : 10 + (d.value.ca_armor ?? 0) + (d.value.ca_shield ?? 0) + (d.value.ca_natural ?? 0) + (d.value.ca_deflect ?? 0) + (b.value.ca ?? 0))
const totalInitiative = computed(() => !d.value ? 0 : calcMod(attrTotal('dex')) + (d.value.initiative_misc ?? 0) + (b.value.initiative ?? 0) + (featBonuses.value['iniciativa'] ?? 0))
const totalBAB = computed(() => !d.value ? 0 : (d.value.bab ?? 0) + (b.value.bab ?? 0) + (featBonuses.value['bab'] ?? 0))
const totalHP = computed(() => !d.value ? 0 : (d.value.hp_max ?? 0) + (b.value.hp ?? 0) + (featBonuses.value['hp'] ?? 0))
const totalSpeed = computed(() => !d.value ? 9 : (d.value.speed ?? 9) + (b.value.speed ?? 0) + (featBonuses.value['speed'] ?? 0))
const totalFort = computed(() => !d.value ? 0 : (d.value.save_fort ?? 0) + calcMod(attrTotal('con')) + (b.value.saves?.fort ?? 0) + (featBonuses.value['fort'] ?? 0))
const totalRef = computed(() => !d.value ? 0 : (d.value.save_ref ?? 0) + calcMod(attrTotal('dex')) + (b.value.saves?.ref ?? 0) + (featBonuses.value['ref'] ?? 0))
const totalWill = computed(() => !d.value ? 0 : (d.value.save_will ?? 0) + calcMod(attrTotal('wis')) + (b.value.saves?.will ?? 0) + (featBonuses.value['will'] ?? 0))

// ── Skills ────────────────────────────────────────────────────────────────
const classSkillsSet = computed(() => {
  const cls = (editMode.value ? editedData.value?.class : sheet.value?.class) || ''
  return new Set<string>(CLASS_SKILLS[cls] || [])
})

const filteredSkillsList = computed(() => {
  const q = skillSearch.value.toLowerCase()
  return SKILLS_DATA.filter(s => !q || s.name.toLowerCase().includes(q))
})
const selectedSkillNames = computed(() => {
  if (!editedData.value?.skills) return new Set<string>()
  return new Set<string>(Object.keys(editedData.value.skills))
})
const allocatedSkills = computed(() => SKILLS_DATA.filter(s => selectedSkillNames.value.has(s.name)))

function toggleSkillEdit(name: string) {
  if (!editedData.value) return
  const skills = { ...editedData.value.skills }
  if (name in skills) delete skills[name]
  else skills[name] = 0
  editedData.value.skills = skills
}

function skillAbilityMod(ability: string) { return calcMod(attrTotal(ability)) }

function skillTotal(name: string, ability: string) {
  return (editedData.value?.skills?.[name] ?? 0) + skillAbilityMod(ability)
}

/** Increment or decrement skill rank. Class skills ±1, cross-class ±0.5. No hard cap — budget counter shows overspending. */
function adjustRank(name: string, delta: 1 | -1) {
  if (!editedData.value) return
  const isClass = classSkillsSet.value.has(name)
  const step = isClass ? 1 : 0.5
  const current = editedData.value.skills[name] ?? 0
  const next = Math.max(0, current + delta * step)
  editedData.value.skills[name] = next
}

// ── Skill Point Budget ─────────────────────────────────────────────────────
/** Total skill points available: (classBase + INTmod) × 4 at level 1, × level after; Humanos +1/level */
const skillPointsAvailable = computed(() => {
  const cls = (editedData.value?.class ?? '') as string
  const level = Number(editedData.value?.level ?? 1)
  const intMod = calcMod(attrTotal('int'))
  const base = (CLASS_SKILL_POINTS[cls] ?? 2) + intMod
  // Minimum 1 point per level (D&D 3.5 rule)
  const perLevel = Math.max(1, base)
  const isHuman = (editedData.value?.race ?? '') === 'Humano'
  const humanBonus = isHuman ? level : 0
  // ×4 at 1st level + normal for remaining levels (simplified: total = perLevel × level × multiplier)
  // Standard rule: level 1 gives ×4, levels 2+ give ×1
  const total = (perLevel * 4) + (perLevel * Math.max(0, level - 1)) + humanBonus
  return total
})

/** Total half-points spent across all skills (class skills cost 1, cross-class cost 0.5) */
const skillPointsSpent = computed(() => {
  if (!editedData.value?.skills) return 0
  const skills = editedData.value.skills as Record<string, number>
  return Object.entries(skills).reduce((sum, [name, ranks]) => {
    const isClass = classSkillsSet.value.has(name)
    // Class skill: ranks = cost (1:1); Cross-class: ranks = cost × 0.5 (each 0.5 rank costs 1 point)
    const cost = isClass ? Number(ranks) : Number(ranks) * 2
    return sum + cost
  }, 0)
})

// View-mode active skills
const activeSkills = computed(() => {
  if (!d.value?.skills) return []
  return Object.entries(d.value.skills)
    .filter(([, r]) => (r as number) > 0)
    .map(([name, ranks]) => {
      const skill = SKILLS_DATA.find(s => s.name === name)
      return { name, ranks: ranks as number, ability: skill?.ability ?? 'int' }
    })
})

/** Generic field incrementer for Config section +/- buttons */
function adjustField(obj: any, key: string, delta: number) {
  obj[key] = Number(obj[key] ?? 0) + delta
}

const FORMULA_RE = /@(\w+)/g
function resolveFormula(text: string) {
  if (!text) return ''
  return text.replace(FORMULA_RE, (_, token) => {
    // Attributes
    if (['str', 'dex', 'con', 'int', 'wis', 'cha'].includes(token)) return String(attrTotal(token))
    if (['strMod', 'dexMod', 'conMod', 'intMod', 'wisMod', 'chaMod'].includes(token)) {
      const attr = token.replace('Mod', '')
      return modStr(calcMod(attrTotal(attr)))
    }
    // Combat
    if (token === 'CA') return String(totalCA.value)
    if (token === 'BBA') return modStr(totalBAB.value)
    if (token === 'level') return String(d.value?.level ?? 1)
    if (token === 'hp') return String(totalHP.value)
    if (token === 'iniciativa') return modStr(totalInitiative.value)

    // Saves
    if (token === 'fort') return modStr(totalFort.value)
    if (token === 'ref') return modStr(totalRef.value)
    if (token === 'will') return modStr(totalWill.value)

    return `@${token}` // unknown token
  })
}

// ── Feats / Spells / Items ────────────────────────────────────────────────
// ── Feats / Spells / Items ────────────────────────────────────────────────
function openEditor(type: 'feat' | 'spell' | 'shortcut', item?: any, index = -1) {
  if (!editedData.value) return
  editingType.value = type
  editingIndex.value = index
  if (item) {
    // If item is string (legacy), convert to object structure
    if (typeof item === 'string') {
      tempItem.value = { title: item, description: '', rollFormula: '', modifiers: [], isAttack: false, spellLevel: 1 }
    } else {
      tempItem.value = JSON.parse(JSON.stringify(item))
    }
  } else {
    tempItem.value = { title: '', description: '', rollFormula: '', modifiers: [], isAttack: false, spellLevel: 1, attackBonus: '', cost: '' }
  }
  isEditorOpen.value = true
}

function saveEditor() {
  if (!tempItem.value.title.trim() || !editedData.value) return
  const listKey = editingType.value === 'feat' ? 'feats' : editingType.value === 'shortcut' ? 'shortcuts' : 'spells'

  if (!editedData.value[listKey]) editedData.value[listKey] = []
  const list = editedData.value[listKey]

  if (editingIndex.value >= 0) {
    list[editingIndex.value] = { ...tempItem.value }
  } else {
    list.push({ ...tempItem.value })
  }
  isEditorOpen.value = false
}

function addModifier() {
  if (!tempItem.value.modifiers) tempItem.value.modifiers = []
  tempItem.value.modifiers.push({ target: 'str', value: 1 })
}
function removeModifier(i: number) { tempItem.value.modifiers.splice(i, 1) }

function addItem() { if (!newItem.value.trim() || !editedData.value) return; editedData.value.equipment = [...(editedData.value.equipment || []), newItem.value.trim()]; newItem.value = '' }
function removeFeat(i: number) { editedData.value.feats = editedData.value.feats.filter((_: any, idx: number) => idx !== i) }
function removeSpell(i: number) { editedData.value.spells = editedData.value.spells.filter((_: any, idx: number) => idx !== i) }
function removeShortcut(i: number) { editedData.value.shortcuts = editedData.value.shortcuts.filter((_: any, idx: number) => idx !== i) }
function removeItem(i: number) { editedData.value.equipment = editedData.value.equipment.filter((_: any, idx: number) => idx !== i) }

// ── Class Resources ─────────────────────────────────────────────────────
const newResName = ref('')
const newResMax = ref(1)
const savingRes = ref(false)

function addResource() {
  if (!newResName.value.trim() || !sheet.value) return
  const res = { name: newResName.value.trim(), max: Number(newResMax.value), current: Number(newResMax.value) }
  sheet.value.data.resources = [...(sheet.value.data.resources || []), res]
  newResName.value = ''
  newResMax.value = 1
  saveResources()
}

function removeResource(i: number) {
  if (!sheet.value) return
  sheet.value.data.resources = (sheet.value.data.resources || []).filter((_: any, idx: number) => idx !== i)
  saveResources()
}

function adjustResource(i: number, delta: number) {
  if (!sheet.value) return
  const res = sheet.value.data.resources[i]
  res.current = Math.max(0, Math.min(res.max, (res.current ?? res.max) + delta))
  saveResources()
}

function resetResources() {
  if (!sheet.value) return
  for (const res of (sheet.value.data.resources || [])) res.current = res.max
  saveResources()
}

async function saveResources() {
  if (!sheet.value) return
  savingRes.value = true
  await supabase.from('sheets').update({ data: { ...sheet.value.data } }).eq('id', sheet.value.id)
  savingRes.value = false
}

onMounted(fetchSheet)


</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <div class="max-w-5xl mx-auto px-4 py-8 space-y-4">

      <!-- Top bar -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Button variant="ghost" class="text-muted-foreground hover:text-primary gap-2 pl-0"
            @click="router.push('/dashboard')">
            <ChevronLeft class="w-4 h-4" /> Voltar
          </Button>
          <Button variant="outline" size="sm" @click="showChat = !showChat"
            :class="showChat ? 'bg-primary/20 border-primary text-primary' : ''">
            <MessageSquare class="w-4 h-4 mr-2" /> Chat
          </Button>
        </div>
        <div v-if="sheet && !loading" class="flex gap-2">
          <template v-if="editMode">
            <Button variant="outline" @click="cancelEdit" class="gap-2">
              <X class="w-4 h-4" /> Cancelar
            </Button>
            <Button @click="saveEdit" :disabled="saving" class="gap-2">
              <Save class="w-4 h-4" /> {{ saving ? 'Salvando...' : 'Salvar' }}
            </Button>
          </template>
          <Button v-else variant="outline" @click="startEdit" class="gap-2">
            <Pencil class="w-4 h-4" /> Editar Ficha
          </Button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-24">
        <div class="text-center space-y-3">
          <div class="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p class="text-muted-foreground text-sm">Carregando ficha...</p>
        </div>
      </div>

      <div v-else-if="sheet && d" class="space-y-4">

        <!-- ═══════════════════════════════
             HEADER — Identity + Stats
             ═══════════════════════════════ -->
        <Card class="border-primary/20">
          <CardContent class="pt-5 pb-5 space-y-5">

            <!-- Identity -->
            <div class="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div class="flex-1 space-y-2">
                <div v-if="editMode">
                  <Label class="text-xs text-muted-foreground">Nome</Label>
                  <Input v-model="editedData.name" class="font-serif font-bold text-xl mt-1 w-72" />
                </div>
                <h1 v-else class="text-4xl font-serif font-bold text-primary">{{ sheet.name }}</h1>

                <div class="flex flex-wrap items-end gap-2">
                  <template v-if="editMode">
                    <div>
                      <Label class="text-xs text-muted-foreground block mb-1">Raça</Label>
                      <Select v-model="editedData.race">
                        <SelectTrigger class="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem v-for="r in races" :key="r" :value="r">{{ r }}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label class="text-xs text-muted-foreground block mb-1">Classe</Label>
                      <Select v-model="editedData.class">
                        <SelectTrigger class="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem v-for="c in classes" :key="c" :value="c">{{ c }}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label class="text-xs text-muted-foreground block mb-1">Nível</Label>
                      <Input v-model.number="editedData.level" type="number" min="1" max="20" class="w-20" />
                    </div>
                    <div>
                      <Label class="text-xs text-muted-foreground block mb-1">Tendência</Label>
                      <Select v-model="editedData.alignment">
                        <SelectTrigger class="w-44">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem v-for="a in alignments" :key="a" :value="a">{{ a }}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </template>
                  <template v-else>
                    <span class="font-semibold">{{ d.race }}</span>
                    <span class="text-muted-foreground">·</span>
                    <span class="font-semibold">{{ d.class }}</span>
                    <span
                      class="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider">Nível
                      {{ d.level }}</span>
                    <span v-if="d.alignment" class="text-muted-foreground text-sm">{{ d.alignment }}</span>
                  </template>
                </div>
              </div>
            </div>

            <!-- 6 Attributes -->
            <div class="grid grid-cols-6 gap-2">
              <div v-for="key in ATTR_KEYS" :key="key"
                class="bg-muted/30 border border-border rounded-lg p-2 text-center space-y-1">
                <p class="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{{ ATTR_LABELS[key] }}
                </p>
                <Input v-if="editMode" v-model.number="editedData.attributes[key].base" type="number" min="1" max="30"
                  class="h-8 text-center text-lg font-bold p-0.5 w-full" />
                <p v-else class="text-2xl font-extrabold font-serif text-foreground">{{ attrTotal(key) }}</p>
                <div class="bg-primary/10 text-primary text-xs font-bold rounded px-1 py-0.5 inline-block min-w-[2rem]">
                  {{ modStr(calcMod(attrTotal(key))) }}
                </div>
              </div>
            </div>

            <!-- Combat stat strip -->
            <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">

              <!-- HP — current always editable -->
              <div
                class="col-span-2 flex items-center gap-3 bg-red-950/20 border border-red-900/40 rounded-lg px-4 py-3">
                <Heart class="w-5 h-5 text-red-400 shrink-0" />
                <div class="flex-1 space-y-1">
                  <p class="text-[10px] text-red-400 font-bold uppercase tracking-wider">Pontos de Vida</p>
                  <div class="flex items-center gap-2 flex-wrap">
                    <input v-model.number="sheet.data.hp_current" @change="saveCurrentHP()" type="number" min="0"
                      class="w-14 text-center text-xl font-extrabold font-serif text-red-300 bg-transparent border-0 border-b border-red-800/60 focus:outline-none focus:border-red-400 tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                    <span class="text-red-700">/</span>
                    <Input v-if="editMode" v-model.number="editedData.hp_max" type="number"
                      class="h-8 w-16 text-center font-bold text-red-400 bg-transparent border-red-900/50 text-lg" />
                    <span v-else class="text-xl font-extrabold font-serif text-red-400">{{ totalHP || '--' }}</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <span class="text-[10px] text-yellow-500/80 font-bold uppercase tracking-wide">Temp</span>
                    <input v-model.number="sheet.data.hp_temp" @change="saveCurrentHP()" type="number" min="0"
                      class="w-12 text-center text-sm font-bold text-yellow-400 bg-transparent border-0 border-b border-yellow-800/50 focus:outline-none focus:border-yellow-400 tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                  </div>
                </div>
              </div>

              <!-- CA -->
              <div
                class="flex flex-col items-center justify-center bg-zinc-900 border border-border rounded-lg px-3 py-3 text-center">
                <Shield class="w-4 h-4 text-primary mb-1" />
                <p class="text-[10px] text-muted-foreground font-bold uppercase">CA</p>
                <p class="text-2xl font-extrabold font-serif">{{ totalCA }}</p>
                <p class="text-[9px] text-muted-foreground">T:{{ totalTouch }} | P:{{ totalFlatFooted }}</p>
              </div>

              <!-- BBA — editable in edit mode -->
              <div
                class="flex flex-col items-center justify-center bg-zinc-900 border border-border rounded-lg px-3 py-3 text-center">
                <Sword class="w-4 h-4 text-primary mb-1" />
                <p class="text-[10px] text-muted-foreground font-bold uppercase">BBA</p>
                <Input v-if="editMode" v-model.number="editedData.bab" type="number"
                  class="h-8 w-16 text-center font-bold bg-transparent text-lg mt-0.5" />
                <p v-else class="text-2xl font-extrabold font-serif">{{ modStr(totalBAB) }}</p>
              </div>

              <!-- Iniciativa -->
              <div
                class="flex flex-col items-center justify-center bg-zinc-900 border border-border rounded-lg px-3 py-3 text-center">
                <Zap class="w-4 h-4 text-primary mb-1" />
                <p class="text-[10px] text-muted-foreground font-bold uppercase">Iniciativa</p>
                <p class="text-2xl font-extrabold font-serif">{{ modStr(totalInitiative) }}</p>
              </div>

              <!-- Deslocamento -->
              <div
                class="flex flex-col items-center justify-center bg-zinc-900 border border-border rounded-lg px-3 py-3 text-center">
                <Wind class="w-4 h-4 text-primary mb-1" />
                <p class="text-[10px] text-muted-foreground font-bold uppercase">Desl.</p>
                <div v-if="editMode" class="flex items-center justify-center gap-0.5">
                  <input v-model.number="editedData.speed" type="number" min="0"
                    class="w-10 text-center text-2xl font-extrabold font-serif bg-transparent border-0 border-b border-border/50 focus:outline-none focus:border-primary tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                  <span class="text-lg font-bold text-muted-foreground">m</span>
                </div>
                <p v-else class="text-2xl font-extrabold font-serif">{{ totalSpeed }}m</p>
              </div>

              <!-- Saves -->
              <div class="flex flex-col justify-center bg-zinc-900 border border-border rounded-lg px-3 py-3 gap-1">
                <p class="text-[10px] text-muted-foreground font-bold uppercase text-center mb-1">Resist.</p>
                <div class="flex justify-between gap-1 text-xs">
                  <div class="text-center">
                    <p class="text-[10px] text-muted-foreground">FORT</p>
                    <p class="font-bold">{{ modStr(totalFort) }}</p>
                  </div>
                  <div class="text-center">
                    <p class="text-[10px] text-muted-foreground">REF</p>
                    <p class="font-bold">{{ modStr(totalRef) }}</p>
                  </div>
                  <div class="text-center">
                    <p class="text-[10px] text-muted-foreground">VON</p>
                    <p class="font-bold">{{ modStr(totalWill) }}</p>
                  </div>
                </div>
              </div>

            </div>
          </CardContent>
        </Card>

        <!-- ═════
             TABS
             ═════ -->
        <Tabs default-value="skills" class="w-full">
          <TabsList class="grid w-full grid-cols-4 sm:grid-cols-7 bg-card border border-border h-auto p-1 gap-1">
            <TabsTrigger value="shortcuts"
              class="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs py-1.5">
              <Sword class="w-3.5 h-3.5" /> Atalhos
            </TabsTrigger>
            <TabsTrigger value="skills"
              class="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs py-1.5">
              <Star class="w-3.5 h-3.5" /> Perícias
            </TabsTrigger>
            <TabsTrigger value="feats"
              class="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs py-1.5">
              <Zap class="w-3.5 h-3.5" /> Talentos
            </TabsTrigger>
            <TabsTrigger value="spells"
              class="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs py-1.5">
              <BookOpen class="w-3.5 h-3.5" /> Magias
            </TabsTrigger>
            <TabsTrigger value="items"
              class="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs py-1.5">
              <Package class="w-3.5 h-3.5" /> Itens
            </TabsTrigger>
            <TabsTrigger value="config"
              class="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs py-1.5">
              <Settings class="w-3.5 h-3.5" /> Config
            </TabsTrigger>
            <TabsTrigger value="resources"
              class="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs py-1.5">
              <Flame class="w-3.5 h-3.5" /> Recursos
            </TabsTrigger>
          </TabsList>

          <!-- ── PERÍCIAS ── -->
          <TabsContent value="skills" class="mt-4">
            <Card>
              <CardHeader class="flex-row items-center justify-between pb-3">
                <CardTitle class="text-base">Perícias</CardTitle>
              </CardHeader>
              <CardContent>

                <!-- EDIT MODE -->
                <div v-if="editMode" class="space-y-4">
                  <!-- Phase tabs -->
                  <div class="flex gap-2 border-b border-border">
                    <button @click="skillPhase = 'select'"
                      class="px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors"
                      :class="skillPhase === 'select' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'">
                      1. Escolher
                    </button>
                    <button @click="skillPhase = 'allocate'"
                      class="px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors"
                      :class="skillPhase === 'allocate' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'">
                      2. Graduações
                    </button>
                  </div>

                  <!-- Phase 1: select -->
                  <div v-if="skillPhase === 'select'" class="space-y-3">
                    <div class="relative">
                      <Search
                        class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <Input v-model="skillSearch" placeholder="Buscar perícia..." class="pl-9" />
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button v-for="skill in filteredSkillsList" :key="skill.name" @click="toggleSkillEdit(skill.name)"
                        class="flex items-center gap-3 p-2.5 rounded-lg border text-left transition-all text-sm"
                        :class="selectedSkillNames.has(skill.name)
                          ? 'bg-primary/10 border-primary text-foreground'
                          : 'bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'">
                        <div
                          class="w-4 h-4 rounded flex items-center justify-center shrink-0 border-2 transition-colors"
                          :class="selectedSkillNames.has(skill.name) ? 'bg-primary border-primary' : 'border-muted-foreground'">
                          <span v-if="selectedSkillNames.has(skill.name)"
                            class="text-primary-foreground text-[10px] font-bold">✓</span>
                        </div>
                        <div class="flex-1 min-w-0">
                          <span class="font-medium truncate block">{{ skill.name }}</span>
                          <span class="text-[10px] text-muted-foreground uppercase">{{ skill.ability }}</span>
                        </div>
                        <span v-if="classSkillsSet.has(skill.name)"
                          class="text-[10px] font-bold text-primary shrink-0">Classe</span>
                      </button>
                    </div>
                    <div class="flex justify-between items-center pt-1">
                      <p class="text-xs text-muted-foreground">{{ selectedSkillNames.size }} selecionadas</p>
                      <Button size="sm" @click="skillPhase = 'allocate'">Distribuir →</Button>
                    </div>
                  </div>

                  <!-- Phase 2: allocate with +/- buttons -->
                  <div v-else class="space-y-3">
                    <p v-if="allocatedSkills.length === 0"
                      class="text-center text-muted-foreground text-sm py-4 italic">
                      Nenhuma perícia selecionada. <button @click="skillPhase = 'select'"
                        class="text-primary underline">Voltar</button>
                    </p>
                    <div v-else class="border border-border rounded-lg overflow-hidden">
                      <div
                        class="grid grid-cols-[1fr_50px_60px_110px_60px] bg-muted/40 border-b border-border px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase">
                        <div>Perícia</div>
                        <div class="text-center">Hab</div>
                        <div class="text-center">Mod</div>
                        <div class="text-center">Grads</div>
                        <div class="text-center">Total</div>
                      </div>
                      <div class="divide-y divide-border">
                        <div v-for="skill in allocatedSkills" :key="skill.name"
                          class="grid grid-cols-[1fr_50px_60px_110px_60px] px-3 py-2 items-center text-sm hover:bg-muted/20"
                          :class="classSkillsSet.has(skill.name) ? 'bg-primary/5' : ''">
                          <div class="flex items-center gap-1.5">
                            <div class="w-1.5 h-1.5 rounded-full shrink-0"
                              :class="classSkillsSet.has(skill.name) ? 'bg-primary' : 'bg-border'"></div>
                            <span class="truncate font-medium text-xs">{{ skill.name }}</span>
                          </div>
                          <div class="text-center text-[10px] text-muted-foreground uppercase font-mono">{{
                            skill.ability }}
                          </div>
                          <div class="text-center text-muted-foreground text-sm">{{
                            modStr(skillAbilityMod(skill.ability)) }}
                          </div>

                          <!-- +/- buttons: class skill ±1, cross-class ±0.5 -->
                          <div class="flex items-center justify-center gap-1">
                            <button @click="adjustRank(skill.name, -1)"
                              class="w-6 h-6 rounded bg-muted hover:bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                              <Minus class="w-3 h-3" />
                            </button>
                            <span class="w-10 text-center text-sm font-bold text-foreground tabular-nums">
                              {{ editedData?.skills?.[skill.name] ?? 0 }}
                            </span>
                            <button @click="adjustRank(skill.name, 1)"
                              class="w-6 h-6 rounded bg-muted hover:bg-primary/20 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                              <Plus class="w-3 h-3" />
                            </button>
                          </div>

                          <div class="text-center font-bold text-primary text-sm">{{ modStrF(skillTotal(skill.name,
                            skill.ability)) }}</div>
                        </div>
                      </div>
                    </div>
                    <!-- Skill point budget bar -->
                    <div
                      class="flex items-center justify-between gap-4 px-1 py-2 bg-muted/30 rounded-lg border border-border">
                      <div class="flex items-center gap-2 flex-1">
                        <span
                          class="text-[11px] font-bold text-muted-foreground uppercase tracking-wide shrink-0">Pontos</span>
                        <div class="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div class="h-full rounded-full transition-all duration-300"
                            :style="{ width: Math.min(100, skillPointsSpent / skillPointsAvailable * 100) + '%' }"
                            :class="skillPointsSpent > skillPointsAvailable ? 'bg-red-500' : skillPointsSpent === skillPointsAvailable ? 'bg-green-500' : 'bg-primary'" />
                        </div>
                        <span class="text-xs font-bold tabular-nums shrink-0"
                          :class="skillPointsSpent > skillPointsAvailable ? 'text-red-400' : 'text-foreground'">
                          {{ skillPointsSpent }} / {{ skillPointsAvailable }}
                        </span>
                        <span v-if="skillPointsSpent > skillPointsAvailable"
                          class="text-[10px] text-red-400 font-semibold">(+{{ skillPointsSpent - skillPointsAvailable }}
                          extra)</span>
                      </div>
                    </div>
                    <div class="flex items-center justify-between text-xs text-muted-foreground pt-1">
                      <button @click="skillPhase = 'select'" class="underline hover:text-foreground">← Alterar
                        seleção</button>
                      <span>● Classe (±1) &nbsp; ○ Multiclasse (±0.5)</span>
                    </div>
                  </div>
                </div>

                <!-- VIEW MODE -->
                <div v-else>
                  <div v-if="activeSkills.length === 0" class="text-center py-8 text-muted-foreground italic">Nenhuma
                    perícia
                    com graduações.</div>
                  <div v-else class="divide-y divide-border">
                    <div v-for="s in activeSkills" :key="s.name"
                      class="flex items-center justify-between py-2.5 px-1 hover:bg-muted/20 rounded transition-colors">
                      <div>
                        <span class="text-sm font-medium">{{ s.name }}</span>
                        <span class="text-xs text-muted-foreground ml-2 uppercase">{{ s.ability }}</span>
                      </div>
                      <span class="bg-primary/10 text-primary font-bold text-sm px-3 py-0.5 rounded-full">
                        {{ modStr(s.ranks + calcMod(attrTotal(s.ability))) }}
                      </span>
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feats" class="mt-4">
            <Card>
              <CardHeader class="pb-3">
                <div class="flex flex-col gap-3">
                  <div class="flex items-center justify-between">
                    <CardTitle class="text-base">Talentos
                      <span class="text-xs font-normal text-muted-foreground ml-1">({{ filteredFeats.length }} de {{
                        d.feats?.length || 0 }})</span>
                    </CardTitle>
                    <Button v-if="editMode" @click="openEditor('feat')" size="sm" class="gap-1">
                      <Plus class="w-4 h-4" /> Novo Talento
                    </Button>
                  </div>
                  <!-- Filter bar -->
                  <div class="flex gap-2">
                    <div class="relative flex-1">
                      <Search
                        class="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <Input v-model="featSearch" placeholder="Pesquisar talentos..." class="pl-8 h-8 text-xs" />
                    </div>
                    <div class="flex gap-1">
                      <button
                        v-for="f in [{ v: 'all', label: 'Todos' }, { v: 'attack', label: 'Ataque' }, { v: 'passive', label: 'Passivo' }]"
                        :key="f.v" class="px-2.5 py-1 rounded text-xs font-bold border transition-colors"
                        :class="featTypeFilter === f.v ? 'bg-primary/20 border-primary text-primary' : 'border-zinc-800 text-muted-foreground hover:border-zinc-700'"
                        @click="featTypeFilter = (f.v as any)">{{ f.label }}</button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent class="space-y-2">
                <div v-if="!d.feats?.length" class="text-center py-8 text-muted-foreground italic">Nenhum talento.</div>
                <div v-else-if="filteredFeats.length === 0" class="text-center py-8 text-muted-foreground italic">Nenhum
                  talento encontrado.</div>
                <ul v-else class="space-y-2">
                  <li v-for="({ feat, i }) in filteredFeats" :key="i"
                    class="flex items-start gap-3 p-3 bg-muted/20 rounded-lg border border-border group relative transition-all hover:border-sidebar-accent"
                    :class="typeof feat !== 'string' && feat.isAttack ? 'border-red-900/30 bg-red-950/10' : ''">
                    <Zap class="w-4 h-4 shrink-0 mt-1"
                      :class="typeof feat !== 'string' && feat.isAttack ? 'text-red-400' : 'text-primary'" />
                    <div class="flex-1 space-y-1 cursor-pointer"
                      @click="editMode ? openEditor('feat', feat, i as number) : null">
                      <div class="text-sm font-semibold leading-none flex items-center gap-2">
                        {{ typeof feat === 'string' ? resolveFormula(feat) : feat.title }}
                        <Pencil v-if="editMode" class="w-3 h-3 opacity-0 group-hover:opacity-50" />
                      </div>
                      <div v-if="typeof feat !== 'string' && feat.description"
                        class="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {{ resolveFormula(feat.description) }}
                      </div>
                      <div v-if="typeof feat !== 'string' && feat.rollFormula" class="mt-1">
                        <code
                          class="text-[10px] bg-zinc-950 border border-zinc-800 px-1.5 py-0.5 rounded text-muted-foreground font-mono">
                    🎲 {{ resolveFormula(feat.rollFormula) }}
                  </code>
                      </div>
                      <div v-if="typeof feat !== 'string' && feat.modifiers?.length" class="flex flex-wrap gap-1 mt-1">
                        <span v-for="(mod, mi) in feat.modifiers" :key="mi"
                          class="px-1.5 py-0.5 rounded bg-primary/10 text-[10px] font-bold text-primary uppercase">
                          {{ mod.target }}: {{ modStr(mod.value) }}
                        </span>
                      </div>
                    </div>
                    <button v-if="editMode" @click.stop="removeFeat(i as number)"
                      class="opacity-0 group-hover:opacity-100 text-destructive hover:text-red-400 transition-opacity mt-1">
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <!-- ── MAGIAS ── -->
          <TabsContent value="spells" class="mt-4">
            <Card>
              <CardHeader class="pb-3">
                <div class="flex flex-col gap-3">
                  <div class="flex items-center justify-between">
                    <CardTitle class="text-base flex items-center gap-2">
                      <BookOpen class="w-4 h-4 text-primary" /> Magias
                      <span class="text-xs font-normal text-muted-foreground">({{ filteredSpells.length }} de {{
                        d.spells?.length || 0 }})</span>
                    </CardTitle>
                    <Button v-if="editMode" @click="openEditor('spell')" size="sm" class="gap-1">
                      <Plus class="w-4 h-4" /> Nova Magia
                    </Button>
                  </div>

                  <!-- Spell Slots Widget -->
                  <div class="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
                    <div class="flex items-center justify-between mb-2">
                      <p class="text-xs font-bold text-muted-foreground uppercase tracking-wide">Slots de Magia</p>
                      <span class="text-[10px] text-muted-foreground">Usado / Máximo</span>
                    </div>
                    <div class="flex flex-wrap gap-2">
                      <div v-for="lvl in SPELL_LEVELS.filter(l => (spellSlotsMax[l] ?? 0) > 0 || editMode)" :key="lvl"
                        class="flex flex-col items-center gap-0.5 p-1.5 rounded bg-zinc-900 border border-zinc-800 min-w-[44px]">
                        <span class="text-[9px] font-bold text-muted-foreground uppercase">{{ lvl === 0 ? 'Truq' : `Nív
                          ${lvl}` }}</span>
                        <div class="flex items-center gap-0.5">
                          <button v-if="(spellSlotsMax as any)[lvl] > 0" @click="adjustSlotUsed(lvl, 1)"
                            class="w-5 h-5 rounded text-[10px] font-bold bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30 transition-colors">
                            +
                          </button>
                          <span class="text-sm font-bold tabular-nums min-w-[24px] text-center"
                            :class="((spellSlotsUsed as any)[lvl] ?? 0) >= ((spellSlotsMax as any)[lvl] ?? 0) ? 'text-red-400' : 'text-foreground'">
                            {{ (spellSlotsUsed as any)[lvl] ?? 0 }}/{{ (spellSlotsMax as any)[lvl] ?? 0 }}
                          </span>
                          <button v-if="(spellSlotsMax as any)[lvl] > 0" @click="adjustSlotUsed(lvl, -1)"
                            class="w-5 h-5 rounded text-[10px] font-bold bg-muted text-muted-foreground hover:bg-muted/60 border border-border transition-colors">
                            −
                          </button>
                        </div>
                        <!-- Adjust max in edit mode -->
                        <div v-if="editMode" class="flex items-center gap-0.5 mt-0.5">
                          <button @click="adjustSlotMax(lvl, -1)"
                            class="w-4 h-4 rounded text-[9px] bg-muted text-muted-foreground hover:bg-muted/60 border border-border">−</button>
                          <span class="text-[9px] text-muted-foreground px-0.5">máx</span>
                          <button @click="adjustSlotMax(lvl, 1)"
                            class="w-4 h-4 rounded text-[9px] bg-muted text-muted-foreground hover:bg-muted/60 border border-border">+</button>
                        </div>
                      </div>
                      <div v-if="SPELL_LEVELS.filter(l => (spellSlotsMax as any)[l] > 0).length === 0 && !editMode"
                        class="text-xs text-muted-foreground italic py-1">
                        Ative o modo edição para configurar slots.
                      </div>
                    </div>
                  </div>

                  <!-- Search + Filter bar -->
                  <div class="flex gap-2">
                    <div class="relative flex-1">
                      <Search
                        class="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <Input v-model="spellSearch" placeholder="Pesquisar magias..." class="pl-8 h-8 text-xs" />
                    </div>
                    <div class="flex gap-1 flex-wrap">
                      <button class="px-2.5 py-1 rounded text-xs font-bold border transition-colors"
                        :class="spellLevelFilter === null ? 'bg-primary/20 border-primary text-primary' : 'border-zinc-800 text-muted-foreground hover:border-zinc-700'"
                        @click="spellLevelFilter = null">
                        Todos
                      </button>
                      <button v-for="lvl in SPELL_LEVELS" :key="lvl"
                        class="px-2 py-1 rounded text-xs font-bold border transition-colors"
                        :class="spellLevelFilter === lvl ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'border-zinc-800 text-muted-foreground hover:border-zinc-700'"
                        @click="spellLevelFilter = spellLevelFilter === lvl ? null : lvl">
                        {{ lvl === 0 ? 'Truq' : `N${lvl}` }}
                      </button>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div v-if="!d.spells?.length" class="text-center py-8 text-muted-foreground italic">Nenhuma magia
                  registrada.
                </div>
                <div v-else-if="filteredSpells.length === 0" class="text-center py-8 text-muted-foreground italic">
                  Nenhuma
                  magia encontrada.</div>
                <div v-else class="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <div v-for="({ spell, i }) in filteredSpells" :key="i"
                    class="relative rounded-lg border p-3 group transition-all duration-200" :class="[
                      typeof spell !== 'string' && spell.isAttack
                        ? 'bg-red-950/10 border-red-900/30 hover:border-red-700/50'
                        : 'bg-muted/20 border-border hover:border-sidebar-accent',
                      dragOverIndex === i ? 'ring-2 ring-primary ring-offset-1 ring-offset-background scale-[0.98]' : '',
                      editMode ? 'cursor-grab active:cursor-grabbing' : ''
                    ]" :draggable="editMode" @dragstart="spellDragStart($event, i)"
                    @dragover="spellDragOver($event, i)" @drop="spellDrop($event, i)" @dragend="spellDragEnd"
                    @click="editMode ? openEditor('spell', spell, i) : null">
                    <!-- Level badge -->
                    <div class="absolute top-2 right-2 flex items-center gap-1">
                      <span v-if="typeof spell !== 'string' && spell.spellLevel >= 0"
                        class="text-[10px] font-bold tabular-nums rounded px-1.5 py-0.5 bg-muted border border-border text-muted-foreground">{{
                          spell.spellLevel === 0 ? 'Truq.' : `N${spell.spellLevel}` }}</span>
                      <span v-if="typeof spell !== 'string' && spell.isAttack"
                        class="text-[9px] font-bold rounded px-1 py-0.5 bg-red-950 border border-red-900 text-red-400">ATK</span>
                    </div>

                    <!-- Icon + Title -->
                    <div class="flex items-start gap-2 pr-10 mb-1">
                      <BookOpen class="w-3.5 h-3.5 shrink-0 mt-0.5"
                        :class="typeof spell !== 'string' && spell.isAttack ? 'text-red-400' : 'text-primary'" />
                      <p class="text-sm font-semibold leading-tight">
                        {{ typeof spell === 'string' ? resolveFormula(spell) : spell.title }}
                      </p>
                    </div>

                    <!-- Description -->
                    <p v-if="typeof spell !== 'string' && spell.description"
                      class="text-xs text-muted-foreground line-clamp-2 mb-1.5 pl-5">
                      {{ resolveFormula(spell.description) }}
                    </p>

                    <!-- Roll Formula -->
                    <code v-if="typeof spell !== 'string' && spell.rollFormula"
                      class="text-[10px] bg-zinc-950 border border-zinc-800 px-1.5 py-0.5 rounded text-muted-foreground font-mono block w-full text-center mt-1">
                🎲 {{ resolveFormula(spell.rollFormula) }}
              </code>

                    <!-- Modifiers -->
                    <div v-if="typeof spell !== 'string' && spell.modifiers?.length"
                      class="flex flex-wrap gap-1 mt-1.5 pl-5">
                      <span v-for="(mod, mi) in spell.modifiers" :key="mi"
                        class="px-1.5 py-0.5 rounded bg-primary/10 text-[10px] font-bold text-primary uppercase">
                        {{ mod.target }}: {{ modStr(mod.value) }}
                      </span>
                    </div>

                    <!-- Edit Mode Overlay -->
                    <div v-if="editMode"
                      class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity rounded-lg z-10">
                      <Button size="icon" variant="outline" class="h-7 w-7" @click.stop="openEditor('spell', spell, i)">
                        <Pencil class="w-3 h-3" />
                      </Button>
                      <Button size="icon" variant="destructive" class="h-7 w-7" @click.stop="removeSpell(i)">
                        <Trash2 class="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <!-- ── ATALHOS ── -->
          <TabsContent value="shortcuts" class="mt-4">
            <div class="space-y-4">
              <div class="flex justify-between items-center" v-if="editMode">
                <p class="text-xs text-muted-foreground">Adicione ataques, poções ou ações frequentes.</p>
                <Button @click="openEditor('shortcut')" size="sm" class="gap-1">
                  <Plus class="w-4 h-4" /> Novo Atalho
                </Button>
              </div>

              <div v-if="!d.shortcuts?.length"
                class="text-center py-12 text-muted-foreground/50 border-2 border-dashed border-zinc-800 rounded-lg">
                <Sword class="w-12 h-12 mx-auto mb-2 opacity-20" />
                <span>Nenhum atalho criado.</span>
              </div>

              <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Card v-for="(sc, i) in d.shortcuts" :key="i"
                  class="bg-zinc-900/50 hover:bg-zinc-900 border-zinc-800 transition-colors group relative overflow-hidden"
                  @click="editMode ? openEditor('shortcut', sc, i as number) : null">
                  <!-- edit overlay -->
                  <div v-if="editMode"
                    class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity z-10">
                    <Button size="icon" variant="outline" class="h-8 w-8 rounded-full"
                      @click="openEditor('shortcut', sc, i as number)">
                      <Pencil class="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="destructive" class="h-8 w-8 rounded-full"
                      @click.stop="removeShortcut(i as number)">
                      <Trash2 class="w-4 h-4" />
                    </Button>
                  </div>

                  <CardHeader class="p-3 pb-2 flex flex-row items-center justify-between space-y-0">
                    <CardTitle class="text-sm font-bold truncate pr-6">{{ sc.title }}</CardTitle>
                    <div class="flex items-center gap-2">
                      <div v-if="sc.cost"
                        class="text-[10px] font-mono bg-zinc-950 px-1.5 py-0.5 rounded text-zinc-400 border border-zinc-800">
                        {{ sc.cost }}</div>
                    </div>
                  </CardHeader>
                  <CardContent class="p-3 pt-0 space-y-2">
                    <div v-if="sc.description" class="text-xs text-muted-foreground line-clamp-2 min-h-[1.5em]">{{
                      resolveFormula(sc.description) }}</div>

                    <div class="flex items-center gap-2 mt-2">
                      <div v-if="sc.attackBonus"
                        class="flex-1 bg-zinc-950 rounded p-1.5 border border-zinc-900 text-center">
                        <div class="text-[9px] uppercase text-zinc-500 font-bold mb-0.5">Acerto</div>
                        <div class="font-mono text-sm font-bold text-green-400">{{ sc.attackBonus }}</div>
                      </div>
                      <div v-if="sc.rollFormula"
                        class="flex-[2] bg-zinc-950 rounded p-1.5 border border-zinc-900 text-center">
                        <div class="text-[9px] uppercase text-zinc-500 font-bold mb-0.5">Dano / Efeito</div>
                        <div class="font-mono text-sm font-bold text-amber-400">{{ resolveFormula(sc.rollFormula) }}
                        </div>
                      </div>
                    </div>

                    <div v-if="sc.modifiers?.length" class="flex flex-wrap gap-1 pt-1">
                      <span v-for="(mod, mi) in sc.modifiers" :key="mi"
                        class="px-1.5 py-0.5 rounded bg-zinc-800 text-[9px] text-zinc-400 uppercase">
                        {{ mod.target }}: {{ modStr(mod.value) }}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <!-- ── ITENS ── -->
          <TabsContent value="items" class="mt-4">
            <Card>
              <CardHeader>
                <CardTitle class="text-base flex items-center gap-2">
                  <Package class="w-4 h-4 text-primary" />Equipamento
                </CardTitle>
              </CardHeader>
              <CardContent class="space-y-3">
                <div v-if="editMode" class="flex gap-2">
                  <Input v-model="newItem" placeholder="Nome do item..." @keyup.enter="addItem" class="flex-1" />
                  <Button @click="addItem" size="sm" class="gap-1">
                    <Plus class="w-4 h-4" /> Adicionar
                  </Button>
                </div>
                <div v-if="!d.equipment?.length" class="text-center py-8 text-muted-foreground italic">Nenhum item no
                  inventário.</div>
                <ul v-else class="space-y-2">
                  <li v-for="(item, i) in d.equipment" :key="i"
                    class="flex items-center gap-3 p-3 bg-amber-950/20 rounded-lg border border-amber-900/30 group">
                    <Package class="w-4 h-4 text-amber-400 shrink-0" />
                    <span class="text-sm font-medium flex-1">{{ resolveFormula(item) }}</span>
                    <button v-if="editMode" @click="removeItem(i as number)"
                      class="opacity-0 group-hover:opacity-100 text-destructive hover:text-red-400 transition-opacity">
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <!-- ── CONFIGURAÇÕES ── -->
          <TabsContent value="config" class="mt-4 space-y-4">
            <div class="p-3 bg-primary/5 border border-primary/20 rounded-lg text-sm text-muted-foreground">
              <span class="text-primary font-semibold">Modificadores</span> — Bônus extras (equipamentos, magia, raça)
              somados
              automaticamente aos valores base.
            </div>

            <div class="grid md:grid-cols-3 gap-4">

              <!-- ① Bônus Atributos -->
              <Card>
                <CardHeader class="pb-2">
                  <CardTitle class="text-sm text-muted-foreground uppercase tracking-wider">Bônus de Atributos
                  </CardTitle>
                </CardHeader>
                <CardContent class="space-y-0 divide-y divide-border/40">
                  <div v-for="key in ATTR_KEYS" :key="key" class="flex items-center justify-between py-2">
                    <span class="text-xs text-muted-foreground">{{ ATTR_LABELS[key] }}</span>
                    <div v-if="editMode" class="flex items-center gap-1">
                      <button @click="adjustField(editedData.bonuses.attributes, key, -1)"
                        class="w-6 h-6 rounded bg-muted hover:bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                        <Minus class="w-3 h-3" />
                      </button>
                      <span class="w-8 text-center text-sm font-bold tabular-nums">{{ editedData.bonuses.attributes[key]
                        ?? 0
                      }}</span>
                      <button @click="adjustField(editedData.bonuses.attributes, key, 1)"
                        class="w-6 h-6 rounded bg-muted hover:bg-primary/20 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                        <Plus class="w-3 h-3" />
                      </button>
                    </div>
                    <span v-else class="text-sm font-bold">{{ modStr(b.attributes?.[key] ?? 0) }}</span>
                  </div>
                </CardContent>
              </Card>

              <!-- ② Movimento & Iniciativa -->
              <Card>
                <CardHeader class="pb-2">
                  <CardTitle class="text-sm text-muted-foreground uppercase tracking-wider">Movimento &amp; Iniciativa
                  </CardTitle>
                </CardHeader>
                <CardContent class="space-y-0 divide-y divide-border/40">
                  <div class="flex items-center justify-between py-2">
                    <span class="text-xs text-muted-foreground">Desl. base (m)</span>
                    <div v-if="editMode" class="flex items-center gap-1">
                      <button @click="adjustField(editedData, 'speed', -1)"
                        class="w-6 h-6 rounded bg-muted hover:bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                        <Minus class="w-3 h-3" />
                      </button>
                      <span class="w-8 text-center text-sm font-bold tabular-nums">{{ editedData.speed ?? 9 }}</span>
                      <button @click="adjustField(editedData, 'speed', 1)"
                        class="w-6 h-6 rounded bg-muted hover:bg-primary/20 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                        <Plus class="w-3 h-3" />
                      </button>
                    </div>
                    <span v-else class="text-sm font-bold">{{ d.speed ?? 9 }}</span>
                  </div>
                  <div class="flex items-center justify-between py-2">
                    <span class="text-xs text-muted-foreground">Bônus Desl.</span>
                    <div v-if="editMode" class="flex items-center gap-1">
                      <button @click="adjustField(editedData.bonuses, 'speed', -1)"
                        class="w-6 h-6 rounded bg-muted hover:bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                        <Minus class="w-3 h-3" />
                      </button>
                      <span class="w-8 text-center text-sm font-bold tabular-nums">{{ editedData.bonuses.speed ?? 0
                      }}</span>
                      <button @click="adjustField(editedData.bonuses, 'speed', 1)"
                        class="w-6 h-6 rounded bg-muted hover:bg-primary/20 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                        <Plus class="w-3 h-3" />
                      </button>
                    </div>
                    <span v-else class="text-sm font-bold">{{ modStr(b.speed ?? 0) }}</span>
                  </div>
                  <div class="flex items-center justify-between py-2">
                    <span class="text-xs text-muted-foreground">Inic. misc</span>
                    <div v-if="editMode" class="flex items-center gap-1">
                      <button @click="adjustField(editedData, 'initiative_misc', -1)"
                        class="w-6 h-6 rounded bg-muted hover:bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                        <Minus class="w-3 h-3" />
                      </button>
                      <span class="w-8 text-center text-sm font-bold tabular-nums">{{ editedData.initiative_misc ?? 0
                      }}</span>
                      <button @click="adjustField(editedData, 'initiative_misc', 1)"
                        class="w-6 h-6 rounded bg-muted hover:bg-primary/20 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                        <Plus class="w-3 h-3" />
                      </button>
                    </div>
                    <span v-else class="text-sm font-bold">{{ d.initiative_misc ?? 0 }}</span>
                  </div>
                  <div class="flex items-center justify-between py-2">
                    <span class="text-xs text-muted-foreground">Bônus Inic.</span>
                    <div v-if="editMode" class="flex items-center gap-1">
                      <button @click="adjustField(editedData.bonuses, 'initiative', -1)"
                        class="w-6 h-6 rounded bg-muted hover:bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                        <Minus class="w-3 h-3" />
                      </button>
                      <span class="w-8 text-center text-sm font-bold tabular-nums">{{ editedData.bonuses.initiative ?? 0
                      }}</span>
                      <button @click="adjustField(editedData.bonuses, 'initiative', 1)"
                        class="w-6 h-6 rounded bg-muted hover:bg-primary/20 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                        <Plus class="w-3 h-3" />
                      </button>
                    </div>
                    <span v-else class="text-sm font-bold">{{ modStr(b.initiative ?? 0) }}</span>
                  </div>
                </CardContent>
              </Card>

              <!-- ③ Componentes CA -->
              <Card>
                <CardHeader class="pb-2">
                  <CardTitle class="text-sm text-muted-foreground uppercase tracking-wider">Componentes de CA
                  </CardTitle>
                </CardHeader>
                <CardContent class="space-y-0 divide-y divide-border/40">
                  <div v-for="f in CA_FIELDS" :key="f.field" class="flex items-center justify-between py-2">
                    <span class="text-xs text-muted-foreground">{{ f.label }}</span>
                    <div v-if="editMode" class="flex items-center gap-1">
                      <button @click="adjustField(editedData, f.field, -1)"
                        class="w-6 h-6 rounded bg-muted hover:bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                        <Minus class="w-3 h-3" />
                      </button>
                      <span class="w-8 text-center text-sm font-bold tabular-nums">{{ editedData[f.field] ?? 0 }}</span>
                      <button @click="adjustField(editedData, f.field, 1)"
                        class="w-6 h-6 rounded bg-muted hover:bg-primary/20 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                        <Plus class="w-3 h-3" />
                      </button>
                    </div>
                    <span v-else class="text-sm font-bold">{{ d[f.field] ?? 0 }}</span>
                  </div>
                  <div class="flex items-center justify-between py-2">
                    <span class="text-xs text-muted-foreground">Bônus CA (misc)</span>
                    <div v-if="editMode" class="flex items-center gap-1">
                      <button @click="adjustField(editedData.bonuses, 'ca', -1)"
                        class="w-6 h-6 rounded bg-muted hover:bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                        <Minus class="w-3 h-3" />
                      </button>
                      <span class="w-8 text-center text-sm font-bold tabular-nums">{{ editedData.bonuses.ca ?? 0
                      }}</span>
                      <button @click="adjustField(editedData.bonuses, 'ca', 1)"
                        class="w-6 h-6 rounded bg-muted hover:bg-primary/20 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                        <Plus class="w-3 h-3" />
                      </button>
                    </div>
                    <span v-else class="text-sm font-bold">{{ modStr(b.ca ?? 0) }}</span>
                  </div>
                </CardContent>
              </Card>

              <!-- ④ Testes de Resistência -->
              <Card>
                <CardHeader class="pb-2">
                  <CardTitle class="text-sm text-muted-foreground uppercase tracking-wider">Testes de Resistência
                  </CardTitle>
                </CardHeader>
                <CardContent class="space-y-0 divide-y divide-border/40">
                  <div v-for="f in SAVE_FIELDS" :key="f.field" class="flex items-center justify-between py-2">
                    <span class="text-xs text-muted-foreground">{{ f.label }}</span>
                    <div v-if="editMode" class="flex items-center gap-1">
                      <button @click="adjustField(editedData, f.field, -1)"
                        class="w-6 h-6 rounded bg-muted hover:bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                        <Minus class="w-3 h-3" />
                      </button>
                      <span class="w-8 text-center text-sm font-bold tabular-nums">{{ editedData[f.field] ?? 0 }}</span>
                      <button @click="adjustField(editedData, f.field, 1)"
                        class="w-6 h-6 rounded bg-muted hover:bg-primary/20 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                        <Plus class="w-3 h-3" />
                      </button>
                    </div>
                    <span v-else class="text-sm font-bold">{{ d[f.field] ?? 0 }}</span>
                  </div>
                  <div v-for="f in SAVE_BONUS_FIELDS" :key="f.field" class="flex items-center justify-between py-2">
                    <span class="text-xs text-muted-foreground">{{ f.label }}</span>
                    <div v-if="editMode" class="flex items-center gap-1">
                      <button @click="adjustField(editedData.bonuses.saves, f.field, -1)"
                        class="w-6 h-6 rounded bg-muted hover:bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                        <Minus class="w-3 h-3" />
                      </button>
                      <span class="w-8 text-center text-sm font-bold tabular-nums">{{ editedData.bonuses.saves[f.field]
                        ?? 0
                      }}</span>
                      <button @click="adjustField(editedData.bonuses.saves, f.field, 1)"
                        class="w-6 h-6 rounded bg-muted hover:bg-primary/20 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                        <Plus class="w-3 h-3" />
                      </button>
                    </div>
                    <span v-else class="text-sm font-bold">{{ modStr(b.saves?.[f.field] ?? 0) }}</span>
                  </div>
                </CardContent>
              </Card>

              <!-- ⑤ Resistências Elementais -->
              <Card>
                <CardHeader class="pb-2">
                  <CardTitle class="text-sm text-muted-foreground uppercase tracking-wider">Resistências Elementais
                  </CardTitle>
                </CardHeader>
                <CardContent class="space-y-0 divide-y divide-border/40">
                  <div v-for="f in ELEM_FIELDS" :key="f.field" class="flex items-center justify-between py-2">
                    <span class="text-xs text-muted-foreground">{{ f.label }}</span>
                    <div v-if="editMode" class="flex items-center gap-1">
                      <button @click="adjustField(editedData.bonuses.resistances, f.field, -1)"
                        class="w-6 h-6 rounded bg-muted hover:bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                        <Minus class="w-3 h-3" />
                      </button>
                      <span class="w-8 text-center text-sm font-bold tabular-nums">{{
                        editedData.bonuses.resistances[f.field]
                        ?? 0 }}</span>
                      <button @click="adjustField(editedData.bonuses.resistances, f.field, 1)"
                        class="w-6 h-6 rounded bg-muted hover:bg-primary/20 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                        <Plus class="w-3 h-3" />
                      </button>
                    </div>
                    <span v-else class="text-sm font-bold">{{ b.resistances?.[f.field] ?? 0 }}</span>
                  </div>
                </CardContent>
              </Card>

              <!-- ⑥ Notas -->
              <Card>
                <CardHeader class="pb-2">
                  <CardTitle class="text-sm text-muted-foreground uppercase tracking-wider">Notas</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea v-if="editMode" v-model="editedData.bonuses.notes" class="min-h-[8rem] text-sm"
                    placeholder="Ex: +2 FOR (Cinto), +4 CA (Manto +2)..." />
                  <p v-else class="text-sm text-muted-foreground whitespace-pre-wrap italic">{{ b.notes ||
                    'Nenhuma nota.' }}
                  </p>
                </CardContent>
              </Card>

            </div>

          </TabsContent>

          <!-- ── RECURSOS DE CLASSE ── -->
          <TabsContent value="resources" class="mt-4">
            <Card>
              <CardHeader class="flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle class="text-base">Recursos de Classe</CardTitle>
                  <p class="text-xs text-muted-foreground mt-0.5">Fúria, Música Bárdica, Imposição de Mãos...</p>
                </div>
                <div class="flex items-center gap-2">
                  <span v-if="savingRes" class="text-[10px] text-muted-foreground animate-pulse">Salvando...</span>
                  <Button v-if="sheet?.data.resources?.length" variant="outline" size="sm" @click="resetResources"
                    class="gap-1 text-xs h-7">
                    <RefreshCw class="w-3 h-3" /> Restaurar
                  </Button>
                </div>
              </CardHeader>
              <CardContent class="space-y-4">

                <!-- Add form (edit mode) -->
                <div v-if="editMode" class="flex gap-2 items-end p-3 rounded-lg bg-muted/30 border border-border">
                  <div class="flex-1 space-y-1">
                    <Label class="text-xs">Nome do recurso</Label>
                    <Input v-model="newResName" placeholder="Ex: Fúria, Música Bárdica..." class="h-8" />
                  </div>
                  <div class="w-20 space-y-1">
                    <Label class="text-xs">Máximo/dia</Label>
                    <Input v-model.number="newResMax" type="number" min="1" max="99" class="h-8 text-center" />
                  </div>
                  <Button size="sm" @click="addResource" :disabled="!newResName.trim()" class="h-8 shrink-0">
                    <Plus class="w-3 h-3 mr-1" /> Adicionar
                  </Button>
                </div>

                <!-- Empty state -->
                <div v-if="!sheet?.data.resources?.length"
                  class="text-center py-10 text-muted-foreground/40 border-2 border-dashed border-zinc-800 rounded-xl">
                  <Flame class="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p class="text-sm">Nenhum recurso cadastrado.</p>
                  <p v-if="!editMode" class="text-xs mt-1 opacity-70">Ative o modo edição para adicionar.</p>
                </div>

                <!-- Resource cards -->
                <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div v-for="(res, i) in sheet.data.resources" :key="i"
                    class="relative rounded-xl border border-border bg-zinc-900/60 p-4 space-y-3 hover:border-zinc-700 transition-colors">

                    <!-- Header row -->
                    <div class="flex items-start justify-between gap-2">
                      <div>
                        <p class="font-bold text-sm text-foreground">{{ res.name }}</p>
                        <p class="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">por dia</p>
                      </div>
                      <button v-if="editMode" @click="removeResource(i as number)"
                        class="text-muted-foreground hover:text-destructive p-1 rounded-md hover:bg-destructive/10 transition-colors shrink-0">
                        <X class="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <!-- Dot pips (≤ 12) or numeric (> 12) -->
                    <div v-if="res.max <= 12" class="flex flex-wrap gap-1.5">
                      <div v-for="j in res.max" :key="j"
                        class="w-5 h-5 rounded-full border-2 transition-all duration-150 cursor-pointer" :class="j <= (res.current ?? res.max)
                          ? 'bg-primary border-primary shadow-[0_0_6px_rgba(var(--primary),0.5)]'
                          : 'bg-transparent border-zinc-700 opacity-40'"
                        @click="adjustResource(i as number, j <= (res.current ?? res.max) ? -1 : 1)">
                      </div>
                    </div>
                    <div v-else class="text-center">
                      <span class="text-3xl font-extrabold font-serif tabular-nums"
                        :class="(res.current ?? res.max) === 0 ? 'text-red-400' : 'text-primary'">
                        {{ res.current ?? res.max }}
                      </span>
                      <span class="text-lg text-muted-foreground">/{{ res.max }}</span>
                    </div>

                    <!-- +/- controls -->
                    <div class="flex items-center justify-between pt-1 border-t border-border/40">
                      <button @click="adjustResource(i as number, -1)" :disabled="(res.current ?? res.max) <= 0"
                        class="flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-bold bg-muted hover:bg-red-950/40 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                        <Minus class="w-3 h-3" /> Usar
                      </button>
                      <span class="text-xs text-muted-foreground tabular-nums font-mono">
                        {{ res.current ?? res.max }}&nbsp;/&nbsp;{{ res.max }}
                      </span>
                      <button @click="adjustResource(i as number, 1)" :disabled="(res.current ?? res.max) >= res.max"
                        class="flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-bold bg-muted hover:bg-primary/20 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                        <Plus class="w-3 h-3" /> Recuperar
                      </button>
                    </div>

                  </div>
                </div>

              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

      </div>
    </div>
  </div>

  <!-- GENERIC EDITOR MODAL -->
  <div v-if="isEditorOpen" class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
    <Card class="w-full max-w-md bg-zinc-950 border-zinc-800 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
      <CardHeader class="pb-3 border-b border-border/40">
        <CardTitle class="flex items-center gap-2">
          <component :is="editingType === 'spell' ? BookOpen : editingType === 'shortcut' ? Sword : Zap"
            class="w-4 h-4 text-primary" />
          {{ editingIndex === -1 ? 'Novo' : 'Editar' }}
          {{ editingType === 'feat' ? 'Talento' : editingType === 'spell' ? 'Magia' : 'Atalho' }}
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-4 pt-4 h-[60vh] overflow-y-auto custom-scrollbar">
        <div class="space-y-1">
          <Label>Título</Label>
          <Input v-model="tempItem.title" placeholder="Ex: Bola de Fogo" />
        </div>

        <div v-if="editingType === 'spell'" class="space-y-1">
          <Label>Nível da Magia (0-9)</Label>
          <Input type="number" v-model.number="tempItem.spellLevel" class="w-full" placeholder="1" />
        </div>
        <div v-if="editingType === 'shortcut'" class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <Label>Bônus Ataque</Label>
            <Input v-model="tempItem.attackBonus" placeholder="+5" />
          </div>
          <div class="space-y-1">
            <Label>Custo/Uso</Label>
            <Input v-model="tempItem.cost" placeholder="1/dia" />
          </div>
        </div>

        <div class="space-y-1">
          <Label>Descrição</Label>
          <Textarea v-model="tempItem.description" placeholder="Descrição..." class="min-h-[80px] bg-zinc-900/50" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <Label>{{ editingType === 'shortcut' ? 'Dano / Efeito' : 'Fórmula' }}</Label>
            <Input v-model="tempItem.rollFormula" placeholder="Ex: 1d8 + @strMod" />
          </div>
          <div class="flex items-center gap-2 pt-6">
            <input type="checkbox" id="isAtk" v-model="tempItem.isAttack"
              class="w-4 h-4 rounded border-zinc-700 bg-zinc-900 accent-primary" />
            <Label for="isAtk" class="cursor-pointer">É um Ataque?</Label>
          </div>
        </div>

        <div class="space-y-2 pt-2">
          <div class="flex items-center justify-between">
            <Label>Modificadores Ativos</Label>
            <span class="text-[10px] text-muted-foreground">Afeta totais da ficha</span>
          </div>
          <div class="max-h-[150px] overflow-y-auto space-y-2 pr-1">
            <div v-for="(mod, i) in tempItem.modifiers" :key="i" class="flex gap-2 items-center">
              <select v-model="mod.target"
                class="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option v-for="t in MODIFIER_TARGETS" :key="t.value" :value="t.value">{{ t.label }}</option>
              </select>
              <Input type="number" v-model.number="mod.value" class="w-20 text-center" placeholder="+1" />
              <button @click="removeModifier(i as number)"
                class="text-muted-foreground hover:text-destructive p-1 rounded-md hover:bg-muted">
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
          <Button @click="addModifier" variant="outline" size="sm"
            class="w-full border-dashed text-muted-foreground hover:text-foreground">
            <Plus class="w-3 h-3 h-3 mr-1" /> Adicionar Modificador
          </Button>
        </div>

      </CardContent>
      <div class="p-4 border-t border-border/40 flex justify-end gap-2 bg-zinc-900/50">
        <Button variant="ghost" @click="isEditorOpen = false">Cancelar</Button>
        <Button @click="saveEditor" :disabled="!tempItem.title">Salvar</Button>
      </div>
    </Card>
    <!-- Chat Overlay -->
    <SheetChatOverlay v-if="showChat" @close="showChat = false" />
  </div>
</template>
