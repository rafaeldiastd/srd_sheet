<script setup lang="ts">
import { ref } from 'vue'
import { useWizardStore } from '@/stores/wizardStore'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Trash2 } from 'lucide-vue-next'

const store = useWizardStore()
const newItem = ref('')

function addItem() {
  if (newItem.value.trim()) {
    store.character.equipment.push(newItem.value.trim())
    newItem.value = ''
  }
}

function removeItem(index: number) {
  store.character.equipment.splice(index, 1)
}
</script>

<template>
  <div class="grid gap-6">
    <div class="grid gap-4">
      <Label class="text-lg font-semibold">Equipamento</Label>
      <div class="flex gap-2">
        <Input v-model="newItem" placeholder="Adicionar item..." @keyup.enter="addItem" />
        <Button @click="addItem">Adicionar</Button>
      </div>
      <div class="grid gap-2">
        <Card v-for="(item, index) in store.character.equipment" :key="index"
          class="p-3 flex justify-between items-center">
          <span>{{ item }}</span>
          <Button variant="ghost" size="icon" @click="removeItem(index)">
            <Trash2 class="h-4 w-4" />
          </Button>
        </Card>
      </div>
    </div>

    <div class="grid gap-4">
      <Label class="text-lg font-semibold">Biografia e Descrição</Label>
      <div class="grid gap-2">
        <Label htmlFor="bio">História</Label>
        <Textarea id="bio" v-model="store.character.bio" rows="5" />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="grid gap-2">
          <Label htmlFor="eyes">Olhos</Label>
          <Input id="eyes" v-model="store.character.eyes" />
        </div>
        <div class="grid gap-2">
          <Label htmlFor="hair">Cabelos</Label>
          <Input id="hair" v-model="store.character.hair" />
        </div>
        <div class="grid gap-2">
          <Label htmlFor="skin">Pele</Label>
          <Input id="skin" v-model="store.character.skin" />
        </div>
      </div>
    </div>
  </div>
</template>
