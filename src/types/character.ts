import { z } from 'zod'
import type { SlotOverrides } from './pc'
import type { Abilities, SavingThrowProficiencies, SkillProficiencies, AbilityKey } from './abilities'
import { AbilitiesSchema } from './abilities'

/**
 * Attack or spell entry
 */
export interface Attack {
  name: string
  damage: string
  ability: AbilityKey
  magicMod: string
  proficiencyLevel: 0 | 1 | 2
  notes: string
  special: string
}

/**
 * Trait or feature entry
 */
export interface Trait {
  name: string
  notes: string
}

/**
 * Proficiency entry
 */
export interface ProficiencyItem {
  name: string
  description: string
  category: 'armor' | 'weapon' | 'tool' | 'other'
}

/**
 * Class feature entry
 */
export interface ClassFeature {
  id: string
  name: string
  description: string
  activeFields: {
    type: boolean
    range: boolean
    value: boolean
    duration: boolean
    notes: boolean
    concentration: boolean
    ritual: boolean
  }
  data: {
    actionType?: 'action' | 'bonus' | 'reaction' | 'passive' | 'free'
    range?: string
    value?: string
    duration?: string
    notes?: string
    isConcentration?: boolean
    isRitual?: boolean
  }
  hasResource: boolean
  resourceMode?: 'none' | 'independent' | 'class'
  resourceLinkId?: string
  resource?: {
    current: number
    max: number
    reset: 'short' | 'long'
  }
}

/**
 * Species trait entry
 */
export interface SpeciesTrait {
  name: string
  description: string
}

/**
 * Feat entry
 */
export interface Feat {
  name: string
  description: string
}

/**
 * Spell entry
 */
export interface Spell {
  name: string
  level: string | number
  school: string
  type: string
  range: string
  duration: string
  components: string
  dice?: string
  concentration?: boolean
  ritual?: boolean
  saveThrow?: boolean
  saveThrowAbility?: 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA'
  description?: string
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
 * Spell slot overrides by level (1-9)
 */
export type SpellSlotOverrides = SlotOverrides

/**
 * Spellcasting attribute type
 */
export type SpellcastingAttribute = 'INT' | 'WIS' | 'CHA' | 'None'

/**
 * Inventory item categories
 */
export type ItemCategory = 'weapons' | 'consumables' | 'currency' | 'other'

/**
 * Inventory item entry
 */
export interface InventoryItem {
  name: string
  quantity: string
  notes: string
  category: ItemCategory
}

/**
 * Character sheet data model
 */
export interface Character {
  name: string
  class: string
  subclass: string
  subclassNotes: string
  level: number
  background: string
  race: string
  alignment: string
  xp: string
  abilities: Abilities
  saves: SavingThrowProficiencies
  skills: SkillProficiencies
  ac: string // Armor Class
  init: string // Initiative (computed)
  initMisc: number
  speed: string
  hpMax: string
  hpMaxOverride: string
  hpCurrent: string
  tempHp: string
  hitDiceType: number
  attacks: Attack[]
  traits: Trait[]
  proficiencies: ProficiencyItem[]
  proficienciesText: string
  classFeatures: ClassFeature[]
  speciesTraits: SpeciesTrait[]
  feats: Feat[]
  savingThrowAdvantages: string
  savingThrowDisadvantages: string
  conditions: string
  inventory: InventoryItem[]
  backstory: string
  // Description & Features
  biography: string
  otherProficiencies: string
  featuresTraits: string
  // Spellcasting
  spellcastingAttribute: SpellcastingAttribute
  spellDC: string
  spellAtk: string
  spells: Spell[]
  spellSlots: SpellSlots
  slotOverrides: SpellSlotOverrides
}

/**
 * Zod schema for Attack
 */
export const AttackSchema = z.object({
  name: z.string(),
  damage: z.string(),
  ability: z.enum(['str', 'dex', 'con', 'int', 'wis', 'cha']),
  magicMod: z.string(),
  proficiencyLevel: z.number().int().min(0).max(2),
  notes: z.string(),
  special: z.string(),
})

/**
 * Zod schema for Trait
 */
export const TraitSchema = z.object({
  name: z.string(),
  notes: z.string(),
})

/**
 * Zod schema for ProficiencyItem
 */
export const ProficiencyItemSchema = z.object({
  name: z.string(),
  description: z.string(),
  category: z.enum(['armor', 'weapon', 'tool', 'other']),
})

/**
 * Zod schema for ClassFeature
 */
export const ClassFeatureSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  activeFields: z.object({
    type: z.boolean(),
    range: z.boolean(),
    value: z.boolean(),
    duration: z.boolean(),
    notes: z.boolean(),
    concentration: z.boolean(),
    ritual: z.boolean(),
  }),
  data: z.object({
    actionType: z.enum(['action', 'bonus', 'reaction', 'passive', 'free']).optional(),
    range: z.string().optional(),
    value: z.string().optional(),
    duration: z.string().optional(),
    notes: z.string().optional(),
    isConcentration: z.boolean().optional(),
    isRitual: z.boolean().optional(),
  }),
  hasResource: z.boolean(),
  resourceMode: z.enum(['none', 'independent', 'class']).optional(),
  resourceLinkId: z.string().optional(),
  resource: z
    .object({
      current: z.number().int().min(0),
      max: z.number().int().min(0),
      reset: z.enum(['short', 'long']),
    })
    .optional(),
})

/**
 * Zod schema for SpeciesTrait
 */
export const SpeciesTraitSchema = z.object({
  name: z.string(),
  description: z.string(),
})

/**
 * Zod schema for Feat
 */
export const FeatSchema = z.object({
  name: z.string(),
  description: z.string(),
})

/**
 * Zod schema for Spell
 */
export const SpellSchema = z.object({
  name: z.string(),
  level: z.union([z.string(), z.number()]),
  school: z.string(),
  type: z.string(),
  range: z.string(),
  duration: z.string(),
  components: z.string(),
  dice: z.string().optional(),
  concentration: z.boolean().optional(),
  ritual: z.boolean().optional(),
  saveThrow: z.boolean().optional(),
  saveThrowAbility: z.enum(['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']).optional(),
  description: z.string().optional(),
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
 * Zod schema for SpellSlotOverrides (record of level -> override)
 */
export const SpellSlotOverridesSchema = z.record(
  z.string().regex(/^\d+$/).transform(Number),
  z.number().int()
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
  z.number().int().min(0).max(2)
)

/**
 * Zod schema for SpellcastingAttribute
 */
export const SpellcastingAttributeSchema = z.enum(['INT', 'WIS', 'CHA', 'None'])

/**
 * Zod schema for InventoryItem
 */
export const ItemCategorySchema = z.enum(['weapons', 'consumables', 'currency', 'other'])

export const InventoryItemSchema = z.object({
  name: z.string(),
  quantity: z.string(),
  notes: z.string(),
  category: ItemCategorySchema,
})

/**
 * Zod schema for Character (full validation)
 */
export const CharacterSchema = z.object({
  name: z.string(),
  class: z.string(),
  subclass: z.string(),
  subclassNotes: z.string(),
  level: z.number().int().min(1).max(20),
  background: z.string(),
  race: z.string(),
  alignment: z.string(),
  xp: z.string(),
  abilities: AbilitiesSchema,
  saves: SavingThrowProficienciesSchema,
  skills: SkillProficienciesSchema,
  ac: z.string(),
  init: z.string(),
  initMisc: z.number().int(),
  speed: z.string(),
  hpMax: z.string(),
  hpMaxOverride: z.string(),
  hpCurrent: z.string(),
  tempHp: z.string(),
  hitDiceType: z.number().int().min(4).max(12),
  attacks: z.array(AttackSchema),
  traits: z.array(TraitSchema),
  proficiencies: z.array(ProficiencyItemSchema),
  proficienciesText: z.string(),
  classFeatures: z.array(ClassFeatureSchema),
  speciesTraits: z.array(SpeciesTraitSchema),
  feats: z.array(FeatSchema),
  savingThrowAdvantages: z.string(),
  savingThrowDisadvantages: z.string(),
  conditions: z.string(),
  inventory: z.array(InventoryItemSchema),
  backstory: z.string(),
  biography: z.string(),
  otherProficiencies: z.string(),
  featuresTraits: z.string(),
  spellcastingAttribute: SpellcastingAttributeSchema,
  spellDC: z.string(),
  spellAtk: z.string(),
  spells: z.array(SpellSchema),
  spellSlots: SpellSlotsSchema,
  slotOverrides: SpellSlotOverridesSchema,
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
    class: '',
    subclass: '',
    subclassNotes: '',
    level: 1,
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
      acrobatics: 0,
      animalHandling: 0,
      arcana: 0,
      athletics: 0,
      deception: 0,
      history: 0,
      insight: 0,
      intimidation: 0,
      investigation: 0,
      medicine: 0,
      nature: 0,
      perception: 0,
      performance: 0,
      persuasion: 0,
      religion: 0,
      sleight: 0,
      stealth: 0,
      survival: 0,
    },
    ac: '',
    init: '',
    initMisc: 0,
    speed: '',
    hpMax: '',
    hpMaxOverride: '',
    hpCurrent: '',
    tempHp: '',
    hitDiceType: 8,
    attacks: [],
    traits: [],
    proficiencies: [],
    proficienciesText: '',
    classFeatures: [],
    speciesTraits: [],
    feats: [],
    savingThrowAdvantages: '',
    savingThrowDisadvantages: '',
    conditions: '',
    inventory: [],
    backstory: '',
    biography: '',
    otherProficiencies: '',
    featuresTraits: '',
    spellcastingAttribute: 'None',
    spellDC: '',
    spellAtk: '',
    spells: [],
    spellSlots: {},
    slotOverrides: {},
  }
}

