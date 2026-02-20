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
