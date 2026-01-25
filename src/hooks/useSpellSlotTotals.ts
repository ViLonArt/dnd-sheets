import { useMemo } from 'react'
import { applySlotOverrides } from '@/data/classTables.ts'
import { CLASSES_2024 } from '@/data/classTables2024'
import type { Character } from '@/types/character'

const THIRD_CASTER_SLOTS: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [2, 0, 0, 0, 0, 0, 0, 0, 0],
  [3, 0, 0, 0, 0, 0, 0, 0, 0],
  [3, 0, 0, 0, 0, 0, 0, 0, 0],
  [3, 0, 0, 0, 0, 0, 0, 0, 0],
  [4, 2, 0, 0, 0, 0, 0, 0, 0],
  [4, 2, 0, 0, 0, 0, 0, 0, 0],
  [4, 2, 0, 0, 0, 0, 0, 0, 0],
  [4, 3, 0, 0, 0, 0, 0, 0, 0],
  [4, 3, 0, 0, 0, 0, 0, 0, 0],
  [4, 3, 0, 0, 0, 0, 0, 0, 0],
  [4, 3, 2, 0, 0, 0, 0, 0, 0],
  [4, 3, 2, 0, 0, 0, 0, 0, 0],
  [4, 3, 2, 0, 0, 0, 0, 0, 0],
  [4, 3, 3, 0, 0, 0, 0, 0, 0],
  [4, 3, 3, 1, 0, 0, 0, 0, 0],
  [4, 3, 3, 1, 0, 0, 0, 0, 0],
  [4, 3, 3, 2, 0, 0, 0, 0, 0],
  [4, 3, 3, 2, 0, 0, 0, 0, 0],
]

const THIRD_CASTER_SUBCLASSES = new Set([
  'Escroc Arcanique',
  'Filou Arcanique',
  'Chevalier Occulte',
  'Arcane Trickster',
  'Eldritch Knight',
])

type UseSpellSlotTotalsParams = {
  characterClass: Character['class']
  subclass: Character['subclass']
  level: Character['level']
  slotOverrides: Character['slotOverrides']
}

export function useSpellSlotTotals({
  characterClass,
  subclass,
  level,
  slotOverrides,
}: UseSpellSlotTotalsParams) {
  const baseSlotTotals = useMemo(() => {
    const classData = CLASSES_2024[characterClass]
    const levelIndex = Math.max(1, Math.min(20, level)) - 1
    const isThirdCaster = THIRD_CASTER_SUBCLASSES.has(subclass ?? '')
    const slots = isThirdCaster
      ? THIRD_CASTER_SLOTS[levelIndex] ?? []
      : classData?.levels[levelIndex]?.slots ?? []
    const totals: Record<number, number> = {}
    for (let slotLevel = 1; slotLevel <= 9; slotLevel += 1) {
      totals[slotLevel] = isThirdCaster ? slots[slotLevel - 1] ?? 0 : slots[slotLevel] ?? 0
    }
    return totals
  }, [characterClass, level, subclass])

  const currentMaxSlots = useMemo(
    () => applySlotOverrides(baseSlotTotals, slotOverrides),
    [baseSlotTotals, slotOverrides]
  )

  return { baseSlotTotals, currentMaxSlots }
}
