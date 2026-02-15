import type { ClassDefinition } from '@/utils/advancementTypes'
import type { Feature } from '@/utils/advancementTypes'

/** Bardic Inspiration uses: PB per long rest (1–4), PB per short rest (5+) */
const BARDIC_INSPIRATION_SCALING = {
  byLevel: {
    1: 2, // PB at level 1
    5: 3,
    9: 4,
    13: 5,
    17: 6,
  },
  reset: 'long' as const,
}

/** Bardic Inspiration die size: d6 @ 1-4, d8 @ 5-9, d10 @ 10-14, d12 @ 15-20 */
const BARDIC_DIE_SCALING = {
  byLevel: {
    1: 6,
    5: 8,
    10: 10,
    15: 12,
  },
}

/** Bard features for D&D 2024, Level 1–20 */
export const BARD_FEATURES: Feature[] = [
  {
    id: 'bard-bardic-inspiration',
    nameKey: 'feature.bard.bardicInspiration.name',
    descriptionKey: 'feature.bard.bardicInspiration.desc',
    type: 'RESOURCE',
    level: 1,
    scaling: BARDIC_INSPIRATION_SCALING,
    resourceId: 'bardicInspiration',
    modifierKey: 'bardicDie',
  },
  {
    id: 'bard-bardic-die',
    nameKey: 'feature.bard.bardicDie.name',
    descriptionKey: 'feature.bard.bardicDie.desc',
    type: 'MODIFIER',
    level: 1,
    scaling: BARDIC_DIE_SCALING,
    modifierKey: 'bardicDie',
  },
  {
    id: 'bard-spellcasting',
    nameKey: 'feature.bard.spellcasting.name',
    descriptionKey: 'feature.bard.spellcasting.desc',
    type: 'PASSIVE',
    level: 1,
  },
  {
    id: 'bard-expertise',
    nameKey: 'feature.bard.expertise.name',
    descriptionKey: 'feature.bard.expertise.desc',
    type: 'CHOICE',
    level: 2,
    choices: {
      pool: 'Skills',
      count: 2,
    },
  },
  {
    id: 'bard-jack-of-all-trades',
    nameKey: 'feature.bard.jackOfAllTrades.name',
    descriptionKey: 'feature.bard.jackOfAllTrades.desc',
    type: 'PASSIVE',
    level: 2,
  },
  {
    id: 'bard-expertise-2',
    nameKey: 'feature.bard.expertise.name',
    descriptionKey: 'feature.bard.expertise.desc',
    type: 'CHOICE',
    level: 9,
    choices: {
      pool: 'Skills',
      count: 2,
    },
  },
  {
    id: 'bard-font-of-inspiration',
    nameKey: 'feature.bard.fontOfInspiration.name',
    descriptionKey: 'feature.bard.fontOfInspiration.desc',
    type: 'PASSIVE',
    level: 5,
  },
  {
    id: 'bard-countercharm',
    nameKey: 'feature.bard.countercharm.name',
    descriptionKey: 'feature.bard.countercharm.desc',
    type: 'ACTION',
    level: 7,
  },
  {
    id: 'bard-magical-secrets',
    nameKey: 'feature.bard.magicalSecrets.name',
    descriptionKey: 'feature.bard.magicalSecrets.desc',
    type: 'CHOICE',
    level: 10,
    choices: {
      pool: 'Spells',
      count: 2,
    },
  },
  {
    id: 'bard-superior-inspiration',
    nameKey: 'feature.bard.superiorInspiration.name',
    descriptionKey: 'feature.bard.superiorInspiration.desc',
    type: 'PASSIVE',
    level: 18,
  },
  {
    id: 'bard-words-of-creation',
    nameKey: 'feature.bard.wordsOfCreation.name',
    descriptionKey: 'feature.bard.wordsOfCreation.desc',
    type: 'ACTION',
    level: 20,
  },
]

/** Bard class definition for D&D 2024 */
export const BARD_CLASS: ClassDefinition = {
  id: 'bard',
  nameKey: 'class.bard.name',
  subclassKey: 'class.bard.subclass',
  hitDie: 8,
  spellcasting: 'full',
  subclassLevel: 3,
  fightingStyleLevels: [],
  weaponMastery: [],
  asiLevels: [4, 8, 12, 16, 19],
  skillChoiceLevels: [1],
  skillChoicePool: [
    'acrobatics',
    'animalHandling',
    'arcana',
    'athletics',
    'deception',
    'history',
    'insight',
    'intimidation',
    'investigation',
    'medicine',
    'nature',
    'perception',
    'performance',
    'persuasion',
    'religion',
    'sleight',
    'stealth',
    'survival',
  ],
  skillChoiceCount: 3,
  multiclassPrerequisites: { all: ['cha'], any: [] },
}
