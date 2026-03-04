import { computed, type ComputedRef } from 'vue'
import type { SheetData, Modifier } from '@/types/sheet'
import { defaultBonuses } from '@/lib/sheetDefaults'

export function useDndCalculations(
    d: ComputedRef<SheetData | null | undefined>
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
            if (f.active) {
                f.activeModifiers?.forEach((m: Modifier) => bonuses[m.target] = (bonuses[m.target] || 0) + (Number(m.value) || 0))
            }
        })

        d.value?.shortcuts?.forEach((s: any) => {
            s.modifiers?.forEach((m: Modifier) => bonuses[m.target] = (bonuses[m.target] || 0) + (Number(m.value) || 0))
            if (s.active) {
                s.activeModifiers?.forEach((m: Modifier) => bonuses[m.target] = (bonuses[m.target] || 0) + (Number(m.value) || 0))
            }
        })
        d.value?.equipment?.forEach((item: any) => {
            if (typeof item === 'string') return
            if (item.equipped) {
                item.modifiers?.forEach((m: Modifier) => bonuses[m.target] = (bonuses[m.target] || 0) + (Number(m.value) || 0))
                if (item.active) {
                    item.activeModifiers?.forEach((m: Modifier) => bonuses[m.target] = (bonuses[m.target] || 0) + (Number(m.value) || 0))
                }
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

    const acData = computed(() => d.value?.ac)

    const totalCA = computed(() => {
        if (!d.value) return 10
        const base = 10
        const armor = Number(acData.value?.armor ?? 0)
        const shield = Number(acData.value?.shield ?? 0)
        const natural = Number(acData.value?.natural ?? 0)
        const deflection = Number(acData.value?.deflection ?? 0)
        const size = Number(sizeMod.value)
        const misc = Number(acData.value?.misc ?? 0)

        let dexBonus = calcMod(attrTotal('dex'))
        // Condition: Prone (-4 AC against ranged, but that's situational, usually handled by GM or specific UI)
        // Here we can apply static penalties
        if (d.value.conditions?.entangled) dexBonus -= 2

        const buffBonus = Number(totalBonuses.value['CA'] ?? 0) + Number(b.value?.ca ?? 0)

        return base + armor + shield + natural + deflection + size + misc + dexBonus + buffBonus
    })

    const totalTouch = computed(() => {
        if (!d.value) return 10
        const base = 10
        const deflection = Number(acData.value?.deflection ?? 0)
        const size = Number(sizeMod.value)
        const misc = Number(acData.value?.misc ?? 0)

        let dexBonus = calcMod(attrTotal('dex'))
        if (d.value.conditions?.entangled) dexBonus -= 2

        const buffBonus = Number(totalBonuses.value['toque'] ?? 0)

        return base + deflection + size + misc + dexBonus + buffBonus
    })

    const totalFlatFooted = computed(() => {
        if (!d.value) return 10
        const base = 10
        const armor = Number(acData.value?.armor ?? 0)
        const shield = Number(acData.value?.shield ?? 0)
        const natural = Number(acData.value?.natural ?? 0)
        const deflection = Number(acData.value?.deflection ?? 0)
        const size = Number(sizeMod.value)
        const misc = Number(acData.value?.misc ?? 0)

        // No Dex bonus when flat-footed
        const buffBonus = Number(totalBonuses.value['surpreso'] ?? 0)

        return base + armor + shield + natural + deflection + size + misc + buffBonus
    })

    const totalBAB = computed(() => Number(d.value?.bab || 0) + Number(totalBonuses.value.bab || 0) + Number(b.value?.bab ?? 0))
    const totalInitiative = computed(() => calcMod(attrTotal('dex')) + Number(d.value?.initiative_misc || 0) + Number(totalBonuses.value.iniciativa || 0) + Number(b.value?.initiative ?? 0))
    const totalHP = computed(() => Number(d.value?.hp_max || 0) + Number(totalBonuses.value.hp || 0) + Number(b.value?.hp ?? 0))
    const totalSpeed = computed(() => Number(d.value?.speed ?? 9) + Number(totalBonuses.value.speed || 0) + Number(b.value?.speed ?? 0))

    const meleeAtk = computed(() => Number(totalBAB.value) + calcMod(attrTotal('str')) + Number(sizeMod.value) + Number(totalBonuses.value.melee || 0))
    const rangedAtk = computed(() => Number(totalBAB.value) + calcMod(attrTotal('dex')) + Number(sizeMod.value) + Number(totalBonuses.value.ranged || 0))
    const grappleAtk = computed(() => Number(totalBAB.value) + calcMod(attrTotal('str')) + (Number(sizeMod.value) * 4) + Number(totalBonuses.value.grapple || 0))

    const totalFort = computed(() => Number(d.value?.save_fort || 0) + calcMod(attrTotal('con')) + Number(totalBonuses.value.fort || 0) + Number(b.value?.saves?.fort ?? 0))
    const totalRef = computed(() => Number(d.value?.save_ref || 0) + calcMod(attrTotal('dex')) + Number(totalBonuses.value.ref || 0) + Number(b.value?.saves?.ref ?? 0))
    const totalWill = computed(() => Number(d.value?.save_will || 0) + calcMod(attrTotal('wis')) + Number(totalBonuses.value.will || 0) + Number(b.value?.saves?.will ?? 0))

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
            const qty = Number(item.quantity) || 1
            return sum + ((Number(item.weight) || 0) * qty)
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
