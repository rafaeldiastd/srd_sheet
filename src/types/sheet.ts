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

export interface ACData {
    armor: number
    shield: number
    natural: number
    deflection: number
    size: number
    misc: number
    dexMod: number
    total: number
    touch: number
    flatFooted: number
}

export interface Conditions {
    blinded: boolean
    dazzled: boolean
    deafened: boolean
    entangled: boolean
    fatigued: boolean
    exhausted: boolean
    grappled: boolean
    helpless: boolean
    paralyzed: boolean
    pinned: boolean
    prone: boolean
    shaken: boolean
    sickened: boolean
    stunned: boolean
    unconscious: boolean
    invisible: boolean
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
    featType?: string
    requirements?: string
    // Roll mode
    rollMode?: 'none' | 'generic' | 'attack' | 'heal'
    isAttack?: boolean  // back-compat
    attackFormula?: string
    damageFormula?: string
    healFormula?: string
    rollFormula?: string
    rollPassiveFormula?: string
    modifiers?: Modifier[]
    activeModifiers?: Modifier[]
    active?: boolean
}

export interface Equipment {
    title: string
    description: string
    equipped?: boolean
    weight?: number
    price?: number
    quantity?: number
    modifiers?: Modifier[]
    activeModifiers?: Modifier[]
    active?: boolean
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
    // Roll mode
    rollMode?: 'none' | 'generic' | 'attack' | 'heal'
    isAttack?: boolean
    attackFormula?: string
    damageFormula?: string
    healFormula?: string
    rollFormula?: string
    rollPassiveFormula?: string
    modifiers?: Modifier[]
    activeModifiers?: Modifier[]
}

export interface Resource {
    label?: string
    name?: string
    current: number
    max: number
    // Extended fields
    color?: string
    recoverOn?: 'long' | 'short' | 'daily' | 'formula' | 'manual'
    recoverFormula?: string
    costPerUse?: number
    description?: string
}

export interface CustomSkill {
    name: string
    ability: string
    ranks: number
    isClassSkill?: boolean
    trainedOnly?: boolean
    armorPenalty?: boolean
    description?: string
    modifiers?: { label: string; value: number }[]
    customFormula?: string
}

export interface Spell {
    id?: string
    campaign_id?: string
    name: string
    level: number
    description: string
    school?: string
    castTime?: string
    range?: string
    target?: string
    duration?: string
    savingThrow?: string
    spellResistance?: string

    rollMode?: 'none' | 'generic' | 'attack' | 'heal'
    isAttack?: boolean
    attackFormula?: string
    damageFormula?: string
    healFormula?: string
    rollFormula?: string
    rollPassiveFormula?: string
    modifiers?: Modifier[]
    activeModifiers?: Modifier[]
    active?: boolean
}

export interface CharacterSpell extends Spell {
    prepared?: boolean
}

export interface SpellSlotStats {
    known: number
    perDay: number
    used: number
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
    customSkills?: CustomSkill[]
    spells?: CharacterSpell[]
    spellSlots?: Record<number, SpellSlotStats>
    layout?: string[]
    resumeLayout?: string[]
    hiddenBlocks?: string[]
    ac?: ACData
    conditions?: Conditions
    save_fort?: number
    save_ref?: number
    save_will?: number
    initiative_misc?: number
    speed?: number
    customSkillPoints?: number
    customHitDie?: number
    skillPoints?: number
    // Características pessoais
    bio?: string
    alignment?: string
    deity?: string
    age?: string
    gender?: string
    height?: string
    weight_char?: string
    eyes?: string
    hair?: string
    skin?: string
    // Imagens
    avatar_url?: string
    cover_url?: string
    token_url?: string
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
    campaign_id?: string
    created_at?: string
}
