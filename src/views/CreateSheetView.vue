<script setup lang="ts">
import { useWizardStore } from '@/stores/wizardStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import BasicInfoStep from '@/components/wizard/steps/BasicInfoStep.vue'
import AttributesStep from '@/components/wizard/steps/AttributesStep.vue'
import SkillsStep from '@/components/wizard/steps/SkillsStep.vue'
import CombatStatsStep from '@/components/wizard/steps/CombatStatsStep.vue'
import TypeStep from '@/components/wizard/steps/TypeStep.vue'
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-vue-next'

const store = useWizardStore()
const router = useRouter()
const route = useRoute()

const allSteps = [
  { id: 'type', label: 'Tipo', short: 'Tipo' },
  { id: 'info', label: 'Informações', short: 'Info' },
  { id: 'attrs', label: 'Atributos', short: 'Attrs' },
  { id: 'skills', label: 'Perícias', short: 'Perícias' },
  { id: 'combat', label: 'Combate', short: 'Combate' },
]

const visibleSteps = computed(() => allSteps)

// Auto-clamp step if type changes and shrinks available steps
watch(() => visibleSteps.value.length, (newLen) => {
  if (store.currentStep > newLen) {
    store.setStep(newLen)
  }
})

const currentStepLabel = computed(() => visibleSteps.value[store.currentStep - 1]?.label)
const isLast = computed(() => store.currentStep === visibleSteps.value.length)

function handleNext() {
  if (store.currentStep < visibleSteps.value.length) {
    store.setStep(store.currentStep + 1)
  }
}

function handlePrev() {
  if (store.currentStep > 1) {
    store.setStep(store.currentStep - 1)
  }
}

function handleCancel() {
  if (confirm('Tem certeza que deseja cancelar? O progresso será perdido.')) {
    const campaignId = route.query.campaignId
    if (campaignId) {
      router.push(`/campaign/${campaignId}`)
    } else {
      router.push('/dashboard')
    }
  }
}

async function handleFinish() {
  const { data: { user } } = await import('@/lib/supabase').then(m => m.supabase.auth.getUser())
  if (!user) {
    alert('Você precisa estar logado.')
    return
  }

  const campaignId = route.query.campaignId as string | undefined

  const { error } = await import('@/lib/supabase').then(m => m.supabase
    .from('sheets')
    .insert({
      user_id: user.id,
      campaign_id: campaignId || null,
      name: store.character.name,
      class: store.character.class,
      level: store.character.level,
      race: store.character.race,
      data: store.character
    }))

  if (error) {
    alert('Falha ao salvar: ' + error.message)
    return
  }

  if (campaignId) {
    router.push(`/campaign/${campaignId}`)
  } else {
    router.push('/dashboard')
  }
}
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <div class="max-w-4xl mx-auto px-4 py-8 space-y-8">

      <!-- Top header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-serif font-bold text-primary">Criar Personagem</h1>
          <p class="text-muted-foreground text-sm mt-1">
            Passo {{ store.currentStep }} de {{ visibleSteps.length }}: <span class="text-foreground font-medium">{{
              currentStepLabel }}</span>
          </p>
        </div>
        <Button variant="ghost" @click="handleCancel" class="text-muted-foreground hover:text-destructive">
          Cancelar
        </Button>
      </div>

      <!-- Stepper -->
      <div class="relative flex items-center justify-between">
        <!-- Progress line -->
        <div class="absolute inset-x-0 top-4 h-px bg-border -z-10"></div>
        <div class="absolute left-0 top-4 h-px bg-primary -z-10 transition-all duration-500"
          :style="{ width: `${((store.currentStep - 1) / (visibleSteps.length - 1)) * 100}%` }"></div>

        <button v-for="(step, i) in visibleSteps" :key="i" @click="store.setStep(i + 1)"
          class="flex flex-col items-center gap-2 cursor-pointer group">
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 bg-background transition-all duration-300"
            :class="[
              store.currentStep > i + 1
                ? 'border-primary bg-primary text-primary-foreground'
                : store.currentStep === i + 1
                  ? 'border-primary text-primary ring-4 ring-primary/20'
                  : 'border-border text-muted-foreground group-hover:border-primary/50'
            ]">
            <span v-if="store.currentStep > i + 1">✓</span>
            <span v-else>{{ i + 1 }}</span>
          </div>
          <span class="text-xs font-medium hidden sm:block transition-colors"
            :class="store.currentStep === i + 1 ? 'text-primary' : 'text-muted-foreground'">{{ step.short }}</span>
        </button>
      </div>

      <!-- Wizard Card -->
      <Card class="border-border shadow-lg">
        <CardHeader class="border-b border-border bg-card">
          <CardTitle class="font-serif text-primary">{{ currentStepLabel }}</CardTitle>
        </CardHeader>

        <CardContent class="p-6 min-h-[460px]">
          <Transition name="slide" mode="out-in">
            <div :key="visibleSteps[store.currentStep - 1]?.id || store.currentStep">
              <TypeStep v-if="visibleSteps[store.currentStep - 1]?.id === 'type'" />
              <BasicInfoStep v-else-if="visibleSteps[store.currentStep - 1]?.id === 'info'" />
              <AttributesStep v-else-if="visibleSteps[store.currentStep - 1]?.id === 'attrs'" />
              <SkillsStep v-else-if="visibleSteps[store.currentStep - 1]?.id === 'skills'" />
              <CombatStatsStep v-else-if="visibleSteps[store.currentStep - 1]?.id === 'combat'" />
            </div>
          </Transition>
        </CardContent>

        <CardFooter class="border-t border-border bg-card flex justify-between p-6">
          <Button variant="outline" @click="handlePrev" :disabled="store.currentStep === 1" class="gap-2">
            <ChevronLeft class="w-4 h-4" /> Anterior
          </Button>
          <div class="flex gap-2">
            <Button v-if="!isLast" @click="handleNext" class="gap-2">
              Próximo
              <ChevronRight class="w-4 h-4" />
            </Button>
            <Button v-else @click="handleFinish" class="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <CheckCircle class="w-4 h-4" /> Finalizar Ficha
            </Button>
          </div>
        </CardFooter>
      </Card>

    </div>
  </div>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(12px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(-12px);
}
</style>
