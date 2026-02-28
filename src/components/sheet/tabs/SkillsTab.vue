<script setup lang="ts">
import { computed } from 'vue'
import { Search } from 'lucide-vue-next'

const props = defineProps<{
  d: any
  editMode: boolean
  tabsEditMode: boolean
  editedData: any
  skillPhase: 'select' | 'allocate'
  skillSearch: string
  filteredSkillsList: { name: string; ability: string; trainedOnly?: boolean; ranks?: number }[]
  activeSkills: { name: string; ranks: number; ability: string }[]
  skillPointsSpent: number
  modStr: (n: number) => string
  modStrF: (n: number) => string
  skillAbilityMod: (ability: string) => number
  skillTotal: (name: string, ability: string) => number
  isClassSkill: (name: string) => boolean
  calcMod: (n: number) => number
  attrTotal: (key: string) => number
}>()

const emit = defineEmits<{
  (e: 'toggle-tabs-edit'): void
  (e: 'update:skill-phase', v: 'select' | 'allocate'): void
  (e: 'update:skill-search', v: string): void
  (e: 'toggle-skill-edit', name: string): void
  (e: 'adjust-rank', name: string, delta: 1 | -1): void
  (e: 'add-level-up-skill-points'): void
  (e: 'roll', label: string, formula: string): void
}>()

// In view mode show activeSkills. When searching, show filteredSkillsList filtered by active skills.
const displayedSkills = computed(() => {
  if (props.tabsEditMode) {
    return props.skillSearch ? props.filteredSkillsList : props.activeSkills
  }
  return props.skillSearch
    ? props.filteredSkillsList.filter(s => props.activeSkills.some(a => a.name === s.name))
    : props.activeSkills
})

function getRank(name: string): number {
  if (props.tabsEditMode && props.editedData?.skills) {
    return props.editedData.skills[name] ?? 0
  }
  const sk = props.activeSkills.find(s => s.name === name)
  return sk?.ranks ?? 0
}
</script>

<template>
  <div class="space-y-4">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-2">
      <div class="relative flex-1 min-w-48">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
        <input
          :value="skillSearch"
          @input="emit('update:skill-search', ($event.target as HTMLInputElement).value)"
          placeholder="Buscar perícia..."
          class="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-primary/60"
        />
      </div>
      <button
        @click="emit('toggle-tabs-edit')"
        class="text-xs font-bold px-3 py-2 rounded-lg border transition-all"
        :class="tabsEditMode
          ? 'bg-primary/20 border-primary text-primary'
          : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600'"
      >
        {{ tabsEditMode ? '✓ Concluir Edição' : 'Editar Perícias' }}
      </button>

      <div v-if="tabsEditMode" class="text-xs text-zinc-500">
        Gastos: <span class="font-bold text-primary">{{ skillPointsSpent }}</span>
        · Disponíveis: <span class="font-bold text-zinc-200">{{ editedData?.skillPoints ?? '?' }}</span>
      </div>
    </div>

    <!-- Table / Grid -->
    <div class="rounded-xl border border-zinc-800 bg-zinc-950/40 p-2">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
        <div
          v-for="sk in displayedSkills"
          :key="sk.name"
          class="grid grid-cols-[1fr_auto_auto_auto] items-center px-3 py-2 rounded-lg border border-transparent transition-colors group"
          :class="!tabsEditMode ? 'cursor-pointer hover:bg-zinc-900 hover:border-zinc-800' : 'hover:bg-zinc-900/30'"
          @click="!tabsEditMode && emit('roll', sk.name, '1d20 + @' + sk.ability + 'Mod')"
        >
          <!-- Name -->
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-bold text-zinc-600 uppercase w-6 text-center">{{ sk.ability }}</span>
            <div>
              <span class="text-sm font-medium transition-colors"
                :class="!tabsEditMode ? 'text-zinc-300 group-hover:text-primary' : 'text-zinc-300'">
                {{ sk.name }}
              </span>
              <!-- show class skill badge and toggle in edit mode -->
              <div v-if="tabsEditMode" class="flex items-center gap-1 mt-0.5">
                <span v-if="isClassSkill(sk.name)" class="text-[9px] text-primary/70 bg-primary/10 rounded px-1">classe</span>
              </div>
            </div>
            <span v-if="!tabsEditMode && isClassSkill(sk.name)" class="text-[9px] text-primary/70 bg-primary/10 rounded px-1">classe</span>
          </div>

          <!-- Ability mod -->
          <div class="text-center w-12 text-xs text-zinc-400 tabular-nums" title="Modificador de Atributo">
            {{ modStrF(skillAbilityMod(sk.ability)) }}
          </div>

          <!-- Rank -->
          <div class="text-center w-20" title="Graduações">
            <div v-if="tabsEditMode" class="flex items-center justify-center gap-1">
              <button
                @click.stop="emit('adjust-rank', sk.name, -1)"
                class="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 text-sm flex items-center justify-center text-zinc-400 leading-none"
              >−</button>
              <span class="w-6 text-center text-xs font-bold tabular-nums text-zinc-200">{{ getRank(sk.name) }}</span>
              <button
                @click.stop="emit('adjust-rank', sk.name, 1)"
                class="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 text-sm flex items-center justify-center text-zinc-400 leading-none"
              >+</button>
            </div>
            <span v-else class="text-xs text-zinc-500 tabular-nums">r: {{ getRank(sk.name) }}</span>
          </div>

          <!-- Total -->
          <div class="text-center w-12" title="Total">
            <span class="text-sm font-bold tabular-nums"
              :class="skillTotal(sk.name, sk.ability) >= 10 ? 'text-primary' : 'text-zinc-300'">
              {{ modStr(skillTotal(sk.name, sk.ability)) }}
            </span>
          </div>
        </div>

        <div v-if="!displayedSkills.length" class="col-span-1 md:col-span-2 text-center py-10 text-zinc-600 text-sm">
          Nenhuma perícia encontrada.
        </div>
      </div>
    </div>
  </div>
</template>
