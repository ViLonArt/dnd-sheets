import type { Feature } from '@/utils/advancementTypes'
import { BARBARIAN_FEATURES } from './classes/barbarian'
import { BARD_FEATURES } from './classes/bard'
import { BARD_SUBCLASS_FEATURES } from './bardSubclassFeatures'

/**
 * Registry of class features by classId.
 * Used for automatic feature propagation when class/level changes.
 */
export const CLASS_FEATURE_REGISTRY: Record<string, Feature[]> = {
  barbarian: BARBARIAN_FEATURES,
  bard: BARD_FEATURES,
}

/**
 * Get features for a class up to a given level, optionally including subclass features.
 */
export function getClassFeaturesForLevel(
  classId: string,
  level: number,
  subclassId?: string
): Feature[] {
  const classFeatures = CLASS_FEATURE_REGISTRY[classId] ?? []
  const base = classFeatures.filter((f) => f.level <= level)

  if (subclassId && classId === 'bard') {
    const subFeatures = BARD_SUBCLASS_FEATURES[subclassId] ?? []
    const subFiltered = subFeatures.filter((f) => f.level <= level)
    return [...base, ...subFiltered]
  }
  return base
}

/**
 * Get the scaled value for a feature at a given level.
 * Uses the highest applicable threshold in scaling.byLevel.
 */
export function getScaledValueAtLevel(
  byLevel: Record<number, number>,
  level: number
): number {
  const thresholds = Object.keys(byLevel)
    .map(Number)
    .filter((l) => l <= level)
    .sort((a, b) => b - a)
  const best = thresholds[0]
  if (best == null) return 0
  const val = byLevel[best]
  return typeof val === 'number' ? val : 0
}
