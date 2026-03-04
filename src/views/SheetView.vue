<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'

// Tabs
import SummaryTab from '@/components/sheet/tabs/SummaryTab.vue'
import SkillsTab from '@/components/sheet/tabs/SkillsTab.vue'
import FeatsTab from '@/components/sheet/tabs/FeatsTab.vue'
import EquipmentTab from '@/components/sheet/tabs/EquipmentTab.vue'
import ResourcesTab from '@/components/sheet/tabs/ResourcesTab.vue'
import ConfigTab from '@/components/sheet/tabs/ConfigTab.vue'
import CharacteristicsTab from '@/components/sheet/tabs/CharacteristicsTab.vue'
import SpellsTab from '@/components/sheet/tabs/SpellsTab.vue'

// Modals
import ItemEditorModal from '@/components/sheet/ItemEditorModal.vue'
import EditSheetModal from '@/components/sheet/EditSheetModal.vue'

// Icons
import {
  LayoutDashboard, Dices, Swords, Package,
  Shield, Settings, ChevronLeft, Loader2, User, Pencil
} from 'lucide-vue-next'

// Header / CoreEditor (kept for legacy edit-core flow)
import HeaderBlock from '@/components/sheet/blocks/HeaderBlock.vue'
import CoreDataEditorModal from '@/components/sheet/CoreDataEditorModal.vue'

// Composables & types
import type { SheetData } from '@/types/sheet'
import { ATTR_KEYS, ATTR_LABELS } from '@/data/sheetConstants'
import { useSheet } from '@/composables/useSheet'
import { useSheetEdit } from '@/composables/useSheetEdit'
import { useDeleteConfirm } from '@/composables/useDeleteConfirm'
import { useDndCalculations } from '@/composables/useDndCalculations'
import { useRolls } from '@/composables/useRolls'
import { useSkills } from '@/composables/useSkills'

const route = useRoute()
const router = useRouter()

const props = defineProps<{
  sheetId?: string
  isEmbedded?: boolean
  onRoll?: (label: string, displayFormula: string, evalFormula?: string) => void
  onAttackRoll?: (label: string, attackFormula: string, damageFormula: string) => void
  onShowDescription?: (title: string, description: string) => void
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
} = useDndCalculations(d)

const { resolveFormula, handleRoll, handleItemRoll, handleShowDescription } = useRolls({
  attrTotal, calcMod, modStr,
  totalCA, totalTouch, totalFlatFooted,
  totalBAB, meleeAtk, rangedAtk, grappleAtk,
  totalHP, totalInitiative, totalFort, totalRef, totalWill,
  d, onRoll: props.onRoll, onAttackRoll: props.onAttackRoll, onShowDescription: props.onShowDescription
})

const { skillPhase, skillSearch, isClassSkill, filteredSkillsList, toggleSkillEdit, skillAbilityMod, skillTotal, adjustRank, addLevelUpSkillPoints, skillPointsSpent, activeSkills } = useSkills(d, editedData, editMode, sheet, calcMod, attrTotal, totalBonuses)

// ── Tabs ───────────────────────────────────────────────────────────────
const TABS = [
  { id: 'summary',         label: 'Resumo',        icon: LayoutDashboard },
  { id: 'skills',          label: 'Perícias',       icon: Dices           },
  { id: 'spells',          label: 'Magias',         icon: Swords          },
  { id: 'feats',           label: 'Talentos',       icon: Swords          },
  { id: 'equipment',       label: 'Itens',          icon: Package         },
  { id: 'resources',       label: 'Recursos',       icon: Shield          },
  { id: 'characteristics', label: 'Características',icon: User            },
  { id: 'config',          label: 'Config',         icon: Settings        },
]

const activeTab = ref('summary')

// ── Edit Sheet Modal ───────────────────────────────────────────────────
const editSheetOpen = ref(false)

function handleEditSaved(payload: { meta: { name: string; class: string; level: number; race: string }, data: any }) {
  if (!sheet.value) return

  // Atualiza colunas de meta na tabela
  sheet.value.name  = payload.meta.name
  sheet.value.class = payload.meta.class
  sheet.value.level = payload.meta.level
  sheet.value.race  = payload.meta.race

  // Preserva apenas hp_current (gerenciado em tempo real, não editado no modal)
  const hp_current = sheet.value.data.hp_current

  // Substitui o data completo com o editado
  sheet.value.data = {
    ...payload.data,
    hp_current,
  }

  // Re-fetch para garantir sincronia com o banco e forçar reatividade completa
  fetchSheet()
}



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
  await saveEditComp()
  if (sheet.value) {
    await saveSheet()
  }
}
function toggleTabsEdit() {
  if (!tabsEditMode.value) skillPhase.value = 'select'
  toggleTabsEditComp(async () => { await saveEdit() })
}

// ── Delete ─────────────────────────────────────────────────────────────
const { isDeleteOpen, deleteCountdown, confirmDelete, executeDelete, cancelDelete } = useDeleteConfirm(async (type, index) => {
  if (sheet.value?.data) {
    const map: Record<string, string> = { feat: 'feats', shortcut: 'shortcuts', equipment: 'equipment', buff: 'buffs', resource: 'resources' }
    const key = map[type]
    if (key && Array.isArray((sheet.value.data as any)[key])) {
      (sheet.value.data as any)[key].splice(index, 1)
      await saveSheet()
    }
  }
})

// ── Delete Sheet ────────────────────────────────────────────────────────
async function deleteSheet() {
  if (!sheet.value) return
  const { error } = await supabase.from('sheets').delete().eq('id', sheet.value.id)
  if (error) {
    alert('Erro ao excluir ficha: ' + error.message)
    return
  }
  router.push('/dashboard')
}

// ── Item & Core Editor ──────────────────────────────────────────────────
const editorOpen = ref(false)
const coreEditorOpen = ref(false)
const editorType = ref<'feat' | 'shortcut' | 'equipment' | 'buff'>('feat')
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
  const map: Record<string, string> = { feat: 'feats', shortcut: 'shortcuts', equipment: 'equipment', buff: 'buffs' }
  const key = map[editorType.value]
  if (!key) return
  if (!(sheet.value.data as any)[key]) (sheet.value.data as any)[key] = []
  const list = (sheet.value.data as any)[key]
  if (editorIndex.value >= 0) list[editorIndex.value] = data
  else list.push(data)
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

// Save resource from ResourceEditorModal
function handleSaveResource(resource: any, index: number) {
  if (!sheet.value) return
  if (!sheet.value.data.resources) sheet.value.data.resources = []
  if (index >= 0) {
    sheet.value.data.resources[index] = resource
  } else {
    sheet.value.data.resources.push(resource)
  }
  saveResources()
}

// ── Custom Skills ──────────────────────────────────────────────────────────
function handleSaveCustomSkill(skill: any, index: number) {
  if (!sheet.value) return
  if (!sheet.value.data.customSkills) sheet.value.data.customSkills = []
  if (index >= 0) {
    sheet.value.data.customSkills[index] = skill
  } else {
    sheet.value.data.customSkills.push(skill)
  }
  saveSheet()
}

function handleDeleteCustomSkill(index: number) {
  if (!sheet.value?.data?.customSkills) return
  sheet.value.data.customSkills.splice(index, 1)
  saveSheet()
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
function toggleFeatActive(i: number) {
  if (sheet.value?.data?.feats?.[i]) {
    const feat = sheet.value.data.feats[i]
    feat.active = !feat.active
    supabase.from('sheets').update({ data: { ...sheet.value.data } }).eq('id', sheet.value.id)
  }
}
function toggleEquipmentActive(i: number) {
  if (sheet.value?.data?.equipment?.[i]) {
    const item = sheet.value.data.equipment[i]
    item.active = !item.active
    supabase.from('sheets').update({ data: { ...sheet.value.data } }).eq('id', sheet.value.id)
  }
}

function handleUpdateSpellSlots(level: number, stats: any) {
  if (!sheet.value?.data) return
  if (!sheet.value.data.spellSlots) sheet.value.data.spellSlots = {}
  sheet.value.data.spellSlots[level] = stats
  saveSheet()
}

function handleTogglePrepared(index: number) {
  if (!sheet.value?.data?.spells?.[index]) return
  const spell = sheet.value.data.spells[index]
  spell.prepared = !spell.prepared
  saveSheet()
}

function handleDeleteSpell(index: number) {
  if (!sheet.value?.data?.spells) return
  sheet.value.data.spells.splice(index, 1)
  saveSheet()
}

function handleAddSpell(spell: any) {
  if (!sheet.value?.data) return
  if (!sheet.value.data.spells) sheet.value.data.spells = []
  sheet.value.data.spells.push(spell)
  saveSheet()
}

function handleOpenGrimoire() {
  if (!sheet.value?.campaign_id) {
    alert('Esta ficha não está vinculada a nenhuma campanha.')
    return
  }
  window.open(`/campaign/${sheet.value.campaign_id}/grimoire`, '_blank')
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
  <div :class="[isEmbedded ? '' : 'min-h-screen bg-background text-foreground']">
    <div :class="[isEmbedded ? '' : 'max-w-5xl mx-auto px-3 py-4']">

      <!-- edit button -->
      <div v-if="!isEmbedded" class="mb-3 flex items-center justify-between">
        <button @click="router.push('/dashboard')"
          class="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft class="w-4 h-4" /> Voltar
        </button>
        <button @click="router.push(`/sheet/${currentSheetId}/edit`)"
          class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors">
          <Pencil class="w-3.5 h-3.5" /> Editar Ficha
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-28">
        <div class="flex flex-col items-center gap-3 text-muted-foreground">
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
        />

        <!-- ═══ TAB BAR ═══ -->
        <div class="sticky top-0 z-30 mb-4 -mx-3 px-3" style="background: linear-gradient(to bottom, var(--background) 85%, transparent)">
          <div class="w-full overflow-x-auto scrollbar-hide pb-1">
            <div class="flex gap-1 justify-between min-w-max bg-card/90 border border-border/70 rounded-xl p-1.5 backdrop-blur-sm">
              <button
                v-for="tab in TABS"
                :key="tab.id"
                @click="activeTab = tab.id"
                class="flex-1 flex justify-center items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap"
                :class="activeTab === tab.id
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'"
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
          <SummaryTab v-show="activeTab === 'summary'"
            :sheet="sheet" :d="d" :edit-mode="editMode" :edited-data="editedData"
            :total-h-p="totalHP" :total-c-a="totalCA" :total-touch="totalTouch" :total-flat-footed="totalFlatFooted"
            :total-b-a-b="totalBAB" :total-initiative="totalInitiative" :total-speed="totalSpeed"
            :melee-atk="meleeAtk" :ranged-atk="rangedAtk" :grapple-atk="grappleAtk"
            :total-fort="totalFort" :total-ref="totalRef" :total-will="totalWill"
            :death-status="deathStatus"
            :attr-total="attrTotal" :calc-mod="calcMod" :mod-str="modStr" :mod-str-f="modStrF"
            :resolve-formula="resolveFormula"
            :ATTR_KEYS="ATTR_KEYS"
            :ATTR_LABELS="ATTR_LABELS"
            @save-hp="saveCurrentHP"
            @roll="handleRoll"
            @roll-item="handleItemRoll"
            @add-shortcut="openEditor('shortcut')"
            @delete-shortcut="(i) => confirmDelete('shortcut', i)"
            @add-resource="addResource"
            @adjust-resource="adjustResource"
            @reset-resources="resetResources"
            @delete-resource="deleteResource"
            @toggle-buff="toggleBuff"
            @toggle-feat-active="toggleFeatActive"
            @toggle-equipment-active="toggleEquipmentActive"
            @toggle-equipped="toggleEquipped"
            :on-show-description="handleShowDescription"
          />

          <!-- PERÍCIAS -->
          <SkillsTab v-show="activeTab === 'skills'"
            :d="d" :edit-mode="editMode" :tabs-edit-mode="tabsEditMode" :edited-data="editedData"
            :skill-phase="skillPhase" :skill-search="skillSearch" :filtered-skills-list="filteredSkillsList"
            :active-skills="activeSkills" :skill-points-spent="skillPointsSpent"
            :mod-str="modStr" :mod-str-f="modStrF" :skill-ability-mod="skillAbilityMod"
            :skill-total="skillTotal" :is-class-skill="isClassSkill"
            :calc-mod="calcMod" :attr-total="attrTotal"
            :on-save-custom-skill="handleSaveCustomSkill"
            :on-delete-custom-skill="handleDeleteCustomSkill"
            @toggle-tabs-edit="toggleTabsEdit"
            @update:skill-phase="skillPhase = $event"
            @update:skill-search="skillSearch = $event"
            @toggle-skill-edit="toggleSkillEdit"
            @adjust-rank="adjustRank"
            @add-level-up-skill-points="addLevelUpSkillPoints"
            @roll="handleRoll"
          />

          <!-- MAGIAS -->
          <SpellsTab v-show="activeTab === 'spells'"
            :d="d" 
            :edit-mode="editMode" 
            :resolve-formula="resolveFormula"
            @roll="handleRoll"
            @attack-roll="(label: string, atk: string, dmg: string) => handleItemRoll({ title: label, isAttack: true, attackFormula: atk, damageFormula: dmg })"
            @show-description="handleShowDescription"
            @open-grimoire="handleOpenGrimoire"
            @update:spell-slots="handleUpdateSpellSlots"
            @toggle-prepared="handleTogglePrepared"
            @delete-spell="handleDeleteSpell"
            @add-spell="handleAddSpell"
          />

          <!-- TALENTOS -->
          <FeatsTab v-show="activeTab === 'feats'"
            :d="d" :editMode="editMode" :modStr="modStr" :resolveFormula="resolveFormula"
            :onOpenEditor="openEditor"
            :onDelete="confirmDelete"
            :onRoll="handleRoll"
            :onAttackRoll="(label: string, atkF: string, dmgF: string) => handleItemRoll({ title: label, isAttack: true, attackFormula: atkF, damageFormula: dmgF })"
            @toggle-active="toggleFeatActive"
            :onShowDescription="handleShowDescription"
          />

          <!-- ITENS -->
          <EquipmentTab v-show="activeTab === 'equipment'"
            :d="d" :editMode="editMode" :totalWeight="totalWeight"
            :onOpenEditor="openEquipmentEditor"
            :onDelete="confirmDelete"
            :onToggleEquipped="toggleEquipped"
            @toggle-active="toggleEquipmentActive"
            @roll-item="handleItemRoll"
            :onShowDescription="handleShowDescription"
          />

          <!-- RECURSOS & BUFFS -->
          <ResourcesTab v-show="activeTab === 'resources'"
            :sheet="sheet" :d="d" :editMode="editMode"
            :modStr="modStr" :resolveFormula="resolveFormula"
            :onAdjust="adjustResource"
            :onReset="resetResources"
            :onAdd="addResource"
            :onDelete="deleteResource"
            :onOpenEditor="openEditor"
            :onDeleteBuff="(i: number) => confirmDelete('buff', i)"
            :onToggleBuff="toggleBuff"
            :onRollItem="handleItemRoll"
            :onShowDescription="handleShowDescription"
            :onSaveResource="handleSaveResource"
          />

          <!-- CARACTERÍSTICAS -->
          <CharacteristicsTab v-show="activeTab === 'characteristics'"
            :d="d"
            :edit-mode="true"
            @save="(partial) => { if (sheet) { Object.assign(sheet.data, partial); saveSheet() } }"
          />

          <!-- CONFIG -->
          <ConfigTab v-show="activeTab === 'config'"
            :d="d" :b="b" :edit-mode="editMode" :tabs-edit-mode="tabsEditMode" :edited-data="editedData"
            :mod-str="modStr" :adjust-field="adjustField" :on-toggle-edit="toggleTabsEdit"
            :on-delete-sheet="!isEmbedded ? deleteSheet : undefined"
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

    <!-- Edit Sheet Modal -->
    <EditSheetModal
      v-if="editSheetOpen && sheet"
      :sheet-id="sheet.id"
      :initial-data="sheet.data"
      :sheet-name="sheet.name"
      :sheet-race="sheet.race"
      :sheet-class="sheet.class"
      :sheet-level="sheet.level"
      @close="editSheetOpen = false"
      @saved="handleEditSaved"
    />



    <!-- Delete confirm -->
    <Teleport to="body">
      <div v-if="isDeleteOpen" class="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4">
        <div class="bg-card border border-border rounded-2xl p-6 max-w-sm w-full text-center space-y-4">
          <div class="text-4xl"></div>
          <div>
            <p class="font-bold text-foreground">Confirmar exclusão?</p>
            <p class="text-sm text-muted-foreground mt-1">Esta ação não pode ser desfeita.</p>
          </div>
          <div class="flex gap-3">
            <button @click="cancelDelete"
              class="flex-1 py-2 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors text-sm">
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
