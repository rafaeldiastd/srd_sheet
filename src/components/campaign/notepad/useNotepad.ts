import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useDebounceFn } from '@vueuse/core'

export interface NoteItem {
    id: string
    title: string
    content: Record<string, any>
    parent_id: string | null
    is_folder: boolean
    sort_order: number
    created_at: string
    updated_at: string
}

export interface TreeNode {
    item: NoteItem
    children: TreeNode[]
}

export function useNotepad(campaignId: string) {
    const items = ref<NoteItem[]>([])
    const activeNoteId = ref<string | null>(null)
    const expandedFolders = ref<Set<string>>(new Set())
    const loading = ref(true)
    const saving = ref(false)

    const tree = computed(() => buildTree(items.value, null))

    const activeNote = computed(() =>
        items.value.find(i => i.id === activeNoteId.value) ?? null
    )

    function buildTree(allItems: NoteItem[], parentId: string | null): TreeNode[] {
        return allItems
            .filter(i => i.parent_id === parentId)
            .sort((a, b) => a.sort_order - b.sort_order)
            .map(item => ({
                item,
                children: item.is_folder ? buildTree(allItems, item.id) : []
            }))
    }

    async function fetchNotes() {
        loading.value = true
        try {
            const { data: userData } = await supabase.auth.getUser()
            if (!userData.user) throw new Error('User not authenticated')

            const { data, error } = await supabase
                .from('campaign_notes')
                .select('*')
                .eq('campaign_id', campaignId)
                .eq('user_id', userData.user.id)
                .order('sort_order', { ascending: true })

            if (error) throw error
            items.value = data as NoteItem[]
        } catch (e) {
            console.error('Error fetching notes:', e)
        } finally {
            loading.value = false
        }
    }

    async function createNote(parentId: string | null = null): Promise<string | null> {
        try {
            const { data: userData } = await supabase.auth.getUser()
            if (!userData.user) return null

            const siblings = items.value.filter(i => i.parent_id === parentId)
            const maxSort = siblings.length > 0 ? Math.max(...siblings.map(s => s.sort_order)) : -1

            const newNote = {
                campaign_id: campaignId,
                user_id: userData.user.id,
                title: 'Nova Nota',
                content: { type: 'doc', content: [] }, // Default empty tip-tap
                parent_id: parentId,
                is_folder: false,
                sort_order: maxSort + 1
            }

            const { data, error } = await supabase
                .from('campaign_notes')
                .insert(newNote)
                .select()
                .single()

            if (error) throw error

            items.value.push(data)
            activeNoteId.value = data.id
            if (parentId) expandedFolders.value.add(parentId)
            return data.id
        } catch (e) {
            console.error('Error creating note:', e)
            return null
        }
    }

    async function createFolder(parentId: string | null = null): Promise<string | null> {
        try {
            const { data: userData } = await supabase.auth.getUser()
            if (!userData.user) return null

            const siblings = items.value.filter(i => i.parent_id === parentId)
            const maxSort = siblings.length > 0 ? Math.max(...siblings.map(s => s.sort_order)) : -1

            const newFolder = {
                campaign_id: campaignId,
                user_id: userData.user.id,
                title: 'Nova Pasta',
                content: {}, // Folders dont need content
                parent_id: parentId,
                is_folder: true,
                sort_order: maxSort + 1
            }

            const { data, error } = await supabase
                .from('campaign_notes')
                .insert(newFolder)
                .select()
                .single()

            if (error) throw error

            items.value.push(data)
            if (parentId) expandedFolders.value.add(parentId)
            return data.id
        } catch (e) {
            console.error('Error creating folder:', e)
            return null
        }
    }

    const debouncedSave = useDebounceFn(async (id: string, content: object) => {
        saving.value = true
        try {
            const item = items.value.find(i => i.id === id)
            if (item) item.content = content

            const { error } = await supabase
                .from('campaign_notes')
                .update({ content, updated_at: new Date().toISOString() })
                .eq('id', id)

            if (error) throw error
        } catch (e) {
            console.error('Error saving content:', e)
        } finally {
            saving.value = false
        }
    }, 1000)

    async function updateNoteContent(id: string, content: object) {
        const item = items.value.find(i => i.id === id)
        if (item) item.content = content
        saving.value = true
        debouncedSave(id, content)
    }

    async function renameItem(id: string, newTitle: string) {
        const item = items.value.find(i => i.id === id)
        if (item) {
            item.title = newTitle
            try {
                await supabase
                    .from('campaign_notes')
                    .update({ title: newTitle })
                    .eq('id', id)
            } catch (e) {
                console.error('Error renaming:', e)
            }
        }
    }

    async function deleteItem(id: string) {
        // Cascades handles db, do local changes
        function getChildrenIds(currentId: string): string[] {
            const children = items.value.filter(i => i.parent_id === currentId).map(i => i.id)
            return children.concat(...children.flatMap(getChildrenIds))
        }
        const toDeleteIds = [id, ...getChildrenIds(id)]

        items.value = items.value.filter(i => !toDeleteIds.includes(i.id))
        if (activeNoteId.value && toDeleteIds.includes(activeNoteId.value)) {
            activeNoteId.value = null
        }

        try {
            await supabase.from('campaign_notes').delete().eq('id', id)
        } catch (e) {
            console.error('Error deleting:', e)
        }
    }

    function isDescendant(potentialParentId: string, itemId: string): boolean {
        let current = items.value.find(i => i.id === potentialParentId)
        while (current) {
            if (current.id === itemId) return true
            current = items.value.find(i => i.id === current!.parent_id)
        }
        return false
    }

    async function moveItem(itemId: string, newParentId: string | null, newSortOrder: number) {
        if (itemId === newParentId) return
        if (newParentId && isDescendant(newParentId, itemId)) return // Prevent loop

        const item = items.value.find(i => i.id === itemId)
        if (!item) return

        const oldSiblings = items.value.filter(i => i.parent_id === item.parent_id && i.id !== itemId)
        oldSiblings.sort((a, b) => a.sort_order - b.sort_order)
        oldSiblings.forEach((sib, index) => { sib.sort_order = index })

        const newSiblings = items.value.filter(i => i.parent_id === newParentId && i.id !== itemId)
        newSiblings.sort((a, b) => a.sort_order - b.sort_order)
        newSiblings.splice(newSortOrder, 0, item)
        newSiblings.forEach((sib, index) => { sib.sort_order = index })

        item.parent_id = newParentId

        try {
            const updates = [
                ...oldSiblings.map(s => ({ id: s.id, sort_order: s.sort_order })),
                ...newSiblings.map(s => ({ id: s.id, parent_id: s.parent_id, sort_order: s.sort_order }))
            ]

            for (const update of updates) {
                await supabase.from('campaign_notes').update(update).eq('id', update.id)
            }
        } catch (e) {
            console.error('Error moving:', e)
        }
    }

    async function reorderItems(parentId: string | null, orderedIds: string[]) {
        const updates: { id: string, sort_order: number }[] = []
        orderedIds.forEach((id, index) => {
            const item = items.value.find(i => i.id === id)
            if (item) {
                item.sort_order = index
                item.parent_id = parentId
                updates.push({ id, sort_order: index })
            }
        })

        try {
            for (const update of updates) {
                await supabase.from('campaign_notes').update({ sort_order: update.sort_order, parent_id: parentId }).eq('id', update.id)
            }
        } catch (e) {
            console.error('Error reordering:', e)
        }
    }

    function selectNote(id: string) {
        const item = items.value.find(i => i.id === id)
        if (item && !item.is_folder) {
            activeNoteId.value = id
        }
    }

    function toggleFolder(id: string) {
        if (expandedFolders.value.has(id)) {
            expandedFolders.value.delete(id)
        } else {
            expandedFolders.value.add(id)
        }
    }

    return {
        items, tree, activeNote, activeNoteId,
        expandedFolders, loading, saving,
        fetchNotes, createNote, createFolder,
        updateNoteContent, renameItem, deleteItem,
        moveItem, reorderItems, debouncedSave,
        selectNote, toggleFolder
    }
}
