<template>
  <div
    :draggable="true"
    @dragstart.stop="onDragStart"
    @dragover.prevent.stop="onDragOver"
    @dragleave.prevent.stop="onDragLeave"
    @drop.stop="onDrop"
    :class="[
      'select-none',
      { 'bg-primary/10 border-r-2 border-primary': isActive },
      { 'border-l-2 border-primary bg-primary/5': isDragOver && node.item.is_folder }
    ]"
  >
    <div class="flex items-center gap-1.5 px-2 py-1.5 cursor-pointer hover:bg-muted/50 rounded group relative"
         :style="{ paddingLeft: `${depth * 16 + 8}px` }"
         @click="handleClick"
         @dblclick="startRename"
         @contextmenu.prevent>
      
      <ChevronRight v-if="node.item.is_folder" 
        class="w-3.5 h-3.5 text-muted-foreground transition-transform shrink-0" 
        :class="{ 'rotate-90': isExpanded }" />
      <span v-else class="w-3.5 shrink-0" />
      
      <FolderOpen v-if="node.item.is_folder && isExpanded" class="w-4 h-4 text-amber-500 shrink-0" />
      <Folder v-else-if="node.item.is_folder" class="w-4 h-4 text-amber-500/70 shrink-0" />
      <FileText v-else class="w-4 h-4 text-muted-foreground shrink-0 flex-shrink-0" />
      
      <input v-if="isRenaming" v-model="renameValue" 
        class="text-sm bg-background border border-border rounded px-1.5 py-0.5 w-full outline-none focus:border-primary" 
        @blur="confirmRename" @keydown.enter="confirmRename" @keydown.escape="cancelRename"
        ref="renameInput" />
      <span v-else class="text-sm truncate flex-1" :class="isActive ? 'text-foreground font-medium' : 'text-muted-foreground'">
        {{ node.item.title }}
      </span>

      <!-- Context Menu via custom div -->
      <div class="relative" ref="menuRef">
        <button @click.stop="toggleMenu" class="w-5 h-5 flex items-center justify-center rounded hover:bg-muted opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
          <MoreVertical class="w-4 h-4" />
        </button>
        
        <div v-if="showMenu" class="absolute right-0 top-full mt-1 w-48 rounded-md bg-zinc-950 border border-zinc-800 shadow-lg py-1 z-[60] overflow-hidden" @click.stop>
          <button v-if="node.item.is_folder" @click="handleAction('create-note')" class="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-900 hover:text-white flex items-center">
            <FileText class="w-3.5 h-3.5 mr-2 text-muted-foreground" /> Nova nota aqui
          </button>
          <button v-if="node.item.is_folder" @click="handleAction('create-folder')" class="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-900 hover:text-white flex items-center">
            <FolderPlus class="w-3.5 h-3.5 mr-2 text-muted-foreground" /> Nova pasta aqui
          </button>
          <div v-if="node.item.is_folder" class="h-px bg-zinc-800 my-1"></div>
          <button @click="handleAction('rename')" class="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-900 hover:text-white flex items-center">
            <Edit2 class="w-3.5 h-3.5 mr-2 text-muted-foreground" /> Renomear
          </button>
          <div class="h-px bg-zinc-800 my-1"></div>
          <button @click="handleAction('delete')" class="w-full text-left px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 flex items-center">
            <Trash2 class="w-3.5 h-3.5 mr-2" /> Excluir
          </button>
        </div>
      </div>
    </div>
    
    <div v-if="node.item.is_folder && isExpanded" class="children overflow-hidden">
      <!-- Drop zone at top of folder -->
      <div class="h-1 mx-4 transition-colors relative z-10 rounded-full"
           :class="isDropTop ? 'bg-primary' : 'bg-transparent hover:bg-muted'"
           @dragover.prevent.stop="isDropTop = true"
           @dragleave.prevent.stop="isDropTop = false"
           @drop.stop="onDropTop" />

      <NotepadTreeItem
        v-for="child in node.children"
        :key="child.item.id"
        :node="child"
        :depth="depth + 1"
        :active-note-id="activeNoteId"
        :expanded-folders="expandedFolders"
        @select="$emit('select', $event)"
        @toggle-folder="$emit('toggle-folder', $event)"
        @move="$emit('move', $event)"
        @rename="$emit('rename', $event)"
        @delete="$emit('delete', $event)"
        @create-note="$emit('create-note', $event)"
        @create-folder="$emit('create-folder', $event)"
      />
      
      <!-- Drop zone visual no final da pasta -->
      <div class="h-2 mx-4 transition-colors relative z-10 rounded-full"
           :class="isDropBottom ? 'bg-primary' : 'bg-transparent hover:bg-muted'"
           @dragover.prevent.stop="isDropBottom = true"
           @dragleave.prevent.stop="isDropBottom = false"
           @drop.stop="onDropBottom" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { 
  ChevronRight, Folder, FolderOpen, FileText, 
  MoreVertical, Trash2, Edit2, FolderPlus 
} from 'lucide-vue-next'
import { onClickOutside } from '@vueuse/core'
import type { TreeNode } from './useNotepad'

const props = defineProps<{
  node: TreeNode
  depth: number
  activeNoteId: string | null
  expandedFolders: Set<string>
}>()

const emit = defineEmits<{
  (e: 'select', id: string): void
  (e: 'toggle-folder', id: string): void
  (e: 'move', data: { itemId: string, newParentId: string | null, newIndex: number }): void
  (e: 'rename', data: { id: string, newTitle: string }): void
  (e: 'delete', id: string): void
  (e: 'create-note', parentId: string | null): void
  (e: 'create-folder', parentId: string | null): void
}>()

const isExpanded = computed(() => props.expandedFolders.has(props.node.item.id))
const isActive = computed(() => props.activeNoteId === props.node.item.id)

const isRenaming = ref(false)
const renameValue = ref('')
const renameInput = ref<HTMLInputElement | null>(null)

const menuRef = ref<HTMLElement | null>(null)
const showMenu = ref(false)

onClickOutside(menuRef, () => {
  showMenu.value = false
})

function toggleMenu() {
  showMenu.value = !showMenu.value
}

function handleAction(action: 'create-note' | 'create-folder' | 'rename' | 'delete') {
  showMenu.value = false
  if (action === 'create-note') emit('create-note', props.node.item.id)
  if (action === 'create-folder') emit('create-folder', props.node.item.id)
  if (action === 'rename') startRename()
  if (action === 'delete') confirmDelete()
}

function handleClick() {
  if (props.node.item.is_folder) {
    emit('toggle-folder', props.node.item.id)
  } else {
    emit('select', props.node.item.id)
  }
}

function startRename() {
  renameValue.value = props.node.item.title
  isRenaming.value = true
  nextTick(() => {
    renameInput.value?.focus()
    renameInput.value?.select()
  })
}

function confirmRename() {
  if (isRenaming.value) {
    isRenaming.value = false
    if (renameValue.value.trim() && renameValue.value !== props.node.item.title) {
      emit('rename', { id: props.node.item.id, newTitle: renameValue.value.trim() })
    }
  }
}

function cancelRename() {
  isRenaming.value = false
}

function confirmDelete() {
  if (window.confirm(`Tem certeza que deseja excluir "${props.node.item.title}"?`)) {
    emit('delete', props.node.item.id)
  }
}

// Drag functionality
const isDragOver = ref(false)
const isDropTop = ref(false)
const isDropBottom = ref(false)

function onDragStart(e: DragEvent) {
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', props.node.item.id)
  }
}

function onDragOver(_e: DragEvent) {
  if (props.node.item.is_folder) {
    isDragOver.value = true
  }
}

function onDragLeave() {
  isDragOver.value = false
}

function onDrop(e: DragEvent) {
  isDragOver.value = false
  const draggedId = e.dataTransfer?.getData('text/plain')
  if (!draggedId || draggedId === props.node.item.id) return

  // Drop into folder
  if (props.node.item.is_folder) {
    emit('move', { itemId: draggedId, newParentId: props.node.item.id, newIndex: 0 })
    // Ensure folder is toggled open
    if (!isExpanded.value) {
      emit('toggle-folder', props.node.item.id)
    }
  }
}

function onDropTop(e: DragEvent) {
  isDropTop.value = false
  const draggedId = e.dataTransfer?.getData('text/plain')
  if (!draggedId || draggedId === props.node.item.id) return
  emit('move', { itemId: draggedId, newParentId: props.node.item.id, newIndex: 0 })
}

function onDropBottom(e: DragEvent) {
  isDropBottom.value = false
  const draggedId = e.dataTransfer?.getData('text/plain')
  if (!draggedId || draggedId === props.node.item.id) return
  emit('move', { itemId: draggedId, newParentId: props.node.item.id, newIndex: props.node.children.length })
}
</script>
