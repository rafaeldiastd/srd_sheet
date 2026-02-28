<template>
  <div class="flex items-center gap-1 p-2 border-t border-border bg-background shrink-0 flex-wrap">
    <button @click="editor.chain().focus().toggleBold().run()" :class="['p-1.5 rounded hover:bg-muted', { 'bg-primary/20 text-primary': editor.isActive('bold') }]" title="Negrito">
      <Bold class="w-4 h-4" />
    </button>
    <button @click="editor.chain().focus().toggleItalic().run()" :class="['p-1.5 rounded hover:bg-muted', { 'bg-primary/20 text-primary': editor.isActive('italic') }]" title="Itálico">
      <Italic class="w-4 h-4" />
    </button>
    <button @click="editor.chain().focus().toggleStrike().run()" :class="['p-1.5 rounded hover:bg-muted', { 'bg-primary/20 text-primary': editor.isActive('strike') }]" title="Tachado">
      <Strikethrough class="w-4 h-4" />
    </button>
    <button @click="editor.chain().focus().toggleHighlight().run()" :class="['p-1.5 rounded hover:bg-muted', { 'bg-primary/20 text-primary': editor.isActive('highlight') }]" title="Destacar">
      <Highlighter class="w-4 h-4" />
    </button>
    <div class="w-px h-4 bg-border mx-1"></div>
    <button @click="editor.chain().focus().toggleHeading({ level: 1 }).run()" :class="['p-1.5 rounded hover:bg-muted', { 'bg-primary/20 text-primary': editor.isActive('heading', { level: 1 }) }]" title="Título 1">
      <Heading1 class="w-4 h-4" />
    </button>
    <button @click="editor.chain().focus().toggleHeading({ level: 2 }).run()" :class="['p-1.5 rounded hover:bg-muted', { 'bg-primary/20 text-primary': editor.isActive('heading', { level: 2 }) }]" title="Título 2">
      <Heading2 class="w-4 h-4" />
    </button>
    <button @click="editor.chain().focus().toggleHeading({ level: 3 }).run()" :class="['p-1.5 rounded hover:bg-muted', { 'bg-primary/20 text-primary': editor.isActive('heading', { level: 3 }) }]" title="Título 3">
      <Heading3 class="w-4 h-4" />
    </button>
    <div class="w-px h-4 bg-border mx-1"></div>
    <button @click="editor.chain().focus().toggleBulletList().run()" :class="['p-1.5 rounded hover:bg-muted', { 'bg-primary/20 text-primary': editor.isActive('bulletList') }]" title="Lista Marcadores">
      <List class="w-4 h-4" />
    </button>
    <button @click="editor.chain().focus().toggleOrderedList().run()" :class="['p-1.5 rounded hover:bg-muted', { 'bg-primary/20 text-primary': editor.isActive('orderedList') }]" title="Lista Numérica">
      <ListOrdered class="w-4 h-4" />
    </button>
    <button @click="editor.chain().focus().toggleTaskList().run()" :class="['p-1.5 rounded hover:bg-muted', { 'bg-primary/20 text-primary': editor.isActive('taskList') }]" title="Checklist">
      <CheckSquare class="w-4 h-4" />
    </button>
    <div class="w-px h-4 bg-border mx-1"></div>
    <button @click="editor.chain().focus().toggleBlockquote().run()" :class="['p-1.5 rounded hover:bg-muted', { 'bg-primary/20 text-primary': editor.isActive('blockquote') }]" title="Citação">
      <Quote class="w-4 h-4" />
    </button>
    <button @click="editor.chain().focus().toggleCodeBlock().run()" :class="['p-1.5 rounded hover:bg-muted', { 'bg-primary/20 text-primary': editor.isActive('codeBlock') }]" title="Bloco de código">
      <Code class="w-4 h-4" />
    </button>
    <div class="flex-1"></div>
    <div class="flex items-center gap-1.5 text-xs text-muted-foreground mr-2">
      <template v-if="saving">
        <Loader2 class="w-3 h-3 animate-spin" />
        Salvando...
      </template>
      <template v-else>
        <Check class="w-3 h-3 text-green-500" />
        Salvo ✓
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { 
  Bold, Italic, Strikethrough, Highlighter, 
  Heading1, Heading2, Heading3, 
  List, ListOrdered, CheckSquare, 
  Quote, Code, Loader2, Check 
} from 'lucide-vue-next'
import { Editor } from '@tiptap/vue-3'

defineProps<{
  editor: Editor
  saving: boolean
}>()
</script>
