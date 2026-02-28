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
