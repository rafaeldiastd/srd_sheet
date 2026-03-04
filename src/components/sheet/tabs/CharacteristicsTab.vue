<script setup lang="ts">
import { ref, watch } from 'vue'
import type { SheetData } from '@/types/sheet'
import { ImageIcon, User, Scroll } from 'lucide-vue-next'

const props = defineProps<{
    d: SheetData | null | undefined
    editMode: boolean
    onSave?: (data: Partial<SheetData>) => void
}>()

const emit = defineEmits<{
    (e: 'save', data: Partial<SheetData>): void
}>()

// local edit state — always available to user
const local = ref<Partial<SheetData>>({})
const dirty = ref(false)
const saving = ref(false)

watch(() => props.d, (d) => {
    if (!d) return
    local.value = {
        bio:         d.bio         ?? '',
        alignment:   d.alignment   ?? '',
        deity:       d.deity       ?? '',
        age:         d.age         ?? '',
        gender:      d.gender      ?? '',
        height:      d.height      ?? '',
        weight_char: d.weight_char ?? (d as any).weight ?? '',
        eyes:        d.eyes        ?? '',
        hair:        d.hair        ?? '',
        skin:        d.skin        ?? '',
        avatar_url:  d.avatar_url  ?? '',
        cover_url:   d.cover_url   ?? '',
        token_url:   d.token_url   ?? '',
    }
    dirty.value = false
}, { immediate: true, deep: true })

function mark() { dirty.value = true }

async function save() {
    saving.value = true
    emit('save', { ...local.value })
    await new Promise(r => setTimeout(r, 300))
    dirty.value = false
    saving.value = false
}
</script>

<template>
    <div class="space-y-6 pb-8">

        <!-- ── IMAGENS ──────────────────────────────────────────────── -->
        <section>
            <h3 class="section-title">
                <ImageIcon class="w-3.5 h-3.5" /> Imagens
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">

                <!-- Avatar -->
                <div class="space-y-2">
                    <label class="field-label">Avatar</label>
                    <div class="flex items-center gap-4">
                        <div class="w-16 h-16 shrink-0 rounded-xl border-2 border-border bg-muted overflow-hidden relative">
                            <img v-if="local.avatar_url" :src="local.avatar_url" class="w-full h-full object-cover" />
                            <div v-else class="w-full h-full flex items-center justify-center text-muted-foreground/40">
                                <User class="w-6 h-6" />
                            </div>
                        </div>
                        <div class="flex-1 space-y-1">
                            <input v-model="local.avatar_url" @input="mark" placeholder="URL da imagem..." class="field-input text-xs" />
                            <p class="text-[10px] text-muted-foreground/60 leading-tight">Aparece no perfil e cabeçalho</p>
                        </div>
                    </div>
                </div>

                <!-- Capa -->
                <div class="space-y-2">
                    <label class="field-label">Capa</label>
                    <div class="flex items-center gap-4">
                        <div class="w-24 h-16 shrink-0 rounded-xl border-2 border-border bg-muted overflow-hidden relative">
                            <img v-if="local.cover_url" :src="local.cover_url" class="w-full h-full object-cover" />
                            <div v-else class="w-full h-full flex items-center justify-center text-muted-foreground/40">
                                <ImageIcon class="w-6 h-6" />
                            </div>
                        </div>
                        <div class="flex-1 space-y-1">
                            <input v-model="local.cover_url" @input="mark" placeholder="URL da imagem..." class="field-input text-xs" />
                            <p class="text-[10px] text-muted-foreground/60 leading-tight">Banner da ficha</p>
                        </div>
                    </div>
                </div>

                <!-- Token -->
                <div class="space-y-2">
                    <label class="field-label">Token</label>
                    <div class="flex items-center gap-4">
                        <div class="w-16 h-16 shrink-0 rounded-full border-2 border-border bg-muted overflow-hidden relative">
                            <img v-if="local.token_url" :src="local.token_url" class="w-full h-full object-cover" />
                            <div v-else class="w-full h-full flex items-center justify-center text-muted-foreground/40">
                                <ImageIcon class="w-6 h-6" />
                            </div>
                        </div>
                        <div class="flex-1 space-y-1">
                            <input v-model="local.token_url" @input="mark" placeholder="URL da imagem..." class="field-input text-xs" />
                            <p class="text-[10px] text-muted-foreground/60 leading-tight">Token de mapa VTT</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- ── APARÊNCIA ─────────────────────────────────────────────── -->
        <section>
            <h3 class="section-title">
                <User class="w-3.5 h-3.5" /> Aparência & Identidade
            </h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                    <label class="field-label">Gênero</label>
                    <input v-model="local.gender" @input="mark" placeholder="Gênero" class="field-input" />
                </div>
                <div>
                    <label class="field-label">Idade</label>
                    <input v-model="local.age" @input="mark" placeholder="Ex: 25" class="field-input" />
                </div>
                <div>
                    <label class="field-label">Altura</label>
                    <input v-model="local.height" @input="mark" placeholder="Ex: 1,75m" class="field-input" />
                </div>
                <div>
                    <label class="field-label">Peso</label>
                    <input v-model="local.weight_char" @input="mark" placeholder="Ex: 70kg" class="field-input" />
                </div>
                <div>
                    <label class="field-label">Olhos</label>
                    <input v-model="local.eyes" @input="mark" placeholder="Cor dos olhos" class="field-input" />
                </div>
                <div>
                    <label class="field-label">Cabelo</label>
                    <input v-model="local.hair" @input="mark" placeholder="Cor do cabelo" class="field-input" />
                </div>
                <div>
                    <label class="field-label">Pele</label>
                    <input v-model="local.skin" @input="mark" placeholder="Tom de pele" class="field-input" />
                </div>
                <div>
                    <label class="field-label">Tendência</label>
                    <select v-model="local.alignment" @change="mark" class="field-input">
                        <option value="">— Selecione —</option>
                        <option>Leal e Bom</option>
                        <option>Neutro e Bom</option>
                        <option>Caótico e Bom</option>
                        <option>Leal e Neutro</option>
                        <option>Neutro</option>
                        <option>Caótico e Neutro</option>
                        <option>Leal e Mau</option>
                        <option>Neutro e Mau</option>
                        <option>Caótico e Mau</option>
                    </select>
                </div>
                <div class="col-span-2 md:col-span-4">
                    <label class="field-label">Divindade</label>
                    <input v-model="local.deity" @input="mark" placeholder="Nome da divindade ou panteão" class="field-input" />
                </div>
            </div>
        </section>

        <!-- ── BIOGRAFIA ─────────────────────────────────────────────── -->
        <section>
            <h3 class="section-title">
                <Scroll class="w-3.5 h-3.5" /> Biografia & Histórico
            </h3>
            <textarea
                v-model="local.bio"
                @input="mark"
                rows="8"
                placeholder="Descreva a história, personalidade, motivações e segredos do personagem..."
                class="field-input w-full resize-none text-sm leading-relaxed"
            />
        </section>

        <!-- ── SAVE ──────────────────────────────────────────────────── -->
        <div v-if="dirty" class="sticky bottom-4 flex justify-end z-10">
            <button @click="save" :disabled="saving"
                class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-xl shadow-primary/30 hover:bg-primary/90 transition-all disabled:opacity-60">
                {{ saving ? 'Salvando...' : ' Salvar Características' }}
            </button>
        </div>
    </div>
</template>

<style scoped>
.section-title {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--muted-foreground);
    margin-bottom: 0.875rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--border);
}
.field-label {
    display: block;
    font-size: 0.625rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--muted-foreground);
    margin-bottom: 0.3rem;
}
.field-input {
    width: 100%;
    background: var(--muted);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
    color: var(--foreground);
    transition: border-color 0.15s;
}
.field-input:focus {
    outline: none;
    border-color: color-mix(in srgb, var(--primary) 60%, transparent);
}
.field-input::placeholder {
    color: var(--muted-foreground);
    opacity: 0.6;
}
</style>
