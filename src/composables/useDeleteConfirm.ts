import { ref } from 'vue'

export function useDeleteConfirm(onDelete: (type: string, index: number) => void | Promise<void>) {
    const isDeleteOpen = ref(false)
    const deleteCountdown = ref(0)
    const itemToDelete = ref<{ type: string; index: number } | null>(null)
    let deleteTimer: any = null

    function confirmDelete(type: string, index: number) {
        itemToDelete.value = { type, index }
        isDeleteOpen.value = true
        deleteCountdown.value = 2
        if (deleteTimer) clearInterval(deleteTimer)
        deleteTimer = setInterval(() => {
            deleteCountdown.value--
            if (deleteCountdown.value <= 0) {
                clearInterval(deleteTimer)
            }
        }, 1000)
    }

    async function executeDelete() {
        if (!itemToDelete.value || deleteCountdown.value > 0) return
        const { type, index } = itemToDelete.value

        await onDelete(type, index)

        isDeleteOpen.value = false
        itemToDelete.value = null
    }

    function cancelDelete() {
        isDeleteOpen.value = false
        itemToDelete.value = null
        if (deleteTimer) clearInterval(deleteTimer)
    }

    return {
        isDeleteOpen,
        deleteCountdown,
        itemToDelete,
        confirmDelete,
        executeDelete,
        cancelDelete
    }
}
