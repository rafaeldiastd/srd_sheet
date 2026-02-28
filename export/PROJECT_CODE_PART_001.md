

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
import { Sword, Sparkles, Zap, Activity, BookOpen, Dices } from 'lucide-vue-next'

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
const spells = computed(() =>
    (sheetData.value?.spells ?? []).filter((s: any) =>
        typeof s !== 'string' && s.rollFormula
    )
)

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


async function rollSpell(spell: any) {
    await sendRoll(spell.title || 'Magia', spell.rollFormula)
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
                    <TabsTrigger value="spells" class="text-[10px] px-1" title="Magias">
                        <Sparkles class="w-3 h-3" />
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

                <!-- SPELLS -->
                <TabsContent value="spells" class="p-3">
                    <div v-if="!spells.length" class="text-center py-8 text-xs text-muted-foreground italic">Nenhuma
                        magia com fórmula de rolagem.</div>
                    <div v-else class="space-y-2">
                        <div v-for="(spell, i) in spells" :key="i"
                            class="rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors p-3">
                            <div class="flex items-start justify-between gap-2 mb-2">
                                <div>
                                    <p class="text-xs font-bold text-zinc-200">{{ spell.title }}</p>
                                    <span
                                        class="text-[9px] bg-zinc-800 border border-zinc-700 text-muted-foreground rounded px-1 py-0.5">
                                        {{ spell.spellLevel === 0 ? 'Truque' : `Nível ${spell.spellLevel}` }}
                                    </span>
                                </div>
                                <Button size="sm" variant="outline"
                                    class="h-7 shrink-0 text-xs gap-1.5 border-blue-900/50 text-blue-400 hover:bg-blue-950/30"
                                    :disabled="rolling" @click="rollSpell(spell)">
                                    <BookOpen class="w-3 h-3" /> {{ spell.rollFormula }}
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
import { Settings, MessageSquare, BookOpen, LogOut } from 'lucide-vue-next'

const props = defineProps<{
    showChat: boolean
    showNotes: boolean
}>()

const emit = defineEmits(['update:showChat', 'update:showNotes', 'leave'])

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

function handleChatToggle() {
    emit('update:showChat', !props.showChat)
    closeMenu()
}

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
                    
                    <button @click="handleChatToggle" class="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900 hover:text-primary flex items-center gap-2">
                        <MessageSquare class="w-4 h-4" :class="props.showChat ? 'text-primary' : 'text-muted-foreground'" />
                        <span>{{ props.showChat ? 'Ocultar Chat' : 'Mostrar Chat' }}</span>
                    </button>
                    
                    <button @click="handleNotesToggle" class="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900 hover:text-primary flex items-center gap-2 lg:hidden">
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
## FILE: src/components/campaign/ChatSidebar.vue
```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Dice5 } from 'lucide-vue-next'
import { DiceRoller } from '@dice-roller/rpg-dice-roller'

const roller = new DiceRoller()

const props = defineProps<{
    campaignId: string
    memberName?: string
    members?: any[]
    dmId?: string
}>()

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
            if (m.type === 'roll' || m.type === 'whisper') {
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

const recipientId = defineModel<string>('recipientId', { default: 'all' })

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
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `campaign_id=eq.${props.campaignId}`
            },
            (payload) => {
                const newMsg = payload.new as any
                if (newMsg.type === 'roll' || newMsg.type === 'whisper') {
                    try { newMsg.rollData = JSON.parse(newMsg.content) } catch { }
                }
                messages.value.push(newMsg)
                scrollToBottom()
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
                <div v-if="msg.type !== 'whisper' || msg.user_id === authStore.user?.id || (msg.rollData?.target_id && msg.rollData.target_id === authStore.user?.id) || authStore.user?.id === props.dmId"
                    class="flex flex-col gap-1">
                    <div class="flex items-center gap-2">
                        <span class="text-xs font-bold"
                            :class="msg.user_id === authStore.user?.id ? 'text-primary' : 'text-zinc-400'">
                            {{ msg.sender_name }}
                        </span>
                        <span v-if="msg.type === 'whisper'"
                            class="text-[10px] uppercase font-bold text-fuchsia-400 bg-fuchsia-950/40 px-1 py-0.5 rounded border border-fuchsia-900/50">SUSSURRO</span>
                        <span class="text-[10px] text-muted-foreground">{{ new
                            Date(msg.created_at).toLocaleTimeString([],
                                { hour: '2-digit', minute: '2-digit' }) }}</span>
                    </div>
                    <div class="text-sm bg-zinc-900/80 px-3 py-2 rounded-lg border border-border/50 text-zinc-200 break-words"
                        :class="[
                            msg.type === 'roll' ? 'border-amber-500/30 bg-amber-950/10' : '',
                            msg.type === 'whisper' ? 'border-fuchsia-500/30 bg-fuchsia-950/10 text-fuchsia-100' : ''
                        ]">
                        <div v-if="msg.type === 'roll' || (msg.type === 'whisper' && msg.rollData?.is_roll)"
                            class="text-amber-400">
                            <div v-if="msg.rollData" class="space-y-1.5 pt-0.5">
                                <div class="flex items-center gap-2 font-bold"
                                    :class="msg.type === 'whisper' ? 'text-fuchsia-400' : 'text-amber-500'">
                                    <Dice5 class="w-4 h-4" />
                                    <span>{{ msg.rollData.label || 'Rolagem' }}</span>
                                </div>
                                <div v-if="msg.rollData.is_dual_roll" class="flex flex-col gap-2">
                                    <div class="flex flex-col gap-1 bg-black/20 p-2 rounded border relative"
                                        :class="msg.type === 'whisper' ? 'border-fuchsia-900/30' : 'border-amber-900/30'">
                                        <div
                                            class="absolute -top-2 left-2 text-[8px] bg-zinc-900 px-1 rounded-sm text-amber-500/70 uppercase tracking-wider font-bold">
                                            Ataque</div>
                                        <div class="flex items-center justify-between text-xs mt-1">
                                            <span class="font-mono"
                                                :class="msg.type === 'whisper' ? 'text-fuchsia-500/60' : 'text-amber-500/50'"
                                                title="Fórmula">{{ msg.rollData.attack.formula || '?' }}</span>
                                            <span class="font-mono text-right break-words max-w-[150px] leading-tight"
                                                :class="msg.type === 'whisper' ? 'text-fuchsia-500/90' : 'text-amber-500/80'">{{
                                                    msg.rollData.attack.breakdown }}</span>
                                        </div>
                                        <div class="text-3xl font-black text-center tracking-tighter mt-1"
                                            :class="msg.type === 'whisper' ? 'text-fuchsia-300' : 'text-amber-300'">
                                            {{ msg.rollData.attack.result }}
                                        </div>
                                    </div>
                                    <div
                                        class="flex flex-col gap-1 bg-red-950/10 p-2 rounded border border-red-900/20 relative mt-1">
                                        <div
                                            class="absolute -top-2 left-2 text-[8px] bg-zinc-900 px-1 rounded-sm text-red-500/70 uppercase tracking-wider font-bold">
                                            Dano / Efeito</div>
                                        <div class="flex items-center justify-between text-xs mt-1">
                                            <span class="font-mono text-red-500/50" title="Fórmula">{{
                                                msg.rollData.damage.formula || '?' }}</span>
                                            <span
                                                class="font-mono text-right text-red-500/80 break-words max-w-[150px] leading-tight">{{
                                                    msg.rollData.damage.breakdown }}</span>
                                        </div>
                                        <div class="text-3xl font-black text-center text-red-400 tracking-tighter mt-1">
                                            {{ msg.rollData.damage.result }}
                                        </div>
                                    </div>
                                </div>
                                <div v-else class="flex flex-col gap-1 bg-black/20 p-2 rounded border"
                                    :class="msg.type === 'whisper' ? 'border-fuchsia-900/30' : 'border-amber-900/30'">
                                    <div class="flex items-center justify-between text-xs">
                                        <span class="font-mono"
                                            :class="msg.type === 'whisper' ? 'text-fuchsia-500/60' : 'text-amber-500/50'"
                                            title="Fórmula">{{ msg.rollData.formula ||
                                                '?' }}</span>
                                        <span class="font-mono text-right break-words max-w-[150px] leading-tight"
                                            :class="msg.type === 'whisper' ? 'text-fuchsia-500/90' : 'text-amber-500/80'">{{
                                                msg.rollData.breakdown }}</span>
                                    </div>
                                    <div class="text-3xl font-black text-center tracking-tighter mt-1"
                                        :class="msg.type === 'whisper' ? 'text-fuchsia-300' : 'text-amber-300'">
                                        {{ msg.rollData.result }}
                                    </div>
                                </div>
                            </div>
                            <div v-else class="flex items-center gap-2 font-mono font-bold">
                                <!-- Fallback for old roll messages -->
                                <Dice5 class="w-4 h-4" />
                                {{ msg.content }}
                            </div>
                        </div>
                        <span v-else-if="msg.type === 'whisper'">{{ msg.rollData?.text || msg.content }}</span>
                        <span v-else>{{ msg.content }}</span>
                    </div>
                </div>
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
        spells: [],
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


---
## FILE: src/components/design/DesignToken.vue
```vue
<script setup lang="ts">

const props = defineProps<{
    name: string
    variable: string
    bgClass: string
    textClass?: string
}>()

// Helper to copy variable name to clipboard
const copyToClipboard = () => {
    navigator.clipboard.writeText(`var(--${props.variable})`)
}
</script>

<template>
    <div class="flex flex-col gap-2 group cursor-pointer" @click="copyToClipboard">
        <div class="h-24 w-full rounded-md border border-border shadow-sm transition-all group-hover:scale-105 group-hover:shadow-md relative overflow-hidden"
            :class="[bgClass, textClass || 'text-foreground']">
            <div
                class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/20 transition-opacity">
                <span class="text-xs font-mono font-bold text-white">Copy</span>
            </div>
        </div>
        <div class="flex flex-col">
            <span class="font-bold text-sm text-foreground">{{ name }}</span>
            <span class="text-xs text-muted-foreground font-mono">--{{ variable }}</span>
        </div>
    </div>
</template>

```


---
## FILE: src/components/sheet/blocks/AttrsBlock.vue
```vue
<script setup lang="ts">
import { Dices } from 'lucide-vue-next'

const props = defineProps<{
  attrTotal: (key: string) => number
  calcMod: (n: number) => number
  modStr: (n: number) => string
  editMode: boolean
  editedData: any
  ATTR_KEYS: readonly string[]
  ATTR_LABELS: Record<string, string>
  onRoll: (label: string, formula: string) => void
  vertical?: boolean
}>()
</script>

<template>
  <!-- VERTICAL mode: narrow left column, attributes stacked -->
  <div v-if="vertical"
    class="rounded-xl border border-zinc-800 bg-zinc-950/80 h-full flex flex-col">

    <!-- Header rotated vertically -->
    <div class="flex items-center justify-center py-3 border-b border-zinc-800">
      <span
        class="text-[10px] font-black uppercase tracking-widest text-zinc-500"
        style="writing-mode: vertical-rl; transform: rotate(180deg); letter-spacing: 0.2em;">
        Atributos
      </span>
    </div>

    <!-- Stats stacked -->
    <div class="flex flex-col flex-1 divide-y divide-zinc-800/50 justify-evenly">
      <div
        v-for="key in ATTR_KEYS" :key="key"
        class="flex flex-col items-center justify-center cursor-pointer transition-all duration-200
               hover:bg-primary/5 active:scale-95 select-none py-2 px-1"
        @click="onRoll(ATTR_LABELS[key] || key.toUpperCase(), '1d20 + @' + key + 'Mod')"
      >
        <div class="text-[9px] font-black uppercase tracking-wider text-zinc-500 mb-1">{{ ATTR_LABELS[key] }}</div>

        <template v-if="editMode && editedData?.attributes?.[key]">
          <input v-model.number="editedData.attributes[key].base" type="number" min="1" max="30"
            class="w-10 text-center text-lg font-extrabold font-serif bg-transparent border-b border-zinc-600
                   focus:border-primary focus:outline-none tabular-nums
                   [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            @click.stop />
        </template>
        <div v-else class="text-xl font-extrabold font-serif leading-none text-zinc-100">{{ attrTotal(key) }}</div>

        <div class="mt-1 text-[10px] font-bold text-zinc-400 bg-zinc-800/60 rounded px-1.5 py-0.5">
          {{ modStr(calcMod(attrTotal(key))) }}
        </div>
      </div>
    </div>
  </div>

  <!-- HORIZONTAL mode (default): original grid layout -->
  <div v-else class="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4">
    <div class="flex items-center gap-2 mb-3">
      <Dices class="w-4 h-4 text-primary" />
      <span class="text-xs font-bold uppercase tracking-widest text-zinc-400">Atributos</span>
    </div>

    <div class="grid grid-cols-3 sm:grid-cols-6 gap-2 items-stretch">
      <div
        v-for="key in ATTR_KEYS" :key="key"
        class="rounded-lg border border-zinc-700/50 bg-zinc-900/40 cursor-pointer transition-all duration-200
               hover:scale-105 hover:border-primary/50 hover:bg-primary/5 active:scale-95 select-none
               p-2 text-center text-zinc-200 flex flex-col items-center justify-center"
        @click="onRoll(ATTR_LABELS[key] || key.toUpperCase(), '1d20 + @' + key + 'Mod')"
      >
        <div class="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">{{ ATTR_LABELS[key] }}</div>

        <template v-if="editMode && editedData?.attributes?.[key]">
          <input v-model.number="editedData.attributes[key].base" type="number" min="1" max="30"
            class="w-full text-center text-xl font-extrabold font-serif bg-transparent border-b border-zinc-600
                   focus:border-primary focus:outline-none tabular-nums
                   [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            @click.stop />
        </template>
        <div v-else class="text-2xl font-extrabold font-serif leading-none text-zinc-100">{{ attrTotal(key) }}</div>

        <div class="mt-1.5 text-xs font-bold text-zinc-400 bg-zinc-800/60 rounded px-1.5 py-0.5 inline-block">
          {{ modStr(calcMod(attrTotal(key))) }}
        </div>
      </div>
    </div>
  </div>
</template>

```


---
## FILE: src/components/sheet/blocks/CombatBlock.vue
```vue
<script setup lang="ts">
import { Shield, Swords, Wind, Zap, RefreshCw } from 'lucide-vue-next'

const props = defineProps<{
  modStr: (n: number) => string
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
  onRoll: (label: string, formula: string) => void
  hideSaves?: boolean
}>()

const stats = () => [
  {
    label: 'CA', value: props.totalCA, icon: Shield,
    sub: `T:${props.totalTouch} | S:${props.totalFlatFooted}`,
    roll: null,
  },
  {
    label: 'BBA', value: props.modStr(props.totalBAB), icon: Swords,
    roll: () => props.onRoll('BBA', '1d20 + @BBA'),
  },
  {
    label: 'Iniciativa', value: props.modStr(props.totalInitiative), icon: Zap,
    roll: () => props.onRoll('Iniciativa', '1d20 + @iniciativa'),
  },
  {
    label: 'Velocidade', value: `${props.totalSpeed}m`, icon: Wind, roll: null,
  },
  {
    label: 'C.C.', value: props.modStr(props.meleeAtk), icon: Swords,
    roll: () => props.onRoll('Corpo-a-Corpo', '1d20 + @melee'),
  },
  {
    label: 'Distância', value: props.modStr(props.rangedAtk), icon: Wind,
    roll: () => props.onRoll('Distância', '1d20 + @ranged'),
  },
  {
    label: 'Agarrar', value: props.modStr(props.grappleAtk), icon: RefreshCw,
    roll: () => props.onRoll('Agarrar', '1d20 + @grapple'),
  },
]
</script>

<template>
  <div class="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4">
    <div class="flex items-center gap-2 mb-3">
      <Shield class="w-4 h-4 text-zinc-400" />
      <span class="text-xs font-bold uppercase tracking-widest text-zinc-400">Combate</span>
    </div>

    <!-- Main stats row -->
    <div class="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-3 items-stretch">
      <div
        v-for="stat in stats()" :key="stat.label"
        class="rounded-lg border border-zinc-800 bg-zinc-900/60 p-2 text-center transition-all duration-200 select-none flex flex-col items-center justify-center"
        :class="stat.roll ? 'cursor-pointer hover:border-primary/50 hover:bg-primary/5 active:scale-95' : ''"
        @click="stat.roll?.()"
      >
        <component :is="stat.icon" class="w-3.5 h-3.5 mx-auto mb-1 text-zinc-500" />
        <div class="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">{{ stat.label }}</div>
        <div class="text-lg font-extrabold font-serif text-zinc-100">{{ stat.value }}</div>
        <div v-if="stat.sub" class="text-[9px] text-zinc-600 mt-0.5">{{ stat.sub }}</div>
      </div>
    </div>

    <!-- Saves -->
    <div v-if="!hideSaves" class="grid grid-cols-3 gap-2 items-stretch">
      <button @click="onRoll('Fortitude', '1d20 + @fort')"
        class="rounded-lg bg-zinc-900/60 border border-zinc-800 px-2 py-1.5 hover:border-primary/40 hover:bg-primary/5 transition-colors flex flex-col items-center justify-center">
        <div class="text-[10px] text-zinc-500 font-bold uppercase mb-0.5">Fortitude</div>
        <div class="text-base font-extrabold font-serif text-zinc-100">{{ modStr(totalFort) }}</div>
      </button>
      <button @click="onRoll('Reflexos', '1d20 + @ref')"
        class="rounded-lg bg-zinc-900/60 border border-zinc-800 px-2 py-1.5 hover:border-primary/40 hover:bg-primary/5 transition-colors flex flex-col items-center justify-center">
        <div class="text-[10px] text-zinc-500 font-bold uppercase mb-0.5">Reflexos</div>
        <div class="text-base font-extrabold font-serif text-zinc-100">{{ modStr(totalRef) }}</div>
      </button>
      <button @click="onRoll('Vontade', '1d20 + @will')"
        class="rounded-lg bg-zinc-900/60 border border-zinc-800 px-2 py-1.5 hover:border-primary/40 hover:bg-primary/5 transition-colors flex flex-col items-center justify-center">
        <div class="text-[10px] text-zinc-500 font-bold uppercase mb-0.5">Vontade</div>
        <div class="text-base font-extrabold font-serif text-zinc-100">{{ modStr(totalWill) }}</div>
      </button>
    </div>
  </div>
</template>

```


---
## FILE: src/components/sheet/blocks/ResourcesBlock.vue
```vue
<script setup lang="ts">
import { Plus, RotateCcw, Trash2, Layers } from 'lucide-vue-next'
// Layers used as resource section icon
import { ref } from 'vue'
import type { Sheet } from '@/types/sheet'

const props = defineProps<{
  sheet: Sheet
  onAdjust: (i: number, delta: number) => void
  onReset: () => void
  onAdd: (name: string, max: number) => void
  onDelete: (i: number) => void
  editMode: boolean
}>()

const newName = ref('')
const newMax = ref(3)
const showForm = ref(false)

function handleAdd() {
  if (!newName.value.trim()) return
  props.onAdd(newName.value, newMax.value)
  newName.value = ''
  newMax.value = 3
  showForm.value = false
}

const barColor = (cur: number, max: number) => {
  const p = max ? (cur / max) : 0
  if (p > 0.6) return '#8b5cf6'
  if (p > 0.3) return '#f59e0b'
  return '#ef4444'
}
</script>

<template>
  <div class="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4">
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <Layers class="w-4 h-4 text-zinc-400" />
        <span class="text-xs font-bold uppercase tracking-widest text-zinc-400">Recursos</span>
      </div>
      <div class="flex gap-2">
        <button @click="onReset"
          class="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-200 transition-colors border border-zinc-800 rounded-lg px-2.5 py-1 hover:bg-zinc-800">
          <RotateCcw class="w-3 h-3" /> Descanso
        </button>
        <button v-if="editMode" @click="showForm = !showForm"
          class="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors border border-primary/30 rounded-lg px-2.5 py-1 hover:bg-primary/10">
          <Plus class="w-3 h-3" /> Novo
        </button>
      </div>
    </div>

    <!-- Add form -->
    <div v-if="showForm && editMode" class="flex gap-2 mb-3 p-2 bg-zinc-900/60 rounded-lg border border-zinc-800">
      <input v-model="newName" placeholder="Nome (ex: Fúria)" class="flex-1 bg-transparent text-sm border-b border-zinc-700 focus:border-primary focus:outline-none text-zinc-200 placeholder-zinc-600 px-1" />
      <input v-model.number="newMax" type="number" min="1" placeholder="Máx"
        class="w-14 text-center bg-transparent text-sm border-b border-zinc-700 focus:border-primary focus:outline-none text-zinc-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none" />
      <button @click="handleAdd" class="text-xs font-bold text-primary hover:text-primary/80 px-2 py-1 bg-primary/10 rounded-md border border-primary/20">
        Criar
      </button>
    </div>

    <div v-if="!sheet.data?.resources?.length" class="text-center py-6 text-zinc-600 text-sm">
      Nenhum recurso cadastrado.
    </div>

    <div class="space-y-3">
      <div v-for="(res, i) in sheet.data?.resources" :key="i" class="group">
        <div class="flex items-center justify-between mb-1">
          <span class="text-sm font-bold text-zinc-300">{{ res.name || res.label }}</span>
          <div class="flex items-center gap-2">
            <span class="text-xs text-zinc-500">{{ res.current ?? res.max }} / {{ res.max }}</span>
            <button v-if="editMode" @click="onDelete(i)"
              class="opacity-0 group-hover:opacity-100 text-red-700 hover:text-red-500 transition-all">
              <Trash2 class="w-3 h-3" />
            </button>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button @click="onAdjust(i, -1)"
            class="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors text-sm font-bold">
            −
          </button>
          <div class="flex-1 h-2.5 bg-zinc-800 rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-all duration-300"
              :style="{
                width: res.max ? ((res.current ?? res.max) / res.max * 100) + '%' : '100%',
                backgroundColor: barColor(res.current ?? res.max, res.max)
              }" />
          </div>
          <button @click="onAdjust(i, 1)"
            class="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors text-sm font-bold">
            +
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

```


---
## FILE: src/components/sheet/blocks/ShortcutsBlock.vue
```vue
<script setup lang="ts">
import { Plus, Trash2, Dices } from 'lucide-vue-next'

const props = defineProps<{
  d: any
  modStr: (n: number) => string
  resolveFormula: (formula: string) => string
  editMode: boolean
  onRollItem: (label: string, formula: string, isAtk: boolean, atkF: string, dmgF: string) => void
  onAddShortcut: () => void
  onDeleteShortcut: (i: number) => void
}>()
</script>

<template>
  <div class="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4">
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <Dices class="w-4 h-4 text-primary" />
        <span class="text-xs font-bold uppercase tracking-widest text-zinc-400">Atalhos</span>
      </div>
      <button v-if="editMode" @click="onAddShortcut"
        class="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors border border-primary/30 rounded-lg px-2.5 py-1 hover:bg-primary/10">
        <Plus class="w-3 h-3" /> Novo Atalho
      </button>
    </div>

    <div v-if="!d?.shortcuts?.length" class="text-center py-8 text-zinc-600 text-sm">
      Nenhum atalho cadastrado.
    </div>

    <div class="flex flex-wrap gap-2">
      <div v-for="(sc, i) in d?.shortcuts" :key="i"
        class="relative group flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 hover:border-primary/40 transition-all duration-200 cursor-pointer select-none"
        @click="onRollItem(sc.title || sc.label || '?', sc.rollFormula || sc.formula || '', sc.isAttack, sc.attackFormula, sc.damageFormula)"
      >
        <div>
          <div class="font-bold text-sm text-zinc-200">{{ sc.title || sc.label }}</div>
          <div v-if="sc.isAttack" class="text-[10px] text-zinc-500">
            Ataque: {{ sc.attackBonus ? modStr(Number(sc.attackBonus)) : resolveFormula(sc.attackFormula || '') }}
          </div>
          <div v-else-if="sc.rollFormula || sc.formula" class="text-[10px] text-zinc-500">
            {{ sc.rollFormula || sc.formula }}
          </div>
        </div>
        <button v-if="editMode" @click.stop="onDeleteShortcut(i)"
          class="opacity-0 group-hover:opacity-100 absolute top-1 right-1 text-red-600 hover:text-red-400 transition-all">
          <Trash2 class="w-3 h-3" />
        </button>
      </div>
    </div>
  </div>
</template>

```


---
## FILE: src/components/sheet/blocks/VitalsBlock.vue
```vue
<script setup lang="ts">
import { Heart, Plus, Minus, Skull } from 'lucide-vue-next'
import type { Sheet } from '@/types/sheet'

const props = defineProps<{
  sheet: Sheet
  totalHP: number
  deathStatus: { label: string; color: string } | null
  onSaveHP: () => void
}>()

const adjustHP = (delta: number) => {
  const cur = props.sheet.data.hp_current ?? 0
  const max = props.totalHP
  props.sheet.data.hp_current = Math.max(-10, Math.min(max, cur + delta))
  props.onSaveHP()
}

const adjustTemp = (delta: number) => {
  const cur = props.sheet.data.hp_temp ?? 0
  props.sheet.data.hp_temp = Math.max(0, cur + delta)
  props.onSaveHP()
}

const percent = () => {
  const c = props.sheet.data.hp_current ?? 0
  const m = props.totalHP || 1
  return Math.max(0, Math.min(100, (c / m) * 100))
}

const hpColor = () => {
  const p = percent()
  if (p > 60) return '#22c55e'
  if (p > 30) return '#f59e0b'
  return '#ef4444'
}
</script>

<template>
  <div class="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 space-y-3">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Heart class="w-4 h-4 text-red-400" />
        <span class="text-xs font-bold uppercase tracking-widest text-zinc-400">Pontos de Vida</span>
      </div>
      <div v-if="deathStatus"
        class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border animate-pulse"
        :class="deathStatus.color">
        <Skull class="w-3 h-3 inline mr-1" />{{ deathStatus.label }}
      </div>
    </div>

    <!-- HP bar -->
    <div class="h-3 bg-zinc-800 rounded-full overflow-hidden">
      <div class="h-full rounded-full transition-all duration-500 ease-out"
        :style="{ width: percent() + '%', backgroundColor: hpColor() }" />
    </div>

    <!-- HP Numbers -->
    <div class="flex items-center gap-4">
      <!-- Current HP -->
      <div class="flex items-center gap-2">
        <button @click="adjustHP(-1)"
          class="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center hover:bg-zinc-800 transition-colors">
          <Minus class="w-3.5 h-3.5 text-zinc-400" />
        </button>
        <div class="text-center">
          <input v-model.number="sheet.data.hp_current" @change="onSaveHP" type="number"
            class="w-14 text-center text-3xl font-extrabold font-serif text-zinc-100 bg-transparent border-b-2 border-zinc-700 focus:border-zinc-400 focus:outline-none tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
          <div class="text-[10px] text-zinc-600 uppercase tracking-wider">atual</div>
        </div>
        <button @click="adjustHP(1)"
          class="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center hover:bg-zinc-800 transition-colors">
          <Plus class="w-3.5 h-3.5 text-zinc-400" />
        </button>
      </div>

      <div class="text-2xl text-zinc-700 font-light">/</div>

      <!-- Max HP -->
      <div class="text-center">
        <div class="text-3xl font-extrabold font-serif text-zinc-300">{{ totalHP }}</div>
        <div class="text-[10px] text-zinc-600 uppercase tracking-wider">máximo</div>
      </div>

      <!-- Temp HP -->
      <div class="ml-auto flex items-center gap-2 bg-zinc-900/60 border border-zinc-800 rounded-lg px-3 py-1.5">
        <button @click="adjustTemp(-1)" class="text-zinc-500 hover:text-zinc-300 transition-colors">
          <Minus class="w-3 h-3" />
        </button>
        <div class="text-center">
          <input v-model.number="sheet.data.hp_temp" @change="onSaveHP" type="number"
            class="w-8 text-center text-sm font-bold text-zinc-200 bg-transparent border-b border-zinc-700 focus:border-primary focus:outline-none tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
          <div class="text-[10px] text-zinc-600 uppercase tracking-wider">temp</div>
        </div>
        <button @click="adjustTemp(1)" class="text-zinc-500 hover:text-zinc-300 transition-colors">
          <Plus class="w-3 h-3" />
        </button>
      </div>
    </div>
  </div>
</template>

```


---
## FILE: src/components/sheet/ItemEditorModal.vue
```vue
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
  form.value = val ? JSON.parse(JSON.stringify({ attackFormula: '', damageFormula: '', rollFormula: '', modifiers: [], isAttack: false, spellLevel: 1, ...val })) : {}
}, { immediate: true })

function close() { emit('update:modelValue', false) }
function addModifier() {
  if (!form.value.modifiers) form.value.modifiers = []
  form.value.modifiers.push({ target: 'str', value: 1 })
}
function removeModifier(i: number) { form.value.modifiers.splice(i, 1) }
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
              <span class="text-sm text-zinc-300">É um ataque (fórmula dupla)</span>
            </label>
          </div>

          <!-- Roll formulas -->
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

```


---
## FILE: src/components/sheet/tabs/BuffsTab.vue
```vue
<script setup lang="ts">
import { Plus, Trash2, Flame } from 'lucide-vue-next'

const props = defineProps<{
  d: any
  modStr: (n: number) => string
  resolveFormula: (formula: string) => string
  onOpenEditor: (type: string, item?: any, index?: number) => void
  onDelete: (type: string, index: number) => void
  onToggle: (i: number) => void
}>()
</script>

<template>
  <div class="space-y-3">
    <!-- Tab toolbar -->
    <div class="bg-zinc-900/60 border border-zinc-800 rounded-xl px-3 py-2 flex items-center justify-between">
      <span class="text-xs font-bold uppercase tracking-widest text-zinc-500">{{ d?.buffs?.length ?? 0 }} buffs</span>
      <button @click="onOpenEditor('buff')"
        class="flex items-center gap-1 text-xs text-zinc-300 border border-zinc-700 rounded-lg px-2.5 py-1.5 hover:bg-zinc-800 transition-colors">
        <Plus class="w-3.5 h-3.5" /> Novo Buff
      </button>
    </div>

    <div class="space-y-2">
      <div v-for="(buf, i) in d?.buffs" :key="i"
        class="group rounded-xl border overflow-hidden transition-all duration-200"
        :class="buf.active
          ? 'border-primary/30 bg-primary/5'
          : 'border-zinc-800 bg-zinc-950/60 opacity-60'">
        <div class="flex items-center gap-3 px-4 py-3">
          <!-- Toggle -->
          <button @click="onToggle(i)"
            class="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg shrink-0 transition-all"
            :class="buf.active
              ? 'bg-primary/20 border border-primary/40 text-primary'
              : 'bg-zinc-800 border border-zinc-700 text-zinc-500 hover:text-zinc-300'">
            <Flame class="w-3 h-3" />
            {{ buf.active ? 'Ativo' : 'Inativo' }}
          </button>

          <!-- Info -->
          <div class="flex-1">
            <div class="font-bold text-sm text-zinc-200">{{ buf.title }}</div>
            <div v-if="buf.modifiers?.length" class="text-[10px] text-zinc-500 mt-0.5">
              {{ buf.modifiers.map((m: any) => `${m.target} ${modStr(m.value)}`).join(' · ') }}
            </div>
          </div>

          <div class="flex gap-1">
            <button @click="onOpenEditor('buff', buf, i)" class="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-600 hover:text-zinc-300 transition-all">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            </button>
            <button @click="onDelete('buff', i)" class="opacity-0 group-hover:opacity-100 p-1.5 text-red-800 hover:text-red-500 transition-all">
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div v-if="!d?.buffs?.length" class="text-center py-12 text-zinc-600 text-sm">
        Nenhum buff ativo.
      </div>
    </div>
  </div>
</template>

```
