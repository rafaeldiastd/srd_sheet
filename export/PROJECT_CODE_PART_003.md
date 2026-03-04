

---
## FILE: src/components/sheet/tabs/SummaryTab.vue
```vue
<script setup lang="ts">
import { ChevronDown, ChevronUp, Swords, Zap, Package, Flame, ShieldAlert } from 'lucide-vue-next'
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
}>()

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
        <div class="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 flex flex-col gap-2 justify-start">
          <div class="flex items-center gap-2 mb-2">
            <ShieldAlert class="w-4 h-4 text-zinc-400" />
            <span class="text-xs font-bold uppercase tracking-widest text-zinc-400">Salvaguardas</span>
          </div>
          <button @click="emit('roll', 'Fortitude', '1d20 + @fort')"
            class="rounded-lg bg-zinc-900/60 border border-zinc-800 px-2 py-1.5 hover:border-primary/40 hover:bg-primary/5 transition-colors flex flex-col items-center">
            <div class="text-[10px] text-zinc-500 font-bold uppercase mb-0.5">Fortitude</div>
            <div class="text-base font-extrabold font-serif text-zinc-100">{{ modStr(totalFort) }}</div>
          </button>
          <button @click="emit('roll', 'Reflexos', '1d20 + @ref')"
            class="rounded-lg bg-zinc-900/60 border border-zinc-800 px-2 py-1.5 hover:border-primary/40 hover:bg-primary/5 transition-colors flex flex-col items-center">
            <div class="text-[10px] text-zinc-500 font-bold uppercase mb-0.5">Reflexos</div>
            <div class="text-base font-extrabold font-serif text-zinc-100">{{ modStr(totalRef) }}</div>
          </button>
          <button @click="emit('roll', 'Vontade', '1d20 + @will')"
            class="rounded-lg bg-zinc-900/60 border border-zinc-800 px-2 py-1.5 hover:border-primary/40 hover:bg-primary/5 transition-colors flex flex-col items-center">
            <div class="text-[10px] text-zinc-500 font-bold uppercase mb-0.5">Vontade</div>
            <div class="text-base font-extrabold font-serif text-zinc-100">{{ modStr(totalWill) }}</div>
          </button>
        </div>

        <!-- BUFFS mini-list -->
        <div class="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 overflow-hidden flex flex-col justify-start">
          <div class="flex items-center gap-2 mb-2">
            <Flame class="w-4 h-4 text-zinc-400" />
            <span class="text-xs font-bold uppercase tracking-widest text-zinc-400">Buffs & Condições</span>
          </div>
          <div v-if="!d?.buffs?.length"
            class="text-center py-3 text-zinc-600 text-xs">Nenhum buff.</div>
          <div v-else class="space-y-1 overflow-y-auto max-h-40">
            <div v-for="(buf, i) in d.buffs" :key="i"
              class="flex items-center gap-2 py-1.5 border-b border-zinc-800/40 last:border-0 cursor-pointer hover:bg-zinc-800/50 px-1 rounded transition-colors group"
              @click="emit('toggle-buff', Number(i))">
              <button 
                class="flex items-center justify-center w-5 h-5 rounded-md border transition-colors shrink-0"
                :class="buf.active ? 'bg-orange-500/20 border-orange-500/50 text-orange-400' : 'bg-zinc-900 border-zinc-700 text-zinc-600'">
                <Flame class="w-3 h-3" :class="buf.active ? 'fill-orange-500/50 text-orange-400' : ''" />
              </button>
              <span class="text-xs truncate transition-colors"
                :class="buf.active ? 'text-zinc-200' : 'text-zinc-500 group-hover:text-zinc-300'">
                {{ buf.title }}
              </span>
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
          :class="visiblePanels.some(p => p.id === panel.id) ? 'bg-primary text-primary-foreground border-primary' : 'bg-zinc-900 text-zinc-500 border-zinc-700'">
          {{ panel.label }}
        </button>
      </div>

      <div v-for="panel in visiblePanels" :key="panel.id"
        class="rounded-xl border border-zinc-800 bg-zinc-950/60 overflow-hidden">

        <!-- Panel header -->
        <button
          class="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-900/40 transition-colors"
          @click="togglePanel(panel.id)">
          <div class="flex items-center gap-2">
            <component :is="panel.icon" class="w-4 h-4 text-zinc-500" />
            <span class="text-sm font-bold text-zinc-300">{{ panel.label }}</span>
            <span class="text-xs text-zinc-600 bg-zinc-800 rounded-full px-2 py-0.5">{{ panelCount(panel.id) }}</span>
          </div>
          <ChevronDown v-if="!isPanelOpen(panel.id)" class="w-4 h-4 text-zinc-600" />
          <ChevronUp v-else class="w-4 h-4 text-zinc-600" />
        </button>

        <!-- Panel content -->
        <div v-if="isPanelOpen(panel.id)" class="border-t border-zinc-800/50 px-4 py-3 space-y-2">


          <!-- TALENTOS -->
          <template v-if="panel.id === 'feats'">
            <div v-if="!d?.feats?.length" class="text-center py-4 text-zinc-600 text-xs">Nenhum talento.</div>
            <div v-else class="space-y-1">
              <div v-for="(feat, i) in d.feats" :key="i"
                class="flex items-center justify-between py-1.5 border-b border-zinc-800/40 last:border-0">
                <div class="flex items-center gap-2">
                  <component :is="feat.isAttack ? Swords : Zap"
                    class="w-3.5 h-3.5 shrink-0"
                    :class="feat.isAttack ? 'text-red-400' : 'text-primary'" />
                  <span class="text-sm font-semibold text-zinc-200">{{ feat.title }}</span>
                </div>
                <button v-if="feat.isAttack"
                  @click="emit('roll-item', feat)"
                  class="text-xs px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 transition-colors">
                  Atacar
                </button>
                <button v-else-if="feat.rollFormula"
                  @click="emit('roll', feat.title, feat.rollFormula)"
                  class="text-xs px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 transition-colors">
                  Rolar
                </button>
              </div>
            </div>
          </template>

          <!-- EQUIPAMENTOS -->
          <template v-else-if="panel.id === 'equipment'">
            <div v-if="!d?.equipment?.length" class="text-center py-4 text-zinc-600 text-xs">Nenhum item.</div>
            <div v-else class="space-y-1">
              <div v-for="(item, i) in d.equipment" :key="i"
                class="flex items-center justify-between py-1.5 border-b border-zinc-800/40 last:border-0 cursor-pointer hover:bg-zinc-600/10 px-2 rounded -mx-2 transition-colors"
                @click="emit('toggle-equipped', Number(i))">
                <div>
                  <span class="text-sm font-semibold transition-colors"
                    :class="item.equipped ? 'text-primary/90' : 'text-zinc-300 group-hover:text-zinc-200'">{{ item.title }}</span>
                  <span v-if="item.equipped" class="ml-2 text-[10px] text-primary/50">• equipado</span>
                  <span v-if="item.weight" class="ml-2 text-[10px] text-zinc-600">{{ item.weight }}kg</span>
                </div>
                <!-- checkbox / switch visual indicator -->
                <div class="w-8 h-4 rounded-full border flex items-center p-0.5 transition-colors"
                     :class="item.equipped ? 'border-primary/50 bg-primary/20 justify-end' : 'border-zinc-700 bg-zinc-900 justify-start'">
                     <div class="w-3 h-3 rounded-full bg-current"
                          :class="item.equipped ? 'text-primary' : 'text-zinc-500'"></div>
                </div>
              </div>
            </div>
          </template>

          <!-- BUFFS -->
          <template v-else-if="panel.id === 'buffs'">
            <div v-if="!d?.buffs?.length" class="text-center py-4 text-zinc-600 text-xs">Nenhum buff.</div>
            <div v-else class="space-y-1">
              <div v-for="(buf, i) in d.buffs" :key="i"
                class="flex items-center gap-3 py-1.5 border-b border-zinc-800/40 last:border-0 cursor-pointer hover:bg-zinc-600/10 px-2 rounded -mx-2 transition-colors"
                @click="emit('toggle-buff', Number(i))">
                <Flame class="w-3.5 h-3.5 shrink-0"
                  :class="buf.active ? 'text-primary' : 'text-zinc-700'" />
                <div class="flex-1">
                  <span class="text-sm font-semibold"
                    :class="buf.active ? 'text-zinc-200' : 'text-zinc-500'">{{ buf.title }}</span>
                  <div v-if="buf.modifiers?.length" class="text-[10px] text-zinc-600 mt-0.5">
                    {{ buf.modifiers.map((m: any) => `${m.target} ${modStr(m.value)}`).join(' · ') }}
                  </div>
                </div>
                <!-- checkbox / switch visual indicator -->
                <div class="w-8 h-4 rounded-full border flex items-center p-0.5 transition-colors"
                     :class="buf.active ? 'border-primary/50 bg-primary/20 justify-end' : 'border-zinc-700 bg-zinc-900 justify-start'">
                     <div class="w-3 h-3 rounded-full bg-current"
                          :class="buf.active ? 'text-primary' : 'text-zinc-500'"></div>
                </div>
              </div>
            </div>
          </template>

        </div>
      </div>
    </div>

  </div>
</template>

```


---
## FILE: src/components/ui/button/Button.vue
```vue
<script setup lang="ts">
import { type HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import { Primitive, type PrimitiveProps } from 'radix-vue'
import { cva, type VariantProps } from 'class-variance-authority'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline:
          'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
        secondary:
          'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

interface Props extends PrimitiveProps {
  variant?: VariantProps<typeof buttonVariants>['variant']
  size?: VariantProps<typeof buttonVariants>['size']
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  as: 'button',
})
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    :class="cn(buttonVariants({ variant, size }), props.class)"
  >
    <slot />
  </Primitive>
</template>

```


---
## FILE: src/components/ui/button/index.ts
```typescript
import { cva, type VariantProps } from 'class-variance-authority'

export { default as Button } from './Button.vue'

export const buttonVariants = cva(
    'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
    {
        variants: {
            variant: {
                default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
                destructive:
                    'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
                outline:
                    'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
                secondary:
                    'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
                ghost: 'hover:bg-accent hover:text-accent-foreground',
                link: 'text-primary underline-offset-4 hover:underline',
            },
            size: {
                default: 'h-9 px-4 py-2',
                sm: 'h-8 rounded-md px-3 text-xs',
                lg: 'h-10 rounded-md px-8',
                icon: 'h-9 w-9',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
)

export type ButtonVariants = VariantProps<typeof buttonVariants>

```


---
## FILE: src/components/ui/card/Card.vue
```vue
<script setup lang="ts">
import { type HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div
    :class="
      cn(
        'rounded-xl border bg-card text-card-foreground shadow',
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>

```


---
## FILE: src/components/ui/card/CardContent.vue
```vue
<script setup lang="ts">
import { type HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div :class="cn('p-6 pt-0', props.class)">
    <slot />
  </div>
</template>

```


---
## FILE: src/components/ui/card/CardDescription.vue
```vue
<script setup lang="ts">
import { type HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <p :class="cn('text-sm text-muted-foreground', props.class)">
    <slot />
  </p>
</template>

```


---
## FILE: src/components/ui/card/CardFooter.vue
```vue
<script setup lang="ts">
import { type HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div :class="cn('flex items-center p-6 pt-0', props.class)">
    <slot />
  </div>
</template>

```


---
## FILE: src/components/ui/card/CardHeader.vue
```vue
<script setup lang="ts">
import { type HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div :class="cn('flex flex-col space-y-1.5 p-6', props.class)">
    <slot />
  </div>
</template>

```


---
## FILE: src/components/ui/card/CardTitle.vue
```vue
<script setup lang="ts">
import { type HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <h3 :class="cn('font-semibold leading-none tracking-tight', props.class)">
    <slot />
  </h3>
</template>

```


---
## FILE: src/components/ui/card/index.ts
```typescript
export { default as Card } from './Card.vue'
export { default as CardHeader } from './CardHeader.vue'
export { default as CardTitle } from './CardTitle.vue'
export { default as CardDescription } from './CardDescription.vue'
export { default as CardContent } from './CardContent.vue'
export { default as CardFooter } from './CardFooter.vue'

```


---
## FILE: src/components/ui/checkbox/Checkbox.vue
```vue
<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { CheckboxIndicator, CheckboxRoot, type CheckboxRootEmits, type CheckboxRootProps, useForwardPropsEmits } from 'radix-vue'
import { Check } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

const props = defineProps<CheckboxRootProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<CheckboxRootEmits>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props

  return delegated
})

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <CheckboxRoot
    v-bind="forwarded"
    :class="cn('peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground', props.class)"
  >
    <CheckboxIndicator class="flex h-full w-full items-center justify-center text-current">
      <Check class="h-4 w-4" />
    </CheckboxIndicator>
  </CheckboxRoot>
</template>

```


---
## FILE: src/components/ui/checkbox/index.ts
```typescript
export { default as Checkbox } from './Checkbox.vue'

```


---
## FILE: src/components/ui/input/index.ts
```typescript
export { default as Input } from './Input.vue'

```


---
## FILE: src/components/ui/input/Input.vue
```vue
<script setup lang="ts">
import { type HTMLAttributes } from 'vue'
import { useVModel } from '@vueuse/core'
import { cn } from '@/lib/utils'

const props = defineProps<{
  defaultValue?: string | number
  modelValue?: string | number
  class?: HTMLAttributes['class']
}>()

const emits = defineEmits<{
  (e: 'update:modelValue', payload: string | number): void
}>()

const modelValue = useVModel(props, 'modelValue', emits, {
  passive: true,
  defaultValue: props.defaultValue,
})
</script>

<template>
  <input
    v-model="modelValue"
    :class="cn('flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50', props.class)"
  />
</template>

```


---
## FILE: src/components/ui/label/index.ts
```typescript
export { default as Label } from './Label.vue'

```


---
## FILE: src/components/ui/label/Label.vue
```vue
<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { Label, type LabelProps } from 'radix-vue'
import { cn } from '@/lib/utils'

const props = defineProps<LabelProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props

  return delegated
})
</script>

<template>
  <Label
    v-bind="delegatedProps"
    :class="
      cn(
        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        props.class,
      )
    "
  >
    <slot />
  </Label>
</template>

```


---
## FILE: src/components/ui/radio-group/index.ts
```typescript
export { default as RadioGroup } from './RadioGroup.vue'
export { default as RadioGroupItem } from './RadioGroupItem.vue'

```


---
## FILE: src/components/ui/radio-group/RadioGroup.vue
```vue
<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { RadioGroupRoot, type RadioGroupRootEmits, type RadioGroupRootProps, useForwardPropsEmits } from 'radix-vue'
import { cn } from '@/lib/utils'

const props = defineProps<RadioGroupRootProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<RadioGroupRootEmits>()

const delegatedProps = computed(() => {
    const { class: _, ...delegated } = props

    return delegated
})

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
    <RadioGroupRoot :class="cn('grid gap-2', props.class)" v-bind="forwarded">
        <slot />
    </RadioGroupRoot>
</template>

```


---
## FILE: src/components/ui/radio-group/RadioGroupItem.vue
```vue
<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { RadioGroupIndicator, RadioGroupItem, type RadioGroupItemProps, useForwardProps } from 'radix-vue'
import { Circle } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

const props = defineProps<RadioGroupItemProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
    const { class: _, ...delegated } = props

    return delegated
})

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
    <RadioGroupItem v-bind="forwardedProps" :class="cn(
        'aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        props.class,
    )
        ">
        <RadioGroupIndicator class="flex items-center justify-center">
            <Circle class="h-2.5 w-2.5 fill-current text-current" />
        </RadioGroupIndicator>
    </RadioGroupItem>
</template>

```


---
## FILE: src/components/ui/select/index.ts
```typescript
export { default as Select } from './Select.vue'
export { default as SelectTrigger } from './SelectTrigger.vue'
export { default as SelectValue } from './SelectValue.vue'
export { default as SelectContent } from './SelectContent.vue'
export { default as SelectItem } from './SelectItem.vue'

```


---
## FILE: src/components/ui/select/Select.vue
```vue
<script setup lang="ts">
import { SelectRoot, type SelectRootEmits, type SelectRootProps, useForwardPropsEmits } from 'radix-vue'

const props = defineProps<SelectRootProps>()
const emits = defineEmits<SelectRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <SelectRoot v-bind="forwarded">
    <slot />
  </SelectRoot>
</template>

```


---
## FILE: src/components/ui/select/SelectContent.vue
```vue
<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { SelectContent, type SelectContentEmits, type SelectContentProps, SelectPortal, SelectViewport, useForwardPropsEmits } from 'radix-vue'
import { cn } from '@/lib/utils'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<SelectContentProps & { class?: HTMLAttributes['class'] }>(), {
  position: 'popper',
})
const emits = defineEmits<SelectContentEmits>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props

  return delegated
})

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <SelectPortal>
    <SelectContent
      v-bind="{ ...forwarded, ...$attrs }"
      :class="cn(
        'relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        position === 'popper' &&
          'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
        props.class,
      )"
    >
      <SelectViewport :class="cn('p-1', position === 'popper' && 'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]')">
        <slot />
      </SelectViewport>
    </SelectContent>
  </SelectPortal>
</template>

```


---
## FILE: src/components/ui/select/SelectItem.vue
```vue
<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { SelectItem, type SelectItemProps, SelectItemText, SelectItemIndicator, useForwardProps } from 'radix-vue'
import { Check } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

const props = defineProps<SelectItemProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props

  return delegated
})

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <SelectItem
    v-bind="forwardedProps"
    :class="cn(
      'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      props.class,
    )"
  >
    <span class="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectItemIndicator>
        <Check class="h-4 w-4" />
      </SelectItemIndicator>
    </span>

    <SelectItemText>
      <slot />
    </SelectItemText>
  </SelectItem>
</template>

```


---
## FILE: src/components/ui/select/SelectTrigger.vue
```vue
<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { SelectIcon, SelectTrigger, type SelectTriggerProps, useForwardProps } from 'radix-vue'
import { ChevronDown } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

const props = defineProps<SelectTriggerProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props

  return delegated
})

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <SelectTrigger
    v-bind="forwardedProps"
    :class="cn(
      'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
      props.class,
    )"
  >
    <slot />
    <SelectIcon as-child>
      <ChevronDown class="h-4 w-4 opacity-50" />
    </SelectIcon>
  </SelectTrigger>
</template>

```


---
## FILE: src/components/ui/select/SelectValue.vue
```vue
<script setup lang="ts">
import { SelectValue, type SelectValueProps } from 'radix-vue'

const props = defineProps<SelectValueProps>()
</script>

<template>
  <SelectValue v-bind="props">
    <slot />
  </SelectValue>
</template>

```


---
## FILE: src/components/ui/tabs/index.ts
```typescript
export { default as Tabs } from './Tabs.vue'
export { default as TabsList } from './TabsList.vue'
export { default as TabsTrigger } from './TabsTrigger.vue'
export { default as TabsContent } from './TabsContent.vue'

```


---
## FILE: src/components/ui/tabs/Tabs.vue
```vue
<script setup lang="ts">
import { TabsRoot, type TabsRootEmits, type TabsRootProps, useForwardPropsEmits } from 'radix-vue'

const props = defineProps<TabsRootProps>()
const emits = defineEmits<TabsRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
    <TabsRoot v-bind="forwarded">
        <slot />
    </TabsRoot>
</template>

```


---
## FILE: src/components/ui/tabs/TabsContent.vue
```vue
<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { TabsContent, type TabsContentProps } from 'radix-vue'
import { cn } from '@/lib/utils'

const props = defineProps<TabsContentProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
    const { class: _, ...delegated } = props

    return delegated
})
</script>

<template>
    <TabsContent v-bind="delegatedProps" :class="cn(
        'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        props.class,
    )">
        <slot />
    </TabsContent>
</template>

```


---
## FILE: src/components/ui/tabs/TabsList.vue
```vue
<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { TabsList, type TabsListProps } from 'radix-vue'
import { cn } from '@/lib/utils'

const props = defineProps<TabsListProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
    const { class: _, ...delegated } = props

    return delegated
})
</script>

<template>
    <TabsList v-bind="delegatedProps" :class="cn(
        'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
        props.class,
    )">
        <slot />
    </TabsList>
</template>

```


---
## FILE: src/components/ui/tabs/TabsTrigger.vue
```vue
<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { TabsTrigger, type TabsTriggerProps, useForwardProps } from 'radix-vue'
import { cn } from '@/lib/utils'

const props = defineProps<TabsTriggerProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
    const { class: _, ...delegated } = props

    return delegated
})

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
    <TabsTrigger v-bind="forwardedProps" :class="cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
        props.class,
    )">
        <slot />
    </TabsTrigger>
</template>

```


---
## FILE: src/components/ui/textarea/index.ts
```typescript
export { default as Textarea } from './Textarea.vue'

```


---
## FILE: src/components/ui/textarea/Textarea.vue
```vue
<script setup lang="ts">
import { type HTMLAttributes } from 'vue'
import { useVModel } from '@vueuse/core'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
  defaultValue?: string | number
  modelValue?: string | number
}>()

const emits = defineEmits<{
  (e: 'update:modelValue', payload: string | number): void
}>()

const modelValue = useVModel(props, 'modelValue', emits, {
  passive: true,
  defaultValue: props.defaultValue,
})
</script>

<template>
  <textarea
    v-model="modelValue"
    :class="cn('flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50', props.class)"
  />
</template>

```


---
## FILE: src/components/wizard/steps/AttributesStep.vue
```vue
<script setup lang="ts">
import { useWizardStore } from '@/stores/wizardStore'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const store = useWizardStore()

const attributes = [
  { key: 'str', label: 'Força' },
  { key: 'dex', label: 'Destreza' },
  { key: 'con', label: 'Constituição' },
  { key: 'int', label: 'Inteligência' },
  { key: 'wis', label: 'Sabedoria' },
  { key: 'cha', label: 'Carisma' },
] as const

function calculateModifier(score: number) {
  return Math.floor((score - 10) / 2)
}

function getModifierString(score: number) {
  const mod = calculateModifier(score)
  return mod >= 0 ? `+${mod}` : `${mod}`
}
</script>

<template>
  <div class="grid gap-6">
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div v-for="attr in attributes" :key="attr.key" class="border rounded-lg p-4 bg-muted/20">
        <label class="block text-center font-bold mb-2">{{ attr.label }}</label>

        <div class="grid grid-cols-2 gap-4">
          <div class="grid gap-1">
            <Label class="text-xs text-center">Valor Base</Label>
            <Input type="number" v-model.number="store.character.attributes[attr.key].base" class="text-center" />
          </div>
          <div class="grid gap-1">
            <Label class="text-xs text-center">Temp</Label>
            <Input type="number" v-model.number="store.character.attributes[attr.key].temp" class="text-center" />
          </div>
        </div>

        <div class="mt-4 flex justify-between items-center border-t pt-2">
          <span class="text-sm font-semibold">Modificador:</span>
          <span class="text-lg font-bold">
            {{ getModifierString(store.character.attributes[attr.key].base + (store.character.attributes[attr.key].temp
            || 0)) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

```


---
## FILE: src/components/wizard/steps/BasicInfoStep.vue
```vue
<script setup lang="ts">
import { useWizardStore } from '@/stores/wizardStore'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { computed } from 'vue'

const store = useWizardStore()

const races = ['Personalizada', 'Humano', 'Anão', 'Elfo', 'Gnomo', 'Meio-Elfo', 'Meio-Orc', 'Halfling']
const classes = ['Personalizada', 'Bárbaro', 'Bardo', 'Clérigo', 'Druida', 'Guerreiro', 'Monge', 'Paladino', 'Ranger', 'Ladino', 'Feiticeiro', 'Mago', 'Bruxo', 'Assassino', 'Algoz', 'Defensor Anão', 'Dançarino das Sombras', 'Mestre do Conhecimento', 'Teurgo Místico']
const alignments = ['Leal e Bom', 'Neutro e Bom', 'Caótico e Bom', 'Leal e Neutro', 'Neutro', 'Caótico e Neutro', 'Leal e Mau', 'Neutro e Mau', 'Caótico e Mau']
const sizes = ['Minúsculo', 'Diminuto', 'Mínimo', 'Pequeno', 'Médio', 'Grande', 'Enorme', 'Imenso', 'Colossal']

const raceSelect = computed({
  get: () => {
    if (!store.character.race) return 'Personalizada' // Return "Personalizada" instead of empty to keep it selected
    if (races.includes(store.character.race)) return store.character.race
    return 'Personalizada'
  },
  set: (val) => {
    store.character.race = val === 'Personalizada' ? '' : val
  }
})

const classSelect = computed({
  get: () => {
    if (!store.character.class) return 'Personalizada' // Return "Personalizada" instead of empty to keep it selected
    if (classes.includes(store.character.class)) return store.character.class
    return 'Personalizada'
  },
  set: (val) => {
    store.character.class = val === 'Personalizada' ? '' : val
  }
})
</script>

<template>
  <div class="grid gap-6">
    <div class="grid gap-4 md:grid-cols-2">
      <div class="grid gap-2">
        <Label htmlFor="name">Nome do Personagem</Label>
        <Input id="name" v-model="store.character.name" placeholder="Nome do personagem" />
      </div>
      <div class="grid gap-2">
        <Label htmlFor="player">Nome do Jogador</Label>
        <Input id="player" placeholder="Seu nome" />
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <div class="grid gap-2">
        <Label>Raça</Label>
        <Select v-model="raceSelect">
          <SelectTrigger>
            <SelectValue placeholder="Selecione a raça" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="race in races" :key="race" :value="race">
              {{ race }}
            </SelectItem>
          </SelectContent>
        </Select>
        <Input v-if="raceSelect === 'Personalizada'" v-model="store.character.race"
          placeholder="Nome da raça personalizada" class="mt-1" />
      </div>

      <div class="grid gap-2">
        <Label>Classe</Label>
        <Select v-model="classSelect">
          <SelectTrigger>
            <SelectValue placeholder="Selecione a classe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="cls in classes" :key="cls" :value="cls">
              {{ cls }}
            </SelectItem>
          </SelectContent>
        </Select>
        <Input v-if="classSelect === 'Personalizada'" v-model="store.character.class"
          placeholder="Nome da classe personalizada" class="mt-1" />
      </div>

      <div class="grid gap-2">
        <Label htmlFor="level">Nível</Label>
        <Input id="level" type="number" v-model.number="store.character.level" min="1" max="20" />
      </div>
    </div>

    <div v-if="classSelect === 'Personalizada'"
      class="grid gap-4 md:grid-cols-2 bg-muted/30 p-4 border border-border rounded-lg">
      <div class="col-span-1 md:col-span-2 text-xs font-semibold text-muted-foreground uppercase">
        Configuração de Classe Personalizada
      </div>
      <div class="grid gap-2">
        <Label>Dado de Vida (d)</Label>
        <Input type="number" v-model.number="store.character.customHitDie" min="4" max="20" :placeholder="8" />
        <p class="text-[10px] text-muted-foreground">O dado rolado para ganhar pontos de vida a cada nível.</p>
      </div>
      <div class="grid gap-2">
        <Label>Perícias por Nível</Label>
        <Input type="number" v-model.number="store.character.customSkillPoints" min="2" :placeholder="2" />
        <p class="text-[10px] text-muted-foreground">Pontos base recebidos a cada nível antes do modificador de INT.</p>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <div class="grid gap-2">
        <Label>Tendência</Label>
        <Select v-model="store.character.alignment">
          <SelectTrigger>
            <SelectValue placeholder="Selecione a tendência" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="align in alignments" :key="align" :value="align">
              {{ align }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="grid gap-2">
        <Label>Tamanho</Label>
        <Select v-model="store.character.size">
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tamanho" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="size in sizes" :key="size" :value="size">
              {{ size }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="grid gap-2">
        <Label htmlFor="age">Idade</Label>
        <Input id="age" v-model="store.character.age" placeholder="Idade" />
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-4">
      <div class="grid gap-2">
        <Label htmlFor="gender">Gênero</Label>
        <Input id="gender" v-model="store.character.gender" placeholder="Gênero" />
      </div>
      <div class="grid gap-2">
        <Label htmlFor="height">Altura</Label>
        <Input id="height" v-model="store.character.height" placeholder="Altura" />
      </div>
      <div class="grid gap-2">
        <Label htmlFor="weight">Peso</Label>
        <Input id="weight" v-model="store.character.weight" placeholder="Peso" />
      </div>
      <div class="grid gap-2">
        <Label htmlFor="deity">Divindade</Label>
        <Input id="deity" v-model="store.character.deity" placeholder="Divindade" />
      </div>
    </div>

    <div class="grid gap-2">
      <Label htmlFor="avatar_url">Imagem do Personagem (URL)</Label>
      <Input id="avatar_url" v-model="store.character.avatar_url"
        placeholder="https://... (opcional, aparece no card do dashboard)" />
      <div v-if="store.character.avatar_url" class="mt-2">
        <img :src="store.character.avatar_url" alt="Prévia"
          class="h-32 w-24 object-cover rounded-lg border border-border"
          @error="(e: Event) => (e.target as HTMLImageElement).style.display = 'none'" />
      </div>
    </div>
  </div>
</template>

```


---
## FILE: src/components/wizard/steps/CombatStatsStep.vue
```vue
<script setup lang="ts">
import { useWizardStore } from '@/stores/wizardStore'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const store = useWizardStore()
</script>

<template>
    <div class="flex flex-col gap-6">
        <div class="grid gap-6">

            <!-- Combate Básico -->
            <div class="grid gap-4 md:grid-cols-3 p-4 bg-muted/20 border border-border rounded-lg">
                <div
                    class="col-span-1 md:col-span-3 text-sm font-semibold text-primary uppercase border-b border-border pb-2 mb-2">
                    Estatísticas Básicas
                </div>

                <div class="grid gap-2">
                    <Label htmlFor="hp_max">Pontos de Vida Máximos</Label>
                    <Input id="hp_max" type="number" v-model.number="store.character.hp_max" />
                </div>

                <div class="grid gap-2">
                    <Label htmlFor="bab">Bônus Base de Ataque (BBA)</Label>
                    <Input id="bab" type="number" v-model.number="store.character.bab" />
                </div>

                <div class="grid gap-2">
                    <Label htmlFor="speed">Deslocamento (m)</Label>
                    <Input id="speed" type="number" v-model.number="store.character.speed" />
                </div>
            </div>

            <!-- Testes de Resistência -->
            <div class="grid gap-4 md:grid-cols-3 p-4 bg-muted/20 border border-border rounded-lg">
                <div
                    class="col-span-1 md:col-span-3 text-sm font-semibold text-primary uppercase border-b border-border pb-2 mb-2">
                    Testes de Resistência (Base da Classe)
                </div>

                <div class="grid gap-2">
                    <Label htmlFor="save_fort">Fortitude Base</Label>
                    <Input id="save_fort" type="number" v-model.number="store.character.save_fort" />
                </div>

                <div class="grid gap-2">
                    <Label htmlFor="save_ref">Reflexos Base</Label>
                    <Input id="save_ref" type="number" v-model.number="store.character.save_ref" />
                </div>

                <div class="grid gap-2">
                    <Label htmlFor="save_will">Vontade Base</Label>
                    <Input id="save_will" type="number" v-model.number="store.character.save_will" />
                </div>
            </div>

            <!-- Classe de Armadura -->
            <div class="grid gap-4 md:grid-cols-4 p-4 bg-muted/20 border border-border rounded-lg">
                <div
                    class="col-span-1 md:col-span-4 text-sm font-semibold text-primary uppercase border-b border-border pb-2 mb-2">
                    Classe de Armadura (CA) Inicial
                </div>

                <div class="grid gap-2">
                    <Label htmlFor="ca_armor">Bônus de Armadura</Label>
                    <Input id="ca_armor" type="number" v-model.number="store.character.ca_armor" />
                </div>

                <div class="grid gap-2">
                    <Label htmlFor="ca_shield">Bônus de Escudo</Label>
                    <Input id="ca_shield" type="number" v-model.number="store.character.ca_shield" />
                </div>

                <div class="grid gap-2">
                    <Label htmlFor="ca_natural">Armadura Natural</Label>
                    <Input id="ca_natural" type="number" v-model.number="store.character.ca_natural" />
                </div>

                <div class="grid gap-2">
                    <Label htmlFor="ca_deflect">Bônus de Deflexão</Label>
                    <Input id="ca_deflect" type="number" v-model.number="store.character.ca_deflect" />
                </div>
            </div>

        </div>
    </div>
</template>

```


---
## FILE: src/components/wizard/steps/EquipmentBioStep.vue
```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useWizardStore } from '@/stores/wizardStore'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Trash2 } from 'lucide-vue-next'

const store = useWizardStore()
const newItem = ref('')

function addItem() {
  if (newItem.value.trim()) {
    store.character.equipment.push(newItem.value.trim())
    newItem.value = ''
  }
}

function removeItem(index: number) {
  store.character.equipment.splice(index, 1)
}
</script>

<template>
  <div class="grid gap-6">
    <div class="grid gap-4">
      <Label class="text-lg font-semibold">Equipamento</Label>
      <div class="flex gap-2">
        <Input v-model="newItem" placeholder="Adicionar item..." @keyup.enter="addItem" />
        <Button @click="addItem">Adicionar</Button>
      </div>
      <div class="grid gap-2">
        <Card v-for="(item, index) in store.character.equipment" :key="index"
          class="p-3 flex justify-between items-center">
          <span>{{ item }}</span>
          <Button variant="ghost" size="icon" @click="removeItem(index)">
            <Trash2 class="h-4 w-4" />
          </Button>
        </Card>
      </div>
    </div>

    <div class="grid gap-4">
      <Label class="text-lg font-semibold">Biografia e Descrição</Label>
      <div class="grid gap-2">
        <Label htmlFor="bio">História</Label>
        <Textarea id="bio" v-model="store.character.bio" rows="5" />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="grid gap-2">
          <Label htmlFor="eyes">Olhos</Label>
          <Input id="eyes" v-model="store.character.eyes" />
        </div>
        <div class="grid gap-2">
          <Label htmlFor="hair">Cabelos</Label>
          <Input id="hair" v-model="store.character.hair" />
        </div>
        <div class="grid gap-2">
          <Label htmlFor="skin">Pele</Label>
          <Input id="skin" v-model="store.character.skin" />
        </div>
      </div>
    </div>
  </div>
</template>

```


---
## FILE: src/components/wizard/steps/FeatsStep.vue
```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useWizardStore } from '@/stores/wizardStore'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { FEATS_DATA, type Feat } from '@/data/dnd35'

const store = useWizardStore()
const searchQuery = ref('')

const filteredFeats = computed<Feat[]>(() => {
  if (!searchQuery.value) return FEATS_DATA
  const lower = searchQuery.value.toLowerCase()
  return FEATS_DATA.filter(f =>
    f.name.toLowerCase().includes(lower) ||
    f.description.toLowerCase().includes(lower)
  )
})

function toggleFeat(featName: string) {
  const index = store.character.feats.indexOf(featName)
  if (index === -1) {
    store.character.feats.push(featName)
  } else {
    store.character.feats.splice(index, 1)
  }
}

// Simple calculation for available feats (1 at level 1, +1 if Human, +1 at 3, 6, 9...)
// Fighter bonus feats etc are complex.
const maxFeats = computed(() => {
  let count = 1 + Math.floor(store.character.level / 3)
  if (store.character.level >= 3 && store.character.level % 3 !== 0) {
    // Logic for 3.5e is: 1st, 3rd, 6th, 9th... so 1 + level/3 is roughly correct if we start at 1.
    // 1: 1
    // 2: 1
    // 3: 2
    // 4: 2
    // 5: 2
    // 6: 3
  }

  if (store.character.race === 'Human') count++
  if (store.character.class === 'Fighter') {
    // Fighters get bonus feats at 1, 2, 4, 6, 8...
    if (store.character.level >= 1) count++
    if (store.character.level >= 2) count++
    if (store.character.level >= 4) count += Math.floor((store.character.level - 2) / 2) // Approximation
  }

  return count
})
</script>

<template>
  <div class="grid gap-6">
    <div class="flex justify-between items-center bg-muted p-4 rounded-lg">
      <div class="font-bold">
        Talentos Selecionados: {{ store.character.feats.length }} / {{ maxFeats }} (Aprox)
      </div>
      <div class="w-1/2">
        <Input v-model="searchQuery" placeholder="Buscar talentos..." />
      </div>
    </div>

    <div class="max-h-[500px] overflow-y-auto border rounded-md p-4 grid gap-2">
      <div v-for="feat in filteredFeats" :key="feat.name"
        class="flex items-start space-x-2 border-b pb-2 last:border-0 hover:bg-muted/10 transition-colors p-2 rounded">
        <Checkbox :id="feat.name" :checked="store.character.feats.includes(feat.name)"
          @update:checked="toggleFeat(feat.name)" />
        <div class="grid gap-1.5 leading-none">
          <Label :htmlFor="feat.name" class="font-bold cursor-pointer">
            {{ feat.name }}
          </Label>
          <p class="text-sm text-muted-foreground">
            {{ feat.description }}
          </p>
          <p v-if="feat.prerequisite" class="text-xs text-muted-foreground italic">
            Pré-req: {{ feat.prerequisite }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

```


---
## FILE: src/components/wizard/steps/SkillsStep.vue
```vue
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useWizardStore } from '@/stores/wizardStore'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SKILLS_DATA, CLASS_SKILLS, CLASS_SKILL_POINTS } from '@/data/dnd35'
import type { CharacterAttributes } from '@/stores/wizardStore'
import { Search } from 'lucide-vue-next'

const store = useWizardStore()

// Selected skills — set of skill names the user has chosen to have
const selectedSkills = computed<Set<string>>(() => {
  const set = new Set<string>()
  for (const [name, ranks] of Object.entries(store.character.skills)) {
    if (ranks !== undefined) set.add(name)
  }
  return set
})

const searchQuery = ref('')
const phase = ref<'select' | 'allocate'>('select')

const classSkills = computed(() => {
  const cls = store.character.class
  const baseSkills = CLASS_SKILLS[cls] || []

  // Ex: "Conhecimento (Arcano)" in baseSkills exactly matches the skill.
  // But some classes might have "Conhecimento (Todos)" or something similar in homebrew/expanded rules. 
  // Let's also check if they have blanket proficiencies if needed.
  return baseSkills
})

function isClassSkill(skillName: string) {
  if (store.character.class === 'Personalizada') return true // Custom class can treat any skill as a class skill

  const skills = classSkills.value
  if (skills.includes(skillName)) return true

  // Handle wildcard skills if the class definition includes them (like Bardo or Mago that have many)
  // E.g., if a class had "Conhecimento (Todos)", then we'd match any "Conhecimento"
  if (skillName.startsWith('Conhecimento') && skills.includes('Conhecimento (Todos)')) return true
  if (skillName.startsWith('Ofícios') && skills.includes('Ofícios (Qualquer)')) return true
  if (skillName.startsWith('Profissão') && skills.includes('Profissão (Qualquer)')) return true

  // D&D 3.5 Specific rule tweak:
  // If the skill is not specifically listed for the class, it's cross-class.
  // Wait, the issue might be that we need to ensure ALL knowledges act as class skills if the user buys them, 
  // ONLY if the class actually has them.
  // Actually, Mago has many listed explicitly. But what about Bardo? Bardo has "todas as perícias de Conhecimento".
  // Let's check CLASS_SKILLS for Bardo. It says 'Conhecimento (Arcano)', maybe we need to add a generic check.

  // Let's just do a specific check: Bard gets ALL Knowledge skills in 3.5e
  if (store.character.class === 'Bardo' && skillName.startsWith('Conhecimento')) return true

  return false
}

// Intelligence modifier used explicitly for skill points (ignores temporary bonuses per D&D 3.5e rules)
const skillPointsIntMod = computed(() => {
  const score = store.character.attributes.int.base
  return Math.floor((score - 10) / 2)
})

const isHuman = computed(() => {
  const r = store.character.race || ''
  return r.toLowerCase().includes('human')
})

const calculatedSkillPoints = computed(() => {
  const cls = store.character.class
  const base = store.character.customSkillPoints || CLASS_SKILL_POINTS[cls] || 2

  // D&D 3.5e rule: Min 1 point per level before human bonus (uses base INT only, temp INT does not grant skill points)
  let basePerLevel = Math.max(1, base + skillPointsIntMod.value)

  // Level 1: (Base + Int) * 4. Human *gets 4 extra points at level 1* (not multiplied) and +1 per level after.
  const isHumanChar = isHuman.value
  const lvl1Points = (basePerLevel * 4) + (isHumanChar ? 4 : 0)

  const futureLevels = Math.max(0, store.character.level - 1)
  const futurePoints = futureLevels * basePerLevel + (isHumanChar ? futureLevels : 0)

  return lvl1Points + futurePoints
})

// Sync the calculated points only if the user hasn't modified it manually (or if it's 0)
watch(calculatedSkillPoints, (newTotal) => {
  if (!store.character.skillPoints) {
    store.character.skillPoints = newTotal
  }
}, { immediate: true })

const usedPoints = computed(() => {
  let total = 0
  for (const skill of SKILLS_DATA) {
    if (!selectedSkills.value.has(skill.name)) continue
    const ranks = store.character.skills[skill.name] || 0
    const isClass = isClassSkill(skill.name)
    total += isClass ? ranks : ranks * 2
  }
  return total
})

// Filtered skills for the selection phase
const filteredSkills = computed(() => {
  const q = searchQuery.value.toLowerCase()
  return SKILLS_DATA.filter(s => !q || s.name.toLowerCase().includes(q))
})

// Skills selected for the allocation phase
const chosenSkills = computed(() =>
  SKILLS_DATA.filter(s => selectedSkills.value.has(s.name))
)

function isSelected(skillName: string) {
  return selectedSkills.value.has(skillName)
}

function toggleSkill(skillName: string) {
  if (isSelected(skillName)) {
    // Remove from skills — delete the key entirely
    const newSkills = { ...store.character.skills }
    delete newSkills[skillName]
    store.character.skills = newSkills
  } else {
    store.character.skills = { ...store.character.skills, [skillName]: 0 }
  }
}

function getAbilityMod(ability: string) {
  const attr = store.character.attributes[ability as keyof CharacterAttributes]
  const score = attr.base + (attr.temp || 0)
  return Math.floor((score - 10) / 2)
}

function getTotal(skillName: string, ability: string) {
  const ranks = store.character.skills[skillName] || 0
  return Math.floor(ranks) + getAbilityMod(ability)
}

function handleRankChange(skillName: string, value: string | number) {
  let val = Number(value)
  if (isNaN(val)) val = 0

  // Allow unrestricted rank allocation, just prevent negative
  val = Math.max(0, val)
  store.character.skills = { ...store.character.skills, [skillName]: val }
}
</script>

<template>
  <div class="flex flex-col gap-6">

    <!-- Phase Tabs -->
    <div class="flex gap-2 border-b border-border">
      <button @click="phase = 'select'" class="px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors"
        :class="phase === 'select' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'">
        1. Escolher Perícias
      </button>
      <button @click="phase = 'allocate'" class="px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors"
        :class="phase === 'allocate' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'">
        2. Distribuir Graduações
      </button>
    </div>

    <!-- === PHASE 1: SELECT SKILLS === -->
    <div v-if="phase === 'select'" class="flex flex-col gap-4">
      <p class="text-sm text-muted-foreground">
        Selecione as perícias que seu personagem terá. Perícias de classe (marcadas em ouro) custam 1 ponto/graduação.
        Perícias cruzadas custam 2 pontos.
      </p>

      <!-- Search -->
      <div class="relative">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input v-model="searchQuery" placeholder="Buscar perícia..." class="pl-9" />
      </div>

      <!-- Skill grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[420px] overflow-y-auto pr-1">
        <button v-for="skill in filteredSkills" :key="skill.name" @click="toggleSkill(skill.name)"
          class="flex items-center gap-3 p-3 rounded-lg border text-left transition-all text-sm" :class="[
            isSelected(skill.name)
              ? 'bg-primary/10 border-primary text-foreground'
              : 'bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-foreground',
          ]">
          <!-- Checkbox visual -->
          <div class="w-5 h-5 rounded flex items-center justify-center shrink-0 border-2 transition-colors"
            :class="isSelected(skill.name) ? 'bg-primary border-primary' : 'border-muted-foreground'">
            <span v-if="isSelected(skill.name)" class="text-primary-foreground text-xs font-bold">✓</span>
          </div>

          <!-- Skill info -->
          <div class="flex-1 min-w-0">
            <span class="font-medium truncate block">
              {{ skill.name }}
              <span v-if="skill.trainedOnly" class="text-xs text-muted-foreground ml-1">*</span>
            </span>
            <span class="text-xs text-muted-foreground uppercase">{{ skill.ability }}</span>
          </div>

          <!-- Class skill indicator -->
          <span v-if="isClassSkill(skill.name)" class="text-xs font-bold text-primary shrink-0">Classe</span>
        </button>
      </div>

      <div class="flex items-center justify-between pt-2">
        <p class="text-xs text-muted-foreground">* Somente Treinada</p>
        <p class="text-sm text-muted-foreground">
          <span class="font-bold text-foreground">{{ selectedSkills.size }}</span> perícias selecionadas
        </p>
      </div>

      <Button @click="phase = 'allocate'" class="self-end">
        Distribuir Graduações →
      </Button>
    </div>

    <!-- === PHASE 2: ALLOCATE RANKS === -->
    <div v-else class="flex flex-col gap-4">

      <!-- Points summary bar -->
      <div class="grid grid-cols-3 gap-4 p-4 bg-card border border-border rounded-lg text-center">
        <div class="flex flex-col items-center">
          <div class="flex items-center justify-center gap-1.5 opacity-80 mb-0.5">
            <span class="text-[10px] uppercase font-bold text-muted-foreground whitespace-nowrap">Total Pontos</span>
            <div class="flex items-center gap-1 px-1.5 py-0.5 bg-muted rounded text-[9px] font-mono leading-none">
              <span title="D&D 3.5: (Base + Int) × 4 no NVL 1">Sugestão: {{ calculatedSkillPoints }}</span>
            </div>
          </div>
          <Input type="number" v-model.number="store.character.skillPoints"
            class="h-9 w-24 text-center text-xl font-bold bg-transparent border-primary/50" />
        </div>
        <div class="flex flex-col items-center">
          <span
            class="text-[10px] uppercase font-bold text-muted-foreground opacity-80 mb-0.5 whitespace-nowrap">Distribuídos</span>
          <p class="text-3xl font-bold text-muted-foreground">{{ usedPoints }}</p>
        </div>
        <div class="flex flex-col items-center">
          <span
            class="text-[10px] uppercase font-bold text-muted-foreground opacity-80 mb-0.5 whitespace-nowrap">Restantes</span>
          <p class="text-3xl font-bold"
            :class="(store.character.skillPoints || 0) - usedPoints < 0 ? 'text-destructive' : 'text-primary'">
            {{ (store.character.skillPoints || 0) - usedPoints }}
          </p>
        </div>
      </div>

      <p v-if="chosenSkills.length === 0" class="text-center text-muted-foreground py-8 italic">
        Nenhuma perícia selecionada.
        <button @click="phase = 'select'" class="text-primary underline">Voltar e selecionar</button>
      </p>

      <!-- Skills table -->
      <div v-else class="border border-border rounded-lg overflow-hidden">
        <div
          class="grid grid-cols-[1fr_60px_60px_80px_60px] gap-0 bg-muted/40 border-b border-border px-3 py-2 text-xs font-bold text-muted-foreground uppercase">
          <div>Perícia</div>
          <div class="text-center">Hab</div>
          <div class="text-center">Mod</div>
          <div class="text-center">Grads</div>
          <div class="text-center">Total</div>
        </div>
        <div class="max-h-[360px] overflow-y-auto divide-y divide-border">
          <div v-for="skill in chosenSkills" :key="skill.name"
            class="grid grid-cols-[1fr_60px_60px_80px_60px] gap-0 px-3 py-2 items-center text-sm transition-colors hover:bg-muted/20"
            :class="isClassSkill(skill.name) ? 'bg-primary/5' : ''">
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full shrink-0"
                :class="isClassSkill(skill.name) ? 'bg-primary' : 'bg-muted-foreground/30'"></div>
              <span class="truncate font-medium">
                {{ skill.name }}
                <span v-if="skill.trainedOnly" class="text-muted-foreground text-xs">*</span>
              </span>
            </div>
            <div class="text-center text-xs text-muted-foreground uppercase font-mono">{{ skill.ability }}</div>
            <div class="text-center text-muted-foreground">
              {{ getAbilityMod(skill.ability) >= 0 ? '+' : '' }}{{ getAbilityMod(skill.ability) }}
            </div>
            <div class="flex justify-center">
              <Input type="number" :value="store.character.skills[skill.name] || 0"
                @input="(e: Event) => handleRankChange(skill.name, (e.target as HTMLInputElement).value)"
                class="h-7 w-16 text-center px-1 text-sm tabular-nums" min="0"
                :step="isClassSkill(skill.name) ? 1 : 0.5" />
            </div>
            <div class="text-center font-bold text-primary tabular-nums">
              {{ getTotal(skill.name, skill.ability) >= 0 ? '+' : '' }}{{ getTotal(skill.name, skill.ability) }}
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-between items-center pt-1">
        <button @click="phase = 'select'" class="text-sm text-muted-foreground underline hover:text-foreground">←
          Alterar Seleção</button>
        <p class="text-xs text-muted-foreground">* Somente Treinada</p>
      </div>
    </div>

  </div>
</template>

```


---
## FILE: src/components/wizard/steps/TypeStep.vue
```vue
<script setup lang="ts">
import { useWizardStore } from '@/stores/wizardStore'
import { User, Skull, Ghost, Wand2 } from 'lucide-vue-next'

const store = useWizardStore()

const types = [
    {
        id: 'Personagem',
        title: 'Personagem (PC)',
        description: 'Um aventureiro principal controlado por um jogador.',
        icon: User,
    },
    {
        id: 'NPC',
        title: 'NPC',
        description: 'Personagem não-jogador, como um mercador ou aliado.',
        icon: Ghost,
    },
    {
        id: 'Monstro',
        title: 'Monstro',
        description: 'Uma criatura ou inimigo para ser enfrentado em combate.',
        icon: Skull,
    },
    {
        id: 'Invocação',
        title: 'Invocação / Familiar',
        description: 'Criatura mágica ou companheiro animal conjurado/treinado.',
        icon: Wand2,
    }
]
</script>

<template>
    <div class="flex flex-col gap-6">
        <div class="text-center mb-2">
            <h2 class="text-xl font-serif text-primary">Qual o tipo de ficha que você está criando?</h2>
            <p class="text-sm text-muted-foreground mt-1">Isso nos ajuda a classificar a ficha na sua campanha.</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button v-for="t in types" :key="t.id" @click="store.character.sheetType = t.id"
                class="flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all duration-200 text-center gap-3 cursor-pointer"
                :class="store.character.sheetType === t.id
                    ? 'border-primary bg-primary/10 text-primary shadow-md'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground hover:bg-muted/30'">

                <div class="p-3 rounded-full"
                    :class="store.character.sheetType === t.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'">
                    <component :is="t.icon" class="w-8 h-8" />
                </div>

                <div>
                    <h3 class="font-bold text-lg" :class="store.character.sheetType === t.id ? 'text-foreground' : ''">
                        {{ t.title }}</h3>
                    <p class="text-xs opacity-80 mt-1 max-w-[200px] mx-auto">{{ t.description }}</p>
                </div>
            </button>
        </div>
    </div>
</template>

```


---
## FILE: src/composables/useDeleteConfirm.ts
```typescript
import { ref } from 'vue'

export function useDeleteConfirm(onDelete: (type: string, index: number) => void | Promise<void>) {
    const isDeleteOpen = ref(false)
    const deleteCountdown = ref(0)
    const itemToDelete = ref<{ type: string; index: number } | null>(null)
    let deleteTimer: any = null

    function confirmDelete(type: string, index: number) {
        itemToDelete.value = { type, index }
        isDeleteOpen.value = true
        deleteCountdown.value = 3
        if (deleteTimer) clearInterval(deleteTimer)
        deleteTimer = setInterval(() => {
            deleteCountdown.value--
            if (deleteCountdown.value <= 0) {
                clearInterval(deleteTimer)
            }
        }, 1000)
    }

    async function executeDelete() {
        if (!itemToDelete.value || deleteCountdown.value > 0) return
        const { type, index } = itemToDelete.value

        await onDelete(type, index)

        isDeleteOpen.value = false
        itemToDelete.value = null
    }

    function cancelDelete() {
        isDeleteOpen.value = false
        itemToDelete.value = null
        if (deleteTimer) clearInterval(deleteTimer)
    }

    return {
        isDeleteOpen,
        deleteCountdown,
        itemToDelete,
        confirmDelete,
        executeDelete,
        cancelDelete
    }
}

```


---
## FILE: src/composables/useDndCalculations.ts
```typescript
import { computed, type ComputedRef } from 'vue'
import type { SheetData, Modifier } from '@/types/sheet'
import { defaultBonuses } from '@/lib/sheetDefaults'

export function useDndCalculations(
    d: ComputedRef<SheetData | null | undefined>
) {
    function calcMod(n: number) { return Math.floor((n - 10) / 2) }
    function modStr(n: number) { return n >= 0 ? `+${n}` : `${n}` }
    function modStrF(n: number) { return n >= 0 ? `+${n}` : `${n}` }

    const b = computed(() => d.value?.bonuses || defaultBonuses())

    const totalBonuses = computed(() => {
        const bonuses: Record<string, number> = {}
        d.value?.buffs?.filter((b: any) => b.active).forEach((b: any) => {
            b.modifiers?.forEach((m: Modifier) => bonuses[m.target] = (bonuses[m.target] || 0) + (Number(m.value) || 0))
        })
        d.value?.feats?.forEach((f: any) => {
            if (typeof f === 'string') return
            f.modifiers?.forEach((m: Modifier) => bonuses[m.target] = (bonuses[m.target] || 0) + (Number(m.value) || 0))
        })

        d.value?.shortcuts?.forEach((s: any) => {
            s.modifiers?.forEach((m: Modifier) => bonuses[m.target] = (bonuses[m.target] || 0) + (Number(m.value) || 0))
        })
        d.value?.equipment?.forEach((item: any) => {
            if (typeof item === 'string') return
            if (item.equipped) {
                item.modifiers?.forEach((m: Modifier) => bonuses[m.target] = (bonuses[m.target] || 0) + (Number(m.value) || 0))
            }
        })
        return bonuses
    })

    const sizeMod = computed(() => {
        const s = d.value?.size || 'Médio'
        switch (s) {
            case 'Colossal': return -8
            case 'Imenso': return -4
            case 'Enorme': return -2
            case 'Grande': return -1
            case 'Médio': return 0
            case 'Pequeno': return 1
            case 'Mínimo': return 2
            case 'Diminuto': return 4
            case 'Minúsculo': return 8
            default: return 0
        }
    })

    function attrTotal(key: string) {
        const a = d.value?.attributes?.[key]
        const base = Number(a?.base ?? 10)
        const temp = Number(a?.temp ?? 0)
        const buffBonus = Number(totalBonuses.value[key] ?? 0)
        const configBonus = Number(d.value?.bonuses?.attributes?.[key] ?? 0)
        return base + temp + buffBonus + configBonus
    }

    const totalCA = computed(() => {
        if (!d.value) return 10
        return 10 + Number(d.value.ca_armor ?? 0) + calcMod(attrTotal('dex'))
            + Number(d.value.ca_shield ?? 0) + Number(d.value.ca_natural ?? 0)
            + Number(d.value.ca_deflect ?? 0) + Number(sizeMod.value)
            + Number(totalBonuses.value['CA'] ?? 0) + Number(b.value?.ca ?? 0)
    })

    const totalTouch = computed(() => {
        if (!d.value) return 10
        return 10 + calcMod(attrTotal('dex')) + Number(d.value.ca_deflect ?? 0) + Number(sizeMod.value) + Number(totalBonuses.value['toque'] ?? 0)
    })

    const totalFlatFooted = computed(() => {
        if (!d.value) return 10
        return 10 + Number(d.value.ca_armor ?? 0) + Number(d.value.ca_shield ?? 0) + Number(d.value.ca_natural ?? 0) + Number(d.value.ca_deflect ?? 0) + Number(sizeMod.value) + Number(totalBonuses.value['surpreso'] ?? 0)
    })

    const totalBAB = computed(() => Number(d.value?.bab || 0) + Number(totalBonuses.value.bab || 0) + Number(b.value?.bab ?? 0))
    const totalInitiative = computed(() => calcMod(attrTotal('dex')) + Number(d.value?.initiative_misc || 0) + Number(totalBonuses.value.iniciativa || 0) + Number(b.value?.initiative ?? 0))
    const totalHP = computed(() => Number(d.value?.hp_max || 0) + Number(totalBonuses.value.hp || 0) + Number(b.value?.hp ?? 0))
    const totalSpeed = computed(() => Number(d.value?.speed ?? 9) + Number(totalBonuses.value.speed || 0) + Number(b.value?.speed ?? 0))

    const meleeAtk = computed(() => Number(totalBAB.value) + calcMod(attrTotal('str')) + Number(sizeMod.value) + Number(totalBonuses.value.melee || 0))
    const rangedAtk = computed(() => Number(totalBAB.value) + calcMod(attrTotal('dex')) + Number(sizeMod.value) + Number(totalBonuses.value.ranged || 0))
    const grappleAtk = computed(() => Number(totalBAB.value) + calcMod(attrTotal('str')) + (Number(sizeMod.value) * 4) + Number(totalBonuses.value.grapple || 0))

    const totalFort = computed(() => Number(d.value?.save_fort || 0) + calcMod(attrTotal('con')) + Number(totalBonuses.value.fort || 0) + Number(b.value?.saves?.fort ?? 0))
    const totalRef = computed(() => Number(d.value?.save_ref || 0) + calcMod(attrTotal('dex')) + Number(totalBonuses.value.ref || 0) + Number(b.value?.saves?.ref ?? 0))
    const totalWill = computed(() => Number(d.value?.save_will || 0) + calcMod(attrTotal('wis')) + Number(totalBonuses.value.will || 0) + Number(b.value?.saves?.will ?? 0))

    const deathStatus = computed(() => {
        const hp = d.value?.hp_current ?? 0
        if (hp <= -10) return { label: 'Morto', color: 'bg-black text-white border-white/20' }
        if (hp < 0) return { label: 'Inconsciente / Morrendo', color: 'bg-red-500 text-white border-red-400' }
        if (hp === 0) return { label: 'Incapacitado', color: 'bg-orange-500 text-white border-orange-400' }
        return null
    })

    const totalWeight = computed(() => {
        if (!d.value?.equipment) return 0
        return d.value.equipment.reduce((sum: number, item: any) => {
            if (typeof item === 'string') return sum
            return sum + (Number(item.weight) || 0)
        }, 0)
    })

    function adjustField(obj: any, key: string, delta: number) {
        obj[key] = Number(obj[key] ?? 0) + delta
    }

    return {
        calcMod,
        modStr,
        modStrF,
        b,
        totalBonuses,
        sizeMod,
        attrTotal,
        totalCA,
        totalTouch,
        totalFlatFooted,
        totalBAB,
        totalInitiative,
        totalHP,
        totalSpeed,
        meleeAtk,
        rangedAtk,
        grappleAtk,
        totalFort,
        totalRef,
        totalWill,
        deathStatus,
        totalWeight,
        adjustField
    }
}

```


---
## FILE: src/composables/useDragReorder.ts
```typescript
import { ref, type Ref } from 'vue'

export function useDragReorder(
    reorderMode: Ref<boolean>,
    onReorder: (type: string, sourceIndex: number, targetIndex: number) => void | Promise<void>
) {
    const dragType = ref('')
    const dragSrcIndex = ref<number | null>(null)
    const dragOverIndex = ref<number | null>(null)

    function onDragStart(e: DragEvent, i: number, type: string) {
        if (!reorderMode.value) return
        dragSrcIndex.value = i
        dragType.value = type
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move'
            e.dataTransfer.setData('index', i.toString())
            e.dataTransfer.setData('type', type)
        }
    }

    function onDragOver(e: DragEvent, i: number, type: string) {
        if (!reorderMode.value || (dragType.value && dragType.value !== type)) return
        e.preventDefault()
        dragOverIndex.value = i
    }

    async function onDrop(e: DragEvent, targetIndex: number, type: string) {
        if (!reorderMode.value || (dragType.value && dragType.value !== type)) return
        e.preventDefault()

        const sourceIndex = parseInt(e.dataTransfer?.getData('index') || '-1')
        const sourceType = e.dataTransfer?.getData('type') || type

        if (sourceIndex === -1 || sourceIndex === targetIndex || sourceType !== type) {
            dragOverIndex.value = null
            return
        }

        await onReorder(type, sourceIndex, targetIndex)

        dragOverIndex.value = null
        dragSrcIndex.value = null
        dragType.value = ''
    }

    function onDragEnd() {
        dragOverIndex.value = null
        dragSrcIndex.value = null
        dragType.value = ''
    }

    return {
        dragType,
        dragSrcIndex,
        dragOverIndex,
        onDragStart,
        onDragOver,
        onDrop,
        onDragEnd
    }
}

```


---
## FILE: src/composables/useRolls.ts
```typescript
import type { ComputedRef } from 'vue'

export interface RollContext {
    attrTotal: (key: string) => number
    calcMod: (n: number) => number
    modStr: (n: number) => string
    totalCA: ComputedRef<number>
    totalTouch: ComputedRef<number>
    totalFlatFooted: ComputedRef<number>
    totalBAB: ComputedRef<number>
    meleeAtk: ComputedRef<number>
    rangedAtk: ComputedRef<number>
    grappleAtk: ComputedRef<number>
    totalHP: ComputedRef<number>
    totalInitiative: ComputedRef<number>
    totalFort: ComputedRef<number>
    totalRef: ComputedRef<number>
    totalWill: ComputedRef<number>
    d: ComputedRef<any>
    onRoll?: (label: string, displayFormula: string, evalFormula?: string) => void
    onAttackRoll?: (label: string, attackFormula: string, damageFormula: string) => void
}

const FORMULA_RE = /@(\w+)/g

function sanitizeFormula(formula: string) {
    return formula
        .replace(/\+\s*\+/g, '+')
        .replace(/-\s*\+/g, '-')
        .replace(/\+\s*-/g, '-')
        .replace(/-\s*-/g, '+')
}

export function useRolls(ctx: RollContext) {

    function resolveFormula(text: string): string {
        if (!text) return ''
        return text.replace(FORMULA_RE, (_, token) => {
            if (['str', 'dex', 'con', 'int', 'wis', 'cha'].includes(token)) return String(ctx.attrTotal(token))
            if (['strMod', 'dexMod', 'conMod', 'intMod', 'wisMod', 'chaMod'].includes(token)) {
                return ctx.modStr(ctx.calcMod(ctx.attrTotal(token.replace('Mod', ''))))
            }
            if (token === 'CA') return String(ctx.totalCA.value)
            if (token === 'toque') return String(ctx.totalTouch.value)
            if (token === 'surpreso') return String(ctx.totalFlatFooted.value)
            if (token === 'BBA') return ctx.modStr(ctx.totalBAB.value)
            if (token === 'melee') return ctx.modStr(ctx.meleeAtk.value)
            if (token === 'ranged') return ctx.modStr(ctx.rangedAtk.value)
            if (token === 'grapple') return ctx.modStr(ctx.grappleAtk.value)
            if (token === 'level') return String(ctx.d.value?.level ?? 1)
            if (token === 'hp') return String(ctx.totalHP.value)
            if (token === 'iniciativa') return ctx.modStr(ctx.totalInitiative.value)
            if (token === 'fort') return ctx.modStr(ctx.totalFort.value)
            if (token === 'ref') return ctx.modStr(ctx.totalRef.value)
            if (token === 'will') return ctx.modStr(ctx.totalWill.value)
            return `@${token}`
        })
    }

    function handleRoll(label: string, formulaRaw: string, bonus?: number) {
        if (!ctx.onRoll) return
        let displayFormula = formulaRaw
        let evalFormula = resolveFormula(formulaRaw)

        if (bonus !== undefined && bonus !== null) {
            const bonusStr = Number(bonus) >= 0 ? `+${bonus}` : `${bonus}`
            displayFormula = `${formulaRaw} ${bonusStr}`
            evalFormula = `${evalFormula} ${bonusStr}`
        }

        evalFormula = sanitizeFormula(evalFormula)
        ctx.onRoll(label, displayFormula, evalFormula)
    }

    function handleItemRoll(item: any) {
        if (typeof item === 'string') return

        if (item.isAttack && ctx.onAttackRoll && item.attackFormula && item.damageFormula) {
            let atkDisplay = item.attackFormula
            let dmgDisplay = item.damageFormula

            const bonus = Number(item.attackBonus) || 0
            if (bonus) {
                const bonusStr = bonus >= 0 ? `+${bonus}` : `${bonus}`
                atkDisplay = `${atkDisplay} ${bonusStr}`
            }

            // Resolve @refs and sanitize so DiceRoller can evaluate the formulas
            const atkEval = sanitizeFormula(resolveFormula(atkDisplay))
            const dmgEval = sanitizeFormula(resolveFormula(dmgDisplay))

            ctx.onAttackRoll(item.title, atkEval, dmgEval)
        } else {
            handleRoll(item.title, item.rollFormula || '1d20', Number(item.attackBonus) || 0)
        }
    }

    return { resolveFormula, handleRoll, handleItemRoll }
}

```


---
## FILE: src/composables/useSheet.ts
```typescript
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Sheet, SheetData } from '@/types/sheet'
import { defaultBonuses } from '@/lib/sheetDefaults'

export function useSheet() {
    const sheet = ref<Sheet | null>(null)
    const loading = ref(false)
    const saving = ref(false)

    async function fetchSheet(id: string) {
        if (!id) return
        loading.value = true
        try {
            const { data, error } = await supabase.from('sheets').select('*').eq('id', id).maybeSingle()
            if (error) throw error

            if (!data) {
                console.warn('Ficha não encontrada no banco.')
                return
            }

            if (data) {
                if (!data.data.bonuses) data.data.bonuses = defaultBonuses()
                if (!data.data.feats) data.data.feats = []
                if (!data.data.spells) data.data.spells = []
                if (!data.data.equipment) data.data.equipment = []
                sheet.value = data
            }
        } catch (error) {
            console.error('Error fetching sheet:', error)
            throw error
        } finally {
            loading.value = false
        }
    }

    async function saveSheetMeta(id: string, meta: { name: string, class: string, level: number, race: string }) {
        if (!id) return
        saving.value = true
        try {
            const { error } = await supabase.from('sheets').update(meta).eq('id', id)
            if (error) throw error
        } finally {
            saving.value = false
        }
    }

    async function saveSheetData(id: string, data: SheetData) {
        if (!id) return
        saving.value = true
        try {
            const { error } = await supabase.from('sheets').update({ data }).eq('id', id)
            if (error) throw error
        } finally {
            saving.value = false
        }
    }

    return {
        sheet,
        loading,
        saving,
        fetchSheet,
        saveSheetMeta,
        saveSheetData
    }
}

```


---
## FILE: src/composables/useSheetEdit.ts
```typescript
import { ref, type Ref } from 'vue'
import type { Sheet, SheetData } from '@/types/sheet'
import { defaultBonuses } from '@/lib/sheetDefaults'

export function useSheetEdit(sheet: Ref<Sheet | null>, onSave: (data: SheetData) => Promise<void>) {
    const editedData = ref<SheetData | null>(null)
    const headEditMode = ref(false)
    const tabsEditMode = ref(false)

    function prepEditData() {
        if (!sheet.value) return
        const copy = JSON.parse(JSON.stringify(sheet.value.data))
        if (!copy.bonuses) copy.bonuses = defaultBonuses()
        if (!copy.feats) copy.feats = []

        if (!copy.shortcuts) copy.shortcuts = []
        if (copy.xp === undefined) copy.xp = 0
        if (!copy.buffs) copy.buffs = []
        if (!copy.hp_max) copy.hp_max = 0
        editedData.value = copy
    }

    async function saveEdit() {
        if (!editedData.value || !sheet.value) return

        // Sync live-saved fields (HP, Recursos, Atalhos) back so they aren't overwritten
        if (sheet.value.data) {
            editedData.value.hp_current = sheet.value.data.hp_current ?? editedData.value.hp_current
            editedData.value.resources = sheet.value.data.resources ?? editedData.value.resources ?? []
            editedData.value.shortcuts = sheet.value.data.shortcuts ?? editedData.value.shortcuts ?? []
        }

        await onSave(editedData.value)

        sheet.value.data = editedData.value
        editedData.value = null
    }

    function toggleHeadEdit(onSaveTrigger?: () => Promise<void>) {
        if (!headEditMode.value) {
            prepEditData()
        } else {
            onSaveTrigger?.()
        }
        headEditMode.value = !headEditMode.value
    }

    function toggleTabsEdit(onSaveTrigger?: () => Promise<void>) {
        if (!tabsEditMode.value) {
            prepEditData()
            // Skill phase reset logic should be handled by the component using this
        } else {
            onSaveTrigger?.()
        }
        tabsEditMode.value = !tabsEditMode.value
    }

    return {
        editedData,
        headEditMode,
        tabsEditMode,
        toggleHeadEdit,
        toggleTabsEdit,
        saveEdit,
        prepEditData
    }
}

```


---
## FILE: src/composables/useSkills.ts
```typescript
import { ref, computed, type Ref, type ComputedRef } from 'vue'
import { SKILLS_DATA, CLASS_SKILLS, CLASS_SKILL_POINTS } from '@/data/dnd35'
import type { SheetData } from '@/types/sheet'

export function useSkills(
    d: ComputedRef<SheetData | null | undefined>,
    editedData: Ref<SheetData | null>,
    editMode: ComputedRef<boolean>,
    sheet: Ref<any>,
    calcMod: (n: number) => number,
    attrTotal: (key: string) => number,
    totalBonuses: ComputedRef<Record<string, number>>
) {
    const skillPhase = ref<'select' | 'allocate'>('select')
    const skillSearch = ref('')

    const baseClassSkills = computed(() => {
        const cls = (editMode.value ? editedData.value?.class : sheet.value?.class) || ''
        return CLASS_SKILLS[cls] || []
    })

    function isClassSkill(skillName: string) {
        const skills = baseClassSkills.value
        if (skills.includes(skillName)) return true
        if (skillName.startsWith('Conhecimento') && skills.includes('Conhecimento (Todos)')) return true
        if (skillName.startsWith('Ofícios') && skills.includes('Ofícios (Qualquer)')) return true
        if (skillName.startsWith('Profissão') && skills.includes('Profissão (Qualquer)')) return true
        const cls = (editMode.value ? editedData.value?.class : sheet.value?.class) || ''
        if (cls === 'Bardo' && skillName.startsWith('Conhecimento')) return true
        return false
    }

    const filteredSkillsList = computed(() => {
        const q = skillSearch.value.toLowerCase()
        return SKILLS_DATA.filter(s => !q || s.name.toLowerCase().includes(q))
    })

    const selectedSkillNames = computed(() => {
        if (!editedData.value?.skills) return new Set<string>()
        return new Set<string>(Object.keys(editedData.value.skills))
    })

    const allocatedSkills = computed(() => SKILLS_DATA.filter(s => selectedSkillNames.value.has(s.name)))

    function toggleSkillEdit(name: string) {
        if (!editedData.value) return
        const skills = { ...editedData.value.skills }
        if (name in skills) delete skills[name]
        else skills[name] = 0
        editedData.value.skills = skills
    }

    function skillAbilityMod(ability: string) { return calcMod(attrTotal(ability)) }

    function skillTotal(name: string, ability: string) {
        const diff = (editedData.value || d.value)?.skills?.[name] ?? 0
        return diff + skillAbilityMod(ability) + (totalBonuses.value[name] || 0)
    }

    function adjustRank(name: string, delta: 1 | -1) {
        if (!editedData.value) return
        const current = editedData.value.skills[name] ?? 0
        editedData.value.skills[name] = Math.max(0, current + delta)
    }

    function addLevelUpSkillPoints() {
        if (!editedData.value) return
        const cls = (editedData.value.class ?? '') as string
        const baseInt = Number(editedData.value.attributes?.int?.base ?? 10)
        const intModForSkills = calcMod(baseInt)
        const base = editedData.value.customSkillPoints || CLASS_SKILL_POINTS[cls] || 2
        const isHuman = (editedData.value.race ?? '').toLowerCase().includes('hmano') || (editedData.value.race ?? '').toLowerCase().includes('human')
        const basePerLevel = Math.max(1, base + intModForSkills)
        const earned = basePerLevel + (isHuman ? 1 : 0)
        editedData.value.skillPoints = (editedData.value.skillPoints || 0) + earned
        return earned
    }

    const skillPointsSpent = computed(() => {
        if (!editedData.value?.skills) return 0
        const skills = editedData.value.skills as Record<string, number>
        return Object.entries(skills).reduce((sum, [name, ranks]) => {
            const isClass = isClassSkill(name)
            const cost = isClass ? Number(ranks) : Number(ranks) * 2
            return sum + cost
        }, 0)
    })

    const activeSkills = computed(() => {
        if (!d.value?.skills) return []
        return Object.entries(d.value.skills)
            .map(([name, ranks]) => {
                const skill = SKILLS_DATA.find(s => s.name === name)
                return { name, ranks: ranks as number, ability: skill?.ability ?? 'int' }
            })
    })

    return {
        skillPhase,
        skillSearch,
        baseClassSkills,
        isClassSkill,
        filteredSkillsList,
        selectedSkillNames,
        allocatedSkills,
        toggleSkillEdit,
        skillAbilityMod,
        skillTotal,
        adjustRank,
        addLevelUpSkillPoints,
        skillPointsSpent,
        activeSkills
    }
}

```
