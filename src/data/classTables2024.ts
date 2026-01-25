export type LevelProgression = {
  slots: [number, number, number, number, number, number, number, number, number, number]
  resourceCount: number
  subclassFeature: boolean
}

export type ClassProgression = {
  name: string
  subclassLabel: string
  spellcasting: 'none' | 'full' | 'half' | 'pact'
  resourceName: string | null
  levels: LevelProgression[]
}

const FULL_CASTER_SLOTS: number[][] = [
  [2, 0, 0, 0, 0, 0, 0, 0, 0],
  [3, 0, 0, 0, 0, 0, 0, 0, 0],
  [4, 2, 0, 0, 0, 0, 0, 0, 0],
  [4, 3, 0, 0, 0, 0, 0, 0, 0],
  [4, 3, 2, 0, 0, 0, 0, 0, 0],
  [4, 3, 3, 0, 0, 0, 0, 0, 0],
  [4, 3, 3, 1, 0, 0, 0, 0, 0],
  [4, 3, 3, 2, 0, 0, 0, 0, 0],
  [4, 3, 3, 3, 1, 0, 0, 0, 0],
  [4, 3, 3, 3, 2, 0, 0, 0, 0],
  [4, 3, 3, 3, 2, 1, 0, 0, 0],
  [4, 3, 3, 3, 2, 1, 0, 0, 0],
  [4, 3, 3, 3, 2, 1, 1, 0, 0],
  [4, 3, 3, 3, 2, 1, 1, 0, 0],
  [4, 3, 3, 3, 2, 1, 1, 1, 0],
  [4, 3, 3, 3, 2, 1, 1, 1, 0],
  [4, 3, 3, 3, 2, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 2, 1, 1],
]

const PACT_MAGIC_SLOTS: number[][] = [
  [1, 0, 0, 0, 0, 0, 0, 0, 0],
  [2, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 2, 0, 0, 0, 0, 0, 0, 0],
  [0, 2, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 2, 0, 0, 0, 0, 0, 0],
  [0, 0, 2, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 2, 0, 0, 0, 0, 0],
  [0, 0, 0, 2, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 2, 0, 0, 0, 0],
  [0, 0, 0, 0, 2, 0, 0, 0, 0],
  [0, 0, 0, 0, 3, 0, 0, 0, 0],
  [0, 0, 0, 0, 3, 0, 0, 0, 0],
  [0, 0, 0, 0, 3, 0, 0, 0, 0],
  [0, 0, 0, 0, 3, 0, 0, 0, 0],
  [0, 0, 0, 0, 3, 0, 0, 0, 0],
  [0, 0, 0, 0, 3, 0, 0, 0, 0],
  [0, 0, 0, 0, 4, 0, 0, 0, 0],
  [0, 0, 0, 0, 4, 0, 0, 0, 0],
  [0, 0, 0, 0, 4, 0, 0, 0, 0],
  [0, 0, 0, 0, 4, 0, 0, 0, 0],
]

const ZERO_SLOTS: [number, number, number, number, number, number, number, number, number, number] = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
]

const SUBCLASS_LEVELS = new Set([3, 6, 10, 14])

const proficiencyBonus = (level: number) => Math.ceil(level / 4) + 1

const withCantrips = (slots: number[]): LevelProgression['slots'] => [
  0,
  slots[0] ?? 0,
  slots[1] ?? 0,
  slots[2] ?? 0,
  slots[3] ?? 0,
  slots[4] ?? 0,
  slots[5] ?? 0,
  slots[6] ?? 0,
  slots[7] ?? 0,
  slots[8] ?? 0,
]

const getFullCasterSlots = (level: number) => withCantrips(FULL_CASTER_SLOTS[level - 1] || [])

const getHalfCasterSlots = (level: number) => {
  const effectiveLevel = Math.ceil(level / 2)
  return withCantrips(FULL_CASTER_SLOTS[effectiveLevel - 1] || [])
}

const getPactSlots = (level: number) => withCantrips(PACT_MAGIC_SLOTS[level - 1] || [])

const getSlotsByType = (spellcasting: ClassProgression['spellcasting'], level: number) => {
  if (spellcasting === 'full') return getFullCasterSlots(level)
  if (spellcasting === 'half') return getHalfCasterSlots(level)
  if (spellcasting === 'pact') return getPactSlots(level)
  return ZERO_SLOTS
}

const buildLevels = (
  spellcasting: ClassProgression['spellcasting'],
  resourceCountForLevel: (level: number) => number
): LevelProgression[] =>
  Array.from({ length: 20 }, (_, index) => {
    const level = index + 1
    return {
      slots: getSlotsByType(spellcasting, level),
      resourceCount: resourceCountForLevel(level),
      subclassFeature: SUBCLASS_LEVELS.has(level),
    }
  })

const barbarianRage = (level: number) => {
  if (level <= 2) return 2
  if (level <= 5) return 3
  if (level <= 11) return 4
  if (level <= 16) return 5
  return 6
}

const warlockArcanum = (level: number) => {
  if (level >= 17) return 4
  if (level >= 15) return 3
  if (level >= 13) return 2
  if (level >= 11) return 1
  return 0
}

export const CLASSES_2024: Record<string, ClassProgression> = {
  Barbare: {
    name: 'Barbare',
    subclassLabel: 'Voie Barbare',
    spellcasting: 'none',
    resourceName: 'Rage',
    levels: buildLevels('none', barbarianRage),
  },
  Barde: {
    name: 'Barde',
    subclassLabel: 'Collège',
    spellcasting: 'full',
    resourceName: 'Inspiration Bardique',
    levels: buildLevels('full', proficiencyBonus),
  },
  Clerc: {
    name: 'Clerc',
    subclassLabel: 'Domaine Divin',
    spellcasting: 'full',
    resourceName: 'Conduit Divin',
    levels: buildLevels('full', proficiencyBonus),
  },
  Druide: {
    name: 'Druide',
    subclassLabel: 'Cercle druidique',
    spellcasting: 'full',
    resourceName: 'Forme Sauvage',
    levels: buildLevels('full', proficiencyBonus),
  },
  Guerrier: {
    name: 'Guerrier',
    subclassLabel: 'Archétype Martial',
    spellcasting: 'none',
    resourceName: 'Second Souffle',
    levels: buildLevels('none', proficiencyBonus),
  },
  Moine: {
    name: 'Moine',
    subclassLabel: 'Tradition Monastique',
    spellcasting: 'none',
    resourceName: 'Points de Focalisation',
    levels: buildLevels('none', (level) => level),
  },
  Paladin: {
    name: 'Paladin',
    subclassLabel: 'Serment Sacré',
    spellcasting: 'half',
    resourceName: 'Conduit Divin',
    levels: buildLevels('half', proficiencyBonus),
  },
  Rôdeur: {
    name: 'Rôdeur',
    subclassLabel: 'Archétype de Rôdeur',
    spellcasting: 'half',
    resourceName: null,
    levels: buildLevels('half', () => 0),
  },
  Roublard: {
    name: 'Roublard',
    subclassLabel: 'Archétype',
    spellcasting: 'none',
    resourceName: null,
    levels: buildLevels('none', () => 0),
  },
  Ensorceleur: {
    name: 'Ensorceleur',
    subclassLabel: 'Origine Sorcière',
    spellcasting: 'full',
    resourceName: 'Points de Sorcellerie',
    levels: buildLevels('full', (level) => level),
  },
  Occultiste: {
    name: 'Occultiste',
    subclassLabel: 'Pacte',
    spellcasting: 'pact',
    resourceName: 'Arcanum Mystique',
    levels: buildLevels('pact', warlockArcanum),
  },
  Magicien: {
    name: 'Magicien',
    subclassLabel: 'Tradition Arcanique',
    spellcasting: 'full',
    resourceName: 'Récupération Arcanique',
    levels: buildLevels('full', (level) => Math.max(1, Math.floor(level / 2))),
  },
}
