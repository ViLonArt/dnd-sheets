import type { AbilityKey } from '@/types/abilities'
import type { Abilities } from '@/types/abilities'
import {
  POINT_BUY_COST_TABLE,
  getPointCost as getPointCostFromRules,
  validatePointBuy as validatePointBuyFromRules,
} from './pointBuyRules'

/** @deprecated Use POINT_BUY_COST_TABLE from pointBuyRules instead */
export const POINT_BUY_COSTS = POINT_BUY_COST_TABLE

export type PointBuyValidation = {
  valid: boolean
  errors: string[]
  totalCost: number
  totalPoints: number
}

/**
 * Calculate the point cost for a single ability score (8–15).
 */
export const getPointCost = getPointCostFromRules

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
export const validatePointBuy = (abilities: Abilities): PointBuyValidation =>
  validatePointBuyFromRules(abilities)
