/**
 * D&D 2024 Point Buy constants and validation rules.
 * Scores 8–15 are standard before species/background bonuses.
 */

/** Total points available for ability score allocation */
export const POINT_BUY_TOTAL_POINTS = 27

/** Minimum ability score before species/background bonuses */
export const POINT_BUY_MIN_SCORE = 8

/** Maximum ability score before species/background bonuses */
export const POINT_BUY_MAX_SCORE = 15

/** Cost in points for each ability score (8–15) */
export const POINT_BUY_COST_TABLE: Record<number, number> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
}

export type PointBuyValidationResult = {
  valid: boolean
  errors: string[]
  totalCost: number
  totalPoints: number
}

/**
 * Get the point cost for a single ability score.
 * Returns 0 for scores outside 8–15.
 */
export const getPointCost = (score: number): number => {
  if (score < POINT_BUY_MIN_SCORE || score > POINT_BUY_MAX_SCORE) {
    return 0
  }
  return POINT_BUY_COST_TABLE[score] ?? 0
}

/**
 * Validate ability scores against Point Buy rules.
 * - Each score must be between POINT_BUY_MIN_SCORE and POINT_BUY_MAX_SCORE
 * - Total cost must equal POINT_BUY_TOTAL_POINTS
 */
export const validatePointBuy = (
  abilities: Record<string, number>
): PointBuyValidationResult => {
  const errors: string[] = []
  let totalCost = 0

  const keys = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const
  for (const key of keys) {
    const score = abilities[key] ?? 10
    if (score < POINT_BUY_MIN_SCORE || score > POINT_BUY_MAX_SCORE) {
      errors.push(
        `${key}: score must be between ${POINT_BUY_MIN_SCORE} and ${POINT_BUY_MAX_SCORE} (before bonuses)`
      )
    } else {
      totalCost += getPointCost(score)
    }
  }

  if (totalCost !== POINT_BUY_TOTAL_POINTS) {
    errors.push(
      `Total cost must be ${POINT_BUY_TOTAL_POINTS} points (current: ${totalCost})`
    )
  }

  return {
    valid: errors.length === 0,
    errors,
    totalCost,
    totalPoints: POINT_BUY_TOTAL_POINTS,
  }
}
