<script setup lang="ts">
import { ChevronDown, ChevronUp, Swords, Zap, Package, Flame, ShieldAlert, MessageSquare } from 'lucide-vue-next'
import { ref, computed } from 'vue'
import VitalsBlock from '@/components/sheet/blocks/VitalsBlock.vue'
import AttrsBlock from '@/components/sheet/blocks/AttrsBlock.vue'
import CombatBlock from '@/components/sheet/blocks/CombatBlock.vue'
import ShortcutsBlock from '@/components/sheet/blocks/ShortcutsBlock.vue'
import ResourcesBlock from '@/components/sheet/blocks/ResourcesBlock.vue'
import type { Sheet } from '@/types/sheet'

const props = defineProps<{
  sheet: Sheet
  d: any
  editMode: boolean
  editedData: any

  // combat
  totalHP: number
  totalCA: number
  totalTouch: number
  totalFlatFooted: number
  totalBAB: number
  totalInitiative: number
  totalSpeed: number
  meleeAtk: number
  rangedAtk: number
  grappleAtk: number
  totalFort: number
  totalRef: number
  totalWill: number
  deathStatus: { label: string; color: string } | null
  // attrs
  attrTotal: (key: string) => number
  calcMod: (n: number) => number
  modStr: (n: number) => string
  modStrF: (n: number) => string
  resolveFormula: (formula: string) => string
  ATTR_KEYS: readonly string[]
  ATTR_LABELS: Record<string, string>
  onShowDescription: (title: string, desc: string) => void
}>()

const activeFeats = computed(() => (props.d?.feats || []).filter((f: any) => f.active && f.activeModifiers?.length > 0))
const activeEquipment = computed(() => (props.d?.equipment || []).filter((e: any) => e.equipped && e.active && e.activeModifiers?.length > 0))

const emit = defineEmits<{
  (e: 'save-hp'): void
  (e: 'roll', label: string, formula: string): void
  (e: 'roll-item', item: any): void
  (e: 'add-shortcut'): void
  (e: 'delete-shortcut', i: number): void
  (e: 'add-resource', name: string, max: number): void
  (e: 'adjust-resource', i: number, delta: number): void
  (e: 'reset-resources'): void
  (e: 'delete-resource', i: number): void
  (e: 'toggle-buff', i: number): void
  (e: 'toggle-feat-active', i: number): void
  (e: 'toggle-equipment-active', i: number): void
  (e: 'toggle-equipped', i: number): void
}>()

// ── Collapsible summary panels ────────────────────────────────────────
const openPanels = ref<string[]>([])
function togglePanel(id: string) {
  const idx = openPanels.value.indexOf(id)
  if (idx >= 0) openPanels.value.splice(idx, 1)
  else openPanels.value.push(id)
}
function isPanelOpen(id: string) {
  return openPanels.value.includes(id)
}

const ALL_PANELS = [

  { id: 'feats',     label: 'Talentos',     icon: Swords },
  { id: 'equipment', label: 'Equipamentos', icon: Package },
  { id: 'buffs',     label: 'Buffs',        icon: Flame },
]

const visiblePanels = computed(() => {
  const layout = props.d?.resumeLayout
  if (Array.isArray(layout) && layout.length > 0) {
    return ALL_PANELS.filter((p: any) => layout.includes(p.id))
  }
  return ALL_PANELS
})

function togglePanelVisibility(id: string) {
  if (!props.d) return
  const layout = Array.isArray(props.d.resumeLayout) ? [...props.d.resumeLayout] : ALL_PANELS.map(p => p.id)
  if (layout.includes(id)) {
    props.d.resumeLayout = layout.filter(x => x !== id)
  } else {
    props.d.resumeLayout = [...layout, id]
  }
}

function panelCount(id: string) {
  return (props.d as any)?.[id]?.length ?? 0
}
</script>

<template>
  <div class="space-y-3">

    <!--
      ═══════════════════════════════════════════════════════════
      MAIN GRID  (fixed layout, no drag-and-drop)
      ─────────────────────────────────────────────────────────
      2 columns:  [attrs-col]  [content-col]
      ═══════════════════════════════════════════════════════════
    -->
    <div class="grid gap-3" style="grid-template-columns: auto 1fr;">

      <!-- ── LEFT: Attributes (vertical label) ────────────────── -->
      <div class="row-span-3">
        <AttrsBlock
          :attr-total="attrTotal"
          :calc-mod="calcMod"
          :mod-str="modStr"
          :edit-mode="editMode"
          :edited-data="editedData"
          :ATTR_KEYS="ATTR_KEYS"
          :ATTR_LABELS="ATTR_LABELS"
          :on-roll="(l, f) => emit('roll', l, f)"
          :vertical="true"
        />
      </div>

      <!-- ── RIGHT column: inner 3-row layout ─────────────────── -->

      <!-- Row 1: VIDA  |  SAVE (Fort/Ref/Will)  |  BUFFS resumo -->
      <div class="grid gap-3" style="grid-template-columns: 1fr 1fr 1fr;">

        <!-- VIDA -->
        <VitalsBlock
          :sheet="sheet"
          :total-h-p="totalHP"
          :death-status="deathStatus"
          :on-save-h-p="() => emit('save-hp')"
        />

        <!-- SAVES -->
        <div class="rounded-xl border border-border bg-card/80 p-4 flex flex-col gap-2 justify-start">
          <div class="flex items-center gap-2 mb-2">
            <ShieldAlert class="w-4 h-4 text-muted-foreground" />
            <span class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Salvaguardas</span>
          </div>
          <button @click="emit('roll', 'Fortitude', '1d20 + @fort')"
            class="rounded-lg bg-muted/60 border border-border px-2 py-1.5 hover:border-primary/40 hover:bg-primary/5 transition-colors flex flex-col items-center">
            <div class="text-[10px] text-muted-foreground font-bold uppercase mb-0.5">Fortitude</div>
            <div class="text-base font-extrabold font-serif text-foreground">{{ modStr(totalFort) }}</div>
          </button>
          <button @click="emit('roll', 'Reflexos', '1d20 + @ref')"
            class="rounded-lg bg-muted/60 border border-border px-2 py-1.5 hover:border-primary/40 hover:bg-primary/5 transition-colors flex flex-col items-center">
            <div class="text-[10px] text-muted-foreground font-bold uppercase mb-0.5">Reflexos</div>
            <div class="text-base font-extrabold font-serif text-foreground">{{ modStr(totalRef) }}</div>
          </button>
          <button @click="emit('roll', 'Vontade', '1d20 + @will')"
            class="rounded-lg bg-muted/60 border border-border px-2 py-1.5 hover:border-primary/40 hover:bg-primary/5 transition-colors flex flex-col items-center">
            <div class="text-[10px] text-muted-foreground font-bold uppercase mb-0.5">Vontade</div>
            <div class="text-base font-extrabold font-serif text-foreground">{{ modStr(totalWill) }}</div>
          </button>
        </div>

        <!-- CONDITIONS & BUFFS mini-list -->
        <div class="rounded-xl border border-border bg-card/80 p-4 overflow-hidden flex flex-col justify-start">
          <div class="flex items-center gap-2 mb-2">
            <Flame class="w-4 h-4 text-muted-foreground" />
            <span class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Status & Buffs</span>
          </div>
          <div v-if="!d?.buffs?.length && !Object.values(d?.conditions || {}).some(v => v) && !activeFeats.length && !activeEquipment.length"
            class="text-center py-3 text-muted-foreground/60 text-xs text-balance">Nenhum status ativo.</div>
          <div v-else class="space-y-1 overflow-y-auto max-h-40">
            <!-- Conditions -->
            <template v-if="d.conditions">
              <div v-for="(active, key) in d.conditions" :key="'cond-'+key">
                <div v-if="active" 
                   class="flex items-center gap-2 py-1 px-1.5 rounded bg-red-500/10 border border-red-500/20 text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0"></span>
                  {{ key }}
                </div>
              </div>
            </template>

            <!-- Active Feats Buffs -->
            <div v-for="(feat, i) in d.feats" :key="'feat-buff-'+i">
              <div v-if="feat.active && feat.activeModifiers?.length"
                @click="emit('toggle-feat-active', Number(i))"
                class="flex items-center gap-2 py-1.5 border-b border-border/40 last:border-0 cursor-pointer hover:bg-muted/50 px-1 rounded transition-colors group">
                <button class="flex items-center justify-center w-5 h-5 rounded-md border bg-cyan-500/20 border-cyan-500/50 text-cyan-400 shrink-0">
                  <Zap class="w-3 h-3 fill-cyan-500/50" />
                </button>
                <span class="text-xs truncate text-foreground flex-1">{{ feat.title }}</span>
                <button v-if="feat.description"
                  @click.stop="onShowDescription(feat.title, feat.description)"
                  class="p-1 px-2 text-muted-foreground hover:text-primary transition-all rounded hover:bg-muted" title="Ver descrição no chat">
                  <MessageSquare class="w-3 h-3" />
                </button>
              </div>
            </div>

            <!-- Active Equipment Buffs -->
            <div v-for="(item, i) in d.equipment" :key="'item-buff-'+i">
              <div v-if="item.equipped && item.active && item.activeModifiers?.length"
                @click="emit('toggle-equipment-active', Number(i))"
                class="flex items-center gap-2 py-1.5 border-b border-border/40 last:border-0 cursor-pointer hover:bg-muted/50 px-1 rounded transition-colors group">
                <button class="flex items-center justify-center w-5 h-5 rounded-md border bg-blue-500/20 border-blue-500/50 text-blue-400 shrink-0">
                  <Package class="w-3 h-3 fill-blue-500/50" />
                </button>
                <span class="text-xs truncate text-foreground flex-1">{{ item.title }}</span>
                <button v-if="item.description"
                  @click.stop="onShowDescription(item.title, item.description)"
                  class="p-1 px-2 text-muted-foreground hover:text-primary transition-all rounded hover:bg-muted" title="Ver descrição no chat">
                  <MessageSquare class="w-3 h-3" />
                </button>
              </div>
            </div>

            <!-- Buffs -->
            <div v-for="(buf, i) in d.buffs" :key="i"
              class="flex items-center gap-2 py-1.5 border-b border-border/40 last:border-0 cursor-pointer hover:bg-muted/50 px-1 rounded transition-colors group"
              @click="emit('toggle-buff', Number(i))">
              <button 
                class="flex items-center justify-center w-5 h-5 rounded-md border transition-colors shrink-0"
                :class="buf.active ? 'bg-orange-500/20 border-orange-500/50 text-orange-400' : 'bg-muted border-border text-muted-foreground'">
                <Flame class="w-3 h-3" :class="buf.active ? 'fill-orange-500/50 text-orange-400' : ''" />
              </button>
              <span class="text-xs truncate transition-colors flex-1"
                :class="buf.active ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground/70'">
                {{ buf.title }}
              </span>
              <div class="flex items-center gap-1">
                <button v-if="buf.description"
                  @click.stop="onShowDescription(buf.title, buf.description)"
                  class="p-1 text-muted-foreground hover:text-primary transition-all rounded hover:bg-muted" title="Ver descrição no chat">
                  <MessageSquare class="w-3 h-3" />
                </button>
                <button v-if="buf.isAttack"
                  @click.stop="emit('roll-item', buf)"
                  class="text-[10px] px-1.5 py-0.5 rounded bg-red-900/20 border border-red-800/40 text-red-200 hover:bg-red-800/40 transition-colors">
                  Atacar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Row 2: Recursos de Combate (full-width within right col) -->
      <CombatBlock
        :mod-str="modStr"
        :total-c-a="totalCA"
        :total-touch="totalTouch"
        :total-flat-footed="totalFlatFooted"
        :total-b-a-b="totalBAB"
        :total-initiative="totalInitiative"
        :total-speed="totalSpeed"
        :melee-atk="meleeAtk"
        :ranged-atk="rangedAtk"
        :grapple-atk="grappleAtk"
        :total-fort="totalFort"
        :total-ref="totalRef"
        :total-will="totalWill"
        :on-roll="(l, f) => emit('roll', l, f)"
        :hide-saves="true"
      />

      <!-- Row 3: Atalhos + Recursos -->
      <div class="grid gap-3" style="grid-template-columns: 2fr 1fr;">
        <ShortcutsBlock
          :d="d"
          :mod-str="modStr"
          :resolve-formula="resolveFormula"
          :edit-mode="editMode"
          :on-roll-item="(item) => emit('roll-item', item)"
          :on-add-shortcut="() => emit('add-shortcut')"
          :on-delete-shortcut="(idx) => emit('delete-shortcut', idx)"
          :onShowDescription="onShowDescription"
        />
        <ResourcesBlock
          :sheet="sheet"
          :edit-mode="editMode"
          :on-adjust="(idx, delta) => emit('adjust-resource', idx, delta)"
          :on-reset="() => emit('reset-resources')"
          :on-add="(n, m) => emit('add-resource', n, m)"
          :on-delete="(idx) => emit('delete-resource', idx)"
        />
      </div>
    </div>

    <!-- ── Collapsible panels (Magias / Talentos / Equipamentos / Buffs) ── -->
    <div class="space-y-2 pt-1">
      
      <!-- Painéis de configuração (Edit Mode) -->
      <div v-if="editMode" class="flex flex-wrap gap-2 mb-2 p-3 rounded-xl border border-primary/20 bg-primary/5">
        <span class="text-xs text-primary font-bold w-full mb-1">Painéis Visíveis no Resumo (clique para ativar/desativar):</span>
        <button v-for="panel in ALL_PANELS" :key="'toggle-'+panel.id"
          @click="togglePanelVisibility(panel.id)"
          class="px-2 py-1 rounded border text-xs font-semibold transition-colors"
          :class="visiblePanels.some(p => p.id === panel.id) ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-border'">
          {{ panel.label }}
        </button>
      </div>

      <div v-for="panel in visiblePanels" :key="panel.id"
        class="rounded-xl border border-border bg-card/60 overflow-hidden">

        <!-- Panel header -->
        <button
          class="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors"
          @click="togglePanel(panel.id)">
          <div class="flex items-center gap-2">
            <component :is="panel.icon" class="w-4 h-4 text-muted-foreground" />
            <span class="text-sm font-bold text-foreground/80">{{ panel.label }}</span>
            <span class="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">{{ panelCount(panel.id) }}</span>
          </div>
          <ChevronDown v-if="!isPanelOpen(panel.id)" class="w-4 h-4 text-muted-foreground" />
          <ChevronUp v-else class="w-4 h-4 text-muted-foreground" />
        </button>

        <!-- Panel content -->
        <div v-if="isPanelOpen(panel.id)" class="border-t border-border/50 px-4 py-3 space-y-2">


          <!-- TALENTOS -->
          <template v-if="panel.id === 'feats'">
            <div v-if="!d?.feats?.length" class="text-center py-4 text-muted-foreground text-xs">Nenhum talento.</div>
            <div v-else class="space-y-1">
              <div v-for="(feat, i) in d.feats" :key="i"
                class="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0">
                <div class="flex items-center gap-2">
                  <component :is="feat.isAttack ? Swords : Zap"
                    class="w-3.5 h-3.5 shrink-0"
                    :class="feat.isAttack ? 'text-red-400' : 'text-primary'" />
                  <span class="text-sm font-semibold text-foreground">{{ feat.title }}</span>
                </div>
                <div class="flex items-center gap-1">
                  <button v-if="feat.description"
                    @click.stop="onShowDescription(feat.title, feat.description)"
                    class="p-1 text-muted-foreground hover:text-primary transition-all rounded hover:bg-muted">
                    <MessageSquare class="w-3.5 h-3.5" />
                  </button>
                  <button v-if="feat.isAttack"
                    @click="emit('roll-item', feat)"
                    class="text-xs px-2 py-0.5 rounded bg-muted border border-border text-foreground/80 hover:bg-muted/80 transition-colors">
                    Atacar
                  </button>
                  <button v-else-if="feat.rollFormula"
                    @click="emit('roll', feat.title, feat.rollFormula)"
                    class="text-xs px-2 py-0.5 rounded bg-muted border border-border text-foreground/80 hover:bg-muted/80 transition-colors">
                    Rolar
                  </button>
                </div>
              </div>
            </div>
          </template>

          <!-- EQUIPAMENTOS -->
          <template v-else-if="panel.id === 'equipment'">
            <div v-if="!d?.equipment?.length" class="text-center py-4 text-muted-foreground text-xs">Nenhum item.</div>
            <div v-else class="space-y-1">
              <div v-for="(item, i) in d.equipment" :key="i"
                class="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0 cursor-pointer hover:bg-muted/10 px-2 rounded -mx-2 transition-colors"
                @click="emit('toggle-equipped', Number(i))">
                <div class="flex-1">
                  <span class="text-sm font-semibold transition-colors"
                    :class="item.equipped ? 'text-primary/90' : 'text-foreground/80 group-hover:text-foreground'">{{ item.title }}</span>
                  <span v-if="item.equipped" class="ml-2 text-[10px] text-primary/50">• equipado</span>
                  <span v-if="item.weight" class="ml-2 text-[10px] text-muted-foreground/50">{{ item.weight }}kg</span>
                </div>
                <div class="flex items-center gap-2">
                  <button v-if="item.description"
                    @click.stop="onShowDescription(item.title, item.description)"
                    class="p-1 text-muted-foreground hover:text-primary transition-all rounded hover:bg-muted">
                    <MessageSquare class="w-3.5 h-3.5" />
                  </button>
                  <button v-if="item.isAttack"
                    @click.stop="emit('roll-item', item)"
                    class="text-[10px] px-1.5 py-0.5 rounded bg-red-900/20 border border-red-800/40 text-red-200 hover:bg-red-800/40 transition-colors">
                    Atacar
                  </button>
                  <!-- checkbox / switch visual indicator -->
                  <div class="w-8 h-4 rounded-full border flex items-center p-0.5 transition-colors"
                      :class="item.equipped ? 'border-primary/50 bg-primary/20 justify-end' : 'border-border bg-muted justify-start'">
                      <div class="w-3 h-3 rounded-full bg-current"
                            :class="item.equipped ? 'text-primary' : 'text-muted-foreground'"></div>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- BUFFS -->
          <template v-else-if="panel.id === 'buffs'">
            <div v-if="!d?.buffs?.length" class="text-center py-4 text-muted-foreground text-xs">Nenhum buff.</div>
            <div v-else class="space-y-1">
              <div v-for="(buf, i) in d.buffs" :key="i"
                class="flex items-center gap-3 py-1.5 border-b border-border/40 last:border-0 cursor-pointer hover:bg-muted/10 px-2 rounded -mx-2 transition-colors"
                @click="emit('toggle-buff', Number(i))">
                <Flame class="w-3.5 h-3.5 shrink-0"
                  :class="buf.active ? 'text-primary' : 'text-muted-foreground'" />
                <div class="flex-1">
                  <span class="text-sm font-semibold"
                    :class="buf.active ? 'text-foreground' : 'text-muted-foreground'">{{ buf.title }}</span>
                  <div v-if="buf.modifiers?.length" class="text-[10px] text-muted-foreground/50 mt-0.5">
                    {{ buf.modifiers.map((m: any) => `${m.target} ${modStr(m.value)}`).join(' · ') }}
                  </div>
                </div>
                <!-- actions -->
                <div class="flex items-center gap-2">
                  <button v-if="buf.description"
                    @click.stop="onShowDescription(buf.title, buf.description)"
                    class="p-1 text-muted-foreground/60 hover:text-primary transition-all rounded hover:bg-accent">
                    <MessageSquare class="w-3.5 h-3.5" />
                  </button>
                  <!-- checkbox / switch visual indicator -->
                  <div class="w-8 h-4 rounded-full border flex items-center p-0.5 transition-colors"
                      :class="buf.active ? 'border-primary/50 bg-primary/20 justify-end' : 'border-border bg-muted justify-start'">
                      <div class="w-3 h-3 rounded-full bg-current"
                            :class="buf.active ? 'text-primary' : 'text-muted-foreground'"></div>
                  </div>
                </div>
              </div>
            </div>
          </template>

        </div>
      </div>
    </div>

  </div>
</template>
