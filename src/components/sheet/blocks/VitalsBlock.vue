<script setup lang="ts">
import { Heart, Skull, Activity, ShieldPlus } from 'lucide-vue-next'
import type { Sheet } from '@/types/sheet'

const props = defineProps<{
  sheet: Sheet
  totalHP: number
  deathStatus: { label: string; color: string } | null
  onSaveHP: () => void
}>()



const percent = () => {
  const c = props.sheet.data.hp_current ?? 0
  const m = props.totalHP || 1
  return Math.max(0, Math.min(100, (c / m) * 100))
}

const hpColor = () => {
  const p = percent()
  if (p > 60) return '#22c55e'
  if (p > 30) return '#f59e0b'
  return '#ef4444'
}
</script>

<template>
  <div class="rounded-xl border border-zinc-800 bg-zinc-950/80 p-5 space-y-5 relative overflow-hidden shadow-lg">
    <!-- Decorative background glow -->
    <div class="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-10 pointer-events-none blur-3xl" :style="{ backgroundColor: hpColor() }"></div>

    <!-- Header -->
    <div class="flex items-center justify-between relative z-10">
      <div class="flex items-center gap-2">
        <Activity class="w-4 h-4 text-zinc-400" />
        <span class="text-xs font-bold uppercase tracking-widest text-zinc-400">Status Vital</span>
      </div>
      <div v-if="deathStatus"
        class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border animate-pulse"
        :class="deathStatus.color">
        <Skull class="w-3 h-3 inline mr-1" />{{ deathStatus.label }}
      </div>
      <div v-else :style="{ color: hpColor() }" class="text-[10px] font-bold tracking-widest uppercase flex items-center gap-1">
        <Heart class="w-3 h-3" :class="percent() < 30 ? 'animate-pulse' : ''" />
        <span>{{ percent().toFixed(0) }}%</span>
      </div>
    </div>

    <!-- HP Numbers and Bar -->
    <div class="space-y-3 relative z-10">
      <div class="flex items-end justify-between gap-4">
        <!-- Current HP -->
        <div class="flex-1">
          <div class="flex items-baseline gap-1">
            <input v-model.number="sheet.data.hp_current" @change="onSaveHP" type="number"
              class="w-16 sm:w-20 text-4xl sm:text-5xl font-black font-serif text-zinc-100 bg-transparent border-b-2 border-transparent hover:border-zinc-700 focus:border-zinc-400 focus:outline-none tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors" />
            <span class="text-2xl text-zinc-600 font-light">/</span>
            <span class="text-2xl font-bold text-zinc-400">{{ totalHP }}</span>
          </div>
          <div class="text-[10px] text-zinc-500 uppercase tracking-wider mt-1 ml-1 font-semibold">Pontos de Vida</div>
        </div>

        <!-- Temp HP -->
        <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-2.5 flex flex-col items-center justify-center min-w-[4.5rem] shadow-inner">
          <ShieldPlus class="w-4 h-4 text-zinc-500 mb-1" />
          <input v-model.number="sheet.data.hp_temp" @change="onSaveHP" type="number"
            class="w-full text-center text-lg font-black text-zinc-200 bg-transparent focus:outline-none tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder-zinc-700" placeholder="0" />
          <div class="text-[9px] text-zinc-600 uppercase tracking-widest font-bold">Temp</div>
        </div>
      </div>

      <!-- HP bar -->
      <div class="h-4 bg-zinc-900/80 rounded-full overflow-hidden border border-zinc-800 shadow-inner p-0.5">
        <div class="h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden"
          :style="{ width: percent() + '%', backgroundColor: hpColor() }">
          <div class="absolute inset-0 bg-white/20 w-full h-full transform -skew-x-12 -translate-x-full"></div>
        </div>
      </div>
    </div>
  </div>
</template>
