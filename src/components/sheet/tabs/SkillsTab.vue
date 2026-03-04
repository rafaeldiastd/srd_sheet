<script setup lang="ts">
import { computed, ref } from 'vue'
import { Search, Plus, Trash2, Pencil } from 'lucide-vue-next'
import SkillEditorModal from '@/components/sheet/SkillEditorModal.vue'

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
  onSaveCustomSkill?: (skill: any, index: number) => void
  onDeleteCustomSkill?: (index: number) => void
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

// Custom skill modal
const skillEditorOpen = ref(false)
const skillEditorItem = ref<any>(null)
const skillEditorIndex = ref(-1)

function openSkillEditor(skill?: any, index = -1) {
  skillEditorItem.value = skill || null
  skillEditorIndex.value = index
  skillEditorOpen.value = true
}

function handleSkillSave(skill: any, index: number) {
  if (props.onSaveCustomSkill) props.onSaveCustomSkill(skill, index)
}

function handleDeleteCustomSkill(index: number) {
  if (props.onDeleteCustomSkill) props.onDeleteCustomSkill(index)
}

// Custom skills are stored in d.customSkills
const customSkills = computed<any[]>(() => props.d?.customSkills || [])

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

function rollSkill(sk: any) {
  const formula = sk.customFormula || `1d20 + @${sk.ability}Mod`
  emit('roll', sk.name, formula)
}

const ABILITY_ABBREV: Record<string, string> = {
  str: 'FOR', dex: 'DES', con: 'CON', int: 'INT', wis: 'SAB', cha: 'CAR'
}
</script>

<template>
  <div>
    <div class="space-y-4">
      <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-2">
      <div class="relative flex-1 min-w-48">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          :value="skillSearch"
          @input="emit('update:skill-search', ($event.target as HTMLInputElement).value)"
          placeholder="Buscar perícia..."
          class="w-full pl-9 pr-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/60"
        />
      </div>
      <button
        @click="emit('toggle-tabs-edit')"
        class="text-xs font-bold px-3 py-2 rounded-lg border transition-all"
        :class="tabsEditMode
          ? 'bg-primary/20 border-primary text-primary'
          : 'bg-muted border-border text-muted-foreground hover:text-foreground hover:border-zinc-600'"
      >
        {{ tabsEditMode ? ' Concluir Edição' : 'Editar Perícias' }}
      </button>

      <!-- Add custom skill -->
      <button
        @click="openSkillEditor()"
        class="flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-lg border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
      >
        <Plus class="w-3.5 h-3.5" /> Perícia Custom
      </button>

      <div v-if="tabsEditMode" class="text-xs text-muted-foreground">
        Gastos: <span class="font-bold text-primary">{{ skillPointsSpent }}</span>
        · Disponíveis: <span class="font-bold text-foreground">{{ editedData?.skillPoints ?? '?' }}</span>
      </div>
    </div>

    <!-- Standard Skills Table / Grid -->
    <div class="rounded-xl border border-border bg-card/40 p-2">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
        <div
          v-for="sk in displayedSkills"
          :key="sk.name"
          class="grid grid-cols-[1fr_auto_auto_auto] items-center px-3 py-2 rounded-lg border border-transparent transition-colors group"
          :class="!tabsEditMode ? 'cursor-pointer hover:bg-muted hover:border-border' : 'hover:bg-muted/30'"
          @click="!tabsEditMode && emit('roll', sk.name, '1d20 + @' + sk.ability + 'Mod')"
        >
          <!-- Name -->
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-bold text-muted-foreground/60 uppercase w-6 text-center">{{ sk.ability }}</span>
            <div>
              <span class="text-sm font-medium transition-colors"
                :class="!tabsEditMode ? 'text-foreground/80 group-hover:text-primary' : 'text-foreground/80'">
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
          <div class="text-center w-12 text-xs text-muted-foreground tabular-nums" title="Modificador de Atributo">
            {{ modStrF(skillAbilityMod(sk.ability)) }}
          </div>

          <!-- Rank -->
          <div class="text-center w-20" title="Graduações">
            <div v-if="tabsEditMode" class="flex items-center justify-center gap-1">
              <button
                @click.stop="emit('adjust-rank', sk.name, -1)"
                class="w-5 h-5 rounded bg-accent hover:bg-accent text-sm flex items-center justify-center text-muted-foreground leading-none"
              >−</button>
              <span class="w-6 text-center text-xs font-bold tabular-nums text-foreground">{{ getRank(sk.name) }}</span>
              <button
                @click.stop="emit('adjust-rank', sk.name, 1)"
                class="w-5 h-5 rounded bg-accent hover:bg-accent text-sm flex items-center justify-center text-muted-foreground leading-none"
              >+</button>
            </div>
            <span v-else class="text-xs text-muted-foreground tabular-nums">r: {{ getRank(sk.name) }}</span>
          </div>

          <!-- Total -->
          <div class="text-center w-12" title="Total">
            <span class="text-sm font-bold tabular-nums"
              :class="skillTotal(sk.name, sk.ability) >= 10 ? 'text-primary' : 'text-foreground/80'">
              {{ modStr(skillTotal(sk.name, sk.ability)) }}
            </span>
          </div>
        </div>

        <div v-if="!displayedSkills.length" class="col-span-1 md:col-span-2 text-center py-10 text-muted-foreground/60 text-sm">
          Nenhuma perícia encontrada.
        </div>
      </div>
    </div>

    <!-- Custom Skills Section -->
    <div v-if="customSkills.length || true" class="space-y-2">
      <div class="flex items-center gap-2">
        <h4 class="text-xs font-black uppercase tracking-widest text-muted-foreground">Perícias Customizadas</h4>
        <div class="flex-1 border-t border-border/40"></div>
        <span class="text-[10px] text-muted-foreground/50">{{ customSkills.length }} pericias</span>
      </div>

      <div v-if="customSkills.length" class="rounded-xl border border-border bg-card/40 p-2 space-y-1">
        <div
          v-for="(sk, i) in customSkills"
          :key="i"
          class="grid grid-cols-[1fr_auto_auto_auto_auto] items-center px-3 py-2 rounded-lg border border-transparent transition-colors group cursor-pointer hover:bg-muted hover:border-border"
          @click="rollSkill(sk)"
        >
          <!-- Name -->
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-bold text-muted-foreground/60 uppercase w-6 text-center">{{ ABILITY_ABBREV[sk.ability] || sk.ability }}</span>
            <div>
              <span class="text-sm font-medium text-foreground/80 group-hover:text-primary transition-colors">{{ sk.name }}</span>
              <div class="flex gap-1 mt-0.5">
                <span v-if="sk.isClassSkill" class="text-[9px] text-primary/70 bg-primary/10 rounded px-1">classe</span>
                <span v-if="sk.trainedOnly" class="text-[9px] text-amber-400/70 bg-amber-400/10 rounded px-1">treinada</span>
              </div>
            </div>
          </div>

          <!-- Mod -->
          <div class="text-center w-12 text-xs text-muted-foreground tabular-nums">
            {{ modStrF(calcMod(attrTotal(sk.ability))) }}
          </div>

          <!-- Ranks -->
          <div class="text-center w-12 text-xs text-muted-foreground tabular-nums">
            r: {{ sk.ranks || 0 }}
          </div>

          <!-- Bonus from modifiers -->
          <div class="text-center w-12">
            <span class="text-sm font-bold tabular-nums text-foreground/80">
              {{ modStr(calcMod(attrTotal(sk.ability)) + (sk.ranks || 0) + (sk.isClassSkill && sk.ranks > 0 ? 3 : 0) + (sk.modifiers?.reduce((acc: number, m: any) => acc + m.value, 0) || 0)) }}
            </span>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
            <button @click.stop="openSkillEditor(sk, i)"
              class="p-1.5 text-muted-foreground/60 hover:text-primary transition-colors">
              <Pencil class="w-3.5 h-3.5" />
            </button>
            <button @click.stop="handleDeleteCustomSkill(i)"
              class="p-1.5 text-red-800 hover:text-red-500 transition-colors">
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-6 text-muted-foreground/40 text-xs border border-dashed border-border/40 rounded-xl">
        Nenhuma perícia customizada. Clique em <strong>+ Perícia Custom</strong> para adicionar.
      </div>
    </div>
  </div>

    <SkillEditorModal
      v-model="skillEditorOpen"
      :skill="skillEditorItem"
      :index="skillEditorIndex"
      @save="handleSkillSave"
    />
  </div>
</template>
