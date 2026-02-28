import { ref, type Ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { DiceRoller } from '@dice-roller/rpg-dice-roller'

export interface SpellData {
    title: string
    spellLevel: number
    school?: string
    description?: string
    isAttack?: boolean
    attackFormula?: string
    damageFormula?: string
    rollFormula?: string  // para efeitos não-ataque (cura, etc)
}

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

    async function sendSpellMessage(spell: SpellData): Promise<string | null> {
        if (rolling.value) return null
        rolling.value = true

        const isWhisper = recipientId.value !== 'all'
        let attackResult = null

        if (spell.isAttack && spell.attackFormula) {
            attackResult = evaluateFormula(spell.attackFormula)
        }

        const payload: any = {
            label: spell.title,
            spell_level: spell.spellLevel,
            school: spell.school,
            description: spell.description,
            is_attack: spell.isAttack || false,
        }

        if (spell.isAttack && spell.attackFormula && spell.damageFormula) {
            payload.attack = attackResult ? {
                formula: spell.attackFormula,
                result: attackResult.result,
                breakdown: attackResult.breakdown
            } : null
            payload.damage = null
            payload.damage_formula = spell.damageFormula
            payload.damage_pending = true
        } else if (spell.rollFormula) {
            payload.has_roll = true
            payload.roll = null
            payload.roll_formula = spell.rollFormula
            payload.roll_pending = true
        }

        if (isWhisper) {
            payload.target_id = recipientId.value
            payload.is_roll = true
        }

        const content = JSON.stringify(payload)

        const { data, error } = await supabase.from('messages').insert({
            campaign_id: campaignId,
            user_id: authStore.user?.id ?? null,
            sender_name: memberName.value,
            character_name: memberName.value,
            avatar_url: avatarUrl?.value || null,
            content,
            type: isWhisper ? 'whisper' : 'spell',
        }).select('id').single()

        if (error) console.error('Error sending spell message:', error)

        rolling.value = false
        return data?.id || null
    }

    async function rollSpellEffect(messageId: string, formula: string, isAttack: boolean): Promise<void> {
        if (rolling.value) return
        rolling.value = true

        const { data: msgToUpdate, error: fetchError } = await supabase
            .from('messages')
            .select('*')
            .eq('id', messageId)
            .single()

        if (fetchError || !msgToUpdate) {
            console.error('Could not find message to update for spell roll', fetchError)
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

        const effectResult = evaluateFormula(formula)
        let payload = { ...parsedContent }

        if (isAttack) {
            payload.damage = {
                formula: formula,
                result: effectResult.result,
                breakdown: effectResult.breakdown
            }
            payload.damage_pending = false
        } else {
            payload.roll = {
                formula: formula,
                result: effectResult.result,
                breakdown: effectResult.breakdown
            }
            payload.roll_pending = false
        }

        const { error } = await supabase.from('messages').update({
            content: JSON.stringify(payload)
        }).eq('id', messageId)

        if (error) console.error('Error updating spell effect roll:', error)
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
        sendSpellMessage,
        rollSpellEffect,
        evaluateFormula,
        deleteMessage,
        modStr
    }
}
