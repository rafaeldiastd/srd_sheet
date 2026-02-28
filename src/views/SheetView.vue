<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'

// Tabs
import SummaryTab from '@/components/sheet/tabs/SummaryTab.vue'
import SkillsTab from '@/components/sheet/tabs/SkillsTab.vue'
import FeatsTab from '@/components/sheet/tabs/FeatsTab.vue'
import SpellsTab from '@/components/sheet/tabs/SpellsTab.vue'
import EquipmentTab from '@/components/sheet/tabs/EquipmentTab.vue'
import ResourcesTab from '@/components/sheet/tabs/ResourcesTab.vue'
import ConfigTab from '@/components/sheet/tabs/ConfigTab.vue'

// Shared components
import ItemEditorModal from '@/components/sheet/ItemEditorModal.vue'
import HeaderBlock from '@/components/sheet/blocks/HeaderBlock.vue'
import CoreDataEditorModal from '@/components/sheet/CoreDataEditorModal.vue'
import RawDataEditorModal from '@/components/sheet/RawDataEditorModal.vue'

// Icons
import {
  LayoutDashboard, Dices, Swords, Wand2, Package,
  Shield, Settings, ChevronLeft, Loader2
} from 'lucide-vue-next'

// Composables & types
import type { SheetData } from '@/types/sheet'
import { ATTR_KEYS, ATTR_LABELS } from '@/data/sheetConstants'
import { useSheet } from '@/composables/useSheet'
import { useSheetEdit } from '@/composables/useSheetEdit'
import { useDeleteConfirm } from '@/composables/useDeleteConfirm'
import { useDndCalculations } from '@/composables/useDndCalculations'
import { useRolls } from '@/composables/useRolls'
import { useSkills } from '@/composables/useSkills'
import { useSpellSlots } from '@/composables/useSpellSlots'

const route = useRoute()
const router = useRouter()

const props = defineProps<{
  sheetId?: string
  isEmbedded?: boolean
  onRoll?: (label: string, displayFormula: string, evalFormula?: string) => void
  onAttackRoll?: (label: string, attackFormula: string, damageFormula: string) => void
  onSpellRoll?: (spell: any) => void
}>()

const currentSheetId = computed(() => props.sheetId || route.params.id as string)

// ── Core Sheet ─────────────────────────────────────────────────────────
const { sheet, loading, fetchSheet: fetchSheetData, saveSheetMeta, saveSheetData } = useSheet()
const { editedData, headEditMode, tabsEditMode, toggleTabsEdit: toggleTabsEditComp, saveEdit: saveEditComp } = useSheetEdit(sheet, async (data) => {
  if (!sheet.value) return
  await saveSheetWithData(data)
})

const editMode = computed(() => headEditMode.value || tabsEditMode.value)
const d = computed(() => editMode.value ? editedData.value : sheet.value?.data)

// ── Calculations ──────────────────────────────────────────────────────
const {
  calcMod, modStr, modStrF, b, totalBonuses,
  attrTotal, totalCA, totalTouch, totalFlatFooted,
  totalBAB, totalInitiative, totalHP, totalSpeed,
  meleeAtk, rangedAtk, grappleAtk,
  totalFort, totalRef, totalWill,
  deathStatus, totalWeight, adjustField
} = useDndCalculations(d, editMode, editedData, sheet)

const { resolveFormula, handleRoll, handleItemRoll, sendSpellToChat } = useRolls({
  attrTotal, calcMod, modStr,
  totalCA, totalTouch, totalFlatFooted,
  totalBAB, meleeAtk, rangedAtk, grappleAtk,
  totalHP, totalInitiative, totalFort, totalRef, totalWill,
  d, onRoll: props.onRoll, onAttackRoll: props.onAttackRoll, onSpellRoll: props.onSpellRoll
})

const { skillPhase, skillSearch, isClassSkill, filteredSkillsList, toggleSkillEdit, skillAbilityMod, skillTotal, adjustRank, addLevelUpSkillPoints, skillPointsSpent, activeSkills } = useSkills(d, editedData, editMode, sheet, calcMod, attrTotal, totalBonuses)
const { SPELL_LEVELS, spellSlotsMax, spellSlotsUsed, preparedSpells, spentSlots,
        adjustSlotUsed, adjustSlotMax, setPreparedSpell, clearAllPreparedSpells,
        spendSlot, recoverSlot, recoverAllSlots,
        snapshotPreparedSpells, snapshotSpentSlots } = useSpellSlots(sheet)

// ── Tabs ───────────────────────────────────────────────────────────────
const TABS = [
  { id: 'summary', label: 'Resumo', icon: LayoutDashboard },
  { id: 'skills', label: 'Perícias', icon: Dices },
  { id: 'feats', label: 'Talentos', icon: Swords },
  { id: 'spells', label: 'Magias', icon: Wand2 },
  { id: 'equipment', label: 'Itens', icon: Package },
  { id: 'resources', label: 'Recursos & Buffs', icon: Shield },
  { id: 'config', label: 'Config', icon: Settings },
]

const activeTab = ref('summary')



// ── Save ───────────────────────────────────────────────────────────────
async function saveSheet() {
  if (!sheet.value) return
  await saveSheetWithData(sheet.value.data)
}

async function saveSheetWithData(data: SheetData) {
  if (!sheet.value) return
  try {
    await saveSheetMeta(sheet.value.id, {
      name: sheet.value.name, class: sheet.value.class,
      level: sheet.value.level, race: sheet.value.race
    })
    await saveSheetData(sheet.value.id, data)
  } catch (error: any) {
    alert('Erro ao salvar: ' + (error.message || error))
  }
}

async function saveCurrentHP() {
  if (!sheet.value) return
  await supabase.from('sheets').update({ data: { ...sheet.value.data } }).eq('id', sheet.value.id)
}

async function saveEdit() {
  await saveEditComp(spellSlotsMax.value, spellSlotsUsed.value)
  if (sheet.value) {
    sheet.value.data.preparedSpells = snapshotPreparedSpells()
    await saveSheet()
  }
}
function toggleTabsEdit() {
  if (!tabsEditMode.value) skillPhase.value = 'select'
  toggleTabsEditComp(async () => { await saveEdit() })
}

function handleSetPreparedSpell(level: number, slotIndex: number, spellId: string | null) {
  setPreparedSpell(level, slotIndex, spellId)
  if (sheet.value) {
    sheet.value.data.preparedSpells = snapshotPreparedSpells()
    sheet.value.data.spentSlots     = snapshotSpentSlots()
    saveSheet()
  }
}

function handleClearAllPreparedSpells() {
  clearAllPreparedSpells()
  if (sheet.value) {
    sheet.value.data.preparedSpells = snapshotPreparedSpells()
    sheet.value.data.spentSlots     = snapshotSpentSlots()
    saveSheet()
  }
}

function handleSpendSlot(level: number, slotIndex: number) {
  spendSlot(level, slotIndex)
  if (sheet.value) {
    sheet.value.data.spentSlots     = snapshotSpentSlots()
    saveSheet()
  }
}

function handleRecoverSlot(level: number, slotIndex: number) {
  recoverSlot(level, slotIndex)
  if (sheet.value) {
    sheet.value.data.spentSlots     = snapshotSpentSlots()
    saveSheet()
  }
}

function handleRecoverAllSlots() {
  recoverAllSlots()
  if (sheet.value) {
    sheet.value.data.spentSlots     = snapshotSpentSlots()
    saveSheet()
  }
}

function handleApplyBuff(name: string, value: string) {
  if (sheet.value) {
    if (!sheet.value.data.buffs) sheet.value.data.buffs = []
    sheet.value.data.buffs.push({
      title: name,
      description: value,
      active: true,
      modifiers: []
    })
    saveSheet()
  }
}

// ── Delete ─────────────────────────────────────────────────────────────
const { isDeleteOpen, deleteCountdown, confirmDelete, executeDelete, cancelDelete } = useDeleteConfirm(async (type, index) => {
  if (sheet.value?.data) {
    const map: Record<string, string> = { feat: 'feats', spell: 'spells', shortcut: 'shortcuts', equipment: 'equipment', buff: 'buffs', resource: 'resources' }
    const key = map[type]
    if (key && Array.isArray((sheet.value.data as any)[key])) {
      (sheet.value.data as any)[key].splice(index, 1)
      await saveSheet()
    }
  }
})

// ── Item & Core Editor ──────────────────────────────────────────────────
const editorOpen = ref(false)
const coreEditorOpen = ref(false)
const rawEditorOpen = ref(false)
const editorType = ref<'feat' | 'spell' | 'shortcut' | 'equipment' | 'buff'>('feat')
const editorItem = ref<any>(null)
const editorIndex = ref(-1)

function openEditor(type: string, item?: any, index = -1) {
  editorType.value = type as any
  editorItem.value = item || null
  editorIndex.value = index
  editorOpen.value = true
}

function openEquipmentEditor(item?: any, index = -1) {
  openEditor('equipment', item, index)
}

function handleEditorSave(data: any) {
  if (!sheet.value) return
  const map: Record<string, string> = { feat: 'feats', spell: 'spells', shortcut: 'shortcuts', equipment: 'equipment', buff: 'buffs' }
  const key = map[editorType.value]
  if (!key) return
  if (!(sheet.value.data as any)[key]) (sheet.value.data as any)[key] = []
  const list = (sheet.value.data as any)[key]
  if (editorIndex.value >= 0) list[editorIndex.value] = data
  else list.push(data)
  saveSheet()
}

function cloneSpell(index: number) {
  if (!sheet.value || !sheet.value.data.spells) return
  const original = sheet.value.data.spells[index]
  if (!original) return
  const copy = JSON.parse(JSON.stringify(original))
  copy.title = `${copy.title} (Cópia)`
  sheet.value.data.spells.push(copy)
  saveSheet()
}

async function handleCoreSave(meta: { name: string; class: string; level: number; race: string }, data: any) {
  if (!sheet.value) return
  // Update local
  sheet.value.name = meta.name
  sheet.value.class = meta.class
  sheet.value.level = meta.level
  sheet.value.race = meta.race
  sheet.value.data = data
  // Save both sets
  try {
    await saveSheetMeta(sheet.value.id, meta)
    await saveSheetData(sheet.value.id, data)
  } catch (err: any) {
    alert('Erro ao salvar dados principais: ' + err.message)
  }
}

async function handleRawDataSave(data: any) {
  if (!sheet.value) return
  try {
    sheet.value.data = data
    await saveSheetData(sheet.value.id, data)
  } catch (err: any) {
    alert('Erro ao salvar ficha: ' + err.message)
  }
}

// ── Resources ───────────────────────────────────────────────────────────
function addResource(name: string, max: number) {
  if (!sheet.value) return
  if (!sheet.value.data.resources) sheet.value.data.resources = []
  sheet.value.data.resources.push({ name, max, current: max })
  saveResources()
}
function adjustResource(i: number, delta: number) {
  if (!sheet.value?.data?.resources) return
  const res = sheet.value.data.resources[i]
  if (!res) return
  res.current = Math.max(0, Math.min(res.max, (res.current ?? res.max) + delta))
  saveResources()
}
function resetResources() {
  for (const res of (sheet.value?.data?.resources || [])) res.current = res.max
  saveResources()
}
async function saveResources() {
  if (!sheet.value) return
  await supabase.from('sheets').update({ data: { ...sheet.value.data } }).eq('id', sheet.value.id)
}
function deleteResource(i: number) {
  confirmDelete('resource', i)
}



// ── Equipment / Buff Toggles ───────────────────────────────────────────
function toggleEquipped(i: number) {
  if (sheet.value?.data?.equipment?.[i]) {
    const eq = sheet.value.data.equipment[i]
    eq.equipped = !eq.equipped
    supabase.from('sheets').update({ data: { ...sheet.value.data } }).eq('id', sheet.value.id)
  }
}
function toggleBuff(i: number) {
  if (sheet.value?.data?.buffs?.[i]) {
    const buf = sheet.value.data.buffs[i]
    buf.active = !buf.active
    supabase.from('sheets').update({ data: { ...sheet.value.data } }).eq('id', sheet.value.id)
  }
}

// ── Slot adjustments ───────────────────────────────────────────────────
function handleAdjustSlot(level: number, delta: number, field: 'used' | 'max') {
  if (field === 'used') adjustSlotUsed(level, delta)
  else adjustSlotMax(level, delta)
}

// ── Fetch ──────────────────────────────────────────────────────────────
async function fetchSheet() {
  if (!currentSheetId.value) return
  try { await fetchSheetData(currentSheetId.value) } catch { router.push('/dashboard') }
}
watch(currentSheetId, () => {
  headEditMode.value = false
  tabsEditMode.value = false
  editedData.value = null
  fetchSheet()
})
onMounted(fetchSheet)
</script>

<template>
  <div :class="[isEmbedded ? '' : 'min-h-screen bg-[#0a0a0b] text-foreground']">
    <div :class="[isEmbedded ? '' : 'max-w-5xl mx-auto px-3 py-4']">

      <!-- Back -->
      <div v-if="!isEmbedded" class="mb-3">
        <button @click="router.push('/dashboard')"
          class="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
          <ChevronLeft class="w-4 h-4" /> Voltar
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-28">
        <div class="flex flex-col items-center gap-3 text-zinc-600">
          <Loader2 class="w-8 h-8 animate-spin" />
          <span class="text-sm">Carregando ficha...</span>
        </div>
      </div>

      <template v-else-if="sheet && d">
        <HeaderBlock
          :sheet="sheet"
          :d="d"
          :edit-mode="editMode"
          @edit-core="coreEditorOpen = true"
          @edit-raw="rawEditorOpen = true"
        />

        <!-- ═══ TAB BAR ═══ -->
        <div class="sticky top-0 z-30 mb-4 -mx-3 px-3" style="background: linear-gradient(to bottom, #0a0a0b 85%, transparent)">
          <div class="w-full overflow-x-auto scrollbar-hide pb-1">
            <div class="flex gap-1 justify-between min-w-max bg-zinc-950/90 border border-zinc-800/70 rounded-xl p-1.5 backdrop-blur-sm">
              <button
                v-for="tab in TABS"
                :key="tab.id"
                @click="activeTab = tab.id"
                class="flex-1 flex justify-center items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap"
                :class="activeTab === tab.id
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60'"
              >
                <component :is="tab.icon" class="w-4 h-4" />
                <span>{{ tab.label }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- ═══ TAB PANELS ═══ -->
        <div class="min-h-[50vh]">

          <!-- RESUMO -->
          <SummaryTab
            v-if="activeTab === 'summary'"
            :sheet="sheet"
            :d="d"
            :edit-mode="editMode"
            :edited-data="editedData"
            :prepared-spells="preparedSpells"
            :total-h-p="totalHP"
            :total-c-a="totalCA"
            :total-touch="totalTouch"
            :total-flat-footed="totalFlatFooted"
            :total-b-a-b="totalBAB"
            :total-initiative="totalInitiative"
            :total-speed="totalSpeed"
            :melee-atk="meleeAtk"
            :ranged-atk="rangedAtk"
            :grapple-atk="grappleAtk"
            :total-fort="totalFort"
            :total-ref="totalRef"
            :total-will="totalWill"
            :death-status="deathStatus"
            :attr-total="attrTotal"
            :calc-mod="calcMod"
            :mod-str="modStr"
            :mod-str-f="modStrF"
            :resolve-formula="resolveFormula"
            :ATTR_KEYS="ATTR_KEYS"
            :ATTR_LABELS="ATTR_LABELS"
            @save-hp="saveCurrentHP"
            @roll="handleRoll"
            @roll-item="handleItemRoll"
            @roll-spell="(spell) => handleItemRoll(spell)"
            @add-shortcut="openEditor('shortcut')"
            @delete-shortcut="(i) => confirmDelete('shortcut', i)"
            @add-resource="addResource"
            @adjust-resource="adjustResource"
            @reset-resources="resetResources"
            @delete-resource="deleteResource"
            @toggle-buff="toggleBuff"
          />

          <!-- PERÍCIAS -->
          <SkillsTab
            v-else-if="activeTab === 'skills'"
            :d="d"
            :edit-mode="editMode"
            :tabs-edit-mode="tabsEditMode"
            :edited-data="editedData"
            :skill-phase="skillPhase"
            :skill-search="skillSearch"
            :filtered-skills-list="filteredSkillsList"
            :active-skills="activeSkills"
            :skill-points-spent="skillPointsSpent"
            :mod-str="modStr"
            :mod-str-f="modStrF"
            :skill-ability-mod="skillAbilityMod"
            :skill-total="skillTotal"
            :is-class-skill="isClassSkill"
            :calc-mod="calcMod"
            :attr-total="attrTotal"
            @toggle-tabs-edit="toggleTabsEdit"
            @update:skill-phase="skillPhase = $event"
            @update:skill-search="skillSearch = $event"
            @toggle-skill-edit="toggleSkillEdit"
            @adjust-rank="adjustRank"
            @add-level-up-skill-points="addLevelUpSkillPoints"
            @roll="handleRoll"
          />

          <!-- TALENTOS & ATAQUES -->
          <FeatsTab
            v-else-if="activeTab === 'feats'"
            :d="d"
            :edit-mode="editMode"
            :mod-str="modStr"
            :resolve-formula="resolveFormula"
            :on-open-editor="openEditor"
            :on-delete="confirmDelete"
            :on-roll="handleRoll"
            :on-attack-roll="(label: string, atkF: string, dmgF: string) => handleItemRoll({ title: label, isAttack: true, attackFormula: atkF, damageFormula: dmgF })"
          />

          <!-- MAGIAS -->
          <SpellsTab
            v-else-if="activeTab === 'spells'"
            :d="d"
            :edit-mode="editMode"
            :tabs-edit-mode="tabsEditMode"
            :spell-slots-max="spellSlotsMax"
            :spell-slots-used="spellSlotsUsed"
            :prepared-spells="preparedSpells"
            :spent-slots="spentSlots"
            :SPELL_LEVELS="SPELL_LEVELS"
            :mod-str="modStr"
            :resolve-formula="resolveFormula"
            :on-open-editor="openEditor"
            :on-delete="confirmDelete"
            :on-spell-roll="(spell: any) => sendSpellToChat(spell)"
            :on-adjust-slot="handleAdjustSlot"
            :on-set-prepared-spell="handleSetPreparedSpell"
            :on-clear-all-prepared="handleClearAllPreparedSpells"
            :on-spend-slot="handleSpendSlot"
            :on-recover-slot="handleRecoverSlot"
            :on-recover-all-slots="handleRecoverAllSlots"
            :on-apply-buff="handleApplyBuff"
            :on-toggle-edit="toggleTabsEdit"
            :on-clone="cloneSpell"
          />

          <!-- ITENS -->
          <EquipmentTab
            v-else-if="activeTab === 'equipment'"
            :d="d"
            :edit-mode="editMode"
            :total-weight="totalWeight"
            :on-open-editor="openEquipmentEditor"
            :on-delete="confirmDelete"
            :on-toggle-equipped="toggleEquipped"
          />

          <!-- RECURSOS & BUFFS -->
          <ResourcesTab
            v-else-if="activeTab === 'resources'"
            :sheet="sheet"
            :d="d"
            :edit-mode="editMode"
            :mod-str="modStr"
            :resolve-formula="resolveFormula"
            :on-adjust="adjustResource"
            :on-reset="resetResources"
            :on-add="addResource"
            :on-delete="deleteResource"
            :on-open-editor="openEditor"
            :on-delete-buff="(i: number) => confirmDelete('buff', i)"
            :on-toggle-buff="toggleBuff"
          />

          <!-- CONFIG -->
          <ConfigTab
            v-else-if="activeTab === 'config'"
            :d="d"
            :b="b"
            :edit-mode="editMode"
            :tabs-edit-mode="tabsEditMode"
            :edited-data="editedData"
            :mod-str="modStr"
            :adjust-field="adjustField"
            :on-toggle-edit="toggleTabsEdit"
          />
        </div>
      </template>
    </div>

    <!-- Item Editor Modal -->
    <ItemEditorModal
      v-model="editorOpen"
      :type="editorType"
      :item="editorItem"
      :index="editorIndex"
      @save="handleEditorSave"
    />

    <!-- Core Data Editor Modal -->
    <CoreDataEditorModal
      v-if="sheet"
      v-model="coreEditorOpen"
      :sheet-name="sheet.name"
      :sheet-class="sheet.class"
      :sheet-level="sheet.level"
      :sheet-race="sheet.race"
      :data="sheet.data"
      @save="handleCoreSave"
    />

    <!-- Raw Data Editor Modal -->
    <RawDataEditorModal
      v-if="sheet"
      v-model="rawEditorOpen"
      :data="sheet.data"
      @save="handleRawDataSave"
    />

    <!-- Delete confirm -->
    <Teleport to="body">
      <div v-if="isDeleteOpen" class="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4">
        <div class="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full text-center space-y-4">
          <div class="text-4xl">🗑️</div>
          <div>
            <p class="font-bold text-zinc-100">Confirmar exclusão?</p>
            <p class="text-sm text-zinc-500 mt-1">Esta ação não pode ser desfeita.</p>
          </div>
          <div class="flex gap-3">
            <button @click="cancelDelete"
              class="flex-1 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:bg-zinc-800 transition-colors text-sm">
              Cancelar
            </button>
            <button @click="executeDelete"
              class="flex-1 py-2 rounded-lg bg-red-900/80 border border-red-800 text-red-200 hover:bg-red-800 transition-colors text-sm font-bold"
              :class="deleteCountdown > 0 ? 'opacity-50 cursor-not-allowed' : ''">
              {{ deleteCountdown > 0 ? `Aguarde ${deleteCountdown}s...` : 'Excluir' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
