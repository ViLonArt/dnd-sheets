import type { Spell } from '@/types/character'
import { SRD_SPELLS } from '@/data/spellsSrd'
import { SRD_SPELLS_FR } from '@/data/spellsSrdFr'
import { getBardSpells } from '@/data/bardSpells2024'
import type { SpellLocale } from '@/utils/spellLocale'

export type SpellSource = 'srd' | 'bard'

export type SpellSearchIndexEntry = {
  spell: Spell
  nameText: string
  searchText: string
  level: number
  schoolText: string
}

export type SpellSearchOptions = {
  level?: number
  /** Max spell level (1–9). Include spells where 1 <= level <= maxSpellLevel. */
  maxSpellLevel?: number
  school?: string
  limit?: number
  locale?: SpellLocale
}

export type SpellSearchResult = {
  spell: Spell
  score: number
}

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

const buildSearchText = (spell: Spell) => {
  const base = [
    spell.name,
    String(spell.level),
    spell.school,
    spell.type,
    spell.range,
    spell.duration,
    spell.components,
    spell.description ?? '',
  ]
  return normalizeText(base.filter(Boolean).join(' '))
}

const toLevelNumber = (value: Spell['level']) => {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

const buildIndexForLocale = (spells: Spell[]): SpellSearchIndexEntry[] =>
  spells.map((spell) => ({
    spell,
    nameText: normalizeText(spell.name),
    searchText: buildSearchText(spell),
    level: toLevelNumber(spell.level),
    schoolText: normalizeText(spell.school),
  }))

const SRD_SPELL_INDEX: Record<SpellLocale, SpellSearchIndexEntry[]> = {
  en: buildIndexForLocale(SRD_SPELLS),
  fr: buildIndexForLocale(SRD_SPELLS_FR),
}

export type SpellSourceOptions = SpellSearchOptions & { source?: 'srd' | 'bard' }

/** Get all spells matching filters (no search query). For ChoiceResolver spell pools. */
export const getFilteredSpells = (options: SpellSourceOptions = {}): Spell[] => {
  const locale: SpellLocale = options.locale ?? 'en'
  const source =
    options.source === 'bard'
      ? getBardSpells(locale === 'fr' ? 'fr' : 'en')
      : locale === 'fr'
        ? SRD_SPELLS_FR
        : SRD_SPELLS
  const limit = options.limit ?? 500

  if (options.level === undefined && options.maxSpellLevel === undefined && !options.school) {
    return source.slice(0, limit)
  }

  const toLevel = (v: Spell['level']) => {
    const n = typeof v === 'number' ? v : Number(v)
    return Number.isNaN(n) ? 0 : n
  }
  return source
    .filter((spell) => {
      const spellLvl = toLevel(spell.level)
      if (options.level !== undefined && spellLvl !== options.level) return false
      if (options.maxSpellLevel !== undefined && (spellLvl < 1 || spellLvl > options.maxSpellLevel))
        return false
      if (options.school && spell.school?.toLowerCase() !== options.school.toLowerCase()) return false
      return true
    })
    .slice(0, limit)
}

export const searchSrdSpells = (query: string, options: SpellSearchOptions = {}): SpellSearchResult[] => {
  const normalizedQuery = normalizeText(query)
  if (!normalizedQuery) return []
  const tokens = normalizedQuery.split(' ').filter(Boolean)
  const limit = options.limit ?? 30
  const normalizedSchool = options.school ? normalizeText(options.school) : ''
  const locale: SpellLocale = options.locale ?? 'en'
  const index = SRD_SPELL_INDEX[locale] ?? SRD_SPELL_INDEX.en

  const results: SpellSearchResult[] = []

  for (const entry of index) {
    if (options.level !== undefined && entry.level !== options.level) continue
    if (options.maxSpellLevel !== undefined && (entry.level < 1 || entry.level > options.maxSpellLevel))
      continue
    if (normalizedSchool && entry.schoolText !== normalizedSchool) continue

    const matchesAllTokens = tokens.every((token) => entry.searchText.includes(token))
    if (!matchesAllTokens) continue

    let score = 10
    if (entry.nameText === normalizedQuery) score += 100
    else if (entry.nameText.startsWith(normalizedQuery)) score += 70
    else if (entry.nameText.includes(normalizedQuery)) score += 50

    results.push({ spell: entry.spell, score })
  }

  return results
    .sort((a, b) => b.score - a.score || a.spell.name.localeCompare(b.spell.name))
    .slice(0, limit)
}
