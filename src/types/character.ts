import { z } from 'zod'
import type { Abilities, SavingThrowProficiencies, SkillProficiencies } from './abilities'
import { AbilitiesSchema } from './abilities'

/**
 * Attack or spell entry
 */
export interface Attack {
  name: string
  bonus: string
  damage: string
  notes: string
}

/**
 * Trait or feature entry
 */
export interface Trait {
  name: string
  notes: string
}

/**
 * Spell entry
 */
export interface Spell {
  name: string
  level: string | number
  notes: string
  prepared: boolean
}

/**
 * Spell slot tracking for a specific level
 */
export interface SpellSlot {
  total: number
  used: number
}

/**
 * Spell slots by level (1-9)
 */
export type SpellSlots = Record<number, SpellSlot>

/**
 * Character sheet data model
 */
export interface Character {
  name: string
  classLevel: string
  background: string
  race: string
  alignment: string
  xp: string
  abilities: Abilities
  saves: SavingThrowProficiencies
  skills: SkillProficiencies
  ac: string // Armor Class
  init: string // Initiative
  speed: string
  hpMax: string
  hpCurrent: string
  hitDice: string
  attacks: Attack[]
  traits: Trait[]
  equipment: string
  backstory: string
  // Spellcasting
  spellAbility: string
  spellDC: string
  spellAtk: string
  spells: Spell[]
  spellSlots: SpellSlots
}

/**
 * Zod schema for Attack
 */
export const AttackSchema = z.object({
  name: z.string(),
  bonus: z.string(),
  damage: z.string(),
  notes: z.string(),
})

/**
 * Zod schema for Trait
 */
export const TraitSchema = z.object({
  name: z.string(),
  notes: z.string(),
})

/**
 * Zod schema for Spell
 */
export const SpellSchema = z.object({
  name: z.string(),
  level: z.union([z.string(), z.number()]),
  notes: z.string(),
  prepared: z.boolean(),
})

/**
 * Zod schema for SpellSlot
 */
export const SpellSlotSchema = z.object({
  total: z.number().int().min(0),
  used: z.number().int().min(0),
})

/**
 * Zod schema for SpellSlots (record of level -> SpellSlot)
 */
export const SpellSlotsSchema = z.record(
  z.string().regex(/^\d+$/).transform(Number),
  SpellSlotSchema
)

/**
 * Zod schema for SavingThrowProficiencies
 */
export const SavingThrowProficienciesSchema = z.record(
  z.enum(['str', 'dex', 'con', 'int', 'wis', 'cha']),
  z.boolean()
)

/**
 * Zod schema for SkillProficiencies
 */
export const SkillProficienciesSchema = z.record(
  z.enum([
    'acrobatics',
    'animalHandling',
    'arcana',
    'athletics',
    'deception',
    'history',
    'insight',
    'intimidation',
    'investigation',
    'medicine',
    'nature',
    'perception',
    'performance',
    'persuasion',
    'religion',
    'sleight',
    'stealth',
    'survival',
  ]),
  z.boolean()
)

/**
 * Zod schema for Character (full validation)
 */
export const CharacterSchema = z.object({
  name: z.string(),
  classLevel: z.string(),
  background: z.string(),
  race: z.string(),
  alignment: z.string(),
  xp: z.string(),
  abilities: AbilitiesSchema,
  saves: SavingThrowProficienciesSchema,
  skills: SkillProficienciesSchema,
  ac: z.string(),
  init: z.string(),
  speed: z.string(),
  hpMax: z.string(),
  hpCurrent: z.string(),
  hitDice: z.string(),
  attacks: z.array(AttackSchema),
  traits: z.array(TraitSchema),
  equipment: z.string(),
  backstory: z.string(),
  spellAbility: z.string(),
  spellDC: z.string(),
  spellAtk: z.string(),
  spells: z.array(SpellSchema),
  spellSlots: SpellSlotsSchema,
})

/**
 * Type guard to check if data is a valid Character
 */
export function isValidCharacter(data: unknown): data is Character {
  return CharacterSchema.safeParse(data).success
}

/**
 * Default empty Character
 */
export function createEmptyCharacter(): Character {
  return {
    name: '',
    classLevel: '',
    background: '',
    race: '',
    alignment: '',
    xp: '',
    abilities: {
      str: 10,
      dex: 10,
      con: 10,
      int: 10,
      wis: 10,
      cha: 10,
    },
    saves: {
      str: false,
      dex: false,
      con: false,
      int: false,
      wis: false,
      cha: false,
    },
    skills: {
      acrobatics: false,
      animalHandling: false,
      arcana: false,
      athletics: false,
      deception: false,
      history: false,
      insight: false,
      intimidation: false,
      investigation: false,
      medicine: false,
      nature: false,
      perception: false,
      performance: false,
      persuasion: false,
      religion: false,
      sleight: false,
      stealth: false,
      survival: false,
    },
    ac: '',
    init: '',
    speed: '',
    hpMax: '',
    hpCurrent: '',
    hitDice: '',
    attacks: [],
    traits: [],
    equipment: '',
    backstory: '',
    spellAbility: '',
    spellDC: '',
    spellAtk: '',
    spells: [],
    spellSlots: {},
  }
}

