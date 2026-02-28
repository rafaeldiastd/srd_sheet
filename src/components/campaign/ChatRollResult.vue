<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
    title?: string
    formula: string
    breakdown: string
    result: number
    colorScheme?: 'amber' | 'red' | 'fuchsia' | 'emerald' | 'blue'
}>()

const colorClasses = computed(() => {
    switch (props.colorScheme) {
        case 'red':
            return {
                border: 'border-red-900/30',
                title: 'text-red-500/70',
                formula: 'text-red-500/50',
                breakdown: 'text-red-500/80',
                result: 'text-red-400'
            }
        case 'fuchsia':
            return {
                border: 'border-fuchsia-900/30',
                title: 'text-fuchsia-500/70',
                formula: 'text-fuchsia-500/60',
                breakdown: 'text-fuchsia-500/90',
                result: 'text-fuchsia-300'
            }
        case 'emerald':
            return {
                border: 'border-emerald-900/30',
                title: 'text-emerald-500/70',
                formula: 'text-emerald-500/50',
                breakdown: 'text-emerald-500/80',
                result: 'text-emerald-400'
            }
        case 'blue':
            return {
                border: 'border-blue-900/30',
                title: 'text-blue-500/70',
                formula: 'text-blue-500/50',
                breakdown: 'text-blue-500/80',
                result: 'text-blue-400'
            }
        case 'amber':
        default:
            return {
                border: 'border-amber-900/30',
                title: 'text-amber-500/70',
                formula: 'text-amber-500/50',
                breakdown: 'text-amber-500/80',
                result: 'text-amber-300'
            }
    }
})
</script>

<template>
    <div class="flex flex-col gap-1 bg-black/20 p-2 rounded border relative mt-1" :class="colorClasses.border">
        <div v-if="title"
            class="absolute -top-2 left-2 text-[8px] bg-zinc-900 px-1 rounded-sm uppercase tracking-wider font-bold"
            :class="colorClasses.title">
            {{ title }}
        </div>
        <div class="flex items-center justify-between text-xs mt-1">
            <span class="font-mono text-left flex-1" :class="colorClasses.formula" :title="formula">{{ formula || '?' }}</span>
            <span class="font-mono text-right break-words max-w-[150px] leading-tight" :class="colorClasses.breakdown">{{ breakdown }}</span>
        </div>
        <div class="text-3xl font-black text-center tracking-tighter mt-1" :class="colorClasses.result">
            {{ result }}
        </div>
    </div>
</template>
