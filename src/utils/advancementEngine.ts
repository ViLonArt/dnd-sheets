import classesData from '@/data/rules2024.classes.json'
import subclassesData from '@/data/rules2024.subclasses.json'
import featsData from '@/data/rules2024.feats.json'
import weaponMasteryData from '@/data/rules2024.weaponMastery.json'
import speciesData from '@/data/rules2024.species.json'
import backgroundsData from '@/data/rules2024.backgrounds.json'
import xpThresholdsData from '@/data/rules2024.xpThresholds.json'
import spellSlotsData from '@/data/rules2024.spellSlots.json'
import type {
  AdvancementCharacter,
  ChoiceOption,
  ChoiceRequirement,
  ClassDefinition,
  LevelUpDecision,
  LevelUpDraft,
  LevelUpRequest,
  LevelUpResult,
  FeatDefinition,
  Ruleset2024,
  SpeciesDefinition,
  SubclassDefinition,
  ValidationError,
  WeaponMasteryProperty,
  WeaponDefinition,
  BackgroundDefinition,
} from './advancementTypes'

const DEFAULT_ASI_LEVELS = [4, 8, 12, 16, 19]

const toRecord = <T extends { id: string }>(items: T[]): Record<string, T> =>
  items.reduce<Record<string, T>>((acc, item) => {
    acc[item.id] = item
    return acc
  }, {})

const buildRuleset2024 = (): Ruleset2024 => ({
  classes: toRecord((classesData.classes ?? []) as ClassDefinition[]),
  subclasses: toRecord((subclassesData.subclasses ?? []) as SubclassDefinition[]),
  feats: toRecord((featsData.feats ?? []) as FeatDefinition[]),
  weaponMastery: {
    properties: toRecord((weaponMasteryData.properties ?? []) as WeaponMasteryProperty[]),
    weapons: toRecord((weaponMasteryData.weapons ?? []) as WeaponDefinition[]),
    tacticalMasteryOverrides: weaponMasteryData.tacticalMasteryOverrides ?? [],
  },
  species: toRecord((speciesData.species ?? []) as SpeciesDefinition[]),
  backgrounds: toRecord((backgroundsData.backgrounds ?? []) as BackgroundDefinition[]),
  xpThresholds: xpThresholdsData.thresholds ?? {},
})

export const RULESET_2024 = buildRuleset2024()

export const calculateProficiencyBonus = (level: number): number => {
  const safeLevel = Math.max(1, level || 1)
  return Math.ceil(safeLevel / 4) + 1
}

const getTotalLevel = (character: AdvancementCharacter): number => {
  if (character.classes.length === 0) return Math.max(1, character.level)
  return character.classes.reduce((total, entry) => total + entry.level, 0)
}

const getClassLevel = (character: AdvancementCharacter, classId: string): number =>
  character.classes.find((entry) => entry.classId === classId)?.level ?? 0

const getFullCasterSlots = (effectiveLevel: number): Record<number, number> => {
  const index = Math.max(1, Math.min(20, effectiveLevel)) - 1
  const slots = spellSlotsData.fullCaster[index] ?? []
  return Object.fromEntries(
    Array.from({ length: 9 }, (_, slotIndex) => [slotIndex + 1, slots[slotIndex] ?? 0])
  )
}

const getPactMagicSlots = (warlockLevel: number): Record<number, number> => {
  if (warlockLevel <= 0) return {}
  const index = Math.max(1, Math.min(20, warlockLevel)) - 1
  const slots = spellSlotsData.pactMagic[index] ?? []
  return Object.fromEntries(
    Array.from({ length: 9 }, (_, slotIndex) => [slotIndex + 1, slots[slotIndex] ?? 0])
  )
}

export const calculateMulticlassSpellSlots = (
  character: AdvancementCharacter,
  rules: Ruleset2024 = RULESET_2024
): { spellSlots: Record<number, number>; pactMagicSlots: Record<number, number> } => {
  let fullCasterLevels = 0
  let halfCasterLevels = 0
  let thirdCasterLevels = 0
  let warlockLevel = 0

  character.classes.forEach((entry) => {
    const classDef = rules.classes[entry.classId]
    if (!classDef) return
    if (classDef.spellcasting === 'full') fullCasterLevels += entry.level
    if (classDef.spellcasting === 'half') halfCasterLevels += Math.ceil(entry.level / 2)
    if (classDef.spellcasting === 'pact') warlockLevel += entry.level
    const subclassId = entry.subclassId
    if (subclassId) {
      const subclass = rules.subclasses[subclassId]
      if (subclass?.spellcasting === 'third') {
        thirdCasterLevels += Math.floor(entry.level / 3)
      }
    }
  })

  const effectiveCasterLevel = fullCasterLevels + halfCasterLevels + thirdCasterLevels
  const spellSlots = effectiveCasterLevel > 0 ? getFullCasterSlots(effectiveCasterLevel) : {}
  const pactMagicSlots = getPactMagicSlots(warlockLevel)
  return { spellSlots, pactMagicSlots }
}

const updateClassLevels = (
  character: AdvancementCharacter,
  classId: string
): { nextClasses: AdvancementCharacter['classes']; isNewClass: boolean } => {
  const nextClasses = character.classes.map((entry) => ({ ...entry }))
  const existing = nextClasses.find((entry) => entry.classId === classId)
  if (existing) {
    existing.level += 1
    return { nextClasses, isNewClass: false }
  }
  nextClasses.push({ classId, level: 1 })
  return { nextClasses, isNewClass: true }
}

const matchesWeaponFilter = (weapon: WeaponDefinition, filter: string): boolean => {
  if (filter === 'any') return true
  if (filter === 'melee') return weapon.type === 'melee'
  if (filter === 'ranged') return weapon.type === 'ranged'
  return weapon.traits.includes(filter)
}

const buildWeaponOptions = (
  character: AdvancementCharacter,
  filters: string[],
  rules: Ruleset2024
): ChoiceOption[] => {
  const weaponList = Object.values(rules.weaponMastery.weapons)
  const filteredByType = filters.includes('any')
    ? weaponList
    : weaponList.filter((weapon) => filters.some((filter) => matchesWeaponFilter(weapon, filter)))
  const proficient =
    character.weaponProficiencies.length > 0
      ? filteredByType.filter((weapon) => character.weaponProficiencies.includes(weapon.id))
      : filteredByType
  return proficient.map((weapon) => ({
    id: weapon.id,
    nameKey: weapon.nameKey,
  }))
}

const buildFeatOptions = (
  category: string,
  rules: Ruleset2024,
  excludeTags: string[] = []
): ChoiceOption[] =>
  Object.values(rules.feats)
    .filter(
      (feat) =>
        feat.category === category && !excludeTags.some((tag) => feat.tags?.includes(tag))
    )
    .map((feat) => ({
      id: feat.id,
      nameKey: feat.nameKey,
    }))

const SKILL_KEYS: string[] = [
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
]

const buildSkillOptions = (): ChoiceOption[] =>
  SKILL_KEYS.map((skillKey) => ({
    id: skillKey,
    nameKey: `skill.${skillKey}`,
  }))

const getSubclassOptions = (classId: string, rules: Ruleset2024): ChoiceOption[] =>
  Object.values(rules.subclasses)
    .filter((subclass) => subclass.classId === classId)
    .map((subclass) => ({
      id: subclass.id,
      nameKey: subclass.nameKey,
    }))

const addValidationError = (
  errors: ValidationError[],
  code: string,
  messageKey: string,
  meta?: Record<string, unknown>
) => {
  errors.push({ code, messageKey, meta })
}

const validateBackgroundAbilityIncreases = (
  increases: LevelUpDecision['abilityIncreases'] | undefined,
  allowedAbilities: string[],
  errors: ValidationError[]
) => {
  if (!increases || increases.length === 0) {
    addValidationError(errors, 'background_asi_missing', 'error.levelUp.backgroundAsiInvalid')
    return
  }

  const total = increases.reduce((sum, entry) => sum + entry.amount, 0)
  const abilities = increases.map((entry) => entry.ability)
  const uniqueAbilities = new Set(abilities)
  const invalidAbility = abilities.some((ability) => !allowedAbilities.includes(ability))
  if (invalidAbility) {
    addValidationError(errors, 'background_asi_invalid', 'error.levelUp.backgroundAsiInvalid')
    return
  }
  if (uniqueAbilities.size !== abilities.length) {
    addValidationError(errors, 'background_asi_duplicate', 'error.levelUp.backgroundAsiInvalid')
    return
  }
  if (total !== 3) {
    addValidationError(errors, 'background_asi_total', 'error.levelUp.backgroundAsiInvalid', { total })
    return
  }

  const amounts = increases.map((entry) => entry.amount)
  const hasTwo = amounts.filter((amount) => amount === 2).length === 1
  const allOnes = amounts.every((amount) => amount === 1)
  const validTwoPlusOne = hasTwo && increases.length === 2
  const validThreeOnes = allOnes && increases.length === 3

  if (!validTwoPlusOne && !validThreeOnes) {
    addValidationError(errors, 'background_asi_pattern', 'error.levelUp.backgroundAsiInvalid')
  }
}

export const createLevelUpDraft = (
  request: LevelUpRequest,
  rules: Ruleset2024 = RULESET_2024
): LevelUpDraft => {
  const errors: ValidationError[] = []
  const currentTotalLevel = getTotalLevel(request.character)
  const targetLevel = request.targetLevel
  const classId = request.levelingClassId
  const classDef = rules.classes[classId]

  if (!classDef) {
    addValidationError(errors, 'missing_class', 'error.levelUp.missingClass', { classId })
  }

  if (targetLevel !== currentTotalLevel + 1) {
    addValidationError(errors, 'invalid_target', 'error.levelUp.invalidTarget', {
      currentTotalLevel,
      targetLevel,
    })
  }

  if (targetLevel < 1 || targetLevel > 20) {
    addValidationError(errors, 'invalid_range', 'error.levelUp.invalidRange', {
      targetLevel,
    })
  }

  if (request.advancementMode === 'xp') {
    const threshold = rules.xpThresholds[targetLevel] ?? Infinity
    if (request.character.xp < threshold) {
      addValidationError(errors, 'xp_gate', 'error.levelUp.xpGate', {
        currentXp: request.character.xp,
        threshold,
      })
    }
  }

  const { nextClasses, isNewClass } = updateClassLevels(request.character, classId)
  if (classDef && isNewClass) {
    const { all, any } = classDef.multiclassPrerequisites
    const meetsAll = all.every((ability) => request.character.abilities[ability] >= 13)
    const meetsAny = any.length === 0 || any.some((ability) => request.character.abilities[ability] >= 13)
    if (!meetsAll || !meetsAny) {
      addValidationError(errors, 'multiclass_prereq', 'error.levelUp.multiclassPrereq', {
        classId,
      })
    }
  }

  const nextCharacter: AdvancementCharacter = {
    ...request.character,
    level: targetLevel,
    classes: nextClasses,
    feats: [...request.character.feats],
    weaponMasteries: [...request.character.weaponMasteries],
    abilities: { ...request.character.abilities },
    choices: { ...request.character.choices },
  }

  const proficiencyBonus = calculateProficiencyBonus(targetLevel)
  const choices: ChoiceRequirement[] = []

  if (classDef) {
    const nextClassLevel = getClassLevel(nextCharacter, classId)
    const classEntry = nextCharacter.classes.find((entry) => entry.classId === classId)
    if (nextClassLevel === classDef.subclassLevel && !classEntry?.subclassId) {
      choices.push({
        id: `subclass-${classId}-${nextClassLevel}`,
        type: 'subclass',
        labelKey: 'choice.subclass',
        level: nextClassLevel,
        source: { type: 'class', id: classId },
        options: getSubclassOptions(classId, rules),
        minSelections: 1,
        maxSelections: 1,
      })
    }

    if ((classDef.asiLevels?.length ? classDef.asiLevels : DEFAULT_ASI_LEVELS).includes(nextClassLevel)) {
      const featOptions = buildFeatOptions('general', rules, ['asi'])
      const epicOptions =
        targetLevel >= 19 ? buildFeatOptions('epicBoon', rules, ['asi']) : []
      choices.push({
        id: `featOrAsi-${classId}-${nextClassLevel}`,
        type: 'featOrAsi',
        labelKey: 'choice.featOrAsi',
        level: nextClassLevel,
        source: { type: 'class', id: classId },
        options: [
          { id: 'asi', nameKey: 'feat.asi.name', meta: { kind: 'asi' } },
          ...featOptions.map((option) => ({ ...option, meta: { kind: 'feat' } })),
          ...epicOptions.map((option) => ({ ...option, meta: { kind: 'feat' } })),
        ],
        minSelections: 1,
        maxSelections: 1,
      })
    }

    if (
      classDef.skillChoiceLevels?.includes(nextClassLevel) &&
      classDef.skillChoicePool?.length
    ) {
      const choiceId = `class-${classId}-skill-${nextClassLevel}`
      choices.push({
        id: choiceId,
        type: 'classSkill',
        labelKey: 'choice.classSkill',
        level: nextClassLevel,
        source: { type: 'class', id: classId },
        options: classDef.skillChoicePool.map((skillKey) => ({
          id: skillKey,
          nameKey: `skill.${skillKey}`,
        })),
        minSelections: 1,
        maxSelections: 1,
      })
    }

    if (classDef.fightingStyleLevels.includes(nextClassLevel)) {
      choices.push({
        id: `fightingStyle-${classId}-${nextClassLevel}`,
        type: 'fightingStyle',
        labelKey: 'choice.fightingStyle',
        level: nextClassLevel,
        source: { type: 'class', id: classId },
        options: buildFeatOptions('fightingStyle', rules),
        minSelections: 1,
        maxSelections: 1,
      })
    }

    classDef.weaponMastery
      .filter((grant) => grant.level === nextClassLevel)
      .forEach((grant, index) => {
        const options = buildWeaponOptions(nextCharacter, grant.filters, rules)
        const slotCount = Math.max(1, grant.count)
        for (let slot = 0; slot < slotCount; slot += 1) {
          choices.push({
            id: `weaponMastery-${classId}-${nextClassLevel}-${index}-${slot}`,
            type: 'weaponMastery',
            labelKey: 'choice.weaponMastery',
            level: nextClassLevel,
            source: { type: 'class', id: classId },
            options,
            minSelections: 1,
            maxSelections: 1,
          })
        }
      })
  }

  if (nextCharacter.speciesId) {
    const species = rules.species[nextCharacter.speciesId]
    if (species) {
      species.choices
        .filter((choice) => choice.level === targetLevel)
        .forEach((choice) => {
          const options =
            choice.optionsFrom === 'originFeats'
              ? buildFeatOptions('origin', rules, ['asi'])
              : choice.optionsFrom === 'allSkills'
                ? buildSkillOptions()
                : (choice.options ?? []).map((option) => ({
                    id: option.id,
                    nameKey: option.nameKey,
                  }))
          choices.push({
            id: `species-${species.id}-${choice.id}-${targetLevel}`,
            type: 'speciesChoice',
            labelKey: choice.nameKey,
            level: targetLevel,
            source: { type: 'species', id: species.id },
            options,
            minSelections: 1,
            maxSelections: 1,
          })
        })
    }
  }

  if (nextCharacter.backgroundId) {
    const background = rules.backgrounds[nextCharacter.backgroundId]
    if (background?.abilityChoices?.length) {
      const choiceId = `background-${background.id}-abilities`
      if (!nextCharacter.choices[choiceId]) {
        choices.push({
          id: choiceId,
          type: 'backgroundAbility',
          labelKey: 'choice.backgroundAbilities',
          level: targetLevel,
          source: { type: 'background', id: background.id },
          options: [
            {
              id: 'twoPlusOne',
              nameKey: 'ui.background.abilityModeTwoPlusOne',
            },
            {
              id: 'threePlusOne',
              nameKey: 'ui.background.abilityModeThreePlusOne',
            },
          ],
          minSelections: 1,
          maxSelections: 1,
          meta: { allowedAbilities: background.abilityChoices },
        })
      }
    }

    if (background?.skillChoices?.length) {
      background.skillChoices.forEach((group, index) => {
        const choiceId = `background-${background.id}-skill-${index}`
        if (nextCharacter.choices[choiceId]) return
        choices.push({
          id: choiceId,
          type: 'backgroundSkill',
          labelKey: 'choice.backgroundSkill',
          level: targetLevel,
          source: { type: 'background', id: background.id },
          options: group.map((skill) => ({
            id: skill,
            nameKey: `skill.${skill}`,
          })),
          minSelections: 1,
          maxSelections: 1,
          meta: { groupIndex: String(index) },
        })
      })
    }

    if (background?.toolProficiency) {
      const toolOptions = Array.isArray(background.toolProficiency)
        ? background.toolProficiency
        : [background.toolProficiency]
      if (toolOptions.length > 1) {
        const choiceId = `background-${background.id}-tool`
        if (!nextCharacter.choices[choiceId]) {
          choices.push({
            id: choiceId,
            type: 'backgroundTool',
            labelKey: 'choice.backgroundTool',
            level: targetLevel,
            source: { type: 'background', id: background.id },
            options: toolOptions.map((tool) => ({
              id: tool,
              nameKey: tool,
            })),
            minSelections: 1,
            maxSelections: 1,
          })
        }
      }
    }
  }

  return {
    current: request.character,
    next: nextCharacter,
    targetLevel,
    proficiencyBonus,
    choices,
    errors,
  }
}

const validateAbilityIncreases = (
  increases: LevelUpDecision['abilityIncreases'] | undefined,
  errors: ValidationError[]
) => {
  if (!increases || increases.length === 0) {
    addValidationError(errors, 'asi_missing', 'error.levelUp.asiInvalid')
    return
  }
  const totals = increases.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.ability] = (acc[entry.ability] ?? 0) + entry.amount
    return acc
  }, {})
  const totalIncrease = Object.values(totals).reduce((sum, value) => sum + value, 0)
  if (totalIncrease !== 2) {
    addValidationError(errors, 'asi_total', 'error.levelUp.asiInvalid', { totalIncrease })
    return
  }
  const invalid = Object.values(totals).some((value) => value <= 0 || value > 2)
  if (invalid) {
    addValidationError(errors, 'asi_amount', 'error.levelUp.asiInvalid')
  }
}

export const applyLevelUpDecisions = (
  draft: LevelUpDraft,
  decisions: LevelUpDecision[],
  rules: Ruleset2024 = RULESET_2024
): LevelUpResult => {
  const errors: ValidationError[] = [...draft.errors]
  const next: AdvancementCharacter = {
    ...draft.next,
    abilities: { ...draft.next.abilities },
    classes: draft.next.classes.map((entry) => ({ ...entry })),
    feats: [...draft.next.feats],
    weaponMasteries: [...draft.next.weaponMasteries],
    choices: { ...draft.next.choices },
  }

  if (next.backgroundId) {
    const background = rules.backgrounds[next.backgroundId]
    if (background?.originFeatId) {
      const feat = rules.feats[background.originFeatId]
      if (!feat || feat.category !== 'origin') {
        addValidationError(errors, 'background_feat_invalid', 'error.levelUp.backgroundFeatInvalid', {
          backgroundId: next.backgroundId,
        })
      } else if (!next.feats.includes(background.originFeatId)) {
        next.feats.push(background.originFeatId)
      }
    }
  }

  draft.choices.forEach((choice) => {
    const decision = decisions.find((entry) => entry.choiceId === choice.id)
    if (!decision) {
      addValidationError(errors, 'choice_missing', 'error.levelUp.choiceMissing', {
        choiceId: choice.id,
      })
      return
    }

    const selectedCount = decision.optionIds.length
    if (selectedCount < choice.minSelections || selectedCount > choice.maxSelections) {
      addValidationError(errors, 'choice_count', 'error.levelUp.choiceCount', {
        choiceId: choice.id,
        selectedCount,
      })
      return
    }

    const optionMap = new Map(choice.options.map((option) => [option.id, option]))
    for (const optionId of decision.optionIds) {
      if (!optionMap.has(optionId)) {
        addValidationError(errors, 'choice_invalid', 'error.levelUp.choiceInvalid', {
          choiceId: choice.id,
          optionId,
        })
        return
      }
    }

    if (choice.type === 'subclass') {
      const selectedSubclass = decision.optionIds[0]
      if (!selectedSubclass) {
        addValidationError(errors, 'choice_missing', 'error.levelUp.choiceMissing', {
          choiceId: choice.id,
        })
        return
      }
      const classEntry = next.classes.find((entry) => entry.classId === choice.source.id)
      if (classEntry) classEntry.subclassId = selectedSubclass
      return
    }

    if (choice.type === 'weaponMastery') {
      const selectedWeapon = decision.optionIds[0]
      if (!selectedWeapon) {
        addValidationError(errors, 'choice_missing', 'error.levelUp.choiceMissing', {
          choiceId: choice.id,
        })
        return
      }
      if (!next.weaponMasteries.includes(selectedWeapon)) {
        next.weaponMasteries.push(selectedWeapon)
      }
      return
    }

    if (choice.type === 'speciesChoice') {
      next.choices[choice.id] = [...decision.optionIds]
      return
    }

    if (choice.type === 'classSkill') {
      next.choices[choice.id] = [...decision.optionIds]
      return
    }

    if (choice.type === 'backgroundAbility') {
      const allowed = choice.meta?.allowedAbilities
      const allowedAbilities = Array.isArray(allowed) ? allowed : []
      validateBackgroundAbilityIncreases(decision.abilityIncreases, allowedAbilities, errors)
      if (errors.length === 0 && decision.abilityIncreases) {
        decision.abilityIncreases.forEach((increase) => {
          next.abilities[increase.ability] += increase.amount
        })
        next.choices[choice.id] = decision.abilityIncreases.map((increase) => increase.ability)
      }
      return
    }

    if (choice.type === 'backgroundSkill' || choice.type === 'backgroundTool') {
      next.choices[choice.id] = [...decision.optionIds]
      return
    }

    if (choice.type === 'featOrAsi' && decision.optionIds[0] === 'asi') {
      validateAbilityIncreases(decision.abilityIncreases, errors)
      if (errors.length === 0 && decision.abilityIncreases) {
        decision.abilityIncreases.forEach((increase) => {
          next.abilities[increase.ability] += increase.amount
        })
      }
      return
    }

    if (choice.type === 'fightingStyle' || choice.type === 'feat' || choice.type === 'featOrAsi') {
      decision.optionIds.forEach((featId) => {
        if (featId === 'asi') return
        const feat = rules.feats[featId]
        if (!feat) return
        if (!feat.repeatable && next.feats.includes(featId)) {
          addValidationError(errors, 'feat_repeat', 'error.levelUp.featRepeat', { featId })
          return
        }
        next.feats.push(featId)
      })
    }
  })

  return {
    character: errors.length === 0 ? next : undefined,
    draft,
    errors,
  }
}

export const levelUp = (
  request: LevelUpRequest,
  decisions: LevelUpDecision[],
  rules: Ruleset2024 = RULESET_2024
): LevelUpResult => {
  const draft = createLevelUpDraft(request, rules)
  return applyLevelUpDecisions(draft, decisions, rules)
}
