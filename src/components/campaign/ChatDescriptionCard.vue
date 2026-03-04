<script setup lang="ts">
import { BookOpen } from 'lucide-vue-next'

const props = defineProps<{
    title: string
    description: string
}>()
</script>

<template>
    <div class="space-y-2">
        <div class="flex items-center gap-2 font-bold text-foreground/80">
            <BookOpen class="w-4 h-4 text-primary/70" />
            <span>{{ title }}</span>
        </div>
        
        <div class="text-xs text-muted-foreground leading-relaxed bg-black/20 p-2.5 rounded border border-border/50 italic whitespace-pre-wrap">
            {{ description }}
        </div>
    </div>
</template>
