<script setup lang="ts">
import { Plus, Trash2, Dices, Wand2 } from 'lucide-vue-next'
import { ref, computed } from 'vue'

const props = defineProps<{
  d: any
  preparedSpells: Record<number, (string | null)[]>
  modStr: (n: number) => string
  resolveFormula: (formula: string) => string
  editMode: boolean
  onRollItem: (item: any) => void
  onRollSpell: (spell: any) => void
  onAddShortcut: () => void
  onDeleteShortcut: (i: number) => void
}>()

const activeTab = ref<'shortcuts' | 'spells'>('shortcuts')

// Filtra apenas os slots preenchidos e agrupa por nível
const activePreparedSpells = computed(() => {
  const result: Record<number, string[]> = {}
  Object.keys(props.preparedSpells || {}).forEach(levelStr => {
    const level = Number(levelStr)
    const spells = props.preparedSpells[level]?.filter(Boolean) as string[]
    if (spells && spells.length > 0) {
      result[level] = spells
    }
  })
  return result
})

function findSpellByTitle(title: string) {
  if (!title) return null
  return props.d?.spells?.find((sp: any) => sp.title === title)
}

function handleSpellClick(title: string) {
  const spell = findSpellByTitle(title)
  if (spell && (spell.rollFormula || spell.isAttack || spell.dynamicRolls?.length > 0)) {
    props.onRollSpell(spell)
  }
}
</script>

<template>
  <div class="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 flex flex-col max-h-[400px]">
    
    <!-- Tab Headers -->
    <div class="flex items-center gap-4 mb-4 border-b border-zinc-800/60 pb-2">
      <button @click="activeTab = 'shortcuts'"
        class="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest transition-colors pb-2 -mb-[9px] border-b-2"
        :class="activeTab === 'shortcuts' ? 'text-zinc-200 border-primary' : 'text-zinc-500 border-transparent hover:text-zinc-400'">
        <Dices class="w-3.5 h-3.5" /> Atalhos
      </button>
      <button @click="activeTab = 'spells'"
        class="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest transition-colors pb-2 -mb-[9px] border-b-2"
        :class="activeTab === 'spells' ? 'text-zinc-200 border-violet-500' : 'text-zinc-500 border-transparent hover:text-zinc-400'">
        <Wand2 class="w-3.5 h-3.5" /> Magias Preparadas
      </button>
    </div>

    <div class="flex-1 overflow-y-auto custom-scrollbar pr-1">
      
      <!-- TAB ATACHOS -->
      <template v-if="activeTab === 'shortcuts'">
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
      </template>

      <!-- TAB PREPARED SPELLS -->
      <template v-else-if="activeTab === 'spells'">
        <div v-if="Object.keys(activePreparedSpells).length === 0" class="text-center py-6 text-zinc-600 text-sm">
          Nenhuma magia preparada no momento.
        </div>

        <div v-else class="space-y-3">
          <div v-for="(spells, level) in activePreparedSpells" :key="level" class="space-y-1.5">
            <div class="text-[10px] font-bold text-violet-500/70 uppercase tracking-widest border-b border-zinc-800/50 pb-1">
              {{ String(level) === '0' ? 'Truques' : `Nível ${level}` }}
            </div>
            <div class="flex flex-wrap gap-2">
              <div v-for="(spellTitle, i) in spells" :key="i"
                class="flex items-center justify-between min-w-[140px] bg-zinc-900 border border-violet-900/30 rounded-lg px-2 py-1.5 hover:border-violet-500/50 transition-colors cursor-pointer group"
                @click="handleSpellClick(spellTitle)">
                <span class="text-xs font-semibold text-zinc-200 group-hover:text-zinc-100 transition-colors">{{ spellTitle }}</span>
                <span v-if="findSpellByTitle(spellTitle)?.rollFormula || findSpellByTitle(spellTitle)?.isAttack || findSpellByTitle(spellTitle)?.dynamicRolls?.length" 
                      class="ml-2 text-[9px] bg-violet-900/40 text-violet-300 px-1 py-0.5 rounded uppercase font-bold group-hover:bg-violet-600 group-hover:text-white transition-colors">
                  Rolar
                </span>
              </div>
            </div>
          </div>
        </div>
      </template>

    </div>
  </div>
</template>
