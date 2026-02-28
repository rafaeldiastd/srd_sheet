<template>
  <div class="flex flex-col h-full bg-background overflow-hidden relative">
    <div class="flex-1 overflow-y-auto w-full max-w-full">
      <EditorContent :editor="editor" class="h-full focus:outline-none" />
    </div>
    <NotepadToolbar v-if="editor" :editor="editor" :saving="saving" />
  </div>
</template>

<script setup lang="ts">
import { watch, onBeforeUnmount, ref } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Highlight from '@tiptap/extension-highlight'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import NotepadToolbar from './NotepadToolbar.vue'

const props = defineProps<{
  content: Record<string, any>
  noteId: string
  saving: boolean
}>()

const emit = defineEmits<{
  (e: 'update', content: Record<string, any>): void
}>()

const editor = useEditor({
  content: props.content?.type ? props.content : { type: 'doc', content: [{ type: 'paragraph' }] },
  extensions: [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
    }),
    Placeholder.configure({
      placeholder: 'Comece a escrever suas anotações...',
    }),
    Highlight,
    TaskList,
    TaskItem.configure({
      nested: true,
    }),
  ],
  onUpdate: ({ editor }) => {
    emit('update', editor.getJSON())
  },
  editorProps: {
    attributes: {
      class: 'prose prose-invert prose-sm max-w-none focus:outline-none min-h-full p-4 w-full prose-headings:font-bold prose-p:leading-relaxed prose-a:text-primary outline-none',
    },
  },
})

watch(() => props.noteId, () => {
  if (editor.value) {
    // Only update content if note changed, wait for next tick
    setTimeout(() => {
        editor.value?.commands.setContent(props.content?.type ? props.content : { type: 'doc', content: [{ type: 'paragraph' }] })
    }, 10)
  }
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<style>
/* Tiptap Checkbox styling */
ul[data-type="taskList"] {
  list-style: none;
  padding: 0;
}

ul[data-type="taskList"] p {
  margin: 0;
}

ul[data-type="taskList"] li {
  display: flex;
  align-items: flex-start;
  margin-bottom: 0.25rem;
  gap: 0.5rem;
}

ul[data-type="taskList"] li > label {
  flex: 0 0 auto;
  margin-right: 0.5rem;
  user-select: none;
}

ul[data-type="taskList"] li > label input {
    margin-top: 5px;
}

ul[data-type="taskList"] li > div {
  flex: 1 1 auto;
}

ul[data-type="taskList"] input[type="checkbox"] {
  cursor: pointer;
}

ul[data-type="taskList"] ul[data-type="taskList"] {
  margin: 0;
}
</style>
