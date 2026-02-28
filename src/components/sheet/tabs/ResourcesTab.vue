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
