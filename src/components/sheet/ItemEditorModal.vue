<script setup lang="ts">
import { ref } from 'vue'
import { X, Plus, Trash2, BookOpen, Sword, Zap, Package, Flame } from 'lucide-vue-next'
import { MODIFIER_TARGETS } from '@/data/sheetConstants'

const props = defineProps<{
  modelValue: boolean
  type: 'feat' | 'spell' | 'shortcut' | 'equipment' | 'buff'
  item: any
  index: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'save', item: any): void
}>()

const form = ref<any>({})

// Sync with item prop
import { watch } from 'vue'
watch(() => props.item, (val) => {
  const parsed = val ? JSON.parse(JSON.stringify({
    attackFormula: '', damageFormula: '', rollFormula: '', modifiers: [], dynamicRolls: [],
    isAttack: false, spellLevel: 1, applyBuffName: '', applyBuffValue: '', ...val
  })) : {}

  if (props.type === 'spell' && (!parsed.dynamicRolls || parsed.dynamicRolls.length === 0)) {
    parsed.dynamicRolls = []
    if (parsed.isAttack && (parsed.attackFormula || parsed.damageFormula)) {
      if (parsed.attackFormula) parsed.dynamicRolls.push({ label: 'Ataque', formula: parsed.attackFormula, higherLevel: '' })
      if (parsed.damageFormula) parsed.dynamicRolls.push({ label: 'Dano', formula: parsed.damageFormula, higherLevel: '' })
    } else if (parsed.rollFormula) {
      parsed.dynamicRolls.push({ label: 'Efeito', formula: parsed.rollFormula, higherLevel: '' })
    }
  }

  form.value = parsed
}, { immediate: true })

function close() { emit('update:modelValue', false) }
function addModifier() {
  if (!form.value.modifiers) form.value.modifiers = []
  form.value.modifiers.push({ target: 'str', value: 1 })
}
function removeModifier(i: number | string) { form.value.modifiers.splice(Number(i), 1) }

function addDynamicRoll() {
  if (!form.value.dynamicRolls) form.value.dynamicRolls = []
  form.value.dynamicRolls.push({ label: 'Dano', formula: '', higherLevel: '' })
}
function removeDynamicRoll(i: number | string) { form.value.dynamicRolls.splice(Number(i), 1) }
function save() {
  if (!form.value.title?.trim()) return
  emit('save', { ...form.value })
  close()
}

const TYPE_ICON = { spell: BookOpen, shortcut: Sword, equipment: Package, buff: Flame, feat: Zap }
const TYPE_LABELS: Record<string, string> = { feat: 'Talento', spell: 'Magia', shortcut: 'Atalho', equipment: 'Item', buff: 'Buff/Condição' }
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4" @click.self="close">
      <div class="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div class="flex items-center gap-2">
            <component :is="TYPE_ICON[type]" class="w-4 h-4 text-primary" />
            <h3 class="font-bold text-zinc-100">
              {{ index === -1 ? 'Novo' : 'Editar' }} {{ TYPE_LABELS[type] }}
            </h3>
          </div>
          <button @click="close" class="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors">
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Body -->
        <div class="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <!-- Title -->
          <div>
            <label class="text-xs font-bold uppercase tracking-widest text-zinc-500 block mb-1.5">Título</label>
            <input v-model="form.title" placeholder="Ex: Bola de Fogo"
              class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-primary/60" />
          </div>

          <!-- Spell fields -->
          <template v-if="type === 'spell'">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-xs font-bold uppercase tracking-widest text-zinc-500 block mb-1.5">Nível</label>
                <input v-model.number="form.spellLevel" type="number" min="0" max="9"
                  class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-primary/60" />
              </div>
              <div>
                <label class="text-xs font-bold uppercase tracking-widest text-zinc-500 block mb-1.5">Escola</label>
                <input v-model="form.school" placeholder="Evocação"
                  class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-primary/60" />
              </div>
              <div>
                <label class="text-xs font-bold uppercase tracking-widest text-zinc-500 block mb-1.5">Tempo</label>
                <input v-model="form.castingTime" placeholder="1 ação padrão"
                  class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-primary/60" />
              </div>
              <div>
                <label class="text-xs font-bold uppercase tracking-widest text-zinc-500 block mb-1.5">Alcance</label>
                <input v-model="form.range" placeholder="Médio"
                  class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-primary/60" />
              </div>
              <div>
                <label class="text-xs font-bold uppercase tracking-widest text-zinc-500 block mb-1.5">Alvo/Área</label>
                <input v-model="form.target" placeholder="Círculo de 6m"
                  class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-primary/60" />
              </div>
              <div>
                <label class="text-xs font-bold uppercase tracking-widest text-zinc-500 block mb-1.5">Duração</label>
                <input v-model="form.duration" placeholder="Instantânea"
                  class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-primary/60" />
              </div>
              <div>
                <label class="text-xs font-bold uppercase tracking-widest text-zinc-500 block mb-1.5">Resistência</label>
                <input v-model="form.savingThrow" placeholder="Reflexos anula"
                  class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-primary/60" />
              </div>
              <div>
                <label class="text-xs font-bold uppercase tracking-widest text-zinc-500 block mb-1.5">RM?</label>
                <input v-model="form.spellResist" placeholder="Sim"
                  class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-primary/60" />
              </div>
            </div>

            <!-- Auto-Buff -->
            <div class="mt-4 p-3 border border-indigo-900/50 bg-indigo-950/20 rounded-lg space-y-3">
              <h4 class="text-xs font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-1.5">
                <Flame class="w-3.5 h-3.5" /> Buff Automático
              </h4>
              <p class="text-[10px] text-zinc-400 leading-tight">Ao "Lançar" (gastar o slot) com estes campos preenchidos, o sistema criará um Buff ativo automaticamente.</p>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="text-[10px] font-bold uppercase text-zinc-500 block mb-1">Nome do Buff</label>
                  <input v-model="form.applyBuffName" placeholder="Ex: Armadura Mágica"
                    class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label class="text-[10px] font-bold uppercase text-zinc-500 block mb-1">Efeito / Valor</label>
                  <input v-model="form.applyBuffValue" placeholder="Ex: +4 CA"
                    class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
            </div>
          </template>

          <!-- Equipment fields -->
          <template v-if="type === 'equipment'">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-xs font-bold uppercase tracking-widest text-zinc-500 block mb-1.5">Peso (kg)</label>
                <input v-model.number="form.weight" type="number" min="0"
                  class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-primary/60" />
              </div>
              <div class="flex items-end pb-2">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" v-model="form.equipped" class="w-4 h-4 rounded accent-primary" />
                  <span class="text-sm text-zinc-300">Equipado</span>
                </label>
              </div>
            </div>
          </template>

          <!-- Shortcut fields -->
          <template v-if="type === 'shortcut'">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-xs font-bold uppercase tracking-widest text-zinc-500 block mb-1.5">Bônus Ataque</label>
                <input v-model="form.attackBonus" placeholder="+5"
                  class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-primary/60" />
              </div>
              <div>
                <label class="text-xs font-bold uppercase tracking-widest text-zinc-500 block mb-1.5">Custo/Uso</label>
                <input v-model="form.cost" placeholder="1/dia"
                  class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-primary/60" />
              </div>
            </div>
          </template>

          <!-- Description -->
          <div>
            <label class="text-xs font-bold uppercase tracking-widest text-zinc-500 block mb-1.5">Descrição</label>
            <textarea v-model="form.description" placeholder="Descreva o efeito..."
              class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-primary/60 resize-none min-h-[6rem]" />
          </div>

          <!-- Attack toggle -->
          <div v-if="type !== 'equipment' && type !== 'buff'">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="form.isAttack" class="w-4 h-4 rounded accent-primary" />
              <span class="text-sm text-zinc-300">É um ataque/magia ofensiva</span>
            </label>
          </div>

          <!-- Spell Dynamic Rolls -->
          <div v-if="type === 'spell'" class="space-y-3 mt-4">
             <div class="flex items-center justify-between border-b border-zinc-800 pb-2">
                <h4 class="text-xs font-bold uppercase tracking-widest text-zinc-400">Dados de Rolagem</h4>
                <button @click="addDynamicRoll" class="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-1 rounded transition-colors flex items-center gap-1"><Plus class="w-3 h-3"/> Add Rolagem</button>
             </div>
             
             <div v-if="!form.dynamicRolls || form.dynamicRolls.length === 0" class="text-center py-2 text-xs text-zinc-600">
               Nenhum dado de rolagem configurado. (A magia apenas fará efeito passivo/buff ou usará descrição).
             </div>
             
             <div class="space-y-3">
                <div v-for="(roll, idx) in form.dynamicRolls" :key="idx" class="p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg space-y-2 relative group">
                   <button @click="removeDynamicRoll(idx)" class="absolute top-2 right-2 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 class="w-4 h-4" /></button>
                   
                   <div class="grid grid-cols-2 gap-2 pr-6">
                      <div>
                         <label class="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">Rótulo / Nome</label>
                         <input v-model="roll.label" placeholder="Ex: Dano Fogo" class="w-full bg-zinc-950 border border-zinc-700 rounded p-1.5 text-xs text-zinc-200 focus:border-primary/60 outline-none" />
                      </div>
                      <div>
                         <label class="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">Fórmula Base</label>
                         <input v-model="roll.formula" placeholder="Ex: 8d6" class="w-full bg-zinc-950 border border-zinc-700 rounded p-1.5 text-xs text-zinc-200 font-mono focus:border-primary/60 outline-none" />
                      </div>
                      <div class="col-span-2">
                         <label class="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">Modificador Nível Maior</label>
                         <input v-model="roll.higherLevel" placeholder="Ex: +1d6 (por nível acima)" class="w-full bg-zinc-950 border border-zinc-700 rounded p-1.5 text-xs text-zinc-200 font-mono focus:border-primary/60 outline-none" />
                      </div>
                   </div>
                </div>
             </div>
          </div>

          <!-- Roll formulas (Non-Spells) -->
          <template v-else>
            <div v-if="!form.isAttack && type !== 'equipment'">
              <label class="text-xs font-bold uppercase tracking-widest text-zinc-500 block mb-1.5">Fórmula</label>
              <input v-model="form.rollFormula" placeholder="Ex: 1d20 + @intMod"
                class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 font-mono placeholder-zinc-600 focus:outline-none focus:border-primary/60" />
            </div>
            <div v-else-if="form.isAttack" class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-xs font-bold uppercase tracking-widest text-zinc-500 block mb-1.5">Fórmula Ataque</label>
                <input v-model="form.attackFormula" placeholder="1d20 + @BBA"
                  class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 font-mono placeholder-zinc-600 focus:outline-none focus:border-primary/60" />
              </div>
              <div>
                <label class="text-xs font-bold uppercase tracking-widest text-zinc-500 block mb-1.5">Fórmula Dano</label>
                <input v-model="form.damageFormula" placeholder="1d8 + @strMod"
                  class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 font-mono placeholder-zinc-600 focus:outline-none focus:border-primary/60" />
              </div>
            </div>
          </template>

          <!-- Modifiers -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-xs font-bold uppercase tracking-widest text-zinc-500">Modificadores Passivos</label>
              <button @click="addModifier" class="text-xs text-primary hover:text-primary/80 flex items-center gap-1">
                <Plus class="w-3 h-3" /> Adicionar
              </button>
            </div>
            <div class="space-y-2 max-h-[8rem] overflow-y-auto">
              <div v-for="(mod, i) in form.modifiers" :key="i" class="flex gap-2 items-center">
                <select v-model="mod.target"
                  class="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-primary/60">
                  <option v-for="t in MODIFIER_TARGETS" :key="t.value" :value="t.value">{{ t.label }}</option>
                </select>
                <input type="number" v-model.number="mod.value"
                  class="w-16 text-center bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm text-zinc-200 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none" />
                <button @click="removeModifier(i)" class="text-zinc-600 hover:text-red-500 transition-colors p-1">
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex justify-end gap-2 px-5 py-4 border-t border-zinc-800 bg-zinc-900/50">
          <button @click="close" class="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors">
            Cancelar
          </button>
          <button @click="save" :disabled="!form.title?.trim()"
            class="px-4 py-2 text-sm font-bold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            Salvar
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
