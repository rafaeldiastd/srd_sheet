import { ref, type Ref } from 'vue'
import type { Sheet, SheetData } from '@/types/sheet'
import { defaultBonuses } from '@/lib/sheetDefaults'

export function useSheetEdit(sheet: Ref<Sheet | null>, onSave: (data: SheetData) => Promise<void>) {
    const editedData = ref<SheetData | null>(null)
    const headEditMode = ref(false)
    const tabsEditMode = ref(false)

    function prepEditData() {
        if (!sheet.value) return
        const copy = JSON.parse(JSON.stringify(sheet.value.data))
        if (!copy.bonuses) copy.bonuses = defaultBonuses()
        if (!copy.feats) copy.feats = []

        if (!copy.shortcuts) copy.shortcuts = []
        if (copy.xp === undefined) copy.xp = 0
        if (!copy.buffs) copy.buffs = []
        if (!copy.hp_max) copy.hp_max = 0
        editedData.value = copy
    }

    async function saveEdit() {
        if (!editedData.value || !sheet.value) return

        // Sync live-saved fields (HP, Recursos, Atalhos) back so they aren't overwritten
        if (sheet.value.data) {
            editedData.value.hp_current = sheet.value.data.hp_current ?? editedData.value.hp_current
            editedData.value.resources = sheet.value.data.resources ?? editedData.value.resources ?? []
            editedData.value.shortcuts = sheet.value.data.shortcuts ?? editedData.value.shortcuts ?? []
        }

        await onSave(editedData.value)

        sheet.value.data = editedData.value
        editedData.value = null
    }

    function toggleHeadEdit(onSaveTrigger?: () => Promise<void>) {
        if (!headEditMode.value) {
            prepEditData()
        } else {
            onSaveTrigger?.()
        }
        headEditMode.value = !headEditMode.value
    }

    function toggleTabsEdit(onSaveTrigger?: () => Promise<void>) {
        if (!tabsEditMode.value) {
            prepEditData()
            // Skill phase reset logic should be handled by the component using this
        } else {
            onSaveTrigger?.()
        }
        tabsEditMode.value = !tabsEditMode.value
    }

    return {
        editedData,
        headEditMode,
        tabsEditMode,
        toggleHeadEdit,
        toggleTabsEdit,
        saveEdit,
        prepEditData
    }
}
