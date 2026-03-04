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
                border: 'border-red-900/20 bg-red-950/10',
                title: 'text-red-400/80',
                formula: 'text-red-500/40',
                breakdown: 'text-red-400/60',
                result: 'text-red-400'
            }
        case 'fuchsia':
            return {
                border: 'border-fuchsia-900/20 bg-fuchsia-950/10',
                title: 'text-fuchsia-400/80',
                formula: 'text-fuchsia-500/40',
                breakdown: 'text-fuchsia-400/60',
                result: 'text-fuchsia-300'
            }
        case 'emerald':
            return {
                border: 'border-emerald-900/20 bg-emerald-950/10',
                title: 'text-emerald-400/80',
                formula: 'text-emerald-500/40',
                breakdown: 'text-emerald-400/60',
                result: 'text-emerald-400'
            }
        case 'blue':
            return {
                border: 'border-blue-900/20 bg-blue-950/10',
                title: 'text-blue-400/80',
                formula: 'text-blue-500/40',
                breakdown: 'text-blue-400/60',
                result: 'text-blue-400'
            }
        case 'amber':
        default:
            return {
                border: 'border-border bg-card/40',
                title: 'text-muted-foreground',
                formula: 'text-muted-foreground/60',
                breakdown: 'text-muted-foreground',
                result: 'text-foreground'
            }
    }
})
</script>

<template>
    <div class="flex flex-col gap-1 p-2 rounded border relative mt-2 group/card" :class="colorClasses.border">
        <div v-if="title"
            class="absolute -top-2 left-2 text-[8px] bg-muted px-1 rounded-sm uppercase tracking-wider font-bold"
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
