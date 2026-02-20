<script setup lang="ts">
import { useWizardStore } from '@/stores/wizardStore'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const store = useWizardStore()

const attributes = [
  { key: 'str', label: 'Força' },
  { key: 'dex', label: 'Destreza' },
  { key: 'con', label: 'Constituição' },
  { key: 'int', label: 'Inteligência' },
  { key: 'wis', label: 'Sabedoria' },
  { key: 'cha', label: 'Carisma' },
] as const

function calculateModifier(score: number) {
  return Math.floor((score - 10) / 2)
}

function getModifierString(score: number) {
  const mod = calculateModifier(score)
  return mod >= 0 ? `+${mod}` : `${mod}`
}
</script>

<template>
  <div class="grid gap-6">
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div v-for="attr in attributes" :key="attr.key" class="border rounded-lg p-4 bg-muted/20">
        <label class="block text-center font-bold mb-2">{{ attr.label }}</label>

        <div class="grid grid-cols-2 gap-4">
          <div class="grid gap-1">
            <Label class="text-xs text-center">Valor Base</Label>
            <Input type="number" v-model.number="store.character.attributes[attr.key].base" class="text-center" />
          </div>
          <div class="grid gap-1">
            <Label class="text-xs text-center">Temp</Label>
            <Input type="number" v-model.number="store.character.attributes[attr.key].temp" class="text-center" />
          </div>
        </div>

        <div class="mt-4 flex justify-between items-center border-t pt-2">
          <span class="text-sm font-semibold">Modificador:</span>
          <span class="text-lg font-bold">
            {{ getModifierString(store.character.attributes[attr.key].base + (store.character.attributes[attr.key].temp
            || 0)) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
