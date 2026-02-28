<template>
  <div class="flex flex-col h-full w-full bg-background overflow-hidden">

    <div class="flex-1 overflow-y-auto py-2 pr-1 custom-scrollbar relative">
      <div v-if="tree.length === 0" class="text-xs text-muted-foreground text-center p-4">
        Nenhuma anotação.<br>Crie uma nova nota ou pasta para começar.
      </div>
      
      <!-- Root drop zone top -->
      <div class="h-2 mx-2 transition-colors relative z-10 rounded-full"
           :class="isDropTop ? 'bg-primary' : 'bg-transparent hover:bg-muted'"
           @dragover.prevent="isDropTop = true"
           @dragleave.prevent="isDropTop = false"
           @drop="onDropTop" />

      <NotepadTreeItem
        v-for="node in tree"
        :key="node.item.id"
        :node="node"
        :depth="0"
        :active-note-id="activeNoteId"
        :expanded-folders="expandedFolders"
        @select="$emit('select', $event)"
        @toggle-folder="$emit('toggle-folder', $event)"
        @move="$emit('move', $event.itemId, $event.newParentId, $event.newIndex)"
        @rename="$emit('rename', $event.id, $event.newTitle)"
        @delete="$emit('delete', $event)"
        @create-note="$emit('create-note', $event)"
        @create-folder="$emit('create-folder', $event)"
      />
      
      <!-- Root drop zone bottom -->
      <div class="h-8 mx-2 mt-2 transition-colors rounded flex items-center justify-center text-xs text-muted-foreground border-2 border-dashed border-transparent relative z-10"
           :class="isDropBottom ? 'border-primary bg-primary/10 text-primary' : 'hover:border-border'"
           @dragover.prevent="isDropBottom = true"
           @dragleave.prevent="isDropBottom = false"
           @drop="onDropBottom">
        {{ isDropBottom ? 'Soltar na raiz' : '' }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import NotepadTreeItem from './NotepadTreeItem.vue'
import type { TreeNode } from './useNotepad'

const props = defineProps<{
  tree: TreeNode[]
  activeNoteId: string | null
  expandedFolders: Set<string>
}>()

const emit = defineEmits<{
  (e: 'select', id: string): void
  (e: 'toggle-folder', id: string): void
  (e: 'create-note', parentId: string | null): void
  (e: 'create-folder', parentId: string | null): void
  (e: 'rename', id: string, newTitle: string): void
  (e: 'delete', id: string): void
  (e: 'move', itemId: string, newParentId: string | null, newIndex: number): void
}>()

const isDropTop = ref(false)
const isDropBottom = ref(false)

function onDropTop(e: DragEvent) {
  isDropTop.value = false
  const draggedId = e.dataTransfer?.getData('text/plain')
  if (!draggedId) return
  emit('move', draggedId, null, 0)
}

function onDropBottom(e: DragEvent) {
  isDropBottom.value = false
  const draggedId = e.dataTransfer?.getData('text/plain')
  if (!draggedId) return
  emit('move', draggedId, null, props.tree.length)
}
</script>
