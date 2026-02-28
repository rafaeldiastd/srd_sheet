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
