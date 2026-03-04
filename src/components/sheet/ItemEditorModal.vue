<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { X, Plus, Trash2, Sword, Zap, Package, Flame } from 'lucide-vue-next'
import FieldTooltip from '@/components/ui/FieldTooltip.vue'
import { MODIFIER_TARGETS } from '@/data/sheetConstants'

const props = defineProps<{
  modelValue: boolean
  type: 'feat' | 'shortcut' | 'equipment' | 'buff'
  item: any
  index: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'save', item: any): void
}>()

// ── Default form ────────────────────────────────────────────────────────────
const DEFAULT = {
  title: '',
  description: '',
  // Modifiers
  modifiers: [],         // passive (always applied when item is equipped/has effect)
  activeModifiers: [],   // active (applied only when active=true)
  // Activation
  active: false,
  // Formulas
  rollMode: 'none',      // 'none' | 'generic' | 'attack' | 'heal'
  rollFormula: '',        // generic roll
  attackFormula: '1d20 + @BBA',
  damageFormula: '1d8',
  healFormula: '1d8 + @level',
  // Formula activation toggles
  rollPassiveFormula: '',   // displayed passively (no dice, just a note)
  rollActiveFormula: '',    // rolled actively on button press (alias for rollFormula in generic mode)
  // Attack helpers (shortcut)
  attackBonus: '',
  cost: '',
  // Feat specific
  featType: '',
  requirements: '',
  // Equipment specific
  quantity: 1,
  price: 0,
  weight: 0,
  equipped: false,
  // isAttack kept for backwards compat — derived from rollMode
  isAttack: false,
}

const form = ref<any>({})

watch(() => props.item, (val) => {
  const base = { ...DEFAULT }
  if (val) {
    const src = JSON.parse(JSON.stringify(val))
    // Back-compat: if old item had isAttack=true but no rollMode, map it
    if (!src.rollMode) {
      src.rollMode = src.isAttack ? 'attack' : (src.rollFormula ? 'generic' : 'none')
    }
    Object.assign(base, src)
  }
  form.value = base
}, { immediate: true })

// ── Computed ─────────────────────────────────────────────────────────────────
const isAttackMode = computed(() => form.value.rollMode === 'attack')
const isHealMode   = computed(() => form.value.rollMode === 'heal')
const isGenericMode = computed(() => form.value.rollMode === 'generic')
const hasRoll      = computed(() => form.value.rollMode !== 'none')

// ── Actions ───────────────────────────────────────────────────────────────────
function close() { emit('update:modelValue', false) }

function addModifier(key: 'modifiers' | 'activeModifiers') {
  if (!form.value[key]) form.value[key] = []
  form.value[key].push({ target: 'str', value: 0 })
}
function removeModifier(key: 'modifiers' | 'activeModifiers', i: number) {
  form.value[key]?.splice(i, 1)
}

function save() {
  if (!form.value.title?.trim()) return
  // Sync isAttack from rollMode for backward compat
  const out = {
    ...form.value,
    isAttack: form.value.rollMode === 'attack',
  }
  emit('save', out)
  close()
}

// ── Display helpers ────────────────────────────────────────────────────────────
const TYPE_ICON: Record<string, any> = { shortcut: Sword, equipment: Package, buff: Flame, feat: Zap }
const TYPE_LABELS: Record<string, string> = { feat: 'Talento', shortcut: 'Atalho', equipment: 'Item', buff: 'Buff/Condição' }

// Roll mode options per type
const rollModeOptions = computed(() => {
  const base = [
    { value: 'none',    label: 'Nenhuma' },
    { value: 'generic', label: 'Rolar Fórmula' },
    { value: 'attack',  label: 'Ataque + Dano' },
    { value: 'heal',    label: 'Cura' },
  ]
  if (props.type === 'equipment') {
    return base  // all modes allowed for equipment
  }
  return base
})
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4" @click.self="close">
      <div class="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">

        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div class="flex items-center gap-2">
            <component :is="TYPE_ICON[type]" class="w-4 h-4 text-primary" />
            <h3 class="font-bold text-foreground">
              {{ index === -1 ? 'Novo' : 'Editar' }} {{ TYPE_LABELS[type] }}
            </h3>
          </div>
          <button @click="close" class="p-1.5 text-muted-foreground hover:text-foreground/80 hover:bg-accent rounded-lg transition-colors">
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Scrollable Body -->
        <div class="p-5 space-y-5 overflow-y-auto flex-1">

          <!-- ── TÍTULO ── -->
          <div>
            <label class="field-label flex items-center">Título * <FieldTooltip text="O nome principal que aparecerá na sua ficha" /></label>
            <input v-model="form.title" placeholder="Ex: Bola de Fogo"
              class="field-input" />
          </div>

          <!-- ── TIPO-SPECIFIC FIELDS ── -->

          <!-- feat -->
          <template v-if="type === 'feat'">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="field-label flex items-center">Tipo de Talento <FieldTooltip text="Ex: Combate, Magia, Geral, etc." /></label>
                <input v-model="form.featType" placeholder="Ex: Combate, Magia..."
                  class="field-input" />
              </div>
              <div>
                <label class="field-label flex items-center">Pré-requisitos <FieldTooltip text="Requisitos necessários para este talento" /></label>
                <input v-model="form.requirements" placeholder="Ex: For 13, BBA +1"
                  class="field-input" />
              </div>
            </div>
          </template>

          <!-- equipment -->
          <template v-if="type === 'equipment'">
            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="field-label flex items-center">Quantidade <FieldTooltip text="Quantidade de itens no seu inventário" /></label>
                <input v-model.number="form.quantity" type="number" min="1" class="field-input" />
              </div>
              <div>
                <label class="field-label flex items-center">Preço (PO) <FieldTooltip text="Valor do item em peças de ouro" /></label>
                <input v-model.number="form.price" type="number" min="0" step="0.1" class="field-input" />
              </div>
              <div>
                <label class="field-label flex items-center">Peso (kg) <FieldTooltip text="Peso total deste item na sua mochila" /></label>
                <input v-model.number="form.weight" type="number" min="0" step="0.1" class="field-input" />
              </div>
            </div>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="form.equipped" class="w-4 h-4 rounded accent-primary" />
              <span class="text-sm text-foreground/80 flex items-center">Equipado <FieldTooltip text="Modificadores ativos de itens equipados afetam a ficha" /></span>
            </label>
          </template>

          <!-- shortcut -->
          <template v-if="type === 'shortcut'">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="field-label flex items-center">Bônus Ataque Extra <FieldTooltip text="Valor somado junto ao botão de atalho" /></label>
                <input v-model="form.attackBonus" placeholder="+2" class="field-input" />
              </div>
              <div>
                <label class="field-label flex items-center">Custo / Uso <FieldTooltip text="A quantidade de usos que você tem deste atalho. Ex: 1/dia" /></label>
                <input v-model="form.cost" placeholder="1/dia" class="field-input" />
              </div>
            </div>
          </template>

          <!-- ── DESCRIÇÃO ── -->
          <div>
            <label class="field-label flex items-center">Descrição <FieldTooltip text="Descreva as anotações, regras ou flavor deste item" /></label>
            <textarea v-model="form.description" placeholder="Descreva o efeito, regras ou notas..."
              class="field-input resize-none min-h-[5rem]" />
          </div>

          <!-- ── SEÇÃO: ATIVAÇÃO ── -->
          <div class="section-card">
            <h4 class="section-title"> Ativação & Estado</h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Fórmula passiva (nota) -->
              <div>
                <label class="field-label flex items-center">Fórmula Passiva <FieldTooltip text="Cálculo ou nota passiva. Não rola quando você clica, ela apenas fica visível na descrição." /></label>
                <input v-model="form.rollPassiveFormula" placeholder="Ex: @level d6"
                  class="field-input font-mono text-sm" />
              </div>

              <!-- Active toggle (appears on sheet) -->
              <div class="flex flex-col gap-2 justify-center">
                <label class="flex items-center gap-2 cursor-pointer">
                  <div class="relative">
                    <input type="checkbox" v-model="form.active" class="sr-only peer" />
                    <div class="w-10 h-5 bg-muted rounded-full border border-border peer-checked:bg-primary/80 peer-checked:border-primary transition-all"></div>
                    <div class="absolute top-0.5 left-0.5 w-4 h-4 bg-white/60 rounded-full transition-all peer-checked:translate-x-5 peer-checked:bg-white"></div>
                  </div>
                  <span class="text-sm text-foreground/80 flex items-center">Ativado por padrão <FieldTooltip text="Permite usar modificadores no estado ativo diretamente na ficha" /></span>
                </label>
              </div>
            </div>
          </div>

          <!-- ── SEÇÃO: ROLAGEM ── -->
          <div class="section-card">
            <h4 class="section-title"> Rolagem</h4>

            <!-- Roll mode selector -->
            <div class="mb-4">
              <label class="field-label flex items-center">Modo de Rolagem <FieldTooltip text="O que acontece quando você clica neste botão na ficha?" /></label>
              <div class="flex flex-wrap gap-2">
                <button v-for="opt in rollModeOptions" :key="opt.value"
                  @click="form.rollMode = opt.value"
                  class="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                  :class="form.rollMode === opt.value
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-muted text-muted-foreground border-border hover:border-primary/50 hover:text-foreground/80'">
                  {{ opt.label }}
                </button>
              </div>
            </div>

            <!-- Generic roll -->
            <template v-if="isGenericMode">
              <div>
                <label class="field-label flex items-center">Fórmula Ativa <FieldTooltip text="A fórmula de dados/matemática que é jogada no chat, utilize tokens como @strMod @dexMod @level @BBA" /></label>
                <input v-model="form.rollFormula" placeholder="Ex: 1d20 + @intMod + @level"
                  class="field-input font-mono text-sm" />
              </div>
            </template>

            <!-- Attack roll -->
            <template v-if="isAttackMode">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="field-label flex items-center">Fórmula de Ataque <FieldTooltip text="Rola 1d20 para ver se você acertou" /></label>
                  <input v-model="form.attackFormula" placeholder="1d20 + @BBA"
                    class="field-input font-mono text-sm" />
                </div>
                <div>
                  <label class="field-label flex items-center">Fórmula de Dano <FieldTooltip text="Rola para ver o dano causado" /></label>
                  <input v-model="form.damageFormula" placeholder="1d8 + @strMod"
                    class="field-input font-mono text-sm" />
                </div>
              </div>
            </template>

            <!-- Heal roll -->
            <template v-if="isHealMode">
              <div>
                <label class="field-label flex items-center">Fórmula de Cura <FieldTooltip text="Fórmula do quanto será curado" /></label>
                <input v-model="form.healFormula" placeholder="1d8 + @level"
                  class="field-input font-mono text-sm" />
              </div>
            </template>

            <!-- None hint -->
            <template v-if="!hasRoll">
              <p class="text-[11px] text-muted-foreground/50 italic">Nenhuma rolagem associada. Selecione um modo acima para adicionar rolagem.</p>
            </template>
          </div>

          <!-- ── SEÇÃO: MODIFICADORES ── -->
          <div class="section-card">
            <h4 class="section-title"> Modificadores</h4>

            <!-- Passive Modifiers -->
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <div>
                  <span class="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center">Modificadores Passivos <FieldTooltip text="Aplicados permanentemente só de você ter o item no inventário (sem precisar ativar ou equipar)" /></span>
                </div>
                <button @click="addModifier('modifiers')"
                  class="flex items-center gap-1 text-xs text-primary hover:text-primary/80 border border-primary/30 rounded-lg px-2 py-1 hover:bg-primary/5 transition-all">
                  <Plus class="w-3 h-3" /> Adicionar
                </button>
              </div>
              <div v-if="form.modifiers?.length" class="space-y-2">
                <div v-for="(mod, i) in form.modifiers" :key="i" class="modifier-row">
                  <select v-model="mod.target" class="flex-1 field-input-sm">
                    <option v-for="t in MODIFIER_TARGETS" :key="t.value" :value="t.value">{{ t.label }}</option>
                  </select>
                  <input type="number" v-model.number="mod.value" placeholder="0"
                    class="w-20 text-center field-input-sm" />
                  <button @click="removeModifier('modifiers', Number(i))" class="p-1.5 text-muted-foreground/60 hover:text-red-500 transition-colors">
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p v-else class="text-[11px] text-muted-foreground/40 italic py-2">Nenhum modificador passivo.</p>
            </div>

            <!-- Divider -->
            <div class="border-t border-border/40 my-3"></div>

            <!-- Active Modifiers -->
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <div>
                  <span class="text-xs font-bold text-cyan-400/80 uppercase tracking-wider flex items-center">Modificadores Ativos <FieldTooltip text="Só se aplicam se você marcar este buff/item como ativado na ficha (ou equipado, no caso de equipamentos)" /></span>
                </div>
                <button @click="addModifier('activeModifiers')"
                  class="flex items-center gap-1 text-xs text-cyan-500 hover:text-cyan-400 border border-cyan-500/30 rounded-lg px-2 py-1 hover:bg-cyan-500/5 transition-all">
                  <Plus class="w-3 h-3" /> Adicionar
                </button>
              </div>
              <div v-if="form.activeModifiers?.length" class="space-y-2">
                <div v-for="(mod, i) in form.activeModifiers" :key="i" class="modifier-row">
                  <select v-model="mod.target" class="flex-1 field-input-sm border-cyan-500/30 focus:border-cyan-500/60">
                    <option v-for="t in MODIFIER_TARGETS" :key="t.value" :value="t.value">{{ t.label }}</option>
                  </select>
                  <input type="number" v-model.number="mod.value" placeholder="0"
                    class="w-20 text-center field-input-sm border-cyan-500/30 focus:border-cyan-500/60" />
                  <button @click="removeModifier('activeModifiers', Number(i))" class="p-1.5 text-muted-foreground/60 hover:text-red-500 transition-colors">
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p v-else class="text-[11px] text-muted-foreground/40 italic py-2">Nenhum modificador ativo.</p>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div class="flex justify-end gap-2 px-5 py-4 border-t border-border bg-muted/50 shrink-0">
          <button @click="close" class="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors">
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
  transition: border-color 0.15s, box-shadow 0.15s;
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
.section-card {
  padding: 1rem;
  background-color: color-mix(in srgb, var(--muted) 30%, transparent);
  border: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
  border-radius: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.section-title {
  font-size: 0.75rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--muted-foreground);
  margin-bottom: 0.25rem;
}
.modifier-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
</style>
