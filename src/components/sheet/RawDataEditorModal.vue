<script setup lang="ts">
import { ref, watch } from 'vue'
import { X, AlertTriangle } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: boolean
  data: any
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', data: any): void
}>()

const rawText = ref('')
const errorMsg = ref('')

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    rawText.value = JSON.stringify(props.data, null, 2)
    errorMsg.value = ''
  }
})

function close() {
  emit('update:modelValue', false)
}

function save() {
  try {
    const parsed = JSON.parse(rawText.value)
    emit('save', parsed)
    close()
  } catch (err: any) {
    errorMsg.value = 'JSON Inválido: ' + err.message
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="close"></div>
      
      <!-- Modal Content -->
      <div class="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col h-[90vh]">
        
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-zinc-800/60 bg-zinc-900/40">
          <div>
            <h2 class="text-lg font-bold text-zinc-100 font-serif">Editar Ficha (Raw JSON)</h2>
            <p class="text-xs text-zinc-500">Cuidado ao editar os dados brutos. Certifique-se de usar JSON válido.</p>
          </div>
          <button @click="close" class="p-2 -mr-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Editor -->
        <div class="flex-1 p-6 overflow-hidden flex flex-col gap-4">
          <div v-if="errorMsg" class="flex items-start gap-3 bg-red-950/30 border border-red-900/50 rounded-lg p-3 text-red-400 text-sm">
            <AlertTriangle class="w-5 h-5 shrink-0" />
            <p>{{ errorMsg }}</p>
          </div>
          <textarea
            v-model="rawText"
            class="flex-1 w-full bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 text-sm font-mono text-zinc-300 focus:outline-none focus:border-primary/50 resize-none custom-scrollbar"
            spellcheck="false"
          ></textarea>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-zinc-800/60 bg-zinc-900/40 flex justify-end gap-3">
          <button @click="close" class="px-5 py-2.5 rounded-lg border border-zinc-700 text-sm font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors">
            Cancelar
          </button>
          <button @click="save" class="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors">
            Salvar JSON
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #3f3f46;
  border-radius: 10px;
}
</style>
