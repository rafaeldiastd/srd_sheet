<script setup lang="ts">
import { ref, watch } from 'vue'
import { X, RotateCcw } from 'lucide-vue-next'
import FieldTooltip from '@/components/ui/FieldTooltip.vue'


const props = defineProps<{
  modelValue: boolean
  resource: any | null
  index: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'save', resource: any, index: number): void
}>()

const DEFAULT = {
  name: '',
  max: 3,
  current: 3,
  // Recovery
  recoverOn: 'long',      // 'long' | 'short' | 'manual' | 'daily' | 'never'
  recoverFormula: '',     // optional formula for recovery amount (empty = full recover)
  // Usage cost
  costPerUse: 1,
  // Visual/description
  description: '',
  color: '#8b5cf6',       // accent color for the bar
}

const RECOVER_OPTIONS = [
  { value: 'long',   label: ' Descanso Longo (total)' },
  { value: 'short',  label: ' Descanso Curto' },
  { value: 'daily',  label: ' Diário' },
  { value: 'formula', label: ' Rolar Fórmula de Recuperação' },
  { value: 'manual', label: ' Apenas Manual' },
]

const PRESET_COLORS = [
  '#8b5cf6', // violet
  '#f59e0b', // amber
  '#ef4444', // red
  '#22c55e', // green
  '#06b6d4', // cyan
  '#f97316', // orange
  '#ec4899', // pink
  '#64748b', // slate
]

const form = ref<any>({ ...DEFAULT })

watch(() => props.resource, (val) => {
  if (val) {
    form.value = { ...DEFAULT, ...JSON.parse(JSON.stringify(val)) }
  } else {
    form.value = { ...DEFAULT }
  }
}, { immediate: true })

function syncCurrentWithMax() {
  if (props.index === -1) {
    // New resource: set current = max
    form.value.current = form.value.max
  }
}

function close() { emit('update:modelValue', false) }

function save() {
  if (!form.value.name?.trim()) return
  const out = { ...form.value }
  if (props.index === -1) {
    out.current = out.max
  }
  emit('save', out, props.index)
  close()
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4" @click.self="close">
      <div class="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div class="flex items-center gap-2">
            <RotateCcw class="w-4 h-4 text-primary" />
            <h3 class="font-bold text-foreground">
              {{ index === -1 ? 'Novo Recurso' : 'Editar Recurso' }}
            </h3>
          </div>
          <button @click="close" class="p-1.5 text-muted-foreground hover:text-foreground/80 hover:bg-accent rounded-lg transition-colors">
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Body -->
        <div class="p-5 space-y-4 overflow-y-auto flex-1">

          <!-- Nome e Máximo -->
          <div class="grid grid-cols-3 gap-3">
            <div class="col-span-2">
              <label class="field-label flex items-center">Nome do Recurso * <FieldTooltip text="O nome que aparecerá principal na ficha" /></label>
              <input v-model="form.name" placeholder="Ex: Fúria, Ki, Feitiços..."
                class="field-input" />
            </div>
            <div>
              <label class="field-label flex items-center">Máximo <FieldTooltip text="Quantidade máxima de usos" /></label>
              <input v-model.number="form.max" type="number" min="1"
                @change="syncCurrentWithMax"
                class="field-input text-center" />
            </div>
          </div>

          <!-- Valor atual (só ao editar) -->
          <div v-if="index !== -1">
            <label class="field-label flex items-center">Valor Atual <FieldTooltip text="Quantidade atual pronta para uso" /></label>
            <input v-model.number="form.current" type="number" :min="0" :max="form.max"
              class="field-input text-center" />
          </div>

          <!-- Custo por uso -->
          <div>
            <label class="field-label flex items-center">Custo por Uso <FieldTooltip text="Quantidade consumida cada vez que o recurso é usado" /></label>
            <input v-model.number="form.costPerUse" type="number" min="1"
              class="field-input" />
          </div>

          <!-- Recuperação -->
          <div>
            <label class="field-label flex items-center">Recuperação <FieldTooltip text="Em qual momento o sistema deve recuperar este recurso automaticamente" /></label>
            <select v-model="form.recoverOn" class="field-input">
              <option v-for="opt in RECOVER_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>

          <!-- Fórmula de Recuperação (se recoverOn = 'formula') -->
          <div v-if="form.recoverOn === 'formula'">
            <label class="field-label flex items-center">Fórmula de Recuperação <FieldTooltip text="Fórmula rolada na hora da recuperação. Em branco para recuperar o total." /></label>
            <input v-model="form.recoverFormula" placeholder="Ex: 1d6 + @level"
              class="field-input font-mono text-sm" />
          </div>

          <!-- Cor do Recurso -->
          <div>
            <label class="field-label flex items-center">Cor <FieldTooltip text="A cor que o recurso vai exibir visualmente na ficha" /></label>
            <div class="flex flex-wrap gap-2 items-center">
              <button
                v-for="color in PRESET_COLORS"
                :key="color"
                @click="form.color = color"
                class="w-7 h-7 rounded-full border-2 transition-all"
                :style="{ backgroundColor: color, borderColor: form.color === color ? 'white' : 'transparent' }"
                :class="form.color === color ? 'scale-110 shadow-md' : 'opacity-70 hover:opacity-100'"
              />
              <input type="color" v-model="form.color"
                class="w-7 h-7 rounded-full cursor-pointer bg-transparent border border-border overflow-hidden"
                title="Cor personalizada" />
            </div>
          </div>

          <!-- Descrição -->
          <div>
            <label class="field-label flex items-center">Descrição / Notas <FieldTooltip text="Descreva o recurso para consulta rápida na ficha" /></label>
            <textarea v-model="form.description" placeholder="Descrição do recurso, regras, etc."
              class="field-input resize-none min-h-[4rem]" />
          </div>

          <!-- Preview -->
          <div class="p-3 bg-muted/40 border border-border rounded-xl">
            <p class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Preview</p>
            <div class="flex items-center gap-3">
              <span class="font-bold text-foreground text-sm">{{ form.name || 'Recurso' }}</span>
              <span class="text-xs text-muted-foreground">{{ form.max }} / {{ form.max }}</span>
            </div>
            <div class="h-2.5 bg-muted/80 rounded-full overflow-hidden mt-2 p-0.5">
              <div class="h-full rounded-full transition-all duration-300"
                :style="{ width: '100%', backgroundColor: form.color }">
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex justify-end gap-2 px-5 py-4 border-t border-border bg-muted/50 shrink-0">
          <button @click="close" class="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors">
            Cancelar
          </button>
          <button @click="save" :disabled="!form.name?.trim()"
            class="px-4 py-2 text-sm font-bold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            Salvar
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.field-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--muted-foreground);
  margin-bottom: 0.375rem;
}
.field-input {
  width: 100%;
  background-color: var(--muted);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: var(--foreground);
  transition: border-color 0.15s;
}
.field-input:focus {
  outline: none;
  border-color: color-mix(in srgb, var(--primary) 60%, transparent);
}
.field-input::placeholder {
  color: var(--muted-foreground);
  opacity: 0.6;
}
</style>
