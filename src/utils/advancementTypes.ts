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
  /** Optional: levels when the class grants a skill proficiency choice (e.g. Barbarian Primal Knowledge) */
  skillChoiceLevels?: number[]
  /** Optional: skill keys available for skillChoiceLevels (e.g. Barbarian class skills) */
  skillChoicePool?: string[]
  multiclassPrerequisites: ClassPrerequisites
}

export type SubclassDefinition = {
  id: string
  classId: string
  nameKey: string
  spellcasting?: SpellcastingProgression
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
}

export type LevelUpResult = {
  character?: AdvancementCharacter
  draft: LevelUpDraft
  errors: ValidationError[]
}
