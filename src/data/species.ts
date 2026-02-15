import type { SpeciesDefinition } from '@/utils/advancementTypes'

/**
 * Half-Elf (Legacy / Custom)
 * Removed from D&D 2024 core rules but provided for user preference.
 * Strict 2024: NO Ability Score Increases — ASIs come from Background only.
 */
export const HALF_ELF_LEGACY: SpeciesDefinition = {
  id: 'half-elf',
  nameKey: 'species.halfElf.name',
  traits: [
    {
      id: 'half-elf-darkvision',
      level: 1,
      nameKey: 'species.halfElf.trait.darkvision.name',
      descriptionKey: 'species.halfElf.trait.darkvision.desc',
    },
    {
      id: 'half-elf-fey-ancestry',
      level: 1,
      nameKey: 'species.halfElf.trait.feyAncestry.name',
      descriptionKey: 'species.halfElf.trait.feyAncestry.desc',
    },
    {
      id: 'half-elf-skill-versatility',
      level: 1,
      nameKey: 'species.halfElf.trait.skillVersatility.name',
      descriptionKey: 'species.halfElf.trait.skillVersatility.desc',
    },
  ],
  choices: [
    {
      id: 'half-elf-skill1',
      level: 1,
      nameKey: 'species.halfElf.choice.skillVersatility1.name',
      optionsFrom: 'allSkills',
    },
    {
      id: 'half-elf-skill2',
      level: 1,
      nameKey: 'species.halfElf.choice.skillVersatility2.name',
      optionsFrom: 'allSkills',
    },
  ],
}
