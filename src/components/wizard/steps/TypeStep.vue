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
