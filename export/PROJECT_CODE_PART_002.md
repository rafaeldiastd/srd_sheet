

---
## FILE: src/components/design/DesignToken.vue
```vue
<script setup lang="ts">

const props = defineProps<{
    name: string
    variable: string
    bgClass: string
    textClass?: string
}>()

// Helper to copy variable name to clipboard
const copyToClipboard = () => {
    navigator.clipboard.writeText(`var(--${props.variable})`)
}
</script>

<template>
    <div class="flex flex-col gap-2 group cursor-pointer" @click="copyToClipboard">
        <div class="h-24 w-full rounded-md border border-border shadow-sm transition-all group-hover:scale-105 group-hover:shadow-md relative overflow-hidden"
            :class="[bgClass, textClass || 'text-foreground']">
            <div
                class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/20 transition-opacity">
                <span class="text-xs font-mono font-bold text-white">Copy</span>
            </div>
        </div>
        <div class="flex flex-col">
            <span class="font-bold text-sm text-foreground">{{ name }}</span>
            <span class="text-xs text-muted-foreground font-mono">--{{ variable }}</span>
        </div>
    </div>
</template>

```


---
## FILE: src/components/sheet/blocks/AttrsBlock.vue
```vue
<script setup lang="ts">
import { Dices } from 'lucide-vue-next'

const props = defineProps<{
  attrTotal: (key: string) => number
  calcMod: (n: number) => number
  modStr: (n: number) => string
  editMode: boolean
  editedData: any
  ATTR_KEYS: readonly string[]
  ATTR_LABELS: Record<string, string>
  onRoll: (label: string, formula: string) => void
  vertical?: boolean
}>()
</script>

<template>
  <!-- VERTICAL mode: narrow left column, attributes stacked -->
  <div v-if="vertical"
    class="rounded-xl border border-zinc-800 bg-zinc-950/80 h-full flex flex-col">

    <!-- Standard Header -->
    <div class="flex items-center gap-2 px-4 py-3 border-b border-zinc-800/50">
      <Dices class="w-4 h-4 text-zinc-400" />
      <span class="text-xs font-bold uppercase tracking-widest text-zinc-400">Atributos</span>
    </div>

    <!-- Stats stacked -->
    <div class="flex flex-col flex-1 p-2 gap-1 justify-evenly">
      <div
        v-for="key in ATTR_KEYS" :key="key"
        class="flex flex-col items-center justify-center cursor-pointer transition-all duration-200
               hover:bg-primary/5 hover:border-primary/20 border border-transparent rounded-lg active:scale-95 select-none py-3 px-2"
        @click="onRoll(ATTR_LABELS[key] || key.toUpperCase(), '1d20 + @' + key + 'Mod')"
      >
        <div class="text-[11px] font-black uppercase tracking-wider text-zinc-500 mb-1.5">{{ ATTR_LABELS[key] }}</div>

        <template v-if="editMode && editedData?.attributes?.[key]">
          <input v-model.number="editedData.attributes[key].base" type="number" min="1" max="30"
            class="w-14 text-center text-xl font-extrabold font-serif bg-transparent border-b border-zinc-600
                   focus:border-primary focus:outline-none tabular-nums
                   [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            @click.stop />
        </template>
        <div v-else class="text-3xl font-extrabold font-serif leading-none text-zinc-100">{{ attrTotal(key) }}</div>

        <div class="mt-1.5 text-xs font-bold text-zinc-400 bg-zinc-800/60 rounded px-2 py-0.5">
          {{ modStr(calcMod(attrTotal(key))) }}
        </div>
      </div>
    </div>
  </div>

  <!-- HORIZONTAL mode (default): original grid layout -->
  <div v-else class="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4">
    <div class="flex items-center gap-2 mb-3">
      <Dices class="w-4 h-4 text-primary" />
      <span class="text-xs font-bold uppercase tracking-widest text-zinc-400">Atributos</span>
    </div>

    <div class="grid grid-cols-3 sm:grid-cols-6 gap-2 items-stretch">
      <div
        v-for="key in ATTR_KEYS" :key="key"
        class="rounded-lg border border-zinc-700/50 bg-zinc-900/40 cursor-pointer transition-all duration-200
               hover:scale-105 hover:border-primary/50 hover:bg-primary/5 active:scale-95 select-none
               p-2 text-center text-zinc-200 flex flex-col items-center justify-center"
        @click="onRoll(ATTR_LABELS[key] || key.toUpperCase(), '1d20 + @' + key + 'Mod')"
      >
        <div class="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">{{ ATTR_LABELS[key] }}</div>

        <template v-if="editMode && editedData?.attributes?.[key]">
          <input v-model.number="editedData.attributes[key].base" type="number" min="1" max="30"
            class="w-full text-center text-xl font-extrabold font-serif bg-transparent border-b border-zinc-600
                   focus:border-primary focus:outline-none tabular-nums
                   [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            @click.stop />
        </template>
        <div v-else class="text-2xl font-extrabold font-serif leading-none text-zinc-100">{{ attrTotal(key) }}</div>

        <div class="mt-1.5 text-xs font-bold text-zinc-400 bg-zinc-800/60 rounded px-1.5 py-0.5 inline-block">
          {{ modStr(calcMod(attrTotal(key))) }}
        </div>
      </div>
    </div>
  </div>
</template>

```


---
## FILE: src/components/sheet/blocks/CombatBlock.vue
```vue
<script setup lang="ts">
import { Shield, Swords, Wind, Zap, RefreshCw } from 'lucide-vue-next'

const props = defineProps<{
  modStr: (n: number) => string
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
  onRoll: (label: string, formula: string) => void
  hideSaves?: boolean
}>()

const stats = () => [
  {
    label: 'CA', value: props.totalCA, icon: Shield,
    sub: `T:${props.totalTouch} | S:${props.totalFlatFooted}`,
    roll: null,
  },
  {
    label: 'BBA', value: props.modStr(props.totalBAB), icon: Swords,
    roll: () => props.onRoll('BBA', '1d20 + @BBA'),
  },
  {
    label: 'Iniciativa', value: props.modStr(props.totalInitiative), icon: Zap,
    roll: () => props.onRoll('Iniciativa', '1d20 + @iniciativa'),
  },
  {
    label: 'Velocidade', value: `${props.totalSpeed}m`, icon: Wind, roll: null,
  },
  {
    label: 'C.C.', value: props.modStr(props.meleeAtk), icon: Swords,
    roll: () => props.onRoll('Corpo-a-Corpo', '1d20 + @melee'),
  },
  {
    label: 'Distância', value: props.modStr(props.rangedAtk), icon: Wind,
    roll: () => props.onRoll('Distância', '1d20 + @ranged'),
  },
  {
    label: 'Agarrar', value: props.modStr(props.grappleAtk), icon: RefreshCw,
    roll: () => props.onRoll('Agarrar', '1d20 + @grapple'),
  },
]
</script>

<template>
  <div class="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4">
    <div class="flex items-center gap-2 mb-3">
      <Shield class="w-4 h-4 text-zinc-400" />
      <span class="text-xs font-bold uppercase tracking-widest text-zinc-400">Combate</span>
    </div>

    <!-- Main stats row -->
    <div class="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-3 items-stretch">
      <div
        v-for="stat in stats()" :key="stat.label"
        class="rounded-lg border border-zinc-800 bg-zinc-900/60 p-2 text-center transition-all duration-200 select-none flex flex-col items-center justify-center"
        :class="stat.roll ? 'cursor-pointer hover:border-primary/50 hover:bg-primary/5 active:scale-95' : ''"
        @click="stat.roll?.()"
      >
        <component :is="stat.icon" class="w-3.5 h-3.5 mx-auto mb-1 text-zinc-500" />
        <div class="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">{{ stat.label }}</div>
        <div class="text-lg font-extrabold font-serif text-zinc-100">{{ stat.value }}</div>
        <div v-if="stat.sub" class="text-[9px] text-zinc-600 mt-0.5">{{ stat.sub }}</div>
      </div>
    </div>

    <!-- Saves -->
    <div v-if="!hideSaves" class="grid grid-cols-3 gap-2 items-stretch">
      <button @click="onRoll('Fortitude', '1d20 + @fort')"
        class="rounded-lg bg-zinc-900/60 border border-zinc-800 px-2 py-1.5 hover:border-primary/40 hover:bg-primary/5 transition-colors flex flex-col items-center justify-center">
        <div class="text-[10px] text-zinc-500 font-bold uppercase mb-0.5">Fortitude</div>
        <div class="text-base font-extrabold font-serif text-zinc-100">{{ modStr(totalFort) }}</div>
      </button>
      <button @click="onRoll('Reflexos', '1d20 + @ref')"
        class="rounded-lg bg-zinc-900/60 border border-zinc-800 px-2 py-1.5 hover:border-primary/40 hover:bg-primary/5 transition-colors flex flex-col items-center justify-center">
        <div class="text-[10px] text-zinc-500 font-bold uppercase mb-0.5">Reflexos</div>
        <div class="text-base font-extrabold font-serif text-zinc-100">{{ modStr(totalRef) }}</div>
      </button>
      <button @click="onRoll('Vontade', '1d20 + @will')"
        class="rounded-lg bg-zinc-900/60 border border-zinc-800 px-2 py-1.5 hover:border-primary/40 hover:bg-primary/5 transition-colors flex flex-col items-center justify-center">
        <div class="text-[10px] text-zinc-500 font-bold uppercase mb-0.5">Vontade</div>
        <div class="text-base font-extrabold font-serif text-zinc-100">{{ modStr(totalWill) }}</div>
      </button>
    </div>
  </div>
</template>

```


---
## FILE: src/components/sheet/blocks/HeaderBlock.vue
```vue
<script setup lang="ts">
import { computed } from 'vue'
import type { Sheet } from '@/types/sheet'

const props = defineProps<{
  sheet: Sheet
  d: any
  editMode: boolean
}>()

const emit = defineEmits<{
  (e: 'edit-core'): void
}>()

const imgUrl = computed(() => props.d?.avatarUrl || props.d?.image)
</script>

<template>
  <div class="rounded-xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5 mb-6 min-h-[160px] flex flex-col justify-center relative overflow-hidden shadow-2xl group">
    
    <!-- Background Image -->
    <div v-if="imgUrl" class="absolute inset-0 z-0">
      <img :src="imgUrl" class="w-full h-full object-cover object-center opacity-50 transition-transform duration-1000 group-hover:scale-105" />
      <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-zinc-950/20"></div>
      <div class="absolute inset-0 bg-zinc-950/30"></div>
    </div>
    
    <!-- Decorative background glow (fallback if no image) -->
    <div v-else class="absolute inset-0 bg-primary/5 blur-[60px] pointer-events-none z-0"></div>

    <!-- Info Content -->
    <div class="relative z-10 flex flex-col sm:flex-row justify-between items-center sm:items-center w-full gap-4 sm:gap-6">
      
      <!-- Left Side: Basic Info -->
      <div class="flex flex-col items-center sm:items-start text-center sm:text-left flex-1 min-w-0">
        <!-- Placeholder Avatar if no image -->
        <div v-if="!imgUrl" class="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-inner mb-2 lg:mb-0 lg:absolute lg:top-0 lg:left-0 lg:-translate-y-1/2 lg:-translate-x-1/2">
          <span class="text-zinc-600 text-2xl font-serif font-black">{{ sheet.name?.charAt(0) || '?' }}</span>
        </div>

        <h1 class="text-3xl sm:text-4xl font-extrabold font-serif text-white leading-tight drop-shadow-lg mb-2 break-words">{{ sheet.name }}</h1>
        
        <div class="flex flex-wrap items-center justify-center sm:justify-start gap-x-2 gap-y-2 text-xs sm:text-sm text-zinc-300">
          <span class="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-sm border border-primary/20 backdrop-blur-md shadow-sm">{{ sheet.class }} {{ sheet.level }}</span>
          <span v-if="sheet.race" class="text-zinc-100 font-semibold drop-shadow-md">{{ sheet.race }}</span>
          
          <template v-if="d?.alignment">
            <span class="text-zinc-500">•</span>
            <span class="text-zinc-300 font-medium drop-shadow-md">{{ d.alignment }}</span>
          </template>
          
          <template v-if="d?.age">
            <span class="text-zinc-500">•</span>
            <span class="text-zinc-300 drop-shadow-md">{{ d.age }} anos</span>
          </template>

          <div v-if="d?.xp !== undefined" class="flex items-center gap-1.5 bg-zinc-950/60 backdrop-blur-md border border-zinc-700/50 rounded-md px-2 py-0.5 shadow-inner sm:ml-2">
            <span class="text-[10px] uppercase font-bold tracking-widest text-zinc-400">XP</span>
            <span class="text-xs font-black font-serif text-white">{{ d.xp }}</span>
          </div>
        </div>
      </div>
      
      <!-- Right Side: Edit Buttons -->
      <div class="flex flex-col items-stretch sm:items-end w-full sm:w-auto mt-2 sm:mt-0">
        <button @click="emit('edit-core')" class="bg-zinc-800/80 hover:bg-zinc-700 backdrop-blur-md text-zinc-300 border border-zinc-700 rounded-md px-3 py-1.5 text-[10px] uppercase font-bold tracking-widest shadow-md transition-all whitespace-nowrap">
          Editar Frente da Ficha
        </button>
      </div>

    </div>
  </div>
</template>

```


---
## FILE: src/components/sheet/blocks/ResourcesBlock.vue
```vue
<script setup lang="ts">
import { Plus, RotateCcw, Trash2, Layers } from 'lucide-vue-next'
// Layers used as resource section icon
import { ref } from 'vue'
import type { Sheet } from '@/types/sheet'

const props = defineProps<{
  sheet: Sheet
  onAdjust: (i: number, delta: number) => void
  onReset: () => void
  onAdd: (name: string, max: number) => void
  onDelete: (i: number) => void
  editMode: boolean
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
  <div class="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4">
    <div class="flex items-center gap-2 mb-3">
      <Layers class="w-4 h-4 text-zinc-400" />
      <span class="text-xs font-bold uppercase tracking-widest text-zinc-400">Recursos</span>
    </div>

    <!-- Add form -->
    <div v-if="showForm && editMode" class="flex gap-2 mb-3 p-2 bg-zinc-900/60 rounded-lg border border-zinc-800">
      <input v-model="newName" placeholder="Nome (ex: Fúria)" class="flex-1 bg-transparent text-sm border-b border-zinc-700 focus:border-primary focus:outline-none text-zinc-200 placeholder-zinc-600 px-1" />
      <input v-model.number="newMax" type="number" min="1" placeholder="Máx"
        class="w-14 text-center bg-transparent text-sm border-b border-zinc-700 focus:border-primary focus:outline-none text-zinc-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none" />
      <button @click="handleAdd" class="text-xs font-bold text-primary hover:text-primary/80 px-2 py-1 bg-primary/10 rounded-md border border-primary/20">
        Criar
      </button>
    </div>

    <div v-if="!sheet.data?.resources?.length" class="text-center py-6 text-zinc-600 text-sm">
      Nenhum recurso cadastrado.
    </div>

    <div class="space-y-3">
      <div v-for="(res, i) in sheet.data?.resources" :key="i" class="group">
        <div class="flex items-center justify-between mb-1">
          <span class="text-sm font-bold text-zinc-300">{{ res.name || res.label }}</span>
          <div class="flex items-center gap-2">
            <span class="text-xs text-zinc-500">{{ res.current ?? res.max }} / {{ res.max }}</span>
            <button v-if="editMode" @click="onDelete(i)"
              class="opacity-0 group-hover:opacity-100 text-red-700 hover:text-red-500 transition-all">
              <Trash2 class="w-3 h-3" />
            </button>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button @click="onAdjust(i, -1)"
            class="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors text-sm font-bold">
            −
          </button>
          <div class="flex-1 h-2.5 bg-zinc-800 rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-all duration-300"
              :style="{
                width: res.max ? ((res.current ?? res.max) / res.max * 100) + '%' : '100%',
                backgroundColor: barColor(res.current ?? res.max, res.max)
              }" />
          </div>
          <button @click="onAdjust(i, 1)"
            class="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors text-sm font-bold">
            +
          </button>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="mt-4 pt-3 border-t border-zinc-800/50 flex justify-end gap-2">
      <button @click="onReset"
        class="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-200 transition-colors border border-zinc-800 rounded-lg px-2.5 py-1 hover:bg-zinc-800">
        <RotateCcw class="w-3 h-3" /> Descanso
      </button>
      <button v-if="editMode" @click="showForm = !showForm"
        class="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors border border-primary/30 rounded-lg px-2.5 py-1 hover:bg-primary/10">
        <Plus class="w-3 h-3" /> Novo
      </button>
    </div>
  </div>
</template>

```


---
## FILE: src/components/sheet/blocks/ShortcutsBlock.vue
```vue
<script setup lang="ts">
import { Plus, Trash2 } from 'lucide-vue-next'

const props = defineProps<{
  d: any
  modStr: (n: number) => string
  resolveFormula: (formula: string) => string
  editMode: boolean
  onRollItem: (item: any) => void
  onAddShortcut: () => void
  onDeleteShortcut: (i: number) => void
}>()
</script>

<template>
  <div class="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 flex flex-col max-h-[400px]">
    
    <!-- Tab Headers -->
    <div class="flex-1 overflow-y-auto custom-scrollbar pr-1">
      
      <!-- TAB ATACHOS -->

        <div v-if="!d?.shortcuts?.length" class="text-center py-6 text-zinc-600 text-sm">
          Nenhum atalho cadastrado.
        </div>

        <div class="flex flex-wrap gap-2">
          <div v-for="(sc, i) in d?.shortcuts" :key="i"
            class="relative group flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 hover:border-primary/40 transition-all duration-200 cursor-pointer select-none"
            @click="onRollItem({ ...sc, title: sc.title || sc.label, rollFormula: sc.rollFormula || sc.formula })"
          >
            <div>
              <div class="font-bold text-sm text-zinc-200">{{ sc.title || sc.label }}</div>
              <div v-if="sc.isAttack" class="text-[10px] text-zinc-500">
                Ataque: {{ sc.attackBonus ? modStr(Number(sc.attackBonus)) : resolveFormula(sc.attackFormula || '') }}
              </div>
              <div v-else-if="sc.rollFormula || sc.formula" class="text-[10px] text-zinc-500">
                {{ sc.rollFormula || sc.formula }}
              </div>
            </div>
            <button v-if="editMode" @click.stop="onDeleteShortcut(Number(i))"
              class="opacity-0 group-hover:opacity-100 absolute top-1 right-1 text-red-600 hover:text-red-400 transition-all">
              <Trash2 class="w-3 h-3" />
            </button>
          </div>
        </div>

        <!-- Add shortcut -->
        <div v-if="editMode" class="mt-4 pt-3 border-t border-zinc-800/50 flex justify-end">
          <button @click="onAddShortcut"
            class="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors border border-primary/30 rounded-lg px-2.5 py-1 hover:bg-primary/10">
            <Plus class="w-3 h-3" /> Novo Atalho
          </button>
        </div>

    </div>
  </div>
</template>

```


---
## FILE: src/components/sheet/blocks/VitalsBlock.vue
```vue
<script setup lang="ts">
import { Heart, Skull, Activity, ShieldPlus } from 'lucide-vue-next'
import type { Sheet } from '@/types/sheet'

const props = defineProps<{
  sheet: Sheet
  totalHP: number
  deathStatus: { label: string; color: string } | null
  onSaveHP: () => void
}>()



const percent = () => {
  const c = props.sheet.data.hp_current ?? 0
  const m = props.totalHP || 1
  return Math.max(0, Math.min(100, (c / m) * 100))
}

const hpColor = () => {
  const p = percent()
  if (p > 60) return '#22c55e'
  if (p > 30) return '#f59e0b'
  return '#ef4444'
}
</script>

<template>
  <div class="rounded-xl border border-zinc-800 bg-zinc-950/80 p-5 space-y-5 relative overflow-hidden shadow-lg">
    <!-- Decorative background glow -->
    <div class="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-10 pointer-events-none blur-3xl" :style="{ backgroundColor: hpColor() }"></div>

    <!-- Header -->
    <div class="flex items-center justify-between relative z-10">
      <div class="flex items-center gap-2">
        <Activity class="w-4 h-4 text-zinc-400" />
        <span class="text-xs font-bold uppercase tracking-widest text-zinc-400">Status Vital</span>
      </div>
      <div v-if="deathStatus"
        class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border animate-pulse"
        :class="deathStatus.color">
        <Skull class="w-3 h-3 inline mr-1" />{{ deathStatus.label }}
      </div>
      <div v-else :style="{ color: hpColor() }" class="text-[10px] font-bold tracking-widest uppercase flex items-center gap-1">
        <Heart class="w-3 h-3" :class="percent() < 30 ? 'animate-pulse' : ''" />
        <span>{{ percent().toFixed(0) }}%</span>
      </div>
    </div>

    <!-- HP Numbers and Bar -->
    <div class="space-y-3 relative z-10">
      <div class="flex items-end justify-between gap-4">
        <!-- Current HP -->
        <div class="flex-1">
          <div class="flex items-baseline gap-1">
            <input v-model.number="sheet.data.hp_current" @change="onSaveHP" type="number"
              class="w-16 sm:w-20 text-4xl sm:text-5xl font-black font-serif text-zinc-100 bg-transparent border-b-2 border-transparent hover:border-zinc-700 focus:border-zinc-400 focus:outline-none tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors" />
            <span class="text-2xl text-zinc-600 font-light">/</span>
            <span class="text-2xl font-bold text-zinc-400">{{ totalHP }}</span>
          </div>
          <div class="text-[10px] text-zinc-500 uppercase tracking-wider mt-1 ml-1 font-semibold">Pontos de Vida</div>
        </div>

        <!-- Temp HP -->
        <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-2.5 flex flex-col items-center justify-center min-w-[4.5rem] shadow-inner">
          <ShieldPlus class="w-4 h-4 text-zinc-500 mb-1" />
          <input v-model.number="sheet.data.hp_temp" @change="onSaveHP" type="number"
            class="w-full text-center text-lg font-black text-zinc-200 bg-transparent focus:outline-none tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder-zinc-700" placeholder="0" />
          <div class="text-[9px] text-zinc-600 uppercase tracking-widest font-bold">Temp</div>
        </div>
      </div>

      <!-- HP bar -->
      <div class="h-4 bg-zinc-900/80 rounded-full overflow-hidden border border-zinc-800 shadow-inner p-0.5">
        <div class="h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden"
          :style="{ width: percent() + '%', backgroundColor: hpColor() }">
          <div class="absolute inset-0 bg-white/20 w-full h-full transform -skew-x-12 -translate-x-full"></div>
        </div>
      </div>
    </div>
  </div>
</template>

```


---
## FILE: src/components/sheet/CoreDataEditorModal.vue
```vue
<script setup lang="ts">
import { ref, watch } from 'vue'
import { X, Dices } from 'lucide-vue-next'
import type { SheetData } from '@/types/sheet'
import { ATTR_KEYS, ATTR_LABELS } from '@/data/sheetConstants'

const props = defineProps<{
  modelValue: boolean
  sheetName: string
  sheetClass: string
  sheetLevel: number
  sheetRace: string
  data: SheetData
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', meta: { name: string; class: string; level: number; race: string }, data: any): void
}>()

// Local state for editing
const editMeta = ref({
  name: '',
  class: '',
  level: 1,
  race: ''
})

const editData = ref<any>({})

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    // Clone data for editing
    editMeta.value = {
      name: props.sheetName,
      class: props.sheetClass,
      level: props.sheetLevel,
      race: props.sheetRace
    }
    // Deep clone data to avoid reactive mutations before save
    editData.value = JSON.parse(JSON.stringify(props.data))
    
    // Ensure attributes exist
    if (!editData.value.attributes) editData.value.attributes = {}
    for (const k of ATTR_KEYS) {
      if (!editData.value.attributes[k]) editData.value.attributes[k] = { base: 10, temp: 0 }
    }
  }
})

function close() {
  emit('update:modelValue', false)
}

function save() {
  emit('save', editMeta.value, editData.value)
  close()
}

const hitDieInput = ref('d10')
const lastRollResult = ref<{roll: number, conMod: number, total: number} | null>(null)

function rollHitDie() {
  const input = String(hitDieInput.value || '')
  const match = input.toLowerCase().match(/^d(\d+)$/)
  if (!match) {
    alert('Formato inválido. Use algo como d8, d10, d12.')
    return
  }
  const sides = parseInt(match[1] || '0', 10)
  if (isNaN(sides) || sides < 1) return

  const roll = Math.floor(Math.random() * sides) + 1
  const con = editData.value.attributes?.con?.base ?? 10
  const conMod = Math.floor((con - 10) / 2)
  const total = roll + conMod

  // Add to max HP
  editData.value.hp_max = (editData.value.hp_max || 0) + Math.max(1, total)
  
  lastRollResult.value = { roll, conMod, total: Math.max(1, total) }
  
  // Autosave when rolling
  emit('save', editMeta.value, editData.value)
  
  // Clear result after 3s
  setTimeout(() => {
    lastRollResult.value = null
  }, 3000)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
      
      <!-- Modal Content -->
      <div class="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-zinc-800/60 bg-zinc-900/40">
          <h2 class="text-lg font-bold text-zinc-100 font-serif">Editar Dados do Personagem</h2>
          <button @click="close" class="p-2 -mr-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Scrollable Body -->
        <div class="p-6 overflow-y-auto space-y-8 flex-1 custom-scrollbar">
          
          <!-- Identidade -->
          <section class="bg-zinc-900/20 border border-zinc-800/60 rounded-xl p-5">
            <h3 class="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary mb-4 pb-2 border-b border-zinc-800/80">Identidade</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-zinc-400">Nome</label>
                <input v-model="editMeta.name" type="text" class="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-primary focus:outline-none transition-colors" />
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-zinc-400">Raça</label>
                <input v-model="editMeta.race" type="text" class="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-primary focus:outline-none transition-colors" />
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-zinc-400">Classe</label>
                <input v-model="editMeta.class" type="text" class="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-primary focus:outline-none transition-colors" />
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-zinc-400">Nível</label>
                  <input v-model.number="editMeta.level" type="number" min="1" class="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-primary focus:outline-none transition-colors" />
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-zinc-400">Experiência</label>
                  <input v-model.number="editData.xp" type="number" min="0" class="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-primary focus:outline-none transition-colors" />
                </div>
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-zinc-400">Tamanho</label>
                <select v-model="editData.size" class="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-primary focus:outline-none transition-colors">
                  <option value="Colossal">Colossal</option>
                  <option value="Imenso">Imenso</option>
                  <option value="Enorme">Enorme</option>
                  <option value="Grande">Grande</option>
                  <option value="Médio">Médio</option>
                  <option value="Pequeno">Pequeno</option>
                  <option value="Miúdo">Miúdo</option>
                  <option value="Diminuto">Diminuto</option>
                  <option value="Mínimo">Mínimo</option>
                </select>
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-zinc-400">Alinhamento</label>
                <input v-model="editData.alignment" type="text" class="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-primary focus:outline-none transition-colors" />
              </div>
              <div class="grid grid-cols-3 gap-3">
                <div class="space-y-1.5">
                  <label class="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Idade</label>
                  <input v-model.number="editData.age" type="number" class="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-primary focus:outline-none transition-colors text-center" />
                </div>
                <div class="space-y-1.5">
                  <label class="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Peso (kg)</label>
                  <input v-model.number="editData.weight" type="number" class="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-primary focus:outline-none transition-colors text-center" />
                </div>
                <div class="space-y-1.5">
                  <label class="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Altura (m)</label>
                  <input v-model.number="editData.height" type="number" step="0.01" class="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-primary focus:outline-none transition-colors text-center" />
                </div>
              </div>
            </div>
            <div class="mt-4 space-y-1.5">
              <label class="text-xs font-semibold text-zinc-400">Avatar URL (Imagem)</label>
              <input v-model="editData.avatarUrl" type="text" placeholder="https://..." class="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-primary focus:outline-none transition-colors" />
            </div>
          </section>

          <!-- Atributos base -->
          <section class="bg-zinc-900/20 border border-zinc-800/60 rounded-xl p-5">
            <h3 class="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary mb-4 pb-2 border-b border-zinc-800/80">Atributos Base e Temporários</h3>
            <div class="grid grid-cols-3 sm:grid-cols-6 gap-3">
              <div v-for="key in ATTR_KEYS" :key="key" class="space-y-2 bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-2">
                <div class="text-[10px] font-bold uppercase tracking-wider text-zinc-500 text-center">{{ ATTR_LABELS[key] }}</div>
                <div>
                  <label class="text-[8px] uppercase text-zinc-600 block text-center mb-0.5">Base</label>
                  <input v-model.number="editData.attributes[key].base" type="number" min="1" max="50" 
                    class="w-full bg-transparent border-b border-zinc-800 focus:border-primary px-1 py-1 text-center text-lg font-serif font-black text-zinc-100 focus:outline-none tabular-nums" />
                </div>
                <div>
                  <label class="text-[8px] uppercase text-zinc-600 block text-center mb-0.5">Temp</label>
                  <input v-model.number="editData.attributes[key].temp" type="number" 
                    class="w-full bg-transparent border-b border-zinc-800 focus:border-cyan-500/50 px-1 py-1 text-center text-sm font-bold text-cyan-200 focus:outline-none tabular-nums" />
                </div>
              </div>
            </div>
          </section>

          <!-- Combate & Vitals -->
          <section class="bg-zinc-900/20 border border-zinc-800/60 rounded-xl p-5">
            <h3 class="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary mb-4 pb-2 border-b border-zinc-800/80">Combate & Sobrevivência</h3>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
              
              <!-- Max HP with Roll button -->
              <div class="space-y-1.5 sm:col-span-2 bg-red-950/10 border border-red-900/20 rounded-lg p-3">
                <div class="flex justify-between items-end mb-2">
                  <label class="text-xs font-semibold text-zinc-300">Pontos de Vida</label>
                  <div class="flex items-center gap-1.5">
                    <input v-model="hitDieInput" type="text" placeholder="d10" class="w-12 bg-zinc-900 border border-zinc-700 rounded text-center text-xs py-1 text-zinc-300 focus:border-red-500 focus:outline-none uppercase" />
                    <button @click="rollHitDie" class="bg-red-900/40 hover:bg-red-800/60 text-red-200 border border-red-800/50 rounded px-2 py-1 text-xs font-bold flex items-center gap-1 transition-colors relative" title="Rolar e Somar Vida">
                      <Dices class="w-3 h-3" /> Rolar
                      <span v-if="lastRollResult" class="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-100 text-zinc-900 text-[10px] font-bold px-2 py-0.5 rounded shadow-lg whitespace-nowrap animate-in fade-in slide-in-from-bottom-2">
                        +{{ lastRollResult.total }} ({{ lastRollResult.roll }} + {{ lastRollResult.conMod }})
                      </span>
                    </button>
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="text-[10px] uppercase text-zinc-500 font-bold block mb-1 text-center">Atual</label>
                    <input v-model.number="editData.hp_current" type="number" class="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2 text-center text-lg font-bold text-zinc-200 focus:border-red-500 focus:outline-none tabular-nums" />
                  </div>
                  <div>
                    <label class="text-[10px] uppercase text-zinc-500 font-bold block mb-1 text-center">Máxima</label>
                    <input v-model.number="editData.hp_max" type="number" class="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2 text-center text-lg font-bold text-zinc-200 focus:border-red-500 focus:outline-none tabular-nums" />
                  </div>
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="text-[10px] uppercase font-bold text-zinc-400">BBA (Ataque Base)</label>
                <input v-model.number="editData.bab" type="number" class="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-primary focus:outline-none tabular-nums mt-1" />
              </div>
              
              <div class="space-y-1.5">
                <label class="text-[10px] uppercase font-bold text-zinc-400">Deslocamento (m)</label>
                <input v-model.number="editData.speed" type="number" class="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-primary focus:outline-none tabular-nums mt-1" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-6 mt-6 pt-5 border-t border-zinc-800/50">
              <!-- Defesa Base -->
              <div>
                <h4 class="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Defesa Base</h4>
                <div class="grid grid-cols-2 gap-3">
                  <div class="space-y-1">
                    <label class="text-[10px] font-semibold text-zinc-400">CA Armadura</label>
                    <input v-model.number="editData.ca_armor" type="number" class="w-full bg-zinc-950/50 border border-zinc-800 rounded-md px-2 py-1.5 text-sm text-zinc-200 focus:border-primary focus:outline-none tabular-nums" />
                  </div>
                  <div class="space-y-1">
                    <label class="text-[10px] font-semibold text-zinc-400">CA Escudo</label>
                    <input v-model.number="editData.ca_shield" type="number" class="w-full bg-zinc-950/50 border border-zinc-800 rounded-md px-2 py-1.5 text-sm text-zinc-200 focus:border-primary focus:outline-none tabular-nums" />
                  </div>
                  <div class="space-y-1">
                    <label class="text-[10px] font-semibold text-zinc-400">CA Natural</label>
                    <input v-model.number="editData.ca_natural" type="number" class="w-full bg-zinc-950/50 border border-zinc-800 rounded-md px-2 py-1.5 text-sm text-zinc-200 focus:border-primary focus:outline-none tabular-nums" />
                  </div>
                  <div class="space-y-1">
                    <label class="text-[10px] font-semibold text-zinc-400">CA Deflexão</label>
                    <input v-model.number="editData.ca_deflect" type="number" class="w-full bg-zinc-950/50 border border-zinc-800 rounded-md px-2 py-1.5 text-sm text-zinc-200 focus:border-primary focus:outline-none tabular-nums" />
                  </div>
                </div>
              </div>

              <!-- Salvaguardas & Misc -->
              <div>
                <h4 class="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Salvaguardas & Extras</h4>
                <div class="grid grid-cols-2 gap-3">
                  <div class="space-y-1">
                    <label class="text-[10px] font-semibold text-zinc-400">Fortitude</label>
                    <input v-model.number="editData.save_fort" type="number" class="w-full bg-zinc-950/50 border border-zinc-800 rounded-md px-2 py-1.5 text-sm text-zinc-200 focus:border-primary focus:outline-none tabular-nums" />
                  </div>
                  <div class="space-y-1">
                    <label class="text-[10px] font-semibold text-zinc-400">Init Extra</label>
                    <input v-model.number="editData.initiative_misc" type="number" class="w-full bg-zinc-950/50 border border-zinc-800 rounded-md px-2 py-1.5 text-sm text-zinc-200 focus:border-primary focus:outline-none tabular-nums" />
                  </div>
                  <div class="space-y-1">
                    <label class="text-[10px] font-semibold text-zinc-400">Reflexos</label>
                    <input v-model.number="editData.save_ref" type="number" class="w-full bg-zinc-950/50 border border-zinc-800 rounded-md px-2 py-1.5 text-sm text-zinc-200 focus:border-primary focus:outline-none tabular-nums" />
                  </div>
                  <div class="space-y-1">
                    <label class="text-[10px] font-semibold text-zinc-400">Vontade</label>
                    <input v-model.number="editData.save_will" type="number" class="w-full bg-zinc-950/50 border border-zinc-800 rounded-md px-2 py-1.5 text-sm text-zinc-200 focus:border-primary focus:outline-none tabular-nums" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- Footer -->
        <div class="p-4 border-t border-zinc-800/60 bg-zinc-900/40 flex justify-end gap-3">
          <button @click="close" class="px-5 py-2.5 rounded-lg border border-zinc-700 text-sm font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors">
            Cancelar
          </button>
          <button @click="save" class="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors">
            Salvar Ficha
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #3f3f46;
  border-radius: 10px;
}
</style>

```


---
## FILE: src/components/sheet/ItemEditorModal.vue
```vue
<script setup lang="ts">
import { ref } from 'vue'
import { X, Plus, Trash2, Sword, Zap, Package, Flame } from 'lucide-vue-next'
import { MODIFIER_TARGETS } from '@/data/sheetConstants'

const props = defineProps<{
  modelValue: boolean
  type: 'feat' | 'shortcut' | 'equipment' | 'buff'
  item: any
  index: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'save', item: any): void
}>()

const form = ref<any>({})

// Sync with item prop
import { watch } from 'vue'
watch(() => props.item, (val) => {
  const parsed = val ? JSON.parse(JSON.stringify({
    attackFormula: '', damageFormula: '', rollFormula: '', modifiers: [], dynamicRolls: [],
    isAttack: false, spellLevel: 1, applyBuffName: '', applyBuffValue: '', ...val
  })) : {}

  form.value = parsed
}, { immediate: true })

function close() { emit('update:modelValue', false) }
function addModifier() {
  if (!form.value.modifiers) form.value.modifiers = []
  form.value.modifiers.push({ target: 'str', value: 1 })
}
function removeModifier(i: number | string) { form.value.modifiers.splice(Number(i), 1) }


function save() {
  if (!form.value.title?.trim()) return
  emit('save', { ...form.value })
  close()
}

const TYPE_ICON = { shortcut: Sword, equipment: Package, buff: Flame, feat: Zap }
const TYPE_LABELS: Record<string, string> = { feat: 'Talento', shortcut: 'Atalho', equipment: 'Item', buff: 'Buff/Condição' }
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4" @click.self="close">
      <div class="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div class="flex items-center gap-2">
            <component :is="TYPE_ICON[type]" class="w-4 h-4 text-primary" />
            <h3 class="font-bold text-zinc-100">
              {{ index === -1 ? 'Novo' : 'Editar' }} {{ TYPE_LABELS[type] }}
            </h3>
          </div>
          <button @click="close" class="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors">
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Body -->
        <div class="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <!-- Title -->
          <div>
            <label class="text-xs font-bold uppercase tracking-widest text-zinc-500 block mb-1.5">Título</label>
            <input v-model="form.title" placeholder="Ex: Bola de Fogo"
              class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-primary/60" />
          </div>

          <!-- Equipment fields -->
          <template v-if="type === 'equipment'">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-xs font-bold uppercase tracking-widest text-zinc-500 block mb-1.5">Peso (kg)</label>
                <input v-model.number="form.weight" type="number" min="0"
                  class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-primary/60" />
              </div>
              <div class="flex items-end pb-2">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" v-model="form.equipped" class="w-4 h-4 rounded accent-primary" />
                  <span class="text-sm text-zinc-300">Equipado</span>
                </label>
              </div>
            </div>
          </template>

          <!-- Shortcut fields -->
          <template v-if="type === 'shortcut'">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-xs font-bold uppercase tracking-widest text-zinc-500 block mb-1.5">Bônus Ataque</label>
                <input v-model="form.attackBonus" placeholder="+5"
                  class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-primary/60" />
              </div>
              <div>
                <label class="text-xs font-bold uppercase tracking-widest text-zinc-500 block mb-1.5">Custo/Uso</label>
                <input v-model="form.cost" placeholder="1/dia"
                  class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-primary/60" />
              </div>
            </div>
          </template>

          <!-- Description -->
          <div>
            <label class="text-xs font-bold uppercase tracking-widest text-zinc-500 block mb-1.5">Descrição</label>
            <textarea v-model="form.description" placeholder="Descreva o efeito..."
              class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-primary/60 resize-none min-h-[6rem]" />
          </div>

          <!-- Attack toggle -->
          <div v-if="type !== 'equipment' && type !== 'buff'">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="form.isAttack" class="w-4 h-4 rounded accent-primary" />
              <span class="text-sm text-zinc-300">É um ataque/magia ofensiva</span>
            </label>
          </div>

          <!-- Roll formulas (Non-Spells) -->
          <template v-else>
            <div v-if="!form.isAttack && type !== 'equipment'">
              <label class="text-xs font-bold uppercase tracking-widest text-zinc-500 block mb-1.5">Fórmula</label>
              <input v-model="form.rollFormula" placeholder="Ex: 1d20 + @intMod"
                class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 font-mono placeholder-zinc-600 focus:outline-none focus:border-primary/60" />
            </div>
            <div v-else-if="form.isAttack" class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-xs font-bold uppercase tracking-widest text-zinc-500 block mb-1.5">Fórmula Ataque</label>
                <input v-model="form.attackFormula" placeholder="1d20 + @BBA"
                  class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 font-mono placeholder-zinc-600 focus:outline-none focus:border-primary/60" />
              </div>
              <div>
                <label class="text-xs font-bold uppercase tracking-widest text-zinc-500 block mb-1.5">Fórmula Dano</label>
                <input v-model="form.damageFormula" placeholder="1d8 + @strMod"
                  class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 font-mono placeholder-zinc-600 focus:outline-none focus:border-primary/60" />
              </div>
            </div>
          </template>

          <!-- Modifiers -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-xs font-bold uppercase tracking-widest text-zinc-500">Modificadores Passivos</label>
              <button @click="addModifier" class="text-xs text-primary hover:text-primary/80 flex items-center gap-1">
                <Plus class="w-3 h-3" /> Adicionar
              </button>
            </div>
            <div class="space-y-2 max-h-[8rem] overflow-y-auto">
              <div v-for="(mod, i) in form.modifiers" :key="i" class="flex gap-2 items-center">
                <select v-model="mod.target"
                  class="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-primary/60">
                  <option v-for="t in MODIFIER_TARGETS" :key="t.value" :value="t.value">{{ t.label }}</option>
                </select>
                <input type="number" v-model.number="mod.value"
                  class="w-16 text-center bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm text-zinc-200 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none" />
                <button @click="removeModifier(i)" class="text-zinc-600 hover:text-red-500 transition-colors p-1">
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex justify-end gap-2 px-5 py-4 border-t border-zinc-800 bg-zinc-900/50">
          <button @click="close" class="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors">
            Cancelar
          </button>
          <button @click="save" :disabled="!form.title?.trim()"
            class="px-4 py-2 text-sm font-bold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            Salvar
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

```


---
## FILE: src/components/sheet/RawDataEditorModal.vue
```vue
<script setup lang="ts">
import { ref, watch } from 'vue'
import { X, AlertTriangle } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: boolean
  data: any
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', data: any): void
}>()

const rawText = ref('')
const errorMsg = ref('')

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    rawText.value = JSON.stringify(props.data, null, 2)
    errorMsg.value = ''
  }
})

function close() {
  emit('update:modelValue', false)
}

function save() {
  try {
    const parsed = JSON.parse(rawText.value)
    emit('save', parsed)
    close()
  } catch (err: any) {
    errorMsg.value = 'JSON Inválido: ' + err.message
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="close"></div>
      
      <!-- Modal Content -->
      <div class="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col h-[90vh]">
        
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-zinc-800/60 bg-zinc-900/40">
          <div>
            <h2 class="text-lg font-bold text-zinc-100 font-serif">Editar Ficha (Raw JSON)</h2>
            <p class="text-xs text-zinc-500">Cuidado ao editar os dados brutos. Certifique-se de usar JSON válido.</p>
          </div>
          <button @click="close" class="p-2 -mr-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Editor -->
        <div class="flex-1 p-6 overflow-hidden flex flex-col gap-4">
          <div v-if="errorMsg" class="flex items-start gap-3 bg-red-950/30 border border-red-900/50 rounded-lg p-3 text-red-400 text-sm">
            <AlertTriangle class="w-5 h-5 shrink-0" />
            <p>{{ errorMsg }}</p>
          </div>
          <textarea
            v-model="rawText"
            class="flex-1 w-full bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 text-sm font-mono text-zinc-300 focus:outline-none focus:border-primary/50 resize-none custom-scrollbar"
            spellcheck="false"
          ></textarea>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-zinc-800/60 bg-zinc-900/40 flex justify-end gap-3">
          <button @click="close" class="px-5 py-2.5 rounded-lg border border-zinc-700 text-sm font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors">
            Cancelar
          </button>
          <button @click="save" class="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors">
            Salvar JSON
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #3f3f46;
  border-radius: 10px;
}
</style>

```


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
          {{ tabsEditMode ? '✓ Concluir' : 'Editar Modificadores' }}
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
          <button @click="onToggleEquipped(Number(i))"
            class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all"
            :class="item.equipped
              ? 'bg-primary/20 border border-primary/40 text-primary'
              : 'bg-zinc-800 border border-zinc-700 text-zinc-600 hover:text-zinc-400'">
            <Package class="w-4 h-4" />
          </button>

          <!-- Info -->
          <div class="flex-1 cursor-pointer" @click="toggleExpand(Number(i))">
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
            <button @click.stop="onOpenEditor(item, Number(i))" class="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-600 hover:text-zinc-300 transition-all">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            </button>
            <button @click="onDelete('equipment', Number(i))" class="opacity-0 group-hover:opacity-100 p-1.5 text-red-800 hover:text-red-500 transition-all">
              <Trash2 class="w-3.5 h-3.5" />
            </button>
            <button @click="toggleExpand(Number(i))" class="p-1 text-zinc-600 hover:text-zinc-300 transition-colors">
              <ChevronDown v-if="!expanded.has(Number(i))" class="w-4 h-4" />
              <ChevronUp v-else class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div v-if="expanded.has(Number(i)) && item.description" class="border-t border-zinc-800/60 px-4 py-3 bg-zinc-900/30">
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
  onAttackRoll: (label: string, atkF: string, dmgF: string) => void
}>()

const expanded = ref<Set<string | number>>(new Set())
function toggleExpand(i: string | number) {
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
              @click="onAttackRoll(feat.title, feat.attackFormula || '', feat.damageFormula || '')"
              class="text-xs font-bold px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 transition-colors">
              Atacar
            </button>
            <button v-else-if="feat.rollFormula"
              @click="onRoll(feat.title, feat.rollFormula)"
              class="text-xs font-bold px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 transition-colors">
              Rolar
            </button>
            <button @click="onOpenEditor('feat', feat, Number(i))" class="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-600 hover:text-zinc-300 transition-all">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            </button>
            <button @click="onDelete('feat', Number(i))" class="opacity-0 group-hover:opacity-100 p-1.5 text-red-800 hover:text-red-500 transition-all">
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
import { Plus, RotateCcw, Trash2, Flame } from 'lucide-vue-next'
import { ref } from 'vue'
import type { Sheet } from '@/types/sheet'

const props = defineProps<{
  sheet: Sheet
  d: any
  editMode: boolean
  modStr: (n: number) => string
  resolveFormula: (formula: string) => string
  onAdjust: (i: number, delta: number) => void
  onReset: () => void
  onAdd: (name: string, max: number) => void
  onDelete: (i: number) => void
  onOpenEditor: (type: string, item?: any, index?: number) => void
  onDeleteBuff: (i: number) => void
  onToggleBuff: (i: number) => void
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
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <!-- COL 1: RESOURCES -->
    <div class="space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <button @click="onReset"
          class="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-800 rounded-lg px-3 py-2 hover:bg-zinc-800 transition-colors">
          <RotateCcw class="w-3.5 h-3.5" /> Descanso Longo
        </button>
        <button @click="showForm = !showForm"
          class="flex items-center gap-1 text-xs text-primary border border-primary/30 rounded-lg px-2.5 py-1.5 hover:bg-primary/10 transition-colors">
          <Plus class="w-3.5 h-3.5" /> Novo Recurso
        </button>
      </div>

      <!-- Add form -->
      <div v-if="showForm" class="flex gap-2 p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
        <input v-model="newName" placeholder="Nome (ex: Fúria)"
          class="flex-1 bg-transparent text-sm border-b border-zinc-700 focus:border-primary focus:outline-none text-zinc-200 placeholder-zinc-600 px-1 py-1" />
        <input v-model.number="newMax" type="number" min="1" placeholder="Máx"
          class="w-14 text-center bg-transparent text-sm border-b border-zinc-700 focus:border-primary focus:outline-none text-zinc-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none" />
        <button @click="handleAdd" class="text-xs font-bold text-primary hover:text-primary/80 px-3 py-1 bg-primary/10 rounded-lg border border-primary/20">
          Criar
        </button>
      </div>

      <div v-if="!sheet.data?.resources?.length" class="text-center py-16 text-zinc-600 border border-dashed border-zinc-800 rounded-xl">
        Nenhum recurso cadastrado.<br>
        <span class="text-xs">Use "Novo Recurso" para adicionar Fúria, Ki, etc.</span>
      </div>

      <!-- Resource List -->
      <div class="space-y-4">
        <div v-for="(res, i) in sheet.data?.resources" :key="i" class="group rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 relative overflow-hidden">
          <div class="flex items-center justify-between mb-3 relative z-10">
            <span class="font-bold text-zinc-200">{{ res.name || res.label }}</span>
            <div class="flex items-center gap-2">
              <span class="text-sm font-semibold tracking-wide text-zinc-400">{{ res.current ?? res.max }} / {{ res.max }}</span>
              <button @click="onDelete(i as number)" class="opacity-0 group-hover:opacity-100 text-red-700 hover:text-red-500 transition-all p-1">
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Big bar -->
          <div class="h-3 bg-zinc-900/80 rounded-full overflow-hidden mb-4 border border-zinc-800 shadow-inner relative z-10 p-0.5">
            <div class="h-full rounded-full transition-all duration-500 relative overflow-hidden"
              :style="{
                width: res.max ? (((res.current ?? res.max) / res.max) * 100) + '%' : '100%',
                backgroundColor: barColor(res.current ?? res.max, res.max)
              }">
              <div class="absolute inset-0 bg-white/20 w-full h-full transform -skew-x-12 -translate-x-full"></div>  
            </div>
          </div>

          <!-- Controls -->
          <div class="flex items-center gap-2 relative z-10">
            <button @click="onAdjust(i as number, -5)"
              class="flex-1 py-1.5 rounded bg-zinc-900 border border-zinc-700/50 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors text-xs font-bold">
              −5
            </button>
            <button @click="onAdjust(i as number, -1)"
              class="flex-1 py-1.5 rounded bg-zinc-900 border border-zinc-700/50 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors text-sm font-bold shadow-sm">
              −1
            </button>
            
            <button @click="onAdjust(i as number, 1)"
              class="flex-1 py-1.5 rounded bg-zinc-900 border border-zinc-700/50 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors text-sm font-bold shadow-sm">
              +1
            </button>
            <button @click="onAdjust(i as number, 5)"
              class="flex-1 py-1.5 rounded bg-zinc-900 border border-zinc-700/50 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors text-xs font-bold">
              +5
            </button>
          </div>
        </div>
      </div>
    </div>


    <!-- COL 2: BUFFS -->
    <div class="space-y-4">
      <!-- Header Buffs -->
      <div class="flex items-center justify-between h-[38px]">
         <div class="flex items-center gap-2">
            <Flame class="w-4 h-4 text-zinc-500" />
            <span class="text-xs font-bold uppercase tracking-widest text-zinc-400">Buffs & Condições</span>
         </div>
        
        <button @click="onOpenEditor('buff')"
          class="flex items-center gap-1 text-xs text-orange-500/80 border border-orange-500/30 rounded-lg px-3 py-1.5 hover:bg-orange-500/10 transition-colors">
          <Plus class="w-3.5 h-3.5" /> Adicionar Buff
        </button>
      </div>

      <div v-if="!d?.buffs?.length" class="text-center py-16 text-zinc-600 border border-dashed border-zinc-800 rounded-xl">
        Nenhum buff ativo no momento.
      </div>

      <!-- Buff List -->
       <div class="space-y-2">
        <div v-for="(buf, i) in d?.buffs" :key="i"
          class="group rounded-xl border overflow-hidden transition-all duration-200 relative"
          :class="buf.active
            ? 'border-orange-500/30 bg-orange-500/5 shadow-[0_0_15px_-3px_rgba(249,115,22,0.1)]'
            : 'border-zinc-800 bg-zinc-950/60 opacity-60'">
          
          <div class="flex items-center gap-3 px-3 py-2.5">
            <!-- Toggle -->
            <button @click="onToggleBuff(i as number)"
              class="flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-md shrink-0 transition-all border select-none focus:outline-none"
              :class="buf.active
                ? 'bg-orange-500/20 border-orange-500/40 text-orange-400 shadow-inner'
                : 'bg-zinc-900 border-zinc-700 text-zinc-500 hover:text-zinc-300'">
              <Flame class="w-3.5 h-3.5" :class="buf.active ? 'fill-orange-500/50 text-orange-400' : ''" />
              {{ buf.active ? 'Ativo' : 'Off' }}
            </button>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <div class="font-bold text-sm text-zinc-200 truncate">{{ buf.title }}</div>
              <div v-if="buf.modifiers?.length" class="text-[10px] text-zinc-500 mt-0.5 truncate uppercase font-semibold tracking-wider">
                {{ buf.modifiers.map((m: any) => `${m.target} ${modStr(m.value)}`).join(' · ') }}
              </div>
            </div>

            <div class="flex gap-1">
              <button @click="onOpenEditor('buff', buf, i as number)" class="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-500 hover:text-zinc-300 transition-all">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
              </button>
              <button @click="onDeleteBuff(i as number)" class="opacity-0 group-hover:opacity-100 p-1.5 text-red-800 hover:text-red-500 transition-all">
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
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

    <!-- Table / Grid -->
    <div class="rounded-xl border border-zinc-800 bg-zinc-950/40 p-2">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
        <div
          v-for="sk in displayedSkills"
          :key="sk.name"
          class="grid grid-cols-[1fr_auto_auto_auto] items-center px-3 py-2 rounded-lg border border-transparent transition-colors group"
          :class="!tabsEditMode ? 'cursor-pointer hover:bg-zinc-900 hover:border-zinc-800' : 'hover:bg-zinc-900/30'"
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
          <div class="text-center w-12 text-xs text-zinc-400 tabular-nums" title="Modificador de Atributo">
            {{ modStrF(skillAbilityMod(sk.ability)) }}
          </div>

          <!-- Rank -->
          <div class="text-center w-20" title="Graduações">
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
            <span v-else class="text-xs text-zinc-500 tabular-nums">r: {{ getRank(sk.name) }}</span>
          </div>

          <!-- Total -->
          <div class="text-center w-12" title="Total">
            <span class="text-sm font-bold tabular-nums"
              :class="skillTotal(sk.name, sk.ability) >= 10 ? 'text-primary' : 'text-zinc-300'">
              {{ modStr(skillTotal(sk.name, sk.ability)) }}
            </span>
          </div>
        </div>

        <div v-if="!displayedSkills.length" class="col-span-1 md:col-span-2 text-center py-10 text-zinc-600 text-sm">
          Nenhuma perícia encontrada.
        </div>
      </div>
    </div>
  </div>
</template>

```
