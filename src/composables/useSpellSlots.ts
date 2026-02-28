import { ref, watch, type Ref } from 'vue'

const SPELL_LEVELS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

export function useSpellSlots(sheet: Ref<any>) {
    const spellSlotsMax = ref<Record<number, number>>({})
    const spellSlotsUsed = ref<Record<number, number>>({})
    const preparedSpells = ref<Record<number, (string | null)[]>>({})

    // Rastreia quais slots individuais foram gastos (conjurados)
    const spentSlots = ref<Record<number, boolean[]>>({})

    function initSpellSlots() {
        SPELL_LEVELS.forEach(lvl => {
            if (spellSlotsMax.value[lvl] === undefined) spellSlotsMax.value[lvl] = 0
            if (spellSlotsUsed.value[lvl] === undefined) spellSlotsUsed.value[lvl] = 0
            if (!Array.isArray(preparedSpells.value[lvl])) preparedSpells.value[lvl] = []
            if (!Array.isArray(spentSlots.value[lvl])) spentSlots.value[lvl] = []
        })
    }

    function loadFromData(newData: any) {
        if (!newData) return

        spellSlotsMax.value = { ...(newData.spellSlotsMax ?? {}) }
        spellSlotsUsed.value = { ...(newData.spellSlotsUsed ?? {}) }

        // Clona preparedSpells
        const raw = newData.preparedSpells ?? {}
        const cloned: Record<number, (string | null)[]> = {}
        for (const key of Object.keys(raw)) {
            cloned[Number(key)] = Array.isArray(raw[key]) ? [...raw[key]] : []
        }
        preparedSpells.value = cloned

        // Clona spentSlots
        const rawSpent = newData.spentSlots ?? {}
        const clonedSpent: Record<number, boolean[]> = {}
        for (const key of Object.keys(rawSpent)) {
            clonedSpent[Number(key)] = Array.isArray(rawSpent[key]) ? [...rawSpent[key]] : []
        }
        spentSlots.value = clonedSpent

        initSpellSlots()
    }

    // ── Slot count helpers ─────────────────────────────────────────────────
    function adjustSlotUsed(level: number, delta: number) {
        const max = spellSlotsMax.value[level] ?? 0
        const cur = spellSlotsUsed.value[level] ?? 0
        spellSlotsUsed.value[level] = Math.max(0, Math.min(max, cur + delta))
    }

    function adjustSlotMax(level: number, delta: number) {
        const cur = spellSlotsMax.value[level] ?? 0
        const newMax = Math.max(0, cur + delta)
        spellSlotsMax.value[level] = newMax
        if ((spellSlotsUsed.value[level] ?? 0) > newMax) spellSlotsUsed.value[level] = newMax

        // Redimensiona preparedSpells
        if (!Array.isArray(preparedSpells.value[level])) preparedSpells.value[level] = []
        const arr = preparedSpells.value[level]
        if (arr.length < newMax) {
            preparedSpells.value[level] = [...arr, ...Array(newMax - arr.length).fill(null)]
        } else if (arr.length > newMax) {
            preparedSpells.value[level] = arr.slice(0, newMax)
        }

        // Redimensiona spentSlots
        if (!Array.isArray(spentSlots.value[level])) spentSlots.value[level] = []
        const sp = spentSlots.value[level]
        if (sp.length < newMax) {
            spentSlots.value[level] = [...sp, ...Array(newMax - sp.length).fill(false)]
        } else if (sp.length > newMax) {
            spentSlots.value[level] = sp.slice(0, newMax)
        }
    }

    // ── Prepared spells ────────────────────────────────────────────────────
    function setPreparedSpell(level: number, slotIndex: number, spellId: string | null) {
        const maxSlots = spellSlotsMax.value[level] ?? 0

        if (!Array.isArray(preparedSpells.value[level])) {
            preparedSpells.value[level] = Array(maxSlots).fill(null)
        }
        const arr = [...preparedSpells.value[level]]
        while (arr.length < maxSlots) arr.push(null)

        if (slotIndex >= 0 && slotIndex < arr.length) {
            arr[slotIndex] = spellId
            preparedSpells.value[level] = arr
            // Se está limpando o slot manualmente, recupera-o automaticamente
            if (spellId === null) _recoverInternal(level, slotIndex)
        }
    }

    function clearAllPreparedSpells() {
        const result: Record<number, (string | null)[]> = {}
        for (const key of Object.keys(preparedSpells.value)) {
            const lv = Number(key)
            result[lv] = Array.isArray(preparedSpells.value[lv])
                ? preparedSpells.value[lv].map(() => null)
                : []
        }
        preparedSpells.value = result
        recoverAllSlots()
    }

    // ── Spent slots ────────────────────────────────────────────────────────
    function _ensureSpentArray(level: number) {
        const max = spellSlotsMax.value[level] ?? 0
        if (!Array.isArray(spentSlots.value[level])) spentSlots.value[level] = Array(max).fill(false)
        while (spentSlots.value[level].length < max) spentSlots.value[level].push(false)
    }

    function _recoverInternal(level: number, slotIndex: number) {
        _ensureSpentArray(level)
        const arr = [...(spentSlots.value[level] ?? [])]
        if (slotIndex >= 0 && slotIndex < arr.length && arr[slotIndex]) {
            arr[slotIndex] = false
            spentSlots.value[level] = arr
            spellSlotsUsed.value[level] = Math.max(0, (spellSlotsUsed.value[level] ?? 1) - 1)
        }
    }

    /** Marca um slot como gasto (conjuração usada). A magia permanece preparada. */
    function spendSlot(level: number, slotIndex: number) {
        _ensureSpentArray(level)
        const arr = [...(spentSlots.value[level] ?? [])]
        if (slotIndex >= 0 && slotIndex < arr.length && !arr[slotIndex]) {
            arr[slotIndex] = true
            spentSlots.value[level] = arr
            const max = spellSlotsMax.value[level] ?? 0
            spellSlotsUsed.value[level] = Math.min(max, (spellSlotsUsed.value[level] ?? 0) + 1)
        }
    }

    /** Recupera um slot individual (p. ex. via descanso curto ou botão manual). */
    function recoverSlot(level: number, slotIndex: number) {
        _recoverInternal(level, slotIndex)
    }

    /** Recupera todos os slots (descanso longo). */
    function recoverAllSlots() {
        const result: Record<number, boolean[]> = {}
        for (const key of Object.keys(spentSlots.value)) {
            const lv = Number(key)
            result[lv] = (spentSlots.value[lv] ?? []).map(() => false)
        }
        spentSlots.value = result
        SPELL_LEVELS.forEach(lvl => { spellSlotsUsed.value[lvl] = 0 })
    }

    function isSlotSpent(level: number, slotIndex: number): boolean {
        return spentSlots.value[level]?.[slotIndex] === true
    }

    // ── Snapshots para salvar no banco ─────────────────────────────────────
    function snapshotPreparedSpells(): Record<number, (string | null)[]> {
        const snap: Record<number, (string | null)[]> = {}
        for (const key of Object.keys(preparedSpells.value)) {
            const num = Number(key)
            snap[num] = Array.isArray(preparedSpells.value[num]) ? [...preparedSpells.value[num]] : []
        }
        return snap
    }

    function snapshotSpentSlots(): Record<number, boolean[]> {
        const snap: Record<number, boolean[]> = {}
        for (const key of Object.keys(spentSlots.value)) {
            const num = Number(key)
            snap[num] = Array.isArray(spentSlots.value[num]) ? [...spentSlots.value[num]] : []
        }
        return snap
    }

    watch(
        () => sheet.value?.data,
        (newData) => { loadFromData(newData) },
        { immediate: true, deep: false }
    )

    return {
        SPELL_LEVELS,
        spellSlotsMax,
        spellSlotsUsed,
        preparedSpells,
        spentSlots,
        initSpellSlots,
        adjustSlotUsed,
        adjustSlotMax,
        setPreparedSpell,
        clearAllPreparedSpells,
        spendSlot,
        recoverSlot,
        recoverAllSlots,
        isSlotSpent,
        snapshotPreparedSpells,
        snapshotSpentSlots,
    }
}
