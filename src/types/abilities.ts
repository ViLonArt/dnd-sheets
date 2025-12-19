import { z } from 'zod'

/**
 * Ability score abbreviations
 */
export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'

/**
 * Ability scores as raw numbers (e.g., 16)
 */
export type Abilities = Record<AbilityKey, number>

/**
 * Proficiency flags for saving throws
 */
export type SavingThrowProficiencies = Record<AbilityKey, boolean>

/**
 * Skill keys matching D&D 5e skills
 */
export type SkillKey =
  | 'acrobatics'
  | 'animalHandling'
  | 'arcana'
  | 'athletics'
  | 'deception'
  | 'history'
  | 'insight'
  | 'intimidation'
  | 'investigation'
  | 'medicine'
  | 'nature'
  | 'perception'
  | 'performance'
  | 'persuasion'
  | 'religion'
  | 'sleight'
  | 'stealth'
  | 'survival'

/**
 * Proficiency flags for skills
 */
export type SkillProficiencies = Record<SkillKey, boolean>

/**
 * Calculate ability modifier from score
 */
export function calculateAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

/**
 * Parse ability score from formatted string (e.g., "16 (+3)" -> 16)
 */
export function parseAbilityScore(formatted: string): number {
  const match = formatted.match(/^(\d+)/)
  return match && match[1] ? parseInt(match[1], 10) : 10
}

/**
 * Format ability score with modifier (e.g., 16 -> "16 (+3)")
 */
export function formatAbilityScore(score: number): string {
  const modifier = calculateAbilityModifier(score)
  const sign = modifier >= 0 ? '+' : ''
  return `${score} (${sign}${modifier})`
}

/**
 * Zod schema for Abilities
 */
export const AbilitiesSchema = z.object({
  str: z.number().int().min(1).max(30),
  dex: z.number().int().min(1).max(30),
  con: z.number().int().min(1).max(30),
  int: z.number().int().min(1).max(30),
  wis: z.number().int().min(1).max(30),
  cha: z.number().int().min(1).max(30),
})

