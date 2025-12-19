import type { AbilityKey, SkillKey } from '@/types/abilities'

export interface SkillData {
  key: SkillKey
  ability: AbilityKey
  label: string
}

export const SKILL_DATA: SkillData[] = [
  { key: 'acrobatics', ability: 'dex', label: 'Acrobaties (DEX)' },
  { key: 'animalHandling', ability: 'wis', label: 'Dressage (SAG)' },
  { key: 'arcana', ability: 'int', label: 'Arcanes (INT)' },
  { key: 'athletics', ability: 'str', label: 'Athlétisme (FOR)' },
  { key: 'deception', ability: 'cha', label: 'Supercherie (CHA)' },
  { key: 'history', ability: 'int', label: 'Histoire (INT)' },
  { key: 'insight', ability: 'wis', label: 'Perspicacité (SAG)' },
  { key: 'intimidation', ability: 'cha', label: 'Intimidation (CHA)' },
  { key: 'investigation', ability: 'int', label: 'Investigation (INT)' },
  { key: 'medicine', ability: 'wis', label: 'Médecine (SAG)' },
  { key: 'nature', ability: 'int', label: 'Nature (INT)' },
  { key: 'perception', ability: 'wis', label: 'Perception (SAG)' },
  { key: 'performance', ability: 'cha', label: 'Représentation (CHA)' },
  { key: 'persuasion', ability: 'cha', label: 'Persuasion (CHA)' },
  { key: 'religion', ability: 'int', label: 'Religion (INT)' },
  { key: 'sleight', ability: 'dex', label: 'Escamotage (DEX)' },
  { key: 'stealth', ability: 'dex', label: 'Discrétion (DEX)' },
  { key: 'survival', ability: 'wis', label: 'Survie (SAG)' },
]

export const ABILITIES_ORDER: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

export const ABILITY_LABELS: Record<AbilityKey, string> = {
  str: 'FOR',
  dex: 'DEX',
  con: 'CON',
  int: 'INT',
  wis: 'SAG',
  cha: 'CHA',
}

