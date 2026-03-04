<script setup lang="ts">
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Trash2, Plus, Ghost } from 'lucide-vue-next'

const emit = defineEmits<{
    (e: 'close'): void
    (e: 'saved', sheetId: string): void
}>()

const authStore = useAuthStore()

const npc = ref({
    name: '',
    hp: 10,
    ac: 10,
    notes: '',
    attacks: [] as { title: string, attack: string, damage: string }[]
})

const saving = ref(false)

function addAttack() {
    npc.value.attacks.push({ title: 'Ataque Simples', attack: '1d20 + 2', damage: '1d6 + 1' })
}

function removeAttack(i: number) {
    npc.value.attacks.splice(i, 1)
}

async function save() {
    if (!npc.value.name.trim() || saving.value) return
    saving.value = true

    const data = {
        hp_max: npc.value.hp,
        hp_current: npc.value.hp,
        attributes: { str: { base: 10 }, dex: { base: 10 }, con: { base: 10 }, int: { base: 10 }, wis: { base: 10 }, cha: { base: 10 } },
        skills: {},
        saves: {},
        equipment: [],
        feats: [],
        bonuses: {
            ca: npc.value.ac - 10, // Assuming base CA is 10
            fort: 0,
            ref: 0,
            will: 0,
            attributes: {},
            saves: {},
            resistances: {},
            notes: npc.value.notes
        },
        shortcuts: npc.value.attacks.map(a => ({
            title: a.title,
            isAttack: true,
            attackFormula: a.attack,
            damageFormula: a.damage
        }))
    }

    const payload = {
        user_id: authStore.user?.id,
        name: npc.value.name.trim(),
        race: 'Monstro',
        class: 'NPC',
        level: 1,
        data
    }

    const { data: newSheet, error } = await supabase
        .from('sheets')
        .insert(payload)
        .select()
        .single()

    saving.value = false

    if (!error && newSheet) {
        emit('saved', newSheet.id)
    } else {
        console.error('Failed to save NPC:', error)
    }
}
</script>

<template>
    <div class="fixed inset-0 z-50 bg-black/80 flex justify-center p-4 overflow-y-auto">
        <div
            class="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md my-auto flex flex-col max-h-[90vh]">

            <div class="p-4 border-b border-border flex items-center justify-between shrink-0">
                <h2 class="text-lg font-bold flex items-center gap-2">
                    <Ghost class="w-5 h-5 text-primary" /> Criar NPC Rápido
                </h2>
                <button @click="$emit('close')" class="text-muted-foreground hover:text-foreground"></button>
            </div>

            <div class="p-4 space-y-4 overflow-y-auto custom-scrollbar flex-1">

                <div class="space-y-1">
                    <label class="text-xs font-bold text-muted-foreground uppercase">Nome do NPC / Monstro</label>
                    <Input v-model="npc.name" placeholder="Ex: Goblin Arqueiro" class="bg-muted border-border" />
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1">
                        <label class="text-xs font-bold text-muted-foreground uppercase">HP (Pontos de Vida)</label>
                        <Input type="number" v-model.number="npc.hp" class="bg-muted border-border tabular-nums" />
                    </div>
                    <div class="space-y-1">
                        <label class="text-xs font-bold text-muted-foreground uppercase">CA (Classe de Armadura)</label>
                        <Input type="number" v-model.number="npc.ac" class="bg-muted border-border tabular-nums" />
                    </div>
                </div>

                <div class="space-y-2 pt-2">
                    <div class="flex items-center justify-between">
                        <label class="text-xs font-bold text-muted-foreground uppercase">Ataques / Ações</label>
                        <Button size="sm" variant="outline" class="h-6 text-xs" @click="addAttack">
                            <Plus class="w-3 h-3 mr-1" /> Adicionar
                        </Button>
                    </div>

                    <div v-for="(atk, i) in npc.attacks" :key="i"
                        class="p-3 bg-muted/50 border border-border rounded-lg relative space-y-2">
                        <button @click="removeAttack(i)"
                            class="absolute top-2 right-2 text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 class="w-3 h-3" />
                        </button>
                        <Input v-model="atk.title" placeholder="Nome do Ataque (Ex: Arco Curto)"
                            class="bg-card border-border h-8 pr-8 text-sm" />
                        <div class="grid grid-cols-2 gap-2">
                            <Input v-model="atk.attack" placeholder="Ataque (Ex: 1d20+4)"
                                class="bg-card border-border h-8 text-sm font-mono text-amber-500" />
                            <Input v-model="atk.damage" placeholder="Dano (Ex: 1d6+2)"
                                class="bg-card border-border h-8 text-sm font-mono text-red-400" />
                        </div>
                    </div>
                    <p v-if="!npc.attacks.length" class="text-[10px] text-muted-foreground/50 text-center italic py-2">
                        Opcional: Você pode adicionar as rolagens no mural depois se preferir.</p>
                </div>

                <div class="space-y-1 pt-2">
                    <label class="text-xs font-bold text-muted-foreground uppercase">Notas do Mestre</label>
                    <Textarea v-model="npc.notes" placeholder="Táticas, resistências, itens no inventário..."
                        class="bg-muted border-border resize-none h-16" />
                </div>

            </div>

            <div class="p-4 border-t border-border flex justify-end gap-2 shrink-0 bg-muted/30">
                <Button variant="ghost" @click="$emit('close')" :disabled="saving">Cancelar</Button>
                <Button @click="save" :disabled="!npc.name.trim() || saving">
                    {{ saving ? 'Criando...' : 'Criar NPC' }}
                </Button>
            </div>

        </div>
    </div>
</template>
