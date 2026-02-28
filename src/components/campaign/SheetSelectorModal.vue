<script setup lang="ts">

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, UserPlus, FileText } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

const props = defineProps<{
    modelValue: boolean
    sheets: any[]
    activeSheetId: string | null
}>()

const emit = defineEmits(['update:modelValue', 'select-sheet'])
const router = useRouter()

function close() {
    emit('update:modelValue', false)
}

function selectSheet(sheetId: string) {
    emit('select-sheet', sheetId)
}

import { useRoute } from 'vue-router'

const route = useRoute()

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
</script>

<template>
    <div v-if="modelValue" class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
        @click.self="close">
        <div class="w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <!-- Header -->
            <div class="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
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
                    <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-900 text-zinc-500 mb-4">
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
                        class="cursor-pointer transition-all duration-200 hover:border-primary/50 overflow-hidden relative group h-full bg-zinc-900/40"
                        :class="activeSheetId === 'none' ? 'ring-2 ring-primary border-primary' : 'border-zinc-800'"
                        @click="selectSheet('none')"
                    >
                        <CardContent class="p-0 h-full flex flex-col">
                            <div class="flex-1 flex flex-col items-center justify-center p-6 text-center min-h-[160px]">
                                <div class="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mb-3">
                                    <FileText class="w-8 h-8 text-zinc-500" />
                                </div>
                                <h3 class="font-bold text-lg text-zinc-300">Modo Espectador</h3>
                                <p class="text-xs text-muted-foreground mt-1">Acompanhe a campanha sem uma ficha ativa.</p>
                            </div>
                            
                            <div v-if="activeSheetId === 'none'" class="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-md">
                                Selecionado
                            </div>
                        </CardContent>
                    </Card>

                    <!-- Player Sheets -->
                    <Card v-for="sheet in sheets" :key="sheet.id"
                        class="cursor-pointer transition-all duration-200 hover:border-primary/50 overflow-hidden relative group h-full"
                        :class="activeSheetId === sheet.id ? 'ring-2 ring-primary border-primary bg-primary/5' : 'border-zinc-800 bg-zinc-950'"
                        @click="selectSheet(sheet.id)"
                    >
                        <CardContent class="p-0 h-full flex flex-col">
                            <!-- Avatar Banner -->
                            <div class="h-28 w-full bg-zinc-900 relative overflow-hidden">
<template v-if="getAvatar(sheet)">
                                    <img :src="getAvatar(sheet) as string" :alt="sheet.name" class="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105" />
                                    <!-- Gradient Overlay -->
                                    <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent"></div>
                                </template>
                                <template v-else>
                                    <div class="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-800">
                                        <FileText class="w-12 h-12" />
                                    </div>
                                    <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent"></div>
                                </template>

                                <!-- Badge (Selected) -->
                                <div v-if="activeSheetId === sheet.id" class="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-md">
                                    Selecionado
                                </div>
                            </div>

                            <!-- Sheet Info -->
                            <div class="p-4 flex-1 flex flex-col z-10 -mt-6 relative">
                                <h3 class="font-bold text-lg truncate drop-shadow-md text-white mb-1">{{ sheet.name }}</h3>
                                <div class="flex items-center gap-2 text-xs text-zinc-400">
                                    <span class="bg-zinc-800 px-2 py-0.5 rounded capitalize">{{ sheet.class }}</span>
                                    <span>Nível {{ sheet.level }}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <!-- Footer -->
            <div class="px-6 py-4 border-t border-zinc-800 bg-zinc-900/50 flex justify-end">
                <Button v-if="sheets.length > 0" variant="outline" @click="createNewSheet" class="gap-2 text-xs border-zinc-700 hover:bg-zinc-800">
                    <UserPlus class="w-3.5 h-3.5" /> Criar Extra
                </Button>
            </div>
        </div>
    </div>
</template>
