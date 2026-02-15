import type { Character, Feat as CharacterFeat, Spell, SpeciesTrait, ProficiencyItem, ItemCategory } from '@/types/character'
import type { SkillKey } from '@/types/abilities'
import { RULESET_2024 } from './advancementEngine'
import { getDictionary, t } from './i18n'
import type { AdvancementCharacter, AdvancementMode, Locale } from './advancementTypes'
import { SRD_SPELLS } from '@/data/spellsSrd'
import { SRD_SPELLS_FR } from '@/data/spellsSrdFr'
import { BARD_SPELLS_EN, BARD_SPELLS_FR } from '@/data/bardSpells2024'

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
    if (classDef?.skillChoiceLevels?.includes(entry.level)) {
      const choiceId = `class-${entry.classId}-skill-${entry.level}`
      const selectedIds = (choices[choiceId] as string[] | undefined) ?? []
      selectedIds.forEach((skillKey) => {
        if (skillKey in nextSkills) {
          nextSkills[skillKey as SkillKey] = Math.max(
            nextSkills[skillKey as SkillKey] ?? 0,
            1
          ) as 0 | 1 | 2
        }
      })
    }
    if (entry.classId === 'bard') {
      if (entry.level >= 2) {
        (choices['feature-bard-expertise'] as string[] | undefined)?.forEach((skillKey) => {
          if (skillKey in nextSkills) nextSkills[skillKey as SkillKey] = 2
        })
      }
      if (entry.level >= 9) {
        (choices['feature-bard-expertise-2'] as string[] | undefined)?.forEach((skillKey) => {
          if (skillKey in nextSkills) nextSkills[skillKey as SkillKey] = 2
        })
      }
      const subclassId = entry.subclassId
      if (subclassId === 'college-of-lore') {
        (choices['feature-bard-lore-extra-skills'] as string[] | undefined)?.forEach((skillKey) => {
          if (skillKey in nextSkills) {
            nextSkills[skillKey as SkillKey] = Math.max(
              nextSkills[skillKey as SkillKey] ?? 0,
              1
            ) as 0 | 1 | 2
          }
        })
      }
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

const applySubclassProficiencies = (
  proficiencies: ProficiencyItem[],
  classes: AdvancementCharacter['classes']
): ProficiencyItem[] => {
  const next = [...proficiencies]
  const add = (name: string, category: 'weapon' | 'armor') => {
    const exists = next.some(
      (p) => p.category === category && p.name.toLowerCase() === name.toLowerCase()
    )
    if (!exists) next.push({ name, description: '', category })
  }

  const labels: Record<string, string> = {
    martial: 'Martial weapons',
    medium: 'Medium armor',
    shield: 'Shields',
  }

  classes.forEach((entry) => {
    if (!entry.subclassId) return
    const sub = RULESET_2024.subclasses[entry.subclassId] as
      | { weaponProficiencies?: string[]; armorProficiencies?: string[] }
      | undefined
    sub?.weaponProficiencies?.forEach((id) => add(labels[id] ?? id, 'weapon'))
    sub?.armorProficiencies?.forEach((id) => add(labels[id] ?? id, 'armor'))
  })
  return next
}

const applyClassToolChoices = (
  proficiencies: ProficiencyItem[],
  classes: AdvancementCharacter['classes'],
  choices: AdvancementCharacter['choices']
): ProficiencyItem[] => {
  const next = [...proficiencies]
  const addTool = (tool: string, displayName: string) => {
    if (!tool) return
    const exists = next.some(
      (item) => item.category === 'tool' && item.name.toLowerCase() === displayName.toLowerCase()
    )
    if (!exists) {
      next.push({ name: displayName, description: '', category: 'tool' })
    }
  }

  classes.forEach((entry) => {
    const classDef = RULESET_2024.classes[entry.classId]
    if (!classDef?.toolChoiceLevels?.includes(entry.level) || !classDef.toolChoicePool?.length) return
    const choiceId = `class-${entry.classId}-tool-${entry.level}`
    const selectedIds = (choices[choiceId] as string[] | undefined) ?? []
    const toolLabels: Record<string, string> = {
      bagpipes: 'Bagpipes',
      drum: 'Drum',
      dulcimer: 'Dulcimer',
      flute: 'Flute',
      lute: 'Lute',
      lyre: 'Lyre',
      horn: 'Horn',
      'pan-flute': 'Pan flute',
      shawm: 'Shawm',
      viol: 'Viol',
    }
    selectedIds.forEach((id) => {
      addTool(id, toolLabels[id] ?? id)
    })
  })
  return next
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

/** Normalize spell name for matching (e.g. "Tasha's Hideous Laughter" -> "hideous laughter") */
const normalizeSpellName = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[''`]/g, '')
    .replace(/\s+(?:the|a|an|'s)\s+/g, ' ')
    .replace(/^[^a-z]+|[^a-z]+$/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

/** Build SRD lookup by normalized name + level for resolving minimal spells to full data */
const buildSrdLookup = (srd: Spell[]): Map<string, Spell> => {
  const map = new Map<string, Spell>()
  for (const spell of srd) {
    const key = `${normalizeSpellName(spell.name)}|${spell.level}`
    if (!map.has(key)) map.set(key, spell)
  }
  return map
}

const SRD_LOOKUP_EN = buildSrdLookup(SRD_SPELLS)
const SRD_LOOKUP_FR = buildSrdLookup(SRD_SPELLS_FR)

/** Resolve a minimal Bard spell to full SRD data when a match exists */
const resolveToFullSpell = (
  bardSpell: Spell,
  _locale: Locale,
  srdLookup: Map<string, Spell>
): Spell => {
  const level = Number(bardSpell.level) ?? 0
  const norm = normalizeSpellName(bardSpell.name)
  let srd = srdLookup.get(`${norm}|${level}`)
  if (!srd && norm.includes(' ')) {
    const withoutFirstWord = norm.replace(/^[a-z0-9]+\s+/, '')
    if (withoutFirstWord) srd = srdLookup.get(`${withoutFirstWord}|${level}`)
  }
  if (srd) return { ...srd, id: bardSpell.id, name: bardSpell.name }
  return bardSpell
}

const buildSpellIndex = (
  srd: Spell[],
  bard: Spell[],
  locale: Locale,
  srdLookup: Map<string, Spell>
): Map<string, Spell> => {
  const entries: [string, Spell][] = [
    ...srd.map((s) => [s.id, s] as [string, Spell]),
    ...bard.map((s) => {
      const resolved = resolveToFullSpell(s, locale, srdLookup)
      return [s.id, resolved] as [string, Spell]
    }),
  ]
  return new Map(entries)
}

const SPELL_INDEX: Record<Locale, Map<string, Spell>> = {
  en: buildSpellIndex(SRD_SPELLS, BARD_SPELLS_EN, 'en', SRD_LOOKUP_EN),
  fr: buildSpellIndex(SRD_SPELLS_FR, BARD_SPELLS_FR, 'fr', SRD_LOOKUP_FR),
}

export const getSpellById = (id: string, locale: Locale): Spell | undefined =>
  SPELL_INDEX[locale]?.get(id)

const getSpellSourceFromChoiceKey = (key: string): string => {
  if (key.includes('high-elf-cantrip')) return 'High Elf'
  if (key.includes('acolyte')) return 'Magic Initiate'
  if (key.includes('class-bard') || key.includes('feature-bard')) return 'Bard'
  return 'Other'
}

const isSpellChoiceKey = (key: string): boolean =>
  key.includes('high-elf-cantrip') ||
  key.includes('acolyte-cantrips') ||
  key.includes('acolyte-1st-level') ||
  key.includes('class-bard-cantrips') ||
  key.includes('class-bard-spells') ||
  key.startsWith('class-bard-learn-') ||
  key.startsWith('class-bard-replace-add-') ||
  key === 'feature-bard-magical-secrets' ||
  key === 'feature-bard-additional-magical-secrets'

const applySpellChoices = (
  spells: Spell[],
  choices: AdvancementCharacter['choices'],
  locale: Locale
): Spell[] => {
  const index = SPELL_INDEX[locale] ?? SPELL_INDEX.en
  let next = [...spells]

  const replacedIds = new Set<string>()
  for (const choiceKey of Object.keys(choices)) {
    if (!choiceKey.startsWith('class-bard-replace-remove-')) continue
    const addKey = choiceKey.replace('replace-remove-', 'replace-add-')
    const removeIds = choices[choiceKey] as string[] | undefined
    const addIds = choices[addKey] as string[] | undefined
    if (!Array.isArray(removeIds) || removeIds.length === 0 || !Array.isArray(addIds) || addIds.length === 0)
      continue
    const removeId = removeIds[0]
    const addId = addIds[0]
    if (!removeId || !addId) continue
    replacedIds.add(removeId)
    next = next.filter((s) => s.id !== removeId)
    const spell = index.get(addId)
    if (spell) {
      next.push({ ...spell, sourceId: 'Bard' })
    }
  }

  const existingIds = new Set(next.map((s) => s.id))
  for (const [choiceKey, ids] of Object.entries(choices)) {
    if (!isSpellChoiceKey(choiceKey) || !Array.isArray(ids)) continue
    if (choiceKey.startsWith('class-bard-replace-')) continue
    const source = getSpellSourceFromChoiceKey(choiceKey)
    for (const id of ids) {
      if (replacedIds.has(id)) continue
      const spell = index.get(id)
      if (spell && !existingIds.has(id)) {
        next.push({ ...spell, sourceId: source })
        existingIds.add(id)
      }
    }
  }
  return next
}

const BARD_STARTER_ITEMS: Array<{ name: string; quantity: string; category: ItemCategory }> = [
  { name: 'Leather armor', quantity: '1', category: 'other' },
  { name: 'Dagger', quantity: '2', category: 'weapons' },
  { name: "Entertainer's pack", quantity: '1', category: 'other' },
]

const applyStartingEquipment = (
  inventory: Character['inventory'],
  advancement: AdvancementCharacter,
  equipmentMode: 'gold' | 'package',
  toolNames?: string[]
): Character['inventory'] => {
  if (equipmentMode !== 'package' || inventory.length > 0) return inventory
  const classes = advancement.classes
  const primary = classes.length
    ? classes.reduce((a, b) => (b.level > (a?.level ?? 0) ? b : a), classes[0])
    : undefined
  if (!primary || primary.classId !== 'bard') return inventory

  const next: Character['inventory'] = BARD_STARTER_ITEMS.map((item, i) => ({
    id: `inv-starter-${i}`,
    name: item.name,
    quantity: item.quantity,
    notes: '',
    category: item.category,
  }))
  next.push({
    id: 'inv-starter-instrument',
    name: toolNames?.[0] ?? 'Musical instrument',
    quantity: '1',
    notes: '',
    category: 'other',
  })
  return next
}

export const applyAdvancementToCharacter = (
  character: Character,
  advancement: AdvancementCharacter,
  locale: Locale,
  advancementMode?: AdvancementMode,
  options?: { equipmentMode?: 'gold' | 'package'; bardToolNames?: string[] }
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
  let nextProficiencies = applySubclassProficiencies(
    character.proficiencies,
    advancement.classes
  )
  nextProficiencies = applyClassToolChoices(
    nextProficiencies,
    advancement.classes,
    advancement.choices
  )
  nextProficiencies = applyBackgroundTools(
    nextProficiencies,
    advancement.backgroundId,
    advancement.choices
  )

  const hasSpellChoices =
    Object.keys(advancement.choices).some(isSpellChoiceKey) ||
    Object.keys(advancement.choices).some((k) => k.startsWith('class-bard-replace-'))
  const baseSpells = character.spells ?? []
  const nextSpells = hasSpellChoices
    ? applySpellChoices(baseSpells, advancement.choices, locale)
    : baseSpells

  const toolLabels: Record<string, string> = {
    bagpipes: 'Bagpipes',
    drum: 'Drum',
    dulcimer: 'Dulcimer',
    flute: 'Flute',
    lute: 'Lute',
    lyre: 'Lyre',
    horn: 'Horn',
    'pan-flute': 'Pan flute',
    shawm: 'Shawm',
    viol: 'Viol',
  }
  const bardToolIds = (advancement.choices['class-bard-tool-1'] as string[] | undefined) ?? []
  const bardToolNames = bardToolIds.map((id) => toolLabels[id] ?? id)

  const nextInventory = applyStartingEquipment(
    character.inventory,
    advancement,
    options?.equipmentMode ?? 'package',
    bardToolNames
  )

  return {
    ...character,
    level: advancement.level,
    xp: String(advancement.xp),
    abilities: advancement.abilities,
    skills: nextSkills,
    proficiencies: nextProficiencies,
    spells: nextSpells,
    inventory: nextInventory,
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
