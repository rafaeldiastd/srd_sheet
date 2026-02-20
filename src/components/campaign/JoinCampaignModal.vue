<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { X, Key } from 'lucide-vue-next'

const emit = defineEmits(['close'])
const router = useRouter()
const authStore = useAuthStore()

const code = ref('')
const loading = ref(false)
const error = ref('')

async function joinCampaign() {
    if (!code.value.trim()) return
    loading.value = true
    error.value = ''

    // 1. Find Campaign by join_code
    const { data: campaign, error: findError } = await supabase
        .from('campaigns')
        .select('id, name')
        .eq('join_code', code.value.trim().toUpperCase())
        .maybeSingle()

    if (findError || !campaign) {
        error.value = 'Campanha não encontrada. Verifique o código.'
        loading.value = false
        return
    }

    // 2. Check if already a member
    const { data: existing } = await supabase
        .from('campaign_members')
        .select('id')
        .eq('campaign_id', campaign.id)
        .eq('user_id', authStore.user?.id)
        .maybeSingle()

    if (existing) {
        router.push(`/campaign/${campaign.id}`)
        emit('close')
        return
    }

    // 3. Join (no sheet linked — user picks sheet inside the campaign)
    const { error: joinError } = await supabase
        .from('campaign_members')
        .insert({
            campaign_id: campaign.id,
            user_id: authStore.user?.id,
            role: 'player',
            sheet_id: null
        })

    if (joinError) {
        console.error(joinError)
        error.value = 'Erro ao entrar na campanha.'
        loading.value = false
        return
    }

    loading.value = false
    emit('close')
    router.push(`/campaign/${campaign.id}`)
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
                <div class="space-y-1">
                    <Label>Código de Convite</Label>
                    <Input v-model="code" placeholder="Ex: X9Y2Z1" class="uppercase font-mono"
                        @keyup.enter="joinCampaign" />
                </div>
                <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
            </CardContent>

            <CardFooter class="flex justify-end gap-2 pt-2">
                <Button variant="ghost" @click="emit('close')">Cancelar</Button>
                <Button @click="joinCampaign" :disabled="loading || !code.trim()">
                    {{ loading ? 'Entrando...' : 'Entrar na Campanha' }}
                </Button>
            </CardFooter>
        </Card>
    </div>
</template>
