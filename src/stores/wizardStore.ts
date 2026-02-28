import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Attribute {
    base: number
    temp: number
}

export interface CharacterAttributes {
    str: Attribute
    dex: Attribute
    con: Attribute
    int: Attribute
    wis: Attribute
    cha: Attribute
}

export const useWizardStore = defineStore('wizard', () => {
    const currentStep = ref(1)
    const totalSteps = 5

    const character = ref({
        sheetType: 'Personagem',
        name: '',
        race: '',
        class: '',
        customHitDie: 8,
        customSkillPoints: 2,
        level: 1,
        avatar_url: '',
        attributes: {
            str: { base: 10, temp: 0 },
            dex: { base: 10, temp: 0 },
            con: { base: 10, temp: 0 },
            int: { base: 10, temp: 0 },
            wis: { base: 10, temp: 0 },
            cha: { base: 10, temp: 0 },
        } as CharacterAttributes,
        skills: {} as Record<string, number>,
        skillPoints: 0,
        feats: [] as string[],
        spells: [] as string[],
        equipment: [] as string[],
        bio: '',
        alignment: '',
        deity: '',
        size: 'Médio',
        hp_max: 0,
        bab: 0,
        speed: 9,
        save_fort: 0,
        save_ref: 0,
        save_will: 0,
        ca_armor: 0,
        ca_shield: 0,
        ca_natural: 0,
        ca_deflect: 0,
        initiative_misc: 0,
        age: '',
        gender: '',
        height: '',
        weight: '',
        eyes: '',
        hair: '',
        skin: '',
    })

    function nextStep() {
        if (currentStep.value < totalSteps) {
            currentStep.value++
        }
    }

    function prevStep() {
        if (currentStep.value > 1) {
            currentStep.value--
        }
    }

    function setStep(step: number) {
        if (step >= 1 && step <= totalSteps) {
            currentStep.value = step
        }
    }

    return {
        currentStep,
        totalSteps,
        character,
        nextStep,
        prevStep,
        setStep
    }
})
