import { useMemo } from 'react'
import { calculateAbilityModifier, type Abilities } from '@/types/abilities'

type UseDerivedStatsParams = {
  level: number
  abilities: Abilities
  hitDiceType: number
  hpMaxOverride: string
  initMisc: number
}

export function useDerivedStats({
  level,
  abilities,
  hitDiceType,
  hpMaxOverride,
  initMisc,
}: UseDerivedStatsParams) {
  const proficiencyBonus = useMemo(() => {
    const safeLevel = Math.max(1, level || 1)
    return Math.ceil(safeLevel / 4) + 1
  }, [level])

  const constitutionMod = useMemo(
    () => calculateAbilityModifier(abilities.con),
    [abilities.con]
  )

  const effectiveHpMax = useMemo(() => {
    const avgPerLevel = hitDiceType / 2 + 1
    const hpLevel1 = hitDiceType + constitutionMod
    const hpSubsequent = Math.max(0, level - 1) * (avgPerLevel + constitutionMod)
    const calculatedHpMax = Math.floor(hpLevel1 + hpSubsequent)
    const override = parseInt(hpMaxOverride, 10)
    if (Number.isFinite(override) && override > 0) return override
    return calculatedHpMax
  }, [hitDiceType, level, constitutionMod, hpMaxOverride])

  const initiativeTotal = useMemo(() => {
    const dexMod = calculateAbilityModifier(abilities.dex)
    return dexMod + (initMisc || 0)
  }, [abilities.dex, initMisc])

  return { proficiencyBonus, constitutionMod, effectiveHpMax, initiativeTotal }
}
