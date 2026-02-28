

---
## FILE: src/components/wizard/steps/SkillsStep.vue
```vue
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

```


---
## FILE: src/components/wizard/steps/SpellsStep.vue
```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useWizardStore } from '@/stores/wizardStore'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Trash2 } from 'lucide-vue-next'

const store = useWizardStore()
const newSpell = ref('')

const spellcastingClasses = ['Bard', 'Cleric', 'Druid', 'Paladin', 'Ranger', 'Sorcerer', 'Wizard']
const isSpellcaster = computed(() => spellcastingClasses.includes(store.character.class))

function addSpell() {
  if (newSpell.value.trim()) {
    store.character.spells.push(newSpell.value.trim())
    newSpell.value = ''
  }
}

function removeSpell(index: number) {
  store.character.spells.splice(index, 1)
}
</script>

<template>
  <div class="grid gap-6">
    <div v-if="!isSpellcaster" class="text-center p-8 text-muted-foreground">
      <p>Sua classe selecionada ({{ store.character.class }}) tipicamente não conjura magias.</p>
      <p class="text-sm">Você ainda pode adicionar magias se tiver habilidades especiais ou talentos.</p>
    </div>

    <div class="flex gap-2">
      <Input v-model="newSpell" placeholder="Nome da magia" @keyup.enter="addSpell" />
      <Button @click="addSpell">Adicionar Magia</Button>
    </div>

    <div class="grid gap-2">
      <Card v-for="(spell, index) in store.character.spells" :key="index" class="p-4 flex justify-between items-center">
        <span>{{ spell }}</span>
        <Button variant="ghost" size="icon" @click="removeSpell(index)">
          <Trash2 class="h-4 w-4" />
        </Button>
      </Card>
      <div v-if="store.character.spells.length === 0"
        class="text-center text-sm text-muted-foreground p-4 border border-dashed rounded-md">
        Nenhuma magia adicionada.
      </div>
    </div>
  </div>
</template>

```


---
## FILE: src/components/wizard/steps/TypeStep.vue
```vue
<script setup lang="ts">
import { useWizardStore } from '@/stores/wizardStore'
import { User, Skull, Ghost, Wand2 } from 'lucide-vue-next'

const store = useWizardStore()

const types = [
    {
        id: 'Personagem',
        title: 'Personagem (PC)',
        description: 'Um aventureiro principal controlado por um jogador.',
        icon: User,
    },
    {
        id: 'NPC',
        title: 'NPC',
        description: 'Personagem não-jogador, como um mercador ou aliado.',
        icon: Ghost,
    },
    {
        id: 'Monstro',
        title: 'Monstro',
        description: 'Uma criatura ou inimigo para ser enfrentado em combate.',
        icon: Skull,
    },
    {
        id: 'Invocação',
        title: 'Invocação / Familiar',
        description: 'Criatura mágica ou companheiro animal conjurado/treinado.',
        icon: Wand2,
    }
]
</script>

<template>
    <div class="flex flex-col gap-6">
        <div class="text-center mb-2">
            <h2 class="text-xl font-serif text-primary">Qual o tipo de ficha que você está criando?</h2>
            <p class="text-sm text-muted-foreground mt-1">Isso nos ajuda a classificar a ficha na sua campanha.</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button v-for="t in types" :key="t.id" @click="store.character.sheetType = t.id"
                class="flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all duration-200 text-center gap-3 cursor-pointer"
                :class="store.character.sheetType === t.id
                    ? 'border-primary bg-primary/10 text-primary shadow-md'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground hover:bg-muted/30'">

                <div class="p-3 rounded-full"
                    :class="store.character.sheetType === t.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'">
                    <component :is="t.icon" class="w-8 h-8" />
                </div>

                <div>
                    <h3 class="font-bold text-lg" :class="store.character.sheetType === t.id ? 'text-foreground' : ''">
                        {{ t.title }}</h3>
                    <p class="text-xs opacity-80 mt-1 max-w-[200px] mx-auto">{{ t.description }}</p>
                </div>
            </button>
        </div>
    </div>
</template>

```


---
## FILE: src/composables/useDeleteConfirm.ts
```typescript
import { ref } from 'vue'

export function useDeleteConfirm(onDelete: (type: string, index: number) => void | Promise<void>) {
    const isDeleteOpen = ref(false)
    const deleteCountdown = ref(0)
    const itemToDelete = ref<{ type: string; index: number } | null>(null)
    let deleteTimer: any = null

    function confirmDelete(type: string, index: number) {
        itemToDelete.value = { type, index }
        isDeleteOpen.value = true
        deleteCountdown.value = 3
        if (deleteTimer) clearInterval(deleteTimer)
        deleteTimer = setInterval(() => {
            deleteCountdown.value--
            if (deleteCountdown.value <= 0) {
                clearInterval(deleteTimer)
            }
        }, 1000)
    }

    async function executeDelete() {
        if (!itemToDelete.value || deleteCountdown.value > 0) return
        const { type, index } = itemToDelete.value

        await onDelete(type, index)

        isDeleteOpen.value = false
        itemToDelete.value = null
    }

    function cancelDelete() {
        isDeleteOpen.value = false
        itemToDelete.value = null
        if (deleteTimer) clearInterval(deleteTimer)
    }

    return {
        isDeleteOpen,
        deleteCountdown,
        itemToDelete,
        confirmDelete,
        executeDelete,
        cancelDelete
    }
}

```


---
## FILE: src/composables/useDndCalculations.ts
```typescript
import { computed, type Ref, type ComputedRef } from 'vue'
import type { SheetData, Modifier } from '@/types/sheet'
import { defaultBonuses } from '@/lib/sheetDefaults'

export function useDndCalculations(
    d: ComputedRef<SheetData | null | undefined>,
    editMode: ComputedRef<boolean>,
    editedData: Ref<SheetData | null>,
    sheet: Ref<any>
) {
    function calcMod(n: number) { return Math.floor((n - 10) / 2) }
    function modStr(n: number) { return n >= 0 ? `+${n}` : `${n}` }
    function modStrF(n: number) { return n >= 0 ? `+${n}` : `${n}` }

    const b = computed(() => d.value?.bonuses || defaultBonuses())

    const totalBonuses = computed(() => {
        const bonuses: Record<string, number> = {}
        d.value?.buffs?.filter((b: any) => b.active).forEach((b: any) => {
            b.modifiers?.forEach((m: Modifier) => bonuses[m.target] = (bonuses[m.target] || 0) + (Number(m.value) || 0))
        })
        d.value?.feats?.forEach((f: any) => {
            if (typeof f === 'string') return
            f.modifiers?.forEach((m: Modifier) => bonuses[m.target] = (bonuses[m.target] || 0) + (Number(m.value) || 0))
        })
        d.value?.spells?.forEach((s: any) => {
            if (typeof s === 'string') return
            s.modifiers?.forEach((m: Modifier) => bonuses[m.target] = (bonuses[m.target] || 0) + (Number(m.value) || 0))
        })
        d.value?.shortcuts?.forEach((s: any) => {
            s.modifiers?.forEach((m: Modifier) => bonuses[m.target] = (bonuses[m.target] || 0) + (Number(m.value) || 0))
        })
        d.value?.equipment?.forEach((item: any) => {
            if (typeof item === 'string') return
            if (item.equipped) {
                item.modifiers?.forEach((m: Modifier) => bonuses[m.target] = (bonuses[m.target] || 0) + (Number(m.value) || 0))
            }
        })
        return bonuses
    })

    const sizeMod = computed(() => {
        const s = d.value?.size || 'Médio'
        switch (s) {
            case 'Colossal': return -8
            case 'Imenso': return -4
            case 'Enorme': return -2
            case 'Grande': return -1
            case 'Médio': return 0
            case 'Pequeno': return 1
            case 'Mínimo': return 2
            case 'Diminuto': return 4
            case 'Minúsculo': return 8
            default: return 0
        }
    })

    function attrTotal(key: string) {
        const a = d.value?.attributes?.[key]
        const base = Number(a?.base ?? 10)
        const temp = Number(a?.temp ?? 0)
        const buffBonus = Number(totalBonuses.value[key] ?? 0)
        const configBonus = Number(d.value?.bonuses?.attributes?.[key] ?? 0)
        return base + temp + buffBonus + configBonus
    }

    const totalCA = computed(() => {
        if (!d.value) return 10
        return 10 + (d.value.ca_armor ?? 0) + calcMod(attrTotal('dex'))
            + (d.value.ca_shield ?? 0) + (d.value.ca_natural ?? 0)
            + (d.value.ca_deflect ?? 0) + sizeMod.value
            + (totalBonuses.value['CA'] ?? 0) + (b.value?.ca ?? 0)
    })

    const totalTouch = computed(() => {
        if (!d.value) return 10
        return 10 + calcMod(attrTotal('dex')) + (d.value.ca_deflect ?? 0) + sizeMod.value + (totalBonuses.value['toque'] ?? 0)
    })

    const totalFlatFooted = computed(() => {
        if (!d.value) return 10
        return 10 + (d.value.ca_armor ?? 0) + (d.value.ca_shield ?? 0) + (d.value.ca_natural ?? 0) + (d.value.ca_deflect ?? 0) + sizeMod.value + (totalBonuses.value['surpreso'] ?? 0)
    })

    const totalBAB = computed(() => (d.value?.bab || 0) + (totalBonuses.value.bab || 0) + (b.value?.bab ?? 0))
    const totalInitiative = computed(() => calcMod(attrTotal('dex')) + (d.value?.initiative_misc || 0) + (totalBonuses.value.iniciativa || 0) + (b.value?.initiative ?? 0))
    const totalHP = computed(() => (d.value?.hp_max || 0) + (totalBonuses.value.hp || 0) + (b.value?.hp ?? 0))
    const totalSpeed = computed(() => (d.value?.speed || 9) + (totalBonuses.value.speed || 0) + (b.value?.speed ?? 0))

    const meleeAtk = computed(() => totalBAB.value + calcMod(attrTotal('str')) + sizeMod.value + (totalBonuses.value.melee || 0))
    const rangedAtk = computed(() => totalBAB.value + calcMod(attrTotal('dex')) + sizeMod.value + (totalBonuses.value.ranged || 0))
    const grappleAtk = computed(() => totalBAB.value + calcMod(attrTotal('str')) + (sizeMod.value * 4) + (totalBonuses.value.grapple || 0))

    const totalFort = computed(() => (d.value?.save_fort || 0) + calcMod(attrTotal('con')) + (totalBonuses.value.fort || 0) + (b.value?.saves?.fort ?? 0))
    const totalRef = computed(() => (d.value?.save_ref || 0) + calcMod(attrTotal('dex')) + (totalBonuses.value.ref || 0) + (b.value?.saves?.ref ?? 0))
    const totalWill = computed(() => (d.value?.save_will || 0) + calcMod(attrTotal('wis')) + (totalBonuses.value.will || 0) + (b.value?.saves?.will ?? 0))

    const deathStatus = computed(() => {
        const hp = d.value?.hp_current ?? 0
        if (hp <= -10) return { label: 'Morto', color: 'bg-black text-white border-white/20' }
        if (hp < 0) return { label: 'Inconsciente / Morrendo', color: 'bg-red-500 text-white border-red-400' }
        if (hp === 0) return { label: 'Incapacitado', color: 'bg-orange-500 text-white border-orange-400' }
        return null
    })

    const totalWeight = computed(() => {
        if (!d.value?.equipment) return 0
        return d.value.equipment.reduce((sum: number, item: any) => {
            if (typeof item === 'string') return sum
            return sum + (Number(item.weight) || 0)
        }, 0)
    })

    function adjustField(obj: any, key: string, delta: number) {
        obj[key] = Number(obj[key] ?? 0) + delta
    }

    return {
        calcMod,
        modStr,
        modStrF,
        b,
        totalBonuses,
        sizeMod,
        attrTotal,
        totalCA,
        totalTouch,
        totalFlatFooted,
        totalBAB,
        totalInitiative,
        totalHP,
        totalSpeed,
        meleeAtk,
        rangedAtk,
        grappleAtk,
        totalFort,
        totalRef,
        totalWill,
        deathStatus,
        totalWeight,
        adjustField
    }
}

```


---
## FILE: src/composables/useDragReorder.ts
```typescript
import { ref, type Ref } from 'vue'

export function useDragReorder(
    reorderMode: Ref<boolean>,
    onReorder: (type: string, sourceIndex: number, targetIndex: number) => void | Promise<void>
) {
    const dragType = ref('')
    const dragSrcIndex = ref<number | null>(null)
    const dragOverIndex = ref<number | null>(null)

    function onDragStart(e: DragEvent, i: number, type: string) {
        if (!reorderMode.value) return
        dragSrcIndex.value = i
        dragType.value = type
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move'
            e.dataTransfer.setData('index', i.toString())
            e.dataTransfer.setData('type', type)
        }
    }

    function onDragOver(e: DragEvent, i: number, type: string) {
        if (!reorderMode.value || (dragType.value && dragType.value !== type)) return
        e.preventDefault()
        dragOverIndex.value = i
    }

    async function onDrop(e: DragEvent, targetIndex: number, type: string) {
        if (!reorderMode.value || (dragType.value && dragType.value !== type)) return
        e.preventDefault()

        const sourceIndex = parseInt(e.dataTransfer?.getData('index') || '-1')
        const sourceType = e.dataTransfer?.getData('type') || type

        if (sourceIndex === -1 || sourceIndex === targetIndex || sourceType !== type) {
            dragOverIndex.value = null
            return
        }

        await onReorder(type, sourceIndex, targetIndex)

        dragOverIndex.value = null
        dragSrcIndex.value = null
        dragType.value = ''
    }

    function onDragEnd() {
        dragOverIndex.value = null
        dragSrcIndex.value = null
        dragType.value = ''
    }

    return {
        dragType,
        dragSrcIndex,
        dragOverIndex,
        onDragStart,
        onDragOver,
        onDrop,
        onDragEnd
    }
}

```


---
## FILE: src/composables/useRolls.ts
```typescript
import type { Ref, ComputedRef } from 'vue'

export interface RollContext {
    attrTotal: (key: string) => number
    calcMod: (n: number) => number
    modStr: (n: number) => string
    totalCA: ComputedRef<number>
    totalTouch: ComputedRef<number>
    totalFlatFooted: ComputedRef<number>
    totalBAB: ComputedRef<number>
    meleeAtk: ComputedRef<number>
    rangedAtk: ComputedRef<number>
    grappleAtk: ComputedRef<number>
    totalHP: ComputedRef<number>
    totalInitiative: ComputedRef<number>
    totalFort: ComputedRef<number>
    totalRef: ComputedRef<number>
    totalWill: ComputedRef<number>
    d: ComputedRef<any>
    onRoll?: (label: string, displayFormula: string, evalFormula?: string) => void
    onDualRoll?: (label: string, atkDisplay: string, dmgDisplay: string, atkEval: string, dmgEval: string) => void
}

const FORMULA_RE = /@(\w+)/g

function sanitizeFormula(formula: string) {
    return formula
        .replace(/\+\s*\+/g, '+')
        .replace(/-\s*\+/g, '-')
        .replace(/\+\s*-/g, '-')
        .replace(/-\s*-/g, '+')
}

export function useRolls(ctx: RollContext) {

    function resolveFormula(text: string): string {
        if (!text) return ''
        return text.replace(FORMULA_RE, (_, token) => {
            if (['str', 'dex', 'con', 'int', 'wis', 'cha'].includes(token)) return String(ctx.attrTotal(token))
            if (['strMod', 'dexMod', 'conMod', 'intMod', 'wisMod', 'chaMod'].includes(token)) {
                return ctx.modStr(ctx.calcMod(ctx.attrTotal(token.replace('Mod', ''))))
            }
            if (token === 'CA') return String(ctx.totalCA.value)
            if (token === 'toque') return String(ctx.totalTouch.value)
            if (token === 'surpreso') return String(ctx.totalFlatFooted.value)
            if (token === 'BBA') return ctx.modStr(ctx.totalBAB.value)
            if (token === 'melee') return ctx.modStr(ctx.meleeAtk.value)
            if (token === 'ranged') return ctx.modStr(ctx.rangedAtk.value)
            if (token === 'grapple') return ctx.modStr(ctx.grappleAtk.value)
            if (token === 'level') return String(ctx.d.value?.level ?? 1)
            if (token === 'hp') return String(ctx.totalHP.value)
            if (token === 'iniciativa') return ctx.modStr(ctx.totalInitiative.value)
            if (token === 'fort') return ctx.modStr(ctx.totalFort.value)
            if (token === 'ref') return ctx.modStr(ctx.totalRef.value)
            if (token === 'will') return ctx.modStr(ctx.totalWill.value)
            return `@${token}`
        })
    }

    function handleRoll(label: string, formulaRaw: string, bonus?: number) {
        if (!ctx.onRoll) return
        let displayFormula = formulaRaw
        let evalFormula = resolveFormula(formulaRaw)

        if (bonus !== undefined && bonus !== null) {
            const bonusStr = Number(bonus) >= 0 ? `+${bonus}` : `${bonus}`
            displayFormula = `${formulaRaw} ${bonusStr}`
            evalFormula = `${evalFormula} ${bonusStr}`
        }

        evalFormula = sanitizeFormula(evalFormula)
        ctx.onRoll(label, displayFormula, evalFormula)
    }

    function handleItemRoll(item: any) {
        if (typeof item === 'string') return

        if (item.isAttack && ctx.onDualRoll && item.attackFormula && item.damageFormula) {
            let atkDisplay = item.attackFormula
            let dmgDisplay = item.damageFormula
            let atkEval = resolveFormula(atkDisplay)
            let dmgEval = resolveFormula(dmgDisplay)

            const bonus = Number(item.attackBonus) || 0
            if (bonus) {
                const bonusStr = bonus >= 0 ? `+${bonus}` : `${bonus}`
                atkDisplay = `${atkDisplay} ${bonusStr}`
                atkEval = `${atkEval} ${bonusStr}`
            }

            atkEval = sanitizeFormula(atkEval)
            dmgEval = sanitizeFormula(dmgEval)

            ctx.onDualRoll(item.title, atkDisplay, dmgDisplay, atkEval, dmgEval)
        } else {
            handleRoll(item.title, item.rollFormula || '1d20', Number(item.attackBonus) || 0)
        }
    }

    function sendSpellToChat(spell: any) {
        if (!ctx.onRoll) return
        const title = typeof spell === 'string' ? spell : spell.title
        const desc = typeof spell === 'string' ? '' : spell.description
        const formula = typeof spell === 'string' ? '' : spell.rollFormula

        let content = `**Magia: ${title}**`
        if (spell.school) content += ` (${spell.school})`
        content += `\n`
        if (spell.spellLevel !== undefined) content += `*Nível ${spell.spellLevel}*\n`
        if (spell.castingTime) content += `**Execução:** ${spell.castingTime} | `
        if (spell.range) content += `**Alcance:** ${spell.range}\n`
        if (spell.target) content += `**Alvo:** ${spell.target} | `
        if (spell.duration) content += `**Duração:** ${spell.duration}\n`
        if (spell.savingThrow) content += `**Resistência:** ${spell.savingThrow} | `
        if (spell.spellResist) content += `**RM:** ${spell.spellResist}\n`
        if (desc) content += `\n${resolveFormula(desc)}`

        if (formula) {
            handleRoll(title, formula)
        } else {
            ctx.onRoll(content, '', '')
        }
    }

    return { resolveFormula, handleRoll, handleItemRoll, sendSpellToChat }
}

```


---
## FILE: src/composables/useSheet.ts
```typescript
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Sheet, SheetData } from '@/types/sheet'
import { defaultBonuses } from '@/lib/sheetDefaults'

export function useSheet() {
    const sheet = ref<Sheet | null>(null)
    const loading = ref(false)
    const saving = ref(false)

    async function fetchSheet(id: string) {
        if (!id) return
        loading.value = true
        try {
            const { data, error } = await supabase.from('sheets').select('*').eq('id', id).maybeSingle()
            if (error) throw error

            if (!data) {
                console.warn('Ficha não encontrada no banco.')
                return
            }

            if (data) {
                if (!data.data.bonuses) data.data.bonuses = defaultBonuses()
                if (!data.data.feats) data.data.feats = []
                if (!data.data.spells) data.data.spells = []
                if (!data.data.equipment) data.data.equipment = []
                sheet.value = data
            }
        } catch (error) {
            console.error('Error fetching sheet:', error)
            throw error
        } finally {
            loading.value = false
        }
    }

    async function saveSheetMeta(id: string, meta: { name: string, class: string, level: number, race: string }) {
        if (!id) return
        saving.value = true
        try {
            const { error } = await supabase.from('sheets').update(meta).eq('id', id)
            if (error) throw error
        } finally {
            saving.value = false
        }
    }

    async function saveSheetData(id: string, data: SheetData) {
        if (!id) return
        saving.value = true
        try {
            const { error } = await supabase.from('sheets').update({ data }).eq('id', id)
            if (error) throw error
        } finally {
            saving.value = false
        }
    }

    return {
        sheet,
        loading,
        saving,
        fetchSheet,
        saveSheetMeta,
        saveSheetData
    }
}

```


---
## FILE: src/composables/useSheetEdit.ts
```typescript
import { ref, type Ref } from 'vue'
import type { Sheet, SheetData } from '@/types/sheet'
import { defaultBonuses } from '@/lib/sheetDefaults'

export function useSheetEdit(sheet: Ref<Sheet | null>, onSave: (data: SheetData) => Promise<void>) {
    const editedData = ref<SheetData | null>(null)
    const headEditMode = ref(false)
    const tabsEditMode = ref(false)

    function prepEditData() {
        if (!sheet.value) return
        const copy = JSON.parse(JSON.stringify(sheet.value.data))
        if (!copy.bonuses) copy.bonuses = defaultBonuses()
        if (!copy.feats) copy.feats = []
        if (!copy.spells) copy.spells = []
        if (!copy.shortcuts) copy.shortcuts = []
        if (copy.xp === undefined) copy.xp = 0
        if (!copy.buffs) copy.buffs = []
        if (!copy.hp_max) copy.hp_max = 0
        editedData.value = copy
    }

    async function saveEdit(spellSlotsMax?: any, spellSlotsUsed?: any) {
        if (!editedData.value || !sheet.value) return

        // Persist spell slots as part of sheet data
        if (spellSlotsMax) editedData.value.spellSlotsMax = { ...spellSlotsMax }
        if (spellSlotsUsed) editedData.value.spellSlotsUsed = { ...spellSlotsUsed }

        // Sync live-saved fields (HP, Recursos, Atalhos) back so they aren't overwritten
        if (sheet.value.data) {
            editedData.value.hp_current = sheet.value.data.hp_current ?? editedData.value.hp_current
            editedData.value.resources = sheet.value.data.resources ?? editedData.value.resources ?? []
            editedData.value.shortcuts = sheet.value.data.shortcuts ?? editedData.value.shortcuts ?? []
        }

        await onSave(editedData.value)

        sheet.value.data = editedData.value
        editedData.value = null
    }

    function toggleHeadEdit(onSaveTrigger?: () => Promise<void>) {
        if (!headEditMode.value) {
            prepEditData()
        } else {
            onSaveTrigger?.()
        }
        headEditMode.value = !headEditMode.value
    }

    function toggleTabsEdit(onSaveTrigger?: () => Promise<void>) {
        if (!tabsEditMode.value) {
            prepEditData()
            // Skill phase reset logic should be handled by the component using this
        } else {
            onSaveTrigger?.()
        }
        tabsEditMode.value = !tabsEditMode.value
    }

    return {
        editedData,
        headEditMode,
        tabsEditMode,
        toggleHeadEdit,
        toggleTabsEdit,
        saveEdit,
        prepEditData
    }
}

```


---
## FILE: src/composables/useSkills.ts
```typescript
import { ref, computed, type Ref, type ComputedRef } from 'vue'
import { SKILLS_DATA, CLASS_SKILLS, CLASS_SKILL_POINTS } from '@/data/dnd35'
import type { SheetData } from '@/types/sheet'

export function useSkills(
    d: ComputedRef<SheetData | null | undefined>,
    editedData: Ref<SheetData | null>,
    editMode: ComputedRef<boolean>,
    sheet: Ref<any>,
    calcMod: (n: number) => number,
    attrTotal: (key: string) => number,
    totalBonuses: ComputedRef<Record<string, number>>
) {
    const skillPhase = ref<'select' | 'allocate'>('select')
    const skillSearch = ref('')

    const baseClassSkills = computed(() => {
        const cls = (editMode.value ? editedData.value?.class : sheet.value?.class) || ''
        return CLASS_SKILLS[cls] || []
    })

    function isClassSkill(skillName: string) {
        const skills = baseClassSkills.value
        if (skills.includes(skillName)) return true
        if (skillName.startsWith('Conhecimento') && skills.includes('Conhecimento (Todos)')) return true
        if (skillName.startsWith('Ofícios') && skills.includes('Ofícios (Qualquer)')) return true
        if (skillName.startsWith('Profissão') && skills.includes('Profissão (Qualquer)')) return true
        const cls = (editMode.value ? editedData.value?.class : sheet.value?.class) || ''
        if (cls === 'Bardo' && skillName.startsWith('Conhecimento')) return true
        return false
    }

    const filteredSkillsList = computed(() => {
        const q = skillSearch.value.toLowerCase()
        return SKILLS_DATA.filter(s => !q || s.name.toLowerCase().includes(q))
    })

    const selectedSkillNames = computed(() => {
        if (!editedData.value?.skills) return new Set<string>()
        return new Set<string>(Object.keys(editedData.value.skills))
    })

    const allocatedSkills = computed(() => SKILLS_DATA.filter(s => selectedSkillNames.value.has(s.name)))

    function toggleSkillEdit(name: string) {
        if (!editedData.value) return
        const skills = { ...editedData.value.skills }
        if (name in skills) delete skills[name]
        else skills[name] = 0
        editedData.value.skills = skills
    }

    function skillAbilityMod(ability: string) { return calcMod(attrTotal(ability)) }

    function skillTotal(name: string, ability: string) {
        const diff = (editedData.value || d.value)?.skills?.[name] ?? 0
        return diff + skillAbilityMod(ability) + (totalBonuses.value[name] || 0)
    }

    function adjustRank(name: string, delta: 1 | -1) {
        if (!editedData.value) return
        const current = editedData.value.skills[name] ?? 0
        editedData.value.skills[name] = Math.max(0, current + delta)
    }

    function addLevelUpSkillPoints() {
        if (!editedData.value) return
        const cls = (editedData.value.class ?? '') as string
        const baseInt = Number(editedData.value.attributes?.int?.base ?? 10)
        const intModForSkills = calcMod(baseInt)
        const base = editedData.value.customSkillPoints || CLASS_SKILL_POINTS[cls] || 2
        const isHuman = (editedData.value.race ?? '').toLowerCase().includes('hmano') || (editedData.value.race ?? '').toLowerCase().includes('human')
        const basePerLevel = Math.max(1, base + intModForSkills)
        const earned = basePerLevel + (isHuman ? 1 : 0)
        editedData.value.skillPoints = (editedData.value.skillPoints || 0) + earned
        return earned
    }

    const skillPointsSpent = computed(() => {
        if (!editedData.value?.skills) return 0
        const skills = editedData.value.skills as Record<string, number>
        return Object.entries(skills).reduce((sum, [name, ranks]) => {
            const isClass = isClassSkill(name)
            const cost = isClass ? Number(ranks) : Number(ranks) * 2
            return sum + cost
        }, 0)
    })

    const activeSkills = computed(() => {
        if (!d.value?.skills) return []
        return Object.entries(d.value.skills)
            .map(([name, ranks]) => {
                const skill = SKILLS_DATA.find(s => s.name === name)
                return { name, ranks: ranks as number, ability: skill?.ability ?? 'int' }
            })
    })

    return {
        skillPhase,
        skillSearch,
        baseClassSkills,
        isClassSkill,
        filteredSkillsList,
        selectedSkillNames,
        allocatedSkills,
        toggleSkillEdit,
        skillAbilityMod,
        skillTotal,
        adjustRank,
        addLevelUpSkillPoints,
        skillPointsSpent,
        activeSkills
    }
}

```


---
## FILE: src/composables/useSpellSlots.ts
```typescript
import { ref, computed, watch, type Ref, type ComputedRef } from 'vue'

const SPELL_LEVELS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

export function useSpellSlots(sheet: Ref<any>) {
    const spellSlotsMax = ref<Record<number, number>>({})
    const spellSlotsUsed = ref<Record<number, number>>({})

    function initSpellSlots() {
        SPELL_LEVELS.forEach(lvl => {
            if (spellSlotsMax.value[lvl] === undefined) spellSlotsMax.value[lvl] = 0
            if (spellSlotsUsed.value[lvl] === undefined) spellSlotsUsed.value[lvl] = 0
        })
    }

    function adjustSlotUsed(level: number, delta: number) {
        const max = spellSlotsMax.value[level] ?? 0
        const cur = spellSlotsUsed.value[level] ?? 0
        spellSlotsUsed.value[level] = Math.max(0, Math.min(max, cur + delta))
    }

    function adjustSlotMax(level: number, delta: number) {
        const cur = spellSlotsMax.value[level] ?? 0
        spellSlotsMax.value[level] = Math.max(0, cur + delta)
        if ((spellSlotsUsed.value[level] ?? 0) > spellSlotsMax.value[level])
            spellSlotsUsed.value[level] = spellSlotsMax.value[level]
    }

    watch(() => (sheet as any).value?.data, (newData: any) => {
        if (newData) {
            spellSlotsMax.value = newData.spellSlotsMax ?? {}
            spellSlotsUsed.value = newData.spellSlotsUsed ?? {}
            initSpellSlots()
        }
    }, { immediate: true })

    return {
        SPELL_LEVELS,
        spellSlotsMax,
        spellSlotsUsed,
        initSpellSlots,
        adjustSlotUsed,
        adjustSlotMax
    }
}

```


---
## FILE: src/data/dnd35.ts
```typescript
export const SKILLS_DATA = [
    { name: 'Acrobacia', ability: 'dex', trainedOnly: true },
    { name: 'Adestrar Animais', ability: 'cha', trainedOnly: true },
    { name: 'Arte da Fuga', ability: 'dex', trainedOnly: false },
    { name: 'Atuação', ability: 'cha', trainedOnly: false },
    { name: 'Avaliação', ability: 'int', trainedOnly: false },
    { name: 'Blefar', ability: 'cha', trainedOnly: false },
    { name: 'Cavalgar', ability: 'dex', trainedOnly: false },
    { name: 'Concentração', ability: 'con', trainedOnly: false },
    { name: 'Conhecimento (Arcano)', ability: 'int', trainedOnly: true },
    { name: 'Conhecimento (Arquitetura e Engenharia)', ability: 'int', trainedOnly: true },
    { name: 'Conhecimento (Dungeons)', ability: 'int', trainedOnly: true },
    { name: 'Conhecimento (Geografia)', ability: 'int', trainedOnly: true },
    { name: 'Conhecimento (História)', ability: 'int', trainedOnly: true },
    { name: 'Conhecimento (Local)', ability: 'int', trainedOnly: true },
    { name: 'Conhecimento (Natureza)', ability: 'int', trainedOnly: true },
    { name: 'Conhecimento (Nobreza e Realeza)', ability: 'int', trainedOnly: true },
    { name: 'Conhecimento (Os Planos)', ability: 'int', trainedOnly: true },
    { name: 'Conhecimento (Religião)', ability: 'int', trainedOnly: true },
    { name: 'Cura', ability: 'wis', trainedOnly: false },
    { name: 'Decifrar Escrita', ability: 'int', trainedOnly: true },
    { name: 'Disfarces', ability: 'cha', trainedOnly: false },
    { name: 'Diplomacia', ability: 'cha', trainedOnly: false },
    { name: 'Equilíbrio', ability: 'dex', trainedOnly: false },
    { name: 'Escalar', ability: 'str', trainedOnly: false },
    { name: 'Esconder-se', ability: 'dex', trainedOnly: false },
    { name: 'Falsificação', ability: 'int', trainedOnly: false },
    { name: 'Furtividade', ability: 'dex', trainedOnly: false },
    { name: 'Identificar Magia', ability: 'int', trainedOnly: true },
    { name: 'Intimidação', ability: 'cha', trainedOnly: false },
    { name: 'Natação', ability: 'str', trainedOnly: false },
    { name: 'Obter Informação', ability: 'cha', trainedOnly: false },
    { name: 'Observar', ability: 'wis', trainedOnly: false },
    { name: 'Ofícios', ability: 'int', trainedOnly: false },
    { name: 'Operar Mecanismo', ability: 'int', trainedOnly: true },
    { name: 'Ouvir', ability: 'wis', trainedOnly: false },
    { name: 'Prestidigitação', ability: 'dex', trainedOnly: true },
    { name: 'Procurar', ability: 'int', trainedOnly: false },
    { name: 'Profissão', ability: 'wis', trainedOnly: true },
    { name: 'Saltar', ability: 'str', trainedOnly: false },
    { name: 'Sentir Motivação', ability: 'wis', trainedOnly: false },
    { name: 'Sobrevivência', ability: 'wis', trainedOnly: false },
    { name: 'Usar Cordas', ability: 'dex', trainedOnly: false },
    { name: 'Usar Instrumento Mágico', ability: 'cha', trainedOnly: true },
]

export const CLASS_SKILLS: Record<string, string[]> = {
    'Bárbaro': ['Escalar', 'Ofícios', 'Adestrar Animais', 'Intimidação', 'Saltar', 'Ouvir', 'Cavalgar', 'Sobrevivência', 'Natação'],
    'Bardo': ['Avaliação', 'Equilíbrio', 'Blefar', 'Escalar', 'Concentração', 'Ofícios', 'Decifrar Escrita', 'Diplomacia', 'Disfarces', 'Arte da Fuga', 'Obter Informação', 'Esconder-se', 'Saltar', 'Conhecimento (Arcano)', 'Ouvir', 'Furtividade', 'Atuação', 'Profissão', 'Sentir Motivação', 'Prestidigitação', 'Identificar Magia', 'Natação', 'Acrobacia', 'Usar Instrumento Mágico'],
    'Clérigo': ['Concentração', 'Ofícios', 'Diplomacia', 'Cura', 'Conhecimento (Arcano)', 'Conhecimento (Religião)', 'Profissão', 'Identificar Magia'],
    'Druida': ['Concentração', 'Ofícios', 'Diplomacia', 'Adestrar Animais', 'Cura', 'Conhecimento (Natureza)', 'Ouvir', 'Profissão', 'Cavalgar', 'Identificar Magia', 'Observar', 'Sobrevivência', 'Natação'],
    'Guerreiro': ['Escalar', 'Ofícios', 'Adestrar Animais', 'Intimidação', 'Saltar', 'Cavalgar', 'Natação'],
    'Monge': ['Equilíbrio', 'Escalar', 'Concentração', 'Ofícios', 'Diplomacia', 'Arte da Fuga', 'Esconder-se', 'Saltar', 'Conhecimento (Arcano)', 'Conhecimento (Religião)', 'Ouvir', 'Furtividade', 'Atuação', 'Profissão', 'Sentir Motivação', 'Observar', 'Natação', 'Acrobacia'],
    'Paladino': ['Concentração', 'Ofícios', 'Diplomacia', 'Adestrar Animais', 'Cura', 'Conhecimento (Religião)', 'Profissão', 'Cavalgar', 'Sentir Motivação'],
    'Ranger': ['Escalar', 'Concentração', 'Ofícios', 'Adestrar Animais', 'Cura', 'Esconder-se', 'Saltar', 'Conhecimento (Dungeons)', 'Conhecimento (Geografia)', 'Conhecimento (Natureza)', 'Ouvir', 'Furtividade', 'Profissão', 'Cavalgar', 'Procurar', 'Observar', 'Sobrevivência', 'Natação', 'Usar Cordas'],
    'Ladino': ['Avaliação', 'Equilíbrio', 'Blefar', 'Escalar', 'Ofícios', 'Decifrar Escrita', 'Diplomacia', 'Operar Mecanismo', 'Disfarces', 'Arte da Fuga', 'Falsificação', 'Obter Informação', 'Esconder-se', 'Intimidação', 'Saltar', 'Ouvir', 'Furtividade', 'Abrir Fechaduras', 'Atuação', 'Profissão', 'Procurar', 'Sentir Motivação', 'Prestidigitação', 'Observar', 'Natação', 'Acrobacia', 'Usar Instrumento Mágico', 'Usar Cordas'],
    'Feiticeiro': ['Blefar', 'Concentração', 'Ofícios', 'Conhecimento (Arcano)', 'Profissão', 'Identificar Magia'],
    'Mago': ['Concentração', 'Ofícios', 'Decifrar Escrita', 'Conhecimento (Arcano)', 'Conhecimento (Arquitetura e Engenharia)', 'Conhecimento (Dungeons)', 'Conhecimento (Geografia)', 'Conhecimento (História)', 'Conhecimento (Local)', 'Conhecimento (Natureza)', 'Conhecimento (Nobreza e Realeza)', 'Conhecimento (Religião)', 'Conhecimento (Os Planos)', 'Profissão', 'Identificar Magia'],
    'Bruxo': ['Blefar', 'Concentração', 'Ofícios', 'Disfarces', 'Intimidação', 'Saltar', 'Conhecimento (Arcano)', 'Conhecimento (Os Planos)', 'Conhecimento (Religião)', 'Profissão', 'Sentir Motivação', 'Identificar Magia', 'Usar Instrumento Mágico'],
    'Assassino': ['Acrobacia', 'Arte da Fuga', 'Blefar', 'Decifrar Escrita', 'Diplomacia', 'Disfarces', 'Equilíbrio', 'Esconder-se', 'Falsificação', 'Furtividade', 'Intimidação', 'Observar', 'Obter Informação', 'Ouvir', 'Prestidigitação', 'Procurar', 'Sentir Motivação', 'Usar Cordas', 'Usar Instrumento Mágico'],
    'Algoz': ['Adestrar Animais', 'Cavalgar', 'Concentração', 'Conhecimento (Religião)', 'Cura', 'Diplomacia', 'Esconder-se', 'Intimidação', 'Ofícios', 'Profissão'],
    'Defensor Anão': ['Adestrar Animais', 'Avaliação', 'Cavalgar', 'Ouvir', 'Sentir Motivação', 'Sobrevivência'],
    'Dançarino das Sombras': ['Acrobacia', 'Arte da Fuga', 'Atuação', 'Blefar', 'Decifrar Escrita', 'Diplomacia', 'Disfarces', 'Equilíbrio', 'Esconder-se', 'Furtividade', 'Observar', 'Ouvir', 'Prestidigitação', 'Procurar', 'Saltar', 'Usar Cordas'],
    'Mestre do Conhecimento': ['Concentração', 'Conhecimento (Todos)', 'Avaliação', 'Cura', 'Decifrar Escrita', 'Falsificação', 'Identificar Magia', 'Prestidigitação'],
    'Teurgo Místico': ['Concentração', 'Conhecimento (Arcano)', 'Conhecimento (Religião)', 'Decifrar Escrita', 'Identificar Magia']
}

export const CLASS_SKILL_POINTS: Record<string, number> = {
    'Bárbaro': 4,
    'Bardo': 6,
    'Clérigo': 2,
    'Druida': 4,
    'Guerreiro': 2,
    'Monge': 4,
    'Paladino': 2,
    'Ranger': 6,
    'Ladino': 8,
    'Feiticeiro': 2,
    'Mago': 2,
    'Bruxo': 2,
    'Assassino': 4,
    'Algoz': 2,
    'Defensor Anão': 2,
    'Dançarino das Sombras': 6,
    'Mestre do Conhecimento': 4,
    'Teurgo Místico': 2
}

export const CLASS_HIT_DICE: Record<string, number> = {
    'Bárbaro': 12,
    'Bardo': 6,
    'Clérigo': 8,
    'Druida': 8,
    'Guerreiro': 10,
    'Monge': 8,
    'Paladino': 10,
    'Ranger': 8,
    'Ladino': 6,
    'Feiticeiro': 4,
    'Mago': 4,
    'Bruxo': 6,
    'Assassino': 6,
    'Algoz': 10,
    'Defensor Anão': 12,
    'Dançarino das Sombras': 8,
    'Mestre do Conhecimento': 4,
    'Teurgo Místico': 4
}

export interface Feat {
    name: string
    description: string
    prerequisite?: string
}

export const FEATS_DATA: Feat[] = [
    { name: 'Acrobático', description: '+2 de bônus em testes de Acrobacia e Saltar.', prerequisite: '' },
    { name: 'Ágil', description: '+2 de bônus em testes de Equilíbrio e Arte da Fuga.', prerequisite: '' },
    { name: 'Prontidão', description: '+2 de bônus em testes de Ouvir e Observar.' },
    { name: 'Afinidade com Animais', description: '+2 de bônus em testes de Adestrar Animais e Cavalgar.' },
    { name: 'Usar Armadura (Leve)', description: 'Sem penalidade de armadura em jogadas de ataque.' },
    { name: 'Usar Armadura (Média)', description: 'Sem penalidade de armadura em jogadas de ataque.' },
    { name: 'Usar Armadura (Pesada)', description: 'Sem penalidade de armadura em jogadas de ataque.' },
    { name: 'Atlético', description: '+2 de bônus em testes de Escalar e Natação.' },
    { name: 'Lutar às Cegas', description: 'Jogue novamente chance de erro por camuflagem.' },
    { name: 'Magia em Combate', description: '+4 de bônus em testes de Concentração para conjurar defensivamente.' },
    { name: 'Especialização em Combate', description: 'Troque bônus de ataque por bônus na CA.' },
    { name: 'Reflexos de Combate', description: 'Ataques de oportunidade adicionais.' },
    { name: 'Dissimulado', description: '+2 de bônus em testes de Disfarces e Falsificação.' },
    { name: 'Mãos Rápidas', description: '+2 de bônus em testes de Prestidigitação e Usar Cordas.' },
    { name: 'Diligente', description: '+2 de bônus em testes de Avaliação e Decifrar Escrita.' },
    { name: 'Esquiva', description: '+1 de bônus de esquiva na CA contra um alvo selecionado.' },
    { name: 'Tolerância', description: '+4 de bônus em testes para resistir a dano não letal.' },
    { name: 'Grande Fortitude', description: '+2 de bônus em testes de Fortitude.' },
    { name: 'Iniciativa Aprimorada', description: '+4 de bônus em testes de iniciativa.' },
    { name: 'Ataque Desarmado Aprimorado', description: 'Considerado armado mesmo desarmado.' },
    { name: 'Investigador', description: '+2 de bônus em testes de Obter Informação e Procurar.' },
    { name: 'Vontade de Ferro', description: '+2 de bônus em testes de Vontade.' },
    { name: 'Reflexos Rápidos', description: '+2 de bônus em testes de Reflexos.' },
    { name: 'Aptidão Mágica', description: '+2 de bônus em testes de Identificar Magia e Usar Instrumento Mágico.' },
    { name: 'Negociador', description: '+2 de bônus em testes de Diplomacia e Sentir Motivação.' },
    { name: 'Dedos Ágeis', description: '+2 de bônus em testes de Operar Mecanismo e Abrir Fechaduras.' },
    { name: 'Persuasivo', description: '+2 de bônus em testes de Blefar e Intimidação.' },
    { name: 'Tiro Certeiro', description: '+1 de bônus em ataque e dano até 9m (30 pés).' },
    { name: 'Ataque Poderoso', description: 'Troque bônus de ataque por bônus de dano.' },
    { name: 'Tiro Preciso', description: 'Sem penalidade por atirar em combate corpo a corpo.' },
    { name: 'Saque Rápido', description: 'Sacar arma como ação livre.' },
    { name: 'Recarga Rápida', description: 'Recarregar besta mais rapidamente.' },
    { name: 'Correr', description: 'Correr 5x o deslocamento, +4 em Saltar com corrida.' },
    { name: 'Autossuficiente', description: '+2 de bônus em testes de Cura e Sobrevivência.' },
    { name: 'Foco em Perícia', description: '+3 de bônus em testes da perícia selecionada.' },
    { name: 'Sorrateiro', description: '+2 de bônus em testes de Esconder-se e Furtividade.' },
    { name: 'Vitalidade', description: '+3 pontos de vida.' },
    { name: 'Rastrear', description: 'Usar perícia Sobrevivência para rastrear.' },
    { name: 'Combater com Duas Armas', description: 'Reduz penalidades por lutar com duas armas.' },
    { name: 'Acuidade com Arma', description: 'Usar mod. de Des em vez de For nas jogadas de ataque com armas leves.' },
    { name: 'Foco em Arma', description: '+1 de bônus nas jogadas de ataque com a arma selecionada.' },
]

```


---
## FILE: src/data/sheetConstants.ts
```typescript
export const ATTR_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const
export const ATTR_LABELS: Record<string, string> = { str: 'FOR', dex: 'DES', con: 'CON', int: 'INT', wis: 'SAB', cha: 'CAR' }

export interface FieldDef { field: string; label: string }

export const MODIFIER_TARGETS = [
    { value: 'str', label: 'Força (@str)' },
    { value: 'dex', label: 'Destreza (@dex)' },
    { value: 'con', label: 'Constituição (@con)' },
    { value: 'int', label: 'Inteligência (@int)' },
    { value: 'wis', label: 'Sabedoria (@wis)' },
    { value: 'cha', label: 'Carisma (@cha)' },
    { value: 'CA', label: 'Classe de Armadura (@CA)' },
    { value: 'hp', label: 'Pontos de Vida (@hp)' },
    { value: 'bab', label: 'Bônus Base Ataque (@BBA)' },
    { value: 'fort', label: 'Fortitude (@fort)' },
    { value: 'ref', label: 'Reflexos (@ref)' },
    { value: 'will', label: 'Vontade (@will)' },
    { value: 'iniciativa', label: 'Iniciativa (@iniciativa)' },
    { value: 'speed', label: 'Deslocamento (@speed)' },
    { value: 'toque', label: 'CA de Toque' },
    { value: 'surpreso', label: 'CA Surpreso' },
    { value: 'melee', label: 'Ataque Corpo-a-Corpo' },
    { value: 'ranged', label: 'Ataque à Distância' },
    { value: 'grapple', label: 'Agarrar' },
]

export const CA_FIELDS: FieldDef[] = [
    { field: 'ca_armor', label: 'Armadura' },
    { field: 'ca_shield', label: 'Escudo' },
    { field: 'ca_natural', label: 'Natural' },
    { field: 'ca_deflect', label: 'Deflexão' },
]

export const SAVE_FIELDS: FieldDef[] = [
    { field: 'save_fort', label: 'Fortitude base' },
    { field: 'save_ref', label: 'Reflexo base' },
    { field: 'save_will', label: 'Vontade base' },
]

export const SAVE_BONUS_FIELDS: FieldDef[] = [
    { field: 'fort', label: 'Bônus Fort.' },
    { field: 'ref', label: 'Bônus Ref.' },
    { field: 'will', label: 'Bônus Von.' },
]

export const ELEM_FIELDS: FieldDef[] = [
    { field: 'fire', label: 'Fogo' },
    { field: 'cold', label: 'Frio' },
    { field: 'acid', label: 'Ácido' },
    { field: 'electricity', label: 'Eletric.' },
    { field: 'sonic', label: 'Sônico' },
    { field: 'force', label: 'Força' },
]

export const races = ['Personalizada', 'Humano', 'Anão', 'Elfo', 'Gnomo', 'Meio-Elfo', 'Meio-Orc', 'Halfling']
export const classes = ['Personalizada', 'Bárbaro', 'Bardo', 'Clérigo', 'Druida', 'Guerreiro', 'Monge', 'Paladino', 'Ranger', 'Ladino', 'Feiticeiro', 'Mago', 'Bruxo', 'Assassino', 'Algoz', 'Defensor Anão', 'Dançarino das Sombras', 'Mestre do Conhecimento', 'Teurgo Místico']
export const alignments = ['Leal e Bom', 'Neutro e Bom', 'Caótico e Bom', 'Leal e Neutro', 'Neutro', 'Caótico e Neutro', 'Leal e Mau', 'Neutro e Mau', 'Caótico e Mau']

```


---
## FILE: src/lib/sheetDefaults.ts
```typescript
import type { BonusData, SheetData } from '@/types/sheet'

export function defaultBonuses(): BonusData {
    return {
        attributes: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
        hp: 0,
        ca: 0,
        bab: 0,
        initiative: 0,
        speed: 0,
        saves: { fort: 0, ref: 0, will: 0 },
        resistances: { fire: 0, cold: 0, acid: 0, electricity: 0, sonic: 0, force: 0 },
        notes: '',
    }
}

export function defaultSheetData(): Partial<SheetData> {
    return {
        bonuses: defaultBonuses(),
        feats: [],
        spells: [],
        equipment: [],
        shortcuts: [],
        buffs: [],
        resources: [],
        skills: {},
        attributes: {
            str: { base: 10, temp: 0 },
            dex: { base: 10, temp: 0 },
            con: { base: 10, temp: 0 },
            int: { base: 10, temp: 0 },
            wis: { base: 10, temp: 0 },
            cha: { base: 10, temp: 0 },
        },
        hp_current: 10,
        hp_max: 10,
        level: 1,
        xp: 0,
    }
}

```


---
## FILE: src/lib/supabase.ts
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

```


---
## FILE: src/lib/useCampaignRolls.ts
```typescript
import { ref, type Ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { DiceRoller } from '@dice-roller/rpg-dice-roller'

export function useCampaignRolls(campaignId: string, memberName: Ref<string>, recipientId: Ref<string>) {
    const authStore = useAuthStore()
    const roller = new DiceRoller()
    const rolling = ref(false)

    function evaluateFormula(formula: string): { label: string; result: number; breakdown: string } {
        try {
            const rollResult = roller.roll(formula)
            const roll = Array.isArray(rollResult) ? rollResult[0] : rollResult
            if (!roll) throw new Error('Falha na rolagem')
            return {
                label: formula,
                result: roll.total,
                breakdown: roll.output.split(': ')[1] || roll.output
            }
        } catch (e) {
            console.error('Roll error:', e)
            return { label: formula, result: 0, breakdown: 'Erro na fórmula' }
        }
    }

    function modStr(n: number): string {
        return n >= 0 ? `+${n}` : `${n}`
    }

    async function sendRoll(label: string, displayFormula: string, evalFormula?: string) {
        if (rolling.value) return
        rolling.value = true

        const formulaToEvaluate = evalFormula || displayFormula
        const { result, breakdown } = evaluateFormula(formulaToEvaluate)

        const isWhisper = recipientId.value !== 'all'

        const payload: any = {
            label,
            formula: displayFormula,
            result,
            breakdown
        }

        if (isWhisper) {
            payload.is_roll = true
            payload.target_id = recipientId.value
        }

        const content = JSON.stringify(payload)

        const { error } = await supabase.from('messages').insert({
            campaign_id: campaignId,
            user_id: authStore.user?.id ?? null,
            sender_name: memberName.value,
            content,
            type: isWhisper ? 'whisper' : 'roll',
        })

        if (error) console.error('Error sending roll:', error)

        rolling.value = false
    }

    async function sendDualRoll(label: string, atkDisplay: string, dmgDisplay: string, atkEval?: string, dmgEval?: string) {
        if (rolling.value) return
        rolling.value = true

        const atkFormula = atkEval || atkDisplay
        const dmgFormula = dmgEval || dmgDisplay

        const atkResult = evaluateFormula(atkFormula)
        const dmgResult = evaluateFormula(dmgFormula)

        const isWhisper = recipientId.value !== 'all'

        const payload: any = {
            label,
            is_dual_roll: true,
            is_roll: true, // for whisper chat filter detection
            attack: {
                formula: atkDisplay,
                result: atkResult.result,
                breakdown: atkResult.breakdown
            },
            damage: {
                formula: dmgDisplay,
                result: dmgResult.result,
                breakdown: dmgResult.breakdown
            }
        }

        if (isWhisper) {
            payload.target_id = recipientId.value
        }

        const content = JSON.stringify(payload)

        const { error } = await supabase.from('messages').insert({
            campaign_id: campaignId,
            user_id: authStore.user?.id ?? null,
            sender_name: memberName.value,
            content,
            type: isWhisper ? 'whisper' : 'roll',
        })

        if (error) console.error('Error sending dual roll:', error)

        rolling.value = false
    }

    return {
        rolling,
        sendRoll,
        sendDualRoll,
        evaluateFormula,
        modStr
    }
}

```


---
## FILE: src/lib/utils.ts
```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

```


---
## FILE: src/main.ts
```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './style.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')

```


---
## FILE: src/router/index.ts
```typescript
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            redirect: '/login'
        },
        {
            path: '/login',
            name: 'login',
            component: () => import('../views/LoginView.vue')
        },
        {
            path: '/register',
            redirect: '/login'
        },
        {
            path: '/dashboard',
            name: 'dashboard',
            component: () => import('../views/DashboardView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/create',
            name: 'create',
            component: () => import('../views/CreateSheetView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/sheet/:id',
            name: 'sheet',
            component: () => import('../views/SheetView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/campaign/:id',
            name: 'campaign',
            component: () => import('../views/CampaignView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/design',
            name: 'design',
            component: () => import('../views/DesignSystemView.vue')
        }
    ]
})

router.beforeEach(async (to, _from) => {
    const authStore = useAuthStore()

    // Ensure auth state is initialized
    if (authStore.loading) {
        await authStore.initialize()
    }

    const isAuthenticated = !!authStore.user

    if (to.meta.requiresAuth && !isAuthenticated) {
        return '/login'
    } else if (to.name === 'login' && isAuthenticated) {
        return '/dashboard'
    }
})

export default router

```


---
## FILE: src/stores/auth.ts
```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'
import { useRouter } from 'vue-router'

export const useAuthStore = defineStore('auth', () => {
    const user = ref<User | null>(null)
    const session = ref<Session | null>(null)
    const loading = ref(true)
    const router = useRouter()

    async function initialize() {
        loading.value = true
        const { data } = await supabase.auth.getSession()
        session.value = data.session
        user.value = data.session?.user ?? null

        supabase.auth.onAuthStateChange((_event, _session) => {
            session.value = _session
            user.value = _session?.user ?? null
            if (!_session) {
                // Handle logout or session expiry if needed
            }
        })
        loading.value = false
    }

    async function signOut() {
        await supabase.auth.signOut()
        user.value = null
        session.value = null
        router.push('/')
    }

    return {
        user,
        session,
        loading,
        initialize,
        signOut
    }
})

```


---
## FILE: src/stores/wizardStore.ts
```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Attribute {
    base: number
    temp: number
}

export interface CharacterAttributes {
    str: Attribute
    dex: Attribute
    con: Attribute
    int: Attribute
    wis: Attribute
    cha: Attribute
}

export const useWizardStore = defineStore('wizard', () => {
    const currentStep = ref(1)
    const totalSteps = 5

    const character = ref({
        sheetType: 'Personagem',
        name: '',
        race: '',
        class: '',
        customHitDie: 8,
        customSkillPoints: 2,
        level: 1,
        avatar_url: '',
        attributes: {
            str: { base: 10, temp: 0 },
            dex: { base: 10, temp: 0 },
            con: { base: 10, temp: 0 },
            int: { base: 10, temp: 0 },
            wis: { base: 10, temp: 0 },
            cha: { base: 10, temp: 0 },
        } as CharacterAttributes,
        skills: {} as Record<string, number>,
        skillPoints: 0,
        feats: [] as string[],
        spells: [] as string[],
        equipment: [] as string[],
        bio: '',
        alignment: '',
        deity: '',
        size: 'Médio',
        hp_max: 0,
        bab: 0,
        speed: 9,
        save_fort: 0,
        save_ref: 0,
        save_will: 0,
        ca_armor: 0,
        ca_shield: 0,
        ca_natural: 0,
        ca_deflect: 0,
        initiative_misc: 0,
        age: '',
        gender: '',
        height: '',
        weight: '',
        eyes: '',
        hair: '',
        skin: '',
    })

    function nextStep() {
        if (currentStep.value < totalSteps) {
            currentStep.value++
        }
    }

    function prevStep() {
        if (currentStep.value > 1) {
            currentStep.value--
        }
    }

    function setStep(step: number) {
        if (step >= 1 && step <= totalSteps) {
            currentStep.value = step
        }
    }

    return {
        currentStep,
        totalSteps,
        character,
        nextStep,
        prevStep,
        setStep
    }
})

```


---
## FILE: src/style.css
```css
@import "tailwindcss";

/* =====================================================
   TAILWIND V4 THEME — Lumina Dark (Zinc + Gold)
   In v4, colors are defined here via @theme, NOT in
   tailwind.config.js. The JS config is ignored for colors.
   ===================================================== */

@theme {
  /* Fonts */
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-serif: "Merriweather", ui-serif, Georgia, serif;
  --font-mono: ui-monospace, "Cascadia Code", "Source Code Pro", monospace;

  /* Border Radius */
  --radius: 0.5rem;
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  /* Lumina Color Palette — Raw Values */
  --color-zinc-950: #09090b;
  --color-zinc-900: #18181b;
  --color-zinc-800: #27272a;
  --color-zinc-700: #3f3f46;
  --color-zinc-600: #52525b;
  --color-zinc-500: #71717a;
  --color-zinc-400: #a1a1aa;
  --color-zinc-300: #d4d4d8;
  --color-zinc-200: #e4e4e7;
  --color-zinc-100: #f4f4f5;
  --color-gold: #dfd4bd;
  --color-gold-dark: #c9be9e;

  /* Semantic Color Tokens mapped to Lumina palette */
  --color-background: var(--color-zinc-950);
  --color-foreground: var(--color-zinc-200);

  --color-card: var(--color-zinc-900);
  --color-card-foreground: var(--color-zinc-200);

  --color-popover: var(--color-zinc-900);
  --color-popover-foreground: var(--color-zinc-200);

  --color-primary: var(--color-gold);
  --color-primary-foreground: var(--color-zinc-950);

  --color-secondary: var(--color-zinc-800);
  --color-secondary-foreground: var(--color-zinc-200);

  --color-muted: var(--color-zinc-800);
  --color-muted-foreground: var(--color-zinc-500);

  --color-accent: var(--color-gold);
  --color-accent-foreground: var(--color-zinc-950);

  --color-destructive: #7f1d1d;
  --color-destructive-foreground: var(--color-zinc-100);

  --color-border: var(--color-zinc-800);
  --color-input: var(--color-zinc-800);
  --color-ring: var(--color-gold);
}

/* Base styles */
@layer base {
  * {
    border-color: var(--color-border);
    box-sizing: border-box;
  }

  body {
    background-color: var(--color-background);
    color: var(--color-foreground);
    font-family: var(--font-sans);
    font-feature-settings: "rlig" 1, "calt" 1;
    -webkit-font-smoothing: antialiased;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    font-family: var(--font-serif);
  }

  /* Custom Scrollbar Styles */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background: var(--color-zinc-800);
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: var(--color-zinc-700);
  }
}
```


---
## FILE: src/types/sheet.ts
```typescript
export interface Modifier {
    target: string
    value: number
}

export interface Attribute {
    base: number
    temp: number
}

export interface Attributes {
    str: Attribute
    dex: Attribute
    con: Attribute
    int: Attribute
    wis: Attribute
    cha: Attribute
    [key: string]: Attribute
}

export interface SkillItem {
    name: string
    ranks: number
    ability: string
}

export interface BonusData {
    attributes: Record<string, number>
    hp: number
    ca: number
    bab: number
    initiative: number
    speed: number
    saves: {
        fort: number
        ref: number
        will: number
    }
    resistances: {
        fire: number
        cold: number
        acid: number
        electricity: number
        sonic: number
        force: number
    }
    notes: string
}

export interface Feat {
    title: string
    description: string
    isAttack?: boolean
    modifiers?: Modifier[]
}

export interface Spell {
    title: string
    description: string
    rollFormula?: string
    school?: string
    spellLevel?: number
    castingTime?: string
    range?: string
    target?: string
    duration?: string
    savingThrow?: string
    spellResist?: string
    modifiers?: Modifier[]
}

export interface Equipment {
    title: string
    description: string
    equipped?: boolean
    weight?: number
    modifiers?: Modifier[]
}

export interface Shortcut {
    label?: string
    title?: string
    formula?: string
    rollFormula?: string
    attackFormula?: string
    attackBonus?: number | string
    isAttack?: boolean
    icon?: string
    modifiers?: Modifier[]
}

export interface Buff {
    title: string
    description: string
    active: boolean
    modifiers?: Modifier[]
}

export interface Resource {
    label?: string
    name?: string
    current: number
    max: number
}

export interface SheetData {
    hp_current: number
    hp_max: number
    xp: number
    level: number
    race: string
    class: string
    size: string
    sheetType: string
    attributes: Attributes
    bonuses: BonusData
    skills: Record<string, number>
    feats: Feat[]
    spells: Spell[]
    equipment: Equipment[]
    shortcuts: Shortcut[]
    buffs: Buff[]
    resources: Resource[]
    layout?: string[]
    resumeLayout?: string[]
    hiddenBlocks?: string[]
    spellSlotsMax?: Record<number, number>
    spellSlotsUsed?: Record<number, number>
    ca_armor?: number
    ca_shield?: number
    ca_natural?: number
    ca_deflect?: number
    save_fort?: number
    save_ref?: number
    save_will?: number
    initiative_misc?: number
    speed?: number
    customSkillPoints?: number
    customHitDie?: number
    skillPoints?: number
    [key: string]: any
}

export interface Sheet {
    id: string
    name: string
    class: string
    level: number
    race: string
    data: SheetData
    user_id?: string
    created_at?: string
}

```


---
## FILE: src/views/CampaignView.vue
```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { Copy, BookOpen, Scroll, FileText, LayoutTemplate } from 'lucide-vue-next'
import ChatSidebar from '@/components/campaign/ChatSidebar.vue'
import QuickNpcModal from '@/components/campaign/QuickNpcModal.vue'
import SheetView from '@/views/SheetView.vue'
import { useCampaignRolls } from '@/lib/useCampaignRolls'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import SheetSelectorModal from '@/components/campaign/SheetSelectorModal.vue'
import CampaignSettingsDropdown from '@/components/campaign/CampaignSettingsDropdown.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const campaignId = route.params.id as string
const campaign = ref<any>(null)
const members = ref<any[]>([])
const loading = ref(true)
const isDM = ref(false)
const showNpcModal = ref(false)
const showSheetSelector = ref(false)

// UI state
const showChat = ref(true)
const showNotes = ref(false) // For mobile view
const notepadContent = ref('')

// Sheet selector state
const mySheets = ref<any[]>([])
const selectedSheetId = ref<string>('none')
const myMemberId = ref<string>('')
const savingSheet = ref(false)
const sheetSaved = ref(false)

// Remove setting selectedSheetId from onMounted to prevent race conditions
onMounted(() => {
    const savedNote = localStorage.getItem(`notepad_${campaignId}_${authStore.user?.id}`)
    if (savedNote) {
        notepadContent.value = savedNote
    }
})

function saveNotepad() {
    localStorage.setItem(`notepad_${campaignId}_${authStore.user?.id}`, notepadContent.value)
}

const myCurrentSheetId = computed(() => {
    return selectedSheetId.value === 'none' ? null : selectedSheetId.value
})

const myMemberName = computed(() => {
    if (isDM.value) return 'Mestre'
    const activeSheet = mySheets.value.find(s => s.id === selectedSheetId.value)
    if (activeSheet) return activeSheet.name
    return authStore.user?.user_metadata?.name || 'Jogador'
})

const recipientId = ref('all')

const { sendRoll, sendDualRoll } = useCampaignRolls(campaignId, myMemberName, recipientId)

async function fetchCampaign() {
    loading.value = true

    const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single()

    if (campaignError) {
        console.error('Error fetching campaign:', campaignError)
        router.push('/dashboard')
        return
    }
    campaign.value = campaignData
    isDM.value = campaignData.dm_id === authStore.user?.id

    const { data: memberData } = await supabase
        .from('campaign_members')
        .select('*, sheets (id, name, class, level, data)')
        .eq('campaign_id', campaignId)

    if (memberData) {
        members.value = memberData
        const me = memberData.find((m: any) => m.user_id === authStore.user?.id)
        if (me) {
            myMemberId.value = me.id
            
            // Priority: LocalStorage > Database > 'none'
            const lastSheetId = localStorage.getItem(`last_sheet_${campaignId}_${authStore.user?.id}`)
            const dbSheetId = me.sheet_id
            
            if (lastSheetId && lastSheetId !== 'none') {
                selectedSheetId.value = lastSheetId
            } else if (dbSheetId) {
                selectedSheetId.value = dbSheetId
                // Keep localstorage synced
                localStorage.setItem(`last_sheet_${campaignId}_${authStore.user?.id}`, dbSheetId)
            } else {
                selectedSheetId.value = 'none'
            }
        }
    }

    loading.value = false
}

async function fetchMySheets() {
    // Busca as fichas atreladas rigorosamente a esta campanha
    const { data } = await supabase
        .from('sheets')
        .select('id, name, class, level, data, campaign_id')
        .eq('user_id', authStore.user?.id)
        .eq('campaign_id', campaignId)
        
    if (data) {
        mySheets.value = data
    }
}

function handleNpcSaved(sheetId: string) {
    showNpcModal.value = false
    fetchMySheets().then(() => {
        handleSheetSelected(sheetId)
    })
}

async function handleSheetSelected(sheetId: string) {
    if (!myMemberId.value) return
    savingSheet.value = true
    sheetSaved.value = false
    selectedSheetId.value = sheetId
    showSheetSelector.value = false // close modal

    const sheetIdToSave = sheetId === 'none' ? null : sheetId
    
    // Check if the sheet needs to be linked to this campaign first
    if (sheetIdToSave) {
        const sheet = mySheets.value.find(s => s.id === sheetIdToSave)
        if (sheet && sheet.campaign_id !== campaignId) {
             await supabase
                .from('sheets')
                .update({ campaign_id: campaignId })
                .eq('id', sheetIdToSave)
             sheet.campaign_id = campaignId // update locally
        }
    }

    // Set as active character in campaign
    const { error } = await supabase
        .from('campaign_members')
        .update({ sheet_id: sheetIdToSave })
        .eq('id', myMemberId.value)

    if (!error) {
        // Update local state
        const me = members.value.find(m => m.user_id === authStore.user?.id)
        if (me) me.sheet_id = sheetIdToSave

        localStorage.setItem(`last_sheet_${campaignId}_${authStore.user?.id}`, sheetIdToSave || 'none')

        sheetSaved.value = true
        setTimeout(() => { sheetSaved.value = false }, 2000)
    }
    savingSheet.value = false
}

function copyJoinCode() {
    if (campaign.value?.join_code) {
        navigator.clipboard.writeText(campaign.value.join_code)
    }
}

function leaveCampaign() {
    if (confirm('Sair da campanha?')) {
        router.push('/dashboard')
    }
}

onMounted(async () => {
    await fetchCampaign()
    await fetchMySheets()

    // Validate if the selected sheet still exists 
    // (User might have deleted it from the database manually)
    if (selectedSheetId.value !== 'none') {
        const stillExists = mySheets.value.some(s => s.id === selectedSheetId.value)
        if (!stillExists) {
            selectedSheetId.value = 'none'
            localStorage.setItem(`last_sheet_${campaignId}_${authStore.user?.id}`, 'none')
            // Optionally update the DB as well if we are the user
            if (myMemberId.value) {
                await supabase.from('campaign_members').update({ sheet_id: null }).eq('id', myMemberId.value)
            }
        }
    }
})
</script>

<template>
    <div class="flex h-screen bg-background text-foreground overflow-hidden">
        <!-- Main Content Area -->
        <main class="flex-1 flex flex-col min-w-0" :class="{ 'hidden lg:flex': showChat && !myCurrentSheetId }">

            <!-- Top Bar -->
            <header class="h-16 border-b border-border flex items-center justify-between px-4 sm:px-6 bg-zinc-950/50">
                <div class="flex items-center gap-2 sm:gap-3">
                    <Button variant="ghost" size="icon" @click="router.push('/dashboard')">
                        <Scroll class="w-5 h-5 text-muted-foreground" />
                    </Button>
                    <div v-if="campaign" class="flex-1 min-w-0">
                        <h1 class="font-serif font-bold text-lg sm:text-xl truncate max-w-[120px] sm:max-w-xs">{{ campaign.name }}</h1>
                    </div>
                    <div v-else class="h-6 w-24 sm:w-32 bg-zinc-800 animate-pulse rounded"></div>
                </div>

                <!-- Navigation Controls -->
                <div class="flex items-center gap-2 sm:gap-3">
                  
                    <!-- Switch Sheet Button -->
                    <div class="flex items-center gap-2">
                         <div v-if="sheetSaved" class="text-[10px] text-green-500 font-bold uppercase hidden sm:block">
                            Ativa
                         </div>
                         <Button @click="showSheetSelector = true" variant="outline" size="sm" class="h-8 group border-zinc-700 hover:bg-zinc-800 bg-zinc-900">
                             <LayoutTemplate class="w-4 h-4 mr-2 text-muted-foreground group-hover:text-primary transition-colors" />
                             <span class="text-xs">{{ selectedSheetId === 'none' ? 'Espectador' : 'Trocar Ficha' }}</span>
                         </Button>
                    </div>

                    <Button v-if="isDM" @click="showNpcModal = true" variant="outline" size="sm"
                        class="h-8 text-xs border-zinc-700 hover:bg-zinc-800 hidden md:inline-flex">
                        Criar NPC
                    </Button>

                    <div v-if="campaign && isDM"
                        class="hidden md:flex items-center gap-2 bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-800">
                        <span class="text-xs text-muted-foreground uppercase font-bold">Código:</span>
                        <code class="text-sm font-mono text-primary font-bold">{{ campaign.join_code }}</code>
                        <button @click="copyJoinCode" class="text-muted-foreground hover:text-foreground">
                            <Copy class="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <!-- Settings Dropdown -->
                    <CampaignSettingsDropdown 
                         v-model:show-chat="showChat"
                         v-model:show-notes="showNotes"
                         @leave="leaveCampaign"
                    />
                </div>
            </header>

            <!-- Workspace Setup: Notepad (Left) + Sheet (Center) -->
            <div class="flex-1 flex overflow-hidden relative">
                <div v-if="loading" class="absolute inset-0 z-10 bg-background/50 flex justify-center py-20 backdrop-blur-sm">
                    <div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>

                <!-- Notepad (Left Panel) -->
                <div v-show="showNotes" class="w-full lg:w-80 border-r border-border bg-zinc-950/30 flex flex-col absolute inset-0 z-20 lg:relative lg:z-0 lg:flex"
                     :class="showNotes ? 'flex' : 'hidden lg:flex'">
                    <div class="h-10 border-b border-border flex items-center justify-between px-4 bg-zinc-950/50 shrink-0">
                        <h2 class="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            <BookOpen class="w-3.5 h-3.5" /> Anotações Pessoais
                        </h2>
                        <Button variant="ghost" size="icon" class="h-6 w-6 lg:hidden" @click="showNotes = false">
                             <Copy class="w-3 h-3 rotate-45" /> <!-- X Icon replacement mapping trick -->
                        </Button>
                    </div>
                    <div class="flex-1 p-3">
                        <Textarea v-model="notepadContent" @input="saveNotepad"
                            placeholder="Anotações da campanha... Suas notas são salvas apenas para você."
                            class="w-full h-full resize-none border-none bg-transparent focus-visible:ring-0 p-1 text-sm text-zinc-300 placeholder:text-zinc-600 font-mono" />
                    </div>
                </div>

                <!-- Character Sheet (Center Panel) -->
                <div class="flex-1 overflow-y-auto bg-background px-0 sm:px-4 lg:px-8 py-0 sm:py-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent hover:scrollbar-thumb-zinc-700" 
                     :class="{ 'hidden lg:block': showNotes || (showChat && !myCurrentSheetId) }">
                    <div v-if="myCurrentSheetId" class="h-full">
                        <SheetView :sheet-id="myCurrentSheetId" is-embedded :on-roll="sendRoll"
                            :on-dual-roll="sendDualRoll" />
                    </div>
                    <div v-else class="flex flex-col items-center justify-center h-full text-center gap-4 p-8">
                        <FileText class="w-12 h-12 text-zinc-800" />
                        <h2 class="text-xl font-bold">Espectador</h2>
                        <p class="text-muted-foreground max-w-sm">Você está acompanhando a campanha sem uma ficha ativa. Use o botão no topo para selecionar ou criar uma ficha para rolar dados.</p>
                        <Button @click="showSheetSelector = true" class="mt-4">
                             Selecionar Ficha
                        </Button>
                    </div>
                </div>
            </div>
        </main>

        <!-- Chat Sidebar -->
        <ChatSidebar v-show="showChat" :campaign-id="campaignId" :member-name="myMemberName" :members="members" :dm-id="campaign?.dm_id"
            v-model:recipientId="recipientId" class="w-full lg:w-96 flex-shrink-0" :class="{ 'hidden lg:flex': !showChat }" />

        <!-- Modals -->
        <QuickNpcModal v-if="showNpcModal" @close="showNpcModal = false" @saved="handleNpcSaved" />
        <SheetSelectorModal v-model="showSheetSelector" :sheets="mySheets" :active-sheet-id="selectedSheetId" @select-sheet="handleSheetSelected" />
    </div>
</template>

```


---
## FILE: src/views/CreateSheetView.vue
```vue
<script setup lang="ts">
import { useWizardStore } from '@/stores/wizardStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import BasicInfoStep from '@/components/wizard/steps/BasicInfoStep.vue'
import AttributesStep from '@/components/wizard/steps/AttributesStep.vue'
import SkillsStep from '@/components/wizard/steps/SkillsStep.vue'
import CombatStatsStep from '@/components/wizard/steps/CombatStatsStep.vue'
import TypeStep from '@/components/wizard/steps/TypeStep.vue'
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-vue-next'

const store = useWizardStore()
const router = useRouter()
const route = useRoute()

const allSteps = [
  { id: 'type', label: 'Tipo', short: 'Tipo' },
  { id: 'info', label: 'Informações', short: 'Info' },
  { id: 'attrs', label: 'Atributos', short: 'Attrs' },
  { id: 'skills', label: 'Perícias', short: 'Perícias' },
  { id: 'combat', label: 'Combate', short: 'Combate' },
]

const visibleSteps = computed(() => allSteps)

// Auto-clamp step if type changes and shrinks available steps
watch(() => visibleSteps.value.length, (newLen) => {
  if (store.currentStep > newLen) {
    store.setStep(newLen)
  }
})

const currentStepLabel = computed(() => visibleSteps.value[store.currentStep - 1]?.label)
const isLast = computed(() => store.currentStep === visibleSteps.value.length)

function handleNext() {
  if (store.currentStep < visibleSteps.value.length) {
    store.setStep(store.currentStep + 1)
  }
}

function handlePrev() {
  if (store.currentStep > 1) {
    store.setStep(store.currentStep - 1)
  }
}

function handleCancel() {
  if (confirm('Tem certeza que deseja cancelar? O progresso será perdido.')) {
    const campaignId = route.query.campaignId
    if (campaignId) {
      router.push(`/campaign/${campaignId}`)
    } else {
      router.push('/dashboard')
    }
  }
}

async function handleFinish() {
  const { data: { user } } = await import('@/lib/supabase').then(m => m.supabase.auth.getUser())
  if (!user) {
    alert('Você precisa estar logado.')
    return
  }

  const campaignId = route.query.campaignId as string | undefined

  const { error } = await import('@/lib/supabase').then(m => m.supabase
    .from('sheets')
    .insert({
      user_id: user.id,
      campaign_id: campaignId || null,
      name: store.character.name,
      class: store.character.class,
      level: store.character.level,
      race: store.character.race,
      data: store.character
    }))

  if (error) {
    alert('Falha ao salvar: ' + error.message)
    return
  }

  if (campaignId) {
    router.push(`/campaign/${campaignId}`)
  } else {
    router.push('/dashboard')
  }
}
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <div class="max-w-4xl mx-auto px-4 py-8 space-y-8">

      <!-- Top header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-serif font-bold text-primary">Criar Personagem</h1>
          <p class="text-muted-foreground text-sm mt-1">
            Passo {{ store.currentStep }} de {{ visibleSteps.length }}: <span class="text-foreground font-medium">{{
              currentStepLabel }}</span>
          </p>
        </div>
        <Button variant="ghost" @click="handleCancel" class="text-muted-foreground hover:text-destructive">
          Cancelar
        </Button>
      </div>

      <!-- Stepper -->
      <div class="relative flex items-center justify-between">
        <!-- Progress line -->
        <div class="absolute inset-x-0 top-4 h-px bg-border -z-10"></div>
        <div class="absolute left-0 top-4 h-px bg-primary -z-10 transition-all duration-500"
          :style="{ width: `${((store.currentStep - 1) / (visibleSteps.length - 1)) * 100}%` }"></div>

        <button v-for="(step, i) in visibleSteps" :key="i" @click="store.setStep(i + 1)"
          class="flex flex-col items-center gap-2 cursor-pointer group">
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 bg-background transition-all duration-300"
            :class="[
              store.currentStep > i + 1
                ? 'border-primary bg-primary text-primary-foreground'
                : store.currentStep === i + 1
                  ? 'border-primary text-primary ring-4 ring-primary/20'
                  : 'border-border text-muted-foreground group-hover:border-primary/50'
            ]">
            <span v-if="store.currentStep > i + 1">✓</span>
            <span v-else>{{ i + 1 }}</span>
          </div>
          <span class="text-xs font-medium hidden sm:block transition-colors"
            :class="store.currentStep === i + 1 ? 'text-primary' : 'text-muted-foreground'">{{ step.short }}</span>
        </button>
      </div>

      <!-- Wizard Card -->
      <Card class="border-border shadow-lg">
        <CardHeader class="border-b border-border bg-card">
          <CardTitle class="font-serif text-primary">{{ currentStepLabel }}</CardTitle>
        </CardHeader>

        <CardContent class="p-6 min-h-[460px]">
          <Transition name="slide" mode="out-in">
            <div :key="visibleSteps[store.currentStep - 1]?.id || store.currentStep">
              <TypeStep v-if="visibleSteps[store.currentStep - 1]?.id === 'type'" />
              <BasicInfoStep v-else-if="visibleSteps[store.currentStep - 1]?.id === 'info'" />
              <AttributesStep v-else-if="visibleSteps[store.currentStep - 1]?.id === 'attrs'" />
              <SkillsStep v-else-if="visibleSteps[store.currentStep - 1]?.id === 'skills'" />
              <CombatStatsStep v-else-if="visibleSteps[store.currentStep - 1]?.id === 'combat'" />
            </div>
          </Transition>
        </CardContent>

        <CardFooter class="border-t border-border bg-card flex justify-between p-6">
          <Button variant="outline" @click="handlePrev" :disabled="store.currentStep === 1" class="gap-2">
            <ChevronLeft class="w-4 h-4" /> Anterior
          </Button>
          <div class="flex gap-2">
            <Button v-if="!isLast" @click="handleNext" class="gap-2">
              Próximo
              <ChevronRight class="w-4 h-4" />
            </Button>
            <Button v-else @click="handleFinish" class="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <CheckCircle class="w-4 h-4" /> Finalizar Ficha
            </Button>
          </div>
        </CardFooter>
      </Card>

    </div>
  </div>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(12px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(-12px);
}
</style>

```
