import type { Character, Feat as CharacterFeat, SpeciesTrait, ProficiencyItem } from '@/types/character'
import type { SkillKey } from '@/types/abilities'
import { RULESET_2024 } from './advancementEngine'
import { getDictionary, t } from './i18n'
import type { AdvancementCharacter, AdvancementMode, Locale } from './advancementTypes'

const DICTIONARIES = {
  en: getDictionary('en'),
  fr: getDictionary('fr'),
} as const

const normalizeName = (value: string) => value.trim().toLowerCase()

const resolveIdByName = (
  name: string,
  entries: Array<{ id: string; nameKey: string }>
): string | undefined => {
  const normalized = normalizeName(name)
  if (!normalized) return undefined
  for (const entry of entries) {
    if (normalizeName(entry.id) === normalized) return entry.id
    const enName = DICTIONARIES.en[entry.nameKey]
    const frName = DICTIONARIES.fr[entry.nameKey]
    if (enName && normalizeName(enName) === normalized) return entry.id
    if (frName && normalizeName(frName) === normalized) return entry.id
  }
  return undefined
}

export const resolveClassId = (name: string | undefined): string | undefined => {
  if (!name) return undefined
  return resolveIdByName(
    name,
    Object.values(RULESET_2024.classes).map((entry) => ({
      id: entry.id,
      nameKey: entry.nameKey,
    }))
  )
}

export const resolveSubclassId = (
  name: string | undefined,
  classId?: string
): string | undefined => {
  if (!name) return undefined
  const subclassEntries = Object.values(RULESET_2024.subclasses)
    .filter((entry) => (classId ? entry.classId === classId : true))
    .map((entry) => ({ id: entry.id, nameKey: entry.nameKey }))
  return resolveIdByName(name, subclassEntries)
}

export const resolveSpeciesId = (name: string | undefined): string | undefined => {
  if (!name) return undefined
  return resolveIdByName(
    name,
    Object.values(RULESET_2024.species).map((entry) => ({
      id: entry.id,
      nameKey: entry.nameKey,
    }))
  )
}

export const resolveFeatId = (name: string | undefined): string | undefined => {
  if (!name) return undefined
  return resolveIdByName(
    name,
    Object.values(RULESET_2024.feats).map((entry) => ({
      id: entry.id,
      nameKey: entry.nameKey,
    }))
  )
}

export const resolveBackgroundId = (name: string | undefined): string | undefined => {
  if (!name) return undefined
  return resolveIdByName(
    name,
    Object.values(RULESET_2024.backgrounds).map((entry) => ({
      id: entry.id,
      nameKey: entry.nameKey,
    }))
  )
}

const parseXp = (value: string | number | undefined): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return 0
  const parsed = parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : 0
}

export const buildAdvancementCharacter = (character: Character): AdvancementCharacter => {
  const existingAdvancement = character.advancement
  const resolvedClassId =
    existingAdvancement?.classes?.[0]?.classId ?? resolveClassId(character.class)
  const resolvedSubclassId = resolveSubclassId(character.subclass, resolvedClassId)
  const classes =
    existingAdvancement?.classes?.length && existingAdvancement.classes.length > 0
      ? existingAdvancement.classes.map((entry) => ({
          ...entry,
          subclassId: entry.subclassId ?? resolvedSubclassId,
        }))
      : resolvedClassId
        ? [
            {
              classId: resolvedClassId,
              level: character.level,
              ...(resolvedSubclassId ? { subclassId: resolvedSubclassId } : {}),
            },
          ]
        : []

  const feats =
    existingAdvancement?.feats?.length && existingAdvancement.feats.length > 0
      ? existingAdvancement.feats
      : character.feats
          .map((feat) => resolveFeatId(feat.name))
          .filter((featId): featId is string => Boolean(featId))

  return {
    level: character.level,
    xp: parseXp(character.xp),
    abilities: character.abilities,
    classes,
    speciesId: existingAdvancement?.speciesId ?? resolveSpeciesId(character.race),
    backgroundId: existingAdvancement?.backgroundId ?? resolveBackgroundId(character.background),
    feats,
    weaponProficiencies: existingAdvancement?.weaponProficiencies ?? [],
    weaponMasteries: existingAdvancement?.weaponMasteries ?? [],
    choices: existingAdvancement?.choices ?? {},
  }
}

const mapFeatsForDisplay = (featIds: string[], locale: Locale): CharacterFeat[] =>
  featIds
    .map((featId) => RULESET_2024.feats[featId])
    .filter((feat): feat is NonNullable<typeof feat> => Boolean(feat))
    .map((feat) => ({
      name: t(feat.nameKey, locale),
      description: t(feat.descriptionKey, locale),
    }))

const mapSpeciesTraitsForDisplay = (
  speciesId: string | undefined,
  level: number,
  locale: Locale
): SpeciesTrait[] => {
  if (!speciesId) return []
  const species = RULESET_2024.species[speciesId]
  if (!species) return []
  return species.traits
    .filter((trait) => trait.level <= level)
    .map((trait) => ({
      name: t(trait.nameKey, locale),
      description: t(trait.descriptionKey, locale),
    }))
}

const applyBackgroundSkills = (
  skills: Character['skills'],
  backgroundId: string | undefined,
  choices: AdvancementCharacter['choices']
): Character['skills'] => {
  if (!backgroundId) return skills
  const background = RULESET_2024.backgrounds[backgroundId]
  if (!background?.skillChoices?.length) return skills
  const nextSkills = { ...skills }
  background.skillChoices.forEach((_, index) => {
    const choiceId = `background-${background.id}-skill-${index}`
    const selected = choices[choiceId]?.[0] as SkillKey | undefined
    if (selected && selected in nextSkills) {
      nextSkills[selected] = Math.max(nextSkills[selected], 1) as 0 | 1 | 2
    }
  })
  return nextSkills
}

const applyClassSkillChoices = (
  skills: Character['skills'],
  classes: AdvancementCharacter['classes'],
  choices: AdvancementCharacter['choices']
): Character['skills'] => {
  const nextSkills = { ...skills }
  classes.forEach((entry) => {
    const classDef = RULESET_2024.classes[entry.classId]
    if (!classDef?.skillChoiceLevels?.includes(entry.level)) return
    const choiceId = `class-${entry.classId}-skill-${entry.level}`
    const selected = choices[choiceId]?.[0] as SkillKey | undefined
    if (selected && selected in nextSkills) {
      nextSkills[selected] = Math.max(nextSkills[selected], 1) as 0 | 1 | 2
    }
  })
  return nextSkills
}

const applySpeciesSkillChoices = (
  skills: Character['skills'],
  speciesId: string | undefined,
  level: number,
  choices: AdvancementCharacter['choices']
): Character['skills'] => {
  if (!speciesId) return skills
  const species = RULESET_2024.species[speciesId]
  if (!species) return skills
  const nextSkills = { ...skills }
  species.choices
    .filter((c) => c.level <= level && c.optionsFrom === 'allSkills')
    .forEach((choice) => {
      const choiceId = `species-${species.id}-${choice.id}-${choice.level}`
      const selected = choices[choiceId] as string[] | undefined
      selected?.forEach((skillKey) => {
        if (skillKey in nextSkills) {
          ;(nextSkills as Record<string, 0 | 1 | 2>)[skillKey] = Math.max(
            (nextSkills as Record<string, 0 | 1 | 2>)[skillKey] ?? 0,
            1
          ) as 0 | 1 | 2
        }
      })
    })
  return nextSkills
}

const applyBackgroundTools = (
  proficiencies: ProficiencyItem[],
  backgroundId: string | undefined,
  choices: AdvancementCharacter['choices']
): ProficiencyItem[] => {
  if (!backgroundId) return proficiencies
  const background = RULESET_2024.backgrounds[backgroundId]
  if (!background?.toolProficiency) return proficiencies
  const next = [...proficiencies]
  const addTool = (tool: string) => {
    if (!tool) return
    const exists = next.some(
      (item) => item.category === 'tool' && item.name.toLowerCase() === tool.toLowerCase()
    )
    if (!exists) {
      next.push({ name: tool, description: '', category: 'tool' })
    }
  }

  if (Array.isArray(background.toolProficiency)) {
    const choiceId = `background-${background.id}-tool`
    const selected = choices[choiceId]?.[0]
    if (selected) addTool(selected)
  } else {
    addTool(background.toolProficiency)
  }
  return next
}

const pickPrimaryClass = (
  classes: AdvancementCharacter['classes']
): AdvancementCharacter['classes'][number] | undefined => {
  if (!classes.length) return undefined
  return classes.reduce((primary, entry) =>
    entry.level > primary.level ? entry : primary
  )
}

export const applyAdvancementToCharacter = (
  character: Character,
  advancement: AdvancementCharacter,
  locale: Locale,
  advancementMode?: AdvancementMode
): Character => {
  const primaryClass = pickPrimaryClass(advancement.classes)
  const classDef = primaryClass ? RULESET_2024.classes[primaryClass.classId] : undefined
  const subclassDef =
    primaryClass?.subclassId ? RULESET_2024.subclasses[primaryClass.subclassId] : undefined
  let nextSkills = applyBackgroundSkills(
    character.skills,
    advancement.backgroundId,
    advancement.choices
  )
  nextSkills = applyClassSkillChoices(
    nextSkills,
    advancement.classes,
    advancement.choices
  )
  nextSkills = applySpeciesSkillChoices(
    nextSkills,
    advancement.speciesId,
    advancement.level,
    advancement.choices
  )
  const nextProficiencies = applyBackgroundTools(
    character.proficiencies,
    advancement.backgroundId,
    advancement.choices
  )

  return {
    ...character,
    level: advancement.level,
    xp: String(advancement.xp),
    abilities: advancement.abilities,
    skills: nextSkills,
    proficiencies: nextProficiencies,
    class: classDef ? t(classDef.nameKey, locale, character.class) : character.class,
    subclass: subclassDef ? t(subclassDef.nameKey, locale, character.subclass) : character.subclass,
    race: advancement.speciesId
      ? t(RULESET_2024.species[advancement.speciesId]?.nameKey ?? '', locale, character.race)
      : character.race,
    background: advancement.backgroundId
      ? t(RULESET_2024.backgrounds[advancement.backgroundId]?.nameKey ?? '', locale, character.background)
      : character.background,
    feats: mapFeatsForDisplay(advancement.feats, locale),
    speciesTraits: mapSpeciesTraitsForDisplay(advancement.speciesId, advancement.level, locale),
    advancement: {
      classes: advancement.classes,
      feats: advancement.feats,
      weaponMasteries: advancement.weaponMasteries,
      weaponProficiencies: advancement.weaponProficiencies,
      speciesId: advancement.speciesId,
      backgroundId: advancement.backgroundId,
      choices: advancement.choices,
      advancementMode,
    },
  }
}

export const getAdvancementMode = (character: Character): AdvancementMode =>
  character.advancement?.advancementMode ?? 'xp'
