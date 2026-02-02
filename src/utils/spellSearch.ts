import type { Spell } from '@/types/character'
import { SRD_SPELLS } from '@/data/spellsSrd'

export type SpellSearchIndexEntry = {
  spell: Spell
  nameText: string
  searchText: string
  level: number
  schoolText: string
}

export type SpellSearchOptions = {
  level?: number
  school?: string
  limit?: number
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

const buildSearchText = (spell: Spell) =>
  normalizeText(
    [
      spell.name,
      String(spell.level),
      spell.school,
      spell.type,
      spell.range,
      spell.duration,
      spell.components,
      spell.description ?? '',
    ]
      .filter(Boolean)
      .join(' ')
  )

const toLevelNumber = (value: Spell['level']) => {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

export const SRD_SPELL_INDEX: SpellSearchIndexEntry[] = SRD_SPELLS.map((spell) => ({
  spell,
  nameText: normalizeText(spell.name),
  searchText: buildSearchText(spell),
  level: toLevelNumber(spell.level),
  schoolText: normalizeText(spell.school),
}))

export const searchSrdSpells = (query: string, options: SpellSearchOptions = {}): SpellSearchResult[] => {
  const normalizedQuery = normalizeText(query)
  if (!normalizedQuery) return []
  const tokens = normalizedQuery.split(' ').filter(Boolean)
  const limit = options.limit ?? 30
  const normalizedSchool = options.school ? normalizeText(options.school) : ''

  const results: SpellSearchResult[] = []

  for (const entry of SRD_SPELL_INDEX) {
    if (options.level !== undefined && entry.level !== options.level) continue
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
