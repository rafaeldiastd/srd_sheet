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
