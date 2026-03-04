<script setup lang="ts">
import { computed, ref } from 'vue'
import { useWizardStore } from '@/stores/wizardStore'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { FEATS_DATA, type Feat } from '@/data/dnd35'

const store = useWizardStore()
const searchQuery = ref('')

const filteredFeats = computed<Feat[]>(() => {
  if (!searchQuery.value) return FEATS_DATA
  const lower = searchQuery.value.toLowerCase()
  return FEATS_DATA.filter(f =>
    f.name.toLowerCase().includes(lower) ||
    f.description.toLowerCase().includes(lower)
  )
})

function isFeatSelected(featName: string) {
  return store.character.feats.some(f => f.title === featName)
}

function toggleFeat(feat: Feat) {
  const index = store.character.feats.findIndex(f => f.title === feat.name)
  if (index === -1) {
    store.character.feats.push({
      title: feat.name,
      description: feat.description,
      requirements: feat.prerequisite
    })
  } else {
    store.character.feats.splice(index, 1)
  }
}

// Simple calculation for available feats (1 at level 1, +1 if Human, +1 at 3, 6, 9...)
// Fighter bonus feats etc are complex.
const maxFeats = computed(() => {
  let count = 1 + Math.floor(store.character.level / 3)
  if (store.character.level >= 3 && store.character.level % 3 !== 0) {
    // Logic for 3.5e is: 1st, 3rd, 6th, 9th... so 1 + level/3 is roughly correct if we start at 1.
    // 1: 1
    // 2: 1
    // 3: 2
    // 4: 2
    // 5: 2
    // 6: 3
  }

  if (store.character.race === 'Human') count++
  if (store.character.class === 'Fighter') {
    // Fighters get bonus feats at 1, 2, 4, 6, 8...
    if (store.character.level >= 1) count++
    if (store.character.level >= 2) count++
    if (store.character.level >= 4) count += Math.floor((store.character.level - 2) / 2) // Approximation
  }

  return count
})
</script>

<template>
  <div class="grid gap-6">
    <div class="flex justify-between items-center bg-muted p-4 rounded-lg">
      <div class="font-bold">
        Talentos Selecionados: {{ store.character.feats.length }} / {{ maxFeats }} (Aprox)
      </div>
      <div class="w-1/2">
        <Input v-model="searchQuery" placeholder="Buscar talentos..." />
      </div>
    </div>

    <div class="max-h-[500px] overflow-y-auto border rounded-md p-4 grid gap-2">
      <div v-for="feat in filteredFeats" :key="feat.name"
        class="flex items-start space-x-2 border-b pb-2 last:border-0 hover:bg-muted/10 transition-colors p-2 rounded">
        <Checkbox :id="feat.name" :checked="isFeatSelected(feat.name)"
          @update:checked="toggleFeat(feat)" />
        <div class="grid gap-1.5 leading-none">
          <Label :htmlFor="feat.name" class="font-bold cursor-pointer">
            {{ feat.name }}
          </Label>
          <p class="text-sm text-muted-foreground">
            {{ feat.description }}
          </p>
          <p v-if="feat.prerequisite" class="text-xs text-muted-foreground italic">
            Pré-req: {{ feat.prerequisite }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
