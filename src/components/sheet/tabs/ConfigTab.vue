<script setup lang="ts">
import { Settings2, Trash2 } from 'lucide-vue-next'
import { ATTR_KEYS, ATTR_LABELS, CA_FIELDS, SAVE_FIELDS, ELEM_FIELDS } from '@/data/sheetConstants'
import { ref } from 'vue'

const props = defineProps<{
  d: any
  b: any
  editMode: boolean
  tabsEditMode: boolean
  editedData: any
  modStr: (n: number) => string
  adjustField: (obj: any, key: string, delta: number) => void
  onToggleEdit: () => void
  onDeleteSheet?: () => void
  isEmbedded?: boolean
}>()  

const confirmingDelete = ref(false)
const deleteTimer = ref<ReturnType<typeof setTimeout> | null>(null)

function requestDelete() {
    confirmingDelete.value = true
    deleteTimer.value = setTimeout(() => { confirmingDelete.value = false }, 2000)
}

function cancelDelete() {
    confirmingDelete.value = false
    if (deleteTimer.value) clearTimeout(deleteTimer.value)
}

function executeDelete() {
    if (deleteTimer.value) clearTimeout(deleteTimer.value)
    props.onDeleteSheet?.()
}

</script>

<template>
  <div class="space-y-6">

    <!-- Bonus Config -->
    <div class="rounded-xl border border-border bg-card/60 p-4 space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Settings2 class="w-4 h-4 text-muted-foreground" />
          <span class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Modificadores & Bônus</span>
        </div>
        <button @click="onToggleEdit"
          class="text-xs font-bold px-3 py-1.5 rounded-lg border transition-all"
          :class="tabsEditMode
            ? 'bg-primary/20 border-primary text-primary'
            : 'bg-muted border-border text-muted-foreground hover:text-foreground'">
          {{ tabsEditMode ? ' Concluir' : 'Editar Modificadores' }}
        </button>
      </div>

      <div class="grid md:grid-cols-2 gap-4">
        <!-- Attr bonuses -->
        <div class="space-y-1">
          <div class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Bônus de Atributos</div>
          <div v-for="key in ATTR_KEYS" :key="key" class="flex items-center justify-between py-1.5 border-b border-border/50">
            <span class="text-xs text-muted-foreground">{{ ATTR_LABELS[key] }}</span>
            <div v-if="tabsEditMode && editedData" class="flex items-center gap-1">
              <button @click="adjustField(editedData.bonuses.attributes, key, -1)" class="w-6 h-6 rounded bg-accent hover:bg-accent text-muted-foreground text-sm flex items-center justify-center">−</button>
              <span class="w-8 text-center text-sm font-bold tabular-nums text-foreground">{{ editedData.bonuses.attributes[key] ?? 0 }}</span>
              <button @click="adjustField(editedData.bonuses.attributes, key, 1)" class="w-6 h-6 rounded bg-accent hover:bg-accent text-muted-foreground text-sm flex items-center justify-center">+</button>
            </div>
            <span v-else class="text-sm font-bold text-foreground/80">{{ modStr(b?.attributes?.[key] ?? 0) }}</span>
          </div>
        </div>

        <!-- CA bonuses -->
        <div class="space-y-1">
          <div class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Componentes de CA</div>
          <div v-for="f in CA_FIELDS" :key="f.field" class="flex items-center justify-between py-1.5 border-b border-border/50">
            <span class="text-xs text-muted-foreground">{{ f.label }}</span>
            <div v-if="tabsEditMode && editedData" class="flex items-center gap-1">
              <button @click="adjustField(editedData, f.field, -1)" class="w-6 h-6 rounded bg-accent hover:bg-accent text-muted-foreground text-sm flex items-center justify-center">−</button>
              <span class="w-8 text-center text-sm font-bold tabular-nums text-foreground">{{ editedData[f.field] ?? 0 }}</span>
              <button @click="adjustField(editedData, f.field, 1)" class="w-6 h-6 rounded bg-accent hover:bg-accent text-muted-foreground text-sm flex items-center justify-center">+</button>
            </div>
            <span v-else class="text-sm font-bold text-foreground/80">{{ d[f.field] ?? 0 }}</span>
          </div>
          <!-- CA Bonus misc -->
          <div class="flex items-center justify-between py-1.5">
            <span class="text-xs text-muted-foreground">Bônus CA (misc)</span>
            <div v-if="tabsEditMode && editedData" class="flex items-center gap-1">
              <button @click="adjustField(editedData.bonuses, 'ca', -1)" class="w-6 h-6 rounded bg-accent hover:bg-accent text-muted-foreground text-sm flex items-center justify-center">−</button>
              <span class="w-8 text-center text-sm font-bold tabular-nums text-foreground">{{ editedData.bonuses.ca ?? 0 }}</span>
              <button @click="adjustField(editedData.bonuses, 'ca', 1)" class="w-6 h-6 rounded bg-accent hover:bg-accent text-muted-foreground text-sm flex items-center justify-center">+</button>
            </div>
            <span v-else class="text-sm font-bold text-foreground/80">{{ modStr(b?.ca ?? 0) }}</span>
          </div>
        </div>

        <!-- Saves -->
        <div class="space-y-1">
          <div class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Saves Base &amp; Bônus</div>
          <div v-for="f in SAVE_FIELDS" :key="f.field" class="flex items-center justify-between py-1.5 border-b border-border/50">
            <span class="text-xs text-muted-foreground">{{ f.label }}</span>
            <div v-if="tabsEditMode && editedData" class="flex items-center gap-1">
              <button @click="adjustField(editedData, f.field, -1)" class="w-6 h-6 rounded bg-accent hover:bg-accent text-muted-foreground text-sm flex items-center justify-center">−</button>
              <span class="w-8 text-center text-sm font-bold tabular-nums text-foreground">{{ editedData[f.field] ?? 0 }}</span>
              <button @click="adjustField(editedData, f.field, 1)" class="w-6 h-6 rounded bg-accent hover:bg-accent text-muted-foreground text-sm flex items-center justify-center">+</button>
            </div>
            <span v-else class="text-sm font-bold text-foreground/80">{{ d[f.field] ?? 0 }}</span>
          </div>
        </div>

        <!-- Elemental resistances -->
        <div class="space-y-1">
          <div class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Resistências Elementais</div>
          <div v-for="f in ELEM_FIELDS" :key="f.field" class="flex items-center justify-between py-1.5 border-b border-border/50">
            <span class="text-xs text-muted-foreground">{{ f.label }}</span>
            <div v-if="tabsEditMode && editedData" class="flex items-center gap-1">
              <button @click="adjustField(editedData.bonuses.resistances, f.field, -1)" class="w-6 h-6 rounded bg-accent hover:bg-accent text-muted-foreground text-sm flex items-center justify-center">−</button>
              <span class="w-8 text-center text-sm font-bold tabular-nums text-foreground">{{ editedData.bonuses.resistances[f.field] ?? 0 }}</span>
              <button @click="adjustField(editedData.bonuses.resistances, f.field, 1)" class="w-6 h-6 rounded bg-accent hover:bg-accent text-muted-foreground text-sm flex items-center justify-center">+</button>
            </div>
            <span v-else class="text-sm font-bold text-foreground/80">{{ b?.resistances?.[f.field] ?? 0 }}</span>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div class="pt-2">
        <div class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Notas de Bônus</div>
        <textarea v-if="tabsEditMode && editedData" v-model="editedData.bonuses.notes"
          class="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 resize-none min-h-[5rem]"
          placeholder="Ex: +2 FOR (Cinto), +4 CA (Manto +2)..." />
        <p v-else class="text-sm text-muted-foreground italic">{{ b?.notes || 'Sem notas.' }}</p>
      </div>
    </div>

    <!-- Danger Zone -->
    <div v-if="onDeleteSheet" class="rounded-xl border border-red-900/40 bg-red-950/10 p-4">
      <div class="flex items-center gap-2 mb-3">
        <Trash2 class="w-4 h-4 text-red-500" />
        <span class="text-xs font-bold uppercase tracking-widest text-red-400">Zona de Perigo</span>
      </div>
      <p class="text-xs text-muted-foreground mb-3">Excluir esta ficha permanentemente. Esta ação não pode ser desfeita.</p>

      <div v-if="!confirmingDelete">
        <button @click="requestDelete"
          class="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-900/50 text-red-400 text-xs font-semibold hover:bg-red-950/50 hover:border-red-800/60 transition-colors">
          <Trash2 class="w-3.5 h-3.5" /> Excluir Ficha
        </button>
      </div>

      <div v-else class="flex gap-2">
        <button @click="cancelDelete"
          class="flex-1 py-2 rounded-lg border border-border text-muted-foreground hover:bg-accent transition-colors text-xs">
          Cancelar
        </button>
        <button @click="executeDelete"
          class="flex-1 py-2 rounded-lg bg-red-900/70 border border-red-800/50 text-red-300 hover:bg-red-800/80 transition-colors text-xs font-bold">
           Confirmar Exclusão
        </button>
      </div>
    </div>
  </div>
</template>
