import { useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react'
import type { Character } from '@/types/character'
import type { AbilityKey } from '@/types/abilities'
import { createEmptyCharacter } from '@/types/character'
import { RULESET_2024 } from '@/utils/advancementEngine'
import { applyAdvancementToCharacter } from '@/utils/advancementMapper'
import type { AdvancementCharacter, Locale } from '@/utils/advancementTypes'
import { t } from '@/utils/i18n'
import { Button, Modal, Select, FieldLabel, Box, ExpandableRow, FilterableList, ChoiceResolver } from '@/components/ui'
import {
  ABILITIES_ORDER,
  ABILITY_LABELS,
  SKILL_DATA,
} from '@/features/character-sheet/constants'
import { MUSICAL_INSTRUMENTS } from '@/data/musicalInstruments'
import { PointBuyStep } from '@/features/character-sheet/PointBuyStep'
import { validatePointBuy } from '@/utils/pointBuyRules'
import { cn } from '@/utils/cn'
const MARTIAL_CLASS_IDS = ['barbarian', 'fighter', 'monk', 'paladin', 'ranger', 'rogue']

type CreationDraft = {
  classId: string
  orderId: string
  weaponMasteryIds: string[]
  bardSkillIds: string[]
  bardToolIds: string[]
  bardCantripIds: string[]
  bardSpellIds: string[]
  backgroundId: string
  abilityIncreases: Array<{ ability: AbilityKey; amount: 1 | 2 }>
  abilityMode: 'twoPlusOne' | 'threePlusOne'
  speciesId: string
  lineageChoiceId: string
  humanBonusFeatId: string
  halfElfSkillIds: string[]
  halfElfAbilityIncreases: [AbilityKey, AbilityKey]
  equipmentMode: 'gold' | 'package'
  baseAbilities: Record<AbilityKey, number>
  /** Structured choice selections: choiceId -> selected option IDs */
  structuredChoices: Record<string, string[]>
}

const DEFAULT_BASE_ABILITIES: Record<AbilityKey, number> = {
  str: 15,
  dex: 14,
  con: 13,
  int: 12,
  wis: 10,
  cha: 8,
}

const DEFAULT_DRAFT: CreationDraft = {
  classId: '',
  orderId: '',
  weaponMasteryIds: [],
  bardSkillIds: [],
  bardToolIds: [],
  bardCantripIds: [],
  bardSpellIds: [],
  backgroundId: '',
  abilityIncreases: [],
  abilityMode: 'twoPlusOne',
  speciesId: '',
  lineageChoiceId: '',
  humanBonusFeatId: '',
  halfElfSkillIds: [],
  halfElfAbilityIncreases: ['str', 'dex'],
  equipmentMode: 'package',
  baseAbilities: { ...DEFAULT_BASE_ABILITIES },
  structuredChoices: {},
}

export type CharacterCreationWizardProps = {
  isOpen?: boolean
  locale: Locale
  onComplete: (character: Character) => void
  onClose: () => void
  resetRef?: React.RefObject<{ reset: () => void } | null>
  /** When true, render as full page instead of modal */
  asPage?: boolean
}

export function CharacterCreationWizard({
  isOpen = true,
  locale,
  onComplete,
  onClose,
  resetRef,
  asPage = false,
}: CharacterCreationWizardProps) {
  const [step, setStep] = useState(1)
  const [draft, setDraft] = useState<CreationDraft>(() => ({ ...DEFAULT_DRAFT }))
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const resetKeyRef = useRef(0)

  const resetWizard = useCallback(() => {
    setStep(1)
    setDraft({ ...DEFAULT_DRAFT })
    setExpandedId(null)
    resetKeyRef.current += 1
  }, [])

  useImperativeHandle(resetRef, () => ({ reset: resetWizard }), [resetWizard])

  const classDef = draft.classId ? RULESET_2024.classes[draft.classId] : undefined
  const backgroundDef = draft.backgroundId ? RULESET_2024.backgrounds[draft.backgroundId] : undefined
  const speciesDef = draft.speciesId ? RULESET_2024.species[draft.speciesId] : undefined
  const isCleric = draft.classId === 'cleric'
  const isDruid = draft.classId === 'druid'
  const isBard = draft.classId === 'bard'
  const isMartial = MARTIAL_CLASS_IDS.includes(draft.classId)
  const isHuman = draft.speciesId === 'human'
  const isHalfElf = draft.speciesId === 'half-elf'

  const weaponMasteryGrants = useMemo(() => {
    if (!classDef?.weaponMastery?.length) return []
    return classDef.weaponMastery.filter((g) => g.level === 1)
  }, [classDef])

  const weaponOptions = useMemo(() => {
    const weapons = Object.values(RULESET_2024.weaponMastery.weapons)
    const grant = weaponMasteryGrants[0]
    if (!grant) return []
    const filters = grant.filters
    if (filters.includes('any')) return weapons
    return weapons.filter((w) =>
      filters.some((f) => f === 'melee' && w.type === 'melee' || f === 'ranged' && w.type === 'ranged' || w.traits.includes(f))
    )
  }, [weaponMasteryGrants])

  const originFeatOptions = useMemo(
    () =>
      Object.values(RULESET_2024.feats)
        .filter((f) => f.category === 'origin' && !f.tags?.includes('asi'))
        .map((f) => ({ id: f.id, nameKey: f.nameKey })),
    []
  )

  const getDisplayName = (bg: typeof backgroundDef, key: 'name' | 'description') => {
    if (!bg) return ''
    const val = bg[key as keyof typeof bg]
    if (typeof val === 'object' && val && 'en' in val && 'fr' in val) {
      return (val as { en?: string; fr?: string })[locale] ?? (val as { en?: string }).en ?? ''
    }
    return typeof val === 'string' ? val : ''
  }

  const updateDraft = useCallback((updates: Partial<CreationDraft>) => {
    setDraft((prev) => ({ ...prev, ...updates }))
  }, [])

  const canProceed = useMemo(() => {
    if (step === 1) {
      if (!draft.classId) return false
      if (isCleric && !draft.orderId) return false
      if (isDruid && !draft.orderId) return false
      if (isBard) {
        if (draft.bardSkillIds.length < 3) return false
        if (draft.bardToolIds.length < 3) return false
        if (draft.bardCantripIds.length < 2) return false
        if (draft.bardSpellIds.length < 4) return false
      }
      if (isMartial) {
        const count = weaponMasteryGrants[0]?.count ?? 0
        if (draft.weaponMasteryIds.length < count) return false
      }
      return true
    }
    if (step === 2) {
      if (!draft.speciesId) return false
      const choice = speciesDef?.choices?.[0]
      if (choice?.options?.length && !choice.optionsFrom && !draft.lineageChoiceId) return false
      const highOption = choice?.options?.find((o) => o.id === 'high')
      const structuredChoice = highOption?.structuredChoice
      if (draft.lineageChoiceId === 'high' && structuredChoice) {
        const selected = draft.structuredChoices[structuredChoice.id] ?? []
        if (selected.length < structuredChoice.quantity) return false
      }
      const isHalfElf = draft.speciesId === 'half-elf'
      if (isHalfElf && draft.halfElfSkillIds.length < 2) return false
      if (isHalfElf && new Set(draft.halfElfSkillIds).size !== draft.halfElfSkillIds.length)
        return false
      if (isHalfElf && (draft.halfElfAbilityIncreases[0] === 'cha' || draft.halfElfAbilityIncreases[1] === 'cha'))
        return false
      if (isHalfElf && draft.halfElfAbilityIncreases[0] === draft.halfElfAbilityIncreases[1])
        return false
      return true
    }
    if (step === 3) {
      if (!draft.backgroundId) return false
      const structuredChoices = backgroundDef?.structuredChoices ?? []
      for (const sc of structuredChoices) {
        const selected = draft.structuredChoices[sc.id] ?? []
        if (selected.length < sc.quantity) return false
      }
      const isHalfElf = draft.speciesId === 'half-elf'
      if (!isHalfElf) {
        const allowed = backgroundDef?.abilityChoices ?? []
        const increases = draft.abilityIncreases
        if (increases.length === 0) return false
        const total = increases.reduce((s, i) => s + i.amount, 0)
        if (total !== 3) return false
        const abilities = increases.map((i) => i.ability)
        if (new Set(abilities).size !== abilities.length) return false
        if (abilities.some((a) => !allowed.includes(a))) return false
      }
      return true
    }
    if (step === 4) {
      const pb = validatePointBuy(draft.baseAbilities)
      return pb.valid
    }
    if (step === 5) {
      if (isHuman && !draft.humanBonusFeatId) return false
      return true
    }
    return true
  }, [step, draft, isCleric, isDruid, isMartial, backgroundDef, speciesDef, isHuman, weaponMasteryGrants, locale])

  const handleAbilityModeChange = (mode: 'twoPlusOne' | 'threePlusOne') => {
    const allowed = backgroundDef?.abilityChoices ?? ['str', 'dex', 'con', 'int', 'wis', 'cha']
    const safe = allowed as AbilityKey[]
    if (mode === 'twoPlusOne') {
      updateDraft({
        abilityMode: 'twoPlusOne',
        abilityIncreases: [
          { ability: safe[0] ?? 'str', amount: 2 },
          { ability: safe[1] ?? 'dex', amount: 1 },
        ],
      })
    } else {
      updateDraft({
        abilityMode: 'threePlusOne',
        abilityIncreases: [
          { ability: safe[0] ?? 'str', amount: 1 },
          { ability: safe[1] ?? 'dex', amount: 1 },
          { ability: safe[2] ?? 'con', amount: 1 },
        ],
      })
    }
  }

  const handleAbilityIncreaseChange = (index: number, ability: AbilityKey) => {
    const next = [...draft.abilityIncreases]
    if (!next[index]) return
    next[index] = { ...next[index], ability }
    updateDraft({ abilityIncreases: next })
  }

  const handleFinish = () => {
    const base = { ...draft.baseAbilities }
    if (isHalfElf) {
      base.cha = (base.cha ?? 10) + 2
      base[draft.halfElfAbilityIncreases[0]] = (base[draft.halfElfAbilityIncreases[0]] ?? 10) + 1
      base[draft.halfElfAbilityIncreases[1]] = (base[draft.halfElfAbilityIncreases[1]] ?? 10) + 1
    } else {
      draft.abilityIncreases.forEach((inc) => {
        base[inc.ability] = (base[inc.ability] ?? 10) + inc.amount
      })
    }

    const choices: Record<string, string[]> = {}

    if (draft.backgroundId && backgroundDef && !isHalfElf) {
      const abId = `background-${backgroundDef.id}-abilities`
      choices[abId] = draft.abilityIncreases.map((i) => i.ability)
      if (backgroundDef.skillChoices?.length) {
        backgroundDef.skillChoices.forEach((group, idx) => {
          const skillId = `background-${backgroundDef.id}-skill-${idx}`
          choices[skillId] = group[0] ? [group[0]] : []
        })
      }
    }

    if (draft.speciesId && speciesDef?.choices?.length) {
      speciesDef.choices.forEach((c, idx) => {
        const choiceId = `species-${speciesDef.id}-${c.id}-${c.level}`
        const selected =
          c.optionsFrom === 'originFeats'
            ? draft.humanBonusFeatId
            : c.optionsFrom === 'allSkills'
              ? draft.halfElfSkillIds[idx]
              : draft.lineageChoiceId
        if (selected) choices[choiceId] = [selected]
      })
      Object.entries(draft.structuredChoices).forEach(([choiceId, ids]) => {
        if (ids.length && choiceId.startsWith('high-elf-')) {
          choices[`species-${speciesDef.id}-${choiceId}-1`] = ids
        }
      })
    }
    if (backgroundDef?.structuredChoices?.length) {
      backgroundDef.structuredChoices.forEach((sc) => {
        const ids = draft.structuredChoices[sc.id]
        if (ids?.length) {
          choices[`background-${backgroundDef.id}-${sc.id}`] = ids
        }
      })
    }

    if (isCleric) {
      choices[`class-cleric-order-1`] = [draft.orderId]
    }
    if (isDruid) {
      choices[`class-druid-order-1`] = [draft.orderId]
    }
    if (draft.classId === 'bard') {
      if (draft.bardSkillIds.length === 3) choices['class-bard-skill-1'] = [...draft.bardSkillIds]
      if (draft.bardToolIds.length === 3) choices['class-bard-tool-1'] = [...draft.bardToolIds]
      if (draft.bardCantripIds.length >= 2) choices['class-bard-cantrips-1'] = [...draft.bardCantripIds]
      if (draft.bardSpellIds.length >= 4) choices['class-bard-spells-1'] = [...draft.bardSpellIds]
    }

    const feats = backgroundDef?.originFeatId ? [backgroundDef.originFeatId] : []
    if (isHuman && draft.humanBonusFeatId) {
      feats.push(draft.humanBonusFeatId)
    }

    const advancement: AdvancementCharacter = {
      level: 1,
      xp: 0,
      abilities: base,
      classes: [{ classId: draft.classId, level: 1 }],
      speciesId: draft.speciesId || undefined,
      backgroundId: draft.backgroundId || undefined,
      feats,
      weaponProficiencies: [],
      weaponMasteries: [...draft.weaponMasteryIds],
      choices,
    }

    const emptyChar = createEmptyCharacter()
    const character = applyAdvancementToCharacter(emptyChar, advancement, locale, 'milestone', {
      equipmentMode: draft.equipmentMode,
    })
    onComplete(character)
    resetWizard()
    if (!asPage) onClose()
  }

  const renderStep1 = () => (
    <div className="grid gap-4">
      <FieldLabel>{t('ui.creation.selectClass', locale)}</FieldLabel>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {Object.values(RULESET_2024.classes).map((c) => {
          const def = RULESET_2024.classes[c.id]
          const hitDie = def?.hitDie ?? 8
          const spellcasting = def?.spellcasting ?? 'none'
          return (
            <ExpandableRow
              key={c.id}
              id={c.id}
              label={t(c.nameKey, locale)}
              isSelected={draft.classId === c.id}
              isExpanded={expandedId === `1-${c.id}`}
              onToggle={() => {
                updateDraft({
                  classId: c.id,
                  orderId: '',
                  weaponMasteryIds: [],
                  bardSkillIds: c.id === 'bard' ? draft.bardSkillIds : [],
                  bardToolIds: c.id === 'bard' ? draft.bardToolIds : [],
                  bardCantripIds: c.id === 'bard' ? draft.bardCantripIds : [],
                  bardSpellIds: c.id === 'bard' ? draft.bardSpellIds : [],
                })
                const key = `1-${c.id}`
                setExpandedId((prev) => (prev === key ? null : key))
              }}
              source={`Level 1 ${t(c.nameKey, locale)}`}
              mechanicsTags={[
                { label: t('ui.mechanics.hitDie', locale), value: `d${hitDie}` },
                {
                  label: t('ui.mechanics.spellcasting', locale),
                  value: spellcasting === 'none' ? 'None' : spellcasting === 'full' ? 'Full' : spellcasting === 'half' ? 'Half' : 'Pact',
                },
              ]}
            />
          )
        })}
      </div>

      {isCleric && (
        <div className="border border-[#c9b89c] rounded p-3 bg-white/60">
          <FieldLabel>{t('ui.creation.divineOrder', locale)}</FieldLabel>
          <div className="flex gap-2 mt-1">
            {[
              { id: 'protector', key: 'ui.creation.orderProtector' },
              { id: 'thaumaturge', key: 'ui.creation.orderThaumaturge' },
            ].map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => updateDraft({ orderId: o.id })}
                className={cn(
                  'px-3 py-1.5 rounded text-xs border',
                  draft.orderId === o.id ? 'border-[#7a4b36] bg-[#f3e2c8]' : 'border-[#c9b89c] bg-white/60'
                )}
              >
                {t(o.key, locale)}
              </button>
            ))}
          </div>
        </div>
      )}

      {isDruid && (
        <div className="border border-[#c9b89c] rounded p-3 bg-white/60">
          <FieldLabel>{t('ui.creation.primalOrder', locale)}</FieldLabel>
          <div className="flex gap-2 mt-1">
            {[
              { id: 'magician', key: 'ui.creation.orderMagician' },
              { id: 'warden', key: 'ui.creation.orderWarden' },
            ].map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => updateDraft({ orderId: o.id })}
                className={cn(
                  'px-3 py-1.5 rounded text-xs border',
                  draft.orderId === o.id ? 'border-[#7a4b36] bg-[#f3e2c8]' : 'border-[#c9b89c] bg-white/60'
                )}
              >
                {t(o.key, locale)}
              </button>
            ))}
          </div>
        </div>
      )}

      {isMartial && weaponOptions.length > 0 && (
        <div className="border border-[#c9b89c] rounded p-3 bg-white/60">
          <FieldLabel>{t('ui.creation.selectWeapons', locale)}</FieldLabel>
          <FilterableList
            items={weaponOptions.map((w) => {
              const prop = RULESET_2024.weaponMastery.properties[w.mastery]
              return {
                id: w.id,
                label: t(w.nameKey, locale),
                description: prop ? t(prop.descriptionKey, locale) : undefined,
                meta: { type: w.type },
              }
            })}
            selectedIds={draft.weaponMasteryIds}
            onSelectionChange={(ids) => updateDraft({ weaponMasteryIds: ids })}
            maxSelections={weaponMasteryGrants[0]?.count ?? 2}
            selectionLabel={`${draft.weaponMasteryIds.length}/${weaponMasteryGrants[0]?.count ?? 0}`}
            filters={[
              {
                key: 'type',
                label: 'Type',
                options: [
                  { id: 'melee', label: 'Melee', value: 'melee' },
                  { id: 'ranged', label: 'Ranged', value: 'ranged' },
                ],
                getItemValue: (item) => (item.meta?.type as string) ?? 'melee',
              },
            ]}
          />
        </div>
      )}

      {isBard && (
        <>
          <div className="border border-[#c9b89c] rounded p-3 bg-white/60">
            <FieldLabel>{t('choice.bardSkills', locale)}</FieldLabel>
            <FilterableList
              items={SKILL_DATA.map((s) => ({ id: s.key, label: s.label, description: undefined }))}
              selectedIds={draft.bardSkillIds}
              onSelectionChange={(ids) => updateDraft({ bardSkillIds: ids })}
              maxSelections={3}
              selectionLabel={`${draft.bardSkillIds.length}/3`}
            />
          </div>
          <div className="border border-[#c9b89c] rounded p-3 bg-white/60">
            <FieldLabel>{t('choice.bardTools', locale)}</FieldLabel>
            <FilterableList
            items={MUSICAL_INSTRUMENTS.map((inst) => ({
              id: inst.id,
              label: t(inst.nameKey as string, locale),
                description: undefined,
              }))}
              selectedIds={draft.bardToolIds}
              onSelectionChange={(ids) => updateDraft({ bardToolIds: ids })}
              maxSelections={3}
              selectionLabel={`${draft.bardToolIds.length}/3`}
            />
          </div>
          <div className="border border-[#c9b89c] rounded p-3 bg-white/60">
            <FieldLabel>{t('ui.creation.bardCantrips', locale) || 'Choose 2 Cantrips'}</FieldLabel>
            <ChoiceResolver
              definition={{
                id: 'bard-cantrips',
                nameKey: 'ui.creation.bardCantrips',
                choiceType: 'spell',
                quantity: 2,
                sourcePool: 'spellsBard',
                filters: { spellLevel: 0 },
              }}
              selectedIds={draft.bardCantripIds}
              onSelectionChange={(ids) => updateDraft({ bardCantripIds: ids })}
              locale={locale}
              t={t}
            />
          </div>
          <div className="border border-[#c9b89c] rounded p-3 bg-white/60">
            <FieldLabel>{t('ui.creation.bardSpells', locale) || 'Choose 4 1st-level Spells'}</FieldLabel>
            <ChoiceResolver
              definition={{
                id: 'bard-spells',
                nameKey: 'ui.creation.bardSpells',
                choiceType: 'spell',
                quantity: 4,
                sourcePool: 'spellsBard',
                filters: { spellLevel: 1 },
              }}
              selectedIds={draft.bardSpellIds}
              onSelectionChange={(ids) => updateDraft({ bardSpellIds: ids })}
              locale={locale}
              t={t}
            />
          </div>
        </>
      )}
    </div>
  )

  const NON_CHA_ABILITIES: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis']

  const renderStep2 = () => (
    <div className="grid gap-4">
      <FieldLabel>{t('ui.creation.selectSpecies', locale)}</FieldLabel>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {Object.values(RULESET_2024.species).map((s) => {
          const traitDescriptions =
            s.traits?.length > 0
              ? s.traits
                  .filter((tr) => tr.level === 1)
                  .map((tr) => ({
                    name: t(tr.nameKey, locale),
                    desc: t(tr.descriptionKey, locale),
                  }))
              : []
          const fullDescription = traitDescriptions
            .map((t) => `${t.name}: ${t.desc}`)
            .join('\n\n')
          return (
            <ExpandableRow
              key={s.id}
              id={s.id}
              label={t(s.nameKey, locale)}
              isSelected={draft.speciesId === s.id}
              isExpanded={expandedId === `2-${s.id}`}
              onToggle={() => {
                updateDraft({
                  speciesId: s.id,
                  lineageChoiceId: '',
                  humanBonusFeatId: '',
                  halfElfSkillIds: [],
                  halfElfAbilityIncreases: ['str', 'dex'],
                })
                const key = `2-${s.id}`
                setExpandedId((prev) => (prev === key ? null : key))
              }}
              source={t('term.species', locale)}
              description={fullDescription || undefined}
            />
          )
        })}
      </div>

      {speciesDef?.choices?.[0]?.options && !speciesDef.choices[0].optionsFrom && (
        <div className="space-y-3">
          <div className="border border-[#c9b89c] rounded p-3 bg-white/60">
            <FieldLabel>{t(speciesDef.choices[0].nameKey, locale)}</FieldLabel>
            <Select
              value={draft.lineageChoiceId}
              onChange={(e) => {
                const next = e.target.value
                const nextStructured = { ...draft.structuredChoices }
                if (next !== 'high') delete nextStructured['high-elf-cantrip']
                updateDraft({ lineageChoiceId: next, structuredChoices: nextStructured })
              }}
              options={[
                { value: '', label: '—' },
                ...speciesDef.choices[0].options!.map((o) => ({
                  value: o.id,
                  label: t(o.nameKey, locale),
                })),
              ]}
            />
          </div>
          {draft.lineageChoiceId === 'high' &&
            speciesDef.choices[0].options?.find((o) => o.id === 'high')?.structuredChoice && (
              <ChoiceResolver
                definition={speciesDef.choices[0].options!.find((o) => o.id === 'high')!.structuredChoice!}
                selectedIds={draft.structuredChoices['high-elf-cantrip'] ?? []}
                onSelectionChange={(ids) =>
                  updateDraft({
                    structuredChoices: { ...draft.structuredChoices, 'high-elf-cantrip': ids },
                  })
                }
                locale={locale}
                t={t}
              />
            )}
        </div>
      )}
      {draft.speciesId === 'half-elf' && (speciesDef?.choices?.length ?? 0) >= 2 && (
        <div className="space-y-3">
          <div className="border border-[#c9b89c] rounded p-3 bg-white/60">
            <FieldLabel>{t('species.halfElf.choice.skillVersatility1.name', locale)}</FieldLabel>
            <Select
              value={draft.halfElfSkillIds[0] ?? ''}
              onChange={(e) =>
                updateDraft({
                  halfElfSkillIds: [e.target.value, draft.halfElfSkillIds[1] ?? ''].filter(Boolean),
                })
              }
              options={[
                { value: '', label: '—' },
                ...SKILL_DATA.filter((s) => s.key !== draft.halfElfSkillIds[1]).map((s) => ({
                  value: s.key,
                  label: s.label,
                })),
              ]}
            />
          </div>
          <div className="border border-[#c9b89c] rounded p-3 bg-white/60">
            <FieldLabel>{t('species.halfElf.choice.skillVersatility2.name', locale)}</FieldLabel>
            <Select
              value={draft.halfElfSkillIds[1] ?? ''}
              onChange={(e) =>
                updateDraft({
                  halfElfSkillIds: [draft.halfElfSkillIds[0] ?? '', e.target.value].filter(Boolean),
                })
              }
              options={[
                { value: '', label: '—' },
                ...SKILL_DATA.filter((s) => s.key !== draft.halfElfSkillIds[0]).map((s) => ({
                  value: s.key,
                  label: s.label,
                })),
              ]}
            />
          </div>
          <div className="border border-[#c9b89c] rounded p-3 bg-white/60">
            <FieldLabel>{t('species.halfElf.choice.abilityIncreases.name', locale)}</FieldLabel>
            <p className="text-[10px] text-[#7a4b36] mb-2">
              {t('species.halfElf.choice.abilityIncreases.desc', locale)}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Select
                label={t('ui.levelUp.ability1', locale)}
                value={draft.halfElfAbilityIncreases[0]}
                onChange={(e) =>
                  updateDraft({
                    halfElfAbilityIncreases: [e.target.value as AbilityKey, draft.halfElfAbilityIncreases[1]],
                  })
                }
                options={NON_CHA_ABILITIES.filter((a) => a !== draft.halfElfAbilityIncreases[1]).map((a) => ({
                  value: a,
                  label: t(`ability.${a}`, locale),
                }))}
              />
              <Select
                label={t('ui.levelUp.ability2', locale)}
                value={draft.halfElfAbilityIncreases[1]}
                onChange={(e) =>
                  updateDraft({
                    halfElfAbilityIncreases: [draft.halfElfAbilityIncreases[0], e.target.value as AbilityKey],
                  })
                }
                options={NON_CHA_ABILITIES.filter((a) => a !== draft.halfElfAbilityIncreases[0]).map((a) => ({
                  value: a,
                  label: t(`ability.${a}`, locale),
                }))}
              />
            </div>
            <p className="text-[10px] text-[#5c3b22] mt-1">
              +2 {t('ability.cha', locale)}, +1 {t(`ability.${draft.halfElfAbilityIncreases[0]}`, locale)}, +1{' '}
              {t(`ability.${draft.halfElfAbilityIncreases[1]}`, locale)}
            </p>
          </div>
        </div>
      )}
    </div>
  )

  const renderStep3 = () => (
    <div className="grid gap-4">
      <FieldLabel>{t('ui.creation.selectBackground', locale)}</FieldLabel>
      <div className="flex flex-col gap-2 min-h-[120px] max-h-[360px] overflow-y-auto">
        {Object.values(RULESET_2024.backgrounds).map((bg) => {
          const inlineName =
            typeof bg.name === 'object' && bg.name && 'en' in bg.name && 'fr' in bg.name
              ? (bg.name as { en?: string; fr?: string })[locale] ?? (bg.name as { en?: string }).en ?? ''
              : ''
          const displayName =
            inlineName || t(bg.nameKey, locale) || bg.id
          const description =
            getDisplayName(bg as typeof backgroundDef, 'description') ||
            t(bg.descriptionKey ?? bg.nameKey, locale) ||
            ''
          const originFeatName = bg.originFeatId
            ? t(RULESET_2024.feats[bg.originFeatId]?.nameKey ?? '', locale)
            : null
          return (
            <ExpandableRow
              key={bg.id}
              id={bg.id}
              label={displayName}
              className="shrink-0"
              isSelected={draft.backgroundId === bg.id}
              isExpanded={expandedId === `3-${bg.id}`}
              onToggle={() => {
                updateDraft({
                  backgroundId: bg.id,
                  abilityMode: 'twoPlusOne',
                  abilityIncreases: [
                    { ability: (bg.abilityChoices?.[0] ?? 'str') as AbilityKey, amount: 2 },
                    { ability: (bg.abilityChoices?.[1] ?? 'dex') as AbilityKey, amount: 1 },
                  ],
                })
                const key = `3-${bg.id}`
                setExpandedId((prev) => (prev === key ? null : key))
              }}
              source={t('term.background', locale)}
              description={description}
              mechanicsTags={
                originFeatName ? [{ label: t('term.originFeat', locale), value: originFeatName }] : undefined
              }
            />
          )
        })}
      </div>

      {backgroundDef && (
        <Box className="bg-white/60">
          <div className="font-semibold text-[#7a4b36] mb-1">{t('ui.creation.loreAndMechanics', locale)}</div>
          <p className="text-xs text-[#5c3b22]">
            {getDisplayName(backgroundDef, 'description') || t(backgroundDef.descriptionKey ?? backgroundDef.nameKey, locale)}
          </p>
          <div className="mt-2 text-xs">
            <span className="text-[#7a4b36]">{t('term.originFeat', locale)}:</span>{' '}
            {backgroundDef.originFeatId && t(RULESET_2024.feats[backgroundDef.originFeatId]?.nameKey ?? '', locale)}
          </div>
        </Box>
      )}

      {backgroundDef?.structuredChoices?.map((sc) => (
        <ChoiceResolver
          key={sc.id}
          definition={sc}
          selectedIds={draft.structuredChoices[sc.id] ?? []}
          onSelectionChange={(ids) =>
            updateDraft({ structuredChoices: { ...draft.structuredChoices, [sc.id]: ids } })
          }
          locale={locale}
          t={t}
        />
      ))}

      {backgroundDef && !isHalfElf && (
        <div className="border border-[#c9b89c] rounded p-3 bg-white/60">
          <FieldLabel>{t('ui.creation.assignAbilities', locale)}</FieldLabel>
          <div className="flex gap-2 mb-2">
            {(['twoPlusOne', 'threePlusOne'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => handleAbilityModeChange(mode)}
                className={cn(
                  'px-2 py-1 rounded text-xs border',
                  draft.abilityMode === mode ? 'border-[#7a4b36] bg-[#f3e2c8]' : 'border-[#c9b89c] bg-white/60'
                )}
              >
                {t(mode === 'twoPlusOne' ? 'ui.background.abilityModeTwoPlusOne' : 'ui.background.abilityModeThreePlusOne', locale)}
              </button>
            ))}
          </div>
          <div className="grid gap-2">
            {draft.abilityIncreases.map((inc, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-xs w-8">+{inc.amount}</span>
                <Select
                  value={inc.ability}
                  onChange={(e) => handleAbilityIncreaseChange(idx, e.target.value as AbilityKey)}
                  options={(backgroundDef.abilityChoices ?? []).map((a) => ({
                    value: a,
                    label: t(`ability.${a}`, locale),
                  }))}
                />
              </div>
            ))}
          </div>
        </div>
      )}
      {backgroundDef && isHalfElf && (
        <Box className="bg-white/60">
          <p className="text-xs text-[#7a4b36]">{t('species.halfElf.asiNote', locale)}</p>
        </Box>
      )}
    </div>
  )

  const handleBaseAbilityChange = (ability: AbilityKey, value: number) => {
    updateDraft({
      baseAbilities: { ...draft.baseAbilities, [ability]: value },
    })
  }

  const abilityLabelsForLocale = useMemo(() => {
    return ABILITIES_ORDER.reduce(
      (acc, key) => {
        acc[key] = t(`ability.${key}`, locale) || ABILITY_LABELS[key]
        return acc
      },
      {} as Record<AbilityKey, string>
    )
  }, [locale])

  const renderStep4 = () => (
    <PointBuyStep
      baseAbilities={draft.baseAbilities}
      onAbilityChange={handleBaseAbilityChange}
      abilityLabels={abilityLabelsForLocale}
      locale={locale}
    />
  )

  const renderStep5 = () => (
    <div className="grid gap-4">
      {backgroundDef && (
        <Box className="bg-white/60">
          <FieldLabel>{t('ui.creation.originFeat', locale)}</FieldLabel>
          <p className="text-xs">
            {t(RULESET_2024.feats[backgroundDef.originFeatId]?.nameKey ?? '', locale)} —{' '}
            {t(RULESET_2024.feats[backgroundDef.originFeatId]?.descriptionKey ?? '', locale)}
          </p>
        </Box>
      )}
      {isHuman && (
        <div className="border border-[#c9b89c] rounded p-3 bg-white/60">
          <FieldLabel>{t('ui.creation.humanBonusFeat', locale)}</FieldLabel>
          <Select
            value={draft.humanBonusFeatId}
            onChange={(e) => updateDraft({ humanBonusFeatId: e.target.value })}
            options={[
              { value: '', label: '—' },
              ...originFeatOptions.map((f) => ({
                value: f.id,
                label: t(f.nameKey, locale),
              })),
            ]}
          />
        </div>
      )}
    </div>
  )

  const renderStep6 = () => (
    <div className="grid gap-4">
      <FieldLabel>{t('ui.creation.equipmentMode', locale)}</FieldLabel>
      <div className="flex gap-2">
        {(['gold', 'package'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => updateDraft({ equipmentMode: mode })}
            className={cn(
              'px-4 py-2 rounded text-xs border',
              draft.equipmentMode === mode ? 'border-[#7a4b36] bg-[#f3e2c8]' : 'border-[#c9b89c] bg-white/60'
            )}
          >
            {t(mode === 'gold' ? 'ui.creation.equipmentGold' : 'ui.creation.equipmentPackage', locale)}
          </button>
        ))}
      </div>
    </div>
  )

  const steps = [
    { id: 1, label: t('ui.creation.step.class', locale), render: renderStep1 },
    { id: 2, label: t('ui.creation.step.species', locale), render: renderStep2 },
    { id: 3, label: t('ui.creation.step.background', locale), render: renderStep3 },
    { id: 4, label: t('ui.creation.abilityScores', locale), render: renderStep4 },
    { id: 5, label: t('ui.creation.step.feats', locale), render: renderStep5 },
    { id: 6, label: t('ui.creation.step.equipment', locale), render: renderStep6 },
  ]

  const content = (
      <div key={resetKeyRef.current} className="grid gap-4 text-xs text-[#5c3b22]">
        <div className="flex flex-wrap gap-2 border-b border-[#c9b89c] pb-2">
          {steps.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStep(s.id)}
              className={cn(
                'px-2 py-1 rounded text-xs',
                step === s.id ? 'bg-[#7a4b36] text-white' : 'bg-white/60 text-[#5c3b22] hover:bg-white/80'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        {steps.find((s) => s.id === step)?.render?.()}

        <div className="flex justify-between gap-2 pt-4 border-t border-[#c9b89c]">
          <div className="flex gap-2">
            <Button variant="small" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step <= 1}>
              {t('ui.creation.back', locale)}
            </Button>
            <Button variant="small" onClick={resetWizard}>
              {t('ui.creation.reset', locale)}
            </Button>
          </div>
          <div className="flex gap-2">
            {step < 6 ? (
              <Button
                variant="small"
                onClick={() => setStep((s) => Math.min(6, s + 1))}
                disabled={!canProceed}
              >
                {t('ui.creation.next', locale)}
              </Button>
            ) : (
              <Button variant="small" onClick={handleFinish} disabled={!canProceed}>
                {t('ui.creation.finish', locale)}
              </Button>
            )}
          </div>
        </div>
      </div>
  )

  if (asPage) {
    return (
      <div className="min-h-screen min-w-full py-6 px-4 sm:px-6 lg:px-8 bg-gray-200">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-[#7a4b36] hover:text-[#5c3b22] mb-4 flex items-center gap-1"
            >
              ← {t('ui.creation.cancel', locale) || 'Cancel'}
            </button>
            <h1 className="font-display text-2xl uppercase text-[#5c3b22]">
              {t('ui.creation.title', locale)}
            </h1>
            <p className="text-sm text-[#7a4b36] mt-1">
              {t('ui.creation.subtitle', locale) || 'Create your D&D 2024 character step by step.'}
            </p>
          </div>
          <div className="border border-[#c9b89c] bg-white/90 rounded-lg p-6 sm:p-8 shadow-sm">
            {content}
          </div>
        </div>
      </div>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('ui.creation.title', locale)}>
      {content}
    </Modal>
  )
}
