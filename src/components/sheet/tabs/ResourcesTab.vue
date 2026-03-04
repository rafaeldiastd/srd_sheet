<script setup lang="ts">
import { Plus, RotateCcw, Trash2, Flame, MessageSquare, Pencil } from 'lucide-vue-next'
import { ref } from 'vue'
import type { Sheet } from '@/types/sheet'
import ResourceEditorModal from '@/components/sheet/ResourceEditorModal.vue'

const props = defineProps<{
  sheet: Sheet
  d: any
  editMode: boolean
  modStr: (n: number) => string
  resolveFormula: (formula: string) => string
  onAdjust: (i: number, delta: number) => void
  onReset: () => void
  onDelete: (i: number) => void
  onOpenEditor: (type: string, item?: any, index?: number) => void
  onDeleteBuff: (i: number) => void
  onToggleBuff: (i: number) => void
  onRollItem: (item: any) => void
  onShowDescription: (title: string, desc: string) => void
  onSaveResource?: (resource: any, index: number) => void
}>()

// Resource editor modal
const resourceEditorOpen = ref(false)
const resourceEditorItem = ref<any>(null)
const resourceEditorIndex = ref(-1)

function openResourceEditor(item?: any, index = -1) {
  resourceEditorItem.value = item || null
  resourceEditorIndex.value = index
  resourceEditorOpen.value = true
}

function handleResourceSave(resource: any, index: number) {
  if (props.onSaveResource) {
    props.onSaveResource(resource, index)
  }
}

const barColor = (cur: number, max: number, colorOverride?: string) => {
  if (colorOverride) return colorOverride
  const p = max ? (cur / max) : 0
  if (p > 0.6) return '#8b5cf6'
  if (p > 0.3) return '#f59e0b'
  return '#ef4444'
}

const RECOVER_LABELS: Record<string, string> = {
  long: ' Desc. Longo',
  short: ' Desc. Curto',
  daily: ' Diário',
  formula: ' Fórmula',
  manual: ' Manual',
}
</script>

<template>
  <div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- COL 1: RESOURCES -->
    <div class="space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <button @click="onReset"
          class="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-2 hover:bg-accent transition-colors">
          <RotateCcw class="w-3.5 h-3.5" /> Descanso Longo
        </button>
        <button @click="openResourceEditor()"
          class="flex items-center gap-1 text-xs text-primary border border-primary/30 rounded-lg px-2.5 py-1.5 hover:bg-primary/10 transition-colors">
          <Plus class="w-3.5 h-3.5" /> Novo Recurso
        </button>
      </div>

      <div v-if="!sheet.data?.resources?.length" class="text-center py-16 text-muted-foreground/60 border border-dashed border-border rounded-xl">
        Nenhum recurso cadastrado.<br>
        <span class="text-xs">Use "Novo Recurso" para adicionar Fúria, Ki, etc.</span>
      </div>

      <!-- Resource List -->
      <div class="space-y-4">
        <div v-for="(res, i) in sheet.data?.resources" :key="i" class="group rounded-xl border border-border bg-card/60 p-4 relative overflow-hidden">
          <!-- Colored accent bar at top -->
          <div class="absolute top-0 left-0 right-0 h-0.5 transition-all"
            :style="{ backgroundColor: res.color || barColor(res.current ?? res.max, res.max, res.color) }">
          </div>

          <div class="flex items-center justify-between mb-3 relative z-10">
            <div>
              <span class="font-bold text-foreground">{{ res.name || res.label }}</span>
              <span v-if="res.recoverOn && res.recoverOn !== 'long'"
                class="ml-2 text-[9px] font-semibold text-muted-foreground/60 bg-muted px-1.5 py-0.5 rounded">
                {{ RECOVER_LABELS[res.recoverOn] || res.recoverOn }}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-sm font-semibold tracking-wide text-muted-foreground">{{ res.current ?? res.max }} / {{ res.max }}</span>
              <button @click="openResourceEditor(res, i as number)"
                class="opacity-0 group-hover:opacity-100 text-muted-foreground/60 hover:text-primary transition-all p-1">
                <Pencil class="w-3.5 h-3.5" />
              </button>
              <button @click="onDelete(i as number)" class="opacity-0 group-hover:opacity-100 text-red-700 hover:text-red-500 transition-all p-1">
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Big bar -->
          <div class="h-3 bg-muted/80 rounded-full overflow-hidden mb-4 border border-border shadow-inner relative z-10 p-0.5">
            <div class="h-full rounded-full transition-all duration-500 relative overflow-hidden"
              :style="{
                width: res.max ? (((res.current ?? res.max) / res.max) * 100) + '%' : '100%',
                backgroundColor: res.color || barColor(res.current ?? res.max, res.max),
              }">
              <div class="absolute inset-0 bg-white/20 w-full h-full transform -skew-x-12 -translate-x-full"></div>
            </div>
          </div>

          <!-- Controls -->
          <div class="flex items-center gap-2 relative z-10">
            <button @click="onAdjust(i as number, -((res.costPerUse ?? 1) > 1 ? (res.costPerUse ?? 1) * 5 : 5))"
              class="flex-1 py-1.5 rounded bg-muted border border-border/50 text-muted-foreground hover:text-foreground/80 hover:bg-accent transition-colors text-xs font-bold">
              −{{ (res.costPerUse ?? 1) > 1 ? (res.costPerUse ?? 1) * 5 : 5 }}
            </button>
            <button @click="onAdjust(i as number, -(res.costPerUse ?? 1))"
              class="flex-1 py-1.5 rounded bg-muted border border-border/50 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors text-sm font-bold shadow-sm">
              −{{ res.costPerUse ?? 1 }}
            </button>

            <button @click="onAdjust(i as number, (res.costPerUse ?? 1))"
              class="flex-1 py-1.5 rounded bg-muted border border-border/50 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors text-sm font-bold shadow-sm">
              +{{ res.costPerUse ?? 1 }}
            </button>
            <button @click="onAdjust(i as number, (res.costPerUse ?? 1) > 1 ? (res.costPerUse ?? 1) * 5 : 5)"
              class="flex-1 py-1.5 rounded bg-muted border border-border/50 text-muted-foreground hover:text-foreground/80 hover:bg-accent transition-colors text-xs font-bold">
              +{{ (res.costPerUse ?? 1) > 1 ? (res.costPerUse ?? 1) * 5 : 5 }}
            </button>
          </div>

          <!-- Description -->
          <p v-if="res.description" class="text-[10px] text-muted-foreground/50 mt-2 italic">{{ res.description }}</p>
        </div>
      </div>
    </div>


    <!-- COL 2: BUFFS -->
    <div class="space-y-4">
      <!-- Header Buffs -->
      <div class="flex items-center justify-between h-[38px]">
         <div class="flex items-center gap-2">
            <Flame class="w-4 h-4 text-muted-foreground" />
            <span class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Buffs & Condições</span>
         </div>
        
        <button @click="onOpenEditor('buff')"
          class="flex items-center gap-1 text-xs text-orange-500/80 border border-orange-500/30 rounded-lg px-3 py-1.5 hover:bg-orange-500/10 transition-colors">
          <Plus class="w-3.5 h-3.5" /> Adicionar Buff
        </button>
      </div>

      <div v-if="!d?.buffs?.length" class="text-center py-16 text-muted-foreground/60 border border-dashed border-border rounded-xl">
        Nenhum buff ativo no momento.
      </div>

      <!-- Buff List -->
       <div class="space-y-2">
        <div v-for="(buf, i) in d?.buffs" :key="i"
          class="group rounded-xl border overflow-hidden transition-all duration-200 relative"
          :class="buf.active
            ? 'border-orange-500/30 bg-orange-500/5 shadow-[0_0_15px_-3px_rgba(249,115,22,0.1)]'
            : 'border-border bg-card/60 opacity-60'">
          
          <div class="flex items-center gap-3 px-3 py-2.5">
            <!-- Toggle -->
            <button @click="onToggleBuff(i as number)"
              class="flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-md shrink-0 transition-all border select-none focus:outline-none"
              :class="buf.active
                ? 'bg-orange-500/20 border-orange-500/40 text-orange-400 shadow-inner'
                : 'bg-muted border-border text-muted-foreground hover:text-foreground/80'">
              <Flame class="w-3.5 h-3.5" :class="buf.active ? 'fill-orange-500/50 text-orange-400' : ''" />
              {{ buf.active ? 'Ativo' : 'Off' }}
            </button>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <div class="font-bold text-sm text-foreground truncate">{{ buf.title }}</div>
              <div v-if="buf.modifiers?.length" class="text-[10px] text-muted-foreground mt-0.5 truncate uppercase font-semibold tracking-wider">
                {{ buf.modifiers.map((m: any) => `${m.target} ${modStr(m.value)}`).join(' · ') }}
              </div>
              <div v-if="buf.rollPassiveFormula" class="text-[10px] text-muted-foreground/60 mt-0.5 font-mono">
                 {{ buf.rollPassiveFormula }}
              </div>
            </div>

            <div class="flex items-center gap-1">
              <button v-if="buf.rollMode === 'attack' || buf.isAttack"
                @click="onRollItem(buf)"
                class="text-[10px] font-bold px-2 py-1 rounded bg-red-900/20 border border-red-800/40 text-red-200 hover:bg-red-800/40 transition-colors shrink-0">
                 Atacar
              </button>
              <button v-else-if="buf.rollMode === 'heal'"
                @click="onRollItem(buf)"
                class="text-[10px] font-bold px-2 py-1 rounded bg-emerald-900/20 border border-emerald-800/40 text-emerald-200 hover:bg-emerald-800/40 transition-colors shrink-0">
                 Curar
              </button>
              <button v-else-if="buf.rollMode === 'generic' || buf.rollFormula"
                @click="onRollItem(buf)"
                class="text-[10px] font-bold px-2 py-1 rounded bg-violet-900/20 border border-violet-800/40 text-violet-200 hover:bg-violet-800/40 transition-colors shrink-0">
                 Rolar
              </button>
              <button v-if="buf.description"
                @click="onShowDescription(buf.title, buf.description)"
                class="p-1.5 text-muted-foreground hover:text-primary transition-all" title="Enviar para o chat">
                <MessageSquare class="w-3.5 h-3.5" />
              </button>
              <button @click="onOpenEditor('buff', buf, i as number)" class="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-foreground/80 transition-all">
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

    <!-- Resource Editor Modal -->
    <ResourceEditorModal
      v-model="resourceEditorOpen"
      :resource="resourceEditorItem"
      :index="resourceEditorIndex"
      @save="handleResourceSave"
    />
  </div>
</template>
