<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { X, Sword } from 'lucide-vue-next'

const emit = defineEmits(['close'])
const router = useRouter()
const authStore = useAuthStore()

const name = ref('')
const loading = ref(false)
const error = ref('')

function generateCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
}

async function createCampaign() {
    if (!name.value.trim()) return
    loading.value = true
    error.value = ''

    const code = generateCode()

    // 1. Create Campaign
    const { data: campaign, error: createError } = await supabase
        .from('campaigns')
        .insert({
            name: name.value.trim(),
            dm_id: authStore.user?.id,
            join_code: code
        })
        .select()
        .single()

    if (createError) {
        console.error(createError)
        error.value = 'Erro ao criar campanha. Tente novamente.'
        loading.value = false
        return
    }

    // 2. Add DM as member (role 'dm')
    const { error: memberError } = await supabase
        .from('campaign_members')
        .insert({
            campaign_id: campaign.id,
            user_id: authStore.user?.id,
            role: 'dm'
        })

    if (memberError) {
        console.error(memberError)
        error.value = 'Erro ao adicionar mestre. Mas a campanha foi criada.'
        // Might need rollback or manual fix, but for MVP just warn
    }

    loading.value = false
    emit('close')
    router.push(`/campaign/${campaign.id}`)
}
</script>

<template>
    <div class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" @click.self="emit('close')">
        <Card class="w-full max-w-md bg-card border-border animate-in fade-in zoom-in-95 duration-200">
            <CardHeader class="flex flex-row items-center justify-between pb-2">
                <CardTitle class="text-lg flex items-center gap-2">
                    <Sword class="w-5 h-5 text-primary" /> Nova Campanha
                </CardTitle>
                <Button variant="ghost" size="icon" @click="emit('close')" class="h-8 w-8">
                    <X class="w-4 h-4" />
                </Button>
            </CardHeader>

            <CardContent class="space-y-4 pt-4">
                <div class="space-y-1">
                    <Label>Nome da Aventura</Label>
                    <Input v-model="name" placeholder="Ex: A Maldição de Strahd" />
                </div>
                <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
            </CardContent>

            <CardFooter class="flex justify-end gap-2 pt-2">
                <Button variant="ghost" @click="emit('close')">Cancelar</Button>
                <Button @click="createCampaign" :disabled="loading || !name.trim()">
                    {{ loading ? 'Criando...' : 'Criar Campanha' }}
                </Button>
            </CardFooter>
        </Card>
    </div>
</template>
