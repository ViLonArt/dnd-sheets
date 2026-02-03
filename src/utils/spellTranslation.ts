import type { Spell } from '@/types/character'
import type { SpellLocale } from '@/utils/spellLocale'
import { SRD_SPELLS } from '@/data/spellsSrd'
import { SRD_SPELLS_FR } from '@/data/spellsSrdFr'
import { SRD_SPELL_TRANSLATIONS } from '@/data/spellTranslationMap'

const EN_BY_ID = new Map(SRD_SPELLS.map((spell) => [spell.id, spell]))
const FR_BY_ID = new Map(SRD_SPELLS_FR.map((spell) => [spell.id, spell]))

const getEnglishId = (id: string) => {
  if (EN_BY_ID.has(id)) return id
  const mapped = SRD_SPELL_TRANSLATIONS.frToEn[id]
  if (mapped && EN_BY_ID.has(mapped)) return mapped
  return null
}

export const getCanonicalSourceId = (spellId: string) => getEnglishId(spellId)

export const translateSpellToLocale = (spell: Spell, locale: SpellLocale): Spell | null => {
  const englishId = getEnglishId(spell.sourceId ?? spell.id)
  if (!englishId) return null

  const targetId =
    locale === 'fr' ? SRD_SPELL_TRANSLATIONS.enToFr[englishId] : englishId
  const targetSpell =
    locale === 'fr' ? FR_BY_ID.get(targetId) : EN_BY_ID.get(targetId)

  if (!targetSpell) return null

  const next: Spell = {
    ...spell,
    sourceId: englishId,
    name: targetSpell.name,
    level: targetSpell.level ?? spell.level,
    school: targetSpell.school,
    type: targetSpell.type,
    range: targetSpell.range,
    duration: targetSpell.duration,
    components: targetSpell.components,
    dice: targetSpell.dice ?? spell.dice,
    damageType: targetSpell.damageType ?? spell.damageType,
    concentration: targetSpell.concentration ?? spell.concentration,
    ritual: targetSpell.ritual ?? spell.ritual,
    saveThrow: targetSpell.saveThrow ?? spell.saveThrow,
    saveThrowAbility: targetSpell.saveThrowAbility ?? spell.saveThrowAbility,
    description: targetSpell.description ?? spell.description,
  }

  const changed =
    next.sourceId !== spell.sourceId ||
    next.name !== spell.name ||
    next.level !== spell.level ||
    next.school !== spell.school ||
    next.type !== spell.type ||
    next.range !== spell.range ||
    next.duration !== spell.duration ||
    next.components !== spell.components ||
    next.dice !== spell.dice ||
    next.damageType !== spell.damageType ||
    next.concentration !== spell.concentration ||
    next.ritual !== spell.ritual ||
    next.saveThrow !== spell.saveThrow ||
    next.saveThrowAbility !== spell.saveThrowAbility ||
    next.description !== spell.description

  return changed ? next : null
}
