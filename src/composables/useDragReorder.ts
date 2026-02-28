import { ref, type Ref } from 'vue'

export function useDragReorder(
    reorderMode: Ref<boolean>,
    onReorder: (type: string, sourceIndex: number, targetIndex: number) => void | Promise<void>
) {
    const dragType = ref('')
    const dragSrcIndex = ref<number | null>(null)
    const dragOverIndex = ref<number | null>(null)

    function onDragStart(e: DragEvent, i: number, type: string) {
        if (!reorderMode.value) return
        dragSrcIndex.value = i
        dragType.value = type
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move'
            e.dataTransfer.setData('index', i.toString())
            e.dataTransfer.setData('type', type)
        }
    }

    function onDragOver(e: DragEvent, i: number, type: string) {
        if (!reorderMode.value || (dragType.value && dragType.value !== type)) return
        e.preventDefault()
        dragOverIndex.value = i
    }

    async function onDrop(e: DragEvent, targetIndex: number, type: string) {
        if (!reorderMode.value || (dragType.value && dragType.value !== type)) return
        e.preventDefault()

        const sourceIndex = parseInt(e.dataTransfer?.getData('index') || '-1')
        const sourceType = e.dataTransfer?.getData('type') || type

        if (sourceIndex === -1 || sourceIndex === targetIndex || sourceType !== type) {
            dragOverIndex.value = null
            return
        }

        await onReorder(type, sourceIndex, targetIndex)

        dragOverIndex.value = null
        dragSrcIndex.value = null
        dragType.value = ''
    }

    function onDragEnd() {
        dragOverIndex.value = null
        dragSrcIndex.value = null
        dragType.value = ''
    }

    return {
        dragType,
        dragSrcIndex,
        dragOverIndex,
        onDragStart,
        onDragOver,
        onDrop,
        onDragEnd
    }
}
