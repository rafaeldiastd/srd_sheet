import type { ComputedRef } from 'vue'

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
    onAttackRoll?: (label: string, attackFormula: string, damageFormula: string) => void
    onShowDescription?: (title: string, description: string) => void
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

        if (item.isAttack && ctx.onAttackRoll) {
            const atkF = item.attackFormula || '1d20 + @BBA'
            const dmgF = item.damageFormula || '1d8'

            let atkDisplay = atkF
            const bonus = Number(item.attackBonus) || 0
            if (bonus) {
                const bonusStr = bonus >= 0 ? `+${bonus}` : `${bonus}`
                atkDisplay = `${atkDisplay} ${bonusStr}`
            }

            const atkEval = sanitizeFormula(resolveFormula(atkDisplay))
            const dmgEval = sanitizeFormula(resolveFormula(dmgF))

            ctx.onAttackRoll(item.title, atkEval, dmgEval)
        } else {
            handleRoll(item.title, item.rollFormula || '1d20', Number(item.attackBonus) || 0)
        }
    }

    function handleShowDescription(title: string, description: string) {
        if (!description) return
        if (ctx.onShowDescription) {
            ctx.onShowDescription(title, description)
        } else if (ctx.onRoll) {
            ctx.onRoll(title, description)
        }
    }

    return { resolveFormula, handleRoll, handleItemRoll, handleShowDescription }
}
