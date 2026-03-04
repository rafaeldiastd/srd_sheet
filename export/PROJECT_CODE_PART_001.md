

---
## FILE: db/campaign_notes.sql
```sql
CREATE TABLE IF NOT EXISTS campaign_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  
  -- Conteúdo
  title TEXT NOT NULL DEFAULT 'Sem título',
  content JSONB NOT NULL DEFAULT '{}',  -- TipTap JSON (doc structure)
  
  -- Organização
  parent_id UUID REFERENCES campaign_notes(id) ON DELETE CASCADE,  -- NULL = raiz
  is_folder BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,  -- posição dentro da pasta
  
  UNIQUE(campaign_id, user_id, id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_campaign_notes_lookup 
  ON campaign_notes(campaign_id, user_id, parent_id);

CREATE INDEX IF NOT EXISTS idx_campaign_notes_sort 
  ON campaign_notes(parent_id, sort_order);

ALTER TABLE campaign_notes ENABLE ROW LEVEL SECURITY;

-- Cada jogador só vê suas próprias notas
CREATE POLICY "Users can view own notes" ON campaign_notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own notes" ON campaign_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes" ON campaign_notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes" ON campaign_notes
  FOR DELETE USING (auth.uid() = user_id);

-- Grants
GRANT ALL ON campaign_notes TO authenticated;

```


---
## FILE: db/migration_chat.sql
```sql
-- Adicionar 'whisper' e 'spell' ao CHECK constraint
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_type_check;
ALTER TABLE messages ADD CONSTRAINT messages_type_check
  CHECK (type IN ('text', 'roll', 'system', 'whisper', 'spell'));

-- Adicionar coluna para avatar e nome do personagem
ALTER TABLE messages ADD COLUMN IF NOT EXISTS character_name TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Adicionar coluna parent_id para vincular dano ao ataque original
ALTER TABLE messages ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES messages(id) ON DELETE SET NULL;

-- Policy de DELETE para mensagens (Apenas o autor pode deletar)
DROP POLICY IF EXISTS "Users can delete own messages" ON messages;
CREATE POLICY "Users can delete own messages" ON messages
  FOR DELETE USING (auth.uid() = user_id);

-- Policy de UPDATE (Autor pode atualizar sua própria mensagem)
DROP POLICY IF EXISTS "Users can update own messages" ON messages;
CREATE POLICY "Users can update own messages" ON messages
  FOR UPDATE USING (auth.uid() = user_id);

```


---
## FILE: db/schema.sql
```sql
-- Create the sheets table
create table public.sheets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  class text,
  race text,
  level integer default 1,
  data jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table public.sheets enable row level security;

-- Policy: Users can view their own sheets
create policy "Users can view their own sheets"
  on public.sheets for select
  using (auth.uid() = user_id);

-- Policy: Users can insert their own sheets
create policy "Users can insert their own sheets"
  on public.sheets for insert
  with check (auth.uid() = user_id);

-- Policy: Users can update their own sheets
create policy "Users can update their own sheets"
  on public.sheets for update
  using (auth.uid() = user_id);

-- Policy: Users can delete their own sheets
create policy "Users can delete their own sheets"
  on public.sheets for delete
  using (auth.uid() = user_id);

```


---
## FILE: db/update_schema.sql
```sql
-- Add missing columns to the sheets table
alter table public.sheets 
add column if not exists class text,
add column if not exists race text,
add column if not exists level integer default 1;

```


---
## FILE: index.html
```html
<!doctype html>
<html lang="en" class="dark">

<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/svg+xml" href="/vite.svg" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link
    href="https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;0,900;1,300;1,400;1,700;1,900&family=Inter:wght@100..900&display=swap"
    rel="stylesheet">
  <title>srd_sheet</title>
</head>

<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>

</html>
```


---
## FILE: package.json
```json
{
  "name": "srd_sheet",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@dice-roller/rpg-dice-roller": "^5.5.1",
    "@supabase/supabase-js": "^2.97.0",
    "@tailwindcss/postcss": "^4.2.0",
    "@tiptap/extension-highlight": "^3.20.0",
    "@tiptap/extension-placeholder": "^3.20.0",
    "@tiptap/extension-task-item": "^3.20.0",
    "@tiptap/extension-task-list": "^3.20.0",
    "@tiptap/starter-kit": "^3.20.0",
    "@tiptap/vue-3": "^3.20.0",
    "@vueuse/core": "^14.2.1",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-vue-next": "^0.575.0",
    "pinia": "^3.0.4",
    "radix-vue": "^1.9.17",
    "rpg-dice-roller": "^5.0.0",
    "tailwind-merge": "^3.5.0",
    "tailwind-scrollbar": "^4.0.2",
    "vue": "^3.5.25",
    "vue-router": "^5.0.3"
  },
  "devDependencies": {
    "@types/node": "^24.10.1",
    "@vitejs/plugin-vue": "^6.0.2",
    "@vue/tsconfig": "^0.8.1",
    "autoprefixer": "^10.4.24",
    "postcss": "^8.5.6",
    "tailwindcss": "^4.2.0",
    "typescript": "~5.9.3",
    "vite": "^7.3.1",
    "vue-tsc": "^3.1.5"
  }
}

```


---
## FILE: postcss.config.js
```javascript
import tailwind from '@tailwindcss/postcss'
import autoprefixer from 'autoprefixer'

export default {
    plugins: [
        tailwind,
        autoprefixer,
    ],
}

```


---
## FILE: src/App.vue
```vue
<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="min-h-screen bg-background font-sans antialiased">
    <RouterView />
  </div>
</template>

```


---
## FILE: src/components/campaign/CampaignRollPanel.vue
```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Sword, Zap, Activity, Dices } from 'lucide-vue-next'

const props = defineProps<{ campaignId: string }>()

const authStore = useAuthStore()

// ── Sheet data ────────────────────────────────────────────────────────────────
const sheet = ref<any>(null)
const memberName = ref('Jogador')
const loading = ref(true)

async function fetchMySheet() {
    const { data } = await supabase
        .from('campaign_members')
        .select('*, sheets(id, name, class, level, data)')
        .eq('campaign_id', props.campaignId)
        .eq('user_id', authStore.user?.id)
        .single()

    if (data?.sheets) {
        sheet.value = data.sheets
        memberName.value = data.sheets.name || authStore.user?.user_metadata?.name || 'Jogador'
    }
    loading.value = false
}

// ── Derived sheet data ────────────────────────────────────────────────────────
const sheetData = computed(() => sheet.value?.data ?? {})

function attrMod(key: string): number {
    const base = sheetData.value?.attributes?.[key] ?? 10
    return Math.floor((base - 10) / 2)
}

const initiative = computed(() =>
    (sheetData.value?.initiative ?? 0) + attrMod('dex')
)

const skills = computed(() => {
    const raw = sheetData.value?.skills ?? {}
    const ABILITY_MAP: Record<string, string> = {
        'Acrobacia': 'dex', 'Arcanismo': 'int', 'Atletismo': 'str',
        'Enganação': 'cha', 'Furtividade': 'dex', 'História': 'int',
        'Intimidação': 'cha', 'Intuição': 'wis', 'Medicina': 'wis',
        'Natureza': 'int', 'Percepção': 'wis', 'Persuasão': 'cha',
        'Prestidigitação': 'dex', 'Religião': 'int', 'Sobrevivência': 'wis',
    }
    return Object.entries(raw).map(([name, ranks]: [string, any]) => ({
        name,
        ranks: Number(ranks) || 0,
        ability: ABILITY_MAP[name] ?? 'int',
        total: (Number(ranks) || 0) + attrMod(ABILITY_MAP[name] ?? 'int'),
    }))
})

const attacks = computed(() => sheetData.value?.shortcuts ?? [])

const ATTR_LABELS: Record<string, string> = {
    str: 'FOR', dex: 'DES', con: 'CON', int: 'INT', wis: 'SAB', cha: 'CAR'
}

import { useCampaignRolls } from '@/lib/useCampaignRolls'

const recipientId = ref('all')
const { rolling, sendRoll, modStr } = useCampaignRolls(props.campaignId, memberName, recipientId)


async function rollInitiative() {
    const formula = `1d20${modStr(initiative.value)}`
    await sendRoll('Iniciativa', formula)
}



async function rollSkill(skill: { name: string; total: number }) {
    const formula = `1d20${modStr(skill.total)}`
    await sendRoll(skill.name, formula)
}

onMounted(fetchMySheet)
</script>

<template>
    <div class="flex flex-col h-full bg-zinc-950/80 border-r border-border w-64 shrink-0">
        <!-- Header -->
        <div class="p-3 border-b border-border bg-zinc-900/60 shrink-0">
            <div class="flex items-center gap-2">
                <Dices class="w-4 h-4 text-primary" />
                <h3 class="text-sm font-bold">Rolagem de Dados</h3>
            </div>
            <p v-if="sheet" class="text-xs text-muted-foreground mt-0.5 truncate">
                {{ sheet.name }} — {{ sheet.class }} {{ sheet.level }}
            </p>
            <p v-else-if="!loading" class="text-xs text-zinc-600 italic mt-0.5">Sem ficha vinculada</p>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="flex-1 flex items-center justify-center">
            <div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>

        <!-- No Sheet -->
        <div v-else-if="!sheet" class="flex-1 flex flex-col items-center justify-center gap-3 p-4 text-center">
            <Dices class="w-10 h-10 text-zinc-700" />
            <p class="text-xs text-muted-foreground">
                Vincule uma ficha à campanha para rolar dados aqui.
            </p>
        </div>

        <!-- Roll Tabs -->
        <div v-else class="flex-1 overflow-y-auto">
            <Tabs default-value="initiative" class="h-full flex flex-col">
                <TabsList class="mx-2 mt-2 shrink-0 grid grid-cols-4 h-8">
                    <TabsTrigger value="initiative" class="text-[10px] px-1" title="Iniciativa">
                        <Activity class="w-3 h-3" />
                    </TabsTrigger>
                    <TabsTrigger value="attacks" class="text-[10px] px-1" title="Ataques">
                        <Sword class="w-3 h-3" />
                    </TabsTrigger>
                    <TabsTrigger value="skills" class="text-[10px] px-1" title="Perícias">
                        <Zap class="w-3 h-3" />
                    </TabsTrigger>
                </TabsList>

                <!-- INITIATIVE -->
                <TabsContent value="initiative" class="p-3 space-y-3">
                    <div class="rounded-lg bg-zinc-900 border border-zinc-800 p-4 text-center">
                        <p class="text-xs text-muted-foreground mb-1">Bônus de Iniciativa</p>
                        <p class="text-3xl font-bold text-primary">{{ initiative >= 0 ? `+${initiative}` : initiative }}
                        </p>
                        <p class="text-xs text-zinc-600 mt-1">DES {{ modStr(attrMod('dex')) }}</p>
                    </div>
                    <Button class="w-full gap-2" :disabled="rolling" @click="rollInitiative">
                        <Dices class="w-4 h-4" /> Rolar Iniciativa (1d20{{ modStr(initiative) }})
                    </Button>

                    <!-- Quick stat rolls -->
                    <div class="space-y-1">
                        <p class="text-[10px] text-muted-foreground uppercase font-bold px-1">Atributos</p>
                        <div class="grid grid-cols-2 gap-1">
                            <button v-for="attr in (['str', 'dex', 'con', 'int', 'wis', 'cha'] as const)" :key="attr"
                                class="p-2 rounded bg-zinc-900 border border-zinc-800 hover:border-primary/50 transition-colors text-center"
                                :disabled="rolling"
                                @click="sendRoll(ATTR_LABELS[attr] || attr.toUpperCase(), `1d20${modStr(attrMod(attr))}`)">
                                <p class="text-[9px] text-muted-foreground uppercase font-bold">{{ ATTR_LABELS[attr] ||
                                    attr.toUpperCase() }}
                                </p>
                                <p class="text-sm font-bold">{{ modStr(attrMod(attr)) }}</p>
                            </button>
                        </div>
                    </div>
                </TabsContent>

                <!-- ATTACKS -->
                <TabsContent value="attacks" class="p-3">
                    <div v-if="!attacks.length" class="text-center py-8 text-xs text-muted-foreground italic">Nenhum
                        atalho de ataque.</div>
                    <div v-else class="space-y-2">
                        <div v-for="(sc, i) in attacks" :key="i"
                            class="rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors p-3">
                            <p class="text-xs font-bold text-zinc-200 mb-2">{{ sc.title }}</p>
                            <div class="flex gap-1.5 flex-wrap">
                                <Button v-if="sc.attackBonus !== undefined && sc.attackBonus !== ''" size="sm"
                                    variant="outline"
                                    class="h-7 text-xs gap-1.5 border-green-900/50 text-green-400 hover:bg-green-950/30"
                                    :disabled="rolling"
                                    @click="sendRoll(`${sc.title} — Acerto`, `1d20${modStr(parseInt(sc.attackBonus) || 0)}`)">
                                    <Sword class="w-3 h-3" /> 1d20{{ modStr(parseInt(sc.attackBonus) || 0) }}
                                </Button>
                                <Button v-if="sc.rollFormula" size="sm" variant="outline"
                                    class="h-7 text-xs gap-1.5 border-amber-900/50 text-amber-400 hover:bg-amber-950/30"
                                    :disabled="rolling" @click="sendRoll(`${sc.title} — Dano`, sc.rollFormula)">
                                    <Dices class="w-3 h-3" /> {{ sc.rollFormula }}
                                </Button>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <!-- SKILLS -->
                <TabsContent value="skills" class="p-3">
                    <div v-if="!skills.length" class="text-center py-8 text-xs text-muted-foreground italic">Nenhuma
                        perícia com graduações.</div>
                    <div v-else class="space-y-1">
                        <button v-for="skill in skills" :key="skill.name"
                            class="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-primary/50 transition-colors group"
                            :disabled="rolling" @click="rollSkill(skill)">
                            <span class="text-xs font-medium text-zinc-300 group-hover:text-foreground">{{ skill.name
                                }}</span>
                            <span class="text-xs font-bold tabular-nums"
                                :class="skill.total >= 0 ? 'text-primary' : 'text-muted-foreground'">
                                {{ modStr(skill.total) }}
                            </span>
                        </button>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    </div>
</template>

```


---
## FILE: src/components/campaign/CampaignSettingsDropdown.vue
```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Button } from '@/components/ui/button'
import { Settings, BookOpen, LogOut } from 'lucide-vue-next'

const props = defineProps<{
    showNotes: boolean
}>()

const emit = defineEmits(['update:showNotes', 'leave'])

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

function toggleMenu() {
    isOpen.value = !isOpen.value
}

function closeMenu() {
    isOpen.value = false
}

// Close on outside click
function handleClickOutside(event: MouseEvent) {
    if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
        closeMenu()
    }
}

onMounted(() => {
    document.addEventListener('mousedown', handleClickOutside)
})

onUnmounted(() => {
    document.removeEventListener('mousedown', handleClickOutside)
})


function handleNotesToggle() {
    emit('update:showNotes', !props.showNotes)
    closeMenu()
}

function handleLeave() {
    emit('leave')
    closeMenu()
}
</script>

<template>
    <div class="relative inline-block text-left" ref="dropdownRef">
        <Button variant="ghost" size="icon" @click="toggleMenu" class="text-muted-foreground hover:text-foreground">
            <Settings class="w-5 h-5" />
        </Button>

        <Transition
            enter-active-class="transition ease-out duration-100"
            enter-from-class="transform opacity-0 scale-95"
            enter-to-class="transform opacity-100 scale-100"
            leave-active-class="transition ease-in duration-75"
            leave-from-class="transform opacity-100 scale-100"
            leave-to-class="transform opacity-0 scale-95"
        >
            <div v-if="isOpen" class="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-zinc-950 border border-zinc-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                <div class="py-1">
                    <div class="px-4 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Interface
                    </div>
                    
                    
                    <button @click="handleNotesToggle" class="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900 hover:text-primary flex items-center gap-2">
                        <BookOpen class="w-4 h-4" :class="props.showNotes ? 'text-primary' : 'text-muted-foreground'" />
                        <span>{{ props.showNotes ? 'Ocultar Anotações' : 'Mostrar Anotações' }}</span>
                    </button>

                    <div class="h-px bg-zinc-800 my-1"></div>
                    
                    <button @click="handleLeave" class="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 hover:text-destructive flex items-center gap-2">
                        <LogOut class="w-4 h-4" />
                        <span>Sair da Campanha</span>
                    </button>
                </div>
            </div>
        </Transition>
    </div>
</template>

```


---
## FILE: src/components/campaign/ChatAttackCard.vue
```vue
<script setup lang="ts">
import { Sword, Dice5 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import ChatRollResult from './ChatRollResult.vue'

const props = defineProps<{
    label: string
    isOwn: boolean
    attack: { formula: string; result: number; breakdown: string }
    damagePending: boolean
    damageFormula: string
    damage: { formula: string; result: number; breakdown: string } | null
    isWhisper?: boolean
}>()

const emit = defineEmits<{
    (e: 'roll-damage', formula: string): void
}>()
</script>

<template>
    <div class="space-y-2">
        <div class="flex items-center gap-2 font-bold" :class="isWhisper ? 'text-fuchsia-400' : 'text-amber-500'">
            <Sword class="w-4 h-4" />
            <span>{{ label }}</span>
        </div>

        <ChatRollResult title="Acerto" :formula="attack.formula" :breakdown="attack.breakdown" :result="attack.result" :color-scheme="isWhisper ? 'fuchsia' : 'amber'" />

        <template v-if="damagePending">
            <div class="mt-2 text-center">
                <Button v-if="isOwn" size="sm" variant="secondary" @click="emit('roll-damage', damageFormula)"
                    class="w-full bg-red-950/20 text-red-400 hover:bg-red-900/40 border border-red-900/50 h-8 text-xs">
                    <Dice5 class="w-3.5 h-3.5 mr-1.5" />
                    Rolar Dano ({{ damageFormula }})
                </Button>
                <div v-else class="text-xs text-red-500/50 italic py-1.5 border border-red-900/20 rounded bg-red-950/10">
                    Dano pendente...
                </div>
            </div>
        </template>
        <template v-else-if="damage">
            <ChatRollResult title="Dano 💥" :formula="damage.formula" :breakdown="damage.breakdown" :result="damage.result" color-scheme="red" />
        </template>
    </div>
</template>

```


---
## FILE: src/components/campaign/ChatMessage.vue
```vue
<script setup lang="ts">
import { computed } from 'vue'
import { Trash2, Dice5 } from 'lucide-vue-next'

import ChatAttackCard from './ChatAttackCard.vue'
import ChatRollResult from './ChatRollResult.vue'

export interface ParsedMessage {
    id: string
    user_id: string
    created_at: string
    sender_name: string
    character_name?: string
    avatar_url?: string
    type: 'text' | 'roll' | 'whisper' | 'system'
    content: string
    rollData?: any // O conteúdo parseado como JSON
}

const props = defineProps<{
    message: ParsedMessage
    isOwn: boolean
    isDM: boolean
}>()

const emit = defineEmits<{
    (e: 'delete', id: string): void
    (e: 'roll-damage', id: string, formula: string): void
}>()

const displayName = computed(() => {
    if (props.isDM && !props.message.character_name) return 'Mestre'
    return props.message.character_name || props.message.sender_name || 'Desconhecido'
})

const timeStr = computed(() => {
    return new Date(props.message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
})

const initials = computed(() => {
    return displayName.value.substring(0, 2).toUpperCase()
})

const avatarColors = computed(() => {
    // Generate a consistent color based on name
    const colors = ['bg-red-900/50 text-red-200', 'bg-blue-900/50 text-blue-200', 'bg-emerald-900/50 text-emerald-200', 'bg-amber-900/50 text-amber-200', 'bg-purple-900/50 text-purple-200', 'bg-pink-900/50 text-pink-200', 'bg-cyan-900/50 text-cyan-200']
    const idx = Array.from(displayName.value).reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
    return colors[idx]
})

function handleDelete() {
    if (confirm('Tem certeza que deseja apagar esta mensagem?')) {
        emit('delete', props.message.id)
    }
}
</script>

<template>
    <div class="flex flex-col gap-1 relative group w-full animate-in fade-in slide-in-from-bottom-2 duration-200">
        <!-- Header: Avatar + Nome + Tempo -->
        <div class="flex items-center gap-2">
            <template v-if="message.type !== 'system'">
                <img v-if="message.avatar_url" :src="message.avatar_url" class="w-6 h-6 rounded-full object-cover bg-zinc-800" />
                <div v-else class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border border-white/5" :class="avatarColors">
                    {{ initials }}
                </div>
            </template>
            <span class="text-xs font-bold" :class="isOwn ? 'text-primary' : 'text-zinc-400'">
                {{ displayName }}
            </span>
            <span v-if="message.type === 'whisper'"
                class="text-[9px] uppercase font-bold text-fuchsia-400 bg-fuchsia-950/40 px-1 py-0.5 rounded border border-fuchsia-900/50">SUSSURRO</span>
            <span class="text-[10px] text-muted-foreground ml-auto">{{ timeStr }}</span>
            <button v-if="isOwn" @click="handleDelete" class="w-5 h-5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-zinc-500 hover:text-red-400 rounded hover:bg-zinc-800 cursor-pointer" title="Apagar mensagem">
                <Trash2 class="w-3 h-3" />
            </button>
        </div>

        <!-- Conteúdo -->
        <div class="text-sm px-3 py-2 rounded-lg border break-words shadow-sm relative ml-8"
            :class="[
                message.type === 'roll' ? 'border-amber-500/20 bg-amber-950/10' : 
                message.type === 'whisper' ? 'border-fuchsia-500/30 bg-fuchsia-950/10 text-fuchsia-100' : 
                message.type === 'system' ? 'border-zinc-800 bg-zinc-900/30 text-zinc-400 italic text-center ml-0' :
                'border-border/50 bg-zinc-900/80 text-zinc-200'
            ]">
            
            <template v-if="message.type === 'roll' || (message.type === 'whisper' && message.rollData?.is_roll)">
                <div v-if="message.rollData" class="space-y-1.5 pt-0.5">
                    <template v-if="message.rollData.is_attack">
                        <ChatAttackCard 
                            :label="message.rollData.label"
                            :is-own="isOwn"
                            :attack="message.rollData.attack"
                            :damage-pending="message.rollData.damage_pending"
                            :damage-formula="message.rollData.damage_formula"
                            :damage="message.rollData.damage"
                            :is-whisper="message.type === 'whisper'"
                            @roll-damage="(f) => emit('roll-damage', message.id, f)"
                        />
                    </template>
                    <template v-else-if="message.rollData.is_dual_roll">
                        <!-- Backward compatibility for old dual rolls -->
                         <div class="flex items-center gap-2 font-bold mb-2" :class="message.type === 'whisper' ? 'text-fuchsia-400' : 'text-amber-500'">
                            <Dice5 class="w-4 h-4" />
                            <span>{{ message.rollData.label || 'Rolagem' }}</span>
                        </div>
                        <ChatRollResult title="Ataque" :formula="message.rollData.attack.formula" :breakdown="message.rollData.attack.breakdown" :result="message.rollData.attack.result" :color-scheme="message.type === 'whisper' ? 'fuchsia' : 'amber'" />
                        <ChatRollResult title="Dano" :formula="message.rollData.damage.formula" :breakdown="message.rollData.damage.breakdown" :result="message.rollData.damage.result" color-scheme="red" />
                    </template>
                    <template v-else>
                        <div class="flex items-center gap-2 font-bold mb-2" :class="message.type === 'whisper' ? 'text-fuchsia-400' : 'text-amber-500'">
                            <Dice5 class="w-4 h-4" />
                            <span>{{ message.rollData.label || 'Rolagem' }}</span>
                        </div>
                        <ChatRollResult :formula="message.rollData.formula" :breakdown="message.rollData.breakdown" :result="message.rollData.result" :color-scheme="message.type === 'whisper' ? 'fuchsia' : 'amber'" />
                    </template>
                </div>
                <div v-else class="flex items-center gap-2 font-mono font-bold text-amber-500">
                    <Dice5 class="w-4 h-4" />
                    {{ message.content }}
                </div>
            </template>

            <template v-else-if="message.type === 'whisper'">
                {{ message.rollData?.text || message.content }}
            </template>

            <template v-else>
                {{ message.content }}
            </template>
        </div>
    </div>
</template>

```


---
## FILE: src/components/campaign/ChatRollResult.vue
```vue
<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
    title?: string
    formula: string
    breakdown: string
    result: number
    colorScheme?: 'amber' | 'red' | 'fuchsia' | 'emerald' | 'blue'
}>()

const colorClasses = computed(() => {
    switch (props.colorScheme) {
        case 'red':
            return {
                border: 'border-red-900/30',
                title: 'text-red-500/70',
                formula: 'text-red-500/50',
                breakdown: 'text-red-500/80',
                result: 'text-red-400'
            }
        case 'fuchsia':
            return {
                border: 'border-fuchsia-900/30',
                title: 'text-fuchsia-500/70',
                formula: 'text-fuchsia-500/60',
                breakdown: 'text-fuchsia-500/90',
                result: 'text-fuchsia-300'
            }
        case 'emerald':
            return {
                border: 'border-emerald-900/30',
                title: 'text-emerald-500/70',
                formula: 'text-emerald-500/50',
                breakdown: 'text-emerald-500/80',
                result: 'text-emerald-400'
            }
        case 'blue':
            return {
                border: 'border-blue-900/30',
                title: 'text-blue-500/70',
                formula: 'text-blue-500/50',
                breakdown: 'text-blue-500/80',
                result: 'text-blue-400'
            }
        case 'amber':
        default:
            return {
                border: 'border-amber-900/30',
                title: 'text-amber-500/70',
                formula: 'text-amber-500/50',
                breakdown: 'text-amber-500/80',
                result: 'text-amber-300'
            }
    }
})
</script>

<template>
    <div class="flex flex-col gap-1 bg-black/20 p-2 rounded border relative mt-1" :class="colorClasses.border">
        <div v-if="title"
            class="absolute -top-2 left-2 text-[8px] bg-zinc-900 px-1 rounded-sm uppercase tracking-wider font-bold"
            :class="colorClasses.title">
            {{ title }}
        </div>
        <div class="flex items-center justify-between text-xs mt-1">
            <span class="font-mono text-left flex-1" :class="colorClasses.formula" :title="formula">{{ formula || '?' }}</span>
            <span class="font-mono text-right break-words max-w-[150px] leading-tight" :class="colorClasses.breakdown">{{ breakdown }}</span>
        </div>
        <div class="text-3xl font-black text-center tracking-tighter mt-1" :class="colorClasses.result">
            {{ result }}
        </div>
    </div>
</template>

```


---
## FILE: src/components/campaign/ChatSidebar.vue
```vue
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send } from 'lucide-vue-next'
import { DiceRoller } from '@dice-roller/rpg-dice-roller'
import ChatMessage from './ChatMessage.vue'
import { useCampaignRolls } from '@/lib/useCampaignRolls'

const roller = new DiceRoller()

const props = defineProps<{
    campaignId: string
    memberName?: string
    avatarUrl?: string | null
    members?: any[]
    dmId?: string
}>()

const recipientId = defineModel<string>('recipientId', { default: 'all' })

const { rollDamage, deleteMessage } = useCampaignRolls(
    props.campaignId, 
    computed(() => props.memberName || ''), 
    recipientId, 
    computed(() => props.avatarUrl || null)
)

const authStore = useAuthStore()
const messages = ref<any[]>([])
const newMessage = ref('')
const messageContainer = ref<HTMLElement | null>(null)
let subscription: any = null

async function fetchMessages() {
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('campaign_id', props.campaignId)
        .order('created_at', { ascending: true })
        .limit(50)

    if (!error && data) {
        messages.value = data.map(m => {
            if (['roll', 'whisper'].includes(m.type)) {
                try { m.rollData = JSON.parse(m.content) } catch { }
            }
            return m
        })
        scrollToBottom()
    }
}

function scrollToBottom() {
    nextTick(() => {
        if (messageContainer.value) {
            messageContainer.value.scrollTop = messageContainer.value.scrollHeight
        }
    })
}

async function sendMessage() {
    if (!newMessage.value.trim()) return

    const content = newMessage.value.trim()
    const senderName = props.memberName || authStore.user?.user_metadata?.name || 'Unknown'

    let type = recipientId.value === 'all' ? 'text' : 'whisper'
    let finalContent = content

    if (content.startsWith('/roll ')) {
        const formula = content.replace('/roll ', '').trim()
        try {
            const rollResult = roller.roll(formula)
            const roll = Array.isArray(rollResult) ? rollResult[0] : rollResult
            if (roll) {
                type = recipientId.value === 'all' ? 'roll' : 'whisper'
                const breakdown = roll.output.split(': ')[1] || roll.output
                const payload = {
                    label: 'Rolagem Manual',
                    formula,
                    result: roll.total,
                    breakdown,
                    is_roll: true,
                    target_id: recipientId.value === 'all' ? null : recipientId.value
                }
                finalContent = JSON.stringify(payload)
            }
        } catch (e) {
            console.error('Invalid roll formula:', e)
        }
    } else if (type === 'whisper') {
        const payload = {
            text: content,
            target_id: recipientId.value
        }
        finalContent = JSON.stringify(payload)
    }

    const { error } = await supabase
        .from('messages')
        .insert({
            campaign_id: props.campaignId,
            user_id: authStore.user?.id,
            sender_name: senderName,
            character_name: props.memberName || senderName,
            avatar_url: props.avatarUrl || null,
            content: finalContent,
            type: type
        })

    if (!error) {
        newMessage.value = ''
    } else {
        console.error('Error sending message:', error)
    }
}

function setupRealtime() {
    subscription = supabase
        .channel(`campaign-chat:${props.campaignId}`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'messages',
                filter: `campaign_id=eq.${props.campaignId}`
            },
            (payload) => {
                if (payload.eventType === 'INSERT') {
                    const newMsg = payload.new as any
                    if (['roll', 'whisper'].includes(newMsg.type)) {
                        try { newMsg.rollData = JSON.parse(newMsg.content) } catch { }
                    }
                    messages.value.push(newMsg)
                    scrollToBottom()
                } else if (payload.eventType === 'UPDATE') {
                    const idx = messages.value.findIndex(m => m.id === payload.new.id)
                    if (idx !== -1) {
                        const updMsg = payload.new as any
                        if (['roll', 'whisper'].includes(updMsg.type)) {
                            try { updMsg.rollData = JSON.parse(updMsg.content) } catch { }
                        }
                        messages.value[idx] = updMsg
                    }
                } else if (payload.eventType === 'DELETE') {
                    messages.value = messages.value.filter(m => m.id !== payload.old.id)
                }
            }
        )
        .subscribe()
}

onMounted(() => {
    fetchMessages()
    setupRealtime()
})

onUnmounted(() => {
    if (subscription) subscription.unsubscribe()
})
</script>

<template>
    <div class="flex flex-col h-full bg-zinc-950 border-l border-border w-72 md:w-80">
        <!-- Header -->
        <div class="p-3 border-b border-border bg-zinc-900/50">
            <h3 class="font-bold text-sm">Chat da Campanha</h3>
        </div>

        <!-- Messages -->
        <div ref="messageContainer" class="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            <div v-if="messages.length === 0" class="text-center text-muted-foreground text-xs py-10 opacity-50">
                Nenhuma mensagem ainda.
            </div>
            <template v-for="msg in messages" :key="msg.id">
                <ChatMessage 
                  v-if="msg.type !== 'whisper' || msg.user_id === authStore.user?.id || (msg.rollData?.target_id && msg.rollData.target_id === authStore.user?.id) || authStore.user?.id === props.dmId"
                  :message="msg"
                  :is-own="msg.user_id === authStore.user?.id"
                  :is-d-m="authStore.user?.id === props.dmId"
                  @delete="(id) => deleteMessage(id)"
                  @roll-damage="rollDamage"
                />
            </template>
        </div>

        <!-- Input -->
        <div class="p-3 border-t border-border bg-zinc-900/50 space-y-2">
            <div class="flex items-center justify-between gap-2">
                <span class="text-[10px] font-bold text-muted-foreground uppercase">Enviar para:</span>
                <select v-model="recipientId"
                    class="text-xs bg-zinc-950 border border-zinc-800 rounded px-1.5 py-0.5 text-zinc-300 focus:outline-none focus:border-primary">
                    <option value="all">Todos</option>
                    <option v-if="props.dmId && authStore.user?.id !== props.dmId" :value="props.dmId">Mestre</option>
                    <template v-if="props.members">
                        <option
                            v-for="m in props.members.filter(x => x.user_id !== authStore.user?.id && x.user_id !== props.dmId)"
                            :key="m.user_id" :value="m.user_id">
                            {{ m.sheets?.name || 'Jogador' }}
                        </option>
                    </template>
                </select>
            </div>
            <form @submit.prevent="sendMessage" class="flex gap-2">
                <Input v-model="newMessage"
                    :placeholder="recipientId === 'all' ? 'Digite sua mensagem...' : 'Sussurrar mensagem...'"
                    class="flex-1 bg-zinc-950 border-zinc-800 focus-visible:ring-primary/50" />
                <Button type="submit" size="icon" :disabled="!newMessage.trim()">
                    <Send class="w-4 h-4" />
                </Button>
            </form>
        </div>
    </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #3f3f46;
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #52525b;
}
</style>

```


---
## FILE: src/components/campaign/CreateCampaignModal.vue
```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { X, Sword } from 'lucide-vue-next'

const emit = defineEmits(['close'])
const router = useRouter()
const authStore = useAuthStore()

const name = ref('')
const loading = ref(false)
const error = ref('')

function generateCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
}

async function createCampaign() {
    if (!name.value.trim()) return
    loading.value = true
    error.value = ''

    const code = generateCode()

    // 1. Create Campaign
    const { data: campaign, error: createError } = await supabase
        .from('campaigns')
        .insert({
            name: name.value.trim(),
            dm_id: authStore.user?.id,
            join_code: code
        })
        .select()
        .single()

    if (createError) {
        console.error(createError)
        error.value = 'Erro ao criar campanha. Tente novamente.'
        loading.value = false
        return
    }

    // 2. Add DM as member (role 'dm')
    const { error: memberError } = await supabase
        .from('campaign_members')
        .insert({
            campaign_id: campaign.id,
            user_id: authStore.user?.id,
            role: 'dm'
        })

    if (memberError) {
        console.error(memberError)
        error.value = 'Erro ao adicionar mestre. Mas a campanha foi criada.'
        // Might need rollback or manual fix, but for MVP just warn
    }

    loading.value = false
    emit('close')
    router.push(`/campaign/${campaign.id}`)
}
</script>

<template>
    <div class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" @click.self="emit('close')">
        <Card class="w-full max-w-md bg-zinc-950 border-zinc-800 animate-in fade-in zoom-in-95 duration-200">
            <CardHeader class="flex flex-row items-center justify-between pb-2">
                <CardTitle class="text-lg flex items-center gap-2">
                    <Sword class="w-5 h-5 text-primary" /> Nova Campanha
                </CardTitle>
                <Button variant="ghost" size="icon" @click="emit('close')" class="h-8 w-8">
                    <X class="w-4 h-4" />
                </Button>
            </CardHeader>

            <CardContent class="space-y-4 pt-4">
                <div class="space-y-1">
                    <Label>Nome da Aventura</Label>
                    <Input v-model="name" placeholder="Ex: A Maldição de Strahd" />
                </div>
                <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
            </CardContent>

            <CardFooter class="flex justify-end gap-2 pt-2">
                <Button variant="ghost" @click="emit('close')">Cancelar</Button>
                <Button @click="createCampaign" :disabled="loading || !name.trim()">
                    {{ loading ? 'Criando...' : 'Criar Campanha' }}
                </Button>
            </CardFooter>
        </Card>
    </div>
</template>

```


---
## FILE: src/components/campaign/JoinCampaignModal.vue
```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { X, Key } from 'lucide-vue-next'

const emit = defineEmits(['close'])
const router = useRouter()
const authStore = useAuthStore()

const code = ref('')
const loading = ref(false)
const error = ref('')

async function joinCampaign() {
    if (!code.value.trim()) return
    loading.value = true
    error.value = ''

    // 1. Find Campaign by join_code
    const { data: campaign, error: findError } = await supabase
        .from('campaigns')
        .select('id, name')
        .eq('join_code', code.value.trim().toUpperCase())
        .maybeSingle()

    if (findError || !campaign) {
        error.value = 'Campanha não encontrada. Verifique o código.'
        loading.value = false
        return
    }

    // 2. Check if already a member
    const { data: existing } = await supabase
        .from('campaign_members')
        .select('id')
        .eq('campaign_id', campaign.id)
        .eq('user_id', authStore.user?.id)
        .maybeSingle()

    if (existing) {
        router.push(`/campaign/${campaign.id}`)
        emit('close')
        return
    }

    // 3. Join (no sheet linked — user picks sheet inside the campaign)
    const { error: joinError } = await supabase
        .from('campaign_members')
        .insert({
            campaign_id: campaign.id,
            user_id: authStore.user?.id,
            role: 'player',
            sheet_id: null
        })

    if (joinError) {
        console.error(joinError)
        error.value = 'Erro ao entrar na campanha.'
        loading.value = false
        return
    }

    loading.value = false
    emit('close')
    router.push(`/campaign/${campaign.id}`)
}
</script>

<template>
    <div class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" @click.self="emit('close')">
        <Card class="w-full max-w-md bg-zinc-950 border-zinc-800 animate-in fade-in zoom-in-95 duration-200">
            <CardHeader class="flex flex-row items-center justify-between pb-2">
                <CardTitle class="text-lg flex items-center gap-2">
                    <Key class="w-5 h-5 text-primary" /> Entrar em Campanha
                </CardTitle>
                <Button variant="ghost" size="icon" @click="emit('close')" class="h-8 w-8">
                    <X class="w-4 h-4" />
                </Button>
            </CardHeader>

            <CardContent class="space-y-4 pt-4">
                <div class="space-y-1">
                    <Label>Código de Convite</Label>
                    <Input v-model="code" placeholder="Ex: X9Y2Z1" class="uppercase font-mono"
                        @keyup.enter="joinCampaign" />
                </div>
                <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
            </CardContent>

            <CardFooter class="flex justify-end gap-2 pt-2">
                <Button variant="ghost" @click="emit('close')">Cancelar</Button>
                <Button @click="joinCampaign" :disabled="loading || !code.trim()">
                    {{ loading ? 'Entrando...' : 'Entrar na Campanha' }}
                </Button>
            </CardFooter>
        </Card>
    </div>
</template>

```


---
## FILE: src/components/campaign/notepad/NotepadEditor.vue
```vue
<template>
  <div class="flex flex-col h-full bg-background overflow-hidden relative">
    <div class="flex-1 overflow-y-auto w-full max-w-full">
      <EditorContent :editor="editor" class="h-full focus:outline-none" />
    </div>
    <NotepadToolbar v-if="editor" :editor="editor" :saving="saving" />
  </div>
</template>

<script setup lang="ts">
import { watch, onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Highlight from '@tiptap/extension-highlight'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import NotepadToolbar from './NotepadToolbar.vue'

const props = defineProps<{
  content: Record<string, any>
  noteId: string
  saving: boolean
}>()

const emit = defineEmits<{
  (e: 'update', content: Record<string, any>): void
}>()

const editor = useEditor({
  content: props.content?.type ? props.content : { type: 'doc', content: [{ type: 'paragraph' }] },
  extensions: [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
    }),
    Placeholder.configure({
      placeholder: 'Comece a escrever suas anotações...',
    }),
    Highlight,
    TaskList,
    TaskItem.configure({
      nested: true,
    }),
  ],
  onUpdate: ({ editor }) => {
    emit('update', editor.getJSON())
  },
  editorProps: {
    attributes: {
      class: 'prose prose-invert prose-sm max-w-none focus:outline-none min-h-full p-4 w-full prose-headings:font-bold prose-p:leading-relaxed prose-a:text-primary outline-none',
    },
  },
})

watch(() => props.noteId, () => {
  if (editor.value) {
    // Only update content if note changed, wait for next tick
    setTimeout(() => {
        editor.value?.commands.setContent(props.content?.type ? props.content : { type: 'doc', content: [{ type: 'paragraph' }] })
    }, 10)
  }
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<style>
/* Tiptap Checkbox styling */
ul[data-type="taskList"] {
  list-style: none;
  padding: 0;
}

ul[data-type="taskList"] p {
  margin: 0;
}

ul[data-type="taskList"] li {
  display: flex;
  align-items: flex-start;
  margin-bottom: 0.25rem;
  gap: 0.5rem;
}

ul[data-type="taskList"] li > label {
  flex: 0 0 auto;
  margin-right: 0.5rem;
  user-select: none;
}

ul[data-type="taskList"] li > label input {
    margin-top: 5px;
}

ul[data-type="taskList"] li > div {
  flex: 1 1 auto;
}

ul[data-type="taskList"] input[type="checkbox"] {
  cursor: pointer;
}

ul[data-type="taskList"] ul[data-type="taskList"] {
  margin: 0;
}
</style>

```


---
## FILE: src/components/campaign/notepad/NotepadPanel.vue
```vue
<template>
  <div v-show="visible" class="flex flex-col h-full w-full lg:w-[480px] bg-background border-r border-border shrink-0 z-40 relative overflow-hidden">

    <!-- ── Top Header ────────────────────────────────────── -->
    <div class="flex items-center justify-between px-3 py-2 border-b border-border bg-card shrink-0 min-h-[44px]">
      <div class="flex items-center gap-2">
        <!-- Back button: only when viewing a note on narrow screens -->
        <button
          v-if="notepad.activeNote.value && showEditor"
          @click="goBack"
          class="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Voltar para arquivos"
        >
          <ArrowLeft class="w-4 h-4" />
        </button>

        <BookOpen class="w-4 h-4 text-primary shrink-0" />

        <span class="font-semibold text-sm truncate max-w-[200px]">
          <template v-if="showEditor && notepad.activeNote.value">
            {{ notepad.activeNote.value.title }}
          </template>
          <template v-else>
            Anotações
          </template>
        </span>
      </div>

      <div class="flex items-center gap-1">
        <!-- New folder / new note shortcuts in tree view -->
        <template v-if="!showEditor">
          <button @click="notepad.createFolder(null)" class="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground" title="Nova Pasta">
            <FolderPlus class="w-4 h-4" />
          </button>
          <button @click="notepad.createNote(null).then(openEditorAfterCreate)" class="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground" title="Nova Nota">
            <FilePlus class="w-4 h-4" />
          </button>
        </template>

        <button @click="$emit('close')" class="p-1.5 hover:bg-muted rounded-md text-muted-foreground" title="Fechar">
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- ── Body ──────────────────────────────────────────── -->
    <div class="flex flex-1 overflow-hidden relative">

      <!-- Loading overlay -->
      <div v-if="notepad.loading.value" class="absolute inset-0 flex items-center justify-center bg-background/70 z-20">
        <Loader2 class="w-7 h-7 animate-spin text-primary" />
      </div>

      <!-- Sidebar (file tree) — always visible on lg, slides in/out on smaller -->
      <Transition name="slide-left">
        <NotepadSidebar
          v-show="!showEditor"
          class="w-full h-full"
          :tree="notepad.tree.value"
          :active-note-id="notepad.activeNoteId.value"
          :expanded-folders="notepad.expandedFolders.value"
          @select="handleSelect"
          @toggle-folder="notepad.toggleFolder"
          @create-note="notepad.createNote"
          @create-folder="notepad.createFolder"
          @rename="notepad.renameItem"
          @delete="notepad.deleteItem"
          @move="notepad.moveItem"
        />
      </Transition>

      <!-- Editor pane -->
      <Transition name="slide-right">
        <div
          v-show="showEditor"
          class="flex-1 flex flex-col h-full bg-card border-l border-border absolute inset-0 lg:relative"
        >
          <NotepadEditor
            v-if="notepad.activeNote.value"
            :note-id="notepad.activeNote.value.id"
            :content="notepad.activeNote.value.content"
            :saving="notepad.saving.value"
            @update="(content) => notepad.updateNoteContent(notepad.activeNote.value!.id, content)"
          />
          <!-- Empty state on lg desktop when no note is selected -->
          <div v-else class="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
            <BookOpen class="w-14 h-14 mb-4 text-muted-foreground/20" />
            <h3 class="font-medium text-base mb-1 text-foreground">Bloco de Notas</h3>
            <p class="text-xs max-w-[220px]">Selecione uma nota na lista ou crie uma nova para começar.</p>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { BookOpen, X, Loader2, ArrowLeft, FolderPlus, FilePlus } from 'lucide-vue-next'
import NotepadSidebar from './NotepadSidebar.vue'
import NotepadEditor from './NotepadEditor.vue'
import { useNotepad } from './useNotepad'

const props = defineProps<{
  campaignId: string
  visible: boolean
}>()

defineEmits<{
  (e: 'close'): void
}>()

const notepad = useNotepad(props.campaignId)

// Controls which pane is active on mobile.
// On lg screens both panes are always shown side by side.
const showEditor = ref(false)

function handleSelect(id: string) {
  notepad.selectNote(id)
  showEditor.value = true
}

function goBack() {
  showEditor.value = false
}

function openEditorAfterCreate(id: string | null) {
  if (id) showEditor.value = true
}

onMounted(async () => {
  if (props.campaignId) {
    await notepad.fetchNotes()
    // On desktop, if there's already a note, show the editor
    if (notepad.activeNote.value) {
      showEditor.value = true
    }
  }
})

watch(() => props.campaignId, async () => {
  if (props.campaignId) {
    await notepad.fetchNotes()
  }
})

// Reset to tree view when panel is closed then reopened
watch(() => props.visible, (v) => {
  if (v && !notepad.activeNote.value) {
    showEditor.value = false
  }
})
</script>

<style scoped>
/* Slide LEFT → show sidebar */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
  position: absolute;
  inset: 0;
}
.slide-left-enter-from { transform: translateX(-100%); opacity: 0; }
.slide-left-leave-to  { transform: translateX(-100%); opacity: 0; }

/* Slide RIGHT → show editor */
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
  position: absolute;
  inset: 0;
}
.slide-right-enter-from { transform: translateX(100%); opacity: 0; }
.slide-right-leave-to  { transform: translateX(100%); opacity: 0; }
</style>

```


---
## FILE: src/components/campaign/notepad/NotepadSidebar.vue
```vue
<template>
  <div class="flex flex-col h-full w-full bg-background overflow-hidden">

    <div class="flex-1 overflow-y-auto py-2 pr-1 custom-scrollbar relative">
      <div v-if="tree.length === 0" class="text-xs text-muted-foreground text-center p-4">
        Nenhuma anotação.<br>Crie uma nova nota ou pasta para começar.
      </div>
      
      <!-- Root drop zone top -->
      <div class="h-2 mx-2 transition-colors relative z-10 rounded-full"
           :class="isDropTop ? 'bg-primary' : 'bg-transparent hover:bg-muted'"
           @dragover.prevent="isDropTop = true"
           @dragleave.prevent="isDropTop = false"
           @drop="onDropTop" />

      <NotepadTreeItem
        v-for="node in tree"
        :key="node.item.id"
        :node="node"
        :depth="0"
        :active-note-id="activeNoteId"
        :expanded-folders="expandedFolders"
        @select="$emit('select', $event)"
        @toggle-folder="$emit('toggle-folder', $event)"
        @move="$emit('move', $event.itemId, $event.newParentId, $event.newIndex)"
        @rename="$emit('rename', $event.id, $event.newTitle)"
        @delete="$emit('delete', $event)"
        @create-note="$emit('create-note', $event)"
        @create-folder="$emit('create-folder', $event)"
      />
      
      <!-- Root drop zone bottom -->
      <div class="h-8 mx-2 mt-2 transition-colors rounded flex items-center justify-center text-xs text-muted-foreground border-2 border-dashed border-transparent relative z-10"
           :class="isDropBottom ? 'border-primary bg-primary/10 text-primary' : 'hover:border-border'"
           @dragover.prevent="isDropBottom = true"
           @dragleave.prevent="isDropBottom = false"
           @drop="onDropBottom">
        {{ isDropBottom ? 'Soltar na raiz' : '' }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import NotepadTreeItem from './NotepadTreeItem.vue'
import type { TreeNode } from './useNotepad'

const props = defineProps<{
  tree: TreeNode[]
  activeNoteId: string | null
  expandedFolders: Set<string>
}>()

const emit = defineEmits<{
  (e: 'select', id: string): void
  (e: 'toggle-folder', id: string): void
  (e: 'create-note', parentId: string | null): void
  (e: 'create-folder', parentId: string | null): void
  (e: 'rename', id: string, newTitle: string): void
  (e: 'delete', id: string): void
  (e: 'move', itemId: string, newParentId: string | null, newIndex: number): void
}>()

const isDropTop = ref(false)
const isDropBottom = ref(false)

function onDropTop(e: DragEvent) {
  isDropTop.value = false
  const draggedId = e.dataTransfer?.getData('text/plain')
  if (!draggedId) return
  emit('move', draggedId, null, 0)
}

function onDropBottom(e: DragEvent) {
  isDropBottom.value = false
  const draggedId = e.dataTransfer?.getData('text/plain')
  if (!draggedId) return
  emit('move', draggedId, null, props.tree.length)
}
</script>

```


---
## FILE: src/components/campaign/notepad/NotepadToolbar.vue
```vue
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

```


---
## FILE: src/components/campaign/notepad/NotepadTreeItem.vue
```vue
<template>
  <div
    :draggable="true"
    @dragstart.stop="onDragStart"
    @dragover.prevent.stop="onDragOver"
    @dragleave.prevent.stop="onDragLeave"
    @drop.stop="onDrop"
    :class="[
      'select-none',
      { 'bg-primary/10 border-r-2 border-primary': isActive },
      { 'border-l-2 border-primary bg-primary/5': isDragOver && node.item.is_folder }
    ]"
  >
    <div class="flex items-center gap-1.5 px-2 py-1.5 cursor-pointer hover:bg-muted/50 rounded group relative"
         :style="{ paddingLeft: `${depth * 16 + 8}px` }"
         @click="handleClick"
         @dblclick="startRename"
         @contextmenu.prevent>
      
      <ChevronRight v-if="node.item.is_folder" 
        class="w-3.5 h-3.5 text-muted-foreground transition-transform shrink-0" 
        :class="{ 'rotate-90': isExpanded }" />
      <span v-else class="w-3.5 shrink-0" />
      
      <FolderOpen v-if="node.item.is_folder && isExpanded" class="w-4 h-4 text-amber-500 shrink-0" />
      <Folder v-else-if="node.item.is_folder" class="w-4 h-4 text-amber-500/70 shrink-0" />
      <FileText v-else class="w-4 h-4 text-muted-foreground shrink-0 flex-shrink-0" />
      
      <input v-if="isRenaming" v-model="renameValue" 
        class="text-sm bg-background border border-border rounded px-1.5 py-0.5 w-full outline-none focus:border-primary" 
        @blur="confirmRename" @keydown.enter="confirmRename" @keydown.escape="cancelRename"
        ref="renameInput" />
      <span v-else class="text-sm truncate flex-1" :class="isActive ? 'text-foreground font-medium' : 'text-muted-foreground'">
        {{ node.item.title }}
      </span>

      <!-- Context Menu via custom div -->
      <div class="relative" ref="menuRef">
        <button @click.stop="toggleMenu" class="w-5 h-5 flex items-center justify-center rounded hover:bg-muted opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
          <MoreVertical class="w-4 h-4" />
        </button>
        
        <div v-if="showMenu" class="absolute right-0 top-full mt-1 w-48 rounded-md bg-zinc-950 border border-zinc-800 shadow-lg py-1 z-[60] overflow-hidden" @click.stop>
          <button v-if="node.item.is_folder" @click="handleAction('create-note')" class="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-900 hover:text-white flex items-center">
            <FileText class="w-3.5 h-3.5 mr-2 text-muted-foreground" /> Nova nota aqui
          </button>
          <button v-if="node.item.is_folder" @click="handleAction('create-folder')" class="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-900 hover:text-white flex items-center">
            <FolderPlus class="w-3.5 h-3.5 mr-2 text-muted-foreground" /> Nova pasta aqui
          </button>
          <div v-if="node.item.is_folder" class="h-px bg-zinc-800 my-1"></div>
          <button @click="handleAction('rename')" class="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-900 hover:text-white flex items-center">
            <Edit2 class="w-3.5 h-3.5 mr-2 text-muted-foreground" /> Renomear
          </button>
          <div class="h-px bg-zinc-800 my-1"></div>
          <button @click="handleAction('delete')" class="w-full text-left px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 flex items-center">
            <Trash2 class="w-3.5 h-3.5 mr-2" /> Excluir
          </button>
        </div>
      </div>
    </div>
    
    <div v-if="node.item.is_folder && isExpanded" class="children overflow-hidden">
      <!-- Drop zone at top of folder -->
      <div class="h-1 mx-4 transition-colors relative z-10 rounded-full"
           :class="isDropTop ? 'bg-primary' : 'bg-transparent hover:bg-muted'"
           @dragover.prevent.stop="isDropTop = true"
           @dragleave.prevent.stop="isDropTop = false"
           @drop.stop="onDropTop" />

      <NotepadTreeItem
        v-for="child in node.children"
        :key="child.item.id"
        :node="child"
        :depth="depth + 1"
        :active-note-id="activeNoteId"
        :expanded-folders="expandedFolders"
        @select="$emit('select', $event)"
        @toggle-folder="$emit('toggle-folder', $event)"
        @move="$emit('move', $event)"
        @rename="$emit('rename', $event)"
        @delete="$emit('delete', $event)"
        @create-note="$emit('create-note', $event)"
        @create-folder="$emit('create-folder', $event)"
      />
      
      <!-- Drop zone visual no final da pasta -->
      <div class="h-2 mx-4 transition-colors relative z-10 rounded-full"
           :class="isDropBottom ? 'bg-primary' : 'bg-transparent hover:bg-muted'"
           @dragover.prevent.stop="isDropBottom = true"
           @dragleave.prevent.stop="isDropBottom = false"
           @drop.stop="onDropBottom" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { 
  ChevronRight, Folder, FolderOpen, FileText, 
  MoreVertical, Trash2, Edit2, FolderPlus 
} from 'lucide-vue-next'
import { onClickOutside } from '@vueuse/core'
import type { TreeNode } from './useNotepad'

const props = defineProps<{
  node: TreeNode
  depth: number
  activeNoteId: string | null
  expandedFolders: Set<string>
}>()

const emit = defineEmits<{
  (e: 'select', id: string): void
  (e: 'toggle-folder', id: string): void
  (e: 'move', data: { itemId: string, newParentId: string | null, newIndex: number }): void
  (e: 'rename', data: { id: string, newTitle: string }): void
  (e: 'delete', id: string): void
  (e: 'create-note', parentId: string | null): void
  (e: 'create-folder', parentId: string | null): void
}>()

const isExpanded = computed(() => props.expandedFolders.has(props.node.item.id))
const isActive = computed(() => props.activeNoteId === props.node.item.id)

const isRenaming = ref(false)
const renameValue = ref('')
const renameInput = ref<HTMLInputElement | null>(null)

const menuRef = ref<HTMLElement | null>(null)
const showMenu = ref(false)

onClickOutside(menuRef, () => {
  showMenu.value = false
})

function toggleMenu() {
  showMenu.value = !showMenu.value
}

function handleAction(action: 'create-note' | 'create-folder' | 'rename' | 'delete') {
  showMenu.value = false
  if (action === 'create-note') emit('create-note', props.node.item.id)
  if (action === 'create-folder') emit('create-folder', props.node.item.id)
  if (action === 'rename') startRename()
  if (action === 'delete') confirmDelete()
}

function handleClick() {
  if (props.node.item.is_folder) {
    emit('toggle-folder', props.node.item.id)
  } else {
    emit('select', props.node.item.id)
  }
}

function startRename() {
  renameValue.value = props.node.item.title
  isRenaming.value = true
  nextTick(() => {
    renameInput.value?.focus()
    renameInput.value?.select()
  })
}

function confirmRename() {
  if (isRenaming.value) {
    isRenaming.value = false
    if (renameValue.value.trim() && renameValue.value !== props.node.item.title) {
      emit('rename', { id: props.node.item.id, newTitle: renameValue.value.trim() })
    }
  }
}

function cancelRename() {
  isRenaming.value = false
}

function confirmDelete() {
  if (window.confirm(`Tem certeza que deseja excluir "${props.node.item.title}"?`)) {
    emit('delete', props.node.item.id)
  }
}

// Drag functionality
const isDragOver = ref(false)
const isDropTop = ref(false)
const isDropBottom = ref(false)

function onDragStart(e: DragEvent) {
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', props.node.item.id)
  }
}

function onDragOver(_e: DragEvent) {
  if (props.node.item.is_folder) {
    isDragOver.value = true
  }
}

function onDragLeave() {
  isDragOver.value = false
}

function onDrop(e: DragEvent) {
  isDragOver.value = false
  const draggedId = e.dataTransfer?.getData('text/plain')
  if (!draggedId || draggedId === props.node.item.id) return

  // Drop into folder
  if (props.node.item.is_folder) {
    emit('move', { itemId: draggedId, newParentId: props.node.item.id, newIndex: 0 })
    // Ensure folder is toggled open
    if (!isExpanded.value) {
      emit('toggle-folder', props.node.item.id)
    }
  }
}

function onDropTop(e: DragEvent) {
  isDropTop.value = false
  const draggedId = e.dataTransfer?.getData('text/plain')
  if (!draggedId || draggedId === props.node.item.id) return
  emit('move', { itemId: draggedId, newParentId: props.node.item.id, newIndex: 0 })
}

function onDropBottom(e: DragEvent) {
  isDropBottom.value = false
  const draggedId = e.dataTransfer?.getData('text/plain')
  if (!draggedId || draggedId === props.node.item.id) return
  emit('move', { itemId: draggedId, newParentId: props.node.item.id, newIndex: props.node.children.length })
}
</script>

```


---
## FILE: src/components/campaign/notepad/useNotepad.ts
```typescript
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useDebounceFn } from '@vueuse/core'

export interface NoteItem {
    id: string
    title: string
    content: Record<string, any>
    parent_id: string | null
    is_folder: boolean
    sort_order: number
    created_at: string
    updated_at: string
}

export interface TreeNode {
    item: NoteItem
    children: TreeNode[]
}

export function useNotepad(campaignId: string) {
    const items = ref<NoteItem[]>([])
    const activeNoteId = ref<string | null>(null)
    const expandedFolders = ref<Set<string>>(new Set())
    const loading = ref(true)
    const saving = ref(false)

    const tree = computed(() => buildTree(items.value, null))

    const activeNote = computed(() =>
        items.value.find(i => i.id === activeNoteId.value) ?? null
    )

    function buildTree(allItems: NoteItem[], parentId: string | null): TreeNode[] {
        return allItems
            .filter(i => i.parent_id === parentId)
            .sort((a, b) => a.sort_order - b.sort_order)
            .map(item => ({
                item,
                children: item.is_folder ? buildTree(allItems, item.id) : []
            }))
    }

    async function fetchNotes() {
        loading.value = true
        try {
            const { data: userData } = await supabase.auth.getUser()
            if (!userData.user) throw new Error('User not authenticated')

            const { data, error } = await supabase
                .from('campaign_notes')
                .select('*')
                .eq('campaign_id', campaignId)
                .eq('user_id', userData.user.id)
                .order('sort_order', { ascending: true })

            if (error) throw error
            items.value = data as NoteItem[]
        } catch (e) {
            console.error('Error fetching notes:', e)
        } finally {
            loading.value = false
        }
    }

    async function createNote(parentId: string | null = null): Promise<string | null> {
        try {
            const { data: userData } = await supabase.auth.getUser()
            if (!userData.user) return null

            const siblings = items.value.filter(i => i.parent_id === parentId)
            const maxSort = siblings.length > 0 ? Math.max(...siblings.map(s => s.sort_order)) : -1

            const newNote = {
                campaign_id: campaignId,
                user_id: userData.user.id,
                title: 'Nova Nota',
                content: { type: 'doc', content: [] }, // Default empty tip-tap
                parent_id: parentId,
                is_folder: false,
                sort_order: maxSort + 1
            }

            const { data, error } = await supabase
                .from('campaign_notes')
                .insert(newNote)
                .select()
                .single()

            if (error) throw error

            items.value.push(data)
            activeNoteId.value = data.id
            if (parentId) expandedFolders.value.add(parentId)
            return data.id
        } catch (e) {
            console.error('Error creating note:', e)
            return null
        }
    }

    async function createFolder(parentId: string | null = null): Promise<string | null> {
        try {
            const { data: userData } = await supabase.auth.getUser()
            if (!userData.user) return null

            const siblings = items.value.filter(i => i.parent_id === parentId)
            const maxSort = siblings.length > 0 ? Math.max(...siblings.map(s => s.sort_order)) : -1

            const newFolder = {
                campaign_id: campaignId,
                user_id: userData.user.id,
                title: 'Nova Pasta',
                content: {}, // Folders dont need content
                parent_id: parentId,
                is_folder: true,
                sort_order: maxSort + 1
            }

            const { data, error } = await supabase
                .from('campaign_notes')
                .insert(newFolder)
                .select()
                .single()

            if (error) throw error

            items.value.push(data)
            if (parentId) expandedFolders.value.add(parentId)
            return data.id
        } catch (e) {
            console.error('Error creating folder:', e)
            return null
        }
    }

    const debouncedSave = useDebounceFn(async (id: string, content: object) => {
        saving.value = true
        try {
            const item = items.value.find(i => i.id === id)
            if (item) item.content = content

            const { error } = await supabase
                .from('campaign_notes')
                .update({ content, updated_at: new Date().toISOString() })
                .eq('id', id)

            if (error) throw error
        } catch (e) {
            console.error('Error saving content:', e)
        } finally {
            saving.value = false
        }
    }, 1000)

    async function updateNoteContent(id: string, content: object) {
        const item = items.value.find(i => i.id === id)
        if (item) item.content = content
        saving.value = true
        debouncedSave(id, content)
    }

    async function renameItem(id: string, newTitle: string) {
        const item = items.value.find(i => i.id === id)
        if (item) {
            item.title = newTitle
            try {
                await supabase
                    .from('campaign_notes')
                    .update({ title: newTitle })
                    .eq('id', id)
            } catch (e) {
                console.error('Error renaming:', e)
            }
        }
    }

    async function deleteItem(id: string) {
        // Cascades handles db, do local changes
        function getChildrenIds(currentId: string): string[] {
            const children = items.value.filter(i => i.parent_id === currentId).map(i => i.id)
            return children.concat(...children.flatMap(getChildrenIds))
        }
        const toDeleteIds = [id, ...getChildrenIds(id)]

        items.value = items.value.filter(i => !toDeleteIds.includes(i.id))
        if (activeNoteId.value && toDeleteIds.includes(activeNoteId.value)) {
            activeNoteId.value = null
        }

        try {
            await supabase.from('campaign_notes').delete().eq('id', id)
        } catch (e) {
            console.error('Error deleting:', e)
        }
    }

    function isDescendant(potentialParentId: string, itemId: string): boolean {
        let current = items.value.find(i => i.id === potentialParentId)
        while (current) {
            if (current.id === itemId) return true
            current = items.value.find(i => i.id === current!.parent_id)
        }
        return false
    }

    async function moveItem(itemId: string, newParentId: string | null, newSortOrder: number) {
        if (itemId === newParentId) return
        if (newParentId && isDescendant(newParentId, itemId)) return // Prevent loop

        const item = items.value.find(i => i.id === itemId)
        if (!item) return

        const oldSiblings = items.value.filter(i => i.parent_id === item.parent_id && i.id !== itemId)
        oldSiblings.sort((a, b) => a.sort_order - b.sort_order)
        oldSiblings.forEach((sib, index) => { sib.sort_order = index })

        const newSiblings = items.value.filter(i => i.parent_id === newParentId && i.id !== itemId)
        newSiblings.sort((a, b) => a.sort_order - b.sort_order)
        newSiblings.splice(newSortOrder, 0, item)
        newSiblings.forEach((sib, index) => { sib.sort_order = index })

        item.parent_id = newParentId

        try {
            const updates = [
                ...oldSiblings.map(s => ({ id: s.id, sort_order: s.sort_order })),
                ...newSiblings.map(s => ({ id: s.id, parent_id: s.parent_id, sort_order: s.sort_order }))
            ]

            for (const update of updates) {
                await supabase.from('campaign_notes').update(update).eq('id', update.id)
            }
        } catch (e) {
            console.error('Error moving:', e)
        }
    }

    async function reorderItems(parentId: string | null, orderedIds: string[]) {
        const updates: { id: string, sort_order: number }[] = []
        orderedIds.forEach((id, index) => {
            const item = items.value.find(i => i.id === id)
            if (item) {
                item.sort_order = index
                item.parent_id = parentId
                updates.push({ id, sort_order: index })
            }
        })

        try {
            for (const update of updates) {
                await supabase.from('campaign_notes').update({ sort_order: update.sort_order, parent_id: parentId }).eq('id', update.id)
            }
        } catch (e) {
            console.error('Error reordering:', e)
        }
    }

    function selectNote(id: string) {
        const item = items.value.find(i => i.id === id)
        if (item && !item.is_folder) {
            activeNoteId.value = id
        }
    }

    function toggleFolder(id: string) {
        if (expandedFolders.value.has(id)) {
            expandedFolders.value.delete(id)
        } else {
            expandedFolders.value.add(id)
        }
    }

    return {
        items, tree, activeNote, activeNoteId,
        expandedFolders, loading, saving,
        fetchNotes, createNote, createFolder,
        updateNoteContent, renameItem, deleteItem,
        moveItem, reorderItems, debouncedSave,
        selectNote, toggleFolder
    }
}

```


---
## FILE: src/components/campaign/QuickNpcModal.vue
```vue
<script setup lang="ts">
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Trash2, Plus, Ghost } from 'lucide-vue-next'

const emit = defineEmits<{
    (e: 'close'): void
    (e: 'saved', sheetId: string): void
}>()

const authStore = useAuthStore()

const npc = ref({
    name: '',
    hp: 10,
    ac: 10,
    notes: '',
    attacks: [] as { title: string, attack: string, damage: string }[]
})

const saving = ref(false)

function addAttack() {
    npc.value.attacks.push({ title: 'Ataque Simples', attack: '1d20 + 2', damage: '1d6 + 1' })
}

function removeAttack(i: number) {
    npc.value.attacks.splice(i, 1)
}

async function save() {
    if (!npc.value.name.trim() || saving.value) return
    saving.value = true

    const data = {
        hp_max: npc.value.hp,
        hp_current: npc.value.hp,
        attributes: { str: { base: 10 }, dex: { base: 10 }, con: { base: 10 }, int: { base: 10 }, wis: { base: 10 }, cha: { base: 10 } },
        skills: {},
        saves: {},
        equipment: [],
        feats: [],
        bonuses: {
            ca: npc.value.ac - 10, // Assuming base CA is 10
            fort: 0,
            ref: 0,
            will: 0,
            attributes: {},
            saves: {},
            resistances: {},
            notes: npc.value.notes
        },
        shortcuts: npc.value.attacks.map(a => ({
            title: a.title,
            isAttack: true,
            attackFormula: a.attack,
            damageFormula: a.damage
        }))
    }

    const payload = {
        user_id: authStore.user?.id,
        name: npc.value.name.trim(),
        race: 'Monstro',
        class: 'NPC',
        level: 1,
        data
    }

    const { data: newSheet, error } = await supabase
        .from('sheets')
        .insert(payload)
        .select()
        .single()

    saving.value = false

    if (!error && newSheet) {
        emit('saved', newSheet.id)
    } else {
        console.error('Failed to save NPC:', error)
    }
}
</script>

<template>
    <div class="fixed inset-0 z-50 bg-black/80 flex justify-center p-4 overflow-y-auto">
        <div
            class="bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-md my-auto flex flex-col max-h-[90vh]">

            <div class="p-4 border-b border-zinc-800 flex items-center justify-between shrink-0">
                <h2 class="text-lg font-bold flex items-center gap-2">
                    <Ghost class="w-5 h-5 text-primary" /> Criar NPC Rápido
                </h2>
                <button @click="$emit('close')" class="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <div class="p-4 space-y-4 overflow-y-auto custom-scrollbar flex-1">

                <div class="space-y-1">
                    <label class="text-xs font-bold text-muted-foreground uppercase">Nome do NPC / Monstro</label>
                    <Input v-model="npc.name" placeholder="Ex: Goblin Arqueiro" class="bg-zinc-900 border-zinc-800" />
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1">
                        <label class="text-xs font-bold text-muted-foreground uppercase">HP (Pontos de Vida)</label>
                        <Input type="number" v-model.number="npc.hp" class="bg-zinc-900 border-zinc-800 tabular-nums" />
                    </div>
                    <div class="space-y-1">
                        <label class="text-xs font-bold text-muted-foreground uppercase">CA (Classe de Armadura)</label>
                        <Input type="number" v-model.number="npc.ac" class="bg-zinc-900 border-zinc-800 tabular-nums" />
                    </div>
                </div>

                <div class="space-y-2 pt-2">
                    <div class="flex items-center justify-between">
                        <label class="text-xs font-bold text-muted-foreground uppercase">Ataques / Ações</label>
                        <Button size="sm" variant="outline" class="h-6 text-xs" @click="addAttack">
                            <Plus class="w-3 h-3 mr-1" /> Adicionar
                        </Button>
                    </div>

                    <div v-for="(atk, i) in npc.attacks" :key="i"
                        class="p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg relative space-y-2">
                        <button @click="removeAttack(i)"
                            class="absolute top-2 right-2 text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 class="w-3 h-3" />
                        </button>
                        <Input v-model="atk.title" placeholder="Nome do Ataque (Ex: Arco Curto)"
                            class="bg-zinc-950 border-zinc-800 h-8 pr-8 text-sm" />
                        <div class="grid grid-cols-2 gap-2">
                            <Input v-model="atk.attack" placeholder="Ataque (Ex: 1d20+4)"
                                class="bg-zinc-950 border-zinc-800 h-8 text-sm font-mono text-amber-500" />
                            <Input v-model="atk.damage" placeholder="Dano (Ex: 1d6+2)"
                                class="bg-zinc-950 border-zinc-800 h-8 text-sm font-mono text-red-400" />
                        </div>
                    </div>
                    <p v-if="!npc.attacks.length" class="text-[10px] text-muted-foreground/50 text-center italic py-2">
                        Opcional: Você pode adicionar as rolagens no mural depois se preferir.</p>
                </div>

                <div class="space-y-1 pt-2">
                    <label class="text-xs font-bold text-muted-foreground uppercase">Notas do Mestre</label>
                    <Textarea v-model="npc.notes" placeholder="Táticas, resistências, itens no inventário..."
                        class="bg-zinc-900 border-zinc-800 resize-none h-16" />
                </div>

            </div>

            <div class="p-4 border-t border-zinc-800 flex justify-end gap-2 shrink-0 bg-zinc-900/30">
                <Button variant="ghost" @click="$emit('close')" :disabled="saving">Cancelar</Button>
                <Button @click="save" :disabled="!npc.name.trim() || saving">
                    {{ saving ? 'Criando...' : 'Criar NPC' }}
                </Button>
            </div>

        </div>
    </div>
</template>

```


---
## FILE: src/components/campaign/SheetChatOverlay.vue
```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import ChatSidebar from '@/components/campaign/ChatSidebar.vue'
import { Button } from '@/components/ui/button'
import { X, Sword } from 'lucide-vue-next'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const emit = defineEmits(['close'])
const authStore = useAuthStore()

const campaigns = ref<any[]>([])
const selectedCampaignId = ref<string>('')
const loading = ref(true)

async function fetchMyCampaigns() {
    loading.value = true
    // Fetch campaigns I am joined to
    // We can join campaign_members -> campaigns
    const { data } = await supabase
        .from('campaign_members')
        .select(`
            campaign_id,
            campaigns (id, name)
        `)
        .eq('user_id', authStore.user?.id)

    if (data) {
        campaigns.value = data.map((d: any) => d.campaigns) // Flatten
        if (campaigns.value.length > 0) {
            // Auto select first or restore from local storage?
            selectedCampaignId.value = campaigns.value[0].id
        }
    }
    loading.value = false
}

onMounted(() => {
    fetchMyCampaigns()
})
</script>

<template>
    <div
        class="fixed inset-y-0 right-0 w-80 md:w-96 bg-zinc-950 border-l border-zinc-900 z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        <!-- Header -->
        <div class="p-3 border-b border-zinc-900 flex items-center justify-between bg-zinc-900/50">
            <div class="flex items-center gap-2">
                <Sword class="w-4 h-4 text-primary" />
                <span class="font-bold text-sm">Chat da Mesa</span>
            </div>
            <Button variant="ghost" size="icon" @click="emit('close')"
                class="h-8 w-8 text-muted-foreground hover:text-foreground">
                <X class="w-4 h-4" />
            </Button>
        </div>

        <!-- Campaign Selector (if multiple) -->
        <div v-if="campaigns.length > 1" class="p-2 border-b border-zinc-900 bg-zinc-900/30">
            <Select v-model="selectedCampaignId">
                <SelectTrigger class="h-8 text-xs bg-zinc-950 border-zinc-800">
                    <SelectValue placeholder="Selecione a campanha" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem v-for="c in campaigns" :key="c.id" :value="c.id">
                        {{ c.name }}
                    </SelectItem>
                </SelectContent>
            </Select>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-hidden relative">
            <div v-if="loading" class="absolute inset-0 flex items-center justify-center">
                <div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>

            <div v-else-if="campaigns.length === 0"
                class="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
                <Sword class="w-10 h-10 text-zinc-800" />
                <p class="text-sm text-muted-foreground">Você não está em nenhuma campanha.</p>
                <p class="text-xs text-zinc-600">Volte ao Dashboard para criar ou entrar em uma.</p>
            </div>

            <ChatSidebar v-else-if="selectedCampaignId" :campaign-id="selectedCampaignId"
                class="h-full border-none w-full" />
        </div>
    </div>
</template>

```


---
## FILE: src/components/campaign/SheetSelectorModal.vue
```vue
<script setup lang="ts">

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, UserPlus, FileText } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

const props = defineProps<{
    modelValue: boolean
    sheets: any[]
    activeSheetId: string | null
}>()

const emit = defineEmits(['update:modelValue', 'select-sheet'])
const router = useRouter()

function close() {
    emit('update:modelValue', false)
}

function selectSheet(sheetId: string) {
    emit('select-sheet', sheetId)
}

import { useRoute } from 'vue-router'

const route = useRoute()

function createNewSheet() {
    router.push({ path: '/create', query: { campaignId: route.params.id } })
}

// Extract avatar safely
function getAvatar(sheet: any): string | null {
    if (!sheet?.data) return null
    if (typeof sheet.data === 'string') {
        try {
            const parsed = JSON.parse(sheet.data)
            return parsed.avatar_url || null
        } catch { return null }
    }
    return sheet.data.avatar_url || null
}
</script>

<template>
    <div v-if="modelValue" class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
        @click.self="close">
        <div class="w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <!-- Header -->
            <div class="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                <div>
                    <h2 class="text-xl font-serif font-bold text-primary">Trocar Ficha Ativa</h2>
                    <p class="text-sm text-muted-foreground mt-1">
                        Selecione a ficha que você deseja usar nesta sessão da campanha.
                    </p>
                </div>
                <Button variant="ghost" size="icon" @click="close" class="h-8 w-8 text-muted-foreground hover:text-foreground">
                    <X class="w-5 h-5" />
                </Button>
            </div>

            <!-- Content -->
            <div class="p-6 overflow-y-auto max-h-[70vh]">
                <div v-if="sheets.length === 0" class="text-center py-12 px-4">
                    <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-900 text-zinc-500 mb-4">
                        <FileText class="w-8 h-8" />
                    </div>
                    <h3 class="text-lg font-medium text-foreground mb-2">Nenhuma Ficha Disponível</h3>
                    <p class="text-muted-foreground mb-6 max-w-sm mx-auto">
                        Você não possui fichas criadas, ou todas as suas fichas já estão vinculadas a outras campanhas.
                    </p>
                    <Button @click="createNewSheet" class="gap-2">
                        <UserPlus class="w-4 h-4" /> Criar Nova Ficha
                    </Button>
                </div>

                <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <!-- Espectador Card -->
                    <Card
                        class="cursor-pointer transition-all duration-200 hover:border-primary/50 overflow-hidden relative group h-full bg-zinc-900/40"
                        :class="activeSheetId === 'none' ? 'ring-2 ring-primary border-primary' : 'border-zinc-800'"
                        @click="selectSheet('none')"
                    >
                        <CardContent class="p-0 h-full flex flex-col">
                            <div class="flex-1 flex flex-col items-center justify-center p-6 text-center min-h-[160px]">
                                <div class="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mb-3">
                                    <FileText class="w-8 h-8 text-zinc-500" />
                                </div>
                                <h3 class="font-bold text-lg text-zinc-300">Modo Espectador</h3>
                                <p class="text-xs text-muted-foreground mt-1">Acompanhe a campanha sem uma ficha ativa.</p>
                            </div>
                            
                            <div v-if="activeSheetId === 'none'" class="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-md">
                                Selecionado
                            </div>
                        </CardContent>
                    </Card>

                    <!-- Player Sheets -->
                    <Card v-for="sheet in sheets" :key="sheet.id"
                        class="cursor-pointer transition-all duration-200 hover:border-primary/50 overflow-hidden relative group h-full"
                        :class="activeSheetId === sheet.id ? 'ring-2 ring-primary border-primary bg-primary/5' : 'border-zinc-800 bg-zinc-950'"
                        @click="selectSheet(sheet.id)"
                    >
                        <CardContent class="p-0 h-full flex flex-col">
                            <!-- Avatar Banner -->
                            <div class="h-28 w-full bg-zinc-900 relative overflow-hidden">
<template v-if="getAvatar(sheet)">
                                    <img :src="getAvatar(sheet) as string" :alt="sheet.name" class="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105" />
                                    <!-- Gradient Overlay -->
                                    <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent"></div>
                                </template>
                                <template v-else>
                                    <div class="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-800">
                                        <FileText class="w-12 h-12" />
                                    </div>
                                    <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent"></div>
                                </template>

                                <!-- Badge (Selected) -->
                                <div v-if="activeSheetId === sheet.id" class="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-md">
                                    Selecionado
                                </div>
                            </div>

                            <!-- Sheet Info -->
                            <div class="p-4 flex-1 flex flex-col z-10 -mt-6 relative">
                                <h3 class="font-bold text-lg truncate drop-shadow-md text-white mb-1">{{ sheet.name }}</h3>
                                <div class="flex items-center gap-2 text-xs text-zinc-400">
                                    <span class="bg-zinc-800 px-2 py-0.5 rounded capitalize">{{ sheet.class }}</span>
                                    <span>Nível {{ sheet.level }}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <!-- Footer -->
            <div class="px-6 py-4 border-t border-zinc-800 bg-zinc-900/50 flex justify-end">
                <Button v-if="sheets.length > 0" variant="outline" @click="createNewSheet" class="gap-2 text-xs border-zinc-700 hover:bg-zinc-800">
                    <UserPlus class="w-3.5 h-3.5" /> Criar Extra
                </Button>
            </div>
        </div>
    </div>
</template>

```
