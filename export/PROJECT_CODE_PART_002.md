

---
## FILE: src/components/sheet/tabs/ConfigTab.vue
```vue
<script setup lang="ts">
import { Settings2 } from 'lucide-vue-next'
import { ATTR_KEYS, ATTR_LABELS, CA_FIELDS, SAVE_FIELDS, ELEM_FIELDS } from '@/data/sheetConstants'

const props = defineProps<{
  d: any
  b: any
  editMode: boolean
  tabsEditMode: boolean
  editedData: any
  modStr: (n: number) => string
  adjustField: (obj: any, key: string, delta: number) => void
  onToggleEdit: () => void
}>()  

</script>

<template>
  <div class="space-y-6">

    <!-- Bonus Config -->
    <div class="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Settings2 class="w-4 h-4 text-zinc-400" />
          <span class="text-xs font-bold uppercase tracking-widest text-zinc-400">Modificadores & Bônus</span>
        </div>
        <button @click="onToggleEdit"
          class="text-xs font-bold px-3 py-1.5 rounded-lg border transition-all"
          :class="tabsEditMode
            ? 'bg-primary/20 border-primary text-primary'
            : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-200'">
          {{ tabsEditMode ? '✓ Concluir' : 'Editar' }}
        </button>
      </div>

      <div class="grid md:grid-cols-2 gap-4">
        <!-- Attr bonuses -->
        <div class="space-y-1">
          <div class="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Bônus de Atributos</div>
          <div v-for="key in ATTR_KEYS" :key="key" class="flex items-center justify-between py-1.5 border-b border-zinc-800/50">
            <span class="text-xs text-zinc-400">{{ ATTR_LABELS[key] }}</span>
            <div v-if="tabsEditMode && editedData" class="flex items-center gap-1">
              <button @click="adjustField(editedData.bonuses.attributes, key, -1)" class="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-sm flex items-center justify-center">−</button>
              <span class="w-8 text-center text-sm font-bold tabular-nums text-zinc-200">{{ editedData.bonuses.attributes[key] ?? 0 }}</span>
              <button @click="adjustField(editedData.bonuses.attributes, key, 1)" class="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-sm flex items-center justify-center">+</button>
            </div>
            <span v-else class="text-sm font-bold text-zinc-300">{{ modStr(b?.attributes?.[key] ?? 0) }}</span>
          </div>
        </div>

        <!-- CA bonuses -->
        <div class="space-y-1">
          <div class="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Componentes de CA</div>
          <div v-for="f in CA_FIELDS" :key="f.field" class="flex items-center justify-between py-1.5 border-b border-zinc-800/50">
            <span class="text-xs text-zinc-400">{{ f.label }}</span>
            <div v-if="tabsEditMode && editedData" class="flex items-center gap-1">
              <button @click="adjustField(editedData, f.field, -1)" class="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-sm flex items-center justify-center">−</button>
              <span class="w-8 text-center text-sm font-bold tabular-nums text-zinc-200">{{ editedData[f.field] ?? 0 }}</span>
              <button @click="adjustField(editedData, f.field, 1)" class="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-sm flex items-center justify-center">+</button>
            </div>
            <span v-else class="text-sm font-bold text-zinc-300">{{ d[f.field] ?? 0 }}</span>
          </div>
          <!-- CA Bonus misc -->
          <div class="flex items-center justify-between py-1.5">
            <span class="text-xs text-zinc-400">Bônus CA (misc)</span>
            <div v-if="tabsEditMode && editedData" class="flex items-center gap-1">
              <button @click="adjustField(editedData.bonuses, 'ca', -1)" class="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-sm flex items-center justify-center">−</button>
              <span class="w-8 text-center text-sm font-bold tabular-nums text-zinc-200">{{ editedData.bonuses.ca ?? 0 }}</span>
              <button @click="adjustField(editedData.bonuses, 'ca', 1)" class="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-sm flex items-center justify-center">+</button>
            </div>
            <span v-else class="text-sm font-bold text-zinc-300">{{ modStr(b?.ca ?? 0) }}</span>
          </div>
        </div>

        <!-- Saves -->
        <div class="space-y-1">
          <div class="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Saves Base &amp; Bônus</div>
          <div v-for="f in SAVE_FIELDS" :key="f.field" class="flex items-center justify-between py-1.5 border-b border-zinc-800/50">
            <span class="text-xs text-zinc-400">{{ f.label }}</span>
            <div v-if="tabsEditMode && editedData" class="flex items-center gap-1">
              <button @click="adjustField(editedData, f.field, -1)" class="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-sm flex items-center justify-center">−</button>
              <span class="w-8 text-center text-sm font-bold tabular-nums text-zinc-200">{{ editedData[f.field] ?? 0 }}</span>
              <button @click="adjustField(editedData, f.field, 1)" class="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-sm flex items-center justify-center">+</button>
            </div>
            <span v-else class="text-sm font-bold text-zinc-300">{{ d[f.field] ?? 0 }}</span>
          </div>
        </div>

        <!-- Elemental resistances -->
        <div class="space-y-1">
          <div class="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Resistências Elementais</div>
          <div v-for="f in ELEM_FIELDS" :key="f.field" class="flex items-center justify-between py-1.5 border-b border-zinc-800/50">
            <span class="text-xs text-zinc-400">{{ f.label }}</span>
            <div v-if="tabsEditMode && editedData" class="flex items-center gap-1">
              <button @click="adjustField(editedData.bonuses.resistances, f.field, -1)" class="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-sm flex items-center justify-center">−</button>
              <span class="w-8 text-center text-sm font-bold tabular-nums text-zinc-200">{{ editedData.bonuses.resistances[f.field] ?? 0 }}</span>
              <button @click="adjustField(editedData.bonuses.resistances, f.field, 1)" class="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-sm flex items-center justify-center">+</button>
            </div>
            <span v-else class="text-sm font-bold text-zinc-300">{{ b?.resistances?.[f.field] ?? 0 }}</span>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div class="pt-2">
        <div class="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Notas de Bônus</div>
        <textarea v-if="tabsEditMode && editedData" v-model="editedData.bonuses.notes"
          class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-primary/50 resize-none min-h-[5rem]"
          placeholder="Ex: +2 FOR (Cinto), +4 CA (Manto +2)..." />
        <p v-else class="text-sm text-zinc-500 italic">{{ b?.notes || 'Sem notas.' }}</p>
      </div>
    </div>
  </div>
</template>

```


---
## FILE: src/components/sheet/tabs/EquipmentTab.vue
```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Package, Plus, Trash2, Backpack, ChevronDown, ChevronUp } from 'lucide-vue-next'

const props = defineProps<{
  d: any
  editMode: boolean
  totalWeight: number
  onOpenEditor: (item?: any, index?: number) => void
  onDelete: (type: string, index: number) => void
  onToggleEquipped: (i: number) => void
}>()

const expanded = ref<Set<number>>(new Set())
function toggleExpand(i: number) {
  if (expanded.value.has(i)) expanded.value.delete(i)
  else expanded.value.add(i)
}
</script>

<template>
  <div class="space-y-3">
    <!-- Tab toolbar -->
    <div class="bg-zinc-900/60 border border-zinc-800 rounded-xl px-3 py-2 flex items-center justify-between">
      <div class="flex items-center gap-2 text-xs text-zinc-500">
        <Backpack class="w-4 h-4" />
        <span>Peso total: <span class="font-bold text-zinc-300">{{ totalWeight.toFixed(1) }} kg</span></span>
      </div>
      <button @click="onOpenEditor()"
        class="flex items-center gap-1 text-xs text-zinc-300 border border-zinc-700 rounded-lg px-2.5 py-1.5 hover:bg-zinc-800 transition-colors">
        <Plus class="w-3.5 h-3.5" /> Novo Item
      </button>
    </div>

    <div class="space-y-2">
      <div v-for="(item, i) in d?.equipment" :key="i"
        class="group rounded-xl border bg-zinc-950/60 overflow-hidden transition-all duration-200 hover:border-zinc-700"
        :class="item.equipped ? 'border-primary/30 bg-primary/5' : 'border-zinc-800'">
        <div class="flex items-center gap-3 px-4 py-3">
          <!-- Equipped toggle -->
          <button @click="onToggleEquipped(i)"
            class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all"
            :class="item.equipped
              ? 'bg-primary/20 border border-primary/40 text-primary'
              : 'bg-zinc-800 border border-zinc-700 text-zinc-600 hover:text-zinc-400'">
            <Package class="w-4 h-4" />
          </button>

          <!-- Info -->
          <div class="flex-1 cursor-pointer" @click="toggleExpand(i)">
            <div class="font-bold text-sm" :class="item.equipped ? 'text-primary/90' : 'text-zinc-300'">
              {{ item.title }}
            </div>
            <div class="text-[10px] text-zinc-600 mt-0.5">
              {{ item.weight ? item.weight + ' kg' : '' }}
              <span v-if="item.equipped" class="text-primary/50 ml-1">• equipado</span>
              <span v-if="item.modifiers?.length" class="ml-1">• {{ item.modifiers.length }} mod(s)</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-1 items-center">
            <button @click.stop="onOpenEditor(item, i)" class="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-600 hover:text-zinc-300 transition-all">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            </button>
            <button @click="onDelete('equipment', i)" class="opacity-0 group-hover:opacity-100 p-1.5 text-red-800 hover:text-red-500 transition-all">
              <Trash2 class="w-3.5 h-3.5" />
            </button>
            <button @click="toggleExpand(i)" class="p-1 text-zinc-600 hover:text-zinc-300 transition-colors">
              <ChevronDown v-if="!expanded.has(i)" class="w-4 h-4" />
              <ChevronUp v-else class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div v-if="expanded.has(i) && item.description" class="border-t border-zinc-800/60 px-4 py-3 bg-zinc-900/30">
          <p class="text-sm text-zinc-400 whitespace-pre-wrap">{{ item.description }}</p>
        </div>
      </div>

      <div v-if="!d?.equipment?.length" class="text-center py-12 text-zinc-600 text-sm">
        Nenhum item no inventário.
      </div>
    </div>
  </div>
</template>

```


---
## FILE: src/components/sheet/tabs/FeatsTab.vue
```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Plus, Trash2, Swords, Zap, ChevronDown, ChevronUp } from 'lucide-vue-next'

const props = defineProps<{
  d: any
  editMode: boolean
  modStr: (n: number) => string
  resolveFormula: (formula: string) => string
  onOpenEditor: (type: string, item?: any, index?: number) => void
  onDelete: (type: string, index: number) => void
  onRoll: (label: string, formula: string) => void
  onDualRoll: (label: string, atkF: string, dmgF: string) => void
}>()

const expanded = ref<Set<number>>(new Set())
function toggleExpand(i: number) {
  if (expanded.value.has(i)) expanded.value.delete(i)
  else expanded.value.add(i)
}
</script>

<template>
  <div class="space-y-3">
    <!-- Tab toolbar -->
    <div class="bg-zinc-900/60 border border-zinc-800 rounded-xl px-3 py-2 flex items-center justify-between">
      <span class="text-xs font-bold uppercase tracking-widest text-zinc-500">
        {{ d?.feats?.length ?? 0 }} talentos
      </span>
      <button @click="onOpenEditor('feat')"
        class="flex items-center gap-1 text-xs text-zinc-300 border border-zinc-700 rounded-lg px-2.5 py-1.5 hover:bg-zinc-800 transition-colors">
        <Plus class="w-3.5 h-3.5" /> Novo Talento
      </button>
    </div>

    <div class="space-y-2">
      <div v-for="(feat, i) in d?.feats" :key="i"
        class="rounded-xl border border-zinc-800 bg-zinc-950/60 transition-all duration-200 hover:border-zinc-700 overflow-hidden group">
        <!-- Header row -->
        <div class="flex items-center gap-3 px-4 py-3">
          <div class="flex-1 cursor-pointer" @click="toggleExpand(i)">
            <div class="flex items-center gap-2">
              <component :is="feat.isAttack ? Swords : Zap"
                class="w-4 h-4 shrink-0"
                :class="feat.isAttack ? 'text-red-400' : 'text-primary'" />
              <span class="font-bold text-zinc-200 text-sm">{{ feat.title }}</span>
            </div>
            <div v-if="feat.isAttack" class="text-xs text-zinc-500 mt-0.5 ml-6">
              Ataque {{ resolveFormula(feat.attackFormula || '') }} · Dano {{ resolveFormula(feat.damageFormula || '') }}
            </div>
            <div v-else-if="feat.rollFormula" class="text-xs text-zinc-500 mt-0.5 ml-6">
              {{ feat.rollFormula }}
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-1">
            <button v-if="feat.isAttack"
              @click="onDualRoll(feat.title, feat.attackFormula || '', feat.damageFormula || '')"
              class="text-xs font-bold px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 transition-colors">
              Atacar
            </button>
            <button v-else-if="feat.rollFormula"
              @click="onRoll(feat.title, feat.rollFormula)"
              class="text-xs font-bold px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 transition-colors">
              Rolar
            </button>
            <button @click="onOpenEditor('feat', feat, i)" class="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-600 hover:text-zinc-300 transition-all">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            </button>
            <button @click="onDelete('feat', i)" class="opacity-0 group-hover:opacity-100 p-1.5 text-red-800 hover:text-red-500 transition-all">
              <Trash2 class="w-3.5 h-3.5" />
            </button>
            <button @click="toggleExpand(i)" class="p-1 text-zinc-600 hover:text-zinc-300 transition-colors">
              <ChevronDown v-if="!expanded.has(i)" class="w-4 h-4" />
              <ChevronUp v-else class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Expanded description -->
        <div v-if="expanded.has(i) && feat.description"
          class="border-t border-zinc-800/60 px-4 py-3 bg-zinc-900/30">
          <p class="text-sm text-zinc-400 whitespace-pre-wrap leading-relaxed">{{ feat.description }}</p>
        </div>
      </div>

      <div v-if="!d?.feats?.length" class="text-center py-12 text-zinc-600 text-sm">
        Nenhum talento ou ataque cadastrado.
      </div>
    </div>
  </div>
</template>

```


---
## FILE: src/components/sheet/tabs/ResourcesTab.vue
```vue
<script setup lang="ts">
import { Plus, RotateCcw, Trash2 } from 'lucide-vue-next'
import { ref } from 'vue'
import type { Sheet } from '@/types/sheet'

const props = defineProps<{
  sheet: Sheet
  editMode: boolean
  onAdjust: (i: number, delta: number) => void
  onReset: () => void
  onAdd: (name: string, max: number) => void
  onDelete: (i: number) => void
}>()

const newName = ref('')
const newMax = ref(3)
const showForm = ref(false)

function handleAdd() {
  if (!newName.value.trim()) return
  props.onAdd(newName.value, newMax.value)
  newName.value = ''
  newMax.value = 3
  showForm.value = false
}

const barColor = (cur: number, max: number) => {
  const p = max ? (cur / max) : 0
  if (p > 0.6) return '#8b5cf6'
  if (p > 0.3) return '#f59e0b'
  return '#ef4444'
}
</script>

<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <button @click="onReset"
        class="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-800 rounded-lg px-3 py-2 hover:bg-zinc-800 transition-colors">
        <RotateCcw class="w-3.5 h-3.5" /> Descanso Longo (Reset Tudo)
      </button>
      <button @click="showForm = !showForm"
        class="flex items-center gap-1 text-xs text-primary border border-primary/30 rounded-lg px-2.5 py-1.5 hover:bg-primary/10 transition-colors">
        <Plus class="w-3.5 h-3.5" /> Novo Recurso
      </button>
    </div>

    <!-- Add form -->
    <div v-if="showForm" class="flex gap-2 p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
      <input v-model="newName" placeholder="Nome (ex: Fúria do Bárbaro)"
        class="flex-1 bg-transparent text-sm border-b border-zinc-700 focus:border-primary focus:outline-none text-zinc-200 placeholder-zinc-600 px-1 py-1" />
      <input v-model.number="newMax" type="number" min="1" placeholder="Máx"
        class="w-14 text-center bg-transparent text-sm border-b border-zinc-700 focus:border-primary focus:outline-none text-zinc-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none" />
      <button @click="handleAdd" class="text-xs font-bold text-primary hover:text-primary/80 px-3 py-1 bg-primary/10 rounded-lg border border-primary/20">
        Criar
      </button>
    </div>

    <div v-if="!sheet.data?.resources?.length" class="text-center py-16 text-zinc-600">
      Nenhum recurso cadastrado.<br>
      <span class="text-xs">Use "Novo Recurso" para adicionar Fúria, Pontos Arcanos, etc.</span>
    </div>

    <!-- Resource List -->
    <div class="space-y-4">
      <div v-for="(res, i) in sheet.data?.resources" :key="i" class="group rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
        <div class="flex items-center justify-between mb-3">
          <span class="font-bold text-zinc-200">{{ res.name || res.label }}</span>
          <div class="flex items-center gap-2">
            <span class="text-sm text-zinc-400">{{ res.current ?? res.max }} / {{ res.max }}</span>
            <button @click="onDelete(i)" class="opacity-0 group-hover:opacity-100 text-red-700 hover:text-red-500 transition-all">
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Big bar -->
        <div class="h-4 bg-zinc-800 rounded-full overflow-hidden mb-3">
          <div class="h-full rounded-full transition-all duration-500"
            :style="{
              width: res.max ? (((res.current ?? res.max) / res.max) * 100) + '%' : '100%',
              backgroundColor: barColor(res.current ?? res.max, res.max)
            }" />
        </div>

        <!-- Controls -->
        <div class="flex items-center gap-3">
          <button @click="onAdjust(i, -5)"
            class="flex-1 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors text-sm font-bold">
            −5
          </button>
          <button @click="onAdjust(i, -1)"
            class="flex-1 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors text-sm font-bold">
            −1
          </button>
          <div class="text-center px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-900 min-w-[3rem]">
            <span class="text-xl font-extrabold font-serif tabular-nums" :style="{ color: barColor(res.current ?? res.max, res.max) }">
              {{ res.current ?? res.max }}
            </span>
          </div>
          <button @click="onAdjust(i, 1)"
            class="flex-1 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors text-sm font-bold">
            +1
          </button>
          <button @click="onAdjust(i, 5)"
            class="flex-1 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors text-sm font-bold">
            +5
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

```


---
## FILE: src/components/sheet/tabs/SkillsTab.vue
```vue
<script setup lang="ts">
import { computed } from 'vue'
import { Search } from 'lucide-vue-next'

const props = defineProps<{
  d: any
  editMode: boolean
  tabsEditMode: boolean
  editedData: any
  skillPhase: 'select' | 'allocate'
  skillSearch: string
  filteredSkillsList: { name: string; ability: string; trainedOnly?: boolean; ranks?: number }[]
  activeSkills: { name: string; ranks: number; ability: string }[]
  skillPointsSpent: number
  modStr: (n: number) => string
  modStrF: (n: number) => string
  skillAbilityMod: (ability: string) => number
  skillTotal: (name: string, ability: string) => number
  isClassSkill: (name: string) => boolean
  calcMod: (n: number) => number
  attrTotal: (key: string) => number
}>()

const emit = defineEmits<{
  (e: 'toggle-tabs-edit'): void
  (e: 'update:skill-phase', v: 'select' | 'allocate'): void
  (e: 'update:skill-search', v: string): void
  (e: 'toggle-skill-edit', name: string): void
  (e: 'adjust-rank', name: string, delta: 1 | -1): void
  (e: 'add-level-up-skill-points'): void
  (e: 'roll', label: string, formula: string): void
}>()

// In view mode show activeSkills. When searching, show filteredSkillsList filtered by active skills.
const displayedSkills = computed(() => {
  if (props.tabsEditMode) {
    return props.skillSearch ? props.filteredSkillsList : props.activeSkills
  }
  return props.skillSearch
    ? props.filteredSkillsList.filter(s => props.activeSkills.some(a => a.name === s.name))
    : props.activeSkills
})

function getRank(name: string): number {
  if (props.tabsEditMode && props.editedData?.skills) {
    return props.editedData.skills[name] ?? 0
  }
  const sk = props.activeSkills.find(s => s.name === name)
  return sk?.ranks ?? 0
}
</script>

<template>
  <div class="space-y-4">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-2">
      <div class="relative flex-1 min-w-48">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
        <input
          :value="skillSearch"
          @input="emit('update:skill-search', ($event.target as HTMLInputElement).value)"
          placeholder="Buscar perícia..."
          class="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-primary/60"
        />
      </div>
      <button
        @click="emit('toggle-tabs-edit')"
        class="text-xs font-bold px-3 py-2 rounded-lg border transition-all"
        :class="tabsEditMode
          ? 'bg-primary/20 border-primary text-primary'
          : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600'"
      >
        {{ tabsEditMode ? '✓ Concluir Edição' : 'Editar Perícias' }}
      </button>

      <div v-if="tabsEditMode" class="text-xs text-zinc-500">
        Gastos: <span class="font-bold text-primary">{{ skillPointsSpent }}</span>
        · Disponíveis: <span class="font-bold text-zinc-200">{{ editedData?.skillPoints ?? '?' }}</span>
      </div>
    </div>

    <!-- Table -->
    <div class="rounded-xl border border-zinc-800 overflow-hidden">
      <div class="grid grid-cols-[1fr_auto_auto_auto] text-[10px] font-bold uppercase tracking-widest text-zinc-600 px-4 py-2 bg-zinc-900/80 border-b border-zinc-800">
        <span>Perícia</span>
        <span class="text-center w-14">Mod</span>
        <span class="text-center w-20">Ranque</span>
        <span class="text-center w-14">Total</span>
      </div>

      <div class="divide-y divide-zinc-900">
        <div
          v-for="sk in displayedSkills"
          :key="sk.name"
          class="grid grid-cols-[1fr_auto_auto_auto] items-center px-4 py-2.5 transition-colors group"
          :class="!tabsEditMode ? 'cursor-pointer hover:bg-zinc-900/50' : 'hover:bg-zinc-900/30'"
          @click="!tabsEditMode && emit('roll', sk.name, '1d20 + @' + sk.ability + 'Mod')"
        >
          <!-- Name -->
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-bold text-zinc-600 uppercase w-6 text-center">{{ sk.ability }}</span>
            <div>
              <span class="text-sm font-medium transition-colors"
                :class="!tabsEditMode ? 'text-zinc-300 group-hover:text-primary' : 'text-zinc-300'">
                {{ sk.name }}
              </span>
              <!-- show class skill badge and toggle in edit mode -->
              <div v-if="tabsEditMode" class="flex items-center gap-1 mt-0.5">
                <span v-if="isClassSkill(sk.name)" class="text-[9px] text-primary/70 bg-primary/10 rounded px-1">classe</span>
              </div>
            </div>
            <span v-if="!tabsEditMode && isClassSkill(sk.name)" class="text-[9px] text-primary/70 bg-primary/10 rounded px-1">classe</span>
          </div>

          <!-- Ability mod -->
          <div class="text-center w-14 text-xs text-zinc-400 tabular-nums">
            {{ modStrF(skillAbilityMod(sk.ability)) }}
          </div>

          <!-- Rank -->
          <div class="text-center w-20">
            <div v-if="tabsEditMode" class="flex items-center justify-center gap-1">
              <button
                @click.stop="emit('adjust-rank', sk.name, -1)"
                class="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 text-sm flex items-center justify-center text-zinc-400 leading-none"
              >−</button>
              <span class="w-6 text-center text-xs font-bold tabular-nums text-zinc-200">{{ getRank(sk.name) }}</span>
              <button
                @click.stop="emit('adjust-rank', sk.name, 1)"
                class="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 text-sm flex items-center justify-center text-zinc-400 leading-none"
              >+</button>
            </div>
            <span v-else class="text-xs text-zinc-500 tabular-nums">{{ getRank(sk.name) }}</span>
          </div>

          <!-- Total -->
          <div class="text-center w-14">
            <span class="text-sm font-bold tabular-nums"
              :class="skillTotal(sk.name, sk.ability) >= 10 ? 'text-primary' : 'text-zinc-300'">
              {{ modStr(skillTotal(sk.name, sk.ability)) }}
            </span>
          </div>
        </div>

        <div v-if="!displayedSkills.length" class="text-center py-10 text-zinc-600 text-sm">
          Nenhuma perícia encontrada.
        </div>
      </div>
    </div>
  </div>
</template>

```


---
## FILE: src/components/sheet/tabs/SpellsTab.vue
```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { Wand2, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-vue-next'

const props = defineProps<{
  d: any
  editMode: boolean
  tabsEditMode: boolean
  spellSlotsMax: Record<number, number>
  spellSlotsUsed: Record<number, number>
  SPELL_LEVELS: number[]
  modStr: (n: number) => string
  resolveFormula: (formula: string) => string
  onOpenEditor: (type: string, item?: any, index?: number) => void
  onDelete: (type: string, index: number) => void
  onRollItem: (label: string, formula: string, isAtk: boolean, atkF: string, dmgF: string) => void
  onAdjustSlot: (level: number, delta: number, field: 'used' | 'max') => void
  onToggleEdit: () => void
}>()

const expanded = ref<Set<number>>(new Set())
function toggleExpand(i: number) {
  if (expanded.value.has(i)) expanded.value.delete(i)
  else expanded.value.add(i)
}

const spellsByLevel = computed(() => {
  const groups: Record<number, { spell: any; index: number }[]> = {}
  props.d?.spells?.forEach((sp: any, i: number) => {
    const lv = sp.spellLevel ?? 0
    if (!groups[lv]) groups[lv] = []
    groups[lv].push({ spell: sp, index: i })
  })
  return groups
})

const usedLevels = computed(() => Object.keys(spellsByLevel.value).map(Number).sort())
</script>

<template>
  <div class="space-y-4">
    <!-- Tab toolbar -->
    <div class="bg-zinc-900/60 border border-zinc-800 rounded-xl px-3 py-2 flex items-center justify-between">
      <button @click="onToggleEdit"
        class="text-xs font-bold px-3 py-1.5 rounded-lg border transition-all"
        :class="tabsEditMode
          ? 'bg-primary/20 border-primary text-primary'
          : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'">
        {{ tabsEditMode ? '✓ Concluir' : 'Editar Slots' }}
      </button>
      <button @click="onOpenEditor('spell')"
        class="flex items-center gap-1 text-xs text-zinc-300 border border-zinc-700 rounded-lg px-2.5 py-1.5 hover:bg-zinc-800 transition-colors">
        <Plus class="w-3.5 h-3.5" /> Nova Magia
      </button>
    </div>

    <!-- Spell Levels -->
    <div v-for="level in usedLevels" :key="level" class="space-y-2">
      <!-- Level header with slot tracker -->
      <div class="flex items-center gap-3 px-1">
        <div class="flex items-center gap-2">
          <Wand2 class="w-3.5 h-3.5 text-violet-400" />
          <span class="text-xs font-black uppercase tracking-widest text-zinc-400">
            {{ level === 0 ? 'Truques (Nível 0)' : `Nível ${level}` }}
          </span>
        </div>
        <!-- Slot pips -->
        <div class="flex items-center gap-1 ml-auto">
          <template v-if="(spellSlotsMax[level] ?? 0) > 0">
            <button
              v-for="s in spellSlotsMax[level]" :key="s"
              @click="onAdjustSlot(level, (s as number) <= (spellSlotsUsed[level] ?? 0) ? -1 : 1, 'used')"
              class="w-4 h-4 rounded-full border transition-colors"
              :class="(s as number) <= (spellSlotsUsed[level] ?? 0)
                ? 'bg-zinc-700 border-zinc-600'
                : 'bg-violet-500/80 border-violet-400/60 hover:bg-violet-400'"
            />
            <template v-if="tabsEditMode">
              <button @click="onAdjustSlot(level, -1, 'max')" class="ml-1 text-zinc-600 hover:text-zinc-300 text-xs">−</button>
              <button @click="onAdjustSlot(level, 1, 'max')" class="text-zinc-600 hover:text-zinc-300 text-xs">+</button>
            </template>
          </template>
          <template v-else-if="tabsEditMode">
            <button @click="onAdjustSlot(level, 1, 'max')" class="text-xs text-primary/60 hover:text-primary border border-primary/20 rounded px-1">+ slot</button>
          </template>
        </div>
      </div>

      <!-- Spells -->
      <div class="space-y-1.5">
        <div v-for="{ spell, index } in spellsByLevel[level]" :key="index"
          class="group rounded-xl border border-zinc-800 bg-zinc-950/60 overflow-hidden hover:border-zinc-700 transition-colors">
          <div class="flex items-center gap-3 px-4 py-2.5 cursor-pointer" @click="toggleExpand(index)">
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <span class="font-bold text-sm text-violet-200">{{ spell.title }}</span>
                <span v-if="spell.school" class="text-[10px] text-zinc-600 bg-zinc-800 rounded px-1.5 py-0.5">{{ spell.school }}</span>
              </div>
              <div class="flex flex-wrap gap-2 mt-0.5 text-[10px] text-zinc-600">
                <span v-if="spell.castingTime">⏱ {{ spell.castingTime }}</span>
                <span v-if="spell.range">📍 {{ spell.range }}</span>
                <span v-if="spell.duration">⌚ {{ spell.duration }}</span>
              </div>
            </div>

            <div class="flex gap-1 items-center">
              <button v-if="spell.rollFormula" @click.stop="onRollItem(spell.title, spell.rollFormula, false, '', '')"
                class="text-xs font-bold px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 transition-colors">
                Rolar
              </button>
              <button @click.stop="onOpenEditor('spell', spell, index)" class="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-600 hover:text-zinc-300 transition-all">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
              </button>
              <button @click.stop="onDelete('spell', index)" class="opacity-0 group-hover:opacity-100 p-1.5 text-red-800 hover:text-red-500 transition-all">
                <Trash2 class="w-3.5 h-3.5" />
              </button>
              <ChevronDown v-if="!expanded.has(index)" class="w-4 h-4 text-zinc-600" />
              <ChevronUp v-else class="w-4 h-4 text-zinc-600" />
            </div>
          </div>

          <div v-if="expanded.has(index) && spell.description" class="border-t border-zinc-800/60 px-4 py-3 bg-zinc-900/30">
            <p class="text-sm text-zinc-400 whitespace-pre-wrap leading-relaxed">{{ spell.description }}</p>
            <div v-if="spell.savingThrow || spell.spellResist" class="flex gap-4 mt-2 text-xs text-zinc-500">
              <span v-if="spell.savingThrow">🛡 {{ spell.savingThrow }}</span>
              <span v-if="spell.spellResist">RM: {{ spell.spellResist }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!d?.spells?.length" class="text-center py-12 text-zinc-600 text-sm">
      Nenhuma magia cadastrada.
    </div>
  </div>
</template>

```


---
## FILE: src/components/sheet/tabs/SummaryTab.vue
```vue
<script setup lang="ts">
import { ChevronDown, ChevronUp, Swords, Zap, Wand2, Package, Flame } from 'lucide-vue-next'
import { ref } from 'vue'
import VitalsBlock from '@/components/sheet/blocks/VitalsBlock.vue'
import AttrsBlock from '@/components/sheet/blocks/AttrsBlock.vue'
import CombatBlock from '@/components/sheet/blocks/CombatBlock.vue'
import ShortcutsBlock from '@/components/sheet/blocks/ShortcutsBlock.vue'
import ResourcesBlock from '@/components/sheet/blocks/ResourcesBlock.vue'
import type { Sheet } from '@/types/sheet'

const props = defineProps<{
  sheet: Sheet
  d: any
  editMode: boolean
  editedData: any
  // combat
  totalHP: number
  totalCA: number
  totalTouch: number
  totalFlatFooted: number
  totalBAB: number
  totalInitiative: number
  totalSpeed: number
  meleeAtk: number
  rangedAtk: number
  grappleAtk: number
  totalFort: number
  totalRef: number
  totalWill: number
  deathStatus: { label: string; color: string } | null
  // attrs
  attrTotal: (key: string) => number
  calcMod: (n: number) => number
  modStr: (n: number) => string
  modStrF: (n: number) => string
  resolveFormula: (formula: string) => string
  ATTR_KEYS: readonly string[]
  ATTR_LABELS: Record<string, string>
}>()

const emit = defineEmits<{
  (e: 'save-hp'): void
  (e: 'roll', label: string, formula: string): void
  (e: 'roll-item', label: string, formula: string, isAtk: boolean, atkF: string, dmgF: string): void
  (e: 'add-shortcut'): void
  (e: 'delete-shortcut', i: number): void
  (e: 'add-resource', name: string, max: number): void
  (e: 'adjust-resource', i: number, delta: number): void
  (e: 'reset-resources'): void
  (e: 'delete-resource', i: number): void
}>()

// ── Collapsible summary panels ────────────────────────────────────────
const openPanels = ref<Set<string>>(new Set())
function togglePanel(id: string) {
  if (openPanels.value.has(id)) openPanels.value.delete(id)
  else openPanels.value.add(id)
}

const SUMMARY_PANELS = [
  { id: 'spells',    label: 'Magias',       icon: Wand2 },
  { id: 'feats',     label: 'Talentos',     icon: Swords },
  { id: 'equipment', label: 'Equipamentos', icon: Package },
  { id: 'buffs',     label: 'Buffs',        icon: Flame },
]

function panelCount(id: string) {
  return (props.d as any)?.[id]?.length ?? 0
}
</script>

<template>
  <div class="space-y-3">

    <!--
      ═══════════════════════════════════════════════════════════
      MAIN GRID  (fixed layout, no drag-and-drop)
      ─────────────────────────────────────────────────────────
      2 columns:  [attrs-col]  [content-col]
      ═══════════════════════════════════════════════════════════
    -->
    <div class="grid gap-3" style="grid-template-columns: auto 1fr;">

      <!-- ── LEFT: Attributes (vertical label) ────────────────── -->
      <div class="row-span-3">
        <AttrsBlock
          :attr-total="attrTotal"
          :calc-mod="calcMod"
          :mod-str="modStr"
          :edit-mode="editMode"
          :edited-data="editedData"
          :ATTR_KEYS="ATTR_KEYS"
          :ATTR_LABELS="ATTR_LABELS"
          :on-roll="(l, f) => emit('roll', l, f)"
          :vertical="true"
        />
      </div>

      <!-- ── RIGHT column: inner 3-row layout ─────────────────── -->

      <!-- Row 1: VIDA  |  SAVE (Fort/Ref/Will)  |  BUFFS resumo -->
      <div class="grid gap-3" style="grid-template-columns: 1fr 1fr 1fr;">

        <!-- VIDA -->
        <VitalsBlock
          :sheet="sheet"
          :total-h-p="totalHP"
          :death-status="deathStatus"
          :on-save-h-p="() => emit('save-hp')"
        />

        <!-- SAVES -->
        <div class="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 flex flex-col gap-2 justify-center">
          <div class="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1 text-center">Salvaguardas</div>
          <button @click="emit('roll', 'Fortitude', '1d20 + @fort')"
            class="rounded-lg bg-zinc-900/60 border border-zinc-800 px-2 py-1.5 hover:border-primary/40 hover:bg-primary/5 transition-colors flex flex-col items-center">
            <div class="text-[10px] text-zinc-500 font-bold uppercase mb-0.5">Fortitude</div>
            <div class="text-base font-extrabold font-serif text-zinc-100">{{ modStr(totalFort) }}</div>
          </button>
          <button @click="emit('roll', 'Reflexos', '1d20 + @ref')"
            class="rounded-lg bg-zinc-900/60 border border-zinc-800 px-2 py-1.5 hover:border-primary/40 hover:bg-primary/5 transition-colors flex flex-col items-center">
            <div class="text-[10px] text-zinc-500 font-bold uppercase mb-0.5">Reflexos</div>
            <div class="text-base font-extrabold font-serif text-zinc-100">{{ modStr(totalRef) }}</div>
          </button>
          <button @click="emit('roll', 'Vontade', '1d20 + @will')"
            class="rounded-lg bg-zinc-900/60 border border-zinc-800 px-2 py-1.5 hover:border-primary/40 hover:bg-primary/5 transition-colors flex flex-col items-center">
            <div class="text-[10px] text-zinc-500 font-bold uppercase mb-0.5">Vontade</div>
            <div class="text-base font-extrabold font-serif text-zinc-100">{{ modStr(totalWill) }}</div>
          </button>
        </div>

        <!-- BUFFS mini-list -->
        <div class="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 overflow-hidden">
          <div class="flex items-center gap-2 mb-2">
            <Flame class="w-3.5 h-3.5 text-zinc-500" />
            <span class="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Buffs Ativos</span>
          </div>
          <div v-if="!d?.buffs?.filter((b: any) => b.active).length"
            class="text-center py-3 text-zinc-600 text-xs">Nenhum buff.</div>
          <div v-else class="space-y-1 overflow-y-auto max-h-40">
            <div v-for="(buf, i) in d.buffs.filter((b: any) => b.active)" :key="i"
              class="flex items-center gap-1.5 py-1 border-b border-zinc-800/40 last:border-0">
              <Flame class="w-3 h-3 shrink-0 text-primary" />
              <span class="text-xs text-zinc-200 truncate">{{ buf.title }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Row 2: Recursos de Combate (full-width within right col) -->
      <CombatBlock
        :mod-str="modStr"
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
        :on-roll="(l, f) => emit('roll', l, f)"
        :hide-saves="true"
      />

      <!-- Row 3: Atalhos + Recursos -->
      <div class="grid gap-3" style="grid-template-columns: 1fr auto;">
        <ShortcutsBlock
          :d="d"
          :mod-str="modStr"
          :resolve-formula="resolveFormula"
          :edit-mode="editMode"
          :on-roll-item="(l, f, a, af, df) => emit('roll-item', l, f, a, af, df)"
          :on-add-shortcut="() => emit('add-shortcut')"
          :on-delete-shortcut="(idx) => emit('delete-shortcut', idx)"
        />
        <ResourcesBlock
          :sheet="sheet"
          :edit-mode="editMode"
          :on-adjust="(idx, delta) => emit('adjust-resource', idx, delta)"
          :on-reset="() => emit('reset-resources')"
          :on-add="(n, m) => emit('add-resource', n, m)"
          :on-delete="(idx) => emit('delete-resource', idx)"
        />
      </div>
    </div>

    <!-- ── Collapsible panels (Magias / Talentos / Equipamentos / Buffs) ── -->
    <div class="space-y-2 pt-1">
      <div v-for="panel in SUMMARY_PANELS" :key="panel.id"
        class="rounded-xl border border-zinc-800 bg-zinc-950/60 overflow-hidden">

        <!-- Panel header -->
        <button
          class="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-900/40 transition-colors"
          @click="togglePanel(panel.id)">
          <div class="flex items-center gap-2">
            <component :is="panel.icon" class="w-4 h-4 text-zinc-500" />
            <span class="text-sm font-bold text-zinc-300">{{ panel.label }}</span>
            <span class="text-xs text-zinc-600 bg-zinc-800 rounded-full px-2 py-0.5">{{ panelCount(panel.id) }}</span>
          </div>
          <ChevronDown v-if="!openPanels.has(panel.id)" class="w-4 h-4 text-zinc-600" />
          <ChevronUp v-else class="w-4 h-4 text-zinc-600" />
        </button>

        <!-- Panel content -->
        <div v-if="openPanels.has(panel.id)" class="border-t border-zinc-800/50 px-4 py-3 space-y-2">

          <!-- MAGIAS -->
          <template v-if="panel.id === 'spells'">
            <div v-if="!d?.spells?.length" class="text-center py-4 text-zinc-600 text-xs">Nenhuma magia.</div>
            <div v-else class="space-y-1">
              <div v-for="(spell, i) in d.spells" :key="i"
                class="flex items-center justify-between py-1.5 border-b border-zinc-800/40 last:border-0">
                <div>
                  <span class="text-sm font-semibold text-violet-200">{{ spell.title }}</span>
                  <span v-if="spell.school" class="ml-2 text-[10px] text-zinc-600 bg-zinc-800 rounded px-1.5">{{ spell.school }}</span>
                  <span class="ml-2 text-[10px] text-zinc-600">Nv.{{ spell.spellLevel ?? 0 }}</span>
                </div>
                <button v-if="spell.rollFormula"
                  @click="emit('roll', spell.title, spell.rollFormula)"
                  class="text-xs px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 transition-colors">
                  Rolar
                </button>
              </div>
            </div>
          </template>

          <!-- TALENTOS -->
          <template v-else-if="panel.id === 'feats'">
            <div v-if="!d?.feats?.length" class="text-center py-4 text-zinc-600 text-xs">Nenhum talento.</div>
            <div v-else class="space-y-1">
              <div v-for="(feat, i) in d.feats" :key="i"
                class="flex items-center justify-between py-1.5 border-b border-zinc-800/40 last:border-0">
                <div class="flex items-center gap-2">
                  <component :is="feat.isAttack ? Swords : Zap"
                    class="w-3.5 h-3.5 shrink-0"
                    :class="feat.isAttack ? 'text-red-400' : 'text-primary'" />
                  <span class="text-sm font-semibold text-zinc-200">{{ feat.title }}</span>
                </div>
                <button v-if="feat.isAttack"
                  @click="emit('roll-item', feat.title, feat.attackFormula || '', true, feat.attackFormula || '', feat.damageFormula || '')"
                  class="text-xs px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 transition-colors">
                  Atacar
                </button>
                <button v-else-if="feat.rollFormula"
                  @click="emit('roll', feat.title, feat.rollFormula)"
                  class="text-xs px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 transition-colors">
                  Rolar
                </button>
              </div>
            </div>
          </template>

          <!-- EQUIPAMENTOS -->
          <template v-else-if="panel.id === 'equipment'">
            <div v-if="!d?.equipment?.length" class="text-center py-4 text-zinc-600 text-xs">Nenhum item.</div>
            <div v-else class="space-y-1">
              <div v-for="(item, i) in d.equipment" :key="i"
                class="flex items-center justify-between py-1.5 border-b border-zinc-800/40 last:border-0">
                <div>
                  <span class="text-sm font-semibold"
                    :class="item.equipped ? 'text-primary/90' : 'text-zinc-300'">{{ item.title }}</span>
                  <span v-if="item.equipped" class="ml-2 text-[10px] text-primary/50">• equipado</span>
                  <span v-if="item.weight" class="ml-2 text-[10px] text-zinc-600">{{ item.weight }}kg</span>
                </div>
                <Package class="w-3.5 h-3.5 shrink-0"
                  :class="item.equipped ? 'text-primary/60' : 'text-zinc-700'" />
              </div>
            </div>
          </template>

          <!-- BUFFS -->
          <template v-else-if="panel.id === 'buffs'">
            <div v-if="!d?.buffs?.length" class="text-center py-4 text-zinc-600 text-xs">Nenhum buff.</div>
            <div v-else class="space-y-1">
              <div v-for="(buf, i) in d.buffs" :key="i"
                class="flex items-center gap-3 py-1.5 border-b border-zinc-800/40 last:border-0">
                <Flame class="w-3.5 h-3.5 shrink-0"
                  :class="buf.active ? 'text-primary' : 'text-zinc-700'" />
                <div class="flex-1">
                  <span class="text-sm font-semibold"
                    :class="buf.active ? 'text-zinc-200' : 'text-zinc-500'">{{ buf.title }}</span>
                  <div v-if="buf.modifiers?.length" class="text-[10px] text-zinc-600 mt-0.5">
                    {{ buf.modifiers.map((m: any) => `${m.target} ${modStr(m.value)}`).join(' · ') }}
                  </div>
                </div>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                  :class="buf.active
                    ? 'bg-primary/10 text-primary border-primary/30'
                    : 'bg-zinc-800 text-zinc-600 border-zinc-700'">
                  {{ buf.active ? 'Ativo' : 'Inativo' }}
                </span>
              </div>
            </div>
          </template>

        </div>
      </div>
    </div>

  </div>
</template>

```


---
## FILE: src/components/ui/button/Button.vue
```vue
<script setup lang="ts">
import { type HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import { Primitive, type PrimitiveProps } from 'radix-vue'
import { cva, type VariantProps } from 'class-variance-authority'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline:
          'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
        secondary:
          'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

interface Props extends PrimitiveProps {
  variant?: VariantProps<typeof buttonVariants>['variant']
  size?: VariantProps<typeof buttonVariants>['size']
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  as: 'button',
})
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    :class="cn(buttonVariants({ variant, size }), props.class)"
  >
    <slot />
  </Primitive>
</template>

```


---
## FILE: src/components/ui/button/index.ts
```typescript
import { cva, type VariantProps } from 'class-variance-authority'

export { default as Button } from './Button.vue'

export const buttonVariants = cva(
    'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
    {
        variants: {
            variant: {
                default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
                destructive:
                    'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
                outline:
                    'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
                secondary:
                    'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
                ghost: 'hover:bg-accent hover:text-accent-foreground',
                link: 'text-primary underline-offset-4 hover:underline',
            },
            size: {
                default: 'h-9 px-4 py-2',
                sm: 'h-8 rounded-md px-3 text-xs',
                lg: 'h-10 rounded-md px-8',
                icon: 'h-9 w-9',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
)

export type ButtonVariants = VariantProps<typeof buttonVariants>

```


---
## FILE: src/components/ui/card/Card.vue
```vue
<script setup lang="ts">
import { type HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div
    :class="
      cn(
        'rounded-xl border bg-card text-card-foreground shadow',
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>

```


---
## FILE: src/components/ui/card/CardContent.vue
```vue
<script setup lang="ts">
import { type HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div :class="cn('p-6 pt-0', props.class)">
    <slot />
  </div>
</template>

```


---
## FILE: src/components/ui/card/CardDescription.vue
```vue
<script setup lang="ts">
import { type HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <p :class="cn('text-sm text-muted-foreground', props.class)">
    <slot />
  </p>
</template>

```


---
## FILE: src/components/ui/card/CardFooter.vue
```vue
<script setup lang="ts">
import { type HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div :class="cn('flex items-center p-6 pt-0', props.class)">
    <slot />
  </div>
</template>

```


---
## FILE: src/components/ui/card/CardHeader.vue
```vue
<script setup lang="ts">
import { type HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div :class="cn('flex flex-col space-y-1.5 p-6', props.class)">
    <slot />
  </div>
</template>

```


---
## FILE: src/components/ui/card/CardTitle.vue
```vue
<script setup lang="ts">
import { type HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <h3 :class="cn('font-semibold leading-none tracking-tight', props.class)">
    <slot />
  </h3>
</template>

```


---
## FILE: src/components/ui/card/index.ts
```typescript
export { default as Card } from './Card.vue'
export { default as CardHeader } from './CardHeader.vue'
export { default as CardTitle } from './CardTitle.vue'
export { default as CardDescription } from './CardDescription.vue'
export { default as CardContent } from './CardContent.vue'
export { default as CardFooter } from './CardFooter.vue'

```


---
## FILE: src/components/ui/checkbox/Checkbox.vue
```vue
<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { CheckboxIndicator, CheckboxRoot, type CheckboxRootEmits, type CheckboxRootProps, useForwardPropsEmits } from 'radix-vue'
import { Check } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

const props = defineProps<CheckboxRootProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<CheckboxRootEmits>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props

  return delegated
})

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <CheckboxRoot
    v-bind="forwarded"
    :class="cn('peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground', props.class)"
  >
    <CheckboxIndicator class="flex h-full w-full items-center justify-center text-current">
      <Check class="h-4 w-4" />
    </CheckboxIndicator>
  </CheckboxRoot>
</template>

```


---
## FILE: src/components/ui/checkbox/index.ts
```typescript
export { default as Checkbox } from './Checkbox.vue'

```


---
## FILE: src/components/ui/input/index.ts
```typescript
export { default as Input } from './Input.vue'

```


---
## FILE: src/components/ui/input/Input.vue
```vue
<script setup lang="ts">
import { type HTMLAttributes } from 'vue'
import { useVModel } from '@vueuse/core'
import { cn } from '@/lib/utils'

const props = defineProps<{
  defaultValue?: string | number
  modelValue?: string | number
  class?: HTMLAttributes['class']
}>()

const emits = defineEmits<{
  (e: 'update:modelValue', payload: string | number): void
}>()

const modelValue = useVModel(props, 'modelValue', emits, {
  passive: true,
  defaultValue: props.defaultValue,
})
</script>

<template>
  <input
    v-model="modelValue"
    :class="cn('flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50', props.class)"
  />
</template>

```


---
## FILE: src/components/ui/label/index.ts
```typescript
export { default as Label } from './Label.vue'

```


---
## FILE: src/components/ui/label/Label.vue
```vue
<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { Label, type LabelProps } from 'radix-vue'
import { cn } from '@/lib/utils'

const props = defineProps<LabelProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props

  return delegated
})
</script>

<template>
  <Label
    v-bind="delegatedProps"
    :class="
      cn(
        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        props.class,
      )
    "
  >
    <slot />
  </Label>
</template>

```


---
## FILE: src/components/ui/radio-group/index.ts
```typescript
export { default as RadioGroup } from './RadioGroup.vue'
export { default as RadioGroupItem } from './RadioGroupItem.vue'

```


---
## FILE: src/components/ui/radio-group/RadioGroup.vue
```vue
<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { RadioGroupRoot, type RadioGroupRootEmits, type RadioGroupRootProps, useForwardPropsEmits } from 'radix-vue'
import { cn } from '@/lib/utils'

const props = defineProps<RadioGroupRootProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<RadioGroupRootEmits>()

const delegatedProps = computed(() => {
    const { class: _, ...delegated } = props

    return delegated
})

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
    <RadioGroupRoot :class="cn('grid gap-2', props.class)" v-bind="forwarded">
        <slot />
    </RadioGroupRoot>
</template>

```


---
## FILE: src/components/ui/radio-group/RadioGroupItem.vue
```vue
<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { RadioGroupIndicator, RadioGroupItem, type RadioGroupItemProps, useForwardProps } from 'radix-vue'
import { Circle } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

const props = defineProps<RadioGroupItemProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
    const { class: _, ...delegated } = props

    return delegated
})

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
    <RadioGroupItem v-bind="forwardedProps" :class="cn(
        'aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        props.class,
    )
        ">
        <RadioGroupIndicator class="flex items-center justify-center">
            <Circle class="h-2.5 w-2.5 fill-current text-current" />
        </RadioGroupIndicator>
    </RadioGroupItem>
</template>

```


---
## FILE: src/components/ui/select/index.ts
```typescript
export { default as Select } from './Select.vue'
export { default as SelectTrigger } from './SelectTrigger.vue'
export { default as SelectValue } from './SelectValue.vue'
export { default as SelectContent } from './SelectContent.vue'
export { default as SelectItem } from './SelectItem.vue'

```


---
## FILE: src/components/ui/select/Select.vue
```vue
<script setup lang="ts">
import { SelectRoot, type SelectRootEmits, type SelectRootProps, useForwardPropsEmits } from 'radix-vue'

const props = defineProps<SelectRootProps>()
const emits = defineEmits<SelectRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <SelectRoot v-bind="forwarded">
    <slot />
  </SelectRoot>
</template>

```


---
## FILE: src/components/ui/select/SelectContent.vue
```vue
<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { SelectContent, type SelectContentEmits, type SelectContentProps, SelectPortal, SelectViewport, useForwardPropsEmits } from 'radix-vue'
import { cn } from '@/lib/utils'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<SelectContentProps & { class?: HTMLAttributes['class'] }>(), {
  position: 'popper',
})
const emits = defineEmits<SelectContentEmits>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props

  return delegated
})

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <SelectPortal>
    <SelectContent
      v-bind="{ ...forwarded, ...$attrs }"
      :class="cn(
        'relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        position === 'popper' &&
          'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
        props.class,
      )"
    >
      <SelectViewport :class="cn('p-1', position === 'popper' && 'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]')">
        <slot />
      </SelectViewport>
    </SelectContent>
  </SelectPortal>
</template>

```


---
## FILE: src/components/ui/select/SelectItem.vue
```vue
<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { SelectItem, type SelectItemProps, SelectItemText, SelectItemIndicator, useForwardProps } from 'radix-vue'
import { Check } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

const props = defineProps<SelectItemProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props

  return delegated
})

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <SelectItem
    v-bind="forwardedProps"
    :class="cn(
      'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      props.class,
    )"
  >
    <span class="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectItemIndicator>
        <Check class="h-4 w-4" />
      </SelectItemIndicator>
    </span>

    <SelectItemText>
      <slot />
    </SelectItemText>
  </SelectItem>
</template>

```


---
## FILE: src/components/ui/select/SelectTrigger.vue
```vue
<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { SelectIcon, SelectTrigger, type SelectTriggerProps, useForwardProps } from 'radix-vue'
import { ChevronDown } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

const props = defineProps<SelectTriggerProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props

  return delegated
})

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <SelectTrigger
    v-bind="forwardedProps"
    :class="cn(
      'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
      props.class,
    )"
  >
    <slot />
    <SelectIcon as-child>
      <ChevronDown class="h-4 w-4 opacity-50" />
    </SelectIcon>
  </SelectTrigger>
</template>

```


---
## FILE: src/components/ui/select/SelectValue.vue
```vue
<script setup lang="ts">
import { SelectValue, type SelectValueProps } from 'radix-vue'

const props = defineProps<SelectValueProps>()
</script>

<template>
  <SelectValue v-bind="props">
    <slot />
  </SelectValue>
</template>

```


---
## FILE: src/components/ui/tabs/index.ts
```typescript
export { default as Tabs } from './Tabs.vue'
export { default as TabsList } from './TabsList.vue'
export { default as TabsTrigger } from './TabsTrigger.vue'
export { default as TabsContent } from './TabsContent.vue'

```


---
## FILE: src/components/ui/tabs/Tabs.vue
```vue
<script setup lang="ts">
import { TabsRoot, type TabsRootEmits, type TabsRootProps, useForwardPropsEmits } from 'radix-vue'

const props = defineProps<TabsRootProps>()
const emits = defineEmits<TabsRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
    <TabsRoot v-bind="forwarded">
        <slot />
    </TabsRoot>
</template>

```


---
## FILE: src/components/ui/tabs/TabsContent.vue
```vue
<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { TabsContent, type TabsContentProps } from 'radix-vue'
import { cn } from '@/lib/utils'

const props = defineProps<TabsContentProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
    const { class: _, ...delegated } = props

    return delegated
})
</script>

<template>
    <TabsContent v-bind="delegatedProps" :class="cn(
        'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        props.class,
    )">
        <slot />
    </TabsContent>
</template>

```


---
## FILE: src/components/ui/tabs/TabsList.vue
```vue
<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { TabsList, type TabsListProps } from 'radix-vue'
import { cn } from '@/lib/utils'

const props = defineProps<TabsListProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
    const { class: _, ...delegated } = props

    return delegated
})
</script>

<template>
    <TabsList v-bind="delegatedProps" :class="cn(
        'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
        props.class,
    )">
        <slot />
    </TabsList>
</template>

```


---
## FILE: src/components/ui/tabs/TabsTrigger.vue
```vue
<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { TabsTrigger, type TabsTriggerProps, useForwardProps } from 'radix-vue'
import { cn } from '@/lib/utils'

const props = defineProps<TabsTriggerProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
    const { class: _, ...delegated } = props

    return delegated
})

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
    <TabsTrigger v-bind="forwardedProps" :class="cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
        props.class,
    )">
        <slot />
    </TabsTrigger>
</template>

```


---
## FILE: src/components/ui/textarea/index.ts
```typescript
export { default as Textarea } from './Textarea.vue'

```


---
## FILE: src/components/ui/textarea/Textarea.vue
```vue
<script setup lang="ts">
import { type HTMLAttributes } from 'vue'
import { useVModel } from '@vueuse/core'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
  defaultValue?: string | number
  modelValue?: string | number
}>()

const emits = defineEmits<{
  (e: 'update:modelValue', payload: string | number): void
}>()

const modelValue = useVModel(props, 'modelValue', emits, {
  passive: true,
  defaultValue: props.defaultValue,
})
</script>

<template>
  <textarea
    v-model="modelValue"
    :class="cn('flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50', props.class)"
  />
</template>

```


---
## FILE: src/components/wizard/steps/AttributesStep.vue
```vue
<script setup lang="ts">
import { useWizardStore } from '@/stores/wizardStore'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const store = useWizardStore()

const attributes = [
  { key: 'str', label: 'Força' },
  { key: 'dex', label: 'Destreza' },
  { key: 'con', label: 'Constituição' },
  { key: 'int', label: 'Inteligência' },
  { key: 'wis', label: 'Sabedoria' },
  { key: 'cha', label: 'Carisma' },
] as const

function calculateModifier(score: number) {
  return Math.floor((score - 10) / 2)
}

function getModifierString(score: number) {
  const mod = calculateModifier(score)
  return mod >= 0 ? `+${mod}` : `${mod}`
}
</script>

<template>
  <div class="grid gap-6">
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div v-for="attr in attributes" :key="attr.key" class="border rounded-lg p-4 bg-muted/20">
        <label class="block text-center font-bold mb-2">{{ attr.label }}</label>

        <div class="grid grid-cols-2 gap-4">
          <div class="grid gap-1">
            <Label class="text-xs text-center">Valor Base</Label>
            <Input type="number" v-model.number="store.character.attributes[attr.key].base" class="text-center" />
          </div>
          <div class="grid gap-1">
            <Label class="text-xs text-center">Temp</Label>
            <Input type="number" v-model.number="store.character.attributes[attr.key].temp" class="text-center" />
          </div>
        </div>

        <div class="mt-4 flex justify-between items-center border-t pt-2">
          <span class="text-sm font-semibold">Modificador:</span>
          <span class="text-lg font-bold">
            {{ getModifierString(store.character.attributes[attr.key].base + (store.character.attributes[attr.key].temp
            || 0)) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

```


---
## FILE: src/components/wizard/steps/BasicInfoStep.vue
```vue
<script setup lang="ts">
import { useWizardStore } from '@/stores/wizardStore'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { computed } from 'vue'

const store = useWizardStore()

const races = ['Personalizada', 'Humano', 'Anão', 'Elfo', 'Gnomo', 'Meio-Elfo', 'Meio-Orc', 'Halfling']
const classes = ['Personalizada', 'Bárbaro', 'Bardo', 'Clérigo', 'Druida', 'Guerreiro', 'Monge', 'Paladino', 'Ranger', 'Ladino', 'Feiticeiro', 'Mago', 'Bruxo', 'Assassino', 'Algoz', 'Defensor Anão', 'Dançarino das Sombras', 'Mestre do Conhecimento', 'Teurgo Místico']
const alignments = ['Leal e Bom', 'Neutro e Bom', 'Caótico e Bom', 'Leal e Neutro', 'Neutro', 'Caótico e Neutro', 'Leal e Mau', 'Neutro e Mau', 'Caótico e Mau']
const sizes = ['Minúsculo', 'Diminuto', 'Mínimo', 'Pequeno', 'Médio', 'Grande', 'Enorme', 'Imenso', 'Colossal']

const raceSelect = computed({
  get: () => {
    if (!store.character.race) return 'Personalizada' // Return "Personalizada" instead of empty to keep it selected
    if (races.includes(store.character.race)) return store.character.race
    return 'Personalizada'
  },
  set: (val) => {
    store.character.race = val === 'Personalizada' ? '' : val
  }
})

const classSelect = computed({
  get: () => {
    if (!store.character.class) return 'Personalizada' // Return "Personalizada" instead of empty to keep it selected
    if (classes.includes(store.character.class)) return store.character.class
    return 'Personalizada'
  },
  set: (val) => {
    store.character.class = val === 'Personalizada' ? '' : val
  }
})
</script>

<template>
  <div class="grid gap-6">
    <div class="grid gap-4 md:grid-cols-2">
      <div class="grid gap-2">
        <Label htmlFor="name">Nome do Personagem</Label>
        <Input id="name" v-model="store.character.name" placeholder="Nome do personagem" />
      </div>
      <div class="grid gap-2">
        <Label htmlFor="player">Nome do Jogador</Label>
        <Input id="player" placeholder="Seu nome" />
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <div class="grid gap-2">
        <Label>Raça</Label>
        <Select v-model="raceSelect">
          <SelectTrigger>
            <SelectValue placeholder="Selecione a raça" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="race in races" :key="race" :value="race">
              {{ race }}
            </SelectItem>
          </SelectContent>
        </Select>
        <Input v-if="raceSelect === 'Personalizada'" v-model="store.character.race"
          placeholder="Nome da raça personalizada" class="mt-1" />
      </div>

      <div class="grid gap-2">
        <Label>Classe</Label>
        <Select v-model="classSelect">
          <SelectTrigger>
            <SelectValue placeholder="Selecione a classe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="cls in classes" :key="cls" :value="cls">
              {{ cls }}
            </SelectItem>
          </SelectContent>
        </Select>
        <Input v-if="classSelect === 'Personalizada'" v-model="store.character.class"
          placeholder="Nome da classe personalizada" class="mt-1" />
      </div>

      <div class="grid gap-2">
        <Label htmlFor="level">Nível</Label>
        <Input id="level" type="number" v-model.number="store.character.level" min="1" max="20" />
      </div>
    </div>

    <div v-if="classSelect === 'Personalizada'"
      class="grid gap-4 md:grid-cols-2 bg-muted/30 p-4 border border-border rounded-lg">
      <div class="col-span-1 md:col-span-2 text-xs font-semibold text-muted-foreground uppercase">
        Configuração de Classe Personalizada
      </div>
      <div class="grid gap-2">
        <Label>Dado de Vida (d)</Label>
        <Input type="number" v-model.number="store.character.customHitDie" min="4" max="20" :placeholder="8" />
        <p class="text-[10px] text-muted-foreground">O dado rolado para ganhar pontos de vida a cada nível.</p>
      </div>
      <div class="grid gap-2">
        <Label>Perícias por Nível</Label>
        <Input type="number" v-model.number="store.character.customSkillPoints" min="2" :placeholder="2" />
        <p class="text-[10px] text-muted-foreground">Pontos base recebidos a cada nível antes do modificador de INT.</p>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <div class="grid gap-2">
        <Label>Tendência</Label>
        <Select v-model="store.character.alignment">
          <SelectTrigger>
            <SelectValue placeholder="Selecione a tendência" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="align in alignments" :key="align" :value="align">
              {{ align }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="grid gap-2">
        <Label>Tamanho</Label>
        <Select v-model="store.character.size">
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tamanho" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="size in sizes" :key="size" :value="size">
              {{ size }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="grid gap-2">
        <Label htmlFor="age">Idade</Label>
        <Input id="age" v-model="store.character.age" placeholder="Idade" />
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-4">
      <div class="grid gap-2">
        <Label htmlFor="gender">Gênero</Label>
        <Input id="gender" v-model="store.character.gender" placeholder="Gênero" />
      </div>
      <div class="grid gap-2">
        <Label htmlFor="height">Altura</Label>
        <Input id="height" v-model="store.character.height" placeholder="Altura" />
      </div>
      <div class="grid gap-2">
        <Label htmlFor="weight">Peso</Label>
        <Input id="weight" v-model="store.character.weight" placeholder="Peso" />
      </div>
      <div class="grid gap-2">
        <Label htmlFor="deity">Divindade</Label>
        <Input id="deity" v-model="store.character.deity" placeholder="Divindade" />
      </div>
    </div>

    <div class="grid gap-2">
      <Label htmlFor="avatar_url">Imagem do Personagem (URL)</Label>
      <Input id="avatar_url" v-model="store.character.avatar_url"
        placeholder="https://... (opcional, aparece no card do dashboard)" />
      <div v-if="store.character.avatar_url" class="mt-2">
        <img :src="store.character.avatar_url" alt="Prévia"
          class="h-32 w-24 object-cover rounded-lg border border-border"
          @error="(e: Event) => (e.target as HTMLImageElement).style.display = 'none'" />
      </div>
    </div>
  </div>
</template>

```


---
## FILE: src/components/wizard/steps/CombatStatsStep.vue
```vue
<script setup lang="ts">
import { useWizardStore } from '@/stores/wizardStore'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const store = useWizardStore()
</script>

<template>
    <div class="flex flex-col gap-6">
        <div class="grid gap-6">

            <!-- Combate Básico -->
            <div class="grid gap-4 md:grid-cols-3 p-4 bg-muted/20 border border-border rounded-lg">
                <div
                    class="col-span-1 md:col-span-3 text-sm font-semibold text-primary uppercase border-b border-border pb-2 mb-2">
                    Estatísticas Básicas
                </div>

                <div class="grid gap-2">
                    <Label htmlFor="hp_max">Pontos de Vida Máximos</Label>
                    <Input id="hp_max" type="number" v-model.number="store.character.hp_max" />
                </div>

                <div class="grid gap-2">
                    <Label htmlFor="bab">Bônus Base de Ataque (BBA)</Label>
                    <Input id="bab" type="number" v-model.number="store.character.bab" />
                </div>

                <div class="grid gap-2">
                    <Label htmlFor="speed">Deslocamento (m)</Label>
                    <Input id="speed" type="number" v-model.number="store.character.speed" />
                </div>
            </div>

            <!-- Testes de Resistência -->
            <div class="grid gap-4 md:grid-cols-3 p-4 bg-muted/20 border border-border rounded-lg">
                <div
                    class="col-span-1 md:col-span-3 text-sm font-semibold text-primary uppercase border-b border-border pb-2 mb-2">
                    Testes de Resistência (Base da Classe)
                </div>

                <div class="grid gap-2">
                    <Label htmlFor="save_fort">Fortitude Base</Label>
                    <Input id="save_fort" type="number" v-model.number="store.character.save_fort" />
                </div>

                <div class="grid gap-2">
                    <Label htmlFor="save_ref">Reflexos Base</Label>
                    <Input id="save_ref" type="number" v-model.number="store.character.save_ref" />
                </div>

                <div class="grid gap-2">
                    <Label htmlFor="save_will">Vontade Base</Label>
                    <Input id="save_will" type="number" v-model.number="store.character.save_will" />
                </div>
            </div>

            <!-- Classe de Armadura -->
            <div class="grid gap-4 md:grid-cols-4 p-4 bg-muted/20 border border-border rounded-lg">
                <div
                    class="col-span-1 md:col-span-4 text-sm font-semibold text-primary uppercase border-b border-border pb-2 mb-2">
                    Classe de Armadura (CA) Inicial
                </div>

                <div class="grid gap-2">
                    <Label htmlFor="ca_armor">Bônus de Armadura</Label>
                    <Input id="ca_armor" type="number" v-model.number="store.character.ca_armor" />
                </div>

                <div class="grid gap-2">
                    <Label htmlFor="ca_shield">Bônus de Escudo</Label>
                    <Input id="ca_shield" type="number" v-model.number="store.character.ca_shield" />
                </div>

                <div class="grid gap-2">
                    <Label htmlFor="ca_natural">Armadura Natural</Label>
                    <Input id="ca_natural" type="number" v-model.number="store.character.ca_natural" />
                </div>

                <div class="grid gap-2">
                    <Label htmlFor="ca_deflect">Bônus de Deflexão</Label>
                    <Input id="ca_deflect" type="number" v-model.number="store.character.ca_deflect" />
                </div>
            </div>

        </div>
    </div>
</template>

```


---
## FILE: src/components/wizard/steps/EquipmentBioStep.vue
```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useWizardStore } from '@/stores/wizardStore'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Trash2 } from 'lucide-vue-next'

const store = useWizardStore()
const newItem = ref('')

function addItem() {
  if (newItem.value.trim()) {
    store.character.equipment.push(newItem.value.trim())
    newItem.value = ''
  }
}

function removeItem(index: number) {
  store.character.equipment.splice(index, 1)
}
</script>

<template>
  <div class="grid gap-6">
    <div class="grid gap-4">
      <Label class="text-lg font-semibold">Equipamento</Label>
      <div class="flex gap-2">
        <Input v-model="newItem" placeholder="Adicionar item..." @keyup.enter="addItem" />
        <Button @click="addItem">Adicionar</Button>
      </div>
      <div class="grid gap-2">
        <Card v-for="(item, index) in store.character.equipment" :key="index"
          class="p-3 flex justify-between items-center">
          <span>{{ item }}</span>
          <Button variant="ghost" size="icon" @click="removeItem(index)">
            <Trash2 class="h-4 w-4" />
          </Button>
        </Card>
      </div>
    </div>

    <div class="grid gap-4">
      <Label class="text-lg font-semibold">Biografia e Descrição</Label>
      <div class="grid gap-2">
        <Label htmlFor="bio">História</Label>
        <Textarea id="bio" v-model="store.character.bio" rows="5" />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="grid gap-2">
          <Label htmlFor="eyes">Olhos</Label>
          <Input id="eyes" v-model="store.character.eyes" />
        </div>
        <div class="grid gap-2">
          <Label htmlFor="hair">Cabelos</Label>
          <Input id="hair" v-model="store.character.hair" />
        </div>
        <div class="grid gap-2">
          <Label htmlFor="skin">Pele</Label>
          <Input id="skin" v-model="store.character.skin" />
        </div>
      </div>
    </div>
  </div>
</template>

```


---
## FILE: src/components/wizard/steps/FeatsStep.vue
```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useWizardStore } from '@/stores/wizardStore'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { FEATS_DATA, type Feat } from '@/data/dnd35'

const store = useWizardStore()
const searchQuery = ref('')

const filteredFeats = computed<Feat[]>(() => {
  if (!searchQuery.value) return FEATS_DATA
  const lower = searchQuery.value.toLowerCase()
  return FEATS_DATA.filter(f =>
    f.name.toLowerCase().includes(lower) ||
    f.description.toLowerCase().includes(lower)
  )
})

function toggleFeat(featName: string) {
  const index = store.character.feats.indexOf(featName)
  if (index === -1) {
    store.character.feats.push(featName)
  } else {
    store.character.feats.splice(index, 1)
  }
}

// Simple calculation for available feats (1 at level 1, +1 if Human, +1 at 3, 6, 9...)
// Fighter bonus feats etc are complex.
const maxFeats = computed(() => {
  let count = 1 + Math.floor(store.character.level / 3)
  if (store.character.level >= 3 && store.character.level % 3 !== 0) {
    // Logic for 3.5e is: 1st, 3rd, 6th, 9th... so 1 + level/3 is roughly correct if we start at 1.
    // 1: 1
    // 2: 1
    // 3: 2
    // 4: 2
    // 5: 2
    // 6: 3
  }

  if (store.character.race === 'Human') count++
  if (store.character.class === 'Fighter') {
    // Fighters get bonus feats at 1, 2, 4, 6, 8...
    if (store.character.level >= 1) count++
    if (store.character.level >= 2) count++
    if (store.character.level >= 4) count += Math.floor((store.character.level - 2) / 2) // Approximation
  }

  return count
})
</script>

<template>
  <div class="grid gap-6">
    <div class="flex justify-between items-center bg-muted p-4 rounded-lg">
      <div class="font-bold">
        Talentos Selecionados: {{ store.character.feats.length }} / {{ maxFeats }} (Aprox)
      </div>
      <div class="w-1/2">
        <Input v-model="searchQuery" placeholder="Buscar talentos..." />
      </div>
    </div>

    <div class="max-h-[500px] overflow-y-auto border rounded-md p-4 grid gap-2">
      <div v-for="feat in filteredFeats" :key="feat.name"
        class="flex items-start space-x-2 border-b pb-2 last:border-0 hover:bg-muted/10 transition-colors p-2 rounded">
        <Checkbox :id="feat.name" :checked="store.character.feats.includes(feat.name)"
          @update:checked="toggleFeat(feat.name)" />
        <div class="grid gap-1.5 leading-none">
          <Label :htmlFor="feat.name" class="font-bold cursor-pointer">
            {{ feat.name }}
          </Label>
          <p class="text-sm text-muted-foreground">
            {{ feat.description }}
          </p>
          <p v-if="feat.prerequisite" class="text-xs text-muted-foreground italic">
            Pré-req: {{ feat.prerequisite }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

```
