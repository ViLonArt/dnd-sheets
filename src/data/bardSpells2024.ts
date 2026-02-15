import type { Spell } from '@/types/character'
import bardSpellsData from './classSpells/bard2024.json'

type BardSpellRow = {
  id: string
  level: number
  name: string
  name_fr: string
  school: string
  ritual: boolean
  concentration: boolean
}

const toSpell = (row: BardSpellRow, locale: 'en' | 'fr'): Spell => ({
  id: row.id,
  name: locale === 'fr' ? row.name_fr : row.name,
  level: row.level,
  school: row.school,
  type: 'Action',
  range: '—',
  duration: '—',
  components: '—',
  ritual: row.ritual,
  concentration: row.concentration,
})

export const BARD_SPELLS_EN: Spell[] = (bardSpellsData as BardSpellRow[]).map((r) => toSpell(r, 'en'))
export const BARD_SPELLS_FR: Spell[] = (bardSpellsData as BardSpellRow[]).map((r) => toSpell(r, 'fr'))

export function getBardSpells(locale: 'en' | 'fr'): Spell[] {
  return locale === 'fr' ? BARD_SPELLS_FR : BARD_SPELLS_EN
}
