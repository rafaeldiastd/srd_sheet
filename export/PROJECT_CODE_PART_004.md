

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

export function useCampaignRolls(
    campaignId: string,
    memberName: Ref<string>,
    recipientId: Ref<string>,
    avatarUrl?: Ref<string | null>
) {
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
            character_name: memberName.value,
            avatar_url: avatarUrl?.value || null,
            content,
            type: isWhisper ? 'whisper' : 'roll',
        })

        if (error) console.error('Error sending roll:', error)

        rolling.value = false
    }

    async function sendAttackRoll(
        label: string,
        attackFormula: string,
        damageFormula: string
    ): Promise<string | null> {
        if (rolling.value) return null
        rolling.value = true

        const isWhisper = recipientId.value !== 'all'
        const attackResult = evaluateFormula(attackFormula)

        const payload: any = {
            label,
            is_attack: true,
            is_roll: true, // for backward compatibility or whisper chat filter detection
            attack: {
                formula: attackFormula,
                result: attackResult.result,
                breakdown: attackResult.breakdown
            },
            damage: null,
            damage_formula: damageFormula,
            damage_pending: true
        }

        if (isWhisper) {
            payload.target_id = recipientId.value
        }

        const content = JSON.stringify(payload)

        const { data, error } = await supabase.from('messages').insert({
            campaign_id: campaignId,
            user_id: authStore.user?.id ?? null,
            sender_name: memberName.value,
            character_name: memberName.value,
            avatar_url: avatarUrl?.value || null,
            content,
            type: isWhisper ? 'whisper' : 'roll',
        }).select('id').single()

        if (error) console.error('Error sending attack roll:', error)

        rolling.value = false
        return data?.id || null
    }

    async function rollDamage(messageId: string, damageFormula: string): Promise<void> {
        if (rolling.value) return
        rolling.value = true

        const { data: msgToUpdate, error: fetchError } = await supabase
            .from('messages')
            .select('*')
            .eq('id', messageId)
            .single()

        if (fetchError || !msgToUpdate) {
            console.error('Could not find message to update', fetchError)
            rolling.value = false
            return
        }

        let parsedContent
        try {
            parsedContent = JSON.parse(msgToUpdate.content)
        } catch {
            rolling.value = false
            return
        }

        const damageResult = evaluateFormula(damageFormula)

        const payload = {
            ...parsedContent,
            damage: {
                formula: damageFormula,
                result: damageResult.result,
                breakdown: damageResult.breakdown
            },
            damage_pending: false
        }

        const { error } = await supabase.from('messages').update({
            content: JSON.stringify(payload)
        }).eq('id', messageId)

        if (error) console.error('Error updating damage roll:', error)
        rolling.value = false
    }

    async function deleteMessage(messageId: string): Promise<boolean> {
        const { error } = await supabase.from('messages').delete().eq('id', messageId)
        if (error) {
            console.error('Error deleting message:', error)
            return false
        }
        return true
    }

    return {
        rolling,
        sendRoll,
        sendAttackRoll,
        rollDamage,
        evaluateFormula,
        deleteMessage,
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
    equipment: Equipment[]
    shortcuts: Shortcut[]
    buffs: Buff[]
    resources: Resource[]
    layout?: string[]
    resumeLayout?: string[]
    hiddenBlocks?: string[]
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
import { Copy, BookOpen, Scroll, FileText, LayoutTemplate, MessageSquare, LogOut } from 'lucide-vue-next'
import ChatSidebar from '@/components/campaign/ChatSidebar.vue'
import QuickNpcModal from '@/components/campaign/QuickNpcModal.vue'
import SheetView from '@/views/SheetView.vue'
import { useCampaignRolls } from '@/lib/useCampaignRolls'
import SheetSelectorModal from '@/components/campaign/SheetSelectorModal.vue'
import NotepadPanel from '@/components/campaign/notepad/NotepadPanel.vue'

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
const showNotes = ref(false)

// Sheet selector state
const mySheets = ref<any[]>([])
const selectedSheetId = ref<string>('none')
const myMemberId = ref<string>('')
const savingSheet = ref(false)
const sheetSaved = ref(false)

const myCurrentSheetId = computed(() => {
    return selectedSheetId.value === 'none' ? null : selectedSheetId.value
})

const myMemberName = computed(() => {
    if (isDM.value) return 'Mestre'
    const activeSheet = mySheets.value.find(s => s.id === selectedSheetId.value)
    if (activeSheet) return activeSheet.name
    return authStore.user?.user_metadata?.name || 'Jogador'
})

const myAvatarUrl = computed(() => {
    if (isDM.value) return null
    const activeSheet = mySheets.value.find(s => s.id === selectedSheetId.value)
    if (!activeSheet?.data) return null
    const data = typeof activeSheet.data === 'string' 
      ? JSON.parse(activeSheet.data) 
      : activeSheet.data
    return data.avatar_url || null
})

const recipientId = ref('all')

const { sendRoll, sendAttackRoll } = useCampaignRolls(campaignId, myMemberName, recipientId, myAvatarUrl)

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
                <nav class="flex items-center gap-1">

                    <!-- Notas -->
                    <button
                      @click="showNotes = !showNotes"
                      :class="[
                        'flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium transition-colors',
                        showNotes
                          ? 'bg-primary/15 text-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      ]"
                    >
                      <BookOpen class="w-3.5 h-3.5 shrink-0" />
                      <span class="hidden sm:inline">Notas</span>
                    </button>

                    <!-- Chat -->
                    <button
                      @click="showChat = !showChat"
                      :class="[
                        'flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium transition-colors',
                        showChat
                          ? 'bg-primary/15 text-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      ]"
                    >
                      <MessageSquare class="w-3.5 h-3.5 shrink-0" />
                      <span class="hidden sm:inline">Chat</span>
                    </button>


                    <!-- Trocar Ficha -->
                    <button
                      @click="showSheetSelector = true"
                      :class="[
                        'flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium transition-colors border',
                        sheetSaved
                          ? 'border-green-600/40 bg-green-600/10 text-green-400'
                          : 'border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted'
                      ]"
                    >
                      <LayoutTemplate class="w-3.5 h-3.5 shrink-0" />
                      <span class="hidden sm:inline">{{ selectedSheetId === 'none' ? 'Espectador' : 'Trocar Ficha' }}</span>
                    </button>


                    <!-- DM: Join Code -->
                    <div v-if="campaign && isDM"
                        class="hidden md:flex items-center gap-2 bg-zinc-900 px-3 py-1 rounded-md border border-zinc-800 h-8">
                        <span class="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Código:</span>
                        <code class="text-xs font-mono text-primary font-bold">{{ campaign.join_code }}</code>
                        <button @click="copyJoinCode" class="text-muted-foreground hover:text-foreground">
                            <Copy class="w-3 h-3" />
                        </button>
                    </div>

                    <!-- DM: Criar NPC -->
                    <button v-if="isDM" @click="showNpcModal = true"
                        class="hidden md:flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                        Criar NPC
                    </button>

                    <!-- Sair -->
                    <button
                      @click="leaveCampaign"
                      class="flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut class="w-3.5 h-3.5 shrink-0" />
                      <span class="hidden sm:inline">Sair</span>
                    </button>
                </nav>

            </header>

            <!-- Workspace Setup: Notepad (Left) + Sheet (Center) -->
            <div class="flex-1 flex overflow-hidden relative">
                <div v-if="loading" class="absolute inset-0 z-10 bg-background/50 flex justify-center py-20 backdrop-blur-sm">
                    <div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>

                <!-- Notepad (Left Panel) -->
                <NotepadPanel 
                  v-if="showNotes"
                  :campaign-id="campaignId"
                  :visible="showNotes"
                  @close="showNotes = false"
                />

                <!-- Character Sheet (Center Panel) -->
                <div class="flex-1 overflow-y-auto bg-background px-0 sm:px-4 lg:px-8 py-0 sm:py-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent hover:scrollbar-thumb-zinc-700" 
                     :class="{ 'hidden lg:block': showNotes || (showChat && !myCurrentSheetId) }">
                    <div v-if="myCurrentSheetId" class="h-full">
                        <SheetView :sheet-id="myCurrentSheetId" is-embedded :on-roll="sendRoll"
                            :on-attack-roll="sendAttackRoll" />
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
        <ChatSidebar v-show="showChat" :campaign-id="campaignId" :member-name="myMemberName" :avatar-url="myAvatarUrl" :members="members" :dm-id="campaign?.dm_id"
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
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/stores/auth'
import { Eye, EyeOff } from 'lucide-vue-next'

const router = useRouter()
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

import EquipmentTab from '@/components/sheet/tabs/EquipmentTab.vue'
import ResourcesTab from '@/components/sheet/tabs/ResourcesTab.vue'
import ConfigTab from '@/components/sheet/tabs/ConfigTab.vue'

// Shared components
import ItemEditorModal from '@/components/sheet/ItemEditorModal.vue'
import HeaderBlock from '@/components/sheet/blocks/HeaderBlock.vue'
import CoreDataEditorModal from '@/components/sheet/CoreDataEditorModal.vue'

// Icons
import {
  LayoutDashboard, Dices, Swords, Package,
  Shield, Settings, ChevronLeft, Loader2
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

const route = useRoute()
const router = useRouter()

const props = defineProps<{
  sheetId?: string
  isEmbedded?: boolean
  onRoll?: (label: string, displayFormula: string, evalFormula?: string) => void
  onAttackRoll?: (label: string, attackFormula: string, damageFormula: string) => void
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
} = useDndCalculations(d)

const { resolveFormula, handleRoll, handleItemRoll } = useRolls({
  attrTotal, calcMod, modStr,
  totalCA, totalTouch, totalFlatFooted,
  totalBAB, meleeAtk, rangedAtk, grappleAtk,
  totalHP, totalInitiative, totalFort, totalRef, totalWill,
  d, onRoll: props.onRoll, onAttackRoll: props.onAttackRoll
})

const { skillPhase, skillSearch, isClassSkill, filteredSkillsList, toggleSkillEdit, skillAbilityMod, skillTotal, adjustRank, addLevelUpSkillPoints, skillPointsSpent, activeSkills } = useSkills(d, editedData, editMode, sheet, calcMod, attrTotal, totalBonuses)

// ── Tabs ───────────────────────────────────────────────────────────────
const TABS = [
  { id: 'summary', label: 'Resumo', icon: LayoutDashboard },
  { id: 'skills', label: 'Perícias', icon: Dices },
  { id: 'feats', label: 'Talentos', icon: Swords },
  { id: 'equipment', label: 'Itens', icon: Package },
  { id: 'resources', label: 'Recursos & Buffs', icon: Shield },
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
  await saveEditComp()
  if (sheet.value) {
    await saveSheet()
  }
}
function toggleTabsEdit() {
  if (!tabsEditMode.value) skillPhase.value = 'select'
  toggleTabsEditComp(async () => { await saveEdit() })
}

// ── Delete ─────────────────────────────────────────────────────────────
const { isDeleteOpen, deleteCountdown, confirmDelete, executeDelete, cancelDelete } = useDeleteConfirm(async (type, index) => {
  if (sheet.value?.data) {
    const map: Record<string, string> = { feat: 'feats', shortcut: 'shortcuts', equipment: 'equipment', buff: 'buffs', resource: 'resources' }
    const key = map[type]
    if (key && Array.isArray((sheet.value.data as any)[key])) {
      (sheet.value.data as any)[key].splice(index, 1)
      await saveSheet()
    }
  }
})

// ── Item & Core Editor ──────────────────────────────────────────────────
const editorOpen = ref(false)
const coreEditorOpen = ref(false)
const editorType = ref<'feat' | 'shortcut' | 'equipment' | 'buff'>('feat')
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
  const map: Record<string, string> = { feat: 'feats', shortcut: 'shortcuts', equipment: 'equipment', buff: 'buffs' }
  const key = map[editorType.value]
  if (!key) return
  if (!(sheet.value.data as any)[key]) (sheet.value.data as any)[key] = []
  const list = (sheet.value.data as any)[key]
  if (editorIndex.value >= 0) list[editorIndex.value] = data
  else list.push(data)
  saveSheet()
}

async function handleCoreSave(meta: { name: string; class: string; level: number; race: string }, data: any) {
  if (!sheet.value) return
  // Update local
  sheet.value.name = meta.name
  sheet.value.class = meta.class
  sheet.value.level = meta.level
  sheet.value.race = meta.race
  sheet.value.data = data
  // Save both sets
  try {
    await saveSheetMeta(sheet.value.id, meta)
    await saveSheetData(sheet.value.id, data)
  } catch (err: any) {
    alert('Erro ao salvar dados principais: ' + err.message)
  }
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
        <HeaderBlock
          :sheet="sheet"
          :d="d"
          :edit-mode="editMode"
          @edit-core="coreEditorOpen = true"
        />

        <!-- ═══ TAB BAR ═══ -->
        <div class="sticky top-0 z-30 mb-4 -mx-3 px-3" style="background: linear-gradient(to bottom, #0a0a0b 85%, transparent)">
          <div class="w-full overflow-x-auto scrollbar-hide pb-1">
            <div class="flex gap-1 justify-between min-w-max bg-zinc-950/90 border border-zinc-800/70 rounded-xl p-1.5 backdrop-blur-sm">
              <button
                v-for="tab in TABS"
                :key="tab.id"
                @click="activeTab = tab.id"
                class="flex-1 flex justify-center items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap"
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
            @toggle-buff="toggleBuff"
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
            :on-attack-roll="(label: string, atkF: string, dmgF: string) => handleItemRoll({ title: label, isAttack: true, attackFormula: atkF, damageFormula: dmgF })"
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

          <!-- RECURSOS & BUFFS -->
          <ResourcesTab
            v-else-if="activeTab === 'resources'"
            :sheet="sheet"
            :d="d"
            :edit-mode="editMode"
            :mod-str="modStr"
            :resolve-formula="resolveFormula"
            :on-adjust="adjustResource"
            :on-reset="resetResources"
            :on-add="addResource"
            :on-delete="deleteResource"
            :on-open-editor="openEditor"
            :on-delete-buff="(i: number) => confirmDelete('buff', i)"
            :on-toggle-buff="toggleBuff"
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

    <!-- Core Data Editor Modal -->
    <CoreDataEditorModal
      v-if="sheet"
      v-model="coreEditorOpen"
      :sheet-name="sheet.name"
      :sheet-class="sheet.class"
      :sheet-level="sheet.level"
      :sheet-race="sheet.race"
      :data="sheet.data"
      @save="handleCoreSave"
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
