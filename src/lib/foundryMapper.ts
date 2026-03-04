import type { SheetData } from '../types/sheet'

// ── Mapa de códigos de perícia do Foundry (D35E) → nome em PT-BR ──────────────
const SKILL_MAP: Record<string, string> = {
    apr: 'Avaliação',
    blc: 'Equilíbrio',
    blf: 'Blefar',
    clm: 'Escalar',
    coc: 'Concentração',
    dsc: 'Decifrar Escrita',
    dip: 'Diplomacia',
    dev: 'Operar Mecanismo',
    dis: 'Disfarces',
    esc: 'Arte da Fuga',
    fog: 'Falsificação',
    gat: 'Obter Informação',
    gif: 'Obter Informação',
    han: 'Adestrar Animais',
    hea: 'Cura',
    hid: 'Esconder-se',
    int: 'Intimidação',
    jmp: 'Saltar',
    jum: 'Saltar',
    kar: 'Conhecimento (Arcano)',
    kdu: 'Conhecimento (Dungeon)',
    ken: 'Conhecimento (Engenharia)',
    kge: 'Conhecimento (Geografia)',
    khi: 'Conhecimento (História)',
    klo: 'Conhecimento (Local)',
    kna: 'Conhecimento (Natureza)',
    kno: 'Conhecimento (Nobreza)',
    kpl: 'Conhecimento (Planos)',
    kre: 'Conhecimento (Religião)',
    kps: 'Conhecimento (Psionismo)',
    lis: 'Ouvir',
    mos: 'Furtividade',
    mov: 'Furtividade',
    ope: 'Abrir Fechaduras',
    rid: 'Cavalgar',
    sea: 'Procurar',
    src: 'Procurar',
    sen: 'Sentir Motivação',
    slt: 'Prestidigitação',
    sle: 'Prestidigitação',
    spl: 'Identificar Magia',
    spo: 'Observar',
    spt: 'Observar',
    sur: 'Sobrevivência',
    swm: 'Natação',
    swi: 'Natação',
    tmb: 'Acrobacia',
    umd: 'Usar Instrumento Mágico',
    uro: 'Usar Corda',
    upd: 'Usar Objeto Psiônico',
    spk: 'Falar Idioma',
    psi: 'Psionismo',
    aut: 'Autodisciplina',
    // Subskills com nome genérico (fallback quando não há nome)
    crf: 'Ofícios',
    prf: 'Atuação',
    pro: 'Profissão',
}

// ── Mapa de tamanho (Foundry → PT-BR) ────────────────────────────────────────
const SIZE_MAP: Record<string, string> = {
    fine: 'Mínimo',
    dim: 'Diminuto',
    tiny: 'Mínimo',
    sm: 'Pequeno',
    med: 'Médio',
    lg: 'Grande',
    huge: 'Enorme',
    grg: 'Imenso',
    col: 'Colossal',
}

export function mapFoundryToSheet(foundryJson: any): Partial<SheetData> {
    const sys = foundryJson.system || {}
    const items = foundryJson.items || []

    // ── Raça e Classe ─────────────────────────────────────────────────────────
    const raceItem = items.find((i: any) => i.type === 'race')
    const classItems = items.filter((i: any) => i.type === 'class')
    // Multi-class: join names
    const className = classItems.map((c: any) => c.name).join('/') || ''

    // ── Atributos ─────────────────────────────────────────────────────────────
    const attributes: any = {}
    const abilities = sys.abilities || {}
        ;['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(attr => {
            attributes[attr] = {
                base: abilities[attr]?.value ?? 10,
                temp: 0
            }
        })

    // ── Perícias — suporte completo incluindo subskills ───────────────────────
    const skills: Record<string, number> = {}
    if (sys.skills) {
        Object.entries(sys.skills).forEach(([code, data]: [string, any]) => {
            // Subskills (crf, prf, pro e similares)
            if (data.subSkills && typeof data.subSkills === 'object') {
                Object.values(data.subSkills).forEach((sub: any) => {
                    const subName = sub.name?.trim()
                    const parentName = SKILL_MAP[code] || code
                    const fullName = subName ? `${parentName} (${subName})` : parentName
                    if ((sub.rank ?? 0) > 0 || (sub.points ?? 0) > 0) {
                        skills[fullName] = sub.rank ?? 0
                    }
                })
                // Also check namedSubSkills (more reliable names)
                if (data.namedSubSkills) {
                    Object.values(data.namedSubSkills).forEach((sub: any) => {
                        const subName = sub.name?.trim()
                        if (!subName) return
                        const parentName = SKILL_MAP[code] || code
                        const fullName = `${parentName} (${subName})`
                        if ((sub.rank ?? 0) > 0) {
                            skills[fullName] = sub.rank ?? 0
                        }
                    })
                }
                return
            }

            // Normal skills — use rank (graduações investidas)
            const name = SKILL_MAP[code]
            if (!name) return
            const rank = data.rank ?? data.points ?? 0
            // Include all skills that have at least 1 rank
            if (rank > 0) {
                // Don't overwrite if already set higher
                if ((skills[name] ?? 0) < rank) {
                    skills[name] = rank
                }
            }
        })
    }

    // ── Talentos ──────────────────────────────────────────────────────────────
    const feats = items
        .filter((i: any) => i.type === 'feat')
        .map((i: any) => ({
            title: i.name,
            description: i.system?.description?.value?.replace(/<[^>]*>?/gm, '').trim() || '',
            featType: i.system?.featType || 'feat',
            requirements: i.system?.requirements?.length
                ? (Array.isArray(i.system.requirements) ? i.system.requirements.join(', ') : i.system.requirements)
                : (i.system?.source || '')
        }))

    // ── Equipamentos ──────────────────────────────────────────────────────────
    const equipment = items
        .filter((i: any) => ['equipment', 'weapon', 'armor', 'loot'].includes(i.type))
        .map((i: any) => ({
            title: i.name,
            description: i.system?.description?.value?.replace(/<[^>]*>?/gm, '').trim() || '',
            equipped: i.system?.equipped ?? false,
            weight: i.system?.weight ?? 0,
            price: i.system?.price ?? 0,
            quantity: i.system?.quantity ?? 1
        }))

    // ── Condições ─────────────────────────────────────────────────────────────
    const conditions: any = {}
    const cnd = sys.conditions || {}
    const conditionKeys: [string, string][] = [
        ['blinded', 'blind'], ['dazzled', 'dazzled'], ['deafened', 'deaf'],
        ['entangled', 'entangled'], ['fatigued', 'fatigued'], ['exhausted', 'exhausted'],
        ['grappled', 'grappled'], ['helpless', 'helpless'], ['paralyzed', 'paralyzed'],
        ['pinned', 'pinned'], ['prone', 'prone'], ['shaken', 'shaken'],
        ['sickened', 'sickened'], ['stunned', 'stunned'], ['unconscious', 'unconscious'],
        ['invisible', 'invisible']
    ]
    conditionKeys.forEach(([to, from]) => {
        conditions[to] = !!cnd[from]
    })

    // ── Detalhes pessoais ─────────────────────────────────────────────────────
    const details = sys.details || {}
    const xpVal = details.xp?.value
    const xp = typeof xpVal === 'string' ? parseInt(xpVal) || 0 : (xpVal ?? 0)
    const gender = typeof details.gender === 'object' ? (details.gender?.value || '') : (details.gender || '')
    const size = SIZE_MAP[sys.traits?.size ?? 'med'] ?? 'Médio'

    // ── CA — extrai os componentes individuais ────────────────────────────────
    const acData = sys.attributes?.ac || {}
    const ac = {
        total: acData.normal?.total ?? 10,
        touch: acData.touch?.total ?? 10,
        flatFooted: acData.flatFooted?.total ?? 10,
        armor: acData.normal?.armor ?? 0,
        shield: acData.normal?.shield ?? 0,
        natural: acData.natural ?? sys.attributes?.naturalACTotal ?? 0,
        deflection: acData.normal?.deflection ?? 0,
        size: acData.normal?.size ?? 0,
        misc: acData.normal?.misc ?? 0,
        dexMod: acData.normal?.dex ?? 0,
    }

    return {
        // Identidade
        name: foundryJson.name || 'Novo Personagem',
        sheetType: 'Personagem',
        race: raceItem?.name || details.race || '',
        class: className,
        level: details.level?.value ?? 1,
        size,
        alignment: details.alignment || '',
        deity: details.deity?.name || details.deity || '',
        age: details.age || '',
        gender,
        height: details.height || '',
        weight: details.weight || '',
        xp,
        bio: details.biography?.value?.replace(/<[^>]*>?/gm, '').trim() || '',

        // Combate
        hp_max: sys.attributes?.hp?.max ?? 10,
        hp_current: sys.attributes?.hp?.value ?? 10,
        bab: sys.attributes?.bab?.total ?? 0,
        speed: sys.attributes?.speed?.land?.total ?? 9,
        initiative_misc: sys.attributes?.init?.bonus ?? 0,

        // Saves
        save_fort: sys.attributes?.savingThrows?.fort?.total ?? 0,
        save_ref: sys.attributes?.savingThrows?.ref?.total ?? 0,
        save_will: sys.attributes?.savingThrows?.will?.total ?? 0,

        // Atributos, CA, Perícias, Talentos, Equipamentos, Condições
        attributes,
        ac,
        skills,
        feats,
        equipment,
        conditions,
    }
}
