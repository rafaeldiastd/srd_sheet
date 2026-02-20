<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

const colorTokens = [
    { label: 'Background', tailwind: 'bg-background', hex: '#09090B' },
    { label: 'Card', tailwind: 'bg-card', hex: '#18181B' },
    { label: 'Popover', tailwind: 'bg-popover', hex: '#18181B' },
    { label: 'Secondary', tailwind: 'bg-secondary', hex: '#27272A' },
    { label: 'Muted', tailwind: 'bg-muted', hex: '#27272A' },
    { label: 'Border', tailwind: 'bg-border', hex: '#27272A' },
    { label: 'Primary', tailwind: 'bg-primary', hex: '#DFD4BD' },
    { label: 'Foreground', tailwind: 'bg-foreground', hex: '#E4E4E7' },
]
</script>

<template>
    <div class="min-h-screen bg-background text-foreground">
        <div class="max-w-5xl mx-auto px-8 py-12 space-y-16">

            <!-- Header -->
            <header class="border-b border-border pb-8">
                <h1 class="text-4xl font-serif font-bold text-primary mb-3">Maestro Design System</h1>
                <p class="text-muted-foreground text-lg">Guia de estilos e componentes do projeto.</p>
            </header>

            <!-- 01 — Colors -->
            <section class="space-y-6">
                <h2 class="text-2xl font-serif font-bold text-foreground">
                    <span class="text-primary mr-2 font-mono text-sm font-normal">01</span>Cores
                </h2>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div v-for="t in colorTokens" :key="t.label" class="space-y-2">
                        <div :class="[t.tailwind, 'h-20 w-full rounded-md border border-border ring-1 ring-border/50']">
                        </div>
                        <div>
                            <p class="text-sm font-semibold text-foreground">{{ t.label }}</p>
                            <p class="text-xs text-muted-foreground font-mono">{{ t.tailwind }}</p>
                            <p class="text-xs text-muted-foreground font-mono">{{ t.hex }}</p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- 02 — Typography -->
            <section class="space-y-6">
                <h2 class="text-2xl font-serif font-bold text-foreground">
                    <span class="text-primary mr-2 font-mono text-sm font-normal">02</span>Tipografia
                </h2>
                <div class="space-y-4 p-6 bg-card border border-border rounded-lg">
                    <div class="border-b border-border pb-4 space-y-3">
                        <p class="text-4xl font-serif font-bold text-foreground">Merriweather — Títulos</p>
                        <p class="text-2xl font-serif font-semibold text-foreground">Heading 2 / font-serif</p>
                        <p class="text-xl font-serif text-foreground">Heading 3 / font-serif</p>
                        <p class="text-lg font-serif text-primary">Heading 4 / text-primary / Gold</p>
                    </div>
                    <div class="space-y-2">
                        <p class="text-base text-foreground">Inter — corpo de texto (text-base / text-foreground)</p>
                        <p class="text-sm text-muted-foreground">Texto secundário (text-sm / text-muted-foreground)</p>
                        <p class="text-xs text-muted-foreground font-mono">Fonte mono — código (font-mono / text-xs)</p>
                    </div>
                </div>
            </section>

            <!-- 03 — Buttons -->
            <section class="space-y-6">
                <h2 class="text-2xl font-serif font-bold text-foreground">
                    <span class="text-primary mr-2 font-mono text-sm font-normal">03</span>Botões
                </h2>
                <div class="flex flex-wrap gap-4 p-6 bg-card border border-border rounded-lg items-center">
                    <Button>Padrão (default)</Button>
                    <Button variant="secondary">Secundário</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="destructive">Perigo</Button>
                    <Button variant="link">Link</Button>
                    <Button size="sm">Pequeno</Button>
                    <Button size="lg">Grande</Button>
                </div>
            </section>

            <!-- 04 — Form Elements -->
            <section class="space-y-6">
                <h2 class="text-2xl font-serif font-bold text-foreground">
                    <span class="text-primary mr-2 font-mono text-sm font-normal">04</span>Formulários
                </h2>
                <div class="grid md:grid-cols-2 gap-8">

                    <!-- Inputs and Textarea -->
                    <Card>
                        <CardHeader>
                            <CardTitle>Inputs</CardTitle>
                        </CardHeader>
                        <CardContent class="space-y-4">
                            <div class="space-y-1">
                                <Label>Nome do personagem</Label>
                                <Input placeholder="Ex: Aragorn" />
                            </div>
                            <div class="space-y-1">
                                <Label>Descrição</Label>
                                <Textarea placeholder="Descreva seu personagem..." class="min-h-24" />
                            </div>
                        </CardContent>
                    </Card>

                    <!-- Select, Checkbox, Radio -->
                    <Card>
                        <CardHeader>
                            <CardTitle>Seleção</CardTitle>
                        </CardHeader>
                        <CardContent class="space-y-6">
                            <div class="space-y-1">
                                <Label>Classe</Label>
                                <Select>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Escolha uma classe" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="fighter">Guerreiro</SelectItem>
                                        <SelectItem value="wizard">Mago</SelectItem>
                                        <SelectItem value="rogue">Ladino</SelectItem>
                                        <SelectItem value="cleric">Clérigo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div class="space-y-3">
                                <Label>Opções</Label>
                                <div class="flex items-center gap-2">
                                    <Checkbox id="cb1" />
                                    <Label for="cb1">Personagem verificado</Label>
                                </div>
                                <div class="flex items-center gap-2">
                                    <Checkbox id="cb2" checked />
                                    <Label for="cb2">Aceitar termos</Label>
                                </div>
                            </div>
                            <div class="space-y-2">
                                <Label>Alinhamento</Label>
                                <RadioGroup default-value="lg" class="flex gap-4">
                                    <div class="flex items-center gap-2">
                                        <RadioGroupItem value="lg" id="lg" />
                                        <Label for="lg">Leal e Bom</Label>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <RadioGroupItem value="cn" id="cn" />
                                        <Label for="cn">Caótico Neutro</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </section>

            <!-- 05 — Cards -->
            <section class="space-y-6">
                <h2 class="text-2xl font-serif font-bold text-foreground">
                    <span class="text-primary mr-2 font-mono text-sm font-normal">05</span>Cards
                </h2>
                <div class="grid md:grid-cols-3 gap-4">
                    <Card v-for="i in 3" :key="i">
                        <CardHeader>
                            <CardTitle>Personagem {{ i }}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p class="text-sm text-muted-foreground">Guerreiro · Nível {{ i * 3 }} · Humano</p>
                            <div class="mt-4 flex gap-2">
                                <Button size="sm" variant="outline">Ver</Button>
                                <Button size="sm" variant="ghost">Editar</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>

        </div>
    </div>
</template>
