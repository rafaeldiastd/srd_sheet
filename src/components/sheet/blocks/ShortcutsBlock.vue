<script setup lang="ts">
import { Plus, Trash2, MessageSquare } from 'lucide-vue-next'

const props = defineProps<{
  d: any
  modStr: (n: number) => string
  resolveFormula: (formula: string) => string
  editMode: boolean
  onRollItem: (item: any) => void
  onAddShortcut: () => void
  onDeleteShortcut: (i: number) => void
  onShowDescription: (title: string, desc: string) => void
}>()
</script>

<template>
  <div class="rounded-xl border border-border bg-card/80 p-4 flex flex-col max-h-[400px]">
    
    <!-- Tab Headers -->
    <div class="flex-1 overflow-y-auto custom-scrollbar pr-1">
      
      <!-- TAB ATACHOS -->

        <div v-if="!d?.shortcuts?.length" class="text-center py-6 text-muted-foreground text-sm">
          Nenhum atalho cadastrado.
        </div>

        <div class="flex flex-wrap gap-2">
          <div v-for="(sc, i) in d?.shortcuts" :key="i"
            class="relative group flex items-center gap-2 bg-muted border border-border rounded-lg px-3 py-2 hover:border-primary/40 transition-all duration-200 cursor-pointer select-none"
            @click="onRollItem({ ...sc, title: sc.title || sc.label, rollFormula: sc.rollFormula || sc.formula })"
          >
            <div>
              <div class="font-bold text-sm text-foreground">{{ sc.title || sc.label }}</div>
              <div v-if="sc.isAttack" class="text-[10px] text-muted-foreground">
                Ataque: {{ sc.attackBonus ? modStr(Number(sc.attackBonus)) : resolveFormula(sc.attackFormula || '') }}
              </div>
              <div v-else-if="sc.rollFormula || sc.formula" class="text-[10px] text-muted-foreground">
                {{ sc.rollFormula || sc.formula }}
              </div>
            </div>
            <div class="flex items-center gap-1">
              <button v-if="sc.description"
                @click.stop="onShowDescription(sc.title || sc.label, sc.description)"
                class="p-1 text-muted-foreground hover:text-primary transition-all rounded hover:bg-muted">
                <MessageSquare class="w-3.5 h-3.5" />
              </button>
              <button v-if="editMode" @click.stop="onDeleteShortcut(Number(i))"
                class="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-400 transition-all p-1">
                <Trash2 class="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        <!-- Add shortcut -->
        <div v-if="editMode" class="mt-4 pt-3 border-t border-border/50 flex justify-end">
          <button @click="onAddShortcut"
            class="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors border border-primary/30 rounded-lg px-2.5 py-1 hover:bg-primary/10">
            <Plus class="w-3 h-3" /> Novo Atalho
          </button>
        </div>

    </div>
  </div>
</template>
