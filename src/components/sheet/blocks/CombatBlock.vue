<script setup lang="ts">
import { Shield, Swords, Wind, Zap, RefreshCw } from 'lucide-vue-next'

const props = defineProps<{
  modStr: (n: number) => string
  totalCA: number
  totalTouch: number
  totalFlatFooted: number
  totalBAB: number
  totalInitiative: number
  totalSpeed: number
  meleeAtk: number
  rangedAtk: number
  grappleAtk: number
  totalFort: number
  totalRef: number
  totalWill: number
  onRoll: (label: string, formula: string) => void
  hideSaves?: boolean
}>()

const stats = () => [
  {
    label: 'CA', value: props.totalCA, icon: Shield,
    sub: `T:${props.totalTouch} | S:${props.totalFlatFooted}`,
    roll: null,
  },
  {
    label: 'BBA', value: props.modStr(props.totalBAB), icon: Swords,
    roll: () => props.onRoll('BBA', '1d20 + @BBA'),
  },
  {
    label: 'Iniciativa', value: props.modStr(props.totalInitiative), icon: Zap,
    roll: () => props.onRoll('Iniciativa', '1d20 + @iniciativa'),
  },
  {
    label: 'Velocidade', value: `${props.totalSpeed}m`, icon: Wind, roll: null,
  },
  {
    label: 'C.C.', value: props.modStr(props.meleeAtk), icon: Swords,
    roll: () => props.onRoll('Corpo-a-Corpo', '1d20 + @melee'),
  },
  {
    label: 'Distância', value: props.modStr(props.rangedAtk), icon: Wind,
    roll: () => props.onRoll('Distância', '1d20 + @ranged'),
  },
  {
    label: 'Agarrar', value: props.modStr(props.grappleAtk), icon: RefreshCw,
    roll: () => props.onRoll('Agarrar', '1d20 + @grapple'),
  },
]
</script>

<template>
  <div class="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4">
    <div class="flex items-center gap-2 mb-3">
      <Shield class="w-4 h-4 text-zinc-400" />
      <span class="text-xs font-bold uppercase tracking-widest text-zinc-400">Combate</span>
    </div>

    <!-- Main stats row -->
    <div class="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-3 items-stretch">
      <div
        v-for="stat in stats()" :key="stat.label"
        class="rounded-lg border border-zinc-800 bg-zinc-900/60 p-2 text-center transition-all duration-200 select-none flex flex-col items-center justify-center"
        :class="stat.roll ? 'cursor-pointer hover:border-primary/50 hover:bg-primary/5 active:scale-95' : ''"
        @click="stat.roll?.()"
      >
        <component :is="stat.icon" class="w-3.5 h-3.5 mx-auto mb-1 text-zinc-500" />
        <div class="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">{{ stat.label }}</div>
        <div class="text-lg font-extrabold font-serif text-zinc-100">{{ stat.value }}</div>
        <div v-if="stat.sub" class="text-[9px] text-zinc-600 mt-0.5">{{ stat.sub }}</div>
      </div>
    </div>

    <!-- Saves -->
    <div v-if="!hideSaves" class="grid grid-cols-3 gap-2 items-stretch">
      <button @click="onRoll('Fortitude', '1d20 + @fort')"
        class="rounded-lg bg-zinc-900/60 border border-zinc-800 px-2 py-1.5 hover:border-primary/40 hover:bg-primary/5 transition-colors flex flex-col items-center justify-center">
        <div class="text-[10px] text-zinc-500 font-bold uppercase mb-0.5">Fortitude</div>
        <div class="text-base font-extrabold font-serif text-zinc-100">{{ modStr(totalFort) }}</div>
      </button>
      <button @click="onRoll('Reflexos', '1d20 + @ref')"
        class="rounded-lg bg-zinc-900/60 border border-zinc-800 px-2 py-1.5 hover:border-primary/40 hover:bg-primary/5 transition-colors flex flex-col items-center justify-center">
        <div class="text-[10px] text-zinc-500 font-bold uppercase mb-0.5">Reflexos</div>
        <div class="text-base font-extrabold font-serif text-zinc-100">{{ modStr(totalRef) }}</div>
      </button>
      <button @click="onRoll('Vontade', '1d20 + @will')"
        class="rounded-lg bg-zinc-900/60 border border-zinc-800 px-2 py-1.5 hover:border-primary/40 hover:bg-primary/5 transition-colors flex flex-col items-center justify-center">
        <div class="text-[10px] text-zinc-500 font-bold uppercase mb-0.5">Vontade</div>
        <div class="text-base font-extrabold font-serif text-zinc-100">{{ modStr(totalWill) }}</div>
      </button>
    </div>
  </div>
</template>
