import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Sheet, SheetData } from '@/types/sheet'
import { defaultBonuses } from '@/lib/sheetDefaults'

export function useSheet() {
    const sheet = ref<Sheet | null>(null)
    const loading = ref(false)
    const saving = ref(false)

    async function fetchSheet(id: string) {
        if (!id) return
        loading.value = true
        try {
            const { data, error } = await supabase.from('sheets').select('*').eq('id', id).maybeSingle()
            if (error) throw error

            if (!data) {
                console.warn('Ficha não encontrada no banco.')
                return
            }

            if (data) {
                if (!data.data.bonuses) data.data.bonuses = defaultBonuses()
                if (!data.data.feats) data.data.feats = []
                if (!data.data.spells) data.data.spells = []
                if (!data.data.equipment) data.data.equipment = []
                sheet.value = data
            }
        } catch (error) {
            console.error('Error fetching sheet:', error)
            throw error
        } finally {
            loading.value = false
        }
    }

    async function saveSheetMeta(id: string, meta: { name: string, class: string, level: number, race: string }) {
        if (!id) return
        saving.value = true
        try {
            const { error } = await supabase.from('sheets').update(meta).eq('id', id)
            if (error) throw error
        } finally {
            saving.value = false
        }
    }

    async function saveSheetData(id: string, data: SheetData) {
        if (!id) return
        saving.value = true
        try {
            const { error } = await supabase.from('sheets').update({ data }).eq('id', id)
            if (error) throw error
        } finally {
            saving.value = false
        }
    }

    return {
        sheet,
        loading,
        saving,
        fetchSheet,
        saveSheetMeta,
        saveSheetData
    }
}
