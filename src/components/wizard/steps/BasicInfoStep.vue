<script setup lang="ts">
import { useWizardStore } from '@/stores/wizardStore'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { computed } from 'vue'

const store = useWizardStore()

const races = ['Personalizada', 'Humano', 'Anão', 'Elfo', 'Gnomo', 'Meio-Elfo', 'Meio-Orc', 'Halfling']
const classes = ['Personalizada', 'Bárbaro', 'Bardo', 'Clérigo', 'Druida', 'Guerreiro', 'Monge', 'Paladino', 'Ranger', 'Ladino', 'Feiticeiro', 'Mago', 'Bruxo', 'Assassino', 'Algoz', 'Defensor Anão', 'Dançarino das Sombras', 'Mestre do Conhecimento', 'Teurgo Místico']
const alignments = ['Leal e Bom', 'Neutro e Bom', 'Caótico e Bom', 'Leal e Neutro', 'Neutro', 'Caótico e Neutro', 'Leal e Mau', 'Neutro e Mau', 'Caótico e Mau']
const sizes = ['Minúsculo', 'Diminuto', 'Mínimo', 'Pequeno', 'Médio', 'Grande', 'Enorme', 'Imenso', 'Colossal']

const raceSelect = computed({
  get: () => {
    if (!store.character.race) return 'Personalizada' // Return "Personalizada" instead of empty to keep it selected
    if (races.includes(store.character.race)) return store.character.race
    return 'Personalizada'
  },
  set: (val) => {
    store.character.race = val === 'Personalizada' ? '' : val
  }
})

const classSelect = computed({
  get: () => {
    if (!store.character.class) return 'Personalizada' // Return "Personalizada" instead of empty to keep it selected
    if (classes.includes(store.character.class)) return store.character.class
    return 'Personalizada'
  },
  set: (val) => {
    store.character.class = val === 'Personalizada' ? '' : val
  }
})
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
        <Select v-model="raceSelect">
          <SelectTrigger>
            <SelectValue placeholder="Selecione a raça" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="race in races" :key="race" :value="race">
              {{ race }}
            </SelectItem>
          </SelectContent>
        </Select>
        <Input v-if="raceSelect === 'Personalizada'" v-model="store.character.race"
          placeholder="Nome da raça personalizada" class="mt-1" />
      </div>

      <div class="grid gap-2">
        <Label>Classe</Label>
        <Select v-model="classSelect">
          <SelectTrigger>
            <SelectValue placeholder="Selecione a classe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="cls in classes" :key="cls" :value="cls">
              {{ cls }}
            </SelectItem>
          </SelectContent>
        </Select>
        <Input v-if="classSelect === 'Personalizada'" v-model="store.character.class"
          placeholder="Nome da classe personalizada" class="mt-1" />
      </div>

      <div class="grid gap-2">
        <Label htmlFor="level">Nível</Label>
        <Input id="level" type="number" v-model.number="store.character.level" min="1" max="20" />
      </div>
    </div>

    <div v-if="classSelect === 'Personalizada'"
      class="grid gap-4 md:grid-cols-2 bg-muted/30 p-4 border border-border rounded-lg">
      <div class="col-span-1 md:col-span-2 text-xs font-semibold text-muted-foreground uppercase">
        Configuração de Classe Personalizada
      </div>
      <div class="grid gap-2">
        <Label>Dado de Vida (d)</Label>
        <Input type="number" v-model.number="store.character.customHitDie" min="4" max="20" :placeholder="8" />
        <p class="text-[10px] text-muted-foreground">O dado rolado para ganhar pontos de vida a cada nível.</p>
      </div>
      <div class="grid gap-2">
        <Label>Perícias por Nível</Label>
        <Input type="number" v-model.number="store.character.customSkillPoints" min="2" :placeholder="2" />
        <p class="text-[10px] text-muted-foreground">Pontos base recebidos a cada nível antes do modificador de INT.</p>
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
