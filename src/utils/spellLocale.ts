import type { Spell } from '@/types/character'

export type SpellLocale = 'en' | 'fr'

export const SPELL_LOCALE_OPTIONS: Array<{ value: SpellLocale; label: string }> = [
  { value: 'en', label: 'English (SRD)' },
  { value: 'fr', label: 'Français (SRD)' },
]

/**
 * French localization is a lightweight mapping for core spell fields.
 * When a full French dataset is available, it should be preferred.
 */
const SCHOOL_FR: Record<string, string> = {
  Abjuration: 'Abjuration',
  Conjuration: 'Conjuration',
  Divination: 'Divination',
  Enchantment: 'Enchantement',
  Evocation: 'Évocation',
  Illusion: 'Illusion',
  Necromancy: 'Nécromancie',
  Transmutation: 'Transmutation',
}

const DAMAGE_FR: Record<string, string> = {
  Slashing: 'Tranchant',
  Piercing: 'Perforant',
  Bludgeoning: 'Contondant',
  Fire: 'Feu',
  Cold: 'Froid',
  Lightning: 'Foudre',
  Thunder: 'Tonnerre',
  Acid: 'Acide',
  Poison: 'Poison',
  Psychic: 'Psychique',
  Radiant: 'Radiant',
  Necrotic: 'Nécrotique',
  Force: 'Force',
}

const TYPE_FR: Record<string, string> = {
  Action: 'Action',
  'Bonus action': 'Action bonus',
  Reaction: 'Réaction',
}

const translateUnits = (value: string) =>
  value
    .replace(/(\d+)-foot\b/gi, '$1 pieds')
    .replace(/(\d+)\s*feet\b/gi, '$1 pieds')
    .replace(/(\d+)-mile\b/gi, '$1 miles')
    .replace(/(\d+)\s*miles?\b/gi, '$1 miles')
    .replace(/\brounds\b/gi, 'tours')
    .replace(/\bround\b/gi, 'tour')

const translateRange = (value: string) =>
  translateUnits(value)
    .replace(/\bSelf\b/g, 'Personnelle')
    .replace(/\bTouch\b/g, 'Contact')
    .replace(/\bSight\b/g, 'Vue')
    .replace(/\bUnlimited\b/g, 'Illimitée')
    .replace(/\bSpecial\b/g, 'Spéciale')
    .replace(/\bcone\b/gi, 'cône')
    .replace(/\bline\b/gi, 'ligne')
    .replace(/\bradius\b/gi, 'rayon')
    .replace(/\bhemisphere\b/gi, 'hémisphère')
    .replace(/\bsphere\b/gi, 'sphère')
    .replace(/\bcube\b/gi, 'cube')

const translateDuration = (value: string) => {
  let output = translateUnits(value)
  output = output
    .replace(/\bone\b/gi, '1')
    .replace(/\bInstantaneous\b/gi, 'Instantané')
    .replace(/\bConcentration\b/gi, 'Concentration')
    .replace(/\bUp to\b/gi, "Jusqu'à")
    .replace(/\bUntil dispelled\b/gi, "Jusqu'à dissipation")
    .replace(/\bUntil dispelled or triggered\b/gi, "Jusqu'à dissipation ou déclenchement")
    .replace(/\bhours\b/gi, 'heures')
    .replace(/\bhour\b/gi, 'heure')
    .replace(/\bminutes\b/gi, 'minutes')
    .replace(/\bminute\b/gi, 'minute')
    .replace(/\bdays\b/gi, 'jours')
    .replace(/\bday\b/gi, 'jour')
  return output
}

const translateCastingTime = (value: string) => {
  if (TYPE_FR[value]) return TYPE_FR[value]
  let output = translateUnits(value)
  output = output
    .replace(/\bbonus action\b/gi, 'action bonus')
    .replace(/\breaction\b/gi, 'réaction')
    .replace(/\bhours\b/gi, 'heures')
    .replace(/\bhour\b/gi, 'heure')
    .replace(/\bminutes\b/gi, 'minutes')
    .replace(/\bminute\b/gi, 'minute')
  return output
}

export const localizeSpell = (spell: Spell, locale: SpellLocale): Spell => {
  if (locale === 'en') return spell

  return {
    ...spell,
    school: SCHOOL_FR[spell.school] ?? spell.school,
    type: translateCastingTime(spell.type),
    range: translateRange(spell.range),
    duration: translateDuration(spell.duration),
    damageType: spell.damageType ? DAMAGE_FR[spell.damageType] ?? spell.damageType : spell.damageType,
  }
}
