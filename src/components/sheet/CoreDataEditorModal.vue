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

    // Ensure AC structure
    if (!editData.value.ac) {
      editData.value.ac = {
        armor: 0, shield: 0, natural: 0, deflection: 0,
        size: 0, misc: 0, dexMod: 0, total: 10, touch: 10, flatFooted: 10
      }
    }

    // Ensure Conditions
    if (!editData.value.conditions) {
      editData.value.conditions = {
        blinded: false, dazzled: false, deafened: false, entangled: false,
        fatigued: false, exhausted: false, grappled: false, helpless: false,
        paralyzed: false, pinned: false, prone: false, shaken: false,
        sickened: false, stunned: false, unconscious: false, invisible: false
      }
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
      <div class="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-muted/40">
          <h2 class="text-lg font-bold text-foreground font-serif">Editar Dados do Personagem</h2>
          <button @click="close" class="p-2 -mr-2 text-muted-foreground hover:text-foreground/80 hover:bg-accent rounded-lg transition-colors">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Scrollable Body -->
        <div class="p-6 overflow-y-auto space-y-8 flex-1 custom-scrollbar">
          
          <!-- Identidade -->
          <section class="bg-muted/20 border border-border/60 rounded-xl p-5">
            <h3 class="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary mb-4 pb-2 border-b border-border/80">Identidade</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-muted-foreground">Nome</label>
                <input v-model="editMeta.name" type="text" class="w-full bg-card/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none transition-colors" />
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-muted-foreground">Raça</label>
                <input v-model="editMeta.race" type="text" class="w-full bg-card/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none transition-colors" />
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-muted-foreground">Classe</label>
                <input v-model="editMeta.class" type="text" class="w-full bg-card/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none transition-colors" />
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-muted-foreground">Nível</label>
                  <input v-model.number="editMeta.level" type="number" min="1" class="w-full bg-card/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none transition-colors" />
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-muted-foreground">Experiência</label>
                  <input v-model.number="editData.xp" type="number" min="0" class="w-full bg-card/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none transition-colors" />
                </div>
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-muted-foreground">Tamanho</label>
                <select v-model="editData.size" class="w-full bg-card/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none transition-colors">
                  <option value="Colossal">Colossal</option>
                  <option value="Imenso">Imenso</option>
                  <option value="Enorme">Enorme</option>
                  <option value="Grande">Grande</option>
                  <option value="Médio">Médio</option>
                  <option value="Pequeno">Pequeno</option>
                  <option value="Miúdo">Miúdo</option>
                  <option value="Diminuto">Diminuto</option>
                  <option value="Mínimo">Mínimo</option>
                </select>
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-muted-foreground">Alinhamento</label>
                <input v-model="editData.alignment" type="text" class="w-full bg-card/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none transition-colors" />
              </div>
              <div class="grid grid-cols-3 gap-3">
                <div class="space-y-1.5">
                  <label class="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Idade</label>
                  <input v-model.number="editData.age" type="number" class="w-full bg-card/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none transition-colors text-center" />
                </div>
                <div class="space-y-1.5">
                  <label class="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Peso (kg)</label>
                  <input v-model.number="editData.weight" type="number" class="w-full bg-card/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none transition-colors text-center" />
                </div>
                <div class="space-y-1.5">
                  <label class="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Altura (m)</label>
                  <input v-model.number="editData.height" type="number" step="0.01" class="w-full bg-card/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none transition-colors text-center" />
                </div>
              </div>
            </div>
            <div class="mt-4 space-y-1.5">
              <label class="text-xs font-semibold text-muted-foreground">Avatar URL (Imagem)</label>
              <input v-model="editData.avatarUrl" type="text" placeholder="https://..." class="w-full bg-card/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none transition-colors" />
            </div>
          </section>

          <!-- Atributos base -->
          <section class="bg-muted/20 border border-border/60 rounded-xl p-5">
            <h3 class="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary mb-4 pb-2 border-b border-border/80">Atributos Base e Temporários</h3>
            <div class="grid grid-cols-3 sm:grid-cols-6 gap-3">
              <div v-for="key in ATTR_KEYS" :key="key" class="space-y-2 bg-card/50 border border-border/60 rounded-lg p-2">
                <div class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center">{{ ATTR_LABELS[key] }}</div>
                <div>
                  <label class="text-[8px] uppercase text-muted-foreground/60 block text-center mb-0.5">Base</label>
                  <input v-model.number="editData.attributes[key].base" type="number" min="1" max="50" 
                    class="w-full bg-transparent border-b border-border focus:border-primary px-1 py-1 text-center text-lg font-serif font-black text-foreground focus:outline-none tabular-nums" />
                </div>
                <div>
                  <label class="text-[8px] uppercase text-muted-foreground/60 block text-center mb-0.5">Temp</label>
                  <input v-model.number="editData.attributes[key].temp" type="number" 
                    class="w-full bg-transparent border-b border-border focus:border-cyan-500/50 px-1 py-1 text-center text-sm font-bold text-cyan-200 focus:outline-none tabular-nums" />
                </div>
              </div>
            </div>
          </section>

          <!-- Combate & Vitals -->
          <section class="bg-muted/20 border border-border/60 rounded-xl p-5">
            <h3 class="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary mb-4 pb-2 border-b border-border/80">Combate & Sobrevivência</h3>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
              
              <!-- Max HP with Roll button -->
              <div class="space-y-1.5 sm:col-span-2 bg-red-950/10 border border-red-900/20 rounded-lg p-3">
                <div class="flex justify-between items-end mb-2">
                  <label class="text-xs font-semibold text-foreground/80">Pontos de Vida</label>
                  <div class="flex items-center gap-1.5">
                    <input v-model="hitDieInput" type="text" placeholder="d10" class="w-12 bg-muted border border-border rounded text-center text-xs py-1 text-foreground/80 focus:border-red-500 focus:outline-none uppercase" />
                    <button @click="rollHitDie" class="bg-red-900/40 hover:bg-red-800/60 text-red-200 border border-red-800/50 rounded px-2 py-1 text-xs font-bold flex items-center gap-1 transition-colors relative" title="Rolar e Somar Vida">
                      <Dices class="w-3 h-3" /> Rolar
                      <span v-if="lastRollResult" class="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] font-bold px-2 py-0.5 rounded shadow-lg whitespace-nowrap animate-in fade-in slide-in-from-bottom-2">
                        +{{ lastRollResult.total }} ({{ lastRollResult.roll }} + {{ lastRollResult.conMod }})
                      </span>
                    </button>
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="text-[10px] uppercase text-muted-foreground font-bold block mb-1 text-center">Atual</label>
                    <input v-model.number="editData.hp_current" type="number" class="w-full bg-card/50 border border-border rounded-lg px-3 py-2 text-center text-lg font-bold text-foreground focus:border-red-500 focus:outline-none tabular-nums" />
                  </div>
                  <div>
                    <label class="text-[10px] uppercase text-muted-foreground font-bold block mb-1 text-center">Máxima</label>
                    <input v-model.number="editData.hp_max" type="number" class="w-full bg-card/50 border border-border rounded-lg px-3 py-2 text-center text-lg font-bold text-foreground focus:border-red-500 focus:outline-none tabular-nums" />
                  </div>
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="text-[10px] uppercase font-bold text-muted-foreground">BBA (Ataque Base)</label>
                <input v-model.number="editData.bab" type="number" class="w-full bg-card/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none tabular-nums mt-1" />
              </div>
              
              <div class="space-y-1.5">
                <label class="text-[10px] uppercase font-bold text-muted-foreground">Deslocamento (m)</label>
                <input v-model.number="editData.speed" type="number" class="w-full bg-card/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none tabular-nums mt-1" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-6 mt-6 pt-5 border-t border-border/50">
              <!-- Defesa Base -->
              <div class="sm:col-span-2">
                <h4 class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Defesa Base (CA)</h4>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div class="space-y-1">
                    <label class="text-[10px] font-semibold text-muted-foreground">Armadura</label>
                    <input v-model.number="editData.ac.armor" type="number" class="w-full bg-card/50 border border-border rounded-md px-2 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none tabular-nums" />
                  </div>
                  <div class="space-y-1">
                    <label class="text-[10px] font-semibold text-muted-foreground">Escudo</label>
                    <input v-model.number="editData.ac.shield" type="number" class="w-full bg-card/50 border border-border rounded-md px-2 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none tabular-nums" />
                  </div>
                  <div class="space-y-1">
                    <label class="text-[10px] font-semibold text-muted-foreground">Natural</label>
                    <input v-model.number="editData.ac.natural" type="number" class="w-full bg-card/50 border border-border rounded-md px-2 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none tabular-nums" />
                  </div>
                  <div class="space-y-1">
                    <label class="text-[10px] font-semibold text-muted-foreground">Deflexão</label>
                    <input v-model.number="editData.ac.deflection" type="number" class="w-full bg-card/50 border border-border rounded-md px-2 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none tabular-nums" />
                  </div>
                  <div class="space-y-1">
                    <label class="text-[10px] font-semibold text-muted-foreground">Tamanho</label>
                    <input v-model.number="editData.ac.size" type="number" class="w-full bg-card/50 border border-border rounded-md px-2 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none tabular-nums" />
                  </div>
                  <div class="space-y-1">
                    <label class="text-[10px] font-semibold text-muted-foreground">Outros</label>
                    <input v-model.number="editData.ac.misc" type="number" class="w-full bg-card/50 border border-border rounded-md px-2 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none tabular-nums" />
                  </div>
                </div>
              </div>

              <!-- Salvaguardas & Misc -->
              <div>
                <h4 class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Salvaguardas & Extras</h4>
                <div class="grid grid-cols-2 gap-3">
                  <div class="space-y-1">
                    <label class="text-[10px] font-semibold text-muted-foreground">Fortitude</label>
                    <input v-model.number="editData.save_fort" type="number" class="w-full bg-card/50 border border-border rounded-md px-2 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none tabular-nums" />
                  </div>
                  <div class="space-y-1">
                    <label class="text-[10px] font-semibold text-muted-foreground">Init Extra</label>
                    <input v-model.number="editData.initiative_misc" type="number" class="w-full bg-card/50 border border-border rounded-md px-2 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none tabular-nums" />
                  </div>
                  <div class="space-y-1">
                    <label class="text-[10px] font-semibold text-muted-foreground">Reflexos</label>
                    <input v-model.number="editData.save_ref" type="number" class="w-full bg-card/50 border border-border rounded-md px-2 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none tabular-nums" />
                  </div>
                  <div class="space-y-1">
                    <label class="text-[10px] font-semibold text-muted-foreground">Vontade</label>
                    <input v-model.number="editData.save_will" type="number" class="w-full bg-card/50 border border-border rounded-md px-2 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none tabular-nums" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Condições -->
          <section class="bg-muted/20 border border-border/60 rounded-xl p-5">
            <h3 class="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary mb-4 pb-2 border-b border-border/80">Condições & Status</h3>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <label v-for="(_, key) in editData.conditions" :key="key" 
                class="flex items-center gap-2 p-2 rounded-lg border border-border/50 cursor-pointer transition-colors"
                :class="editData.conditions[key] ? 'bg-red-500/10 border-red-500/30' : 'bg-card/30 hover:bg-accent/40'">
                <input type="checkbox" v-model="editData.conditions[key]" class="w-3.5 h-3.5 rounded border-border bg-muted text-red-600 focus:ring-red-500/50" />
                <span class="text-[10px] font-bold uppercase tracking-wider transition-colors"
                  :class="editData.conditions[key] ? 'text-red-400' : 'text-muted-foreground'">{{ key }}</span>
              </label>
            </div>
          </section>
        </div>

        <!-- Footer -->
        <div class="p-4 border-t border-border/60 bg-muted/40 flex justify-end gap-3">
          <button @click="close" class="px-5 py-2.5 rounded-lg border border-border text-sm font-semibold text-foreground/80 hover:bg-accent transition-colors">
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
