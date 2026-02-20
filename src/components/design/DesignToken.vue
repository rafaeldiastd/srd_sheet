<script setup lang="ts">

const props = defineProps<{
    name: string
    variable: string
    bgClass: string
    textClass?: string
}>()

// Helper to copy variable name to clipboard
const copyToClipboard = () => {
    navigator.clipboard.writeText(`var(--${props.variable})`)
}
</script>

<template>
    <div class="flex flex-col gap-2 group cursor-pointer" @click="copyToClipboard">
        <div class="h-24 w-full rounded-md border border-border shadow-sm transition-all group-hover:scale-105 group-hover:shadow-md relative overflow-hidden"
            :class="[bgClass, textClass || 'text-foreground']">
            <div
                class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/20 transition-opacity">
                <span class="text-xs font-mono font-bold text-white">Copy</span>
            </div>
        </div>
        <div class="flex flex-col">
            <span class="font-bold text-sm text-foreground">{{ name }}</span>
            <span class="text-xs text-muted-foreground font-mono">--{{ variable }}</span>
        </div>
    </div>
</template>
