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
