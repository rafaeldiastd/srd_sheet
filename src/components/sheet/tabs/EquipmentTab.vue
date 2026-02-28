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
