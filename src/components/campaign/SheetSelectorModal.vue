<script setup lang="ts">

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, UserPlus, FileText, Trash2 } from 'lucide-vue-next'
import { useRouter, useRoute } from 'vue-router'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

const props = defineProps<{
    modelValue: boolean
    sheets: any[]
    activeSheetId: string | null
}>()

const emit = defineEmits(['update:modelValue', 'select-sheet', 'sheet-deleted'])
const router = useRouter()
const route = useRoute()

const deletingSheetId = ref<string | null>(null)
const confirmingDeleteId = ref<string | null>(null)

function close() {
    confirmingDeleteId.value = null
    emit('update:modelValue', false)
}

function selectSheet(sheetId: string) {
    if (confirmingDeleteId.value) {
        confirmingDeleteId.value = null
        return
    }
    emit('select-sheet', sheetId)
}

function createNewSheet() {
    router.push({ path: '/create', query: { campaignId: route.params.id } })
}

// Extract avatar safely
function getAvatar(sheet: any): string | null {
    if (!sheet?.data) return null
    if (typeof sheet.data === 'string') {
        try {
            const parsed = JSON.parse(sheet.data)
            return parsed.avatar_url || null
        } catch { return null }
    }
    return sheet.data.avatar_url || null
}

function requestDelete(e: Event, sheetId: string) {
    e.stopPropagation()
    if (confirmingDeleteId.value === sheetId) return
    confirmingDeleteId.value = sheetId
}

async function executeDelete(e: Event, sheet: any) {
    e.stopPropagation()
    deletingSheetId.value = sheet.id

    // If this is the active sheet, deselect first
    if (props.activeSheetId === sheet.id) {
        emit('select-sheet', 'none')
    }

    const { error } = await supabase.from('sheets').delete().eq('id', sheet.id)
    if (error) {
        alert('Erro ao excluir ficha: ' + error.message)
    } else {
        emit('sheet-deleted', sheet.id)
    }
    deletingSheetId.value = null
    confirmingDeleteId.value = null
}

function cancelDelete(e: Event) {
    e.stopPropagation()
    confirmingDeleteId.value = null
}
</script>

<template>
    <div v-if="modelValue" class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
        @click.self="close">
        <div class="w-full max-w-3xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <!-- Header -->
            <div class="px-6 py-4 border-b border-border flex items-center justify-between bg-card/50">
                <div>
                    <h2 class="text-xl font-serif font-bold text-primary">Trocar Ficha Ativa</h2>
                    <p class="text-sm text-muted-foreground mt-1">
                        Selecione a ficha que você deseja usar nesta sessão da campanha.
                    </p>
                </div>
                <Button variant="ghost" size="icon" @click="close" class="h-8 w-8 text-muted-foreground hover:text-foreground">
                    <X class="w-5 h-5" />
                </Button>
            </div>

            <!-- Content -->
            <div class="p-6 overflow-y-auto max-h-[70vh]">
                <div v-if="sheets.length === 0" class="text-center py-12 px-4">
                    <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted text-muted-foreground mb-4">
                        <FileText class="w-8 h-8" />
                    </div>
                    <h3 class="text-lg font-medium text-foreground mb-2">Nenhuma Ficha Disponível</h3>
                    <p class="text-muted-foreground mb-6 max-w-sm mx-auto">
                        Você não possui fichas criadas, ou todas as suas fichas já estão vinculadas a outras campanhas.
                    </p>
                    <Button @click="createNewSheet" class="gap-2">
                        <UserPlus class="w-4 h-4" /> Criar Nova Ficha
                    </Button>
                </div>

                <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <!-- Espectador Card -->
                    <Card
                        class="cursor-pointer transition-all duration-200 hover:border-primary/50 overflow-hidden relative group h-full bg-muted/40"
                        :class="activeSheetId === 'none' ? 'ring-2 ring-primary border-primary' : 'border-border'"
                        @click="selectSheet('none')"
                    >
                        <CardContent class="p-0 h-full flex flex-col">
                            <div class="flex-1 flex flex-col items-center justify-center p-6 text-center min-h-[160px]">
                                <div class="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                                    <FileText class="w-8 h-8 text-muted-foreground" />
                                </div>
                                <h3 class="font-bold text-lg text-foreground">Modo Espectador</h3>
                                <p class="text-xs text-muted-foreground mt-1">Acompanhe a campanha sem uma ficha ativa.</p>
                            </div>
                            
                            <div v-if="activeSheetId === 'none'" class="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-md">
                                Selecionado
                            </div>
                        </CardContent>
                    </Card>

                    <!-- Player Sheets -->
                    <Card v-for="sheet in sheets" :key="sheet.id"
                        class="transition-all duration-200 overflow-hidden relative group h-full"
                        :class="[
                            activeSheetId === sheet.id ? 'ring-2 ring-primary border-primary bg-primary/5' : 'border-border bg-card',
                            confirmingDeleteId === sheet.id
                                ? 'cursor-default hover:border-red-800/60'
                                : 'cursor-pointer hover:border-primary/50'
                        ]"
                        @click="selectSheet(sheet.id)"
                    >
                        <CardContent class="p-0 h-full flex flex-col relative">
                            <!-- Avatar Banner -->
                            <div class="h-28 w-full bg-muted relative overflow-hidden">
<template v-if="getAvatar(sheet)">
                                    <img :src="getAvatar(sheet) as string" :alt="sheet.name" class="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105" />
                                    <!-- Gradient Overlay -->
                                    <div class="absolute inset-0 bg-gradient-to-t from-card to-transparent"></div>
                                </template>
                                <template v-else>
                                    <div class="w-full h-full flex items-center justify-center bg-muted text-muted">
                                        <FileText class="w-12 h-12" />
                                    </div>
                                    <div class="absolute inset-0 bg-gradient-to-t from-card to-transparent"></div>
                                </template>

                                <!-- Badge (Selected) -->
                                <div v-if="activeSheetId === sheet.id" class="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-md z-10">
                                    Ativa
                                </div>
                            </div>

                            <!-- Delete button (top-right) — OUTSIDE overflow-hidden banner -->
                            <div class="absolute top-2 right-2 z-30">
                                <button
                                    v-if="confirmingDeleteId !== sheet.id"
                                    @click.stop="requestDelete($event, sheet.id)"
                                    class="w-7 h-7 rounded-full bg-card/90 border border-border flex items-center justify-center text-muted-foreground hover:text-red-400 hover:border-red-700/60 hover:bg-red-950/60 transition-all opacity-0 group-hover:opacity-100 shadow-md"
                                    title="Excluir ficha"
                                >
                                    <Trash2 class="w-3.5 h-3.5" />
                                </button>
                            </div>

                            <!-- Sheet Info -->
                            <div class="p-4 flex-1 flex flex-col z-10 -mt-6 relative">
                                <h3 class="font-bold text-lg truncate drop-shadow-md text-foreground mb-1">{{ sheet.name }}</h3>
                                <div class="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span class="bg-muted px-2 py-0.5 rounded capitalize">{{ sheet.class }}</span>
                                    <span>Nível {{ sheet.level }}</span>
                                </div>
                            </div>

                            <!-- Delete confirmation overlay — z-20 to be above sheet info z-10 -->
                            <Transition name="fade">
                                <div v-if="confirmingDeleteId === sheet.id"
                                    class="absolute inset-0 bg-card/97 flex flex-col items-center justify-center gap-3 p-4 z-20 rounded-[inherit]">
                                    <div class="w-10 h-10 rounded-full bg-red-950/60 border border-red-800/50 flex items-center justify-center">
                                        <Trash2 class="w-5 h-5 text-red-400" />
                                    </div>
                                    <div class="text-center">
                                        <p class="text-sm font-bold text-foreground">Excluir ficha?</p>
                                        <p class="text-[11px] text-muted-foreground mt-0.5 max-w-[160px]">{{ sheet.name }}</p>
                                    </div>
                                    <div class="flex gap-2 w-full">
                                        <button @click.stop="cancelDelete($event)"
                                            class="flex-1 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors text-xs">
                                            Cancelar
                                        </button>
                                        <button @click.stop="executeDelete($event, sheet)"
                                            :disabled="deletingSheetId === sheet.id"
                                            class="flex-1 py-1.5 rounded-lg bg-red-900/70 border border-red-800/50 text-red-300 hover:bg-red-800/80 transition-colors text-xs font-bold disabled:opacity-50">
                                            {{ deletingSheetId === sheet.id ? '...' : 'Excluir' }}
                                        </button>
                                    </div>
                                </div>
                            </Transition>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <!-- Footer -->
            <div class="px-6 py-4 border-t border-border bg-card/50 flex justify-end">
                <Button v-if="sheets.length > 0" variant="outline" @click="createNewSheet" class="gap-2 text-xs border-border hover:bg-muted">
                    <UserPlus class="w-3.5 h-3.5" /> Criar Extra
                </Button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
    transition: opacity 0.15s ease;
}
.fade-enter-from, .fade-leave-to {
    opacity: 0;
}
</style>

