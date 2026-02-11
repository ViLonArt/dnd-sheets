import type { AbilityKey } from '@/types/abilities'
import type { Abilities } from '@/types/abilities'

/**
 * D&D 2024 Point Buy cost table.
 * Scores 8–15 are standard; 16+ requires racial/background bonuses.
 */
export const POINT_BUY_COSTS: Record<number, number> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
}

const MIN_SCORE = 8
const MAX_SCORE = 15
const TOTAL_POINTS = 27

export type PointBuyValidation = {
  valid: boolean
  errors: string[]
  totalCost: number
  totalPoints: number
}

/**
 * Calculate the point cost for a single ability score (8–15).
 */
export const getPointCost = (score: number): number => {
  if (score < MIN_SCORE || score > MAX_SCORE) return 0
  return POINT_BUY_COSTS[score] ?? 0
}

/**
 * Calculate the total point cost for a set of ability scores.
 */
export const getTotalPointCost = (abilities: Abilities): number => {
  return (Object.keys(abilities) as AbilityKey[]).reduce(
    (sum, key) => sum + getPointCost(abilities[key]),
    0
  )
}

/**
 * Validate ability scores against the 2024 Point Buy rules.
 * - Each score must be between 8 and 15 (before bonuses).
 * - Total cost must equal 27 points.
 */
export const validatePointBuy = (abilities: Abilities): PointBuyValidation => {
  const errors: string[] = []
  let totalCost = 0

  const keys: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']
  for (const key of keys) {
    const score = abilities[key] ?? 10
    if (score < MIN_SCORE || score > MAX_SCORE) {
      errors.push(
        `${key}: score must be between ${MIN_SCORE} and ${MAX_SCORE} (before bonuses)`
      )
    } else {
      totalCost += getPointCost(score)
    }
  }

  if (totalCost !== TOTAL_POINTS) {
    errors.push(
      `Total cost must be ${TOTAL_POINTS} points (current: ${totalCost})`
    )
  }

  return {
    valid: errors.length === 0,
    errors,
    totalCost,
    totalPoints: TOTAL_POINTS,
  }
}
