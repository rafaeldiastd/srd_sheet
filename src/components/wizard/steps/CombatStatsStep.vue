<script setup lang="ts">
import { useWizardStore } from '@/stores/wizardStore'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const store = useWizardStore()
</script>

<template>
    <div class="flex flex-col gap-6">
        <div class="grid gap-6">

            <!-- Combate Básico -->
            <div class="grid gap-4 md:grid-cols-3 p-4 bg-muted/20 border border-border rounded-lg">
                <div
                    class="col-span-1 md:col-span-3 text-sm font-semibold text-primary uppercase border-b border-border pb-2 mb-2">
                    Estatísticas Básicas
                </div>

                <div class="grid gap-2">
                    <Label htmlFor="hp_max">Pontos de Vida Máximos</Label>
                    <Input id="hp_max" type="number" v-model.number="store.character.hp_max" />
                </div>

                <div class="grid gap-2">
                    <Label htmlFor="bab">Bônus Base de Ataque (BBA)</Label>
                    <Input id="bab" type="number" v-model.number="store.character.bab" />
                </div>

                <div class="grid gap-2">
                    <Label htmlFor="speed">Deslocamento (m)</Label>
                    <Input id="speed" type="number" v-model.number="store.character.speed" />
                </div>
            </div>

            <!-- Testes de Resistência -->
            <div class="grid gap-4 md:grid-cols-3 p-4 bg-muted/20 border border-border rounded-lg">
                <div
                    class="col-span-1 md:col-span-3 text-sm font-semibold text-primary uppercase border-b border-border pb-2 mb-2">
                    Testes de Resistência (Base da Classe)
                </div>

                <div class="grid gap-2">
                    <Label htmlFor="save_fort">Fortitude Base</Label>
                    <Input id="save_fort" type="number" v-model.number="store.character.save_fort" />
                </div>

                <div class="grid gap-2">
                    <Label htmlFor="save_ref">Reflexos Base</Label>
                    <Input id="save_ref" type="number" v-model.number="store.character.save_ref" />
                </div>

                <div class="grid gap-2">
                    <Label htmlFor="save_will">Vontade Base</Label>
                    <Input id="save_will" type="number" v-model.number="store.character.save_will" />
                </div>
            </div>

            <!-- Classe de Armadura -->
            <div class="grid gap-4 md:grid-cols-3 p-4 bg-muted/20 border border-border rounded-lg">
                <div
                    class="col-span-1 md:col-span-3 text-sm font-semibold text-primary uppercase border-b border-border pb-2 mb-2">
                    Classe de Armadura (CA) Inicial
                </div>

                <div class="grid gap-2">
                    <Label htmlFor="ca_armor">Bônus de Armadura</Label>
                    <Input id="ca_armor" type="number" v-model.number="store.character.ac.armor" />
                </div>

                <div class="grid gap-2">
                    <Label htmlFor="ca_shield">Bônus de Escudo</Label>
                    <Input id="ca_shield" type="number" v-model.number="store.character.ac.shield" />
                </div>

                <div class="grid gap-2">
                    <Label htmlFor="ca_natural">Armadura Natural</Label>
                    <Input id="ca_natural" type="number" v-model.number="store.character.ac.natural" />
                </div>

                <div class="grid gap-2">
                    <Label htmlFor="ca_deflect">Bônus de Deflexão</Label>
                    <Input id="ca_deflect" type="number" v-model.number="store.character.ac.deflection" />
                </div>

                <div class="grid gap-2">
                    <Label htmlFor="ca_size">Mod. de Tamanho (CA)</Label>
                    <Input id="ca_size" type="number" v-model.number="store.character.ac.size" />
                </div>

                <div class="grid gap-2">
                    <Label htmlFor="ca_misc">Bônus Diverso (CA)</Label>
                    <Input id="ca_misc" type="number" v-model.number="store.character.ac.misc" />
                </div>
            </div>

        </div>
    </div>
</template>
