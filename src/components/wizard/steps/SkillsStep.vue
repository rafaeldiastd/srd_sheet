<script setup lang="ts">
import { computed, ref } from 'vue'
import { useWizardStore } from '@/stores/wizardStore'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SKILLS_DATA, CLASS_SKILLS, CLASS_SKILL_POINTS } from '@/data/dnd35'
import type { CharacterAttributes } from '@/stores/wizardStore'
import { Search } from 'lucide-vue-next'

const store = useWizardStore()

// Selected skills — set of skill names the user has chosen to have
const selectedSkills = computed<Set<string>>(() => {
  const set = new Set<string>()
  for (const [name, ranks] of Object.entries(store.character.skills)) {
    if (ranks !== undefined) set.add(name)
  }
  return set
})

const searchQuery = ref('')
const phase = ref<'select' | 'allocate'>('select')

const classSkills = computed(() => {
  const cls = store.character.class
  return CLASS_SKILLS[cls] || []
})

const intMod = computed(() => {
  const score = store.character.attributes.int.base + (store.character.attributes.int.temp || 0)
  return Math.floor((score - 10) / 2)
})

const maxRanks = computed(() => store.character.level + 3)
const maxCrossClassRanks = computed(() => (store.character.level + 3) / 2)

const totalSkillPoints = computed(() => {
  const cls = store.character.class
  const base = CLASS_SKILL_POINTS[cls] || 2
  const perLevel = Math.max(1, base + intMod.value)
  return store.character.level === 1 ? perLevel * 4 : perLevel * 4 + perLevel * (store.character.level - 1)
})

const usedPoints = computed(() => {
  let total = 0
  for (const skill of SKILLS_DATA) {
    if (!selectedSkills.value.has(skill.name)) continue
    const ranks = store.character.skills[skill.name] || 0
    const isClass = classSkills.value.includes(skill.name)
    total += isClass ? ranks : ranks * 2
  }
  return total
})

const remainingPoints = computed(() => totalSkillPoints.value - usedPoints.value)

// Filtered skills for the selection phase
const filteredSkills = computed(() => {
  const q = searchQuery.value.toLowerCase()
  return SKILLS_DATA.filter(s => !q || s.name.toLowerCase().includes(q))
})

// Skills selected for the allocation phase
const chosenSkills = computed(() =>
  SKILLS_DATA.filter(s => selectedSkills.value.has(s.name))
)

function isSelected(skillName: string) {
  return selectedSkills.value.has(skillName)
}

function toggleSkill(skillName: string) {
  if (isSelected(skillName)) {
    // Remove from skills — delete the key entirely
    const newSkills = { ...store.character.skills }
    delete newSkills[skillName]
    store.character.skills = newSkills
  } else {
    store.character.skills = { ...store.character.skills, [skillName]: 0 }
  }
}

function getAbilityMod(ability: string) {
  const attr = store.character.attributes[ability as keyof CharacterAttributes]
  const score = attr.base + (attr.temp || 0)
  return Math.floor((score - 10) / 2)
}

function getTotal(skillName: string, ability: string) {
  const ranks = store.character.skills[skillName] || 0
  return ranks + getAbilityMod(ability)
}

function handleRankChange(skillName: string, value: string | number) {
  let val = Number(value)
  if (isNaN(val)) val = 0
  const isClass = classSkills.value.includes(skillName)
  const max = isClass ? maxRanks.value : maxCrossClassRanks.value
  val = Math.max(0, Math.min(val, max))
  store.character.skills = { ...store.character.skills, [skillName]: val }
}
</script>

<template>
  <div class="flex flex-col gap-6">

    <!-- Phase Tabs -->
    <div class="flex gap-2 border-b border-border">
      <button @click="phase = 'select'" class="px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors"
        :class="phase === 'select' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'">
        1. Escolher Perícias
      </button>
      <button @click="phase = 'allocate'" class="px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors"
        :class="phase === 'allocate' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'">
        2. Distribuir Graduações
      </button>
    </div>

    <!-- === PHASE 1: SELECT SKILLS === -->
    <div v-if="phase === 'select'" class="flex flex-col gap-4">
      <p class="text-sm text-muted-foreground">
        Selecione as perícias que seu personagem terá. Perícias de classe (marcadas em ouro) custam 1 ponto/graduação.
        Perícias cruzadas custam 2 pontos.
      </p>

      <!-- Search -->
      <div class="relative">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input v-model="searchQuery" placeholder="Buscar perícia..." class="pl-9" />
      </div>

      <!-- Skill grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[420px] overflow-y-auto pr-1">
        <button v-for="skill in filteredSkills" :key="skill.name" @click="toggleSkill(skill.name)"
          class="flex items-center gap-3 p-3 rounded-lg border text-left transition-all text-sm" :class="[
            isSelected(skill.name)
              ? 'bg-primary/10 border-primary text-foreground'
              : 'bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-foreground',
          ]">
          <!-- Checkbox visual -->
          <div class="w-5 h-5 rounded flex items-center justify-center shrink-0 border-2 transition-colors"
            :class="isSelected(skill.name) ? 'bg-primary border-primary' : 'border-muted-foreground'">
            <span v-if="isSelected(skill.name)" class="text-primary-foreground text-xs font-bold">✓</span>
          </div>

          <!-- Skill info -->
          <div class="flex-1 min-w-0">
            <span class="font-medium truncate block">
              {{ skill.name }}
              <span v-if="skill.trainedOnly" class="text-xs text-muted-foreground ml-1">*</span>
            </span>
            <span class="text-xs text-muted-foreground uppercase">{{ skill.ability }}</span>
          </div>

          <!-- Class skill indicator -->
          <span v-if="classSkills.includes(skill.name)" class="text-xs font-bold text-primary shrink-0">Classe</span>
        </button>
      </div>

      <div class="flex items-center justify-between pt-2">
        <p class="text-xs text-muted-foreground">* Somente Treinada</p>
        <p class="text-sm text-muted-foreground">
          <span class="font-bold text-foreground">{{ selectedSkills.size }}</span> perícias selecionadas
        </p>
      </div>

      <Button @click="phase = 'allocate'" class="self-end">
        Distribuir Graduações →
      </Button>
    </div>

    <!-- === PHASE 2: ALLOCATE RANKS === -->
    <div v-else class="flex flex-col gap-4">

      <!-- Points summary bar -->
      <div class="grid grid-cols-3 gap-4 p-4 bg-card border border-border rounded-lg text-center">
        <div>
          <p class="text-xs text-muted-foreground uppercase font-bold">Total</p>
          <p class="text-2xl font-bold text-foreground">{{ totalSkillPoints }}</p>
        </div>
        <div>
          <p class="text-xs text-muted-foreground uppercase font-bold">Usados</p>
          <p class="text-2xl font-bold text-foreground">{{ usedPoints }}</p>
        </div>
        <div>
          <p class="text-xs text-muted-foreground uppercase font-bold">Restantes</p>
          <p class="text-2xl font-bold"
            :class="remainingPoints < 0 ? 'text-destructive' : remainingPoints === 0 ? 'text-primary' : 'text-foreground'">
            {{ remainingPoints }}
          </p>
        </div>
      </div>

      <p v-if="chosenSkills.length === 0" class="text-center text-muted-foreground py-8 italic">
        Nenhuma perícia selecionada.
        <button @click="phase = 'select'" class="text-primary underline">Voltar e selecionar</button>
      </p>

      <!-- Skills table -->
      <div v-else class="border border-border rounded-lg overflow-hidden">
        <div
          class="grid grid-cols-[1fr_60px_60px_80px_60px] gap-0 bg-muted/40 border-b border-border px-3 py-2 text-xs font-bold text-muted-foreground uppercase">
          <div>Perícia</div>
          <div class="text-center">Hab</div>
          <div class="text-center">Mod</div>
          <div class="text-center">Grads</div>
          <div class="text-center">Total</div>
        </div>
        <div class="max-h-[360px] overflow-y-auto divide-y divide-border">
          <div v-for="skill in chosenSkills" :key="skill.name"
            class="grid grid-cols-[1fr_60px_60px_80px_60px] gap-0 px-3 py-2 items-center text-sm transition-colors hover:bg-muted/20"
            :class="classSkills.includes(skill.name) ? 'bg-primary/5' : ''">
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full shrink-0"
                :class="classSkills.includes(skill.name) ? 'bg-primary' : 'bg-muted-foreground/30'"></div>
              <span class="truncate font-medium">
                {{ skill.name }}
                <span v-if="skill.trainedOnly" class="text-muted-foreground text-xs">*</span>
              </span>
            </div>
            <div class="text-center text-xs text-muted-foreground uppercase font-mono">{{ skill.ability }}</div>
            <div class="text-center text-muted-foreground">
              {{ getAbilityMod(skill.ability) >= 0 ? '+' : '' }}{{ getAbilityMod(skill.ability) }}
            </div>
            <div class="flex justify-center">
              <Input type="number" :value="store.character.skills[skill.name] || 0"
                @input="(e: Event) => handleRankChange(skill.name, (e.target as HTMLInputElement).value)"
                class="h-7 w-16 text-center px-1 text-sm" min="0"
                :max="classSkills.includes(skill.name) ? maxRanks : maxCrossClassRanks" step="1" />
            </div>
            <div class="text-center font-bold text-primary">
              {{ getTotal(skill.name, skill.ability) >= 0 ? '+' : '' }}{{ getTotal(skill.name, skill.ability) }}
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-between items-center pt-1">
        <button @click="phase = 'select'" class="text-sm text-muted-foreground underline hover:text-foreground">←
          Alterar Seleção</button>
        <p class="text-xs text-muted-foreground">* Somente Treinada</p>
      </div>
    </div>

  </div>
</template>
