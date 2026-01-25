import { useMemo } from 'react'
import { calculateAbilityModifier, type Abilities } from '@/types/abilities'
import type { SpellcastingAttribute } from '@/types/character'

type UseSpellcastingStatsParams = {
  spellcastingAttribute: SpellcastingAttribute
  abilities: Abilities
  proficiencyBonus: number
}

export function useSpellcastingStats({
  spellcastingAttribute,
  abilities,
  proficiencyBonus,
}: UseSpellcastingStatsParams) {
  const spellDC = useMemo(() => {
    if (spellcastingAttribute === 'None') return ''
    const abilityMap: Record<'INT' | 'WIS' | 'CHA', keyof Abilities> = {
      INT: 'int',
      WIS: 'wis',
      CHA: 'cha',
    }
    const mappedKey = abilityMap[spellcastingAttribute]
    if (!mappedKey) return ''
    const abilityScore = abilities[mappedKey]
    const abilityModifier = calculateAbilityModifier(abilityScore)
    return 8 + proficiencyBonus + abilityModifier
  }, [spellcastingAttribute, abilities, proficiencyBonus])

  const spellAttackBonus = useMemo(() => {
    if (spellcastingAttribute === 'None') return ''
    const abilityMap: Record<'INT' | 'WIS' | 'CHA', keyof Abilities> = {
      INT: 'int',
      WIS: 'wis',
      CHA: 'cha',
    }
    const mappedKey = abilityMap[spellcastingAttribute]
    if (!mappedKey) return ''
    const abilityScore = abilities[mappedKey]
    const abilityModifier = calculateAbilityModifier(abilityScore)
    return proficiencyBonus + abilityModifier
  }, [spellcastingAttribute, abilities, proficiencyBonus])

  return { spellDC, spellAttackBonus }
}
