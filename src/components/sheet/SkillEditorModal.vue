<script setup lang="ts">
import { ref, watch } from 'vue'
import { X, Plus, Trash2 } from 'lucide-vue-next'
import FieldTooltip from '@/components/ui/FieldTooltip.vue'


const props = defineProps<{
  modelValue: boolean
  skill: any | null
  index: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'save', skill: any, index: number): void
}>()

const ABILITY_OPTIONS = [
  { value: 'str', label: 'FOR — Força' },
  { value: 'dex', label: 'DES — Destreza' },
  { value: 'con', label: 'CON — Constituição' },
  { value: 'int', label: 'INT — Inteligência' },
  { value: 'wis', label: 'SAB — Sabedoria' },
  { value: 'cha', label: 'CAR — Carisma' },
]

const DEFAULT = {
  name: '',
  ability: 'str',
  ranks: 0,
  isClassSkill: false,
  trainedOnly: false,
  armorPenalty: false,
  description: '',
  // Bonus modifiers
  modifiers: [] as { label: string; value: number }[],
  // Override formula (custom roll instead of default 1d20+mod)
  customFormula: '',
}

const form = ref<any>({ ...DEFAULT })

watch(() => props.skill, (val) => {
  if (val) {
    form.value = { ...DEFAULT, ...JSON.parse(JSON.stringify(val)) }
  } else {
    form.value = { ...DEFAULT }
  }
}, { immediate: true })

function addModifier() {
  if (!form.value.modifiers) form.value.modifiers = []
  form.value.modifiers.push({ label: '', value: 0 })
}
function removeModifier(i: number) { form.value.modifiers.splice(i, 1) }

function close() { emit('update:modelValue', false) }
function save() {
  if (!form.value.name?.trim()) return
  emit('save', { ...form.value }, props.index)
  close()
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4" @click.self="close">
      <div class="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h3 class="font-bold text-foreground flex items-center gap-2">
            <span class="text-lg"></span>
            {{ index === -1 ? 'Nova Perícia' : 'Editar Perícia' }}
          </h3>
          <button @click="close" class="p-1.5 text-muted-foreground hover:text-foreground/80 hover:bg-accent rounded-lg transition-colors">
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Body -->
        <div class="p-5 space-y-4 overflow-y-auto flex-1">

          <!-- Nome e Atributo -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="field-label flex items-center">Nome da Perícia * <FieldTooltip text="Nome que aparecerá na lista de perícias corporais, sociais, etc." /></label>
              <input v-model="form.name" placeholder="Ex: Escalada, Furtividade..."
                class="field-input" />
            </div>
            <div>
              <label class="field-label flex items-center">Atributo Base <FieldTooltip text="O modificador deste atributo será somado nas rolagens" /></label>
              <select v-model="form.ability" class="field-input">
                <option v-for="a in ABILITY_OPTIONS" :key="a.value" :value="a.value">{{ a.label }}</option>
              </select>
            </div>
          </div>

          <!-- Ranks -->
          <div>
            <label class="field-label flex items-center">Graduações (Ranks) <FieldTooltip text="O número de pontos gastos ativamente nessa perícia" /></label>
            <input v-model.number="form.ranks" type="number" min="0"
              class="field-input" />
          </div>

          <!-- Flags -->
          <div class="grid grid-cols-1 gap-2">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="form.isClassSkill" class="w-4 h-4 rounded accent-primary" />
              <div>
                <span class="text-sm text-foreground/80 flex items-center">Perícia de Classe <FieldTooltip text="Garante +3 na rolagem caso você possua pelo menos 1 Rank" /></span>
              </div>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="form.trainedOnly" class="w-4 h-4 rounded accent-primary" />
              <div>
                <span class="text-sm text-foreground/80 flex items-center">Só pode ser usada com treinamento <FieldTooltip text="Exige graduação maior que 0 para poder rolar" /></span>
              </div>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="form.armorPenalty" class="w-4 h-4 rounded accent-primary" />
              <div>
                <span class="text-sm text-foreground/80 flex items-center">Penalidade de Armadura se aplica <FieldTooltip text="Reduz o valor total da perícia com base no tamanho e peso da sua armadura pesada" /></span>
              </div>
            </label>
          </div>

          <!-- Fórmula Customizada -->
          <div>
            <label class="field-label flex items-center">Fórmula de Rolagem <FieldTooltip text="Sobrescreve a matemática padrão do sistema para rolagens personalizadas" /> <span class="text-[10px] normal-case text-muted-foreground/60 ml-1">(opcional — sobrepõe o padrão)</span></label>
            <input v-model="form.customFormula" placeholder="Ex: 1d20 + @intMod + @level / 2"
              class="field-input font-mono text-sm" />
          </div>

          <!-- Modificadores Adicionais -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="field-label flex items-center mb-0">Bônus Adicionais <FieldTooltip text="Mods de equipamentos, raça, talentos etc que você deseja registrar na ficha" /></label>
              <button @click="addModifier"
                class="flex items-center gap-1 text-xs text-primary hover:text-primary/80 border border-primary/30 rounded-lg px-2 py-1 hover:bg-primary/5 transition-all">
                <Plus class="w-3 h-3" /> Adicionar
              </button>
            </div>
            <div v-if="form.modifiers?.length" class="space-y-2">
              <div v-for="(mod, i) in form.modifiers" :key="i" class="flex gap-2 items-center">
                <input v-model="mod.label" placeholder="Ex: Equip., Magia..."
                  class="flex-1 field-input-sm" />
                <input type="number" v-model.number="mod.value" placeholder="0"
                  class="w-20 text-center field-input-sm" />
                <button @click="removeModifier(Number(i))" class="p-1.5 text-muted-foreground/60 hover:text-red-500 transition-colors">
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <p v-else class="text-[11px] text-muted-foreground/40 italic py-1">Nenhum bônus adicional.</p>
          </div>

          <!-- Descrição -->
          <div>
            <label class="field-label flex items-center">Descrição / Notas <FieldTooltip text="Onde e em que contextos esta perícia é usada" /></label>
            <textarea v-model="form.description" placeholder="Use, regras, situações especiais..."
              class="field-input resize-none min-h-[4rem]" />
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
.field-input-sm {
  background-color: var(--muted);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  padding: 0.375rem 0.5rem;
  font-size: 0.875rem;
  color: var(--foreground);
  transition: border-color 0.15s;
}
.field-input-sm:focus {
  outline: none;
  border-color: color-mix(in srgb, var(--primary) 60%, transparent);
}
.field-input-sm::placeholder {
  color: var(--muted-foreground);
  opacity: 0.6;
}
</style>
