import { useEffect, useMemo, useState } from 'react'
import type { Character } from '@/types/character'
import type { AbilityKey } from '@/types/abilities'
import {
  applyLevelUpDecisions,
  calculateProficiencyBonus,
  createLevelUpDraft,
  RULESET_2024,
} from '@/utils/advancementEngine'
import type {
  ChoiceRequirement,
  LevelUpDecision,
  ValidationError,
  AdvancementMode,
  Locale,
} from '@/utils/advancementTypes'
import {
  applyAdvancementToCharacter,
  buildAdvancementCharacter,
  getAdvancementMode,
} from '@/utils/advancementMapper'
import { getClassFeaturesForLevel } from '@/data/classFeatureRegistry'
import { calculateAbilityModifier } from '@/types/abilities'
import { t } from '@/utils/i18n'
import { Button, Modal, Select, FieldLabel, Box, FilterableList, ExpandableRow, ChoiceResolver } from '@/components/ui'
import { SKILL_DATA } from '@/features/character-sheet/constants'
import { LevelUpDetailPanel, type DetailSelection } from '@/features/character-sheet/LevelUpDetailPanel'

type LevelUpWizardProps = {
  isOpen: boolean
  character: Character
  locale: Locale
  onApply: (nextCharacter: Character) => void
  onClose: () => void
}

const ABILITY_OPTIONS: Array<{ value: AbilityKey; labelKey: string }> = [
  { value: 'str', labelKey: 'ability.str' },
  { value: 'dex', labelKey: 'ability.dex' },
  { value: 'con', labelKey: 'ability.con' },
  { value: 'int', labelKey: 'ability.int' },
  { value: 'wis', labelKey: 'ability.wis' },
  { value: 'cha', labelKey: 'ability.cha' },
]

const getAbilityOptions = (locale: Locale) =>
  ABILITY_OPTIONS.map((ability) => ({
    value: ability.value,
    label: t(ability.labelKey, locale),
  }))

const getAbilityOptionsForList = (locale: Locale, allowed: string[]) =>
  getAbilityOptions(locale).filter((option) => allowed.includes(option.value))

const getChoiceLabel = (choice: ChoiceRequirement, locale: Locale) =>
  t(choice.labelKey, locale)

const formatError = (error: ValidationError, locale: Locale) =>
  t(error.messageKey, locale)

const getTotalLevel = (character: ReturnType<typeof buildAdvancementCharacter>) =>
  character.classes.length > 0
    ? character.classes.reduce((total, entry) => total + entry.level, 0)
    : character.level

export function LevelUpWizard({ isOpen, character, locale, onApply, onClose }: LevelUpWizardProps) {
  const [levelingClassId, setLevelingClassId] = useState<string>('')
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<string>('')
  const [selectedBackgroundId, setSelectedBackgroundId] = useState<string>('')
  const [advancementMode, setAdvancementMode] = useState<AdvancementMode>(
    getAdvancementMode(character)
  )
  const [decisions, setDecisions] = useState<Record<string, LevelUpDecision>>({})
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [expandedFeatureId, setExpandedFeatureId] = useState<string | null>(null)
  const [detailSelection, setDetailSelection] = useState<DetailSelection>(null)

  const advancementCharacter = useMemo(
    () => buildAdvancementCharacter(character),
    [character]
  )

  useEffect(() => {
    if (!isOpen) return
    setSelectedSpeciesId(advancementCharacter.speciesId ?? '')
    setSelectedBackgroundId(advancementCharacter.backgroundId ?? '')
    setLevelingClassId('')
    setDecisions({})
    setErrors([])
    setExpandedFeatureId(null)
    const defaultClassId = advancementCharacter.classes[0]?.classId
    setDetailSelection(defaultClassId ? { type: 'class', id: defaultClassId } : null)
  }, [isOpen, advancementCharacter.speciesId, advancementCharacter.backgroundId, advancementCharacter.classes])

  const draftCharacter = useMemo(
    () => ({
      ...advancementCharacter,
      speciesId: selectedSpeciesId || advancementCharacter.speciesId,
      backgroundId: selectedBackgroundId || advancementCharacter.backgroundId,
    }),
    [advancementCharacter, selectedSpeciesId, selectedBackgroundId]
  )

  const totalLevel = useMemo(() => getTotalLevel(draftCharacter), [draftCharacter])

  const targetLevel = totalLevel + 1

  const classOptions = useMemo(
    () =>
      Object.values(RULESET_2024.classes).map((entry) => ({
        value: entry.id,
        label: t(entry.nameKey, locale),
      })),
    [locale]
  )

  const speciesOptions = useMemo(
    () =>
      Object.values(RULESET_2024.species).map((entry) => ({
        value: entry.id,
        label: t(entry.nameKey, locale),
      })),
    [locale]
  )

  const backgroundOptions = useMemo(
    () =>
      Object.values(RULESET_2024.backgrounds).map((entry) => ({
        value: entry.id,
        label: t(entry.nameKey, locale),
      })),
    [locale]
  )

  const selectedClassId =
    levelingClassId || advancementCharacter.classes[0]?.classId || classOptions[0]?.value || ''

  const draft = useMemo(
    () =>
      createLevelUpDraft(
        {
          character: draftCharacter,
          targetLevel,
          levelingClassId: selectedClassId,
          advancementMode,
          ...(selectedClassId === 'bard' && {
            currentSpells: character.spells?.map((s) => ({
              id: s.id,
              name: s.name,
              level: s.level,
              sourceId: s.sourceId,
            })),
          }),
        },
        RULESET_2024
      ),
    [draftCharacter, targetLevel, selectedClassId, advancementMode, character.spells]
  )

  const classDef = RULESET_2024.classes[selectedClassId]
  const hitDiceType = classDef?.hitDie ?? 8
  const conMod = calculateAbilityModifier(draftCharacter.abilities.con ?? 10)
  const hpPerLevel = Math.floor(hitDiceType / 2) + 1 + conMod

  const automaticGains = useMemo(() => {
    const pb = calculateProficiencyBonus(targetLevel)
    const features = getClassFeaturesForLevel(selectedClassId, targetLevel).filter(
      (f) => f.level === targetLevel && ['PASSIVE', 'RESOURCE', 'ACTION'].includes(f.type)
    )
    return {
      hpIncrease: hpPerLevel,
      proficiencyBonus: pb,
      passiveFeatures: features,
    }
  }, [selectedClassId, targetLevel, hpPerLevel])

  const weaponMasteryChoices = useMemo(() => {
    return draft.choices.filter((c) => c.type === 'weaponMastery')
  }, [draft.choices])

  const nonWeaponMasteryChoices = useMemo(() => {
    return draft.choices
      .filter((c) => c.type !== 'weaponMastery')
      .filter((c) => {
        if (c.dependsOn) {
          const depDecision = decisions[c.dependsOn.choiceId]
          if (depDecision?.optionIds[0] !== c.dependsOn.value) return false
        }
        if (c.showWhenChoiceFilled) {
          const depDecision = decisions[c.showWhenChoiceFilled]
          if (!depDecision?.optionIds?.[0]) return false
        }
        return true
      })
  }, [draft.choices, decisions])

  const updateDecision = (choiceId: string, updates: Partial<LevelUpDecision>) => {
    setDecisions((prev) => {
      const current = prev[choiceId] ?? { choiceId, optionIds: [] }
      return { ...prev, [choiceId]: { ...current, ...updates } }
    })
    if (errors.length) {
      setErrors([])
    }
  }

  const weaponMasterySelectedIds = useMemo(() => {
    return weaponMasteryChoices.flatMap((c) => decisions[c.id]?.optionIds ?? []).filter(Boolean)
  }, [weaponMasteryChoices, decisions])

  const handleChoiceChange = (choiceId: string, optionId: string) => {
    updateDecision(choiceId, { optionIds: optionId ? [optionId] : [] })
  }

  const handleAbilityIncreaseMode = (choiceId: string, mode: 'single' | 'split') => {
    const defaultAbility = ABILITY_OPTIONS[0]?.value ?? 'str'
    if (mode === 'single') {
      updateDecision(choiceId, { abilityIncreases: [{ ability: defaultAbility, amount: 2 }] })
      return
    }
    updateDecision(choiceId, {
      abilityIncreases: [
        { ability: defaultAbility, amount: 1 },
        { ability: (ABILITY_OPTIONS[1]?.value ?? 'dex') as AbilityKey, amount: 1 },
      ],
    })
  }

  const handleAbilityIncreaseChange = (
    choiceId: string,
    index: number,
    ability: AbilityKey
  ) => {
    const current = decisions[choiceId]?.abilityIncreases ?? []
    const next = [...current]
    if (!next[index]) {
      next[index] = { ability, amount: 1 }
    } else {
      next[index] = { ...next[index], ability }
    }
    updateDecision(choiceId, { abilityIncreases: next })
  }

  const getAsiMode = (decision: LevelUpDecision | undefined) =>
    decision?.abilityIncreases && decision.abilityIncreases.length === 2 ? 'split' : 'single'

  const renderFeatOrAsiExtras = (choice: ChoiceRequirement) => {
    const decision = decisions[choice.id]
    if (!decision || decision.optionIds[0] !== 'asi') return null
    const mode = getAsiMode(decision)
    const abilityOptions = getAbilityOptions(locale)
    const currentIncreases = decision.abilityIncreases ?? []
    const firstAbility = currentIncreases[0]?.ability ?? ABILITY_OPTIONS[0]?.value ?? 'str'
    const secondAbility = currentIncreases[1]?.ability ?? ABILITY_OPTIONS[1]?.value ?? 'dex'
    return (
      <div className="mt-2 grid grid-cols-1 gap-2">
        <Select
          label={t('ui.levelUp.asiMode', locale)}
          value={mode}
          onChange={(e) => handleAbilityIncreaseMode(choice.id, e.target.value as 'single' | 'split')}
          options={[
            { value: 'single', label: t('ui.levelUp.asiModeSingle', locale) },
            { value: 'split', label: t('ui.levelUp.asiModeSplit', locale) },
          ]}
        />
        {mode === 'single' ? (
          <Select
            label={t('ui.levelUp.ability', locale)}
            value={firstAbility}
            onChange={(e) => handleAbilityIncreaseChange(choice.id, 0, e.target.value as AbilityKey)}
            options={abilityOptions}
          />
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Select
              label={t('ui.levelUp.ability1', locale)}
              value={firstAbility}
              onChange={(e) => handleAbilityIncreaseChange(choice.id, 0, e.target.value as AbilityKey)}
              options={abilityOptions}
            />
            <Select
              label={t('ui.levelUp.ability2', locale)}
              value={secondAbility}
              onChange={(e) => handleAbilityIncreaseChange(choice.id, 1, e.target.value as AbilityKey)}
              options={abilityOptions}
            />
          </div>
        )}
      </div>
    )
  }

  const renderBackgroundAbilityChoice = (choice: ChoiceRequirement) => {
    const decision = decisions[choice.id]
    const mode = decision?.optionIds[0] ?? ''
    const allowed =
      Array.isArray(choice.meta?.allowedAbilities) && choice.meta?.allowedAbilities.length > 0
        ? (choice.meta?.allowedAbilities as string[])
        : ABILITY_OPTIONS.map((ability) => ability.value)
    const abilityOptions = getAbilityOptionsForList(locale, allowed)
    const fallbackAbility = (abilityOptions[0]?.value ?? 'str') as AbilityKey
    const fallbackSecond = (abilityOptions[1]?.value ?? fallbackAbility) as AbilityKey
    const fallbackThird = (abilityOptions[2]?.value ?? fallbackSecond) as AbilityKey
    const currentIncreases = decision?.abilityIncreases ?? []
    const firstAbility = currentIncreases[0]?.ability ?? fallbackAbility
    const secondAbility = currentIncreases[1]?.ability ?? fallbackSecond
    const thirdAbility = currentIncreases[2]?.ability ?? fallbackThird

    const handleModeChange = (nextMode: string) => {
      if (nextMode === 'twoPlusOne') {
        updateDecision(choice.id, {
          optionIds: ['twoPlusOne'],
          abilityIncreases: [
            { ability: firstAbility, amount: 2 },
            { ability: secondAbility, amount: 1 },
          ],
        })
        return
      }
      if (nextMode === 'threePlusOne') {
        updateDecision(choice.id, {
          optionIds: ['threePlusOne'],
          abilityIncreases: [
            { ability: firstAbility, amount: 1 },
            { ability: secondAbility, amount: 1 },
            { ability: thirdAbility, amount: 1 },
          ],
        })
      }
    }

    const handleAbilityChange = (index: number, ability: AbilityKey) => {
      const modeId = mode || 'twoPlusOne'
      const amounts =
        modeId === 'threePlusOne'
          ? [1, 1, 1]
          : [2, 1]
      const next = amounts.map((amount, idx) => ({
        ability:
          idx === 0 ? firstAbility : idx === 1 ? secondAbility : thirdAbility,
        amount: amount as 1 | 2,
      }))
      const existing = next[index]
      if (existing) next[index] = { ...existing, ability }
      updateDecision(choice.id, {
        optionIds: [modeId],
        abilityIncreases: next,
      })
    }

    return (
      <div className="border border-[#c9b89c] rounded p-3 bg-white/60">
        <FieldLabel>{getChoiceLabel(choice, locale)}</FieldLabel>
        <Select
          value={mode}
          onChange={(e) => handleModeChange(e.target.value)}
          options={[
            { value: '', label: '—' },
            ...choice.options.map((option) => ({
              value: option.id,
              label: t(option.nameKey, locale),
            })),
          ]}
        />
        {mode === 'twoPlusOne' && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            <Select
              label={t('ui.levelUp.ability1', locale)}
              value={firstAbility}
              onChange={(e) => handleAbilityChange(0, e.target.value as AbilityKey)}
              options={abilityOptions}
            />
            <Select
              label={t('ui.levelUp.ability2', locale)}
              value={secondAbility}
              onChange={(e) => handleAbilityChange(1, e.target.value as AbilityKey)}
              options={abilityOptions}
            />
          </div>
        )}
        {mode === 'threePlusOne' && (
          <div className="grid grid-cols-3 gap-2 mt-2">
            <Select
              label={t('ui.levelUp.ability1', locale)}
              value={firstAbility}
              onChange={(e) => handleAbilityChange(0, e.target.value as AbilityKey)}
              options={abilityOptions}
            />
            <Select
              label={t('ui.levelUp.ability2', locale)}
              value={secondAbility}
              onChange={(e) => handleAbilityChange(1, e.target.value as AbilityKey)}
              options={abilityOptions}
            />
            <Select
              label={t('ui.levelUp.ability', locale)}
              value={thirdAbility}
              onChange={(e) => handleAbilityChange(2, e.target.value as AbilityKey)}
              options={abilityOptions}
            />
          </div>
        )}
      </div>
    )
  }

  const getSkillLabel = (skillKey: string) =>
    SKILL_DATA.find((skill) => skill.key === skillKey)?.label ?? skillKey

  const renderWeaponMasteryChoices = () => {
    if (weaponMasteryChoices.length === 0) return null
    const firstChoice = weaponMasteryChoices[0]
    const options = firstChoice?.options ?? []
    const count = weaponMasteryChoices.length
    const weaponItems = options.map((o) => ({
      id: o.id,
      label: t(o.nameKey, locale),
      meta: {},
    }))

    const typeFilterOptions = [
      { id: 'melee', label: 'Melee', value: 'melee' as const },
      { id: 'ranged', label: 'Ranged', value: 'ranged' as const },
    ]
    const typeFilters = [
      {
        key: 'type',
        label: t('term.weaponMastery', locale),
        options: typeFilterOptions,
        getItemValue: (item: { id: string }) => {
          const w = RULESET_2024.weaponMastery.weapons[item.id]
          return w?.type ?? 'melee'
        },
      },
    ]

    return (
      <div key="weapon-mastery-group" className="border border-[#c9b89c] rounded p-3 bg-white/60">
        <FieldLabel>{t('choice.weaponMastery', locale)}</FieldLabel>
        <FilterableList
          items={weaponItems}
          selectedIds={weaponMasterySelectedIds}
          onSelectionChange={(ids) => {
            weaponMasteryChoices.forEach((choice, idx) => {
              updateDecision(choice.id, {
                optionIds: ids[idx] ? [ids[idx]] : [],
              })
            })
          }}
          maxSelections={count}
          selectionLabel={`${weaponMasterySelectedIds.length}/${count}`}
          filters={typeFilters}
        />
      </div>
    )
  }

  const renderChoice = (choice: ChoiceRequirement) => {
    const isSkillChoice =
      choice.type === 'backgroundSkill' ||
      choice.type === 'classSkill' ||
      (choice.type === 'speciesChoice' &&
        choice.options.every((o) => SKILL_DATA.some((s) => s.key === o.id)))
    const isMultiSelect = (choice.minSelections ?? 1) > 1 || (choice.maxSelections ?? 1) > 1

    if (isSkillChoice && isMultiSelect) {
      const decision = decisions[choice.id]
      const selectedIds = decision?.optionIds ?? []
      return (
        <div key={choice.id} className="border border-[#c9b89c] rounded p-3 bg-white/60">
          <FieldLabel>{getChoiceLabel(choice, locale)}</FieldLabel>
          <FilterableList
            items={choice.options.map((o) => ({
              id: o.id,
              label: getSkillLabel(o.id),
              description: undefined,
            }))}
            selectedIds={selectedIds}
            onSelectionChange={(ids) => updateDecision(choice.id, { optionIds: ids })}
            maxSelections={choice.maxSelections ?? 3}
            selectionLabel={`${selectedIds.length}/${choice.maxSelections ?? 3}`}
          />
        </div>
      )
    }
    if (isSkillChoice) {
      const decision = decisions[choice.id]
      const selectedOption = decision?.optionIds[0] ?? ''
      return (
        <div key={choice.id} className="border border-[#c9b89c] rounded p-3 bg-white/60">
          <FieldLabel>{getChoiceLabel(choice, locale)}</FieldLabel>
          <Select
            value={selectedOption}
            onChange={(e) => handleChoiceChange(choice.id, e.target.value)}
            options={[
              { value: '', label: '—' },
              ...choice.options.map((option) => ({
                value: option.id,
                label: getSkillLabel(option.id),
              })),
            ]}
          />
        </div>
      )
    }

    if (choice.type === 'backgroundTool' && isMultiSelect) {
      const decision = decisions[choice.id]
      const selectedIds = decision?.optionIds ?? []
      return (
        <div key={choice.id} className="border border-[#c9b89c] rounded p-3 bg-white/60">
          <FieldLabel>{getChoiceLabel(choice, locale)}</FieldLabel>
          <FilterableList
            items={choice.options.map((o) => ({
              id: o.id,
              label: t(o.nameKey, locale),
              description: undefined,
            }))}
            selectedIds={selectedIds}
            onSelectionChange={(ids) => updateDecision(choice.id, { optionIds: ids })}
            maxSelections={choice.maxSelections ?? 3}
            selectionLabel={`${selectedIds.length}/${choice.maxSelections ?? 3}`}
          />
        </div>
      )
    }
    if (choice.type === 'backgroundTool') {
      const decision = decisions[choice.id]
      const selectedOption = decision?.optionIds[0] ?? ''
      return (
        <div key={choice.id} className="border border-[#c9b89c] rounded p-3 bg-white/60">
          <FieldLabel>{getChoiceLabel(choice, locale)}</FieldLabel>
          <Select
            value={selectedOption}
            onChange={(e) => handleChoiceChange(choice.id, e.target.value)}
            options={[
              { value: '', label: '—' },
              ...choice.options.map((option) => ({
                value: option.id,
                label: t(option.nameKey, locale),
              })),
            ]}
          />
        </div>
      )
    }

    if (choice.type === 'subclass') {
      const decision = decisions[choice.id]
      const selectedOption = decision?.optionIds[0] ?? ''
      return (
        <div key={choice.id} className="border border-[#c9b89c] rounded p-3 bg-white/60">
          <FieldLabel>{getChoiceLabel(choice, locale)}</FieldLabel>
          <Select
            value={selectedOption}
            onChange={(e) => {
              const id = e.target.value
              handleChoiceChange(choice.id, id)
              if (id) setDetailSelection({ type: 'subclass', id })
            }}
            options={[
              { value: '', label: '—' },
              ...choice.options.map((option) => ({
                value: option.id,
                label: t(option.nameKey, locale),
              })),
            ]}
          />
        </div>
      )
    }

    if (choice.type === 'backgroundAbility') {
      return <div key={choice.id}>{renderBackgroundAbilityChoice(choice)}</div>
    }

    if (choice.type === 'featureSkill') {
      const decision = decisions[choice.id]
      const selectedIds = decision?.optionIds ?? []
      return (
        <div key={choice.id} className="border border-[#c9b89c] rounded p-3 bg-white/60">
          <FieldLabel>{getChoiceLabel(choice, locale)}</FieldLabel>
          <FilterableList
            items={choice.options.map((o) => ({
              id: o.id,
              label: getSkillLabel(o.id),
              description: undefined,
            }))}
            selectedIds={selectedIds}
            onSelectionChange={(ids) => updateDecision(choice.id, { optionIds: ids })}
            maxSelections={choice.maxSelections}
            selectionLabel={`${selectedIds.length}/${choice.maxSelections}`}
          />
        </div>
      )
    }

    if (choice.type === 'featureSpell') {
      const decision = decisions[choice.id]
      const selectedIds = decision?.optionIds ?? []
      const isReplaceAdd = choice.id.startsWith('class-bard-replace-add-')
      const excludeIds = isReplaceAdd
        ? character.spells?.filter((s) => s.id !== decisions[choice.id.replace('replace-add-', 'replace-remove-')]?.optionIds?.[0]).map((s) => s.id) ?? []
        : character.spells?.map((s) => s.id) ?? []
      const maxSpellLevel = choice.meta?.maxSpellLevel
        ? parseInt(String(choice.meta.maxSpellLevel), 10)
        : undefined
      return (
        <div key={choice.id}>
          <ChoiceResolver
            definition={{
              id: choice.id,
              nameKey: choice.labelKey,
              choiceType: 'spell',
              quantity: choice.maxSelections,
              sourcePool: (choice.meta?.sourcePool as 'spellsSrd' | 'spellsBard') ?? 'spellsSrd',
              filters: Number.isFinite(maxSpellLevel) ? { maxSpellLevel: maxSpellLevel! } : {},
            }}
            selectedIds={selectedIds}
            onSelectionChange={(ids) => {
              updateDecision(choice.id, { optionIds: ids })
              if (ids[0]) setDetailSelection({ type: 'spell', id: ids[0] })
            }}
            locale={locale}
            t={t}
            excludeIds={excludeIds}
          />
        </div>
      )
    }

    if (choice.type === 'bardSpellLearn') {
      const decision = decisions[choice.id]
      const selectedIds = decision?.optionIds ?? []
      const maxSpellLevel = choice.meta?.maxSpellLevel
        ? parseInt(String(choice.meta.maxSpellLevel), 10)
        : undefined
      return (
        <div key={choice.id}>
          <ChoiceResolver
            definition={{
              id: choice.id,
              nameKey: choice.labelKey,
              choiceType: 'spell',
              quantity: 1,
              sourcePool: 'spellsBard',
              filters: Number.isFinite(maxSpellLevel) ? { maxSpellLevel: maxSpellLevel! } : {},
            }}
            selectedIds={selectedIds}
            onSelectionChange={(ids) => {
              updateDecision(choice.id, { optionIds: ids })
              if (ids[0]) setDetailSelection({ type: 'spell', id: ids[0] })
            }}
            locale={locale}
            t={t}
            excludeIds={character.spells?.map((s) => s.id) ?? []}
          />
        </div>
      )
    }

    if (choice.type === 'bardSpellReplace') {
      const decision = decisions[choice.id]
      const selectedOption = decision?.optionIds[0] ?? ''
      const addChoiceId = choice.id.replace('replace-remove-', 'replace-add-')
      return (
        <div key={choice.id} className="border border-[#c9b89c] rounded p-3 bg-white/60">
          <FieldLabel>{getChoiceLabel(choice, locale)}</FieldLabel>
          <Select
            value={selectedOption}
            onChange={(e) => {
              const id = e.target.value
              handleChoiceChange(choice.id, id)
              if (id) {
                setDetailSelection({ type: 'spell', id })
              } else {
                updateDecision(addChoiceId, { optionIds: [] })
              }
            }}
            options={[
              { value: '', label: '—' },
              ...choice.options.map((option) => ({
                value: option.id,
                label: t(option.nameKey, locale),
              })),
            ]}
          />
        </div>
      )
    }

    const decision = decisions[choice.id]
    const selectedOption = decision?.optionIds[0] ?? ''
    const options = [
      { value: '', label: '—' },
      ...choice.options.map((option) => ({
        value: option.id,
        label: t(option.nameKey, locale),
      })),
    ]
    const handleChange = (value: string) => {
      handleChoiceChange(choice.id, value)
      if ((choice.type === 'featOrAsi' || choice.type === 'fightingStyle' || choice.type === 'feat') && value) {
        setDetailSelection({ type: 'feat', id: value })
      }
    }
    return (
      <div key={choice.id} className="border border-[#c9b89c] rounded p-3 bg-white/60">
        <FieldLabel>{getChoiceLabel(choice, locale)}</FieldLabel>
        <Select
          value={selectedOption}
          onChange={(e) => handleChange(e.target.value)}
          options={options}
        />
        {choice.type === 'featOrAsi' && renderFeatOrAsiExtras(choice)}
      </div>
    )
  }

  const handleApply = () => {
    const decisionList = Object.values(decisions)
    const result = applyLevelUpDecisions(draft, decisionList, RULESET_2024)
    if (result.errors.length > 0 || !result.character) {
      setErrors(result.errors)
      return
    }
    const updatedCharacter = applyAdvancementToCharacter(
      character,
      result.character,
      locale,
      advancementMode
    )
    onApply(updatedCharacter)
    setErrors([])
    onClose()
  }

  const xpThreshold = RULESET_2024.xpThresholds[targetLevel] ?? null
  const xpDisplay =
    xpThreshold !== null ? `${advancementCharacter.xp} / ${xpThreshold}` : `${advancementCharacter.xp}`

  const levelReachedTitle = t('ui.levelUp.levelReached', locale).replace(
    '{level}',
    String(targetLevel)
  )
  const classNameDisplay = classDef ? t(classDef.nameKey, locale) : selectedClassId

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('ui.levelUp.title', locale)} variant="split">
      <div className="flex-1 flex min-h-0">
        <div className="w-[42%] min-w-0 flex flex-col border-r border-[#c9b89c] pr-4 overflow-y-auto">
          <div className="grid gap-4 text-xs text-[#5c3b22]">
        <div className="grid grid-cols-2 gap-2">
          <Select
            label={t('ui.levelUp.classToAdvance', locale)}
            value={selectedClassId}
            onChange={(e) => {
              const id = e.target.value
              setLevelingClassId(id)
              setDetailSelection(id ? { type: 'class', id } : null)
            }}
            options={classOptions}
          />
          <Select
            label={t('ui.levelUp.advancementMode', locale)}
            value={advancementMode}
            onChange={(e) => setAdvancementMode(e.target.value as AdvancementMode)}
            options={[
              { value: 'xp', label: t('ui.levelUp.modeXp', locale) },
              { value: 'milestone', label: t('ui.levelUp.modeMilestone', locale) },
            ]}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Select
            label={t('term.species', locale)}
            value={selectedSpeciesId}
            onChange={(e) => {
              const id = e.target.value
              setSelectedSpeciesId(id)
              if (id) setDetailSelection({ type: 'species', id })
            }}
            options={[{ value: '', label: '—' }, ...speciesOptions]}
          />
          <Select
            label={t('term.background', locale)}
            value={selectedBackgroundId}
            onChange={(e) => {
              const id = e.target.value
              setSelectedBackgroundId(id)
              if (id) setDetailSelection({ type: 'background', id })
            }}
            options={[{ value: '', label: '—' }, ...backgroundOptions]}
          />
        </div>
        {advancementMode === 'xp' && (
          <Box className="bg-white/60">
            <div className="font-semibold">{t('ui.levelUp.xp', locale)}</div>
            <div>{xpDisplay}</div>
          </Box>
        )}

        <div className="border-t border-[#c9b89c] pt-4 mt-2">
          <h3 className="text-sm font-display uppercase text-[#7a4b36] mb-3">
            {levelReachedTitle}
          </h3>

          <div className="grid gap-3">
            <Box className="bg-green-50/60 border border-green-200/60 rounded p-3">
              <div className="font-semibold text-[#5c3b22] mb-2">
                {t('ui.levelUp.automaticGains', locale)}
              </div>
              <div className="space-y-2">
                <div className="text-[11px]">
                  <span className="font-medium">{t('ui.levelUp.hpIncrease', locale)}:</span>{' '}
                  +{automaticGains.hpIncrease} ({Math.floor(hitDiceType / 2) + 1} + {conMod} CON)
                </div>
                <div className="text-[11px]">
                  <span className="font-medium">{t('ui.levelUp.proficiencyBonus', locale)}:</span>{' '}
                  +{automaticGains.proficiencyBonus}
                </div>
                {automaticGains.passiveFeatures.map((f) => (
                  <ExpandableRow
                    key={f.id}
                    id={f.id}
                    label={t(f.nameKey, locale)}
                    isSelected={false}
                    isExpanded={expandedFeatureId === f.id}
                    onToggle={() =>
                      setExpandedFeatureId((prev) => (prev === f.id ? null : f.id))
                    }
                    source={`Level ${f.level} ${classNameDisplay}`}
                    description={f.descriptionKey ? t(f.descriptionKey, locale) : undefined}
                    mechanicsTags={
                      f.type === 'RESOURCE' && f.scaling?.reset
                        ? [{ label: t('ui.mechanics.reset', locale), value: f.scaling.reset === 'long' ? 'Long Rest' : 'Short Rest' }]
                        : f.type === 'ACTION'
                          ? [{ label: t('ui.mechanics.actionType', locale), value: 'Action' }]
                          : undefined
                    }
                  />
                ))}
              </div>
            </Box>

            {(nonWeaponMasteryChoices.length > 0 || weaponMasteryChoices.length > 0) && (
              <Box className="bg-amber-50/60 border border-amber-200/60 rounded p-3">
                <div className="font-semibold text-[#5c3b22] mb-2">
                  {t('ui.levelUp.decisionsRequired', locale)}
                </div>
                <div className="grid gap-3">
                  {renderWeaponMasteryChoices()}
                  {nonWeaponMasteryChoices.map(renderChoice)}
                </div>
              </Box>
            )}

            {draft.choices.length === 0 && (
              <Box className="bg-white/60">{t('ui.levelUp.noChoices', locale)}</Box>
            )}
          </div>
        </div>

        {draft.errors.length > 0 && (
          <div className="border border-red-300 bg-red-50 text-red-700 rounded p-2">
            {draft.errors.map((error) => (
              <div key={`${error.code}-${String(error.messageKey)}`}>
                {formatError(error, locale)}
              </div>
            ))}
          </div>
        )}

        {errors.length > 0 && (
          <div className="border border-red-300 bg-red-50 text-red-700 rounded p-2">
            {errors.map((error) => (
              <div key={`${error.code}-${String(error.messageKey)}`}>
                {formatError(error, locale)}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 shrink-0">
          <Button variant="small" onClick={onClose}>
            {t('ui.levelUp.cancel', locale)}
          </Button>
          <Button variant="small" onClick={handleApply}>
            {t('ui.levelUp.confirm', locale)}
          </Button>
        </div>
          </div>
        </div>
        <div className="flex-1 min-w-0 flex flex-col bg-white/30 rounded-r-lg border border-[#c9b89c] border-l-0">
          <LevelUpDetailPanel
            selection={detailSelection}
            locale={locale}
            classLevel={targetLevel}
          />
        </div>
      </div>
    </Modal>
  )
}
