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
        ac: {
            armor: 0,
            shield: 0,
            natural: 0,
            deflection: 0,
            size: 0,
            misc: 0,
            dexMod: 0,
            total: 10,
            touch: 10,
            flatFooted: 10
        },
        conditions: {
            blinded: false,
            dazzled: false,
            deafened: false,
            entangled: false,
            fatigued: false,
            exhausted: false,
            grappled: false,
            helpless: false,
            paralyzed: false,
            pinned: false,
            prone: false,
            shaken: false,
            sickened: false,
            stunned: false,
            unconscious: false,
            invisible: false
        },
        hp_current: 10,
        hp_max: 10,
        level: 1,
        xp: 0,
    }
}
