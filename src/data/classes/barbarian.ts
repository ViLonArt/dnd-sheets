import type { ClassDefinition } from '@/utils/advancementTypes'
import type { Feature } from '@/utils/advancementTypes'

/** Rage count scaling by level: 2 @ 1-2, 3 @ 3-5, 4 @ 6-11, 5 @ 12-16, 6 @ 17-20 */
const RAGE_COUNT_SCALING = {
  byLevel: {
    1: 2,
    3: 3,
    6: 4,
    12: 5,
    17: 6,
  },
  reset: 'long' as const,
}

/** Rage damage bonus scaling: +2 @ 1-8, +3 @ 9-15, +4 @ 16-20 */
const RAGE_DAMAGE_SCALING = {
  byLevel: {
    1: 2,
    9: 3,
    16: 4,
  },
}

/** Barbarian features for D&D 2024, Level 1-20 */
export const BARBARIAN_FEATURES: Feature[] = [
  {
    id: 'barbarian-rage',
    nameKey: 'feature.barbarian.rage.name',
    descriptionKey: 'feature.barbarian.rage.desc',
    type: 'RESOURCE',
    level: 1,
    scaling: RAGE_COUNT_SCALING,
    resourceId: 'rage',
    modifierKey: 'rageDamage',
  },
  {
    id: 'barbarian-rage-damage',
    nameKey: 'feature.barbarian.rageDamage.name',
    descriptionKey: 'feature.barbarian.rageDamage.desc',
    type: 'MODIFIER',
    level: 1,
    scaling: RAGE_DAMAGE_SCALING,
    modifierKey: 'rageDamage',
  },
  {
    id: 'barbarian-unarmored-defense',
    nameKey: 'feature.barbarian.unarmoredDefense.name',
    descriptionKey: 'feature.barbarian.unarmoredDefense.desc',
    type: 'PASSIVE',
    level: 1,
  },
  {
    id: 'barbarian-weapon-mastery',
    nameKey: 'term.weaponMastery',
    descriptionKey: 'feature.barbarian.weaponMastery.desc',
    type: 'CHOICE',
    level: 1,
    choices: {
      pool: 'WeaponMastery',
      count: 2,
    },
  },
  {
    id: 'barbarian-danger-sense',
    nameKey: 'feature.barbarian.dangerSense.name',
    descriptionKey: 'feature.barbarian.dangerSense.desc',
    type: 'PASSIVE',
    level: 2,
  },
  {
    id: 'barbarian-reckless-attack',
    nameKey: 'feature.barbarian.recklessAttack.name',
    descriptionKey: 'feature.barbarian.recklessAttack.desc',
    type: 'ACTION',
    level: 2,
  },
  {
    id: 'barbarian-primal-knowledge',
    nameKey: 'feature.barbarian.primalKnowledge.name',
    descriptionKey: 'feature.barbarian.primalKnowledge.desc',
    type: 'CHOICE',
    level: 3,
    choices: {
      pool: 'Skills',
      count: 1,
    },
  },
  {
    id: 'barbarian-extra-attack',
    nameKey: 'feature.barbarian.extraAttack.name',
    descriptionKey: 'feature.barbarian.extraAttack.desc',
    type: 'PASSIVE',
    level: 5,
  },
  {
    id: 'barbarian-fast-movement',
    nameKey: 'feature.barbarian.fastMovement.name',
    descriptionKey: 'feature.barbarian.fastMovement.desc',
    type: 'PASSIVE',
    level: 5,
  },
  {
    id: 'barbarian-feral-instinct',
    nameKey: 'feature.barbarian.feralInstinct.name',
    descriptionKey: 'feature.barbarian.feralInstinct.desc',
    type: 'PASSIVE',
    level: 7,
  },
  {
    id: 'barbarian-brutal-strike',
    nameKey: 'feature.barbarian.brutalStrike.name',
    descriptionKey: 'feature.barbarian.brutalStrike.desc',
    type: 'ACTION',
    level: 9,
  },
  {
    id: 'barbarian-instinctive-pounce',
    nameKey: 'feature.barbarian.instinctivePounce.name',
    descriptionKey: 'feature.barbarian.instinctivePounce.desc',
    type: 'PASSIVE',
    level: 10,
  },
  {
    id: 'barbarian-relentless-rage',
    nameKey: 'feature.barbarian.relentlessRage.name',
    descriptionKey: 'feature.barbarian.relentlessRage.desc',
    type: 'RESOURCE',
    level: 11,
  },
  {
    id: 'barbarian-persistent-rage',
    nameKey: 'feature.barbarian.persistentRage.name',
    descriptionKey: 'feature.barbarian.persistentRage.desc',
    type: 'PASSIVE',
    level: 15,
  },
  {
    id: 'barbarian-epic-boon',
    nameKey: 'feature.barbarian.epicBoon.name',
    descriptionKey: 'feature.barbarian.epicBoon.desc',
    type: 'CHOICE',
    level: 19,
    choices: {
      pool: 'Feats',
      count: 1,
      category: 'epicBoon',
    },
  },
  {
    id: 'barbarian-primal-champion',
    nameKey: 'feature.barbarian.primalChampion.name',
    descriptionKey: 'feature.barbarian.primalChampion.desc',
    type: 'MODIFIER',
    level: 20,
    modifierKey: 'primalChampion',
  },
]

/** Barbarian class definition for D&D 2024 */
export const BARBARIAN_CLASS: ClassDefinition = {
  id: 'barbarian',
  nameKey: 'class.barbarian.name',
  subclassKey: 'class.barbarian.subclass',
  hitDie: 12,
  spellcasting: 'none',
  subclassLevel: 3,
  fightingStyleLevels: [],
  weaponMastery: [
    { level: 1, count: 2, filters: ['melee'] },
    { level: 4, count: 1, filters: ['melee'] },
    { level: 10, count: 1, filters: ['melee'] },
  ],
  asiLevels: [4, 8, 12, 16, 19],
  skillChoiceLevels: [3],
  skillChoicePool: [
    'animalHandling',
    'athletics',
    'intimidation',
    'nature',
    'perception',
    'survival',
  ],
  multiclassPrerequisites: { all: ['str'], any: [] },
}
