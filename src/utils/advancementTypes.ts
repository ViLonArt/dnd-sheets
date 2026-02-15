import type { Abilities, AbilityKey } from '@/types/abilities'

export type Locale = 'en' | 'fr'

export type LocalizedText = Partial<Record<Locale, string>>

export type AdvancementMode = 'xp' | 'milestone'

export type SpellcastingProgression = 'none' | 'full' | 'half' | 'pact' | 'third'

export type ClassPrerequisites = {
  all: AbilityKey[]
  any: AbilityKey[]
}

export type WeaponMasteryGrant = {
  level: number
  count: number
  filters: Array<'any' | 'melee' | 'ranged' | 'finesse' | 'light'>
}

/** Feature types for D&D 2024 class features */
export type FeatureType = 'PASSIVE' | 'ACTION' | 'RESOURCE' | 'CHOICE' | 'MODIFIER'

/** Level-based scaling for resource counts or damage values */
export type FeatureScaling = {
  /** Map of level threshold (inclusive) to value, e.g. { 1: 2, 3: 3, 6: 4 } */
  byLevel: Record<number, number>
  /** Optional reset period for resources */
  reset?: 'short' | 'long'
}

/** Choice definition when feature type is CHOICE */
export type FeatureChoice = {
  /** Pool of options: weapon IDs, skill keys, feat categories, etc. */
  pool: 'WeaponMastery' | 'Skills' | 'Spells' | 'Feats' | string
  /** Number of selections (e.g. "Choose 2") */
  count: number
  /** Optional: filter for pool (e.g. "epicBoon" for Epic Boon feat choice) */
  category?: string
}

/** Choice type for structured selections */
export type StructuredChoiceType =
  | 'spell'
  | 'skillProficiency'
  | 'weaponProficiency'
  | 'toolProficiency'
  | 'weaponMastery'
  | 'feat'
  | 'subclass'

/** Source database for structured choices */
export type StructuredChoiceSourcePool =
  | 'spellsSrd'
  | 'spellsSrdFr'
  | 'spellsBard'
  | 'weaponMastery'
  | 'weapons'
  | 'skills'
  | 'feats'
  | 'subclasses'

/** Filter criteria for structured choices */
export type StructuredChoiceFilters = {
  spellLevel?: number
  /** Max spell level (1–9). When set, include spells of level 1 through this value. */
  maxSpellLevel?: number
  spellSchool?: string
  spellClass?: 'wizard' | 'cleric' | 'druid' | 'sorcerer' | 'warlock' | 'bard' | 'paladin' | 'ranger'
  weaponType?: 'melee' | 'ranged'
  weaponProficiency?: 'simple' | 'martial'
  featCategory?: string
  skillPool?: string[]
}

/**
 * Structured choice definition for data-driven selection UI.
 * Replaces text notes with queryable, filterable selection requests.
 */
export type StructuredChoiceDefinition = {
  id: string
  nameKey: string
  choiceType: StructuredChoiceType
  quantity: number
  sourcePool: StructuredChoiceSourcePool
  filters?: StructuredChoiceFilters
}

/**
 * Unified Feature schema for D&D 2024 class/species features.
 * Drives UI display and choice resolution without hardcoded logic.
 */
export type Feature = {
  id: string
  nameKey: string
  descriptionKey?: string
  type: FeatureType
  /** Level at which this feature is gained */
  level: number
  /** For RESOURCE: scaling (e.g. Rage count); for MODIFIER: damage or stat scaling */
  scaling?: FeatureScaling
  /** For CHOICE: defines the selection pool and count */
  choices?: FeatureChoice
  /** Optional: links to resource ID for tracking (e.g. rage, spell slots) */
  resourceId?: string
  /** Optional: modifier key (e.g. "rageDamage" for +2/+3/+4) */
  modifierKey?: string
}

export type ClassDefinition = {
  id: string
  nameKey: string
  subclassKey: string
  hitDie: number
  spellcasting: Exclude<SpellcastingProgression, 'third'>
  subclassLevel: number
  fightingStyleLevels: number[]
  weaponMastery: WeaponMasteryGrant[]
  asiLevels: number[]
  /** Optional: levels when the class grants a skill proficiency choice (e.g. Barbarian Primal Knowledge, Bard skills) */
  skillChoiceLevels?: number[]
  /** Optional: skill keys available for skillChoiceLevels (e.g. Barbarian class skills, or all for Bard) */
  skillChoicePool?: string[]
  /** Optional: number of skills to choose when skillChoiceLevels applies (default 1, Bard uses 3) */
  skillChoiceCount?: number
  /** Optional: levels when the class grants a tool proficiency choice (e.g. Bard musical instruments) */
  toolChoiceLevels?: number[]
  /** Optional: tool ids for toolChoiceLevels (e.g. musical instrument ids) */
  toolChoicePool?: string[]
  /** Optional: number of tools to choose (default 1, Bard uses 3) */
  toolChoiceCount?: number
  /** Optional: class levels when you learn a new spell (e.g. Bard: 2–20) */
  spellLearnLevels?: number[]
  /** Optional: class levels when you can replace one known spell (e.g. Bard: 2–20) */
  spellReplaceLevels?: number[]
  multiclassPrerequisites: ClassPrerequisites
}

export type SubclassDefinition = {
  id: string
  classId: string
  nameKey: string
  spellcasting?: SpellcastingProgression
  /** Bonus proficiencies from this subclass (e.g. College of Valor) */
  weaponProficiencies?: string[]
  armorProficiencies?: string[]
}

export type FeatCategory = 'origin' | 'general' | 'fightingStyle' | 'epicBoon'

export type FeatDefinition = {
  id: string
  nameKey: string
  descriptionKey: string
  category: FeatCategory
  repeatable: boolean
  tags?: string[]
}

export type WeaponMasteryProperty = {
  id: string
  nameKey: string
  descriptionKey: string
}

export type WeaponDefinition = {
  id: string
  nameKey: string
  mastery: string
  type: 'melee' | 'ranged'
  proficiency: 'simple' | 'martial'
  traits: string[]
}

export type SpeciesTrait = {
  id: string
  level: number
  nameKey: string
  descriptionKey: string
}

export type SpeciesChoiceOption = {
  id: string
  nameKey: string
  descriptionKey?: string
  description?: LocalizedText
  /** When this option is selected, show this structured choice (e.g. High Elf -> pick Wizard Cantrip) */
  structuredChoice?: StructuredChoiceDefinition
}

export type SpeciesChoice = {
  id: string
  level: number
  nameKey: string
  options?: SpeciesChoiceOption[]
  optionsFrom?: 'originFeats' | 'allSkills'
}

export type SpeciesDefinition = {
  id: string
  nameKey: string
  traits: SpeciesTrait[]
  choices: SpeciesChoice[]
}

export type BackgroundDefinition = {
  id: string
  nameKey: string
  descriptionKey?: string
  name?: LocalizedText
  description?: LocalizedText
  abilityOptions?: AbilityKey[]
  abilityChoices: AbilityKey[]
  skillChoices: string[][]
  skills?: string[]
  tool?: LocalizedText | string
  toolProficiency: string | string[]
  originFeatId: string
  originFeatList?: string
  /** Structured choices (e.g. Magic Initiate spell picks) driven from data */
  structuredChoices?: StructuredChoiceDefinition[]
}

export type Ruleset2024 = {
  classes: Record<string, ClassDefinition>
  subclasses: Record<string, SubclassDefinition>
  feats: Record<string, FeatDefinition>
  weaponMastery: {
    properties: Record<string, WeaponMasteryProperty>
    weapons: Record<string, WeaponDefinition>
    tacticalMasteryOverrides: string[]
  }
  species: Record<string, SpeciesDefinition>
  backgrounds: Record<string, BackgroundDefinition>
  xpThresholds: Record<number, number>
}

export type CharacterClassLevel = {
  classId: string
  level: number
  subclassId?: string
}

export type AdvancementCharacter = {
  level: number
  xp: number
  abilities: Abilities
  classes: CharacterClassLevel[]
  speciesId?: string
  backgroundId?: string
  feats: string[]
  weaponProficiencies: string[]
  weaponMasteries: string[]
  choices: Record<string, string[]>
}

export type ChoiceType =
  | 'subclass'
  | 'feat'
  | 'featOrAsi'
  | 'fightingStyle'
  | 'weaponMastery'
  | 'classSkill'
  | 'speciesChoice'
  | 'backgroundChoice'
  | 'backgroundAbility'
  | 'backgroundSkill'
  | 'backgroundTool'
  | 'featureSkill'
  | 'featureSpell'
  | 'bardSpellLearn'
  | 'bardSpellReplace'

/** When set, this choice is only required when the dependency choice has the given value */
export type ChoiceDependsOn = {
  choiceId: string
  value: string
}

export type ChoiceOption = {
  id: string
  nameKey: string
  meta?: Record<string, string>
}

export type ChoiceRequirement = {
  id: string
  type: ChoiceType
  labelKey: string
  level: number
  source: {
    type: 'class' | 'species' | 'background' | 'feat'
    id: string
  }
  options: ChoiceOption[]
  minSelections: number
  maxSelections: number
  meta?: Record<string, string | string[]>
  /** When set, this choice is only required when the dependency is satisfied */
  dependsOn?: ChoiceDependsOn
  /** When set, this choice is only shown when the referenced choice has at least one selection */
  showWhenChoiceFilled?: string
}

export type AbilityIncrease = {
  ability: AbilityKey
  amount: 1 | 2
}

export type LevelUpDecision = {
  choiceId: string
  optionIds: string[]
  abilityIncreases?: AbilityIncrease[]
}

export type ValidationError = {
  code: string
  messageKey: string
  meta?: Record<string, unknown>
}

export type LevelUpDraft = {
  current: AdvancementCharacter
  next: AdvancementCharacter
  targetLevel: number
  proficiencyBonus: number
  choices: ChoiceRequirement[]
  errors: ValidationError[]
}

export type LevelUpRequest = {
  character: AdvancementCharacter
  targetLevel: number
  levelingClassId: string
  advancementMode: AdvancementMode
  /** Current character spells (for Bard spell-replace options) */
  currentSpells?: Array<{ id: string; name: string; level: string | number; sourceId?: string }>
}

export type LevelUpResult = {
  character?: AdvancementCharacter
  draft: LevelUpDraft
  errors: ValidationError[]
}
