import type { Feature } from '@/utils/advancementTypes'

/** Bard subclass features by subclassId */
export const BARD_SUBCLASS_FEATURES: Record<string, Feature[]> = {
  'college-of-dance': [
    {
      id: 'bard-dazzling-footwork',
      nameKey: 'feature.bard.dazzlingFootwork.name',
      descriptionKey: 'feature.bard.dazzlingFootwork.desc',
      type: 'PASSIVE',
      level: 3,
    },
  ],
  'college-of-glamour': [
    {
      id: 'bard-mantle-of-inspiration',
      nameKey: 'feature.bard.mantleOfInspiration.name',
      descriptionKey: 'feature.bard.mantleOfInspiration.desc',
      type: 'ACTION',
      level: 3,
    },
  ],
  'college-of-lore': [
    {
      id: 'bard-cutting-words',
      nameKey: 'feature.bard.cuttingWords.name',
      descriptionKey: 'feature.bard.cuttingWords.desc',
      type: 'ACTION',
      level: 3,
    },
    {
      id: 'bard-lore-extra-skills',
      nameKey: 'feature.bard.loreExtraSkills.name',
      descriptionKey: 'feature.bard.loreExtraSkills.desc',
      type: 'CHOICE',
      level: 3,
      choices: { pool: 'Skills', count: 3 },
    },
    {
      id: 'bard-additional-magical-secrets',
      nameKey: 'feature.bard.additionalMagicalSecrets.name',
      descriptionKey: 'feature.bard.additionalMagicalSecrets.desc',
      type: 'CHOICE',
      level: 6,
      choices: { pool: 'Spells', count: 2 },
    },
  ],
  'college-of-valor': [
    {
      id: 'bard-combat-inspiration',
      nameKey: 'feature.bard.combatInspiration.name',
      descriptionKey: 'feature.bard.combatInspiration.desc',
      type: 'ACTION',
      level: 3,
    },
  ],
}
