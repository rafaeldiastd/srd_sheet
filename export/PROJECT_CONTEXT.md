

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


---
## FILE: src/components/sheet/tabs/ConfigTab.vue
```vue
<script setup lang="ts">
import { Settings2 } from 'lucide-vue-next'
import { ATTR_KEYS, ATTR_LABELS, CA_FIELDS, SAVE_FIELDS, ELEM_FIELDS } from '@/data/sheetConstants'

const props = defineProps<{
  d: any
  b: any
  editMode: boolean
  tabsEditMode: boolean
  editedData: any
  modStr: (n: number) => string
  adjustField: (obj: any, key: string, delta: number) => void
  onToggleEdit: () => void
}>()  

</script>

<template>
  <div class="space-y-6">

    <!-- Bonus Config -->
    <div class="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Settings2 class="w-4 h-4 text-zinc-400" />
          <span class="text-xs font-bold uppercase tracking-widest text-zinc-400">Modificadores & Bônus</span>
        </div>
        <button @click="onToggleEdit"
          class="text-xs font-bold px-3 py-1.5 rounded-lg border transition-all"
          :class="tabsEditMode
            ? 'bg-primary/20 border-primary text-primary'
            : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-200'">
          {{ tabsEditMode ? '✓ Concluir' : 'Editar' }}
        </button>
      </div>

      <div class="grid md:grid-cols-2 gap-4">
        <!-- Attr bonuses -->
        <div class="space-y-1">
          <div class="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Bônus de Atributos</div>
          <div v-for="key in ATTR_KEYS" :key="key" class="flex items-center justify-between py-1.5 border-b border-zinc-800/50">
            <span class="text-xs text-zinc-400">{{ ATTR_LABELS[key] }}</span>
            <div v-if="tabsEditMode && editedData" class="flex items-center gap-1">
              <button @click="adjustField(editedData.bonuses.attributes, key, -1)" class="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-sm flex items-center justify-center">−</button>
              <span class="w-8 text-center text-sm font-bold tabular-nums text-zinc-200">{{ editedData.bonuses.attributes[key] ?? 0 }}</span>
              <button @click="adjustField(editedData.bonuses.attributes, key, 1)" class="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-sm flex items-center justify-center">+</button>
            </div>
            <span v-else class="text-sm font-bold text-zinc-300">{{ modStr(b?.attributes?.[key] ?? 0) }}</span>
          </div>
        </div>

        <!-- CA bonuses -->
        <div class="space-y-1">
          <div class="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Componentes de CA</div>
          <div v-for="f in CA_FIELDS" :key="f.field" class="flex items-center justify-between py-1.5 border-b border-zinc-800/50">
            <span class="text-xs text-zinc-400">{{ f.label }}</span>
            <div v-if="tabsEditMode && editedData" class="flex items-center gap-1">
              <button @click="adjustField(editedData, f.field, -1)" class="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-sm flex items-center justify-center">−</button>
              <span class="w-8 text-center text-sm font-bold tabular-nums text-zinc-200">{{ editedData[f.field] ?? 0 }}</span>
              <button @click="adjustField(editedData, f.field, 1)" class="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-sm flex items-center justify-center">+</button>
            </div>
            <span v-else class="text-sm font-bold text-zinc-300">{{ d[f.field] ?? 0 }}</span>
          </div>
          <!-- CA Bonus misc -->
          <div class="flex items-center justify-between py-1.5">
            <span class="text-xs text-zinc-400">Bônus CA (misc)</span>
            <div v-if="tabsEditMode && editedData" class="flex items-center gap-1">
              <button @click="adjustField(editedData.bonuses, 'ca', -1)" class="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-sm flex items-center justify-center">−</button>
              <span class="w-8 text-center text-sm font-bold tabular-nums text-zinc-200">{{ editedData.bonuses.ca ?? 0 }}</span>
              <button @click="adjustField(editedData.bonuses, 'ca', 1)" class="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-sm flex items-center justify-center">+</button>
            </div>
            <span v-else class="text-sm font-bold text-zinc-300">{{ modStr(b?.ca ?? 0) }}</span>
          </div>
        </div>

        <!-- Saves -->
        <div class="space-y-1">
          <div class="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Saves Base &amp; Bônus</div>
          <div v-for="f in SAVE_FIELDS" :key="f.field" class="flex items-center justify-between py-1.5 border-b border-zinc-800/50">
            <span class="text-xs text-zinc-400">{{ f.label }}</span>
            <div v-if="tabsEditMode && editedData" class="flex items-center gap-1">
              <button @click="adjustField(editedData, f.field, -1)" class="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-sm flex items-center justify-center">−</button>
              <span class="w-8 text-center text-sm font-bold tabular-nums text-zinc-200">{{ editedData[f.field] ?? 0 }}</span>
              <button @click="adjustField(editedData, f.field, 1)" class="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-sm flex items-center justify-center">+</button>
            </div>
            <span v-else class="text-sm font-bold text-zinc-300">{{ d[f.field] ?? 0 }}</span>
          </div>
        </div>

        <!-- Elemental resistances -->
        <div class="space-y-1">
          <div class="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Resistências Elementais</div>
          <div v-for="f in ELEM_FIELDS" :key="f.field" class="flex items-center justify-between py-1.5 border-b border-zinc-800/50">
            <span class="text-xs text-zinc-400">{{ f.label }}</span>
            <div v-if="tabsEditMode && editedData" class="flex items-center gap-1">
              <button @click="adjustField(editedData.bonuses.resistances, f.field, -1)" class="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-sm flex items-center justify-center">−</button>
              <span class="w-8 text-center text-sm font-bold tabular-nums text-zinc-200">{{ editedData.bonuses.resistances[f.field] ?? 0 }}</span>
              <button @click="adjustField(editedData.bonuses.resistances, f.field, 1)" class="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-sm flex items-center justify-center">+</button>
            </div>
            <span v-else class="text-sm font-bold text-zinc-300">{{ b?.resistances?.[f.field] ?? 0 }}</span>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div class="pt-2">
        <div class="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Notas de Bônus</div>
        <textarea v-if="tabsEditMode && editedData" v-model="editedData.bonuses.notes"
          class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-primary/50 resize-none min-h-[5rem]"
          placeholder="Ex: +2 FOR (Cinto), +4 CA (Manto +2)..." />
        <p v-else class="text-sm text-zinc-500 italic">{{ b?.notes || 'Sem notas.' }}</p>
      </div>
    </div>
  </div>
</template>

```


---
## FILE: src/components/sheet/tabs/EquipmentTab.vue
```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Package, Plus, Trash2, Backpack, ChevronDown, ChevronUp } from 'lucide-vue-next'

const props = defineProps<{
  d: any
  editMode: boolean
  totalWeight: number
  onOpenEditor: (item?: any, index?: number) => void
  onDelete: (type: string, index: number) => void
  onToggleEquipped: (i: number) => void
}>()

const expanded = ref<Set<number>>(new Set())
function toggleExpand(i: number) {
  if (expanded.value.has(i)) expanded.value.delete(i)
  else expanded.value.add(i)
}
</script>

<template>
  <div class="space-y-3">
    <!-- Tab toolbar -->
    <div class="bg-zinc-900/60 border border-zinc-800 rounded-xl px-3 py-2 flex items-center justify-between">
      <div class="flex items-center gap-2 text-xs text-zinc-500">
        <Backpack class="w-4 h-4" />
        <span>Peso total: <span class="font-bold text-zinc-300">{{ totalWeight.toFixed(1) }} kg</span></span>
      </div>
      <button @click="onOpenEditor()"
        class="flex items-center gap-1 text-xs text-zinc-300 border border-zinc-700 rounded-lg px-2.5 py-1.5 hover:bg-zinc-800 transition-colors">
        <Plus class="w-3.5 h-3.5" /> Novo Item
      </button>
    </div>

    <div class="space-y-2">
      <div v-for="(item, i) in d?.equipment" :key="i"
        class="group rounded-xl border bg-zinc-950/60 overflow-hidden transition-all duration-200 hover:border-zinc-700"
        :class="item.equipped ? 'border-primary/30 bg-primary/5' : 'border-zinc-800'">
        <div class="flex items-center gap-3 px-4 py-3">
          <!-- Equipped toggle -->
          <button @click="onToggleEquipped(i)"
            class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all"
            :class="item.equipped
              ? 'bg-primary/20 border border-primary/40 text-primary'
              : 'bg-zinc-800 border border-zinc-700 text-zinc-600 hover:text-zinc-400'">
            <Package class="w-4 h-4" />
          </button>

          <!-- Info -->
          <div class="flex-1 cursor-pointer" @click="toggleExpand(i)">
            <div class="font-bold text-sm" :class="item.equipped ? 'text-primary/90' : 'text-zinc-300'">
              {{ item.title }}
            </div>
            <div class="text-[10px] text-zinc-600 mt-0.5">
              {{ item.weight ? item.weight + ' kg' : '' }}
              <span v-if="item.equipped" class="text-primary/50 ml-1">• equipado</span>
              <span v-if="item.modifiers?.length" class="ml-1">• {{ item.modifiers.length }} mod(s)</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-1 items-center">
            <button @click.stop="onOpenEditor(item, i)" class="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-600 hover:text-zinc-300 transition-all">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            </button>
            <button @click="onDelete('equipment', i)" class="opacity-0 group-hover:opacity-100 p-1.5 text-red-800 hover:text-red-500 transition-all">
              <Trash2 class="w-3.5 h-3.5" />
            </button>
            <button @click="toggleExpand(i)" class="p-1 text-zinc-600 hover:text-zinc-300 transition-colors">
              <ChevronDown v-if="!expanded.has(i)" class="w-4 h-4" />
              <ChevronUp v-else class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div v-if="expanded.has(i) && item.description" class="border-t border-zinc-800/60 px-4 py-3 bg-zinc-900/30">
          <p class="text-sm text-zinc-400 whitespace-pre-wrap">{{ item.description }}</p>
        </div>
      </div>

      <div v-if="!d?.equipment?.length" class="text-center py-12 text-zinc-600 text-sm">
        Nenhum item no inventário.
      </div>
    </div>
  </div>
</template>

```


---
## FILE: src/components/sheet/tabs/FeatsTab.vue
```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Plus, Trash2, Swords, Zap, ChevronDown, ChevronUp } from 'lucide-vue-next'

const props = defineProps<{
  d: any
  editMode: boolean
  modStr: (n: number) => string
  resolveFormula: (formula: string) => string
  onOpenEditor: (type: string, item?: any, index?: number) => void
  onDelete: (type: string, index: number) => void
  onRoll: (label: string, formula: string) => void
  onDualRoll: (label: string, atkF: string, dmgF: string) => void
}>()

const expanded = ref<Set<number>>(new Set())
function toggleExpand(i: number) {
  if (expanded.value.has(i)) expanded.value.delete(i)
  else expanded.value.add(i)
}
</script>

<template>
  <div class="space-y-3">
    <!-- Tab toolbar -->
    <div class="bg-zinc-900/60 border border-zinc-800 rounded-xl px-3 py-2 flex items-center justify-between">
      <span class="text-xs font-bold uppercase tracking-widest text-zinc-500">
        {{ d?.feats?.length ?? 0 }} talentos
      </span>
      <button @click="onOpenEditor('feat')"
        class="flex items-center gap-1 text-xs text-zinc-300 border border-zinc-700 rounded-lg px-2.5 py-1.5 hover:bg-zinc-800 transition-colors">
        <Plus class="w-3.5 h-3.5" /> Novo Talento
      </button>
    </div>

    <div class="space-y-2">
      <div v-for="(feat, i) in d?.feats" :key="i"
        class="rounded-xl border border-zinc-800 bg-zinc-950/60 transition-all duration-200 hover:border-zinc-700 overflow-hidden group">
        <!-- Header row -->
        <div class="flex items-center gap-3 px-4 py-3">
          <div class="flex-1 cursor-pointer" @click="toggleExpand(i)">
            <div class="flex items-center gap-2">
              <component :is="feat.isAttack ? Swords : Zap"
                class="w-4 h-4 shrink-0"
                :class="feat.isAttack ? 'text-red-400' : 'text-primary'" />
              <span class="font-bold text-zinc-200 text-sm">{{ feat.title }}</span>
            </div>
            <div v-if="feat.isAttack" class="text-xs text-zinc-500 mt-0.5 ml-6">
              Ataque {{ resolveFormula(feat.attackFormula || '') }} · Dano {{ resolveFormula(feat.damageFormula || '') }}
            </div>
            <div v-else-if="feat.rollFormula" class="text-xs text-zinc-500 mt-0.5 ml-6">
              {{ feat.rollFormula }}
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-1">
            <button v-if="feat.isAttack"
              @click="onDualRoll(feat.title, feat.attackFormula || '', feat.damageFormula || '')"
              class="text-xs font-bold px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 transition-colors">
              Atacar
            </button>
            <button v-else-if="feat.rollFormula"
              @click="onRoll(feat.title, feat.rollFormula)"
              class="text-xs font-bold px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 transition-colors">
              Rolar
            </button>
            <button @click="onOpenEditor('feat', feat, i)" class="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-600 hover:text-zinc-300 transition-all">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            </button>
            <button @click="onDelete('feat', i)" class="opacity-0 group-hover:opacity-100 p-1.5 text-red-800 hover:text-red-500 transition-all">
              <Trash2 class="w-3.5 h-3.5" />
            </button>
            <button @click="toggleExpand(i)" class="p-1 text-zinc-600 hover:text-zinc-300 transition-colors">
              <ChevronDown v-if="!expanded.has(i)" class="w-4 h-4" />
              <ChevronUp v-else class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Expanded description -->
        <div v-if="expanded.has(i) && feat.description"
          class="border-t border-zinc-800/60 px-4 py-3 bg-zinc-900/30">
          <p class="text-sm text-zinc-400 whitespace-pre-wrap leading-relaxed">{{ feat.description }}</p>
        </div>
      </div>

      <div v-if="!d?.feats?.length" class="text-center py-12 text-zinc-600 text-sm">
        Nenhum talento ou ataque cadastrado.
      </div>
    </div>
  </div>
</template>

```


---
## FILE: src/components/sheet/tabs/ResourcesTab.vue
```vue
<script setup lang="ts">
import { Plus, RotateCcw, Trash2 } from 'lucide-vue-next'
import { ref } from 'vue'
import type { Sheet } from '@/types/sheet'

const props = defineProps<{
  sheet: Sheet
  editMode: boolean
  onAdjust: (i: number, delta: number) => void
  onReset: () => void
  onAdd: (name: string, max: number) => void
  onDelete: (i: number) => void
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
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <button @click="onReset"
        class="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-800 rounded-lg px-3 py-2 hover:bg-zinc-800 transition-colors">
        <RotateCcw class="w-3.5 h-3.5" /> Descanso Longo (Reset Tudo)
      </button>
      <button @click="showForm = !showForm"
        class="flex items-center gap-1 text-xs text-primary border border-primary/30 rounded-lg px-2.5 py-1.5 hover:bg-primary/10 transition-colors">
        <Plus class="w-3.5 h-3.5" /> Novo Recurso
      </button>
    </div>

    <!-- Add form -->
    <div v-if="showForm" class="flex gap-2 p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
      <input v-model="newName" placeholder="Nome (ex: Fúria do Bárbaro)"
        class="flex-1 bg-transparent text-sm border-b border-zinc-700 focus:border-primary focus:outline-none text-zinc-200 placeholder-zinc-600 px-1 py-1" />
      <input v-model.number="newMax" type="number" min="1" placeholder="Máx"
        class="w-14 text-center bg-transparent text-sm border-b border-zinc-700 focus:border-primary focus:outline-none text-zinc-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none" />
      <button @click="handleAdd" class="text-xs font-bold text-primary hover:text-primary/80 px-3 py-1 bg-primary/10 rounded-lg border border-primary/20">
        Criar
      </button>
    </div>

    <div v-if="!sheet.data?.resources?.length" class="text-center py-16 text-zinc-600">
      Nenhum recurso cadastrado.<br>
      <span class="text-xs">Use "Novo Recurso" para adicionar Fúria, Pontos Arcanos, etc.</span>
    </div>

    <!-- Resource List -->
    <div class="space-y-4">
      <div v-for="(res, i) in sheet.data?.resources" :key="i" class="group rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
        <div class="flex items-center justify-between mb-3">
          <span class="font-bold text-zinc-200">{{ res.name || res.label }}</span>
          <div class="flex items-center gap-2">
            <span class="text-sm text-zinc-400">{{ res.current ?? res.max }} / {{ res.max }}</span>
            <button @click="onDelete(i)" class="opacity-0 group-hover:opacity-100 text-red-700 hover:text-red-500 transition-all">
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Big bar -->
        <div class="h-4 bg-zinc-800 rounded-full overflow-hidden mb-3">
          <div class="h-full rounded-full transition-all duration-500"
            :style="{
              width: res.max ? (((res.current ?? res.max) / res.max) * 100) + '%' : '100%',
              backgroundColor: barColor(res.current ?? res.max, res.max)
            }" />
        </div>

        <!-- Controls -->
        <div class="flex items-center gap-3">
          <button @click="onAdjust(i, -5)"
            class="flex-1 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors text-sm font-bold">
            −5
          </button>
          <button @click="onAdjust(i, -1)"
            class="flex-1 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors text-sm font-bold">
            −1
          </button>
          <div class="text-center px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-900 min-w-[3rem]">
            <span class="text-xl font-extrabold font-serif tabular-nums" :style="{ color: barColor(res.current ?? res.max, res.max) }">
              {{ res.current ?? res.max }}
            </span>
          </div>
          <button @click="onAdjust(i, 1)"
            class="flex-1 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors text-sm font-bold">
            +1
          </button>
          <button @click="onAdjust(i, 5)"
            class="flex-1 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors text-sm font-bold">
            +5
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

```


---
## FILE: src/components/sheet/tabs/SkillsTab.vue
```vue
<script setup lang="ts">
import { computed } from 'vue'
import { Search } from 'lucide-vue-next'

const props = defineProps<{
  d: any
  editMode: boolean
  tabsEditMode: boolean
  editedData: any
  skillPhase: 'select' | 'allocate'
  skillSearch: string
  filteredSkillsList: { name: string; ability: string; trainedOnly?: boolean; ranks?: number }[]
  activeSkills: { name: string; ranks: number; ability: string }[]
  skillPointsSpent: number
  modStr: (n: number) => string
  modStrF: (n: number) => string
  skillAbilityMod: (ability: string) => number
  skillTotal: (name: string, ability: string) => number
  isClassSkill: (name: string) => boolean
  calcMod: (n: number) => number
  attrTotal: (key: string) => number
}>()

const emit = defineEmits<{
  (e: 'toggle-tabs-edit'): void
  (e: 'update:skill-phase', v: 'select' | 'allocate'): void
  (e: 'update:skill-search', v: string): void
  (e: 'toggle-skill-edit', name: string): void
  (e: 'adjust-rank', name: string, delta: 1 | -1): void
  (e: 'add-level-up-skill-points'): void
  (e: 'roll', label: string, formula: string): void
}>()

// In view mode show activeSkills. When searching, show filteredSkillsList filtered by active skills.
const displayedSkills = computed(() => {
  if (props.tabsEditMode) {
    return props.skillSearch ? props.filteredSkillsList : props.activeSkills
  }
  return props.skillSearch
    ? props.filteredSkillsList.filter(s => props.activeSkills.some(a => a.name === s.name))
    : props.activeSkills
})

function getRank(name: string): number {
  if (props.tabsEditMode && props.editedData?.skills) {
    return props.editedData.skills[name] ?? 0
  }
  const sk = props.activeSkills.find(s => s.name === name)
  return sk?.ranks ?? 0
}
</script>

<template>
  <div class="space-y-4">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-2">
      <div class="relative flex-1 min-w-48">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
        <input
          :value="skillSearch"
          @input="emit('update:skill-search', ($event.target as HTMLInputElement).value)"
          placeholder="Buscar perícia..."
          class="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-primary/60"
        />
      </div>
      <button
        @click="emit('toggle-tabs-edit')"
        class="text-xs font-bold px-3 py-2 rounded-lg border transition-all"
        :class="tabsEditMode
          ? 'bg-primary/20 border-primary text-primary'
          : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600'"
      >
        {{ tabsEditMode ? '✓ Concluir Edição' : 'Editar Perícias' }}
      </button>

      <div v-if="tabsEditMode" class="text-xs text-zinc-500">
        Gastos: <span class="font-bold text-primary">{{ skillPointsSpent }}</span>
        · Disponíveis: <span class="font-bold text-zinc-200">{{ editedData?.skillPoints ?? '?' }}</span>
      </div>
    </div>

    <!-- Table -->
    <div class="rounded-xl border border-zinc-800 overflow-hidden">
      <div class="grid grid-cols-[1fr_auto_auto_auto] text-[10px] font-bold uppercase tracking-widest text-zinc-600 px-4 py-2 bg-zinc-900/80 border-b border-zinc-800">
        <span>Perícia</span>
        <span class="text-center w-14">Mod</span>
        <span class="text-center w-20">Ranque</span>
        <span class="text-center w-14">Total</span>
      </div>

      <div class="divide-y divide-zinc-900">
        <div
          v-for="sk in displayedSkills"
          :key="sk.name"
          class="grid grid-cols-[1fr_auto_auto_auto] items-center px-4 py-2.5 transition-colors group"
          :class="!tabsEditMode ? 'cursor-pointer hover:bg-zinc-900/50' : 'hover:bg-zinc-900/30'"
          @click="!tabsEditMode && emit('roll', sk.name, '1d20 + @' + sk.ability + 'Mod')"
        >
          <!-- Name -->
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-bold text-zinc-600 uppercase w-6 text-center">{{ sk.ability }}</span>
            <div>
              <span class="text-sm font-medium transition-colors"
                :class="!tabsEditMode ? 'text-zinc-300 group-hover:text-primary' : 'text-zinc-300'">
                {{ sk.name }}
              </span>
              <!-- show class skill badge and toggle in edit mode -->
              <div v-if="tabsEditMode" class="flex items-center gap-1 mt-0.5">
                <span v-if="isClassSkill(sk.name)" class="text-[9px] text-primary/70 bg-primary/10 rounded px-1">classe</span>
              </div>
            </div>
            <span v-if="!tabsEditMode && isClassSkill(sk.name)" class="text-[9px] text-primary/70 bg-primary/10 rounded px-1">classe</span>
          </div>

          <!-- Ability mod -->
          <div class="text-center w-14 text-xs text-zinc-400 tabular-nums">
            {{ modStrF(skillAbilityMod(sk.ability)) }}
          </div>

          <!-- Rank -->
          <div class="text-center w-20">
            <div v-if="tabsEditMode" class="flex items-center justify-center gap-1">
              <button
                @click.stop="emit('adjust-rank', sk.name, -1)"
                class="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 text-sm flex items-center justify-center text-zinc-400 leading-none"
              >−</button>
              <span class="w-6 text-center text-xs font-bold tabular-nums text-zinc-200">{{ getRank(sk.name) }}</span>
              <button
                @click.stop="emit('adjust-rank', sk.name, 1)"
                class="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 text-sm flex items-center justify-center text-zinc-400 leading-none"
              >+</button>
            </div>
            <span v-else class="text-xs text-zinc-500 tabular-nums">{{ getRank(sk.name) }}</span>
          </div>

          <!-- Total -->
          <div class="text-center w-14">
            <span class="text-sm font-bold tabular-nums"
              :class="skillTotal(sk.name, sk.ability) >= 10 ? 'text-primary' : 'text-zinc-300'">
              {{ modStr(skillTotal(sk.name, sk.ability)) }}
            </span>
          </div>
        </div>

        <div v-if="!displayedSkills.length" class="text-center py-10 text-zinc-600 text-sm">
          Nenhuma perícia encontrada.
        </div>
      </div>
    </div>
  </div>
</template>

```


---
## FILE: src/components/sheet/tabs/SpellsTab.vue
```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { Wand2, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-vue-next'

const props = defineProps<{
  d: any
  editMode: boolean
  tabsEditMode: boolean
  spellSlotsMax: Record<number, number>
  spellSlotsUsed: Record<number, number>
  SPELL_LEVELS: number[]
  modStr: (n: number) => string
  resolveFormula: (formula: string) => string
  onOpenEditor: (type: string, item?: any, index?: number) => void
  onDelete: (type: string, index: number) => void
  onRollItem: (label: string, formula: string, isAtk: boolean, atkF: string, dmgF: string) => void
  onAdjustSlot: (level: number, delta: number, field: 'used' | 'max') => void
  onToggleEdit: () => void
}>()

const expanded = ref<Set<number>>(new Set())
function toggleExpand(i: number) {
  if (expanded.value.has(i)) expanded.value.delete(i)
  else expanded.value.add(i)
}

const spellsByLevel = computed(() => {
  const groups: Record<number, { spell: any; index: number }[]> = {}
  props.d?.spells?.forEach((sp: any, i: number) => {
    const lv = sp.spellLevel ?? 0
    if (!groups[lv]) groups[lv] = []
    groups[lv].push({ spell: sp, index: i })
  })
  return groups
})

const usedLevels = computed(() => Object.keys(spellsByLevel.value).map(Number).sort())
</script>

<template>
  <div class="space-y-4">
    <!-- Tab toolbar -->
    <div class="bg-zinc-900/60 border border-zinc-800 rounded-xl px-3 py-2 flex items-center justify-between">
      <button @click="onToggleEdit"
        class="text-xs font-bold px-3 py-1.5 rounded-lg border transition-all"
        :class="tabsEditMode
          ? 'bg-primary/20 border-primary text-primary'
          : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'">
        {{ tabsEditMode ? '✓ Concluir' : 'Editar Slots' }}
      </button>
      <button @click="onOpenEditor('spell')"
        class="flex items-center gap-1 text-xs text-zinc-300 border border-zinc-700 rounded-lg px-2.5 py-1.5 hover:bg-zinc-800 transition-colors">
        <Plus class="w-3.5 h-3.5" /> Nova Magia
      </button>
    </div>

    <!-- Spell Levels -->
    <div v-for="level in usedLevels" :key="level" class="space-y-2">
      <!-- Level header with slot tracker -->
      <div class="flex items-center gap-3 px-1">
        <div class="flex items-center gap-2">
          <Wand2 class="w-3.5 h-3.5 text-violet-400" />
          <span class="text-xs font-black uppercase tracking-widest text-zinc-400">
            {{ level === 0 ? 'Truques (Nível 0)' : `Nível ${level}` }}
          </span>
        </div>
        <!-- Slot pips -->
        <div class="flex items-center gap-1 ml-auto">
          <template v-if="(spellSlotsMax[level] ?? 0) > 0">
            <button
              v-for="s in spellSlotsMax[level]" :key="s"
              @click="onAdjustSlot(level, (s as number) <= (spellSlotsUsed[level] ?? 0) ? -1 : 1, 'used')"
              class="w-4 h-4 rounded-full border transition-colors"
              :class="(s as number) <= (spellSlotsUsed[level] ?? 0)
                ? 'bg-zinc-700 border-zinc-600'
                : 'bg-violet-500/80 border-violet-400/60 hover:bg-violet-400'"
            />
            <template v-if="tabsEditMode">
              <button @click="onAdjustSlot(level, -1, 'max')" class="ml-1 text-zinc-600 hover:text-zinc-300 text-xs">−</button>
              <button @click="onAdjustSlot(level, 1, 'max')" class="text-zinc-600 hover:text-zinc-300 text-xs">+</button>
            </template>
          </template>
          <template v-else-if="tabsEditMode">
            <button @click="onAdjustSlot(level, 1, 'max')" class="text-xs text-primary/60 hover:text-primary border border-primary/20 rounded px-1">+ slot</button>
          </template>
        </div>
      </div>

      <!-- Spells -->
      <div class="space-y-1.5">
        <div v-for="{ spell, index } in spellsByLevel[level]" :key="index"
          class="group rounded-xl border border-zinc-800 bg-zinc-950/60 overflow-hidden hover:border-zinc-700 transition-colors">
          <div class="flex items-center gap-3 px-4 py-2.5 cursor-pointer" @click="toggleExpand(index)">
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <span class="font-bold text-sm text-violet-200">{{ spell.title }}</span>
                <span v-if="spell.school" class="text-[10px] text-zinc-600 bg-zinc-800 rounded px-1.5 py-0.5">{{ spell.school }}</span>
              </div>
              <div class="flex flex-wrap gap-2 mt-0.5 text-[10px] text-zinc-600">
                <span v-if="spell.castingTime">⏱ {{ spell.castingTime }}</span>
                <span v-if="spell.range">📍 {{ spell.range }}</span>
                <span v-if="spell.duration">⌚ {{ spell.duration }}</span>
              </div>
            </div>

            <div class="flex gap-1 items-center">
              <button v-if="spell.rollFormula" @click.stop="onRollItem(spell.title, spell.rollFormula, false, '', '')"
                class="text-xs font-bold px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 transition-colors">
                Rolar
              </button>
              <button @click.stop="onOpenEditor('spell', spell, index)" class="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-600 hover:text-zinc-300 transition-all">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
              </button>
              <button @click.stop="onDelete('spell', index)" class="opacity-0 group-hover:opacity-100 p-1.5 text-red-800 hover:text-red-500 transition-all">
                <Trash2 class="w-3.5 h-3.5" />
              </button>
              <ChevronDown v-if="!expanded.has(index)" class="w-4 h-4 text-zinc-600" />
              <ChevronUp v-else class="w-4 h-4 text-zinc-600" />
            </div>
          </div>

          <div v-if="expanded.has(index) && spell.description" class="border-t border-zinc-800/60 px-4 py-3 bg-zinc-900/30">
            <p class="text-sm text-zinc-400 whitespace-pre-wrap leading-relaxed">{{ spell.description }}</p>
            <div v-if="spell.savingThrow || spell.spellResist" class="flex gap-4 mt-2 text-xs text-zinc-500">
              <span v-if="spell.savingThrow">🛡 {{ spell.savingThrow }}</span>
              <span v-if="spell.spellResist">RM: {{ spell.spellResist }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!d?.spells?.length" class="text-center py-12 text-zinc-600 text-sm">
      Nenhuma magia cadastrada.
    </div>
  </div>
</template>

```


---
## FILE: src/components/sheet/tabs/SummaryTab.vue
```vue
<script setup lang="ts">
import { ChevronDown, ChevronUp, Swords, Zap, Wand2, Package, Flame } from 'lucide-vue-next'
import { ref } from 'vue'
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
  (e: 'roll-item', label: string, formula: string, isAtk: boolean, atkF: string, dmgF: string): void
  (e: 'add-shortcut'): void
  (e: 'delete-shortcut', i: number): void
  (e: 'add-resource', name: string, max: number): void
  (e: 'adjust-resource', i: number, delta: number): void
  (e: 'reset-resources'): void
  (e: 'delete-resource', i: number): void
}>()

// ── Collapsible summary panels ────────────────────────────────────────
const openPanels = ref<Set<string>>(new Set())
function togglePanel(id: string) {
  if (openPanels.value.has(id)) openPanels.value.delete(id)
  else openPanels.value.add(id)
}

const SUMMARY_PANELS = [
  { id: 'spells',    label: 'Magias',       icon: Wand2 },
  { id: 'feats',     label: 'Talentos',     icon: Swords },
  { id: 'equipment', label: 'Equipamentos', icon: Package },
  { id: 'buffs',     label: 'Buffs',        icon: Flame },
]

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
        <div class="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 flex flex-col gap-2 justify-center">
          <div class="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1 text-center">Salvaguardas</div>
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
        <div class="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 overflow-hidden">
          <div class="flex items-center gap-2 mb-2">
            <Flame class="w-3.5 h-3.5 text-zinc-500" />
            <span class="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Buffs Ativos</span>
          </div>
          <div v-if="!d?.buffs?.filter((b: any) => b.active).length"
            class="text-center py-3 text-zinc-600 text-xs">Nenhum buff.</div>
          <div v-else class="space-y-1 overflow-y-auto max-h-40">
            <div v-for="(buf, i) in d.buffs.filter((b: any) => b.active)" :key="i"
              class="flex items-center gap-1.5 py-1 border-b border-zinc-800/40 last:border-0">
              <Flame class="w-3 h-3 shrink-0 text-primary" />
              <span class="text-xs text-zinc-200 truncate">{{ buf.title }}</span>
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
      <div class="grid gap-3" style="grid-template-columns: 1fr auto;">
        <ShortcutsBlock
          :d="d"
          :mod-str="modStr"
          :resolve-formula="resolveFormula"
          :edit-mode="editMode"
          :on-roll-item="(l, f, a, af, df) => emit('roll-item', l, f, a, af, df)"
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
      <div v-for="panel in SUMMARY_PANELS" :key="panel.id"
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
          <ChevronDown v-if="!openPanels.has(panel.id)" class="w-4 h-4 text-zinc-600" />
          <ChevronUp v-else class="w-4 h-4 text-zinc-600" />
        </button>

        <!-- Panel content -->
        <div v-if="openPanels.has(panel.id)" class="border-t border-zinc-800/50 px-4 py-3 space-y-2">

          <!-- MAGIAS -->
          <template v-if="panel.id === 'spells'">
            <div v-if="!d?.spells?.length" class="text-center py-4 text-zinc-600 text-xs">Nenhuma magia.</div>
            <div v-else class="space-y-1">
              <div v-for="(spell, i) in d.spells" :key="i"
                class="flex items-center justify-between py-1.5 border-b border-zinc-800/40 last:border-0">
                <div>
                  <span class="text-sm font-semibold text-violet-200">{{ spell.title }}</span>
                  <span v-if="spell.school" class="ml-2 text-[10px] text-zinc-600 bg-zinc-800 rounded px-1.5">{{ spell.school }}</span>
                  <span class="ml-2 text-[10px] text-zinc-600">Nv.{{ spell.spellLevel ?? 0 }}</span>
                </div>
                <button v-if="spell.rollFormula"
                  @click="emit('roll', spell.title, spell.rollFormula)"
                  class="text-xs px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 transition-colors">
                  Rolar
                </button>
              </div>
            </div>
          </template>

          <!-- TALENTOS -->
          <template v-else-if="panel.id === 'feats'">
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
                  @click="emit('roll-item', feat.title, feat.attackFormula || '', true, feat.attackFormula || '', feat.damageFormula || '')"
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
                class="flex items-center justify-between py-1.5 border-b border-zinc-800/40 last:border-0">
                <div>
                  <span class="text-sm font-semibold"
                    :class="item.equipped ? 'text-primary/90' : 'text-zinc-300'">{{ item.title }}</span>
                  <span v-if="item.equipped" class="ml-2 text-[10px] text-primary/50">• equipado</span>
                  <span v-if="item.weight" class="ml-2 text-[10px] text-zinc-600">{{ item.weight }}kg</span>
                </div>
                <Package class="w-3.5 h-3.5 shrink-0"
                  :class="item.equipped ? 'text-primary/60' : 'text-zinc-700'" />
              </div>
            </div>
          </template>

          <!-- BUFFS -->
          <template v-else-if="panel.id === 'buffs'">
            <div v-if="!d?.buffs?.length" class="text-center py-4 text-zinc-600 text-xs">Nenhum buff.</div>
            <div v-else class="space-y-1">
              <div v-for="(buf, i) in d.buffs" :key="i"
                class="flex items-center gap-3 py-1.5 border-b border-zinc-800/40 last:border-0">
                <Flame class="w-3.5 h-3.5 shrink-0"
                  :class="buf.active ? 'text-primary' : 'text-zinc-700'" />
                <div class="flex-1">
                  <span class="text-sm font-semibold"
                    :class="buf.active ? 'text-zinc-200' : 'text-zinc-500'">{{ buf.title }}</span>
                  <div v-if="buf.modifiers?.length" class="text-[10px] text-zinc-600 mt-0.5">
                    {{ buf.modifiers.map((m: any) => `${m.target} ${modStr(m.value)}`).join(' · ') }}
                  </div>
                </div>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                  :class="buf.active
                    ? 'bg-primary/10 text-primary border-primary/30'
                    : 'bg-zinc-800 text-zinc-600 border-zinc-700'">
                  {{ buf.active ? 'Ativo' : 'Inativo' }}
                </span>
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
## FILE: src/components/wizard/steps/SpellsStep.vue
```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useWizardStore } from '@/stores/wizardStore'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Trash2 } from 'lucide-vue-next'

const store = useWizardStore()
const newSpell = ref('')

const spellcastingClasses = ['Bard', 'Cleric', 'Druid', 'Paladin', 'Ranger', 'Sorcerer', 'Wizard']
const isSpellcaster = computed(() => spellcastingClasses.includes(store.character.class))

function addSpell() {
  if (newSpell.value.trim()) {
    store.character.spells.push(newSpell.value.trim())
    newSpell.value = ''
  }
}

function removeSpell(index: number) {
  store.character.spells.splice(index, 1)
}
</script>

<template>
  <div class="grid gap-6">
    <div v-if="!isSpellcaster" class="text-center p-8 text-muted-foreground">
      <p>Sua classe selecionada ({{ store.character.class }}) tipicamente não conjura magias.</p>
      <p class="text-sm">Você ainda pode adicionar magias se tiver habilidades especiais ou talentos.</p>
    </div>

    <div class="flex gap-2">
      <Input v-model="newSpell" placeholder="Nome da magia" @keyup.enter="addSpell" />
      <Button @click="addSpell">Adicionar Magia</Button>
    </div>

    <div class="grid gap-2">
      <Card v-for="(spell, index) in store.character.spells" :key="index" class="p-4 flex justify-between items-center">
        <span>{{ spell }}</span>
        <Button variant="ghost" size="icon" @click="removeSpell(index)">
          <Trash2 class="h-4 w-4" />
        </Button>
      </Card>
      <div v-if="store.character.spells.length === 0"
        class="text-center text-sm text-muted-foreground p-4 border border-dashed rounded-md">
        Nenhuma magia adicionada.
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
import { computed, type Ref, type ComputedRef } from 'vue'
import type { SheetData, Modifier } from '@/types/sheet'
import { defaultBonuses } from '@/lib/sheetDefaults'

export function useDndCalculations(
    d: ComputedRef<SheetData | null | undefined>,
    editMode: ComputedRef<boolean>,
    editedData: Ref<SheetData | null>,
    sheet: Ref<any>
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
        d.value?.spells?.forEach((s: any) => {
            if (typeof s === 'string') return
            s.modifiers?.forEach((m: Modifier) => bonuses[m.target] = (bonuses[m.target] || 0) + (Number(m.value) || 0))
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
        return 10 + (d.value.ca_armor ?? 0) + calcMod(attrTotal('dex'))
            + (d.value.ca_shield ?? 0) + (d.value.ca_natural ?? 0)
            + (d.value.ca_deflect ?? 0) + sizeMod.value
            + (totalBonuses.value['CA'] ?? 0) + (b.value?.ca ?? 0)
    })

    const totalTouch = computed(() => {
        if (!d.value) return 10
        return 10 + calcMod(attrTotal('dex')) + (d.value.ca_deflect ?? 0) + sizeMod.value + (totalBonuses.value['toque'] ?? 0)
    })

    const totalFlatFooted = computed(() => {
        if (!d.value) return 10
        return 10 + (d.value.ca_armor ?? 0) + (d.value.ca_shield ?? 0) + (d.value.ca_natural ?? 0) + (d.value.ca_deflect ?? 0) + sizeMod.value + (totalBonuses.value['surpreso'] ?? 0)
    })

    const totalBAB = computed(() => (d.value?.bab || 0) + (totalBonuses.value.bab || 0) + (b.value?.bab ?? 0))
    const totalInitiative = computed(() => calcMod(attrTotal('dex')) + (d.value?.initiative_misc || 0) + (totalBonuses.value.iniciativa || 0) + (b.value?.initiative ?? 0))
    const totalHP = computed(() => (d.value?.hp_max || 0) + (totalBonuses.value.hp || 0) + (b.value?.hp ?? 0))
    const totalSpeed = computed(() => (d.value?.speed || 9) + (totalBonuses.value.speed || 0) + (b.value?.speed ?? 0))

    const meleeAtk = computed(() => totalBAB.value + calcMod(attrTotal('str')) + sizeMod.value + (totalBonuses.value.melee || 0))
    const rangedAtk = computed(() => totalBAB.value + calcMod(attrTotal('dex')) + sizeMod.value + (totalBonuses.value.ranged || 0))
    const grappleAtk = computed(() => totalBAB.value + calcMod(attrTotal('str')) + (sizeMod.value * 4) + (totalBonuses.value.grapple || 0))

    const totalFort = computed(() => (d.value?.save_fort || 0) + calcMod(attrTotal('con')) + (totalBonuses.value.fort || 0) + (b.value?.saves?.fort ?? 0))
    const totalRef = computed(() => (d.value?.save_ref || 0) + calcMod(attrTotal('dex')) + (totalBonuses.value.ref || 0) + (b.value?.saves?.ref ?? 0))
    const totalWill = computed(() => (d.value?.save_will || 0) + calcMod(attrTotal('wis')) + (totalBonuses.value.will || 0) + (b.value?.saves?.will ?? 0))

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
import type { Ref, ComputedRef } from 'vue'

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
    onDualRoll?: (label: string, atkDisplay: string, dmgDisplay: string, atkEval: string, dmgEval: string) => void
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

        if (item.isAttack && ctx.onDualRoll && item.attackFormula && item.damageFormula) {
            let atkDisplay = item.attackFormula
            let dmgDisplay = item.damageFormula
            let atkEval = resolveFormula(atkDisplay)
            let dmgEval = resolveFormula(dmgDisplay)

            const bonus = Number(item.attackBonus) || 0
            if (bonus) {
                const bonusStr = bonus >= 0 ? `+${bonus}` : `${bonus}`
                atkDisplay = `${atkDisplay} ${bonusStr}`
                atkEval = `${atkEval} ${bonusStr}`
            }

            atkEval = sanitizeFormula(atkEval)
            dmgEval = sanitizeFormula(dmgEval)

            ctx.onDualRoll(item.title, atkDisplay, dmgDisplay, atkEval, dmgEval)
        } else {
            handleRoll(item.title, item.rollFormula || '1d20', Number(item.attackBonus) || 0)
        }
    }

    function sendSpellToChat(spell: any) {
        if (!ctx.onRoll) return
        const title = typeof spell === 'string' ? spell : spell.title
        const desc = typeof spell === 'string' ? '' : spell.description
        const formula = typeof spell === 'string' ? '' : spell.rollFormula

        let content = `**Magia: ${title}**`
        if (spell.school) content += ` (${spell.school})`
        content += `\n`
        if (spell.spellLevel !== undefined) content += `*Nível ${spell.spellLevel}*\n`
        if (spell.castingTime) content += `**Execução:** ${spell.castingTime} | `
        if (spell.range) content += `**Alcance:** ${spell.range}\n`
        if (spell.target) content += `**Alvo:** ${spell.target} | `
        if (spell.duration) content += `**Duração:** ${spell.duration}\n`
        if (spell.savingThrow) content += `**Resistência:** ${spell.savingThrow} | `
        if (spell.spellResist) content += `**RM:** ${spell.spellResist}\n`
        if (desc) content += `\n${resolveFormula(desc)}`

        if (formula) {
            handleRoll(title, formula)
        } else {
            ctx.onRoll(content, '', '')
        }
    }

    return { resolveFormula, handleRoll, handleItemRoll, sendSpellToChat }
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
        if (!copy.spells) copy.spells = []
        if (!copy.shortcuts) copy.shortcuts = []
        if (copy.xp === undefined) copy.xp = 0
        if (!copy.buffs) copy.buffs = []
        if (!copy.hp_max) copy.hp_max = 0
        editedData.value = copy
    }

    async function saveEdit(spellSlotsMax?: any, spellSlotsUsed?: any) {
        if (!editedData.value || !sheet.value) return

        // Persist spell slots as part of sheet data
        if (spellSlotsMax) editedData.value.spellSlotsMax = { ...spellSlotsMax }
        if (spellSlotsUsed) editedData.value.spellSlotsUsed = { ...spellSlotsUsed }

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


---
## FILE: src/composables/useSpellSlots.ts
```typescript
import { ref, computed, watch, type Ref, type ComputedRef } from 'vue'

const SPELL_LEVELS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

export function useSpellSlots(sheet: Ref<any>) {
    const spellSlotsMax = ref<Record<number, number>>({})
    const spellSlotsUsed = ref<Record<number, number>>({})

    function initSpellSlots() {
        SPELL_LEVELS.forEach(lvl => {
            if (spellSlotsMax.value[lvl] === undefined) spellSlotsMax.value[lvl] = 0
            if (spellSlotsUsed.value[lvl] === undefined) spellSlotsUsed.value[lvl] = 0
        })
    }

    function adjustSlotUsed(level: number, delta: number) {
        const max = spellSlotsMax.value[level] ?? 0
        const cur = spellSlotsUsed.value[level] ?? 0
        spellSlotsUsed.value[level] = Math.max(0, Math.min(max, cur + delta))
    }

    function adjustSlotMax(level: number, delta: number) {
        const cur = spellSlotsMax.value[level] ?? 0
        spellSlotsMax.value[level] = Math.max(0, cur + delta)
        if ((spellSlotsUsed.value[level] ?? 0) > spellSlotsMax.value[level])
            spellSlotsUsed.value[level] = spellSlotsMax.value[level]
    }

    watch(() => (sheet as any).value?.data, (newData: any) => {
        if (newData) {
            spellSlotsMax.value = newData.spellSlotsMax ?? {}
            spellSlotsUsed.value = newData.spellSlotsUsed ?? {}
            initSpellSlots()
        }
    }, { immediate: true })

    return {
        SPELL_LEVELS,
        spellSlotsMax,
        spellSlotsUsed,
        initSpellSlots,
        adjustSlotUsed,
        adjustSlotMax
    }
}

```


---
## FILE: src/data/dnd35.ts
```typescript
export const SKILLS_DATA = [
    { name: 'Acrobacia', ability: 'dex', trainedOnly: true },
    { name: 'Adestrar Animais', ability: 'cha', trainedOnly: true },
    { name: 'Arte da Fuga', ability: 'dex', trainedOnly: false },
    { name: 'Atuação', ability: 'cha', trainedOnly: false },
    { name: 'Avaliação', ability: 'int', trainedOnly: false },
    { name: 'Blefar', ability: 'cha', trainedOnly: false },
    { name: 'Cavalgar', ability: 'dex', trainedOnly: false },
    { name: 'Concentração', ability: 'con', trainedOnly: false },
    { name: 'Conhecimento (Arcano)', ability: 'int', trainedOnly: true },
    { name: 'Conhecimento (Arquitetura e Engenharia)', ability: 'int', trainedOnly: true },
    { name: 'Conhecimento (Dungeons)', ability: 'int', trainedOnly: true },
    { name: 'Conhecimento (Geografia)', ability: 'int', trainedOnly: true },
    { name: 'Conhecimento (História)', ability: 'int', trainedOnly: true },
    { name: 'Conhecimento (Local)', ability: 'int', trainedOnly: true },
    { name: 'Conhecimento (Natureza)', ability: 'int', trainedOnly: true },
    { name: 'Conhecimento (Nobreza e Realeza)', ability: 'int', trainedOnly: true },
    { name: 'Conhecimento (Os Planos)', ability: 'int', trainedOnly: true },
    { name: 'Conhecimento (Religião)', ability: 'int', trainedOnly: true },
    { name: 'Cura', ability: 'wis', trainedOnly: false },
    { name: 'Decifrar Escrita', ability: 'int', trainedOnly: true },
    { name: 'Disfarces', ability: 'cha', trainedOnly: false },
    { name: 'Diplomacia', ability: 'cha', trainedOnly: false },
    { name: 'Equilíbrio', ability: 'dex', trainedOnly: false },
    { name: 'Escalar', ability: 'str', trainedOnly: false },
    { name: 'Esconder-se', ability: 'dex', trainedOnly: false },
    { name: 'Falsificação', ability: 'int', trainedOnly: false },
    { name: 'Furtividade', ability: 'dex', trainedOnly: false },
    { name: 'Identificar Magia', ability: 'int', trainedOnly: true },
    { name: 'Intimidação', ability: 'cha', trainedOnly: false },
    { name: 'Natação', ability: 'str', trainedOnly: false },
    { name: 'Obter Informação', ability: 'cha', trainedOnly: false },
    { name: 'Observar', ability: 'wis', trainedOnly: false },
    { name: 'Ofícios', ability: 'int', trainedOnly: false },
    { name: 'Operar Mecanismo', ability: 'int', trainedOnly: true },
    { name: 'Ouvir', ability: 'wis', trainedOnly: false },
    { name: 'Prestidigitação', ability: 'dex', trainedOnly: true },
    { name: 'Procurar', ability: 'int', trainedOnly: false },
    { name: 'Profissão', ability: 'wis', trainedOnly: true },
    { name: 'Saltar', ability: 'str', trainedOnly: false },
    { name: 'Sentir Motivação', ability: 'wis', trainedOnly: false },
    { name: 'Sobrevivência', ability: 'wis', trainedOnly: false },
    { name: 'Usar Cordas', ability: 'dex', trainedOnly: false },
    { name: 'Usar Instrumento Mágico', ability: 'cha', trainedOnly: true },
]

export const CLASS_SKILLS: Record<string, string[]> = {
    'Bárbaro': ['Escalar', 'Ofícios', 'Adestrar Animais', 'Intimidação', 'Saltar', 'Ouvir', 'Cavalgar', 'Sobrevivência', 'Natação'],
    'Bardo': ['Avaliação', 'Equilíbrio', 'Blefar', 'Escalar', 'Concentração', 'Ofícios', 'Decifrar Escrita', 'Diplomacia', 'Disfarces', 'Arte da Fuga', 'Obter Informação', 'Esconder-se', 'Saltar', 'Conhecimento (Arcano)', 'Ouvir', 'Furtividade', 'Atuação', 'Profissão', 'Sentir Motivação', 'Prestidigitação', 'Identificar Magia', 'Natação', 'Acrobacia', 'Usar Instrumento Mágico'],
    'Clérigo': ['Concentração', 'Ofícios', 'Diplomacia', 'Cura', 'Conhecimento (Arcano)', 'Conhecimento (Religião)', 'Profissão', 'Identificar Magia'],
    'Druida': ['Concentração', 'Ofícios', 'Diplomacia', 'Adestrar Animais', 'Cura', 'Conhecimento (Natureza)', 'Ouvir', 'Profissão', 'Cavalgar', 'Identificar Magia', 'Observar', 'Sobrevivência', 'Natação'],
    'Guerreiro': ['Escalar', 'Ofícios', 'Adestrar Animais', 'Intimidação', 'Saltar', 'Cavalgar', 'Natação'],
    'Monge': ['Equilíbrio', 'Escalar', 'Concentração', 'Ofícios', 'Diplomacia', 'Arte da Fuga', 'Esconder-se', 'Saltar', 'Conhecimento (Arcano)', 'Conhecimento (Religião)', 'Ouvir', 'Furtividade', 'Atuação', 'Profissão', 'Sentir Motivação', 'Observar', 'Natação', 'Acrobacia'],
    'Paladino': ['Concentração', 'Ofícios', 'Diplomacia', 'Adestrar Animais', 'Cura', 'Conhecimento (Religião)', 'Profissão', 'Cavalgar', 'Sentir Motivação'],
    'Ranger': ['Escalar', 'Concentração', 'Ofícios', 'Adestrar Animais', 'Cura', 'Esconder-se', 'Saltar', 'Conhecimento (Dungeons)', 'Conhecimento (Geografia)', 'Conhecimento (Natureza)', 'Ouvir', 'Furtividade', 'Profissão', 'Cavalgar', 'Procurar', 'Observar', 'Sobrevivência', 'Natação', 'Usar Cordas'],
    'Ladino': ['Avaliação', 'Equilíbrio', 'Blefar', 'Escalar', 'Ofícios', 'Decifrar Escrita', 'Diplomacia', 'Operar Mecanismo', 'Disfarces', 'Arte da Fuga', 'Falsificação', 'Obter Informação', 'Esconder-se', 'Intimidação', 'Saltar', 'Ouvir', 'Furtividade', 'Abrir Fechaduras', 'Atuação', 'Profissão', 'Procurar', 'Sentir Motivação', 'Prestidigitação', 'Observar', 'Natação', 'Acrobacia', 'Usar Instrumento Mágico', 'Usar Cordas'],
    'Feiticeiro': ['Blefar', 'Concentração', 'Ofícios', 'Conhecimento (Arcano)', 'Profissão', 'Identificar Magia'],
    'Mago': ['Concentração', 'Ofícios', 'Decifrar Escrita', 'Conhecimento (Arcano)', 'Conhecimento (Arquitetura e Engenharia)', 'Conhecimento (Dungeons)', 'Conhecimento (Geografia)', 'Conhecimento (História)', 'Conhecimento (Local)', 'Conhecimento (Natureza)', 'Conhecimento (Nobreza e Realeza)', 'Conhecimento (Religião)', 'Conhecimento (Os Planos)', 'Profissão', 'Identificar Magia'],
    'Bruxo': ['Blefar', 'Concentração', 'Ofícios', 'Disfarces', 'Intimidação', 'Saltar', 'Conhecimento (Arcano)', 'Conhecimento (Os Planos)', 'Conhecimento (Religião)', 'Profissão', 'Sentir Motivação', 'Identificar Magia', 'Usar Instrumento Mágico'],
    'Assassino': ['Acrobacia', 'Arte da Fuga', 'Blefar', 'Decifrar Escrita', 'Diplomacia', 'Disfarces', 'Equilíbrio', 'Esconder-se', 'Falsificação', 'Furtividade', 'Intimidação', 'Observar', 'Obter Informação', 'Ouvir', 'Prestidigitação', 'Procurar', 'Sentir Motivação', 'Usar Cordas', 'Usar Instrumento Mágico'],
    'Algoz': ['Adestrar Animais', 'Cavalgar', 'Concentração', 'Conhecimento (Religião)', 'Cura', 'Diplomacia', 'Esconder-se', 'Intimidação', 'Ofícios', 'Profissão'],
    'Defensor Anão': ['Adestrar Animais', 'Avaliação', 'Cavalgar', 'Ouvir', 'Sentir Motivação', 'Sobrevivência'],
    'Dançarino das Sombras': ['Acrobacia', 'Arte da Fuga', 'Atuação', 'Blefar', 'Decifrar Escrita', 'Diplomacia', 'Disfarces', 'Equilíbrio', 'Esconder-se', 'Furtividade', 'Observar', 'Ouvir', 'Prestidigitação', 'Procurar', 'Saltar', 'Usar Cordas'],
    'Mestre do Conhecimento': ['Concentração', 'Conhecimento (Todos)', 'Avaliação', 'Cura', 'Decifrar Escrita', 'Falsificação', 'Identificar Magia', 'Prestidigitação'],
    'Teurgo Místico': ['Concentração', 'Conhecimento (Arcano)', 'Conhecimento (Religião)', 'Decifrar Escrita', 'Identificar Magia']
}

export const CLASS_SKILL_POINTS: Record<string, number> = {
    'Bárbaro': 4,
    'Bardo': 6,
    'Clérigo': 2,
    'Druida': 4,
    'Guerreiro': 2,
    'Monge': 4,
    'Paladino': 2,
    'Ranger': 6,
    'Ladino': 8,
    'Feiticeiro': 2,
    'Mago': 2,
    'Bruxo': 2,
    'Assassino': 4,
    'Algoz': 2,
    'Defensor Anão': 2,
    'Dançarino das Sombras': 6,
    'Mestre do Conhecimento': 4,
    'Teurgo Místico': 2
}

export const CLASS_HIT_DICE: Record<string, number> = {
    'Bárbaro': 12,
    'Bardo': 6,
    'Clérigo': 8,
    'Druida': 8,
    'Guerreiro': 10,
    'Monge': 8,
    'Paladino': 10,
    'Ranger': 8,
    'Ladino': 6,
    'Feiticeiro': 4,
    'Mago': 4,
    'Bruxo': 6,
    'Assassino': 6,
    'Algoz': 10,
    'Defensor Anão': 12,
    'Dançarino das Sombras': 8,
    'Mestre do Conhecimento': 4,
    'Teurgo Místico': 4
}

export interface Feat {
    name: string
    description: string
    prerequisite?: string
}

export const FEATS_DATA: Feat[] = [
    { name: 'Acrobático', description: '+2 de bônus em testes de Acrobacia e Saltar.', prerequisite: '' },
    { name: 'Ágil', description: '+2 de bônus em testes de Equilíbrio e Arte da Fuga.', prerequisite: '' },
    { name: 'Prontidão', description: '+2 de bônus em testes de Ouvir e Observar.' },
    { name: 'Afinidade com Animais', description: '+2 de bônus em testes de Adestrar Animais e Cavalgar.' },
    { name: 'Usar Armadura (Leve)', description: 'Sem penalidade de armadura em jogadas de ataque.' },
    { name: 'Usar Armadura (Média)', description: 'Sem penalidade de armadura em jogadas de ataque.' },
    { name: 'Usar Armadura (Pesada)', description: 'Sem penalidade de armadura em jogadas de ataque.' },
    { name: 'Atlético', description: '+2 de bônus em testes de Escalar e Natação.' },
    { name: 'Lutar às Cegas', description: 'Jogue novamente chance de erro por camuflagem.' },
    { name: 'Magia em Combate', description: '+4 de bônus em testes de Concentração para conjurar defensivamente.' },
    { name: 'Especialização em Combate', description: 'Troque bônus de ataque por bônus na CA.' },
    { name: 'Reflexos de Combate', description: 'Ataques de oportunidade adicionais.' },
    { name: 'Dissimulado', description: '+2 de bônus em testes de Disfarces e Falsificação.' },
    { name: 'Mãos Rápidas', description: '+2 de bônus em testes de Prestidigitação e Usar Cordas.' },
    { name: 'Diligente', description: '+2 de bônus em testes de Avaliação e Decifrar Escrita.' },
    { name: 'Esquiva', description: '+1 de bônus de esquiva na CA contra um alvo selecionado.' },
    { name: 'Tolerância', description: '+4 de bônus em testes para resistir a dano não letal.' },
    { name: 'Grande Fortitude', description: '+2 de bônus em testes de Fortitude.' },
    { name: 'Iniciativa Aprimorada', description: '+4 de bônus em testes de iniciativa.' },
    { name: 'Ataque Desarmado Aprimorado', description: 'Considerado armado mesmo desarmado.' },
    { name: 'Investigador', description: '+2 de bônus em testes de Obter Informação e Procurar.' },
    { name: 'Vontade de Ferro', description: '+2 de bônus em testes de Vontade.' },
    { name: 'Reflexos Rápidos', description: '+2 de bônus em testes de Reflexos.' },
    { name: 'Aptidão Mágica', description: '+2 de bônus em testes de Identificar Magia e Usar Instrumento Mágico.' },
    { name: 'Negociador', description: '+2 de bônus em testes de Diplomacia e Sentir Motivação.' },
    { name: 'Dedos Ágeis', description: '+2 de bônus em testes de Operar Mecanismo e Abrir Fechaduras.' },
    { name: 'Persuasivo', description: '+2 de bônus em testes de Blefar e Intimidação.' },
    { name: 'Tiro Certeiro', description: '+1 de bônus em ataque e dano até 9m (30 pés).' },
    { name: 'Ataque Poderoso', description: 'Troque bônus de ataque por bônus de dano.' },
    { name: 'Tiro Preciso', description: 'Sem penalidade por atirar em combate corpo a corpo.' },
    { name: 'Saque Rápido', description: 'Sacar arma como ação livre.' },
    { name: 'Recarga Rápida', description: 'Recarregar besta mais rapidamente.' },
    { name: 'Correr', description: 'Correr 5x o deslocamento, +4 em Saltar com corrida.' },
    { name: 'Autossuficiente', description: '+2 de bônus em testes de Cura e Sobrevivência.' },
    { name: 'Foco em Perícia', description: '+3 de bônus em testes da perícia selecionada.' },
    { name: 'Sorrateiro', description: '+2 de bônus em testes de Esconder-se e Furtividade.' },
    { name: 'Vitalidade', description: '+3 pontos de vida.' },
    { name: 'Rastrear', description: 'Usar perícia Sobrevivência para rastrear.' },
    { name: 'Combater com Duas Armas', description: 'Reduz penalidades por lutar com duas armas.' },
    { name: 'Acuidade com Arma', description: 'Usar mod. de Des em vez de For nas jogadas de ataque com armas leves.' },
    { name: 'Foco em Arma', description: '+1 de bônus nas jogadas de ataque com a arma selecionada.' },
]

```


---
## FILE: src/data/sheetConstants.ts
```typescript
export const ATTR_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const
export const ATTR_LABELS: Record<string, string> = { str: 'FOR', dex: 'DES', con: 'CON', int: 'INT', wis: 'SAB', cha: 'CAR' }

export interface FieldDef { field: string; label: string }

export const MODIFIER_TARGETS = [
    { value: 'str', label: 'Força (@str)' },
    { value: 'dex', label: 'Destreza (@dex)' },
    { value: 'con', label: 'Constituição (@con)' },
    { value: 'int', label: 'Inteligência (@int)' },
    { value: 'wis', label: 'Sabedoria (@wis)' },
    { value: 'cha', label: 'Carisma (@cha)' },
    { value: 'CA', label: 'Classe de Armadura (@CA)' },
    { value: 'hp', label: 'Pontos de Vida (@hp)' },
    { value: 'bab', label: 'Bônus Base Ataque (@BBA)' },
    { value: 'fort', label: 'Fortitude (@fort)' },
    { value: 'ref', label: 'Reflexos (@ref)' },
    { value: 'will', label: 'Vontade (@will)' },
    { value: 'iniciativa', label: 'Iniciativa (@iniciativa)' },
    { value: 'speed', label: 'Deslocamento (@speed)' },
    { value: 'toque', label: 'CA de Toque' },
    { value: 'surpreso', label: 'CA Surpreso' },
    { value: 'melee', label: 'Ataque Corpo-a-Corpo' },
    { value: 'ranged', label: 'Ataque à Distância' },
    { value: 'grapple', label: 'Agarrar' },
]

export const CA_FIELDS: FieldDef[] = [
    { field: 'ca_armor', label: 'Armadura' },
    { field: 'ca_shield', label: 'Escudo' },
    { field: 'ca_natural', label: 'Natural' },
    { field: 'ca_deflect', label: 'Deflexão' },
]

export const SAVE_FIELDS: FieldDef[] = [
    { field: 'save_fort', label: 'Fortitude base' },
    { field: 'save_ref', label: 'Reflexo base' },
    { field: 'save_will', label: 'Vontade base' },
]

export const SAVE_BONUS_FIELDS: FieldDef[] = [
    { field: 'fort', label: 'Bônus Fort.' },
    { field: 'ref', label: 'Bônus Ref.' },
    { field: 'will', label: 'Bônus Von.' },
]

export const ELEM_FIELDS: FieldDef[] = [
    { field: 'fire', label: 'Fogo' },
    { field: 'cold', label: 'Frio' },
    { field: 'acid', label: 'Ácido' },
    { field: 'electricity', label: 'Eletric.' },
    { field: 'sonic', label: 'Sônico' },
    { field: 'force', label: 'Força' },
]

export const races = ['Personalizada', 'Humano', 'Anão', 'Elfo', 'Gnomo', 'Meio-Elfo', 'Meio-Orc', 'Halfling']
export const classes = ['Personalizada', 'Bárbaro', 'Bardo', 'Clérigo', 'Druida', 'Guerreiro', 'Monge', 'Paladino', 'Ranger', 'Ladino', 'Feiticeiro', 'Mago', 'Bruxo', 'Assassino', 'Algoz', 'Defensor Anão', 'Dançarino das Sombras', 'Mestre do Conhecimento', 'Teurgo Místico']
export const alignments = ['Leal e Bom', 'Neutro e Bom', 'Caótico e Bom', 'Leal e Neutro', 'Neutro', 'Caótico e Neutro', 'Leal e Mau', 'Neutro e Mau', 'Caótico e Mau']

```


---
## FILE: src/lib/sheetDefaults.ts
```typescript
import type { BonusData, SheetData } from '@/types/sheet'

export function defaultBonuses(): BonusData {
    return {
        attributes: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
        hp: 0,
        ca: 0,
        bab: 0,
        initiative: 0,
        speed: 0,
        saves: { fort: 0, ref: 0, will: 0 },
        resistances: { fire: 0, cold: 0, acid: 0, electricity: 0, sonic: 0, force: 0 },
        notes: '',
    }
}

export function defaultSheetData(): Partial<SheetData> {
    return {
        bonuses: defaultBonuses(),
        feats: [],
        spells: [],
        equipment: [],
        shortcuts: [],
        buffs: [],
        resources: [],
        skills: {},
        attributes: {
            str: { base: 10, temp: 0 },
            dex: { base: 10, temp: 0 },
            con: { base: 10, temp: 0 },
            int: { base: 10, temp: 0 },
            wis: { base: 10, temp: 0 },
            cha: { base: 10, temp: 0 },
        },
        hp_current: 10,
        hp_max: 10,
        level: 1,
        xp: 0,
    }
}

```


---
## FILE: src/lib/supabase.ts
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

```


---
## FILE: src/lib/useCampaignRolls.ts
```typescript
import { ref, type Ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { DiceRoller } from '@dice-roller/rpg-dice-roller'

export function useCampaignRolls(campaignId: string, memberName: Ref<string>, recipientId: Ref<string>) {
    const authStore = useAuthStore()
    const roller = new DiceRoller()
    const rolling = ref(false)

    function evaluateFormula(formula: string): { label: string; result: number; breakdown: string } {
        try {
            const rollResult = roller.roll(formula)
            const roll = Array.isArray(rollResult) ? rollResult[0] : rollResult
            if (!roll) throw new Error('Falha na rolagem')
            return {
                label: formula,
                result: roll.total,
                breakdown: roll.output.split(': ')[1] || roll.output
            }
        } catch (e) {
            console.error('Roll error:', e)
            return { label: formula, result: 0, breakdown: 'Erro na fórmula' }
        }
    }

    function modStr(n: number): string {
        return n >= 0 ? `+${n}` : `${n}`
    }

    async function sendRoll(label: string, displayFormula: string, evalFormula?: string) {
        if (rolling.value) return
        rolling.value = true

        const formulaToEvaluate = evalFormula || displayFormula
        const { result, breakdown } = evaluateFormula(formulaToEvaluate)

        const isWhisper = recipientId.value !== 'all'

        const payload: any = {
            label,
            formula: displayFormula,
            result,
            breakdown
        }

        if (isWhisper) {
            payload.is_roll = true
            payload.target_id = recipientId.value
        }

        const content = JSON.stringify(payload)

        const { error } = await supabase.from('messages').insert({
            campaign_id: campaignId,
            user_id: authStore.user?.id ?? null,
            sender_name: memberName.value,
            content,
            type: isWhisper ? 'whisper' : 'roll',
        })

        if (error) console.error('Error sending roll:', error)

        rolling.value = false
    }

    async function sendDualRoll(label: string, atkDisplay: string, dmgDisplay: string, atkEval?: string, dmgEval?: string) {
        if (rolling.value) return
        rolling.value = true

        const atkFormula = atkEval || atkDisplay
        const dmgFormula = dmgEval || dmgDisplay

        const atkResult = evaluateFormula(atkFormula)
        const dmgResult = evaluateFormula(dmgFormula)

        const isWhisper = recipientId.value !== 'all'

        const payload: any = {
            label,
            is_dual_roll: true,
            is_roll: true, // for whisper chat filter detection
            attack: {
                formula: atkDisplay,
                result: atkResult.result,
                breakdown: atkResult.breakdown
            },
            damage: {
                formula: dmgDisplay,
                result: dmgResult.result,
                breakdown: dmgResult.breakdown
            }
        }

        if (isWhisper) {
            payload.target_id = recipientId.value
        }

        const content = JSON.stringify(payload)

        const { error } = await supabase.from('messages').insert({
            campaign_id: campaignId,
            user_id: authStore.user?.id ?? null,
            sender_name: memberName.value,
            content,
            type: isWhisper ? 'whisper' : 'roll',
        })

        if (error) console.error('Error sending dual roll:', error)

        rolling.value = false
    }

    return {
        rolling,
        sendRoll,
        sendDualRoll,
        evaluateFormula,
        modStr
    }
}

```


---
## FILE: src/lib/utils.ts
```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

```


---
## FILE: src/main.ts
```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './style.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')

```


---
## FILE: src/router/index.ts
```typescript
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            redirect: '/login'
        },
        {
            path: '/login',
            name: 'login',
            component: () => import('../views/LoginView.vue')
        },
        {
            path: '/register',
            redirect: '/login'
        },
        {
            path: '/dashboard',
            name: 'dashboard',
            component: () => import('../views/DashboardView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/create',
            name: 'create',
            component: () => import('../views/CreateSheetView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/sheet/:id',
            name: 'sheet',
            component: () => import('../views/SheetView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/campaign/:id',
            name: 'campaign',
            component: () => import('../views/CampaignView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/design',
            name: 'design',
            component: () => import('../views/DesignSystemView.vue')
        }
    ]
})

router.beforeEach(async (to, _from) => {
    const authStore = useAuthStore()

    // Ensure auth state is initialized
    if (authStore.loading) {
        await authStore.initialize()
    }

    const isAuthenticated = !!authStore.user

    if (to.meta.requiresAuth && !isAuthenticated) {
        return '/login'
    } else if (to.name === 'login' && isAuthenticated) {
        return '/dashboard'
    }
})

export default router

```


---
## FILE: src/stores/auth.ts
```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'
import { useRouter } from 'vue-router'

export const useAuthStore = defineStore('auth', () => {
    const user = ref<User | null>(null)
    const session = ref<Session | null>(null)
    const loading = ref(true)
    const router = useRouter()

    async function initialize() {
        loading.value = true
        const { data } = await supabase.auth.getSession()
        session.value = data.session
        user.value = data.session?.user ?? null

        supabase.auth.onAuthStateChange((_event, _session) => {
            session.value = _session
            user.value = _session?.user ?? null
            if (!_session) {
                // Handle logout or session expiry if needed
            }
        })
        loading.value = false
    }

    async function signOut() {
        await supabase.auth.signOut()
        user.value = null
        session.value = null
        router.push('/')
    }

    return {
        user,
        session,
        loading,
        initialize,
        signOut
    }
})

```


---
## FILE: src/stores/wizardStore.ts
```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Attribute {
    base: number
    temp: number
}

export interface CharacterAttributes {
    str: Attribute
    dex: Attribute
    con: Attribute
    int: Attribute
    wis: Attribute
    cha: Attribute
}

export const useWizardStore = defineStore('wizard', () => {
    const currentStep = ref(1)
    const totalSteps = 5

    const character = ref({
        sheetType: 'Personagem',
        name: '',
        race: '',
        class: '',
        customHitDie: 8,
        customSkillPoints: 2,
        level: 1,
        avatar_url: '',
        attributes: {
            str: { base: 10, temp: 0 },
            dex: { base: 10, temp: 0 },
            con: { base: 10, temp: 0 },
            int: { base: 10, temp: 0 },
            wis: { base: 10, temp: 0 },
            cha: { base: 10, temp: 0 },
        } as CharacterAttributes,
        skills: {} as Record<string, number>,
        skillPoints: 0,
        feats: [] as string[],
        spells: [] as string[],
        equipment: [] as string[],
        bio: '',
        alignment: '',
        deity: '',
        size: 'Médio',
        hp_max: 0,
        bab: 0,
        speed: 9,
        save_fort: 0,
        save_ref: 0,
        save_will: 0,
        ca_armor: 0,
        ca_shield: 0,
        ca_natural: 0,
        ca_deflect: 0,
        initiative_misc: 0,
        age: '',
        gender: '',
        height: '',
        weight: '',
        eyes: '',
        hair: '',
        skin: '',
    })

    function nextStep() {
        if (currentStep.value < totalSteps) {
            currentStep.value++
        }
    }

    function prevStep() {
        if (currentStep.value > 1) {
            currentStep.value--
        }
    }

    function setStep(step: number) {
        if (step >= 1 && step <= totalSteps) {
            currentStep.value = step
        }
    }

    return {
        currentStep,
        totalSteps,
        character,
        nextStep,
        prevStep,
        setStep
    }
})

```


---
## FILE: src/style.css
```css
@import "tailwindcss";

/* =====================================================
   TAILWIND V4 THEME — Lumina Dark (Zinc + Gold)
   In v4, colors are defined here via @theme, NOT in
   tailwind.config.js. The JS config is ignored for colors.
   ===================================================== */

@theme {
  /* Fonts */
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-serif: "Merriweather", ui-serif, Georgia, serif;
  --font-mono: ui-monospace, "Cascadia Code", "Source Code Pro", monospace;

  /* Border Radius */
  --radius: 0.5rem;
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  /* Lumina Color Palette — Raw Values */
  --color-zinc-950: #09090b;
  --color-zinc-900: #18181b;
  --color-zinc-800: #27272a;
  --color-zinc-700: #3f3f46;
  --color-zinc-600: #52525b;
  --color-zinc-500: #71717a;
  --color-zinc-400: #a1a1aa;
  --color-zinc-300: #d4d4d8;
  --color-zinc-200: #e4e4e7;
  --color-zinc-100: #f4f4f5;
  --color-gold: #dfd4bd;
  --color-gold-dark: #c9be9e;

  /* Semantic Color Tokens mapped to Lumina palette */
  --color-background: var(--color-zinc-950);
  --color-foreground: var(--color-zinc-200);

  --color-card: var(--color-zinc-900);
  --color-card-foreground: var(--color-zinc-200);

  --color-popover: var(--color-zinc-900);
  --color-popover-foreground: var(--color-zinc-200);

  --color-primary: var(--color-gold);
  --color-primary-foreground: var(--color-zinc-950);

  --color-secondary: var(--color-zinc-800);
  --color-secondary-foreground: var(--color-zinc-200);

  --color-muted: var(--color-zinc-800);
  --color-muted-foreground: var(--color-zinc-500);

  --color-accent: var(--color-gold);
  --color-accent-foreground: var(--color-zinc-950);

  --color-destructive: #7f1d1d;
  --color-destructive-foreground: var(--color-zinc-100);

  --color-border: var(--color-zinc-800);
  --color-input: var(--color-zinc-800);
  --color-ring: var(--color-gold);
}

/* Base styles */
@layer base {
  * {
    border-color: var(--color-border);
    box-sizing: border-box;
  }

  body {
    background-color: var(--color-background);
    color: var(--color-foreground);
    font-family: var(--font-sans);
    font-feature-settings: "rlig" 1, "calt" 1;
    -webkit-font-smoothing: antialiased;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    font-family: var(--font-serif);
  }

  /* Custom Scrollbar Styles */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background: var(--color-zinc-800);
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: var(--color-zinc-700);
  }
}
```


---
## FILE: src/types/sheet.ts
```typescript
export interface Modifier {
    target: string
    value: number
}

export interface Attribute {
    base: number
    temp: number
}

export interface Attributes {
    str: Attribute
    dex: Attribute
    con: Attribute
    int: Attribute
    wis: Attribute
    cha: Attribute
    [key: string]: Attribute
}

export interface SkillItem {
    name: string
    ranks: number
    ability: string
}

export interface BonusData {
    attributes: Record<string, number>
    hp: number
    ca: number
    bab: number
    initiative: number
    speed: number
    saves: {
        fort: number
        ref: number
        will: number
    }
    resistances: {
        fire: number
        cold: number
        acid: number
        electricity: number
        sonic: number
        force: number
    }
    notes: string
}

export interface Feat {
    title: string
    description: string
    isAttack?: boolean
    modifiers?: Modifier[]
}

export interface Spell {
    title: string
    description: string
    rollFormula?: string
    school?: string
    spellLevel?: number
    castingTime?: string
    range?: string
    target?: string
    duration?: string
    savingThrow?: string
    spellResist?: string
    modifiers?: Modifier[]
}

export interface Equipment {
    title: string
    description: string
    equipped?: boolean
    weight?: number
    modifiers?: Modifier[]
}

export interface Shortcut {
    label?: string
    title?: string
    formula?: string
    rollFormula?: string
    attackFormula?: string
    attackBonus?: number | string
    isAttack?: boolean
    icon?: string
    modifiers?: Modifier[]
}

export interface Buff {
    title: string
    description: string
    active: boolean
    modifiers?: Modifier[]
}

export interface Resource {
    label?: string
    name?: string
    current: number
    max: number
}

export interface SheetData {
    hp_current: number
    hp_max: number
    xp: number
    level: number
    race: string
    class: string
    size: string
    sheetType: string
    attributes: Attributes
    bonuses: BonusData
    skills: Record<string, number>
    feats: Feat[]
    spells: Spell[]
    equipment: Equipment[]
    shortcuts: Shortcut[]
    buffs: Buff[]
    resources: Resource[]
    layout?: string[]
    resumeLayout?: string[]
    hiddenBlocks?: string[]
    spellSlotsMax?: Record<number, number>
    spellSlotsUsed?: Record<number, number>
    ca_armor?: number
    ca_shield?: number
    ca_natural?: number
    ca_deflect?: number
    save_fort?: number
    save_ref?: number
    save_will?: number
    initiative_misc?: number
    speed?: number
    customSkillPoints?: number
    customHitDie?: number
    skillPoints?: number
    [key: string]: any
}

export interface Sheet {
    id: string
    name: string
    class: string
    level: number
    race: string
    data: SheetData
    user_id?: string
    created_at?: string
}

```


---
## FILE: src/views/CampaignView.vue
```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { Copy, BookOpen, Scroll, FileText, LayoutTemplate } from 'lucide-vue-next'
import ChatSidebar from '@/components/campaign/ChatSidebar.vue'
import QuickNpcModal from '@/components/campaign/QuickNpcModal.vue'
import SheetView from '@/views/SheetView.vue'
import { useCampaignRolls } from '@/lib/useCampaignRolls'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import SheetSelectorModal from '@/components/campaign/SheetSelectorModal.vue'
import CampaignSettingsDropdown from '@/components/campaign/CampaignSettingsDropdown.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const campaignId = route.params.id as string
const campaign = ref<any>(null)
const members = ref<any[]>([])
const loading = ref(true)
const isDM = ref(false)
const showNpcModal = ref(false)
const showSheetSelector = ref(false)

// UI state
const showChat = ref(true)
const showNotes = ref(false) // For mobile view
const notepadContent = ref('')

// Sheet selector state
const mySheets = ref<any[]>([])
const selectedSheetId = ref<string>('none')
const myMemberId = ref<string>('')
const savingSheet = ref(false)
const sheetSaved = ref(false)

// Remove setting selectedSheetId from onMounted to prevent race conditions
onMounted(() => {
    const savedNote = localStorage.getItem(`notepad_${campaignId}_${authStore.user?.id}`)
    if (savedNote) {
        notepadContent.value = savedNote
    }
})

function saveNotepad() {
    localStorage.setItem(`notepad_${campaignId}_${authStore.user?.id}`, notepadContent.value)
}

const myCurrentSheetId = computed(() => {
    return selectedSheetId.value === 'none' ? null : selectedSheetId.value
})

const myMemberName = computed(() => {
    if (isDM.value) return 'Mestre'
    const activeSheet = mySheets.value.find(s => s.id === selectedSheetId.value)
    if (activeSheet) return activeSheet.name
    return authStore.user?.user_metadata?.name || 'Jogador'
})

const recipientId = ref('all')

const { sendRoll, sendDualRoll } = useCampaignRolls(campaignId, myMemberName, recipientId)

async function fetchCampaign() {
    loading.value = true

    const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single()

    if (campaignError) {
        console.error('Error fetching campaign:', campaignError)
        router.push('/dashboard')
        return
    }
    campaign.value = campaignData
    isDM.value = campaignData.dm_id === authStore.user?.id

    const { data: memberData } = await supabase
        .from('campaign_members')
        .select('*, sheets (id, name, class, level, data)')
        .eq('campaign_id', campaignId)

    if (memberData) {
        members.value = memberData
        const me = memberData.find((m: any) => m.user_id === authStore.user?.id)
        if (me) {
            myMemberId.value = me.id
            
            // Priority: LocalStorage > Database > 'none'
            const lastSheetId = localStorage.getItem(`last_sheet_${campaignId}_${authStore.user?.id}`)
            const dbSheetId = me.sheet_id
            
            if (lastSheetId && lastSheetId !== 'none') {
                selectedSheetId.value = lastSheetId
            } else if (dbSheetId) {
                selectedSheetId.value = dbSheetId
                // Keep localstorage synced
                localStorage.setItem(`last_sheet_${campaignId}_${authStore.user?.id}`, dbSheetId)
            } else {
                selectedSheetId.value = 'none'
            }
        }
    }

    loading.value = false
}

async function fetchMySheets() {
    // Busca as fichas atreladas rigorosamente a esta campanha
    const { data } = await supabase
        .from('sheets')
        .select('id, name, class, level, data, campaign_id')
        .eq('user_id', authStore.user?.id)
        .eq('campaign_id', campaignId)
        
    if (data) {
        mySheets.value = data
    }
}

function handleNpcSaved(sheetId: string) {
    showNpcModal.value = false
    fetchMySheets().then(() => {
        handleSheetSelected(sheetId)
    })
}

async function handleSheetSelected(sheetId: string) {
    if (!myMemberId.value) return
    savingSheet.value = true
    sheetSaved.value = false
    selectedSheetId.value = sheetId
    showSheetSelector.value = false // close modal

    const sheetIdToSave = sheetId === 'none' ? null : sheetId
    
    // Check if the sheet needs to be linked to this campaign first
    if (sheetIdToSave) {
        const sheet = mySheets.value.find(s => s.id === sheetIdToSave)
        if (sheet && sheet.campaign_id !== campaignId) {
             await supabase
                .from('sheets')
                .update({ campaign_id: campaignId })
                .eq('id', sheetIdToSave)
             sheet.campaign_id = campaignId // update locally
        }
    }

    // Set as active character in campaign
    const { error } = await supabase
        .from('campaign_members')
        .update({ sheet_id: sheetIdToSave })
        .eq('id', myMemberId.value)

    if (!error) {
        // Update local state
        const me = members.value.find(m => m.user_id === authStore.user?.id)
        if (me) me.sheet_id = sheetIdToSave

        localStorage.setItem(`last_sheet_${campaignId}_${authStore.user?.id}`, sheetIdToSave || 'none')

        sheetSaved.value = true
        setTimeout(() => { sheetSaved.value = false }, 2000)
    }
    savingSheet.value = false
}

function copyJoinCode() {
    if (campaign.value?.join_code) {
        navigator.clipboard.writeText(campaign.value.join_code)
    }
}

function leaveCampaign() {
    if (confirm('Sair da campanha?')) {
        router.push('/dashboard')
    }
}

onMounted(async () => {
    await fetchCampaign()
    await fetchMySheets()

    // Validate if the selected sheet still exists 
    // (User might have deleted it from the database manually)
    if (selectedSheetId.value !== 'none') {
        const stillExists = mySheets.value.some(s => s.id === selectedSheetId.value)
        if (!stillExists) {
            selectedSheetId.value = 'none'
            localStorage.setItem(`last_sheet_${campaignId}_${authStore.user?.id}`, 'none')
            // Optionally update the DB as well if we are the user
            if (myMemberId.value) {
                await supabase.from('campaign_members').update({ sheet_id: null }).eq('id', myMemberId.value)
            }
        }
    }
})
</script>

<template>
    <div class="flex h-screen bg-background text-foreground overflow-hidden">
        <!-- Main Content Area -->
        <main class="flex-1 flex flex-col min-w-0" :class="{ 'hidden lg:flex': showChat && !myCurrentSheetId }">

            <!-- Top Bar -->
            <header class="h-16 border-b border-border flex items-center justify-between px-4 sm:px-6 bg-zinc-950/50">
                <div class="flex items-center gap-2 sm:gap-3">
                    <Button variant="ghost" size="icon" @click="router.push('/dashboard')">
                        <Scroll class="w-5 h-5 text-muted-foreground" />
                    </Button>
                    <div v-if="campaign" class="flex-1 min-w-0">
                        <h1 class="font-serif font-bold text-lg sm:text-xl truncate max-w-[120px] sm:max-w-xs">{{ campaign.name }}</h1>
                    </div>
                    <div v-else class="h-6 w-24 sm:w-32 bg-zinc-800 animate-pulse rounded"></div>
                </div>

                <!-- Navigation Controls -->
                <div class="flex items-center gap-2 sm:gap-3">
                  
                    <!-- Switch Sheet Button -->
                    <div class="flex items-center gap-2">
                         <div v-if="sheetSaved" class="text-[10px] text-green-500 font-bold uppercase hidden sm:block">
                            Ativa
                         </div>
                         <Button @click="showSheetSelector = true" variant="outline" size="sm" class="h-8 group border-zinc-700 hover:bg-zinc-800 bg-zinc-900">
                             <LayoutTemplate class="w-4 h-4 mr-2 text-muted-foreground group-hover:text-primary transition-colors" />
                             <span class="text-xs">{{ selectedSheetId === 'none' ? 'Espectador' : 'Trocar Ficha' }}</span>
                         </Button>
                    </div>

                    <Button v-if="isDM" @click="showNpcModal = true" variant="outline" size="sm"
                        class="h-8 text-xs border-zinc-700 hover:bg-zinc-800 hidden md:inline-flex">
                        Criar NPC
                    </Button>

                    <div v-if="campaign && isDM"
                        class="hidden md:flex items-center gap-2 bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-800">
                        <span class="text-xs text-muted-foreground uppercase font-bold">Código:</span>
                        <code class="text-sm font-mono text-primary font-bold">{{ campaign.join_code }}</code>
                        <button @click="copyJoinCode" class="text-muted-foreground hover:text-foreground">
                            <Copy class="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <!-- Settings Dropdown -->
                    <CampaignSettingsDropdown 
                         v-model:show-chat="showChat"
                         v-model:show-notes="showNotes"
                         @leave="leaveCampaign"
                    />
                </div>
            </header>

            <!-- Workspace Setup: Notepad (Left) + Sheet (Center) -->
            <div class="flex-1 flex overflow-hidden relative">
                <div v-if="loading" class="absolute inset-0 z-10 bg-background/50 flex justify-center py-20 backdrop-blur-sm">
                    <div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>

                <!-- Notepad (Left Panel) -->
                <div v-show="showNotes" class="w-full lg:w-80 border-r border-border bg-zinc-950/30 flex flex-col absolute inset-0 z-20 lg:relative lg:z-0 lg:flex"
                     :class="showNotes ? 'flex' : 'hidden lg:flex'">
                    <div class="h-10 border-b border-border flex items-center justify-between px-4 bg-zinc-950/50 shrink-0">
                        <h2 class="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            <BookOpen class="w-3.5 h-3.5" /> Anotações Pessoais
                        </h2>
                        <Button variant="ghost" size="icon" class="h-6 w-6 lg:hidden" @click="showNotes = false">
                             <Copy class="w-3 h-3 rotate-45" /> <!-- X Icon replacement mapping trick -->
                        </Button>
                    </div>
                    <div class="flex-1 p-3">
                        <Textarea v-model="notepadContent" @input="saveNotepad"
                            placeholder="Anotações da campanha... Suas notas são salvas apenas para você."
                            class="w-full h-full resize-none border-none bg-transparent focus-visible:ring-0 p-1 text-sm text-zinc-300 placeholder:text-zinc-600 font-mono" />
                    </div>
                </div>

                <!-- Character Sheet (Center Panel) -->
                <div class="flex-1 overflow-y-auto bg-background px-0 sm:px-4 lg:px-8 py-0 sm:py-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent hover:scrollbar-thumb-zinc-700" 
                     :class="{ 'hidden lg:block': showNotes || (showChat && !myCurrentSheetId) }">
                    <div v-if="myCurrentSheetId" class="h-full">
                        <SheetView :sheet-id="myCurrentSheetId" is-embedded :on-roll="sendRoll"
                            :on-dual-roll="sendDualRoll" />
                    </div>
                    <div v-else class="flex flex-col items-center justify-center h-full text-center gap-4 p-8">
                        <FileText class="w-12 h-12 text-zinc-800" />
                        <h2 class="text-xl font-bold">Espectador</h2>
                        <p class="text-muted-foreground max-w-sm">Você está acompanhando a campanha sem uma ficha ativa. Use o botão no topo para selecionar ou criar uma ficha para rolar dados.</p>
                        <Button @click="showSheetSelector = true" class="mt-4">
                             Selecionar Ficha
                        </Button>
                    </div>
                </div>
            </div>
        </main>

        <!-- Chat Sidebar -->
        <ChatSidebar v-show="showChat" :campaign-id="campaignId" :member-name="myMemberName" :members="members" :dm-id="campaign?.dm_id"
            v-model:recipientId="recipientId" class="w-full lg:w-96 flex-shrink-0" :class="{ 'hidden lg:flex': !showChat }" />

        <!-- Modals -->
        <QuickNpcModal v-if="showNpcModal" @close="showNpcModal = false" @saved="handleNpcSaved" />
        <SheetSelectorModal v-model="showSheetSelector" :sheets="mySheets" :active-sheet-id="selectedSheetId" @select-sheet="handleSheetSelected" />
    </div>
</template>

```


---
## FILE: src/views/CreateSheetView.vue
```vue
<script setup lang="ts">
import { useWizardStore } from '@/stores/wizardStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import BasicInfoStep from '@/components/wizard/steps/BasicInfoStep.vue'
import AttributesStep from '@/components/wizard/steps/AttributesStep.vue'
import SkillsStep from '@/components/wizard/steps/SkillsStep.vue'
import CombatStatsStep from '@/components/wizard/steps/CombatStatsStep.vue'
import TypeStep from '@/components/wizard/steps/TypeStep.vue'
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-vue-next'

const store = useWizardStore()
const router = useRouter()
const route = useRoute()

const allSteps = [
  { id: 'type', label: 'Tipo', short: 'Tipo' },
  { id: 'info', label: 'Informações', short: 'Info' },
  { id: 'attrs', label: 'Atributos', short: 'Attrs' },
  { id: 'skills', label: 'Perícias', short: 'Perícias' },
  { id: 'combat', label: 'Combate', short: 'Combate' },
]

const visibleSteps = computed(() => allSteps)

// Auto-clamp step if type changes and shrinks available steps
watch(() => visibleSteps.value.length, (newLen) => {
  if (store.currentStep > newLen) {
    store.setStep(newLen)
  }
})

const currentStepLabel = computed(() => visibleSteps.value[store.currentStep - 1]?.label)
const isLast = computed(() => store.currentStep === visibleSteps.value.length)

function handleNext() {
  if (store.currentStep < visibleSteps.value.length) {
    store.setStep(store.currentStep + 1)
  }
}

function handlePrev() {
  if (store.currentStep > 1) {
    store.setStep(store.currentStep - 1)
  }
}

function handleCancel() {
  if (confirm('Tem certeza que deseja cancelar? O progresso será perdido.')) {
    const campaignId = route.query.campaignId
    if (campaignId) {
      router.push(`/campaign/${campaignId}`)
    } else {
      router.push('/dashboard')
    }
  }
}

async function handleFinish() {
  const { data: { user } } = await import('@/lib/supabase').then(m => m.supabase.auth.getUser())
  if (!user) {
    alert('Você precisa estar logado.')
    return
  }

  const campaignId = route.query.campaignId as string | undefined

  const { error } = await import('@/lib/supabase').then(m => m.supabase
    .from('sheets')
    .insert({
      user_id: user.id,
      campaign_id: campaignId || null,
      name: store.character.name,
      class: store.character.class,
      level: store.character.level,
      race: store.character.race,
      data: store.character
    }))

  if (error) {
    alert('Falha ao salvar: ' + error.message)
    return
  }

  if (campaignId) {
    router.push(`/campaign/${campaignId}`)
  } else {
    router.push('/dashboard')
  }
}
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <div class="max-w-4xl mx-auto px-4 py-8 space-y-8">

      <!-- Top header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-serif font-bold text-primary">Criar Personagem</h1>
          <p class="text-muted-foreground text-sm mt-1">
            Passo {{ store.currentStep }} de {{ visibleSteps.length }}: <span class="text-foreground font-medium">{{
              currentStepLabel }}</span>
          </p>
        </div>
        <Button variant="ghost" @click="handleCancel" class="text-muted-foreground hover:text-destructive">
          Cancelar
        </Button>
      </div>

      <!-- Stepper -->
      <div class="relative flex items-center justify-between">
        <!-- Progress line -->
        <div class="absolute inset-x-0 top-4 h-px bg-border -z-10"></div>
        <div class="absolute left-0 top-4 h-px bg-primary -z-10 transition-all duration-500"
          :style="{ width: `${((store.currentStep - 1) / (visibleSteps.length - 1)) * 100}%` }"></div>

        <button v-for="(step, i) in visibleSteps" :key="i" @click="store.setStep(i + 1)"
          class="flex flex-col items-center gap-2 cursor-pointer group">
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 bg-background transition-all duration-300"
            :class="[
              store.currentStep > i + 1
                ? 'border-primary bg-primary text-primary-foreground'
                : store.currentStep === i + 1
                  ? 'border-primary text-primary ring-4 ring-primary/20'
                  : 'border-border text-muted-foreground group-hover:border-primary/50'
            ]">
            <span v-if="store.currentStep > i + 1">✓</span>
            <span v-else>{{ i + 1 }}</span>
          </div>
          <span class="text-xs font-medium hidden sm:block transition-colors"
            :class="store.currentStep === i + 1 ? 'text-primary' : 'text-muted-foreground'">{{ step.short }}</span>
        </button>
      </div>

      <!-- Wizard Card -->
      <Card class="border-border shadow-lg">
        <CardHeader class="border-b border-border bg-card">
          <CardTitle class="font-serif text-primary">{{ currentStepLabel }}</CardTitle>
        </CardHeader>

        <CardContent class="p-6 min-h-[460px]">
          <Transition name="slide" mode="out-in">
            <div :key="visibleSteps[store.currentStep - 1]?.id || store.currentStep">
              <TypeStep v-if="visibleSteps[store.currentStep - 1]?.id === 'type'" />
              <BasicInfoStep v-else-if="visibleSteps[store.currentStep - 1]?.id === 'info'" />
              <AttributesStep v-else-if="visibleSteps[store.currentStep - 1]?.id === 'attrs'" />
              <SkillsStep v-else-if="visibleSteps[store.currentStep - 1]?.id === 'skills'" />
              <CombatStatsStep v-else-if="visibleSteps[store.currentStep - 1]?.id === 'combat'" />
            </div>
          </Transition>
        </CardContent>

        <CardFooter class="border-t border-border bg-card flex justify-between p-6">
          <Button variant="outline" @click="handlePrev" :disabled="store.currentStep === 1" class="gap-2">
            <ChevronLeft class="w-4 h-4" /> Anterior
          </Button>
          <div class="flex gap-2">
            <Button v-if="!isLast" @click="handleNext" class="gap-2">
              Próximo
              <ChevronRight class="w-4 h-4" />
            </Button>
            <Button v-else @click="handleFinish" class="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <CheckCircle class="w-4 h-4" /> Finalizar Ficha
            </Button>
          </div>
        </CardFooter>
      </Card>

    </div>
  </div>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(12px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(-12px);
}
</style>

```


---
## FILE: src/views/DashboardView.vue
```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { Plus, LogOut, Scroll, Sword, Users, Key } from 'lucide-vue-next'
import CreateCampaignModal from '@/components/campaign/CreateCampaignModal.vue'
import JoinCampaignModal from '@/components/campaign/JoinCampaignModal.vue'

const authStore = useAuthStore()
const router = useRouter()
const campaigns = ref<any[]>([])
const loadingCampaigns = ref(true)
const showCreateModal = ref(false)
const showJoinModal = ref(false)

async function fetchCampaigns() {
  loadingCampaigns.value = true

  if (!authStore.user) {
    campaigns.value = []
    loadingCampaigns.value = false
    return
  }

  // Fetch campaigns via the junction table
  const { data, error } = await supabase
    .from('campaign_members')
    .select('campaigns(*)')
    .eq('user_id', authStore.user.id)

  if (!error && data) {
    // data is an array of objects like { campaigns: { id: '...', name: '...' } }
    campaigns.value = data
      .map((item: any) => item.campaigns)
      .filter(Boolean)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  } else {
    campaigns.value = []
  }

  loadingCampaigns.value = false
}

onMounted(() => {
  if (authStore.user) {
    fetchCampaigns()
  }
})
</script>

<template>
  <div class="min-h-screen bg-background text-foreground flex flex-col">

    <!-- Sticky top bar -->
    <header
      class="border-b border-border px-8 py-4 flex items-center justify-between bg-background/80 backdrop-blur-sm sticky top-0 z-10 shrink-0">
      <div class="flex items-center gap-3">
        <Scroll class="w-5 h-5 text-primary" />
        <span class="font-serif font-bold text-primary tracking-wide">Grimório</span>
      </div>
      <div class="flex items-center gap-3">
        <Button variant="ghost" size="sm" @click="authStore.signOut"
          class="text-muted-foreground hover:text-destructive gap-2">
          <LogOut class="w-4 h-4" /> Sair
        </Button>
      </div>
    </header>

    <main class="flex-1 w-full max-w-6xl mx-auto px-6 py-10 space-y-12 flex flex-col">

      <!-- ── CAMPAIGNS SECTION ── -->
      <section class="flex-1">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
              <Sword class="w-6 h-6 text-primary" /> Campanhas
            </h1>
            <p class="text-sm text-muted-foreground mt-0.5" v-if="campaigns.length">
              Você está em {{ campaigns.length }} {{ campaigns.length === 1 ? 'aventura' : 'aventuras' }}
            </p>
          </div>
          <div class="flex gap-2">
            <Button variant="outline" size="sm" @click="showJoinModal = true" class="gap-2">
              <Key class="w-4 h-4" /> Entrar com Código
            </Button>
            <Button size="sm" @click="showCreateModal = true" class="gap-2">
              <Plus class="w-4 h-4" /> Nova Campanha
            </Button>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="loadingCampaigns" class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div v-for="i in 2" :key="i" class="h-40 rounded-xl bg-card animate-pulse border border-border" />
        </div>

        <!-- Empty -->
        <div v-else-if="campaigns.length === 0"
          class="flex flex-col items-center justify-center py-12 border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
          <Sword class="w-10 h-10 text-zinc-700 mb-3" />
          <p class="text-muted-foreground text-sm font-medium">Nenhuma campanha ativa</p>
          <p class="text-xs text-zinc-500 mt-1">Crie uma nova ou entre com um código</p>
        </div>

        <!-- List -->
        <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <div v-for="camp in campaigns" :key="camp.id"
            class="group relative bg-zinc-900 border border-zinc-800 hover:border-primary/50 rounded-xl p-5 cursor-pointer transition-all hover:bg-zinc-900/80 hover:-translate-y-1 hover:shadow-lg"
            @click="router.push(`/campaign/${camp.id}`)">
            <div class="flex flex-col h-full min-h-[120px]">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="font-bold text-lg font-serif group-hover:text-primary transition-colors leading-tight">{{ camp.name }}</h3>
                </div>
                <div class="flex-1"></div>
                
                <div class="flex items-center justify-between text-xs mt-4">
                    <span v-if="camp.dm_id === authStore.user?.id"
                            class="text-[10px] font-bold bg-primary/20 text-primary px-2 py-0.5 rounded border border-primary/30 uppercase">Mestre</span>
                    <span v-else class="text-[10px] font-bold bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded border border-zinc-700 uppercase">Aventureiro</span>
                    
                    <div class="text-muted-foreground flex items-center gap-1">
                            <Users class="w-3.5 h-3.5" /> Entrar
                    </div>
                </div>
            </div>
          </div>
        </div>
      </section>

    </main>

    <CreateCampaignModal v-if="showCreateModal" @close="showCreateModal = false; fetchCampaigns()" />
    <JoinCampaignModal v-if="showJoinModal" @close="showJoinModal = false; fetchCampaigns()" />
  </div>
</template>

```


---
## FILE: src/views/DesignSystemView.vue
```vue
<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

const colorTokens = [
    { label: 'Background', tailwind: 'bg-background', hex: '#09090B' },
    { label: 'Card', tailwind: 'bg-card', hex: '#18181B' },
    { label: 'Popover', tailwind: 'bg-popover', hex: '#18181B' },
    { label: 'Secondary', tailwind: 'bg-secondary', hex: '#27272A' },
    { label: 'Muted', tailwind: 'bg-muted', hex: '#27272A' },
    { label: 'Border', tailwind: 'bg-border', hex: '#27272A' },
    { label: 'Primary', tailwind: 'bg-primary', hex: '#DFD4BD' },
    { label: 'Foreground', tailwind: 'bg-foreground', hex: '#E4E4E7' },
]
</script>

<template>
    <div class="min-h-screen bg-background text-foreground">
        <div class="max-w-5xl mx-auto px-8 py-12 space-y-16">

            <!-- Header -->
            <header class="border-b border-border pb-8">
                <h1 class="text-4xl font-serif font-bold text-primary mb-3">Maestro Design System</h1>
                <p class="text-muted-foreground text-lg">Guia de estilos e componentes do projeto.</p>
            </header>

            <!-- 01 — Colors -->
            <section class="space-y-6">
                <h2 class="text-2xl font-serif font-bold text-foreground">
                    <span class="text-primary mr-2 font-mono text-sm font-normal">01</span>Cores
                </h2>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div v-for="t in colorTokens" :key="t.label" class="space-y-2">
                        <div :class="[t.tailwind, 'h-20 w-full rounded-md border border-border ring-1 ring-border/50']">
                        </div>
                        <div>
                            <p class="text-sm font-semibold text-foreground">{{ t.label }}</p>
                            <p class="text-xs text-muted-foreground font-mono">{{ t.tailwind }}</p>
                            <p class="text-xs text-muted-foreground font-mono">{{ t.hex }}</p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- 02 — Typography -->
            <section class="space-y-6">
                <h2 class="text-2xl font-serif font-bold text-foreground">
                    <span class="text-primary mr-2 font-mono text-sm font-normal">02</span>Tipografia
                </h2>
                <div class="space-y-4 p-6 bg-card border border-border rounded-lg">
                    <div class="border-b border-border pb-4 space-y-3">
                        <p class="text-4xl font-serif font-bold text-foreground">Merriweather — Títulos</p>
                        <p class="text-2xl font-serif font-semibold text-foreground">Heading 2 / font-serif</p>
                        <p class="text-xl font-serif text-foreground">Heading 3 / font-serif</p>
                        <p class="text-lg font-serif text-primary">Heading 4 / text-primary / Gold</p>
                    </div>
                    <div class="space-y-2">
                        <p class="text-base text-foreground">Inter — corpo de texto (text-base / text-foreground)</p>
                        <p class="text-sm text-muted-foreground">Texto secundário (text-sm / text-muted-foreground)</p>
                        <p class="text-xs text-muted-foreground font-mono">Fonte mono — código (font-mono / text-xs)</p>
                    </div>
                </div>
            </section>

            <!-- 03 — Buttons -->
            <section class="space-y-6">
                <h2 class="text-2xl font-serif font-bold text-foreground">
                    <span class="text-primary mr-2 font-mono text-sm font-normal">03</span>Botões
                </h2>
                <div class="flex flex-wrap gap-4 p-6 bg-card border border-border rounded-lg items-center">
                    <Button>Padrão (default)</Button>
                    <Button variant="secondary">Secundário</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="destructive">Perigo</Button>
                    <Button variant="link">Link</Button>
                    <Button size="sm">Pequeno</Button>
                    <Button size="lg">Grande</Button>
                </div>
            </section>

            <!-- 04 — Form Elements -->
            <section class="space-y-6">
                <h2 class="text-2xl font-serif font-bold text-foreground">
                    <span class="text-primary mr-2 font-mono text-sm font-normal">04</span>Formulários
                </h2>
                <div class="grid md:grid-cols-2 gap-8">

                    <!-- Inputs and Textarea -->
                    <Card>
                        <CardHeader>
                            <CardTitle>Inputs</CardTitle>
                        </CardHeader>
                        <CardContent class="space-y-4">
                            <div class="space-y-1">
                                <Label>Nome do personagem</Label>
                                <Input placeholder="Ex: Aragorn" />
                            </div>
                            <div class="space-y-1">
                                <Label>Descrição</Label>
                                <Textarea placeholder="Descreva seu personagem..." class="min-h-24" />
                            </div>
                        </CardContent>
                    </Card>

                    <!-- Select, Checkbox, Radio -->
                    <Card>
                        <CardHeader>
                            <CardTitle>Seleção</CardTitle>
                        </CardHeader>
                        <CardContent class="space-y-6">
                            <div class="space-y-1">
                                <Label>Classe</Label>
                                <Select>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Escolha uma classe" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="fighter">Guerreiro</SelectItem>
                                        <SelectItem value="wizard">Mago</SelectItem>
                                        <SelectItem value="rogue">Ladino</SelectItem>
                                        <SelectItem value="cleric">Clérigo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div class="space-y-3">
                                <Label>Opções</Label>
                                <div class="flex items-center gap-2">
                                    <Checkbox id="cb1" />
                                    <Label for="cb1">Personagem verificado</Label>
                                </div>
                                <div class="flex items-center gap-2">
                                    <Checkbox id="cb2" checked />
                                    <Label for="cb2">Aceitar termos</Label>
                                </div>
                            </div>
                            <div class="space-y-2">
                                <Label>Alinhamento</Label>
                                <RadioGroup default-value="lg" class="flex gap-4">
                                    <div class="flex items-center gap-2">
                                        <RadioGroupItem value="lg" id="lg" />
                                        <Label for="lg">Leal e Bom</Label>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <RadioGroupItem value="cn" id="cn" />
                                        <Label for="cn">Caótico Neutro</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </section>

            <!-- 05 — Cards -->
            <section class="space-y-6">
                <h2 class="text-2xl font-serif font-bold text-foreground">
                    <span class="text-primary mr-2 font-mono text-sm font-normal">05</span>Cards
                </h2>
                <div class="grid md:grid-cols-3 gap-4">
                    <Card v-for="i in 3" :key="i">
                        <CardHeader>
                            <CardTitle>Personagem {{ i }}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p class="text-sm text-muted-foreground">Guerreiro · Nível {{ i * 3 }} · Humano</p>
                            <div class="mt-4 flex gap-2">
                                <Button size="sm" variant="outline">Ver</Button>
                                <Button size="sm" variant="ghost">Editar</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>

        </div>
    </div>
</template>

```


---
## FILE: src/views/HomeView.vue
```vue
<script setup lang="ts">
</script>

<template>
  <main class="flex min-h-screen flex-col items-center justify-center p-24">
    <div class="z-10 max-w-5xl w-full flex-col items-center justify-between font-mono text-sm lg:flex">
      <h1 class="text-4xl font-bold mb-8">MaestroSheet</h1>
      <div class="flex gap-4">
        <RouterLink to="/login" class="text-primary hover:underline">Login</RouterLink>
        <RouterLink to="/register" class="text-primary hover:underline">Register</RouterLink>
      </div>
    </div>
  </main>
</template>

```


---
## FILE: src/views/LoginView.vue
```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/stores/auth'
import { Eye, EyeOff } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const isLogin = ref(true)
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const loading = ref(false)
const error = ref('')

const formTitle = computed(() => isLogin.value ? 'Welcome Back' : 'Create an Account')
const formSubtitle = computed(() => isLogin.value 
  ? 'Enter your email and password to sign in to your account.' 
  : 'Enter your details below to create your account.')
const submitButtonText = computed(() => {
  if (loading.value) return isLogin.value ? 'Logging in...' : 'Creating account...'
  return isLogin.value ? 'Sign In' : 'Sign Up'
})
const switchPrompt = computed(() => isLogin.value ? 'New here?' : 'Already have an account?')
const switchAction = computed(() => isLogin.value ? 'Create an account' : 'Sign in')

function toggleForm() {
  isLogin.value = !isLogin.value
  error.value = ''
}

async function handleAuth() {
  // Validate passwords match for registration
  if (!isLogin.value && password.value !== confirmPassword.value) {
    error.value = "Passwords don't match"
    return
  }

  loading.value = true
  error.value = ''

  try {
    if (isLogin.value) {
      // Handle Login
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.value,
        password: password.value,
      })
      if (authError) throw authError
      await authStore.initialize()
      router.push('/dashboard')
    } else {
      // Handle Register
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.value,
        password: password.value,
      })
      if (signUpError) throw signUpError

      const { error: loginError } = await supabase.auth.signInWithPassword({
          email: email.value,
          password: password.value,
      })
      
      if (!loginError) {
          await authStore.initialize()
          router.push('/dashboard')
      } else {
          // If auto-login fails after sign up, switch to login form
          isLogin.value = true
      }
    }
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
    <!-- Image Section - hidden on mobile, visible on desktop -->
    <div class="hidden bg-muted lg:block relative">
      <img
        src="https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?q=80&w=2070&auto=format&fit=crop"
        alt="Authentication background"
        class="absolute inset-0 h-full w-full object-cover dark:brightness-[0.4] dark:grayscale"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-background/80 to-background/20" />
      <div class="relative z-20 flex h-full flex-col justify-end p-10 text-white">
        <div class="mt-auto">
          <blockquote class="space-y-4">
            <h3 class="text-xl font-medium">SRD Companion</h3>
            <p class="text-lg">
              "This sheet has saved me countless hours and transformed how we play our campaigns. Highly recommended for any party!"
            </p>
            <footer class="text-sm text-gray-300">Sofia Davis, Dungeon Master</footer>
          </blockquote>
        </div>
      </div>
    </div>

    <!-- Form Section -->
    <div class="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
      <div class="mx-auto w-full max-w-[400px] space-y-6">
        <div class="flex flex-col space-y-2 text-center">
          <h1 class="text-3xl font-bold tracking-tight">{{ formTitle }}</h1>
          <p class="text-sm text-muted-foreground">
            {{ formSubtitle }}
          </p>
        </div>

        <div class="grid gap-6">
          <form @submit.prevent="handleAuth" class="grid gap-4">
            <div class="grid gap-2">
              <Label htmlFor="email" class="text-left">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="m@example.com" 
                v-model="email" 
                required 
                class="bg-background"
              />
            </div>
            
            <div class="grid gap-2">
              <div class="flex items-center justify-between">
                <Label htmlFor="password" class="text-left">Password</Label>
              </div>
              <div class="relative">
                <Input 
                  id="password" 
                  :type="showPassword ? 'text' : 'password'" 
                  v-model="password" 
                  placeholder="••••••••"
                  required 
                  class="bg-background pr-10"
                />
                <button
                  type="button"
                  class="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:text-foreground focus:outline-none transition-colors"
                  @click="showPassword = !showPassword"
                >
                  <Eye v-if="!showPassword" class="h-4 w-4" />
                  <EyeOff v-else class="h-4 w-4" />
                </button>
              </div>
            </div>

            <div v-if="!isLogin" class="grid gap-2">
              <div class="flex items-center justify-between">
                <Label htmlFor="confirmPassword" class="text-left">Confirm Password</Label>
              </div>
              <div class="relative">
                <Input 
                  id="confirmPassword" 
                  :type="showConfirmPassword ? 'text' : 'password'" 
                  v-model="confirmPassword" 
                  placeholder="••••••••"
                  required 
                  class="bg-background pr-10"
                />
                <button
                  type="button"
                  class="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:text-foreground focus:outline-none transition-colors"
                  @click="showConfirmPassword = !showConfirmPassword"
                >
                  <Eye v-if="!showConfirmPassword" class="h-4 w-4" />
                  <EyeOff v-else class="h-4 w-4" />
                </button>
              </div>
            </div>

            <div v-if="error" class="text-sm font-medium text-destructive">
              {{ error }}
            </div>

            <Button type="submit" class="w-full mt-2" :disabled="loading">
              {{ submitButtonText }}
            </Button>
          </form>

          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <span class="w-full border-t border-border" />
            </div>
            <div class="relative flex justify-center text-xs uppercase">
              <span class="bg-background px-2 text-muted-foreground">
                {{ switchPrompt }}
              </span>
            </div>
          </div>

          <div class="text-center text-sm">
            <button 
              type="button"
              @click="toggleForm" 
              class="font-medium text-primary underline underline-offset-4 hover:text-primary/80 bg-transparent border-none cursor-pointer"
            >
              {{ switchAction }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

```


---
## FILE: src/views/RegisterView.vue
```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/stores/auth'

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')
const router = useRouter()
const authStore = useAuthStore()

async function handleRegister() {
  if (password.value !== confirmPassword.value) {
    error.value = "Passwords don't match"
    return
  }

  loading.value = true
  error.value = ''

  try {
    const { error: authError } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
    })

    if (authError) throw authError

    // Auto login after sign up if configured in Supabase, or redirect to login
    // For now, let's try to login or just show success
    const { error: loginError } = await supabase.auth.signInWithPassword({
        email: email.value,
        password: password.value,
    })
    
    if (!loginError) {
        await authStore.initialize()
        router.push('/dashboard')
    } else {
        router.push('/login')
    }

  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center px-4">
    <Card class="w-full max-w-sm">
      <CardHeader>
        <CardTitle class="text-2xl">Create an account</CardTitle>
        <CardDescription>
          Enter your email below to create your account.
        </CardDescription>
      </CardHeader>
      <CardContent class="grid gap-4">
        <div class="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="m@example.com" v-model="email" required />
        </div>
        <div class="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" v-model="password" required />
        </div>
        <div class="grid gap-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input id="confirmPassword" type="password" v-model="confirmPassword" required />
        </div>
        <div v-if="error" class="text-sm text-destructive">
          {{ error }}
        </div>
      </CardContent>
      <CardFooter class="flex flex-col gap-4">
        <Button class="w-full" @click="handleRegister" :disabled="loading">
          {{ loading ? 'Creating account...' : 'Create account' }}
        </Button>
        <div class="text-center text-sm">
          Already have an account?
          <RouterLink to="/login" class="underline">
            Sign in
          </RouterLink>
        </div>
      </CardFooter>
    </Card>
  </div>
</template>

```


---
## FILE: src/views/SheetView.vue
```vue
<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'

// Tabs
import SummaryTab from '@/components/sheet/tabs/SummaryTab.vue'
import SkillsTab from '@/components/sheet/tabs/SkillsTab.vue'
import FeatsTab from '@/components/sheet/tabs/FeatsTab.vue'
import SpellsTab from '@/components/sheet/tabs/SpellsTab.vue'
import EquipmentTab from '@/components/sheet/tabs/EquipmentTab.vue'
import ResourcesTab from '@/components/sheet/tabs/ResourcesTab.vue'
import BuffsTab from '@/components/sheet/tabs/BuffsTab.vue'
import ConfigTab from '@/components/sheet/tabs/ConfigTab.vue'

// Shared components
import ItemEditorModal from '@/components/sheet/ItemEditorModal.vue'

// Icons
import {
  LayoutDashboard, Dices, Swords, Wand2, Package,
  Shield, Flame, Settings, ChevronLeft, Loader2
} from 'lucide-vue-next'

// Composables & types
import type { SheetData } from '@/types/sheet'
import { ATTR_KEYS, ATTR_LABELS } from '@/data/sheetConstants'
import { useSheet } from '@/composables/useSheet'
import { useSheetEdit } from '@/composables/useSheetEdit'
import { useDeleteConfirm } from '@/composables/useDeleteConfirm'
import { useDndCalculations } from '@/composables/useDndCalculations'
import { useRolls } from '@/composables/useRolls'
import { useSkills } from '@/composables/useSkills'
import { useSpellSlots } from '@/composables/useSpellSlots'

const route = useRoute()
const router = useRouter()

const props = defineProps<{
  sheetId?: string
  isEmbedded?: boolean
  onRoll?: (label: string, displayFormula: string, evalFormula?: string) => void
  onDualRoll?: (label: string, atkDisplay: string, dmgDisplay: string, atkEval: string, dmgEval: string) => void
}>()

const currentSheetId = computed(() => props.sheetId || route.params.id as string)

// ── Core Sheet ─────────────────────────────────────────────────────────
const { sheet, loading, fetchSheet: fetchSheetData, saveSheetMeta, saveSheetData } = useSheet()
const { editedData, headEditMode, tabsEditMode, toggleTabsEdit: toggleTabsEditComp, saveEdit: saveEditComp } = useSheetEdit(sheet, async (data) => {
  if (!sheet.value) return
  await saveSheetWithData(data)
})

const editMode = computed(() => headEditMode.value || tabsEditMode.value)
const d = computed(() => editMode.value ? editedData.value : sheet.value?.data)

// ── Calculations ──────────────────────────────────────────────────────
const {
  calcMod, modStr, modStrF, b, totalBonuses,
  attrTotal, totalCA, totalTouch, totalFlatFooted,
  totalBAB, totalInitiative, totalHP, totalSpeed,
  meleeAtk, rangedAtk, grappleAtk,
  totalFort, totalRef, totalWill,
  deathStatus, totalWeight, adjustField
} = useDndCalculations(d, editMode, editedData, sheet)

const { resolveFormula, handleRoll, handleItemRoll } = useRolls({
  attrTotal, calcMod, modStr,
  totalCA, totalTouch, totalFlatFooted,
  totalBAB, meleeAtk, rangedAtk, grappleAtk,
  totalHP, totalInitiative, totalFort, totalRef, totalWill,
  d, onRoll: props.onRoll, onDualRoll: props.onDualRoll
})

const { skillPhase, skillSearch, isClassSkill, filteredSkillsList, toggleSkillEdit, skillAbilityMod, skillTotal, adjustRank, addLevelUpSkillPoints, skillPointsSpent, activeSkills } = useSkills(d, editedData, editMode, sheet, calcMod, attrTotal, totalBonuses)
const { SPELL_LEVELS, spellSlotsMax, spellSlotsUsed, adjustSlotUsed, adjustSlotMax } = useSpellSlots(sheet)

// ── Tabs ───────────────────────────────────────────────────────────────
const TABS = [
  { id: 'summary', label: 'Resumo', icon: LayoutDashboard },
  { id: 'skills', label: 'Perícias', icon: Dices },
  { id: 'feats', label: 'Talentos', icon: Swords },
  { id: 'spells', label: 'Magias', icon: Wand2 },
  { id: 'equipment', label: 'Itens', icon: Package },
  { id: 'resources', label: 'Recursos', icon: Shield },
  { id: 'buffs', label: 'Buffs', icon: Flame },
  { id: 'config', label: 'Config', icon: Settings },
]

const activeTab = ref('summary')



// ── Save ───────────────────────────────────────────────────────────────
async function saveSheet() {
  if (!sheet.value) return
  await saveSheetWithData(sheet.value.data)
}

async function saveSheetWithData(data: SheetData) {
  if (!sheet.value) return
  try {
    await saveSheetMeta(sheet.value.id, {
      name: sheet.value.name, class: sheet.value.class,
      level: sheet.value.level, race: sheet.value.race
    })
    await saveSheetData(sheet.value.id, data)
  } catch (error: any) {
    alert('Erro ao salvar: ' + (error.message || error))
  }
}

async function saveCurrentHP() {
  if (!sheet.value) return
  await supabase.from('sheets').update({ data: { ...sheet.value.data } }).eq('id', sheet.value.id)
}

async function saveEdit() {
  await saveEditComp(spellSlotsMax.value, spellSlotsUsed.value)
}
function toggleTabsEdit() {
  if (!tabsEditMode.value) skillPhase.value = 'select'
  toggleTabsEditComp(async () => { await saveEdit() })
}

// ── Delete ─────────────────────────────────────────────────────────────
const { isDeleteOpen, deleteCountdown, confirmDelete, executeDelete, cancelDelete } = useDeleteConfirm(async (type, index) => {
  if (sheet.value?.data) {
    const map: Record<string, string> = { feat: 'feats', spell: 'spells', shortcut: 'shortcuts', equipment: 'equipment', buff: 'buffs', resource: 'resources' }
    const key = map[type]
    if (key && Array.isArray((sheet.value.data as any)[key])) {
      (sheet.value.data as any)[key].splice(index, 1)
      await saveSheet()
    }
  }
})

// ── Item Editor ────────────────────────────────────────────────────────
const editorOpen = ref(false)
const editorType = ref<'feat' | 'spell' | 'shortcut' | 'equipment' | 'buff'>('feat')
const editorItem = ref<any>(null)
const editorIndex = ref(-1)

function openEditor(type: string, item?: any, index = -1) {
  editorType.value = type as any
  editorItem.value = item || null
  editorIndex.value = index
  editorOpen.value = true
}

function openEquipmentEditor(item?: any, index = -1) {
  openEditor('equipment', item, index)
}

function handleEditorSave(data: any) {
  if (!sheet.value) return
  const map: Record<string, string> = { feat: 'feats', spell: 'spells', shortcut: 'shortcuts', equipment: 'equipment', buff: 'buffs' }
  const key = map[editorType.value]
  if (!key) return
  if (!(sheet.value.data as any)[key]) (sheet.value.data as any)[key] = []
  const list = (sheet.value.data as any)[key]
  if (editorIndex.value >= 0) list[editorIndex.value] = data
  else list.push(data)
  saveSheet()
}

// ── Resources ───────────────────────────────────────────────────────────
function addResource(name: string, max: number) {
  if (!sheet.value) return
  if (!sheet.value.data.resources) sheet.value.data.resources = []
  sheet.value.data.resources.push({ name, max, current: max })
  saveResources()
}
function adjustResource(i: number, delta: number) {
  if (!sheet.value?.data?.resources) return
  const res = sheet.value.data.resources[i]
  if (!res) return
  res.current = Math.max(0, Math.min(res.max, (res.current ?? res.max) + delta))
  saveResources()
}
function resetResources() {
  for (const res of (sheet.value?.data?.resources || [])) res.current = res.max
  saveResources()
}
async function saveResources() {
  if (!sheet.value) return
  await supabase.from('sheets').update({ data: { ...sheet.value.data } }).eq('id', sheet.value.id)
}
function deleteResource(i: number) {
  confirmDelete('resource', i)
}



// ── Equipment / Buff Toggles ───────────────────────────────────────────
function toggleEquipped(i: number) {
  if (sheet.value?.data?.equipment?.[i]) {
    const eq = sheet.value.data.equipment[i]
    eq.equipped = !eq.equipped
    supabase.from('sheets').update({ data: { ...sheet.value.data } }).eq('id', sheet.value.id)
  }
}
function toggleBuff(i: number) {
  if (sheet.value?.data?.buffs?.[i]) {
    const buf = sheet.value.data.buffs[i]
    buf.active = !buf.active
    supabase.from('sheets').update({ data: { ...sheet.value.data } }).eq('id', sheet.value.id)
  }
}

// ── Slot adjustments ───────────────────────────────────────────────────
function handleAdjustSlot(level: number, delta: number, field: 'used' | 'max') {
  if (field === 'used') adjustSlotUsed(level, delta)
  else adjustSlotMax(level, delta)
}

// ── Fetch ──────────────────────────────────────────────────────────────
async function fetchSheet() {
  if (!currentSheetId.value) return
  try { await fetchSheetData(currentSheetId.value) } catch { router.push('/dashboard') }
}
watch(currentSheetId, () => {
  headEditMode.value = false
  tabsEditMode.value = false
  editedData.value = null
  fetchSheet()
})
onMounted(fetchSheet)
</script>

<template>
  <div :class="[isEmbedded ? '' : 'min-h-screen bg-[#0a0a0b] text-foreground']">
    <div :class="[isEmbedded ? '' : 'max-w-5xl mx-auto px-3 py-4']">

      <!-- Back -->
      <div v-if="!isEmbedded" class="mb-3">
        <button @click="router.push('/dashboard')"
          class="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
          <ChevronLeft class="w-4 h-4" /> Voltar
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-28">
        <div class="flex flex-col items-center gap-3 text-zinc-600">
          <Loader2 class="w-8 h-8 animate-spin" />
          <span class="text-sm">Carregando ficha...</span>
        </div>
      </div>

      <template v-else-if="sheet && d">
        <!-- Character name bar -->
        <div class="mb-4 flex items-center justify-between gap-4">
          <div>
            <h1 class="text-xl font-extrabold font-serif text-zinc-100 leading-tight">{{ sheet.name }}</h1>
            <p class="text-xs text-zinc-500 mt-0.5">
              {{ sheet.race }} · {{ sheet.class }} · Nível {{ sheet.level }}
              <span v-if="d.alignment" class="ml-1 text-zinc-600">· {{ d.alignment }}</span>
            </p>
          </div>
          <!-- Edit mode badge -->
          <div v-if="editMode" class="flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-lg px-3 py-1.5 text-xs font-bold text-primary">
            ✏️ Modo Edição
            <button @click="toggleTabsEdit" class="hover:text-primary/70 transition-colors ml-1">Salvar</button>
          </div>
        </div>

        <!-- ═══ TAB BAR ═══ -->
        <div class="sticky top-0 z-30 mb-4 -mx-3 px-3" style="background: linear-gradient(to bottom, #0a0a0b 85%, transparent)">
          <div class="w-full overflow-x-auto scrollbar-hide pb-1">
            <div class="flex gap-1 min-w-max bg-zinc-950/90 border border-zinc-800/70 rounded-xl p-1.5 backdrop-blur-sm">
              <button
                v-for="tab in TABS"
                :key="tab.id"
                @click="activeTab = tab.id"
                class="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap"
                :class="activeTab === tab.id
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60'"
              >
                <component :is="tab.icon" class="w-4 h-4" />
                <span>{{ tab.label }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- ═══ TAB PANELS ═══ -->
        <div class="min-h-[50vh]">

          <!-- RESUMO -->
          <SummaryTab
            v-if="activeTab === 'summary'"
            :sheet="sheet"
            :d="d"
            :edit-mode="editMode"
            :edited-data="editedData"
            :total-h-p="totalHP"
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
            :death-status="deathStatus"
            :attr-total="attrTotal"
            :calc-mod="calcMod"
            :mod-str="modStr"
            :mod-str-f="modStrF"
            :resolve-formula="resolveFormula"
            :ATTR_KEYS="ATTR_KEYS"
            :ATTR_LABELS="ATTR_LABELS"
            @save-hp="saveCurrentHP"
            @roll="handleRoll"
            @roll-item="handleItemRoll"
            @add-shortcut="openEditor('shortcut')"
            @delete-shortcut="(i) => confirmDelete('shortcut', i)"
            @add-resource="addResource"
            @adjust-resource="adjustResource"
            @reset-resources="resetResources"
            @delete-resource="deleteResource"
          />

          <!-- PERÍCIAS -->
          <SkillsTab
            v-else-if="activeTab === 'skills'"
            :d="d"
            :edit-mode="editMode"
            :tabs-edit-mode="tabsEditMode"
            :edited-data="editedData"
            :skill-phase="skillPhase"
            :skill-search="skillSearch"
            :filtered-skills-list="filteredSkillsList"
            :active-skills="activeSkills"
            :skill-points-spent="skillPointsSpent"
            :mod-str="modStr"
            :mod-str-f="modStrF"
            :skill-ability-mod="skillAbilityMod"
            :skill-total="skillTotal"
            :is-class-skill="isClassSkill"
            :calc-mod="calcMod"
            :attr-total="attrTotal"
            @toggle-tabs-edit="toggleTabsEdit"
            @update:skill-phase="skillPhase = $event"
            @update:skill-search="skillSearch = $event"
            @toggle-skill-edit="toggleSkillEdit"
            @adjust-rank="adjustRank"
            @add-level-up-skill-points="addLevelUpSkillPoints"
            @roll="handleRoll"
          />

          <!-- TALENTOS & ATAQUES -->
          <FeatsTab
            v-else-if="activeTab === 'feats'"
            :d="d"
            :edit-mode="editMode"
            :mod-str="modStr"
            :resolve-formula="resolveFormula"
            :on-open-editor="openEditor"
            :on-delete="confirmDelete"
            :on-roll="handleRoll"
            :on-dual-roll="(label, atkF, dmgF) => handleItemRoll({ title: label, isAttack: true, attackFormula: atkF, damageFormula: dmgF })"
          />

          <!-- MAGIAS -->
          <SpellsTab
            v-else-if="activeTab === 'spells'"
            :d="d"
            :edit-mode="editMode"
            :tabs-edit-mode="tabsEditMode"
            :spell-slots-max="spellSlotsMax"
            :spell-slots-used="spellSlotsUsed"
            :SPELL_LEVELS="SPELL_LEVELS"
            :mod-str="modStr"
            :resolve-formula="resolveFormula"
            :on-open-editor="openEditor"
            :on-delete="confirmDelete"
            :on-roll-item="(spell: any) => handleItemRoll(spell)"
            :on-adjust-slot="handleAdjustSlot"
            :on-toggle-edit="toggleTabsEdit"
          />

          <!-- ITENS -->
          <EquipmentTab
            v-else-if="activeTab === 'equipment'"
            :d="d"
            :edit-mode="editMode"
            :total-weight="totalWeight"
            :on-open-editor="openEquipmentEditor"
            :on-delete="confirmDelete"
            :on-toggle-equipped="toggleEquipped"
          />

          <!-- RECURSOS -->
          <ResourcesTab
            v-else-if="activeTab === 'resources'"
            :sheet="sheet"
            :edit-mode="editMode"
            :on-adjust="adjustResource"
            :on-reset="resetResources"
            :on-add="addResource"
            :on-delete="deleteResource"
          />

          <!-- BUFFS -->
          <BuffsTab
            v-else-if="activeTab === 'buffs'"
            :d="d"
            :mod-str="modStr"
            :resolve-formula="resolveFormula"
            :on-open-editor="openEditor"
            :on-delete="confirmDelete"
            :on-toggle="toggleBuff"
          />

          <!-- CONFIG -->
          <ConfigTab
            v-else-if="activeTab === 'config'"
            :d="d"
            :b="b"
            :edit-mode="editMode"
            :tabs-edit-mode="tabsEditMode"
            :edited-data="editedData"
            :mod-str="modStr"
            :adjust-field="adjustField"
            :on-toggle-edit="toggleTabsEdit"
          />
        </div>
      </template>
    </div>

    <!-- Item Editor Modal -->
    <ItemEditorModal
      v-model="editorOpen"
      :type="editorType"
      :item="editorItem"
      :index="editorIndex"
      @save="handleEditorSave"
    />

    <!-- Delete confirm -->
    <Teleport to="body">
      <div v-if="isDeleteOpen" class="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4">
        <div class="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full text-center space-y-4">
          <div class="text-4xl">🗑️</div>
          <div>
            <p class="font-bold text-zinc-100">Confirmar exclusão?</p>
            <p class="text-sm text-zinc-500 mt-1">Esta ação não pode ser desfeita.</p>
          </div>
          <div class="flex gap-3">
            <button @click="cancelDelete"
              class="flex-1 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:bg-zinc-800 transition-colors text-sm">
              Cancelar
            </button>
            <button @click="executeDelete"
              class="flex-1 py-2 rounded-lg bg-red-900/80 border border-red-800 text-red-200 hover:bg-red-800 transition-colors text-sm font-bold"
              :class="deleteCountdown > 0 ? 'opacity-50 cursor-not-allowed' : ''">
              {{ deleteCountdown > 0 ? `Aguarde ${deleteCountdown}s...` : 'Excluir' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

```


---
## FILE: supabase_setup.sql
```sql
/**
 * REVISED Supabase Setup Script (v4 - Sheet Sharing)
 * Fixes: Infinite recursion using SECURITY DEFINER function.
 * Enables: Viewing sheets linked to campaigns.
 * Use this to UPDATE your database.
 */

-- Create tables if not exist
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  dm_id UUID REFERENCES auth.users(id) NOT NULL,
  join_code TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS campaign_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  sheet_id UUID REFERENCES sheets(id) ON DELETE SET NULL, 
  role TEXT DEFAULT 'player' CHECK (role IN ('dm', 'player', 'spectator')),
  UNIQUE(campaign_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  sender_name TEXT NOT NULL, 
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'roll', 'system'))
);

-- Enable RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
-- Assuming 'sheets' table already has RLS enabled. If not:
ALTER TABLE sheets ENABLE ROW LEVEL SECURITY;

-- 
-- HELPER FUNCTION: Get campaigns a user is a member of.
-- Prevents infinite recursion by bypassing RLS on table READ.
--
DROP FUNCTION IF EXISTS get_user_campaign_ids();

CREATE OR REPLACE FUNCTION get_user_campaign_ids()
RETURNS TABLE (campaign_id UUID) 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path = public
STABLE
AS $$
  SELECT campaign_id FROM campaign_members WHERE user_id = auth.uid();
$$;

-- CLEANUP OLD POLICIES
DROP POLICY IF EXISTS "Users can view campaigns they belong to" ON campaigns;
DROP POLICY IF EXISTS "Users can create campaigns" ON campaigns;
DROP POLICY IF EXISTS "DM can update campaign" ON campaigns;
DROP POLICY IF EXISTS "DM can delete campaign" ON campaigns;

DROP POLICY IF EXISTS "Members can view other members" ON campaign_members;
DROP POLICY IF EXISTS "Users can join campaigns" ON campaign_members;

DROP POLICY IF EXISTS "Members can view messages" ON messages;
DROP POLICY IF EXISTS "Members can send messages" ON messages;

DROP POLICY IF EXISTS "Campaign members can view linked sheets" ON sheets;


-- RECREATE POLICIES

-- Campaigns:
CREATE POLICY "Users can view campaigns they belong to" ON campaigns
  FOR SELECT USING (
    auth.uid() = dm_id OR 
    id IN (SELECT campaign_id FROM get_user_campaign_ids())
  );

CREATE POLICY "Users can create campaigns" ON campaigns
  FOR INSERT WITH CHECK (auth.uid() = dm_id);
  
CREATE POLICY "DM can update campaign" ON campaigns
  FOR UPDATE USING (auth.uid() = dm_id);

CREATE POLICY "DM can delete campaign" ON campaigns
  FOR DELETE USING (auth.uid() = dm_id);


-- Campaign Members:
CREATE POLICY "Members can view other members" ON campaign_members
  FOR SELECT USING (
    auth.uid() = user_id OR
    campaign_id IN (SELECT campaign_id FROM get_user_campaign_ids()) OR
    campaign_id IN (SELECT id FROM campaigns WHERE dm_id = auth.uid())
  );

CREATE POLICY "Users can join campaigns" ON campaign_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Messages:
CREATE POLICY "Members can view messages" ON messages
  FOR SELECT USING (
    campaign_id IN (SELECT campaign_id FROM get_user_campaign_ids()) OR
    campaign_id IN (SELECT id FROM campaigns WHERE dm_id = auth.uid())
  );

CREATE POLICY "Members can send messages" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND (
      campaign_id IN (SELECT campaign_id FROM get_user_campaign_ids()) OR
      campaign_id IN (SELECT id FROM campaigns WHERE dm_id = auth.uid())
    )
  );

-- Sheets:
-- Allow viewing sheets that are linked to a campaign I am also in (or DM of)
CREATE POLICY "Campaign members can view linked sheets" ON sheets
  FOR SELECT USING (
    -- Access if sheet is linked to a campaign I am in
    id IN (
      SELECT sheet_id FROM campaign_members 
      WHERE campaign_id IN (SELECT campaign_id FROM get_user_campaign_ids())
    ) 
    OR
    -- Access if sheet is linked to a campaign I DM
    id IN (
      SELECT sheet_id FROM campaign_members 
      WHERE campaign_id IN (SELECT id FROM campaigns WHERE dm_id = auth.uid())
    )
  );

-- Grants (To ensure authenticated user has access)
GRANT EXECUTE ON FUNCTION get_user_campaign_ids TO authenticated;
GRANT ALL ON campaign_members TO authenticated;
GRANT ALL ON campaigns TO authenticated;
GRANT ALL ON messages TO authenticated;

```


---
## FILE: tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{vue,js,ts,jsx,tsx}",
    ],
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                lumina: {
                    text: "#E4E4E7", // zinc-200
                    "text-muted": "#71717A", // zinc-500
                    detail: "#DFD4BD", // Gold/Beige
                    border: "#27272A", // zinc-800
                    card: "#18181B", // zinc-900
                    bg: "#09090B", // zinc-950
                },
            },
            borderRadius: {
                xl: "calc(var(--radius) + 4px)",
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            fontFamily: {
                sans: ["Inter", "sans-serif"],
                serif: ["Merriweather", "serif"],
            },
            keyframes: {},
        },
    },
    plugins: [
        require('tailwind-scrollbar'),
    ],
}

```


---
## FILE: tsconfig.app.json
```json
{
  "extends": "@vue/tsconfig/tsconfig.dom.json",
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "types": [
      "vite/client"
    ],
    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true,
    "baseUrl": ".",
    "paths": {
      "@/*": [
        "./src/*"
      ]
    }
  },
  "include": [
    "src/**/*.ts",
    "src/**/*.tsx",
    "src/**/*.vue"
  ]
}
```


---
## FILE: tsconfig.json
```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}

```


---
## FILE: tsconfig.node.json
```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "ES2023",
    "lib": ["ES2023"],
    "module": "ESNext",
    "types": ["node"],
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["vite.config.ts"]
}

```


---
## FILE: vercel.json
```json
{
    "rewrites": [
        {
            "source": "/(.*)",
            "destination": "/index.html"
        }
    ]
}
```


---
## FILE: vite.config.ts
```typescript
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})

```
