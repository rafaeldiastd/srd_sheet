<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { X, Key } from 'lucide-vue-next'

const emit = defineEmits(['close'])
const router = useRouter()
const authStore = useAuthStore()

const code = ref('')
const loading = ref(false)
const error = ref('')
const sheets = ref<any[]>([])
const selectedSheetId = ref<string>('')
const step = ref<'code' | 'sheet'>('code')
const pendingCampaign = ref<any>(null)

async function fetchMySheets() {
    const { data } = await supabase.from('sheets').select('id, name, class, level').order('name')
    if (data) sheets.value = data
}

async function verifyCode() {
    if (!code.value.trim()) return
    loading.value = true
    error.value = ''

    // 1. Find Campaign
    const { data: campaign, error: findError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('join_code', code.value.trim().toUpperCase())
        .single()

    if (findError || !campaign) {
        error.value = 'Campanha não encontrada. Verifique o código.'
        loading.value = false
        return
    }

    // 2. Check if already joined
    const { data: existing } = await supabase
        .from('campaign_members')
        .select('id')
        .eq('campaign_id', campaign.id)
        .eq('user_id', authStore.user?.id)
        .single()

    if (existing) {
        error.value = 'Você já está nessa campanha.'
        router.push(`/campaign/${campaign.id}`)
        emit('close')
        return
    }

    pendingCampaign.value = campaign
    await fetchMySheets()
    loading.value = false
    step.value = 'sheet'
}

async function completeJoin() {
    if (!pendingCampaign.value) return
    loading.value = true

    // 3. Join with Sheet
    const { error: joinError } = await supabase
        .from('campaign_members')
        .insert({
            campaign_id: pendingCampaign.value.id,
            user_id: authStore.user?.id,
            role: 'player',
            sheet_id: selectedSheetId.value || null
        })

    if (joinError) {
        console.error(joinError)
        error.value = 'Erro ao entrar na campanha.'
        loading.value = false
        return
    }

    loading.value = false
    emit('close')
    router.push(`/campaign/${pendingCampaign.value.id}`)
}
</script>

<template>
    <div class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" @click.self="emit('close')">
        <Card class="w-full max-w-md bg-zinc-950 border-zinc-800 animate-in fade-in zoom-in-95 duration-200">
            <CardHeader class="flex flex-row items-center justify-between pb-2">
                <CardTitle class="text-lg flex items-center gap-2">
                    <Key class="w-5 h-5 text-primary" /> Entrar em Campanha
                </CardTitle>
                <Button variant="ghost" size="icon" @click="emit('close')" class="h-8 w-8">
                    <X class="w-4 h-4" />
                </Button>
            </CardHeader>

            <CardContent class="space-y-4 pt-4">
                <template v-if="step === 'code'">
                    <div class="space-y-1">
                        <Label>Código de Convite</Label>
                        <Input v-model="code" placeholder="Ex: X9Y2Z1" class="uppercase font-mono" />
                    </div>
                </template>

                <template v-else>
                    <div class="bg-zinc-900/50 p-3 rounded border border-zinc-800 mb-4">
                        <p class="text-sm font-bold text-primary">{{ pendingCampaign?.name }}</p>
                        <p class="text-xs text-muted-foreground">Mestre: Voc&ecirc;</p> <!-- TODO fetch DM name -->
                    </div>
                    <div class="space-y-1">
                        <Label>Escolha seu Personagem (Opcional)</Label>
                        <Select v-model="selectedSheetId">
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione uma ficha..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem v-for="s in sheets" :key="s.id" :value="s.id">
                                    {{ s.name }} ({{ s.class }} {{ s.level }})
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </template>

                <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
            </CardContent>

            <CardFooter class="flex justify-end gap-2 pt-2">
                <Button variant="ghost" @click="emit('close')">Cancelar</Button>
                <Button v-if="step === 'code'" @click="verifyCode" :disabled="loading || !code.trim()">
                    {{ loading ? 'Verificando...' : 'Próximo' }}
                </Button>
                <Button v-else @click="completeJoin" :disabled="loading">
                    {{ loading ? 'Entrando...' : 'Entrar na Campanha' }}
                </Button>
            </CardFooter>
        </Card>
    </div>
</template>
