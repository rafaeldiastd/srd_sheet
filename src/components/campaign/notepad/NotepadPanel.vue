<template>
  <div v-show="visible" class="flex flex-col h-full w-full lg:w-[480px] bg-background border-r border-border shrink-0 z-40 relative overflow-hidden">

    <!-- ── Top Header ────────────────────────────────────── -->
    <div class="flex items-center justify-between px-3 py-2 border-b border-border bg-card shrink-0 min-h-[44px]">
      <div class="flex items-center gap-2">
        <!-- Back button: only when viewing a note on narrow screens -->
        <button
          v-if="notepad.activeNote.value && showEditor"
          @click="goBack"
          class="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Voltar para arquivos"
        >
          <ArrowLeft class="w-4 h-4" />
        </button>

        <BookOpen class="w-4 h-4 text-primary shrink-0" />

        <span class="font-semibold text-sm truncate max-w-[200px]">
          <template v-if="showEditor && notepad.activeNote.value">
            {{ notepad.activeNote.value.title }}
          </template>
          <template v-else>
            Anotações
          </template>
        </span>
      </div>

      <div class="flex items-center gap-1">
        <!-- New folder / new note shortcuts in tree view -->
        <template v-if="!showEditor">
          <button @click="notepad.createFolder(null)" class="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground" title="Nova Pasta">
            <FolderPlus class="w-4 h-4" />
          </button>
          <button @click="notepad.createNote(null).then(openEditorAfterCreate)" class="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground" title="Nova Nota">
            <FilePlus class="w-4 h-4" />
          </button>
        </template>

        <button @click="$emit('close')" class="p-1.5 hover:bg-muted rounded-md text-muted-foreground" title="Fechar">
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- ── Body ──────────────────────────────────────────── -->
    <div class="flex flex-1 overflow-hidden relative">

      <!-- Loading overlay -->
      <div v-if="notepad.loading.value" class="absolute inset-0 flex items-center justify-center bg-background/70 z-20">
        <Loader2 class="w-7 h-7 animate-spin text-primary" />
      </div>

      <!-- Sidebar (file tree) — always visible on lg, slides in/out on smaller -->
      <Transition name="slide-left">
        <NotepadSidebar
          v-show="!showEditor"
          class="w-full h-full"
          :tree="notepad.tree.value"
          :active-note-id="notepad.activeNoteId.value"
          :expanded-folders="notepad.expandedFolders.value"
          @select="handleSelect"
          @toggle-folder="notepad.toggleFolder"
          @create-note="notepad.createNote"
          @create-folder="notepad.createFolder"
          @rename="notepad.renameItem"
          @delete="notepad.deleteItem"
          @move="notepad.moveItem"
        />
      </Transition>

      <!-- Editor pane -->
      <Transition name="slide-right">
        <div
          v-show="showEditor"
          class="flex-1 flex flex-col h-full bg-card border-l border-border absolute inset-0 lg:relative"
        >
          <NotepadEditor
            v-if="notepad.activeNote.value"
            :note-id="notepad.activeNote.value.id"
            :content="notepad.activeNote.value.content"
            :saving="notepad.saving.value"
            @update="(content) => notepad.updateNoteContent(notepad.activeNote.value!.id, content)"
          />
          <!-- Empty state on lg desktop when no note is selected -->
          <div v-else class="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
            <BookOpen class="w-14 h-14 mb-4 text-muted-foreground/20" />
            <h3 class="font-medium text-base mb-1 text-foreground">Bloco de Notas</h3>
            <p class="text-xs max-w-[220px]">Selecione uma nota na lista ou crie uma nova para começar.</p>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { BookOpen, X, Loader2, ArrowLeft, FolderPlus, FilePlus } from 'lucide-vue-next'
import NotepadSidebar from './NotepadSidebar.vue'
import NotepadEditor from './NotepadEditor.vue'
import { useNotepad } from './useNotepad'

const props = defineProps<{
  campaignId: string
  visible: boolean
}>()

defineEmits<{
  (e: 'close'): void
}>()

const notepad = useNotepad(props.campaignId)

// Controls which pane is active on mobile.
// On lg screens both panes are always shown side by side.
const showEditor = ref(false)

function handleSelect(id: string) {
  notepad.selectNote(id)
  showEditor.value = true
}

function goBack() {
  showEditor.value = false
}

function openEditorAfterCreate(id: string | null) {
  if (id) showEditor.value = true
}

onMounted(async () => {
  if (props.campaignId) {
    await notepad.fetchNotes()
    // On desktop, if there's already a note, show the editor
    if (notepad.activeNote.value) {
      showEditor.value = true
    }
  }
})

watch(() => props.campaignId, async () => {
  if (props.campaignId) {
    await notepad.fetchNotes()
  }
})

// Reset to tree view when panel is closed then reopened
watch(() => props.visible, (v) => {
  if (v && !notepad.activeNote.value) {
    showEditor.value = false
  }
})
</script>

<style scoped>
/* Slide LEFT → show sidebar */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
  position: absolute;
  inset: 0;
}
.slide-left-enter-from { transform: translateX(-100%); opacity: 0; }
.slide-left-leave-to  { transform: translateX(-100%); opacity: 0; }

/* Slide RIGHT → show editor */
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
  position: absolute;
  inset: 0;
}
.slide-right-enter-from { transform: translateX(100%); opacity: 0; }
.slide-right-leave-to  { transform: translateX(100%); opacity: 0; }
</style>
