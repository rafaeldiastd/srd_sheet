<script setup lang="ts">
import { ref, watch } from 'vue'
import { X, Dices } from 'lucide-vue-next'
import type { SheetData } from '@/types/sheet'
import { ATTR_KEYS, ATTR_LABELS } from '@/data/sheetConstants'

const props = defineProps<{
  modelValue: boolean
  sheetName: string
  sheetClass: string
  sheetLevel: number
  sheetRace: string
  data: SheetData
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', meta: { name: string; class: string; level: number; race: string }, data: any): void
}>()

// Local state for editing
const editMeta = ref({
  name: '',
  class: '',
  level: 1,
  race: ''
})

const editData = ref<any>({})

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    // Clone data for editing
    editMeta.value = {
      name: props.sheetName,
      class: props.sheetClass,
      level: props.sheetLevel,
      race: props.sheetRace
    }
    // Deep clone data to avoid reactive mutations before save
    editData.value = JSON.parse(JSON.stringify(props.data))
    
    // Ensure attributes exist
    if (!editData.value.attributes) editData.value.attributes = {}
    for (const k of ATTR_KEYS) {
      if (!editData.value.attributes[k]) editData.value.attributes[k] = { base: 10, temp: 0 }
    }
  }
})

function close() {
  emit('update:modelValue', false)
}

function save() {
  emit('save', editMeta.value, editData.value)
  close()
}

const hitDieInput = ref('d10')
const lastRollResult = ref<{roll: number, conMod: number, total: number} | null>(null)

function rollHitDie() {
  const input = String(hitDieInput.value || '')
  const match = input.toLowerCase().match(/^d(\d+)$/)
  if (!match) {
    alert('Formato inválido. Use algo como d8, d10, d12.')
    return
  }
  const sides = parseInt(match[1] || '0', 10)
  if (isNaN(sides) || sides < 1) return

  const roll = Math.floor(Math.random() * sides) + 1
  const con = editData.value.attributes?.con?.base ?? 10
  const conMod = Math.floor((con - 10) / 2)
  const total = roll + conMod

  // Add to max HP
  editData.value.hp_max = (editData.value.hp_max || 0) + Math.max(1, total)
  
  lastRollResult.value = { roll, conMod, total: Math.max(1, total) }
  
  // Autosave when rolling
  emit('save', editMeta.value, editData.value)
  
  // Clear result after 3s
  setTimeout(() => {
    lastRollResult.value = null
  }, 3000)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
      
      <!-- Modal Content -->
      <div class="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-zinc-800/60 bg-zinc-900/40">
          <h2 class="text-lg font-bold text-zinc-100 font-serif">Editar Dados do Personagem</h2>
          <button @click="close" class="p-2 -mr-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Scrollable Body -->
        <div class="p-6 overflow-y-auto space-y-8 flex-1 custom-scrollbar">
          
          <!-- Identidade -->
          <section class="bg-zinc-900/20 border border-zinc-800/60 rounded-xl p-5">
            <h3 class="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary mb-4 pb-2 border-b border-zinc-800/80">Identidade</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-zinc-400">Nome</label>
                <input v-model="editMeta.name" type="text" class="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-primary focus:outline-none transition-colors" />
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-zinc-400">Raça</label>
                <input v-model="editMeta.race" type="text" class="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-primary focus:outline-none transition-colors" />
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-zinc-400">Classe</label>
                <input v-model="editMeta.class" type="text" class="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-primary focus:outline-none transition-colors" />
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-zinc-400">Nível</label>
                  <input v-model.number="editMeta.level" type="number" min="1" class="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-primary focus:outline-none transition-colors" />
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-zinc-400">Experiência</label>
                  <input v-model.number="editData.xp" type="number" min="0" class="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-primary focus:outline-none transition-colors" />
                </div>
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-zinc-400">Alinhamento</label>
                <input v-model="editData.alignment" type="text" class="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-primary focus:outline-none transition-colors" />
              </div>
              <div class="grid grid-cols-3 gap-3">
                <div class="space-y-1.5">
                  <label class="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Idade</label>
                  <input v-model.number="editData.age" type="number" class="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-primary focus:outline-none transition-colors text-center" />
                </div>
                <div class="space-y-1.5">
                  <label class="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Peso (kg)</label>
                  <input v-model.number="editData.weight" type="number" class="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-primary focus:outline-none transition-colors text-center" />
                </div>
                <div class="space-y-1.5">
                  <label class="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Altura (m)</label>
                  <input v-model.number="editData.height" type="number" step="0.01" class="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-primary focus:outline-none transition-colors text-center" />
                </div>
              </div>
            </div>
            <div class="mt-4 space-y-1.5">
              <label class="text-xs font-semibold text-zinc-400">Avatar URL (Imagem)</label>
              <input v-model="editData.avatarUrl" type="text" placeholder="https://..." class="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-primary focus:outline-none transition-colors" />
            </div>
          </section>

          <!-- Atributos base -->
          <section class="bg-zinc-900/20 border border-zinc-800/60 rounded-xl p-5">
            <h3 class="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary mb-4 pb-2 border-b border-zinc-800/80">Atributos Base</h3>
            <div class="grid grid-cols-3 sm:grid-cols-6 gap-3">
              <div v-for="key in ATTR_KEYS" :key="key" class="space-y-1.5 text-center bg-zinc-950/50 border border-zinc-800/60 rounded-lg pt-2 pb-1 px-1">
                <label class="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{{ ATTR_LABELS[key] }}</label>
                <input v-model.number="editData.attributes[key].base" type="number" min="1" max="50" 
                  class="w-full bg-transparent px-2 py-1 text-center text-xl font-serif font-black text-zinc-100 focus:outline-none tabular-nums" />
              </div>
            </div>
          </section>

          <!-- Combate & Vitals -->
          <section class="bg-zinc-900/20 border border-zinc-800/60 rounded-xl p-5">
            <h3 class="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary mb-4 pb-2 border-b border-zinc-800/80">Combate & Sobrevivência</h3>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
              
              <!-- Max HP with Roll button -->
              <div class="space-y-1.5 sm:col-span-2 bg-red-950/10 border border-red-900/20 rounded-lg p-3">
                <div class="flex justify-between items-end mb-2">
                  <label class="text-xs font-semibold text-zinc-300">Vida Máxima</label>
                  <div class="flex items-center gap-1.5">
                    <input v-model="hitDieInput" type="text" placeholder="d10" class="w-12 bg-zinc-900 border border-zinc-700 rounded text-center text-xs py-1 text-zinc-300 focus:border-red-500 focus:outline-none uppercase" />
                    <button @click="rollHitDie" class="bg-red-900/40 hover:bg-red-800/60 text-red-200 border border-red-800/50 rounded px-2 py-1 text-xs font-bold flex items-center gap-1 transition-colors relative" title="Rolar e Somar Vida">
                      <Dices class="w-3 h-3" /> Rolar
                      <span v-if="lastRollResult" class="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-100 text-zinc-900 text-[10px] font-bold px-2 py-0.5 rounded shadow-lg whitespace-nowrap animate-in fade-in slide-in-from-bottom-2">
                        +{{ lastRollResult.total }} ({{ lastRollResult.roll }} + {{ lastRollResult.conMod }})
                      </span>
                    </button>
                  </div>
                </div>
                <input v-model.number="editData.hp_max" type="number" class="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2 text-lg font-bold text-zinc-200 focus:border-red-500 focus:outline-none tabular-nums" />
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-zinc-400">BBA</label>
                <input v-model.number="editData.bonuses.bab" type="number" class="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-primary focus:outline-none tabular-nums mt-1" />
              </div>
              
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-zinc-400">Deslocamento (m)</label>
                <input v-model.number="editData.speed" type="number" class="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-primary focus:outline-none tabular-nums mt-1" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-6 mt-6 pt-5 border-t border-zinc-800/50">
              <!-- Defesa Base -->
              <div>
                <h4 class="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Defesa Base</h4>
                <div class="grid grid-cols-2 gap-3">
                  <div class="space-y-1">
                    <label class="text-[10px] font-semibold text-zinc-400">CA Armadura</label>
                    <input v-model.number="editData.ca_armor" type="number" class="w-full bg-zinc-950/50 border border-zinc-800 rounded-md px-2 py-1.5 text-sm text-zinc-200 focus:border-primary focus:outline-none tabular-nums" />
                  </div>
                  <div class="space-y-1">
                    <label class="text-[10px] font-semibold text-zinc-400">CA Escudo</label>
                    <input v-model.number="editData.ca_shield" type="number" class="w-full bg-zinc-950/50 border border-zinc-800 rounded-md px-2 py-1.5 text-sm text-zinc-200 focus:border-primary focus:outline-none tabular-nums" />
                  </div>
                  <div class="space-y-1">
                    <label class="text-[10px] font-semibold text-zinc-400">CA Natural</label>
                    <input v-model.number="editData.ca_natural" type="number" class="w-full bg-zinc-950/50 border border-zinc-800 rounded-md px-2 py-1.5 text-sm text-zinc-200 focus:border-primary focus:outline-none tabular-nums" />
                  </div>
                  <div class="space-y-1">
                    <label class="text-[10px] font-semibold text-zinc-400">CA Deflexão</label>
                    <input v-model.number="editData.ca_deflect" type="number" class="w-full bg-zinc-950/50 border border-zinc-800 rounded-md px-2 py-1.5 text-sm text-zinc-200 focus:border-primary focus:outline-none tabular-nums" />
                  </div>
                </div>
              </div>

              <!-- Salvaguardas & Misc -->
              <div>
                <h4 class="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Salvaguardas & Extras</h4>
                <div class="grid grid-cols-2 gap-3">
                  <div class="space-y-1">
                    <label class="text-[10px] font-semibold text-zinc-400">Fortitude</label>
                    <input v-model.number="editData.save_fort" type="number" class="w-full bg-zinc-950/50 border border-zinc-800 rounded-md px-2 py-1.5 text-sm text-zinc-200 focus:border-primary focus:outline-none tabular-nums" />
                  </div>
                  <div class="space-y-1">
                    <label class="text-[10px] font-semibold text-zinc-400">Init Extra</label>
                    <input v-model.number="editData.initiative_misc" type="number" class="w-full bg-zinc-950/50 border border-zinc-800 rounded-md px-2 py-1.5 text-sm text-zinc-200 focus:border-primary focus:outline-none tabular-nums" />
                  </div>
                  <div class="space-y-1">
                    <label class="text-[10px] font-semibold text-zinc-400">Reflexos</label>
                    <input v-model.number="editData.save_ref" type="number" class="w-full bg-zinc-950/50 border border-zinc-800 rounded-md px-2 py-1.5 text-sm text-zinc-200 focus:border-primary focus:outline-none tabular-nums" />
                  </div>
                  <div class="space-y-1">
                    <label class="text-[10px] font-semibold text-zinc-400">Vontade</label>
                    <input v-model.number="editData.save_will" type="number" class="w-full bg-zinc-950/50 border border-zinc-800 rounded-md px-2 py-1.5 text-sm text-zinc-200 focus:border-primary focus:outline-none tabular-nums" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- Footer -->
        <div class="p-4 border-t border-zinc-800/60 bg-zinc-900/40 flex justify-end gap-3">
          <button @click="close" class="px-5 py-2.5 rounded-lg border border-zinc-700 text-sm font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors">
            Cancelar
          </button>
          <button @click="save" class="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors">
            Salvar Ficha
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #3f3f46;
  border-radius: 10px;
}
</style>
