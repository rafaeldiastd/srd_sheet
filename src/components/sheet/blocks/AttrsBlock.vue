<script setup lang="ts">
import { Dices } from 'lucide-vue-next'

const props = defineProps<{
  attrTotal: (key: string) => number
  calcMod: (n: number) => number
  modStr: (n: number) => string
  editMode: boolean
  editedData: any
  ATTR_KEYS: readonly string[]
  ATTR_LABELS: Record<string, string>
  onRoll: (label: string, formula: string) => void
  vertical?: boolean
}>()
</script>

<template>
  <!-- VERTICAL mode: narrow left column, attributes stacked -->
  <div v-if="vertical"
    class="rounded-xl border border-zinc-800 bg-zinc-950/80 h-full flex flex-col">

    <!-- Standard Header -->
    <div class="flex items-center gap-2 px-4 py-3 border-b border-zinc-800/50">
      <Dices class="w-4 h-4 text-zinc-400" />
      <span class="text-xs font-bold uppercase tracking-widest text-zinc-400">Atributos</span>
    </div>

    <!-- Stats stacked -->
    <div class="flex flex-col flex-1 p-2 gap-1 justify-evenly">
      <div
        v-for="key in ATTR_KEYS" :key="key"
        class="flex flex-col items-center justify-center cursor-pointer transition-all duration-200
               hover:bg-primary/5 hover:border-primary/20 border border-transparent rounded-lg active:scale-95 select-none py-3 px-2"
        @click="onRoll(ATTR_LABELS[key] || key.toUpperCase(), '1d20 + @' + key + 'Mod')"
      >
        <div class="text-[11px] font-black uppercase tracking-wider text-zinc-500 mb-1.5">{{ ATTR_LABELS[key] }}</div>

        <template v-if="editMode && editedData?.attributes?.[key]">
          <input v-model.number="editedData.attributes[key].base" type="number" min="1" max="30"
            class="w-14 text-center text-xl font-extrabold font-serif bg-transparent border-b border-zinc-600
                   focus:border-primary focus:outline-none tabular-nums
                   [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            @click.stop />
        </template>
        <div v-else class="text-3xl font-extrabold font-serif leading-none text-zinc-100">{{ attrTotal(key) }}</div>

        <div class="mt-1.5 text-xs font-bold text-zinc-400 bg-zinc-800/60 rounded px-2 py-0.5">
          {{ modStr(calcMod(attrTotal(key))) }}
        </div>
      </div>
    </div>
  </div>

  <!-- HORIZONTAL mode (default): original grid layout -->
  <div v-else class="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4">
    <div class="flex items-center gap-2 mb-3">
      <Dices class="w-4 h-4 text-primary" />
      <span class="text-xs font-bold uppercase tracking-widest text-zinc-400">Atributos</span>
    </div>

    <div class="grid grid-cols-3 sm:grid-cols-6 gap-2 items-stretch">
      <div
        v-for="key in ATTR_KEYS" :key="key"
        class="rounded-lg border border-zinc-700/50 bg-zinc-900/40 cursor-pointer transition-all duration-200
               hover:scale-105 hover:border-primary/50 hover:bg-primary/5 active:scale-95 select-none
               p-2 text-center text-zinc-200 flex flex-col items-center justify-center"
        @click="onRoll(ATTR_LABELS[key] || key.toUpperCase(), '1d20 + @' + key + 'Mod')"
      >
        <div class="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">{{ ATTR_LABELS[key] }}</div>

        <template v-if="editMode && editedData?.attributes?.[key]">
          <input v-model.number="editedData.attributes[key].base" type="number" min="1" max="30"
            class="w-full text-center text-xl font-extrabold font-serif bg-transparent border-b border-zinc-600
                   focus:border-primary focus:outline-none tabular-nums
                   [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            @click.stop />
        </template>
        <div v-else class="text-2xl font-extrabold font-serif leading-none text-zinc-100">{{ attrTotal(key) }}</div>

        <div class="mt-1.5 text-xs font-bold text-zinc-400 bg-zinc-800/60 rounded px-1.5 py-0.5 inline-block">
          {{ modStr(calcMod(attrTotal(key))) }}
        </div>
      </div>
    </div>
  </div>
</template>
