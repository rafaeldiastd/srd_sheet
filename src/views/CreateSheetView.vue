<script setup lang="ts">
import { useWizardStore } from '@/stores/wizardStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import BasicInfoStep from '@/components/wizard/steps/BasicInfoStep.vue'
import AttributesStep from '@/components/wizard/steps/AttributesStep.vue'
import SkillsStep from '@/components/wizard/steps/SkillsStep.vue'
import FeatsStep from '@/components/wizard/steps/FeatsStep.vue'
import SpellsStep from '@/components/wizard/steps/SpellsStep.vue'
import EquipmentBioStep from '@/components/wizard/steps/EquipmentBioStep.vue'
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-vue-next'

const store = useWizardStore()
const router = useRouter()

const steps = [
  { label: 'Informações', short: 'Info' },
  { label: 'Atributos', short: 'Attrs' },
  { label: 'Perícias', short: 'Perícias' },
  { label: 'Talentos', short: 'Talentos' },
  { label: 'Magias', short: 'Magias' },
  { label: 'Equipamentos', short: 'Equip' },
]

const currentStepLabel = computed(() => steps[store.currentStep - 1]?.label)
const isLast = computed(() => store.currentStep === store.totalSteps)

function handleCancel() {
  if (confirm('Tem certeza que deseja cancelar? O progresso será perdido.')) {
    router.push('/dashboard')
  }
}

async function handleFinish() {
  const { data: { user } } = await import('@/lib/supabase').then(m => m.supabase.auth.getUser())
  if (!user) {
    alert('Você precisa estar logado.')
    return
  }

  const { error } = await import('@/lib/supabase').then(m => m.supabase
    .from('sheets')
    .insert({
      user_id: user.id,
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

  router.push('/dashboard')
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
            Passo {{ store.currentStep }} de {{ store.totalSteps }}: <span class="text-foreground font-medium">{{
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
          :style="{ width: `${((store.currentStep - 1) / (store.totalSteps - 1)) * 100}%` }"></div>

        <button v-for="(step, i) in steps" :key="i" @click="store.setStep(i + 1)"
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
            <div :key="store.currentStep">
              <BasicInfoStep v-if="store.currentStep === 1" />
              <AttributesStep v-else-if="store.currentStep === 2" />
              <SkillsStep v-else-if="store.currentStep === 3" />
              <FeatsStep v-else-if="store.currentStep === 4" />
              <SpellsStep v-else-if="store.currentStep === 5" />
              <EquipmentBioStep v-else-if="store.currentStep === 6" />
            </div>
          </Transition>
        </CardContent>

        <CardFooter class="border-t border-border bg-card flex justify-between p-6">
          <Button variant="outline" @click="store.prevStep" :disabled="store.currentStep === 1" class="gap-2">
            <ChevronLeft class="w-4 h-4" /> Anterior
          </Button>
          <div class="flex gap-2">
            <Button v-if="!isLast" @click="store.nextStep" class="gap-2">
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
