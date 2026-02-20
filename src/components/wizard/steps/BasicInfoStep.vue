<script setup lang="ts">
import { useWizardStore } from '@/stores/wizardStore'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const store = useWizardStore()

const races = ['Humano', 'Anão', 'Elfo', 'Gnomo', 'Meio-Elfo', 'Meio-Orc', 'Halfling']
const classes = ['Bárbaro', 'Bardo', 'Clérigo', 'Druida', 'Guerreiro', 'Monge', 'Paladino', 'Ranger', 'Ladino', 'Feiticeiro', 'Mago']
const alignments = ['Leal e Bom', 'Neutro e Bom', 'Caótico e Bom', 'Leal e Neutro', 'Neutro', 'Caótico e Neutro', 'Leal e Mau', 'Neutro e Mau', 'Caótico e Mau']
const sizes = ['Minúsculo', 'Diminuto', 'Mínimo', 'Pequeno', 'Médio', 'Grande', 'Enorme', 'Imenso', 'Colossal']
</script>

<template>
  <div class="grid gap-6">
    <div class="grid gap-4 md:grid-cols-2">
      <div class="grid gap-2">
        <Label htmlFor="name">Nome do Personagem</Label>
        <Input id="name" v-model="store.character.name" placeholder="Nome do personagem" />
      </div>
      <div class="grid gap-2">
        <Label htmlFor="player">Nome do Jogador</Label>
        <Input id="player" placeholder="Seu nome" />
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <div class="grid gap-2">
        <Label>Raça</Label>
        <Select v-model="store.character.race">
          <SelectTrigger>
            <SelectValue placeholder="Selecione a raça" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="race in races" :key="race" :value="race">
              {{ race }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="grid gap-2">
        <Label>Classe</Label>
        <Select v-model="store.character.class">
          <SelectTrigger>
            <SelectValue placeholder="Selecione a classe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="cls in classes" :key="cls" :value="cls">
              {{ cls }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="grid gap-2">
        <Label htmlFor="level">Nível</Label>
        <Input id="level" type="number" v-model.number="store.character.level" min="1" max="20" />
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <div class="grid gap-2">
        <Label>Tendência</Label>
        <Select v-model="store.character.alignment">
          <SelectTrigger>
            <SelectValue placeholder="Selecione a tendência" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="align in alignments" :key="align" :value="align">
              {{ align }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="grid gap-2">
        <Label>Tamanho</Label>
        <Select v-model="store.character.size">
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tamanho" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="size in sizes" :key="size" :value="size">
              {{ size }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="grid gap-2">
        <Label htmlFor="age">Idade</Label>
        <Input id="age" v-model="store.character.age" placeholder="Idade" />
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-4">
      <div class="grid gap-2">
        <Label htmlFor="gender">Gênero</Label>
        <Input id="gender" v-model="store.character.gender" placeholder="Gênero" />
      </div>
      <div class="grid gap-2">
        <Label htmlFor="height">Altura</Label>
        <Input id="height" v-model="store.character.height" placeholder="Altura" />
      </div>
      <div class="grid gap-2">
        <Label htmlFor="weight">Peso</Label>
        <Input id="weight" v-model="store.character.weight" placeholder="Peso" />
      </div>
      <div class="grid gap-2">
        <Label htmlFor="deity">Divindade</Label>
        <Input id="deity" v-model="store.character.deity" placeholder="Divindade" />
      </div>
    </div>

    <div class="grid gap-2">
      <Label htmlFor="avatar_url">Imagem do Personagem (URL)</Label>
      <Input id="avatar_url" v-model="store.character.avatar_url"
        placeholder="https://... (opcional, aparece no card do dashboard)" />
      <div v-if="store.character.avatar_url" class="mt-2">
        <img :src="store.character.avatar_url" alt="Prévia"
          class="h-32 w-24 object-cover rounded-lg border border-border"
          @error="(e: Event) => (e.target as HTMLImageElement).style.display = 'none'" />
      </div>
    </div>
  </div>
</template>
