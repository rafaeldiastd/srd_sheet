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
  (e: 'edit-raw'): void
}>()

const imgUrl = computed(() => props.d?.avatarUrl || props.d?.image)
</script>

<template>
  <div class="rounded-xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5 mb-6 min-h-[160px] flex flex-col justify-center relative overflow-hidden shadow-2xl group">
    
    <!-- Background Image -->
    <div v-if="imgUrl" class="absolute inset-0 z-0">
      <img :src="imgUrl" class="w-full h-full object-cover object-center opacity-50 transition-transform duration-1000 group-hover:scale-105" />
      <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-zinc-950/20"></div>
      <div class="absolute inset-0 bg-zinc-950/30"></div>
    </div>
    
    <!-- Decorative background glow (fallback if no image) -->
    <div v-else class="absolute inset-0 bg-primary/5 blur-[60px] pointer-events-none z-0"></div>

    <!-- Info Content -->
    <div class="relative z-10 flex flex-col sm:flex-row justify-between items-center sm:items-center w-full gap-4 sm:gap-6">
      
      <!-- Left Side: Basic Info -->
      <div class="flex flex-col items-center sm:items-start text-center sm:text-left flex-1 min-w-0">
        <!-- Placeholder Avatar if no image -->
        <div v-if="!imgUrl" class="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-inner mb-2 lg:mb-0 lg:absolute lg:top-0 lg:left-0 lg:-translate-y-1/2 lg:-translate-x-1/2">
          <span class="text-zinc-600 text-2xl font-serif font-black">{{ sheet.name?.charAt(0) || '?' }}</span>
        </div>

        <h1 class="text-3xl sm:text-4xl font-extrabold font-serif text-white leading-tight drop-shadow-lg mb-2 break-words">{{ sheet.name }}</h1>
        
        <div class="flex flex-wrap items-center justify-center sm:justify-start gap-x-2 gap-y-2 text-xs sm:text-sm text-zinc-300">
          <span class="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-sm border border-primary/20 backdrop-blur-md shadow-sm">{{ sheet.class }} {{ sheet.level }}</span>
          <span v-if="sheet.race" class="text-zinc-100 font-semibold drop-shadow-md">{{ sheet.race }}</span>
          
          <template v-if="d?.alignment">
            <span class="text-zinc-500">•</span>
            <span class="text-zinc-300 font-medium drop-shadow-md">{{ d.alignment }}</span>
          </template>
          
          <template v-if="d?.age">
            <span class="text-zinc-500">•</span>
            <span class="text-zinc-300 drop-shadow-md">{{ d.age }} anos</span>
          </template>

          <div v-if="d?.xp !== undefined" class="flex items-center gap-1.5 bg-zinc-950/60 backdrop-blur-md border border-zinc-700/50 rounded-md px-2 py-0.5 shadow-inner sm:ml-2">
            <span class="text-[10px] uppercase font-bold tracking-widest text-zinc-400">XP</span>
            <span class="text-xs font-black font-serif text-white">{{ d.xp }}</span>
          </div>
        </div>
      </div>
      
      <!-- Right Side: Edit Buttons -->
      <div class="flex flex-col items-stretch sm:items-end w-full sm:w-auto gap-2 mt-2 sm:mt-0">
        <button @click="emit('edit-core')" class="w-full sm:w-auto bg-zinc-800/80 hover:bg-zinc-700 backdrop-blur-md text-zinc-200 border border-zinc-600 rounded-lg px-4 py-2 text-xs sm:text-sm font-bold shadow-lg transition-all whitespace-nowrap">
          Editar Dados Principais
        </button>
        <button @click="emit('edit-raw')" class="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary/20 hover:bg-primary/30 backdrop-blur-md border border-primary/40 rounded-lg px-4 py-2 text-xs sm:text-sm font-bold text-primary shadow-lg transition-all whitespace-nowrap">
          Editar Ficha Completa
        </button>
      </div>

    </div>
  </div>
</template>
