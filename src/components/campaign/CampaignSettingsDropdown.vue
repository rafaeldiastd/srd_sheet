<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Button } from '@/components/ui/button'
import { Settings, BookOpen, LogOut } from 'lucide-vue-next'

const props = defineProps<{
    showNotes: boolean
}>()

const emit = defineEmits(['update:showNotes', 'leave'])

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

function toggleMenu() {
    isOpen.value = !isOpen.value
}

function closeMenu() {
    isOpen.value = false
}

// Close on outside click
function handleClickOutside(event: MouseEvent) {
    if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
        closeMenu()
    }
}

onMounted(() => {
    document.addEventListener('mousedown', handleClickOutside)
})

onUnmounted(() => {
    document.removeEventListener('mousedown', handleClickOutside)
})


function handleNotesToggle() {
    emit('update:showNotes', !props.showNotes)
    closeMenu()
}

function handleLeave() {
    emit('leave')
    closeMenu()
}
</script>

<template>
    <div class="relative inline-block text-left" ref="dropdownRef">
        <Button variant="ghost" size="icon" @click="toggleMenu" class="text-muted-foreground hover:text-foreground">
            <Settings class="w-5 h-5" />
        </Button>

        <Transition
            enter-active-class="transition ease-out duration-100"
            enter-from-class="transform opacity-0 scale-95"
            enter-to-class="transform opacity-100 scale-100"
            leave-active-class="transition ease-in duration-75"
            leave-from-class="transform opacity-100 scale-100"
            leave-to-class="transform opacity-0 scale-95"
        >
            <div v-if="isOpen" class="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-card border border-border shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                <div class="py-1">
                    <div class="px-4 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Interface
                    </div>
                    
                    
                    <button @click="handleNotesToggle" class="w-full text-left px-4 py-2 text-sm text-foreground/80 hover:bg-muted hover:text-primary flex items-center gap-2">
                        <BookOpen class="w-4 h-4" :class="props.showNotes ? 'text-primary' : 'text-muted-foreground'" />
                        <span>{{ props.showNotes ? 'Ocultar Anotações' : 'Mostrar Anotações' }}</span>
                    </button>

                    <div class="h-px bg-accent my-1"></div>
                    
                    <button @click="handleLeave" class="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 hover:text-destructive flex items-center gap-2">
                        <LogOut class="w-4 h-4" />
                        <span>Sair da Campanha</span>
                    </button>
                </div>
            </div>
        </Transition>
    </div>
</template>
