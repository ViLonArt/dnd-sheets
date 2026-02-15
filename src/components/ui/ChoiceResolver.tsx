import { useMemo, useState } from 'react'
import type { Spell } from '@/types/character'
import type { StructuredChoiceDefinition } from '@/utils/advancementTypes'
import { getFilteredSpells, searchSrdSpells } from '@/utils/spellSearch'
import type { SpellLocale } from '@/utils/spellLocale'
import { SKILL_DATA } from '@/features/character-sheet/constants'
import { FilterableList } from './FilterableList'
import { FieldLabel } from './FieldLabel'
import { TextInput } from './TextInput'
import { cn } from '@/utils/cn'

export type ChoiceResolverProps = {
  definition: StructuredChoiceDefinition
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
  locale: SpellLocale
  /** Existing IDs to exclude (e.g. proficiencies character already has) */
  excludeIds?: string[]
  /** Translation function */
  t: (key: string, locale: 'en' | 'fr') => string
  className?: string
}

export function ChoiceResolver({
  definition,
  selectedIds,
  onSelectionChange,
  locale,
  excludeIds = [],
  t,
  className,
}: ChoiceResolverProps) {
  const [spellSearchQuery, setSpellSearchQuery] = useState('')

  const switchContent = useMemo(() => {
    const excludeSet = new Set(excludeIds)

    if (definition.choiceType === 'spell') {
      const filters = definition.filters
      const level = filters?.spellLevel
      const maxSpellLevel = filters?.maxSpellLevel
      const school = filters?.spellSchool
      const spellLocale: SpellLocale = locale === 'fr' ? 'fr' : 'en'
      const useBardList = definition.sourcePool === 'spellsBard'

      let spells: Spell[]
      if (useBardList) {
        spells = getFilteredSpells({
          level,
          maxSpellLevel,
          school,
          locale: spellLocale,
          limit: 200,
          source: 'bard',
        })
        const q = spellSearchQuery.trim().toLowerCase()
        if (q) {
          spells = spells.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 50)
        }
      } else {
        spells = spellSearchQuery.trim()
          ? searchSrdSpells(spellSearchQuery, {
              level,
              maxSpellLevel,
              school,
              locale: spellLocale,
              limit: 40,
            }).map((r) => r.spell)
          : getFilteredSpells({
              level,
              maxSpellLevel,
              school,
              locale: spellLocale,
              limit: 200,
            })
      }

      const items = spells
        .filter((s) => !excludeSet.has(s.id))
        .map((s) => ({
          id: s.id,
          label: s.name,
          description: s.description ? `${s.school ?? ''} · ${s.level}` : undefined,
          meta: { level: s.level, school: s.school } as Record<string, unknown>,
        }))

      const maxSelections = definition.quantity

      return (
        <div className="space-y-2">
          {items.length > 50 && (
            <TextInput
              placeholder={t('ui.spellSearch', locale) || 'Search spells...'}
              value={spellSearchQuery}
              onChange={(e) => setSpellSearchQuery(e.target.value)}
              className="w-full text-xs"
            />
          )}
          <FilterableList
            items={items}
            selectedIds={selectedIds}
            onSelectionChange={onSelectionChange}
            maxSelections={maxSelections}
            selectionLabel={t('choice.selectCount', locale)?.replace('{n}', String(maxSelections)) || `Select ${selectedIds.length}/${maxSelections}`}
          />
        </div>
      )
    }

    if (definition.choiceType === 'skillProficiency') {
      const pool = definition.filters?.skillPool
      const skills = pool?.length
        ? SKILL_DATA.filter((s) => pool.includes(s.key))
        : SKILL_DATA
      const available = skills.filter((s) => !excludeSet.has(s.key))

      const items = available.map((s) => ({
        id: s.key,
        label: s.label,
        description: undefined,
      }))

      return (
        <FilterableList
          items={items}
          selectedIds={selectedIds}
          onSelectionChange={onSelectionChange}
          maxSelections={definition.quantity}
          selectionLabel={`Select ${selectedIds.length}/${definition.quantity}`}
        />
      )
    }

    if (definition.choiceType === 'weaponProficiency') {
      // TODO: Load from ruleset.weaponMastery.weapons when wired
      return (
        <p className="text-xs text-amber-700">
          {t('choice.weaponProficiencyNotImplemented', locale) || 'Weapon proficiency choice not yet implemented.'}
        </p>
      )
    }

    if (definition.choiceType === 'toolProficiency') {
      return (
        <p className="text-xs text-amber-700">
          {t('choice.toolProficiencyNotImplemented', locale) || 'Tool proficiency choice not yet implemented.'}
        </p>
      )
    }

    if (definition.choiceType === 'weaponMastery') {
      return (
        <p className="text-xs text-amber-700">
          {t('choice.weaponMasteryNotImplemented', locale) || 'Weapon mastery choice not yet implemented.'}
        </p>
      )
    }

    return (
      <p className="text-xs text-amber-700">
        {t('choice.unknownType', locale) || `Unknown choice type: ${definition.choiceType}`}
      </p>
    )
  }, [
    definition.choiceType,
    definition.quantity,
    definition.filters,
    selectedIds,
    excludeIds,
    spellSearchQuery,
    locale,
    t,
  ])

  return (
    <div className={cn('border border-[#c9b89c] rounded p-3 bg-white/60', className)}>
      <FieldLabel>{t(definition.nameKey, locale)}</FieldLabel>
      {switchContent}
    </div>
  )
}
