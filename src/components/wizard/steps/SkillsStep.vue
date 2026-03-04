<script setup lang="ts">
import { ref, computed, watch } from 'vue'
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
  const baseSkills = CLASS_SKILLS[cls] || []

  // Ex: "Conhecimento (Arcano)" in baseSkills exactly matches the skill.
  // But some classes might have "Conhecimento (Todos)" or something similar in homebrew/expanded rules. 
  // Let's also check if they have blanket proficiencies if needed.
  return baseSkills
})

function isClassSkill(skillName: string) {
  if (store.character.class === 'Personalizada') return true // Custom class can treat any skill as a class skill

  const skills = classSkills.value
  if (skills.includes(skillName)) return true

  // Handle wildcard skills if the class definition includes them (like Bardo or Mago that have many)
  // E.g., if a class had "Conhecimento (Todos)", then we'd match any "Conhecimento"
  if (skillName.startsWith('Conhecimento') && skills.includes('Conhecimento (Todos)')) return true
  if (skillName.startsWith('Ofícios') && skills.includes('Ofícios (Qualquer)')) return true
  if (skillName.startsWith('Profissão') && skills.includes('Profissão (Qualquer)')) return true

  // D&D 3.5 Specific rule tweak:
  // If the skill is not specifically listed for the class, it's cross-class.
  // Wait, the issue might be that we need to ensure ALL knowledges act as class skills if the user buys them, 
  // ONLY if the class actually has them.
  // Actually, Mago has many listed explicitly. But what about Bardo? Bardo has "todas as perícias de Conhecimento".
  // Let's check CLASS_SKILLS for Bardo. It says 'Conhecimento (Arcano)', maybe we need to add a generic check.

  // Let's just do a specific check: Bard gets ALL Knowledge skills in 3.5e
  if (store.character.class === 'Bardo' && skillName.startsWith('Conhecimento')) return true

  return false
}

// Intelligence modifier used explicitly for skill points (ignores temporary bonuses per D&D 3.5e rules)
const skillPointsIntMod = computed(() => {
  const score = store.character.attributes.int.base
  return Math.floor((score - 10) / 2)
})

const isHuman = computed(() => {
  const r = store.character.race || ''
  return r.toLowerCase().includes('human')
})

const calculatedSkillPoints = computed(() => {
  const cls = store.character.class
  const base = store.character.customSkillPoints || CLASS_SKILL_POINTS[cls] || 2

  // D&D 3.5e rule: Min 1 point per level before human bonus (uses base INT only, temp INT does not grant skill points)
  let basePerLevel = Math.max(1, base + skillPointsIntMod.value)

  // Level 1: (Base + Int) * 4. Human *gets 4 extra points at level 1* (not multiplied) and +1 per level after.
  const isHumanChar = isHuman.value
  const lvl1Points = (basePerLevel * 4) + (isHumanChar ? 4 : 0)

  const futureLevels = Math.max(0, store.character.level - 1)
  const futurePoints = futureLevels * basePerLevel + (isHumanChar ? futureLevels : 0)

  return lvl1Points + futurePoints
})

// Sync the calculated points only if the user hasn't modified it manually (or if it's 0)
watch(calculatedSkillPoints, (newTotal) => {
  if (!store.character.skillPoints) {
    store.character.skillPoints = newTotal
  }
}, { immediate: true })

const usedPoints = computed(() => {
  let total = 0
  for (const skill of SKILLS_DATA) {
    if (!selectedSkills.value.has(skill.name)) continue
    const ranks = store.character.skills[skill.name] || 0
    const isClass = isClassSkill(skill.name)
    total += isClass ? ranks : ranks * 2
  }
  return total
})

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
  return Math.floor(ranks) + getAbilityMod(ability)
}

function handleRankChange(skillName: string, value: string | number) {
  let val = Number(value)
  if (isNaN(val)) val = 0

  // Allow unrestricted rank allocation, just prevent negative
  val = Math.max(0, val)
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
            <span v-if="isSelected(skill.name)" class="text-primary-foreground text-xs font-bold"></span>
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
          <span v-if="isClassSkill(skill.name)" class="text-xs font-bold text-primary shrink-0">Classe</span>
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
        <div class="flex flex-col items-center">
          <div class="flex items-center justify-center gap-1.5 opacity-80 mb-0.5">
            <span class="text-[10px] uppercase font-bold text-muted-foreground whitespace-nowrap">Total Pontos</span>
            <div class="flex items-center gap-1 px-1.5 py-0.5 bg-muted rounded text-[9px] font-mono leading-none">
              <span title="D&D 3.5: (Base + Int) × 4 no NVL 1">Sugestão: {{ calculatedSkillPoints }}</span>
            </div>
          </div>
          <Input type="number" v-model.number="store.character.skillPoints"
            class="h-9 w-24 text-center text-xl font-bold bg-transparent border-primary/50" />
        </div>
        <div class="flex flex-col items-center">
          <span
            class="text-[10px] uppercase font-bold text-muted-foreground opacity-80 mb-0.5 whitespace-nowrap">Distribuídos</span>
          <p class="text-3xl font-bold text-muted-foreground">{{ usedPoints }}</p>
        </div>
        <div class="flex flex-col items-center">
          <span
            class="text-[10px] uppercase font-bold text-muted-foreground opacity-80 mb-0.5 whitespace-nowrap">Restantes</span>
          <p class="text-3xl font-bold"
            :class="(store.character.skillPoints || 0) - usedPoints < 0 ? 'text-destructive' : 'text-primary'">
            {{ (store.character.skillPoints || 0) - usedPoints }}
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
            :class="isClassSkill(skill.name) ? 'bg-primary/5' : ''">
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full shrink-0"
                :class="isClassSkill(skill.name) ? 'bg-primary' : 'bg-muted-foreground/30'"></div>
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
                class="h-7 w-16 text-center px-1 text-sm tabular-nums" min="0"
                :step="isClassSkill(skill.name) ? 1 : 0.5" />
            </div>
            <div class="text-center font-bold text-primary tabular-nums">
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
