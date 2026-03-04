<script setup lang="ts">
import { HelpCircle } from 'lucide-vue-next'

defineProps<{
  text: string
}>()
</script>

<template>
  <div class="group relative inline-flex items-center ml-1.5 align-middle">
    <HelpCircle class="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors cursor-help" />
    <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[240px] px-3 py-2 bg-popover text-popover-foreground border border-border text-xs leading-normal rounded-xl shadow-xl opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 z-[9999] text-center normal-case font-normal whitespace-normal">
      {{ text }}
    </div>
  </div>
</template>
