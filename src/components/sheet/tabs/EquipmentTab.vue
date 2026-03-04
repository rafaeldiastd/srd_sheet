<script setup lang="ts">
import { ref } from 'vue'
import { Package, Plus, Trash2, Backpack, ChevronDown, ChevronUp, Zap, MessageSquare } from 'lucide-vue-next'

const props = defineProps<{
  d: any
  editMode: boolean
  totalWeight: number
  onOpenEditor: (item?: any, index?: number) => void
  onDelete: (type: string, index: number) => void
  onToggleEquipped: (i: number) => void
  onShowDescription: (title: string, desc: string) => void
}>()

const emit = defineEmits<{
  (e: 'toggle-active', index: number): void
  (e: 'roll-item', item: any): void
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
    <div class="bg-muted/60 border border-border rounded-xl px-3 py-2 flex items-center justify-between">
      <div class="flex items-center gap-2 text-xs text-muted-foreground">
        <Backpack class="w-4 h-4" />
        <span>Peso total: <span class="font-bold text-foreground/80">{{ totalWeight.toFixed(1) }} kg</span></span>
      </div>
      <button @click="onOpenEditor()"
        class="flex items-center gap-1 text-xs text-foreground/80 border border-border rounded-lg px-2.5 py-1.5 hover:bg-accent transition-colors">
        <Plus class="w-3.5 h-3.5" /> Novo Item
      </button>
    </div>

    <div class="space-y-2">
      <div v-for="(item, i) in d?.equipment" :key="i"
        class="group rounded-xl border bg-card/60 overflow-hidden transition-all duration-200 hover:border-border"
        :class="item.equipped ? 'border-primary/30 bg-primary/5' : 'border-border'">
        <div class="flex items-center gap-3 px-4 py-3">
          <!-- Equipped toggle -->
          <button @click="onToggleEquipped(Number(i))"
            class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all"
            :class="item.equipped
              ? 'bg-primary/20 border border-primary/40 text-primary'
              : 'bg-accent border border-border text-muted-foreground/60 hover:text-muted-foreground'">
            <Package class="w-4 h-4" />
          </button>

          <!-- Info -->
          <div class="flex-1 cursor-pointer" @click="toggleExpand(Number(i))">
            <div class="font-bold text-sm" :class="item.equipped ? 'text-primary/90' : 'text-foreground/80'">
              {{ item.title }}
            </div>
            <div class="text-[10px] text-muted-foreground mt-0.5 font-bold">
              <span v-if="item.quantity > 1" class="text-primary/80 mr-1">{{ item.quantity }}x</span>
              {{ item.weight ? item.weight + ' kg' : '0 kg' }}
              <span v-if="item.price" class="text-amber-500/60 ml-1 font-black">• {{ item.price }} PO</span>
              <span v-if="item.equipped" class="text-primary/70 ml-1">• EQUIPADO</span>
              <span v-if="item.modifiers?.length" class="text-muted-foreground ml-1">• {{ item.modifiers.length }} MOD(S)</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-1 items-center">
            <!-- Attack button -->
            <button v-if="item.isAttack"
              @click.stop="$emit('roll-item', item)"
              class="text-xs font-bold px-2.5 py-1 rounded-lg bg-red-900/20 border border-red-800/40 text-red-200 hover:bg-red-800/40 transition-colors">
              Atacar
            </button>

            <!-- Buff Toggle (Only if equipped) -->
            <button v-if="item.equipped && item.activeModifiers?.length"
              @click.stop="emit('toggle-active', Number(i))"
              class="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all"
              :class="item.active 
                ? 'bg-cyan-500 text-cyan-950 shadow-[0_0_10px_rgba(6,182,212,0.5)]' 
                : 'bg-accent text-muted-foreground hover:text-muted-foreground border border-border'">
              <Zap class="w-3 h-3" /> {{ item.active ? 'Ativo' : 'Ativar' }}
            </button>

            <button v-if="item.description"
              @click.stop="onShowDescription(item.title, item.description)"
              class="p-1.5 text-muted-foreground hover:text-primary transition-all" title="Enviar para o chat">
              <MessageSquare class="w-4 h-4" />
            </button>

            <button @click.stop="onOpenEditor(item, Number(i))" class="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground/60 hover:text-foreground/80 transition-all">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            </button>
            <button @click="onDelete('equipment', Number(i))" class="opacity-0 group-hover:opacity-100 p-1.5 text-red-800 hover:text-red-500 transition-all">
              <Trash2 class="w-3.5 h-3.5" />
            </button>
            <button @click="toggleExpand(Number(i))" class="p-1 text-muted-foreground/60 hover:text-foreground/80 transition-colors">
              <ChevronDown v-if="!expanded.has(Number(i))" class="w-4 h-4" />
              <ChevronUp v-else class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div v-if="expanded.has(Number(i)) && item.description" class="border-t border-border/60 px-4 py-3 bg-muted/30">
          <p class="text-sm text-muted-foreground whitespace-pre-wrap">{{ item.description }}</p>
        </div>
      </div>

      <div v-if="!d?.equipment?.length" class="text-center py-12 text-muted-foreground/60 text-sm">
        Nenhum item no inventário.
      </div>
    </div>
  </div>
</template>
