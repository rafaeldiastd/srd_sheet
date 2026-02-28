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
