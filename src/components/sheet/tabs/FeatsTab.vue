<script setup lang="ts">
import { ref } from 'vue'
import { Plus, Trash2, Swords, Zap, ChevronDown, ChevronUp, MessageSquare } from 'lucide-vue-next'

const props = defineProps<{
  d: any
  editMode: boolean
  modStr: (n: number) => string
  resolveFormula: (formula: string) => string
  onOpenEditor: (type: string, item?: any, index?: number) => void
  onDelete: (type: string, index: number) => void
  onRoll: (label: string, formula: string) => void
  onAttackRoll: (label: string, atkF: string, dmgF: string) => void
  onShowDescription: (title: string, desc: string) => void
}>()

const emit = defineEmits<{
  (e: 'toggle-active', index: number): void
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
    <div class="bg-muted/60 border border-border rounded-xl px-3 py-2 flex items-center justify-between">
      <span class="text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {{ d?.feats?.length ?? 0 }} talentos
      </span>
      <button @click="onOpenEditor('feat')"
        class="flex items-center gap-1 text-xs text-foreground/80 border border-border rounded-lg px-2.5 py-1.5 hover:bg-accent transition-colors">
        <Plus class="w-3.5 h-3.5" /> Novo Talento
      </button>
    </div>

    <div class="space-y-2">
      <div v-for="(feat, i) in d?.feats" :key="i"
        class="rounded-xl border border-border bg-card/60 transition-all duration-200 hover:border-border overflow-hidden group">
        <!-- Header row -->
        <div class="flex items-center gap-3 px-4 py-3">
          <div class="flex-1 cursor-pointer" @click="toggleExpand(i)">
            <div class="flex items-center gap-2">
              <component :is="feat.isAttack ? Swords : Zap"
                class="w-4 h-4 shrink-0"
                :class="feat.isAttack ? 'text-red-400' : 'text-primary'" />
              <span class="font-bold text-foreground text-sm">{{ feat.title }}</span>
              <span v-if="feat.featType" class="text-[9px] font-black uppercase tracking-tighter bg-accent text-muted-foreground px-1.5 py-0.5 rounded ml-1">{{ feat.featType }}</span>
            </div>
            <div v-if="feat.requirements" class="text-[10px] text-muted-foreground/60 mt-0.5 ml-6 italic">
              Pré-req: {{ feat.requirements }}
            </div>
            <div v-if="feat.isAttack" class="text-xs text-muted-foreground mt-0.5 ml-6">
              Ataque {{ resolveFormula(feat.attackFormula || '') }} · Dano {{ resolveFormula(feat.damageFormula || '') }}
            </div>
            <div v-else-if="feat.rollFormula" class="text-xs text-muted-foreground mt-0.5 ml-6">
              {{ feat.rollFormula }}
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-1">
            <!-- Buff Toggle -->
            <button v-if="feat.activeModifiers?.length"
              @click="emit('toggle-active', Number(i))"
              class="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all"
              :class="feat.active 
                ? 'bg-cyan-500 text-cyan-950 shadow-[0_0_10px_rgba(6,182,212,0.5)]' 
                : 'bg-accent text-muted-foreground hover:text-muted-foreground border border-border'">
              <Zap class="w-3 h-3" /> {{ feat.active ? 'Ativo' : 'Ativar' }}
            </button>

            <button v-if="feat.isAttack"
              @click="onAttackRoll(feat.title, feat.attackFormula || '', feat.damageFormula || '')"
              class="text-xs font-bold px-2.5 py-1 rounded-lg bg-accent border border-border text-foreground/80 hover:bg-accent transition-colors">
              Atacar
            </button>
            <button v-else-if="feat.rollFormula"
              @click="onRoll(feat.title, feat.rollFormula)"
              class="text-xs font-bold px-2.5 py-1 rounded-lg bg-accent border border-border text-foreground/80 hover:bg-accent transition-colors">
              Rolar
            </button>
            <button v-if="feat.description"
              @click="onShowDescription(feat.title, feat.description)"
              class="p-1.5 text-muted-foreground hover:text-primary transition-all" title="Enviar para o chat">
              <MessageSquare class="w-4 h-4" />
            </button>
            <button @click="onOpenEditor('feat', feat, Number(i))" class="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground/60 hover:text-foreground/80 transition-all">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            </button>
            <button @click="onDelete('feat', Number(i))" class="opacity-0 group-hover:opacity-100 p-1.5 text-red-800 hover:text-red-500 transition-all">
              <Trash2 class="w-3.5 h-3.5" />
            </button>
            <button @click="toggleExpand(i)" class="p-1 text-muted-foreground/60 hover:text-foreground/80 transition-colors">
              <ChevronDown v-if="!expanded.has(i)" class="w-4 h-4" />
              <ChevronUp v-else class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Expanded description -->
        <div v-if="expanded.has(i) && feat.description"
          class="border-t border-border/60 px-4 py-3 bg-muted/30">
          <p class="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{{ feat.description }}</p>
        </div>
      </div>

      <div v-if="!d?.feats?.length" class="text-center py-12 text-muted-foreground/60 text-sm">
        Nenhum talento ou ataque cadastrado.
      </div>
    </div>
  </div>
</template>
