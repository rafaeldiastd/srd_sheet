<script setup lang="ts">
import { ref, computed } from 'vue'
import { Wand2, Trash2, ChevronDown, Copy, Search, Plus, ChevronUp, X, BookOpen, Sparkles, Check, Moon, RotateCcw } from 'lucide-vue-next'

const props = defineProps<{
  d: any
  editMode: boolean
  tabsEditMode: boolean
  spellSlotsMax: Record<number, number>
  spellSlotsUsed: Record<number, number>
  preparedSpells: Record<number, (string | null)[]>
  spentSlots: Record<number, boolean[]>
  SPELL_LEVELS: number[]
  modStr: (n: number) => string
  resolveFormula: (formula: string) => string
  onOpenEditor: (type: string, item?: any, index?: number) => void
  onDelete: (type: string, index: number) => void
  onSpellRoll: (spell: any) => void
  onAdjustSlot: (level: number, delta: number, field: 'used' | 'max') => void
  onSetPreparedSpell: (level: number, slotIndex: number, spellId: string | null) => void
  onClearAllPrepared: () => void
  onSpendSlot: (level: number, slotIndex: number) => void
  onRecoverSlot: (level: number, slotIndex: number) => void
  onRecoverAllSlots: () => void
  onApplyBuff: (name: string, value: string) => void
  onToggleEdit: () => void
  onClone: (index: number) => void
}>()

// ── Internal sub-tabs ──────────────────────────────────────────────────
const activeTab = ref<'prepared' | 'grimoire'>('prepared')

// ── Grimório ───────────────────────────────────────────────────────────
const grimoireSearch = ref('')
const expandedIndexes = ref<number[]>([])

function toggleExpand(i: number) {
  const idx = expandedIndexes.value.indexOf(i)
  if (idx >= 0) expandedIndexes.value.splice(idx, 1)
  else expandedIndexes.value.push(i)
}
function isExpanded(i: number) {
  return expandedIndexes.value.includes(i)
}

const filteredGrimoireSpells = computed(() => {
  const groups: Record<number, { spell: any; index: number }[]> = {}
  const search = grimoireSearch.value.toLowerCase()
  props.d?.spells?.forEach((sp: any, i: number) => {
    if (search && !sp.title?.toLowerCase().includes(search) && !sp.school?.toLowerCase().includes(search)) return
    const lv = sp.spellLevel ?? 0
    if (!groups[lv]) groups[lv] = []
    groups[lv].push({ spell: sp, index: i })
  })
  return groups
})
const usedGrimoireLevels = computed(() =>
  Object.keys(filteredGrimoireSpells.value).map(Number).sort((a, b) => a - b)
)

// ── Helpers ────────────────────────────────────────────────────────────
function findSpellByTitle(title: string | null) {
  if (!title) return null
  return props.d?.spells?.find((sp: any) => sp.title === title) ?? null
}

function getSlotSpellTitle(level: number, slotIdx: number): string {
  return props.preparedSpells[level]?.[slotIdx] ?? ''
}

function handlePreparedRoll(spellTitle: string, spell: any) {
  if (spell) props.onSpellRoll(spell)
}

/** Lançar = rola E gasta o slot (magia fica preparada mas cinza) */
function handleCastSpell(spellTitle: string, level: number, slotIndex: number) {
  const spell = findSpellByTitle(spellTitle)
  if (spell) {
    props.onSpellRoll(spell)
    if (spell.applyBuffName) props.onApplyBuff(spell.applyBuffName, spell.applyBuffValue || '')
  }
  props.onSpendSlot(level, slotIndex)
}

function isSpent(level: number, slotIdx: number): boolean {
  return props.spentSlots?.[level]?.[slotIdx] === true
}

/** Quantos slots gastos neste nível */
function spentCount(level: number): number {
  return (props.spentSlots?.[level] ?? []).filter(Boolean).length
}


// ── Levels that are visible in prepared tab ────────────────────────────
const slotLevels = computed(() =>
  props.SPELL_LEVELS.filter(lvl => (props.spellSlotsMax[lvl] ?? 0) > 0)
)

// ── Picker state (which slot is being filled) ──────────────────────────
const pickerSlot = ref<{ level: number; slotIdx: number } | null>(null)
const pickerSearch = ref('')

function openPicker(level: number, slotIdx: number) {
  pickerSlot.value = { level, slotIdx }
  pickerSearch.value = ''
}
function closePicker() {
  pickerSlot.value = null
  pickerSearch.value = ''
}
function isPicker(level: number, slotIdx: number) {
  return pickerSlot.value?.level === level && pickerSlot.value?.slotIdx === slotIdx
}
function pickSpell(title: string) {
  if (!pickerSlot.value) return
  props.onSetPreparedSpell(pickerSlot.value.level, pickerSlot.value.slotIdx, title)
  closePicker()
}

// Filtered spells for the picker (matching the slot's level, or all levels)
const pickerSpells = computed(() => {
  if (!pickerSlot.value) return []
  const search = pickerSearch.value.toLowerCase()
  const level = pickerSlot.value.level
  // Show all spells from the grimoire that match the selected level (or cantrips at level 0)
  const sourceSpells = props.d?.spells ?? []
  return sourceSpells
    .map((sp: any, i: number) => ({ sp, i }))
    .filter(({ sp }: { sp: any }) => {
      const lvMatch = (sp.spellLevel ?? 0) === level
      const txtMatch = !search || sp.title?.toLowerCase().includes(search) || sp.school?.toLowerCase().includes(search)
      return lvMatch && txtMatch
    })
})
const pickerSpellsAllLevels = computed(() => {
  if (!pickerSlot.value) return []
  const search = pickerSearch.value.toLowerCase()
  const sourceSpells = props.d?.spells ?? []
  return sourceSpells
    .map((sp: any, i: number) => ({ sp, i }))
    .filter(({ sp }: { sp: any }) => {
      return !search || sp.title?.toLowerCase().includes(search) || sp.school?.toLowerCase().includes(search)
    })
})
const showAllLevels = ref(false)
const finalPickerSpells = computed(() => showAllLevels.value ? pickerSpellsAllLevels.value : pickerSpells.value)

// ── Slot quantity editor ───────────────────────────────────────────────
// levelSlotInput holds the user's raw text input for each level
const levelSlotInput = ref<Record<number, string>>({})

function getSlotInput(level: number): string {
  if (levelSlotInput.value[level] !== undefined) return levelSlotInput.value[level]
  return String(props.spellSlotsMax[level] ?? 0)
}
function onSlotInputChange(level: number, val: string) {
  levelSlotInput.value[level] = val
}
function commitSlotInput(level: number) {
  const raw = levelSlotInput.value[level]
  if (raw === undefined) return
  const n = parseInt(raw)
  if (isNaN(n) || n < 0) {
    levelSlotInput.value[level] = String(props.spellSlotsMax[level] ?? 0)
    return
  }
  const current = props.spellSlotsMax[level] ?? 0
  const diff = n - current
  if (diff !== 0) props.onAdjustSlot(level, diff, 'max')
  delete levelSlotInput.value[level]
}

// ── Slot configuration panel (visible at top of prepared tab) ──────────
const showSlotConfig = ref(false)
</script>

<template>
  <div class="space-y-4">

    <!-- INTERNAL TABS -->
    <div class="flex gap-2 p-1 bg-zinc-900/40 rounded-xl border border-zinc-800/60 w-fit">
      <button @click="activeTab = 'prepared'"
        class="px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5"
        :class="activeTab === 'prepared' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'">
        <Wand2 class="w-3.5 h-3.5" /> Magias Preparadas
      </button>
      <button @click="activeTab = 'grimoire'"
        class="px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5"
        :class="activeTab === 'grimoire' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'">
        <BookOpen class="w-3.5 h-3.5" /> Grimório
      </button>
    </div>

    <!-- ────────── PREPARED TAB ────────── -->
    <template v-if="activeTab === 'prepared'">

      <!-- ── Slot Configuration Panel ── -->
      <div class="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
        <!-- Header (always visible) -->
        <button
          class="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800/30 transition-colors"
          @click="showSlotConfig = !showSlotConfig">
          <div class="flex items-center gap-2">
            <Sparkles class="w-4 h-4 text-violet-400" />
            <span class="text-sm font-bold text-zinc-300">Configurar Espaços de Magia</span>
            <span class="text-xs text-zinc-600">
              ({{ slotLevels.length }} nív{{ slotLevels.length === 1 ? 'el' : 'eis' }} ativos)
            </span>
          </div>
          <ChevronDown class="w-4 h-4 text-zinc-500 transition-transform duration-200"
            :class="showSlotConfig ? 'rotate-180' : ''" />
        </button>

        <!-- Collapsible config grid -->
        <div v-show="showSlotConfig" class="border-t border-zinc-800 px-4 py-4">
          <p class="text-xs text-zinc-500 mb-4">
            Defina quantos espaços de magia você tem em cada nível. Deixe 0 para ocultar o nível.
          </p>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            <div v-for="level in SPELL_LEVELS" :key="'cfg-' + level"
              class="flex flex-col items-center gap-1.5 bg-zinc-950/60 rounded-xl p-3 border border-zinc-800/60">
              <span class="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                {{ level === 0 ? 'Truques' : `Nível ${level}` }}
              </span>
              <div class="flex items-center gap-1">
                <button
                  @click="onAdjustSlot(level, -1, 'max')"
                  class="w-6 h-6 flex items-center justify-center rounded-md bg-zinc-800 text-zinc-400 hover:text-red-400 hover:bg-zinc-700 transition-colors text-sm font-bold">
                  −
                </button>
                <input
                  type="number"
                  min="0"
                  max="20"
                  class="w-10 h-7 text-center text-sm font-bold bg-zinc-900 border border-zinc-700 rounded-md text-zinc-200 focus:outline-none focus:border-violet-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  :value="getSlotInput(level)"
                  @input="onSlotInputChange(level, ($event.target as HTMLInputElement).value)"
                  @blur="commitSlotInput(level)"
                  @keydown.enter="commitSlotInput(level)"
                />
                <button
                  @click="onAdjustSlot(level, 1, 'max')"
                  class="w-6 h-6 flex items-center justify-center rounded-md bg-zinc-800 text-zinc-400 hover:text-green-400 hover:bg-zinc-700 transition-colors text-sm font-bold">
                  +
                </button>
              </div>
              <span class="text-[10px] text-zinc-600">
                {{ spellSlotsMax[level] ?? 0 }} slot{{ (spellSlotsMax[level] ?? 0) !== 1 ? 's' : '' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Empty State ── -->
      <div v-if="slotLevels.length === 0"
        class="text-center py-14 bg-zinc-950/40 border border-dashed border-zinc-800 rounded-xl">
        <Wand2 class="w-10 h-10 text-zinc-700 mx-auto mb-3" />
        <p class="text-zinc-400 font-medium">Nenhum espaço de magia configurado.</p>
        <p class="text-zinc-600 text-sm mt-1">Use o painel acima para definir seus slots por nível.</p>
        <button @click="showSlotConfig = true" class="mt-4 text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
          Abrir configuração
        </button>
      </div>

      <!-- ── Levels ── -->
      <div v-else class="space-y-6">
        <div v-for="level in slotLevels" :key="'prep-' + level" class="space-y-3">

          <!-- Level header -->
          <div class="flex items-center gap-2 px-1">
            <Wand2 class="w-4 h-4 text-violet-500/70 shrink-0" />
            <span class="text-sm font-black uppercase tracking-widest text-zinc-300">
              {{ level === 0 ? 'Truques (Nível 0)' : `Nível ${level}` }}
            </span>
            <span class="text-xs text-zinc-600 ml-1">
              {{ preparedSpells[level]?.filter(Boolean).length ?? 0 }} /
              {{ spellSlotsMax[level] ?? 0 }} preparadas
              <span v-if="spentCount(level) > 0" class="text-amber-600/80 ml-1">• {{ spentCount(level) }} gasto{{ spentCount(level) !== 1 ? 's' : '' }}</span>
            </span>
            <div class="h-px bg-zinc-800/60 flex-1 ml-1"></div>
            <!-- Recuperar todos os slots deste nível -->
            <button
              v-if="spentCount(level) > 0"
              @click="onRecoverAllSlots()"
              class="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-950/40 border border-amber-900/40 text-amber-400/80 hover:bg-amber-900/40 hover:text-amber-300 transition-colors shrink-0"
              title="Recuperar todos os espaços (descanso longo)">
              <RotateCcw class="w-2.5 h-2.5" />
              Descansar
            </button>
          </div>

          <!-- Slot grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            <div
              v-for="slotIdx in (spellSlotsMax[level] ?? 0)"
              :key="slotIdx - 1"
              class="rounded-xl border transition-all duration-200 min-h-[52px]"
              :class="[
                preparedSpells[level]?.[slotIdx - 1]
                  ? 'bg-zinc-900 border-violet-800/40 shadow-sm shadow-violet-900/10'
                  : 'bg-zinc-950/40 border-dashed border-zinc-800/60 hover:border-zinc-700/60',
                isPicker(level, slotIdx - 1)
                  ? 'ring-2 ring-violet-500/60 ring-offset-1 ring-offset-zinc-950 border-violet-600/50'
                  : ''
              ]">

              <!-- FILLED SLOT -->
              <div v-if="preparedSpells[level]?.[slotIdx - 1]"
                class="flex items-center gap-2 px-3 py-3 h-full transition-opacity"
                :class="isSpent(level, slotIdx - 1) ? 'opacity-40' : ''">
                <!-- Barra lateral: cinza quando gasto, lilás quando disponível -->
                <div
                  class="w-1.5 h-full min-h-[28px] rounded-full shrink-0 transition-colors"
                  :class="isSpent(level, slotIdx - 1) ? 'bg-zinc-700' : 'bg-violet-500/40'"
                ></div>
                <!-- Ícone: lua quando gasto, varinha quando disponível -->
                <Moon v-if="isSpent(level, slotIdx - 1)" class="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <Wand2 v-else class="w-3.5 h-3.5 text-violet-400 shrink-0" />
                <span class="text-xs font-bold flex-1 truncate leading-tight"
                  :class="isSpent(level, slotIdx - 1) ? 'text-zinc-500' : 'text-zinc-200'">
                  {{ getSlotSpellTitle(level, slotIdx - 1) }}
                </span>
                <div class="flex gap-1 shrink-0">
                  <!-- Estado: GASTO (conjurado) -->
                  <template v-if="isSpent(level, slotIdx - 1)">
                    <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-600 border border-zinc-700/50">
                      Gasto
                    </span>
                    <button
                      @click="onRecoverSlot(level, slotIdx - 1)"
                      class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-950/50 text-amber-500/80 hover:bg-amber-900/50 hover:text-amber-400 transition-colors border border-amber-900/40"
                      title="Recuperar este slot">
                      Recuperar
                    </button>
                  </template>
                  <!-- Estado: DISPONÍVEL -->
                  <template v-else>
                    <button
                      v-if="findSpellByTitle(getSlotSpellTitle(level, slotIdx - 1))?.rollFormula"
                      @click="handlePreparedRoll(getSlotSpellTitle(level, slotIdx - 1), findSpellByTitle(getSlotSpellTitle(level, slotIdx - 1)))"
                      class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-600/20 text-violet-300 hover:bg-violet-600/40 transition-colors"
                      title="Rolar dado sem gastar o slot">
                      Rolar
                    </button>
                    <button
                      @click="handleCastSpell(getSlotSpellTitle(level, slotIdx - 1), level, slotIdx - 1)"
                      class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/40 transition-colors"
                      title="Lançar a magia e gastar o slot">
                      Lançar
                    </button>
                  </template>
                  <!-- Remover sempre visível -->
                  <button
                    @click="onSetPreparedSpell(level, slotIdx - 1, null)"
                    class="p-0.5 text-zinc-700 hover:text-red-400 transition-colors"
                    title="Remover magia do slot">
                    <X class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <!-- EMPTY SLOT -->
              <button v-else
                class="w-full h-full min-h-[52px] flex items-center gap-2 px-3 py-3 text-xs transition-colors group"
                :class="isPicker(level, slotIdx - 1)
                  ? 'text-violet-400'
                  : 'text-zinc-600 hover:text-violet-400'"
                @click="openPicker(level, slotIdx - 1)">
                <div
                  class="w-1.5 h-full min-h-[28px] rounded-full shrink-0 transition-colors"
                  :class="isPicker(level, slotIdx - 1)
                    ? 'bg-violet-600/50 animate-pulse'
                    : 'bg-zinc-800/60 group-hover:bg-violet-800/40'"
                ></div>
                <Plus class="w-3.5 h-3.5 shrink-0" />
                <span class="font-medium">
                  {{ isPicker(level, slotIdx - 1) ? 'Escolhendo magia...' : 'Preparar magia...' }}
                </span>
              </button>

            </div>
          </div>

          <!-- PICKER PANEL — rendered outside the grid, below this level's slots -->
          <div
            v-if="pickerSlot?.level === level"
            class="mt-2 rounded-xl border border-violet-600/50 bg-zinc-950 shadow-xl shadow-violet-950/30 overflow-hidden flex flex-col animate-in"
          >
            <!-- Picker header -->
            <div class="flex items-center gap-2 px-3 py-2 bg-zinc-900 border-b border-zinc-800 shrink-0">
              <Search class="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <input
                v-model="pickerSearch"
                :placeholder="level === 0 ? 'Buscar truque...' : `Buscar magia nível ${level}...`"
                class="flex-1 bg-transparent text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none"
                autofocus
              />
              <span class="text-[10px] text-zinc-600 mr-1">
                slot {{ (pickerSlot?.slotIdx ?? 0) + 1 }}
              </span>
              <button @click="closePicker" class="text-zinc-600 hover:text-zinc-400 transition-colors">
                <X class="w-3.5 h-3.5" />
              </button>
            </div>
            <!-- Level filter toggle -->
            <div class="flex gap-1.5 px-3 py-1.5 bg-zinc-900/80 border-b border-zinc-800/60 shrink-0">
              <button
                @click="showAllLevels = false"
                class="text-[10px] font-bold px-2 py-0.5 rounded transition-colors"
                :class="!showAllLevels ? 'bg-violet-600/20 text-violet-300 border border-violet-700/40' : 'text-zinc-500 hover:text-zinc-300'">
                {{ level === 0 ? 'Truques' : `Nível ${level}` }}
              </button>
              <button
                @click="showAllLevels = true"
                class="text-[10px] font-bold px-2 py-0.5 rounded transition-colors"
                :class="showAllLevels ? 'bg-violet-600/20 text-violet-300 border border-violet-700/40' : 'text-zinc-500 hover:text-zinc-300'">
                Todos os níveis
              </button>
            </div>
            <!-- Spell list -->
            <div class="overflow-y-auto max-h-56">
              <div v-if="finalPickerSpells.length === 0" class="py-6 text-center text-xs text-zinc-600">
                Nenhuma magia encontrada no grimório para este nível
              </div>
              <button
                v-for="{ sp } in finalPickerSpells"
                :key="sp.title"
                class="w-full text-left flex items-center gap-2 px-3 py-2.5 hover:bg-zinc-800/80 transition-colors group border-b border-zinc-800/40 last:border-0"
                @click="pickSpell(sp.title)">
                <Wand2 class="w-3 h-3 text-violet-500/60 shrink-0 group-hover:text-violet-400 transition-colors" />
                <span class="text-xs font-semibold text-zinc-300 group-hover:text-zinc-100 flex-1 truncate">{{ sp.title }}</span>
                <span v-if="showAllLevels && (sp.spellLevel ?? 0) !== level"
                  class="text-[9px] text-violet-400/70 bg-violet-950/40 border border-violet-900/30 rounded px-1 py-0.5 shrink-0">
                  Nv {{ sp.spellLevel ?? 0 }}
                </span>
                <span v-if="sp.school" class="text-[9px] text-zinc-600 bg-zinc-900 border border-zinc-800 rounded px-1 py-0.5 shrink-0">{{ sp.school }}</span>
                <Check class="w-3 h-3 text-violet-400 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </template>

    <!-- ────────── GRIMOIRE TAB ────────── -->
    <template v-else-if="activeTab === 'grimoire'">

      <!-- Toolbar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3">
        <div class="relative flex-1 max-w-sm">
          <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input v-model="grimoireSearch" placeholder="Buscar magias no grimório..."
            class="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/50 transition-colors" />
        </div>
        <button @click="onOpenEditor('spell')"
          class="flex items-center gap-1.5 text-xs font-bold text-indigo-100 bg-indigo-600 hover:bg-indigo-500 rounded-lg px-4 py-2 transition-colors shadow-sm whitespace-nowrap">
          <Plus class="w-4 h-4" /> Escrever Magia
        </button>
      </div>

      <!-- Empty state -->
      <div v-if="!d?.spells?.length"
        class="text-center py-12 border-2 border-dashed border-zinc-800/60 rounded-xl mt-4 bg-zinc-900/20">
        <BookOpen class="w-10 h-10 text-zinc-700 mx-auto mb-3" />
        <p class="text-zinc-400 font-medium">Seu grimório está vazio.</p>
        <p class="text-zinc-600 text-sm mt-1">Adicione magias para começar a prepará-las.</p>
        <button @click="onOpenEditor('spell')"
          class="mt-4 inline-flex items-center gap-2 text-sm font-bold text-indigo-100 bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 rounded-lg transition-colors shadow-lg shadow-indigo-500/20">
          <Plus class="w-4 h-4" /> Escrever Primeira Magia
        </button>
      </div>

      <!-- Spell list grouped by level -->
      <div class="space-y-6 mt-4">
        <div v-for="level in usedGrimoireLevels" :key="'grimoire-' + level" class="space-y-3">

          <!-- Level heading -->
          <div class="flex items-center gap-2">
            <span class="text-sm font-black uppercase tracking-widest text-indigo-300/60 bg-indigo-950/40 px-3 py-1 rounded-full border border-indigo-900/30">
              {{ level === 0 ? 'Truques' : `Nível ${level}` }}
            </span>
            <div class="h-px bg-indigo-900/30 flex-1"></div>
          </div>

          <!-- Spells -->
          <div class="space-y-2">
            <div v-for="{ spell, index } in filteredGrimoireSpells[level]" :key="index"
              class="group rounded-xl border border-zinc-800/80 bg-zinc-900/50 overflow-hidden hover:border-indigo-600/50 hover:bg-zinc-900 transition-colors shadow-sm">

              <!-- Main row -->
              <div class="flex items-center gap-3 px-4 py-3 cursor-pointer" @click="toggleExpand(index)">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-sm text-zinc-200 group-hover:text-indigo-200 transition-colors truncate">{{ spell.title }}</span>
                    <span v-if="spell.school" class="shrink-0 text-[10px] text-zinc-500 bg-zinc-950 border border-zinc-800 rounded px-1.5 py-0.5">{{ spell.school }}</span>
                  </div>
                  <div class="flex flex-wrap gap-3 mt-0.5 text-[10px] text-zinc-500">
                    <span v-if="spell.castingTime">⏱ <span class="text-zinc-400">{{ spell.castingTime }}</span></span>
                    <span v-if="spell.range">📍 <span class="text-zinc-400">{{ spell.range }}</span></span>
                    <span v-if="spell.duration">⌚ <span class="text-zinc-400">{{ spell.duration }}</span></span>
                  </div>
                </div>

                <div class="flex gap-1 items-center shrink-0">
                  <button @click.stop="onClone(index)"
                    class="opacity-0 group-hover:opacity-100 p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/50 rounded transition-all" title="Duplicar">
                    <Copy class="w-4 h-4" />
                  </button>
                  <button @click.stop="onOpenEditor('spell', spell, index)"
                    class="opacity-0 group-hover:opacity-100 p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-all" title="Editar">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  </button>
                  <button @click.stop="onDelete('spell', index)"
                    class="opacity-0 group-hover:opacity-100 p-2 text-red-500/80 hover:text-red-400 hover:bg-red-950/30 rounded transition-all" title="Excluir">
                    <Trash2 class="w-4 h-4" />
                  </button>
                  <ChevronDown v-if="!isExpanded(index)" class="w-5 h-5 text-zinc-600 ml-1" />
                  <ChevronUp v-else class="w-5 h-5 text-zinc-600 ml-1" />
                </div>
              </div>

              <!-- Expanded content -->
              <div v-show="isExpanded(index)" class="border-t border-zinc-800/80 px-4 py-4 bg-zinc-950/80">
                <p class="text-sm text-zinc-400 whitespace-pre-wrap leading-relaxed">{{ spell.description }}</p>
                <div v-if="spell.savingThrow || spell.spellResist || spell.applyBuffName"
                  class="flex flex-wrap gap-4 mt-4 pt-3 border-t border-zinc-800/40 text-xs text-zinc-300">
                  <span v-if="spell.savingThrow" class="bg-zinc-900 border border-zinc-800 px-2 py-1 rounded">
                    🛡 Salva: <span class="font-bold text-zinc-200">{{ spell.savingThrow }}</span>
                  </span>
                  <span v-if="spell.spellResist" class="bg-zinc-900 border border-zinc-800 px-2 py-1 rounded">
                    ⚔️ RM: <span class="font-bold text-zinc-200">{{ spell.spellResist }}</span>
                  </span>
                  <span v-if="spell.applyBuffName" class="bg-indigo-950/40 border border-indigo-900/40 text-indigo-300 px-2 py-1 rounded">
                    🔥 Buff: <span class="font-bold">{{ spell.applyBuffName }}</span>
                  </span>
                </div>

                <!-- Dynamic rolls -->
                <div v-if="spell.dynamicRolls?.length > 0" class="mt-4 pt-3 border-t border-zinc-800/40 flex flex-col gap-2">
                  <h4 class="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Dados da Magia:</h4>
                  <div class="flex flex-wrap gap-2">
                    <div v-for="(roll, i) in spell.dynamicRolls" :key="i"
                      class="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-300">
                      <span class="font-bold text-indigo-400">{{ roll.label || 'Efeito' }}:</span>
                      <span class="font-mono text-zinc-200 ml-1">{{ roll.formula }}</span>
                      <span v-if="roll.higherLevel" class="ml-1 text-[10px] text-zinc-500">({{ roll.higherLevel }})</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </template>

  </div>
</template>
