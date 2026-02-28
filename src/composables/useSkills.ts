import { ref, computed, type Ref, type ComputedRef } from 'vue'
import { SKILLS_DATA, CLASS_SKILLS, CLASS_SKILL_POINTS } from '@/data/dnd35'
import type { SheetData } from '@/types/sheet'

export function useSkills(
    d: ComputedRef<SheetData | null | undefined>,
    editedData: Ref<SheetData | null>,
    editMode: ComputedRef<boolean>,
    sheet: Ref<any>,
    calcMod: (n: number) => number,
    attrTotal: (key: string) => number,
    totalBonuses: ComputedRef<Record<string, number>>
) {
    const skillPhase = ref<'select' | 'allocate'>('select')
    const skillSearch = ref('')

    const baseClassSkills = computed(() => {
        const cls = (editMode.value ? editedData.value?.class : sheet.value?.class) || ''
        return CLASS_SKILLS[cls] || []
    })

    function isClassSkill(skillName: string) {
        const skills = baseClassSkills.value
        if (skills.includes(skillName)) return true
        if (skillName.startsWith('Conhecimento') && skills.includes('Conhecimento (Todos)')) return true
        if (skillName.startsWith('Ofícios') && skills.includes('Ofícios (Qualquer)')) return true
        if (skillName.startsWith('Profissão') && skills.includes('Profissão (Qualquer)')) return true
        const cls = (editMode.value ? editedData.value?.class : sheet.value?.class) || ''
        if (cls === 'Bardo' && skillName.startsWith('Conhecimento')) return true
        return false
    }

    const filteredSkillsList = computed(() => {
        const q = skillSearch.value.toLowerCase()
        return SKILLS_DATA.filter(s => !q || s.name.toLowerCase().includes(q))
    })

    const selectedSkillNames = computed(() => {
        if (!editedData.value?.skills) return new Set<string>()
        return new Set<string>(Object.keys(editedData.value.skills))
    })

    const allocatedSkills = computed(() => SKILLS_DATA.filter(s => selectedSkillNames.value.has(s.name)))

    function toggleSkillEdit(name: string) {
        if (!editedData.value) return
        const skills = { ...editedData.value.skills }
        if (name in skills) delete skills[name]
        else skills[name] = 0
        editedData.value.skills = skills
    }

    function skillAbilityMod(ability: string) { return calcMod(attrTotal(ability)) }

    function skillTotal(name: string, ability: string) {
        const diff = (editedData.value || d.value)?.skills?.[name] ?? 0
        return diff + skillAbilityMod(ability) + (totalBonuses.value[name] || 0)
    }

    function adjustRank(name: string, delta: 1 | -1) {
        if (!editedData.value) return
        const current = editedData.value.skills[name] ?? 0
        editedData.value.skills[name] = Math.max(0, current + delta)
    }

    function addLevelUpSkillPoints() {
        if (!editedData.value) return
        const cls = (editedData.value.class ?? '') as string
        const baseInt = Number(editedData.value.attributes?.int?.base ?? 10)
        const intModForSkills = calcMod(baseInt)
        const base = editedData.value.customSkillPoints || CLASS_SKILL_POINTS[cls] || 2
        const isHuman = (editedData.value.race ?? '').toLowerCase().includes('hmano') || (editedData.value.race ?? '').toLowerCase().includes('human')
        const basePerLevel = Math.max(1, base + intModForSkills)
        const earned = basePerLevel + (isHuman ? 1 : 0)
        editedData.value.skillPoints = (editedData.value.skillPoints || 0) + earned
        return earned
    }

    const skillPointsSpent = computed(() => {
        if (!editedData.value?.skills) return 0
        const skills = editedData.value.skills as Record<string, number>
        return Object.entries(skills).reduce((sum, [name, ranks]) => {
            const isClass = isClassSkill(name)
            const cost = isClass ? Number(ranks) : Number(ranks) * 2
            return sum + cost
        }, 0)
    })

    const activeSkills = computed(() => {
        if (!d.value?.skills) return []
        return Object.entries(d.value.skills)
            .map(([name, ranks]) => {
                const skill = SKILLS_DATA.find(s => s.name === name)
                return { name, ranks: ranks as number, ability: skill?.ability ?? 'int' }
            })
    })

    return {
        skillPhase,
        skillSearch,
        baseClassSkills,
        isClassSkill,
        filteredSkillsList,
        selectedSkillNames,
        allocatedSkills,
        toggleSkillEdit,
        skillAbilityMod,
        skillTotal,
        adjustRank,
        addLevelUpSkillPoints,
        skillPointsSpent,
        activeSkills
    }
}
