import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Feat, Equipment } from '@/types/sheet'

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
        feats: [] as Feat[],
        equipment: [] as Equipment[],
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
        ac: {
            armor: 0,
            shield: 0,
            natural: 0,
            deflection: 0,
            size: 0,
            misc: 0,
            dexMod: 0,
            total: 10,
            touch: 10,
            flatFooted: 10
        },
        conditions: {
            blinded: false,
            dazzled: false,
            deafened: false,
            entangled: false,
            fatigued: false,
            exhausted: false,
            grappled: false,
            helpless: false,
            paralyzed: false,
            pinned: false,
            prone: false,
            shaken: false,
            sickened: false,
            stunned: false,
            unconscious: false,
            invisible: false
        },
        initiative_misc: 0,
        age: '',
        gender: '',
        height: '',
        weight: '',
        eyes: '',
        hair: '',
        skin: '',
        xp: 0,
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

    function setFromFoundry(data: any) {
        // Simple property assignment
        Object.keys(data).forEach(key => {
            if (['attributes', 'skills', 'feats', 'equipment', 'ac', 'conditions'].includes(key)) return;
            if (key in character.value) {
                (character.value as any)[key] = data[key]
            }
        })

        // Object merges
        if (data.attributes) {
            Object.keys(data.attributes).forEach(attr => {
                if (attr in character.value.attributes) {
                    (character.value.attributes as any)[attr] = { ...data.attributes[attr] }
                }
            })
        }
        if (data.skills) character.value.skills = { ...data.skills }
        if (data.ac) character.value.ac = { ...data.ac }
        if (data.conditions) character.value.conditions = { ...data.conditions }

        if (data.feats && Array.isArray(data.feats)) {
            character.value.feats = [...data.feats]
        }
        if (data.equipment && Array.isArray(data.equipment)) {
            character.value.equipment = [...data.equipment]
        }
    }

    return {
        currentStep,
        totalSteps,
        character,
        nextStep,
        prevStep,
        setStep,
        setFromFoundry
    }
})
