<script setup lang="ts">
import { computed } from 'vue'
import type { Sheet } from '@/types/sheet'

const props = defineProps<{
  sheet: Sheet
  d: any
  editMode: boolean
}>()

const emit = defineEmits<{
  (e: 'edit-core'): void
}>()

/** Imagem de capa (fundo do bloco) */
const coverUrl = computed(() => props.d?.cover_url || props.d?.coverUrl || props.d?.image || null)
/** Avatar do personagem (canto inferior esquerdo ou perfil) */
const avatarUrl = computed(() => props.d?.avatar_url || props.d?.avatarUrl || null)
</script>

<template>
  <div class="rounded-xl border border-border bg-card p-4 sm:p-5 mb-6 min-h-[160px] flex flex-col justify-center relative overflow-hidden shadow-2xl group">
    
    <!-- Background cover image -->
    <div v-if="coverUrl" class="absolute inset-0 z-0">
      <img :src="coverUrl" class="w-full h-full object-cover object-center opacity-50 transition-transform duration-1000 group-hover:scale-105" />
      <div class="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-card/20"></div>
      <div class="absolute inset-0 bg-card/30"></div>
    </div>
    <!-- Decorative glow fallback -->
    <div v-else class="absolute inset-0 bg-primary/5 blur-[60px] pointer-events-none z-0"></div>

    <!-- Content -->
    <div class="relative z-10 flex flex-col sm:flex-row justify-between items-center sm:items-center w-full gap-4 sm:gap-6">
      
      <!-- Left: Avatar + Info -->
      <div class="flex items-center gap-4 flex-1 min-w-0">
        <!-- Avatar -->
        <div class="shrink-0 w-16 h-16 rounded-xl border-2 border-border bg-muted overflow-hidden shadow-xl">
          <img v-if="avatarUrl" :src="avatarUrl" class="w-full h-full object-cover" />
          <div v-else class="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <span class="text-primary text-2xl font-serif font-black">{{ sheet.name?.charAt(0) || '?' }}</span>
          </div>
        </div>

        <!-- Text info -->
        <div class="flex flex-col text-left flex-1 min-w-0">
          <h1 class="text-3xl sm:text-4xl font-extrabold font-serif text-foreground leading-tight drop-shadow-lg mb-1.5 break-words">{{ sheet.name }}</h1>
          <div class="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs sm:text-sm text-foreground/70">
            <span class="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-sm border border-primary/20 backdrop-blur-md shadow-sm">{{ sheet.class }} {{ sheet.level }}</span>
            <span v-if="sheet.race" class="text-foreground font-semibold drop-shadow-md">{{ sheet.race }}</span>
            <template v-if="d?.alignment">
              <span class="text-muted-foreground">•</span>
              <span class="text-foreground/80 font-medium drop-shadow-md">{{ d.alignment }}</span>
            </template>
            <template v-if="d?.age">
              <span class="text-muted-foreground">•</span>
              <span class="text-foreground/80 drop-shadow-md">{{ d.age }} anos</span>
            </template>
            <div v-if="d?.xp !== undefined" class="flex items-center gap-1.5 bg-card/60 backdrop-blur-md border border-border/50 rounded-md px-2 py-0.5 shadow-inner">
              <span class="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">XP</span>
              <span class="text-xs font-black font-serif text-foreground">{{ d.xp }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Right: Edit button -->
      <div class="flex flex-col items-stretch sm:items-end w-full sm:w-auto mt-2 sm:mt-0 shrink-0">
        <button @click="emit('edit-core')" class="bg-muted/80 hover:bg-muted backdrop-blur-md text-foreground/70 border border-border rounded-md px-3 py-1.5 text-[10px] uppercase font-bold tracking-widest shadow-md transition-all whitespace-nowrap">
          Editar Frente da Ficha
        </button>
      </div>

    </div>
  </div>
</template>
