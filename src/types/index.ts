/**
 * Central export point for all types and schemas
 */

// Character types and schemas
export type {
  Character,
  Attack,
  Trait,
  ProficiencyItem,
  ClassFeature,
  SpeciesTrait,
  Feat,
  Spell,
  SpellSlot,
  SpellSlots,
  SpellcastingAttribute,
  ItemCategory,
  InventoryItem,
} from './character'
export {
  CharacterSchema,
  AttackSchema,
  TraitSchema,
  ProficiencyItemSchema,
  ClassFeatureSchema,
  SpeciesTraitSchema,
  FeatSchema,
  SpellSchema,
  SpellSlotSchema,
  SpellSlotsSchema,
  SpellcastingAttributeSchema,
  ItemCategorySchema,
  InventoryItemSchema,
  isValidCharacter,
  createEmptyCharacter,
} from './character'

// PC automation types
export type { PcData, SlotOverrides } from './pc'

// NPC types and schemas
export type { Npc, PortraitState } from './npc'
export {
  NpcSchema,
  PortraitStateSchema,
  isValidNpc,
  createEmptyNpc,
} from './npc'

// Ability types and utilities
export type {
  AbilityKey,
  Abilities,
  SavingThrowProficiencies,
  SkillKey,
  SkillProficiencies,
} from './abilities'
export {
  AbilitiesSchema,
  calculateAbilityModifier,
  parseAbilityScore,
  formatAbilityScore,
} from './abilities'

