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

// ── Dice Engine ───────────────────────────────────────────────────────────────
function rollDie(sides: number): number {
    return Math.floor(Math.random() * sides) + 1
}

/** Evaluate NdX+bonus formulas like 1d20+5, 2d6+3, etc. */
function evaluateFormula(formula: string): { label: string; result: number; breakdown: string } {
    const clean = formula.trim().replace(/\s/g, '')
    let total = 0
    const parts: string[] = []

    // Match all terms: NdX, +N, -N
    const regex = /([+-]?\d*d\d+|[+-]?\d+)/gi
    const matches = clean.match(regex) || []

    for (const term of matches) {
        if (term.includes('d')) {
            const [nStr, sidesStr] = term.split('d')
            const n = Math.abs(parseInt(nStr || '1', 10)) || 1
            const sides = parseInt(sidesStr, 10)
            const sign = term.startsWith('-') ? -1 : 1
            let rollTotal = 0
            const rolls: number[] = []
            for (let i = 0; i < n; i++) {
                const r = rollDie(sides)
                rolls.push(r)
                rollTotal += r
            }
            total += sign * rollTotal
            parts.push(`${sign < 0 ? '-' : ''}[${rolls.join('+')}]`)
        } else {
            const num = parseInt(term, 10)
            total += num
            if (num !== 0) parts.push(num > 0 ? `+${num}` : `${num}`)
        }
    }

    return { label: formula, result: total, breakdown: parts.join(' ') }
}

function modStr(n: number): string {
    return n >= 0 ? `+${n}` : `${n}`
}

// ── Rolling ───────────────────────────────────────────────────────────────────
const rolling = ref(false)

async function sendRoll(label: string, formula: string, bonus = 0) {
    if (rolling.value) return
    rolling.value = true

    const fullFormula = bonus !== 0 ? `${formula}${modStr(bonus)}` : formula
    const { result, breakdown } = evaluateFormula(fullFormula)

    const content = `🎲 ${label}: ${result} (${breakdown})`

    await supabase.from('messages').insert({
        campaign_id: props.campaignId,
        user_id: authStore.user?.id,
        sender_name: memberName.value,
        content,
        type: 'roll',
    })

    rolling.value = false
}

async function rollInitiative() {
    await sendRoll('Iniciativa', `1d20`, initiative.value)
}

async function rollAttack(sc: any) {
    if (sc.attackBonus !== undefined && sc.attackBonus !== '') {
        const atkBonus = parseInt(sc.attackBonus) || 0
        await sendRoll(`${sc.title} — Acerto`, '1d20', atkBonus)
    }
    if (sc.rollFormula) {
        await sendRoll(`${sc.title} — Dano`, sc.rollFormula)
    }
}

async function rollSpell(spell: any) {
    await sendRoll(spell.title || 'Magia', spell.rollFormula)
}

async function rollSkill(skill: { name: string; total: number }) {
    await sendRoll(skill.name, '1d20', skill.total)
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
                            <button v-for="attr in ['str', 'dex', 'con', 'int', 'wis', 'cha']" :key="attr"
                                class="p-2 rounded bg-zinc-900 border border-zinc-800 hover:border-primary/50 transition-colors text-center"
                                :disabled="rolling" @click="sendRoll(attr.toUpperCase(), '1d20', attrMod(attr))">
                                <p class="text-[9px] text-muted-foreground uppercase font-bold">{{ {
                                    str: 'FOR',
                                    dex: 'DES', con: 'CON', int:'INT', wis:'SAB', cha:'CAR' }[attr] }}</p>
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
                                    @click="sendRoll(`${sc.title} — Acerto`, '1d20', parseInt(sc.attackBonus) || 0)">
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
