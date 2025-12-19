/**
 * Central export point for all types and schemas
 */

// Character types and schemas
export type {
  Character,
  Attack,
  Trait,
  Spell,
  SpellSlot,
  SpellSlots,
  SpellcastingAttribute,
} from './character'
export {
  CharacterSchema,
  AttackSchema,
  TraitSchema,
  SpellSchema,
  SpellSlotSchema,
  SpellSlotsSchema,
  SpellcastingAttributeSchema,
  isValidCharacter,
  createEmptyCharacter,
} from './character'

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

