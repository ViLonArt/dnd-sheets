import { useMemo, useState } from 'react'
import { CLASSES_2024 } from '@/data/classTables2024'
import type { Spell, SpellSlots, SpellcastingAttribute } from '@/types/character'
import {
  AutoResizeTextarea,
  Box,
  Button,
  FieldLabel,
  PaperContainer,
  Row,
  SectionHeader,
  Select,
} from '@/components/ui'

type PcClassTabProps = {
  className: string
  subclass?: string
  level: number
  spellSlots: SpellSlots
  spells: Spell[]
  spellcastingAttribute: SpellcastingAttribute
  spellDC: number | string
  spellAttackBonus: number | string
  currentMaxSlots: Record<number, number>
  onSpellcastingAttributeChange: (value: SpellcastingAttribute) => void
  onUpdateSpellSlot: (level: number, field: 'total' | 'used', value: number) => void
  onAddSpell: (level: number) => void
  onUpdateSpell: (index: number, updates: Partial<Spell>) => void
  onRemoveSpell: (index: number) => void
}

const SUBCLASS_CASTERS = new Set([
  'Escroc Arcanique',
  'Filou Arcanique',
  'Chevalier Occulte',
  'Arcane Trickster',
  'Eldritch Knight',
])

export function PcClassTab({
  className,
  subclass,
  level,
  spellSlots,
  spells,
  spellcastingAttribute,
  spellDC,
  spellAttackBonus,
  currentMaxSlots,
  onSpellcastingAttributeChange,
  onUpdateSpellSlot,
  onAddSpell,
  onUpdateSpell,
  onRemoveSpell,
}: PcClassTabProps) {
  const [allowSlotOverrides, setAllowSlotOverrides] = useState(false)
  const [editingSpellIndex, setEditingSpellIndex] = useState<number | null>(null)
  const [spellEditSnapshot, setSpellEditSnapshot] = useState<{ index: number; spell: Spell } | null>(
    null
  )
  const [newSpellIndex, setNewSpellIndex] = useState<number | null>(null)
  const [expandedSpellDescriptionIndex, setExpandedSpellDescriptionIndex] = useState<number | null>(
    null
  )

  const classData = CLASSES_2024[className]
  const levelIndex = Math.max(1, Math.min(20, level)) - 1
  const levelData = classData?.levels[levelIndex]

  const isPactMagic = classData?.spellcasting === 'pact'
  const isMonk = className === 'Moine'
  const isSubclassCaster = subclass ? SUBCLASS_CASTERS.has(subclass) : false
  const isStandardCaster =
    classData?.spellcasting === 'full' || classData?.spellcasting === 'half' || isSubclassCaster
  const isNonCaster = !isStandardCaster && !isPactMagic && !isMonk

  const showSpellcastingPanel = isStandardCaster || isPactMagic

  const spellAttackDisplay =
    spellAttackBonus === '' || spellAttackBonus === null || spellAttackBonus === undefined
      ? '—'
      : typeof spellAttackBonus === 'number'
        ? spellAttackBonus >= 0
          ? `+${spellAttackBonus}`
          : `${spellAttackBonus}`
        : spellAttackBonus

  const renderSpellValue = (value: string) => (
    <span className="whitespace-nowrap">{value || '—'}</span>
  )

  const renderSpellHeader = () => (
    <div className="grid grid-cols-[2fr_1.2fr_1.2fr_1.2fr_1.2fr_1.2fr_0.9fr_1fr_0.6fr_1fr] items-center gap-3 text-[9px] uppercase text-[#7a4b36] mb-1">
      <span className="font-semibold">Nom</span>
      <span>École</span>
      <span>Type</span>
      <span>Portée</span>
      <span>Durée</span>
      <span>Composants</span>
      <span>Dé</span>
      <span>Jet de sauv.</span>
      <span>C/R</span>
      <span className="text-right">Actions</span>
    </div>
  )

  const renderSpellRow = (spell: Spell, globalIdx: number) => {
    const isEditing = editingSpellIndex === globalIdx
    const showDescription = expandedSpellDescriptionIndex === globalIdx
    const crTokens = [
      spell.concentration ? 'C' : null,
      spell.ritual ? 'R' : null,
    ].filter(Boolean)
    const abilityLabels: Record<string, string> = {
      STR: 'FOR',
      DEX: 'DEX',
      CON: 'CON',
      INT: 'INT',
      WIS: 'SAG',
      CHA: 'CHA',
    }
    const schoolOptions = [
      'Abjuration',
      'Conjuration',
      'Divination',
      'Enchantement',
      'Évocation',
      'Illusion',
      'Nécromancie',
      'Transmutation',
    ]
    const actionTypeOptions = [
      { value: 'Action', label: 'Action' },
      { value: 'Action bonus', label: 'Action bonus' },
      { value: 'custom', label: 'Personnalisé' },
    ]
    const currentActionType =
      spell.type === 'Action' || spell.type === 'Action bonus' ? spell.type : 'custom'
    const saveThrowValue = spell.saveThrow
      ? abilityLabels[spell.saveThrowAbility ?? 'STR'] ?? 'STR'
      : ''

    return (
      <div key={globalIdx} className="border border-[#c9b89c] bg-white/40 p-1.5 mb-1">
        {isEditing ? (
          <>
            <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-1 items-start">
              <Box>
                <input
                  type="text"
                  value={spell.name}
                  onChange={(e) => onUpdateSpell(globalIdx, { name: e.target.value })}
                  className="w-full bg-transparent border-none outline-none font-bold text-base leading-tight"
                  placeholder="Nom"
                />
              </Box>
              <Box>
                <Select
                  label="École"
                  value={spell.school}
                  onChange={(e) => onUpdateSpell(globalIdx, { school: e.target.value })}
                  options={[
                    { value: '', label: '—' },
                    ...schoolOptions.map((option) => ({ value: option, label: option })),
                  ]}
                />
              </Box>
              <Button variant="small" onClick={() => onRemoveSpell(globalIdx)}>
                ×
              </Button>
            </div>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <Select
                  label="Type d'action"
                  value={currentActionType}
                  onChange={(e) =>
                    onUpdateSpell(globalIdx, {
                      type: e.target.value === 'custom' ? '' : e.target.value,
                    })
                  }
                  options={actionTypeOptions}
                />
              </div>
              {currentActionType === 'custom' && (
                <div className="flex flex-col gap-1">
                  <FieldLabel>Temps d'action</FieldLabel>
                  <input
                    type="text"
                    value={spell.type}
                    onChange={(e) => onUpdateSpell(globalIdx, { type: e.target.value })}
                    className="w-full bg-transparent border border-[#bda68a] rounded px-1 py-0.5 text-xs"
                    placeholder="ex: 1 minute"
                  />
                </div>
              )}
              <div className="flex flex-col gap-1">
                <FieldLabel>Portée</FieldLabel>
                <input
                  type="text"
                  value={spell.range}
                  onChange={(e) => onUpdateSpell(globalIdx, { range: e.target.value })}
                  className="w-full bg-transparent border border-[#bda68a] rounded px-1 py-0.5 text-xs"
                  placeholder="Portée"
                />
              </div>
              <div className="flex flex-col gap-1">
                <FieldLabel>Durée</FieldLabel>
                <input
                  type="text"
                  value={spell.duration}
                  onChange={(e) => onUpdateSpell(globalIdx, { duration: e.target.value })}
                  className="w-full bg-transparent border border-[#bda68a] rounded px-1 py-0.5 text-xs"
                  placeholder="Durée"
                />
              </div>
              <div className="flex flex-col gap-1">
                <FieldLabel>Composants</FieldLabel>
                <input
                  type="text"
                  value={spell.components}
                  onChange={(e) => onUpdateSpell(globalIdx, { components: e.target.value })}
                  className="w-full bg-transparent border border-[#bda68a] rounded px-1 py-0.5 text-xs"
                  placeholder="V, S, M"
                />
              </div>
              <div className="flex flex-col gap-1">
                <FieldLabel>Dice</FieldLabel>
                <input
                  type="text"
                  value={spell.dice ?? ''}
                  onChange={(e) => onUpdateSpell(globalIdx, { dice: e.target.value })}
                  className="w-full bg-transparent border border-[#bda68a] rounded px-1 py-0.5 text-xs"
                  placeholder="ex: 2d6"
                />
              </div>
            </div>
            <div className="mt-1 flex items-center gap-3 text-[10px]">
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={spell.concentration ?? false}
                  onChange={(e) => onUpdateSpell(globalIdx, { concentration: e.target.checked })}
                  className="w-3 h-3"
                />
                <span>Concentration</span>
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={spell.ritual ?? false}
                  onChange={(e) => onUpdateSpell(globalIdx, { ritual: e.target.checked })}
                  className="w-3 h-3"
                />
                <span>Rituel</span>
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={spell.saveThrow ?? false}
                  onChange={(e) =>
                    onUpdateSpell(globalIdx, {
                      saveThrow: e.target.checked,
                      saveThrowAbility: e.target.checked
                        ? spell.saveThrowAbility ?? 'STR'
                        : spell.saveThrowAbility,
                    })
                  }
                  className="w-3 h-3"
                />
                <span>Jet de sauvegarde</span>
              </label>
              {spell.saveThrow && (
                <Select
                  label="Caractéristique"
                  value={spell.saveThrowAbility ?? 'STR'}
                  onChange={(e) =>
                    onUpdateSpell(globalIdx, {
                      saveThrowAbility: e.target.value as Spell['saveThrowAbility'],
                    })
                  }
                  options={[
                    { value: 'STR', label: 'FOR' },
                    { value: 'DEX', label: 'DEX' },
                    { value: 'CON', label: 'CON' },
                    { value: 'INT', label: 'INT' },
                    { value: 'WIS', label: 'SAG' },
                    { value: 'CHA', label: 'CHA' },
                  ]}
                />
              )}
            </div>
            <div className="mt-1">
              <FieldLabel>Description</FieldLabel>
              <AutoResizeTextarea
                value={spell.description ?? ''}
                onChange={(e) => onUpdateSpell(globalIdx, { description: e.target.value })}
                className="w-full bg-transparent border border-[#bda68a] rounded px-1 py-0.5 text-xs"
                placeholder="Description"
              />
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-[2fr_1.2fr_1.2fr_1.2fr_1.2fr_1.2fr_0.9fr_1fr_0.6fr_1fr] items-center gap-3 text-[10px]">
              <span className="font-bold text-sm truncate">{spell.name || '—'}</span>
              {renderSpellValue(spell.school)}
              {renderSpellValue(spell.type)}
              {renderSpellValue(spell.range)}
              {renderSpellValue(spell.duration)}
              {renderSpellValue(spell.components)}
              {renderSpellValue(spell.dice ?? '')}
              {renderSpellValue(saveThrowValue)}
              {renderSpellValue(crTokens.join(', '))}
              <span className="flex justify-end items-center gap-2">
                <Button
                  variant="small"
                  onClick={() => {
                    if (editingSpellIndex === null) {
                      setSpellEditSnapshot({ index: globalIdx, spell })
                      setEditingSpellIndex(globalIdx)
                    }
                  }}
                  disabled={editingSpellIndex !== null}
                >
                  Edit
                </Button>
                <Button variant="small" onClick={() => onRemoveSpell(globalIdx)}>
                  ×
                </Button>
              </span>
            </div>
            <div className="mt-1">
              {spell.description ? (
                <button
                  type="button"
                  onClick={() =>
                    setExpandedSpellDescriptionIndex(showDescription ? null : globalIdx)
                  }
                  className="px-1 py-0.5 border border-[#bda68a] rounded text-[10px]"
                >
                  Description
                </button>
              ) : (
                <span className="text-[10px] text-[#7a4b36]">—</span>
              )}
            </div>
            {spell.description && showDescription && (
              <div className="mt-1 text-[10px] whitespace-pre-wrap">{spell.description}</div>
            )}
          </>
        )}
      </div>
    )
  }

  const spellsByLevel = useMemo(() => {
    const grouped: Record<number, Spell[]> = {}
    for (let i = 0; i <= 9; i += 1) {
      grouped[i] = spells.filter((s) => String(s.level) === String(i))
    }
    return grouped
  }, [spells])

  const pactSlotLevel = useMemo(() => {
    const slots = levelData?.slots
    if (!slots) return 0
    let detected = 0
    slots.forEach((value, index) => {
      if (value > 0) detected = index
    })
    return detected
  }, [levelData])

  const pactMaxSlots = pactSlotLevel ? currentMaxSlots[pactSlotLevel] ?? 0 : 0
  const pactUsedSlots = pactSlotLevel
    ? Math.min(spellSlots[pactSlotLevel]?.used || 0, pactMaxSlots)
    : 0

  const resourceTotal = levelData?.resourceCount ?? 0
  const monkResourceLabel = 'Points de Ki / Focalisation'

  return (
    <PaperContainer>
      {isNonCaster && (
        <div className="mb-3 border border-[#c9b89c] p-3 bg-white/40 text-xs text-[#5c3b22]">
          Pas de sorts pour cette classe (sauf via dons, multiclassing, etc.).
        </div>
      )}

      {isMonk && (
        <div className="mb-3 border border-[#c9b89c] p-4 bg-white/40 text-center">
          <SectionHeader as="h4" className="text-base">
            {monkResourceLabel}
          </SectionHeader>
          <div className="mt-2 text-lg font-semibold">
            {resourceTotal}/{resourceTotal}
          </div>
        </div>
      )}

      {showSpellcastingPanel && (
        <Row className="mb-2.5">
          <div className="min-w-[180px]">
            <Select
              label="Stat. d'incantation"
              value={spellcastingAttribute}
              onChange={(e) => onSpellcastingAttributeChange(e.target.value as SpellcastingAttribute)}
              options={[
                { value: 'None', label: 'Aucune' },
                { value: 'INT', label: 'Intelligence' },
                { value: 'WIS', label: 'Sagesse' },
                { value: 'CHA', label: 'Charisme' },
              ]}
            />
          </div>
          <div className="min-w-[140px]">
            <div className="flex flex-col gap-1">
              <FieldLabel>DD du sort</FieldLabel>
              <Box className="bg-white/60">{spellDC ? spellDC : '—'}</Box>
            </div>
          </div>
          <div className="min-w-[160px]">
            <div className="flex flex-col gap-1">
              <FieldLabel>Bonus d'attaque</FieldLabel>
              <Box className="bg-white/60">
                {spellAttackDisplay}
              </Box>
            </div>
          </div>
        </Row>
      )}

      {isPactMagic && (
        <div className="mb-3 border border-[#c9b89c] p-2 bg-white/40">
          <div className="flex items-center justify-between">
            <SectionHeader as="h4" className="text-sm">
              Magie de Pacte
            </SectionHeader>
            <div className="text-xs text-[#5c3b22]">
              Niveau d'emplacement: {pactSlotLevel || '—'}
            </div>
          </div>
          <div className="flex gap-1 items-center mt-1.5 text-xs">
            <span>Nombre d'utilisation: </span>
            <Button
              variant="small"
              onClick={() =>
                onUpdateSpellSlot(
                  pactSlotLevel,
                  'used',
                  Math.max(0, pactUsedSlots - 1)
                )
              }
              disabled={!pactSlotLevel}
            >
              -
            </Button>
            <span className="min-w-[20px] text-center">{pactUsedSlots}</span>
            <Button
              variant="small"
              onClick={() =>
                onUpdateSpellSlot(
                  pactSlotLevel,
                  'used',
                  Math.min(pactMaxSlots, pactUsedSlots + 1)
                )
              }
              disabled={!pactSlotLevel}
            >
              +
            </Button>
            <span> / </span>
            <span className="min-w-[24px] text-center">{pactMaxSlots}</span>
          </div>
        </div>
      )}

      {isStandardCaster && (
        <div className="mb-2.5 flex items-center justify-between">
          <FieldLabel>Emplacements par niveau</FieldLabel>
          <Button
            variant="small"
            onClick={() => setAllowSlotOverrides((prev) => !prev)}
          >
            {allowSlotOverrides ? 'Verrouiller' : 'Edit'}
          </Button>
        </div>
      )}

      {isStandardCaster && (
        <div className="mt-2">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((slotLevel) => {
            const maxSlotsForLevel = currentMaxSlots[slotLevel] ?? 0
            const usedSlots = Math.min(spellSlots[slotLevel]?.used || 0, maxSlotsForLevel)

            return (
              <div
                key={slotLevel}
                className="mb-3 border border-[#c9b89c] p-2 bg-white/40"
              >
                <SectionHeader as="h4" className="text-sm mb-1.5">
                  {slotLevel === 0
                    ? 'Niveau 0 (Tour de magie / Cantrips)'
                    : `Niveau ${slotLevel}`}
                </SectionHeader>

                {slotLevel >= 1 && (
                  <div className="flex gap-1 items-center mb-1.5 text-xs">
                    <span>Nombre d'utilisation: </span>
                    <Button
                      variant="small"
                      onClick={() =>
                        onUpdateSpellSlot(slotLevel, 'used', Math.max(0, usedSlots - 1))
                      }
                    >
                      -
                    </Button>
                    <span className="min-w-[20px] text-center">{usedSlots}</span>
                    <Button
                      variant="small"
                      onClick={() =>
                        onUpdateSpellSlot(
                          slotLevel,
                          'used',
                          Math.min(maxSlotsForLevel, usedSlots + 1)
                        )
                      }
                    >
                      +
                    </Button>
                    <span> / </span>
                    {allowSlotOverrides ? (
                      <input
                        type="number"
                        min="0"
                        value={maxSlotsForLevel}
                        onChange={(e) =>
                          onUpdateSpellSlot(slotLevel, 'total', parseInt(e.target.value) || 0)
                        }
                        className="w-[50px] px-1 py-1 border border-[#bda68a] bg-transparent text-xs"
                      />
                    ) : (
                      <span className="min-w-[24px] text-center">{maxSlotsForLevel}</span>
                    )}
                  </div>
                )}

                <div className="border border-[#c9b89c] bg-white/40 p-1.5 text-[11px]">
                  {renderSpellHeader()}
                  {(spellsByLevel[slotLevel] || []).map((spell) => {
                    const globalIdx = spells.findIndex((s) => s === spell)
                    return renderSpellRow(spell, globalIdx)
                  })}
                </div>

                <div className="mt-1 flex items-center gap-2">
                  <Button
                    variant="small"
                    onClick={() => {
                      if (editingSpellIndex !== null) {
                        setEditingSpellIndex(null)
                        setNewSpellIndex(null)
                        setSpellEditSnapshot(null)
                        return
                      }
                      const nextIndex = spells.length
                      onAddSpell(slotLevel)
                      setEditingSpellIndex(nextIndex)
                      setNewSpellIndex(nextIndex)
                    }}
                  >
                    {editingSpellIndex !== null ? 'Confirmer sort' : '+ Ajouter sort'}
                  </Button>
                  {editingSpellIndex !== null && (
                    <Button
                      variant="small"
                      onClick={() => {
                        if (newSpellIndex !== null && newSpellIndex === editingSpellIndex) {
                          onRemoveSpell(editingSpellIndex)
                        } else if (
                          spellEditSnapshot &&
                          spellEditSnapshot.index === editingSpellIndex
                        ) {
                          onUpdateSpell(editingSpellIndex, spellEditSnapshot.spell)
                        }
                        setEditingSpellIndex(null)
                        setNewSpellIndex(null)
                        setSpellEditSnapshot(null)
                      }}
                    >
                      Annuler
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!isStandardCaster && (
        <div className="mt-2">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((slotLevel) => (
            <div
              key={slotLevel}
              className="mb-3 border border-[#c9b89c] p-2 bg-white/40"
            >
              <SectionHeader as="h4" className="text-sm mb-1.5">
                {slotLevel === 0
                  ? 'Niveau 0 (Tour de magie / Cantrips)'
                  : `Niveau ${slotLevel}`}
              </SectionHeader>
              <div className="border border-[#c9b89c] bg-white/40 p-1.5 text-[11px]">
                {renderSpellHeader()}
                {(spellsByLevel[slotLevel] || []).map((spell) => {
                  const globalIdx = spells.findIndex((s) => s === spell)
                  return renderSpellRow(spell, globalIdx)
                })}
              </div>
              <div className="mt-1 flex items-center gap-2">
                <Button
                  variant="small"
                  onClick={() => {
                    if (editingSpellIndex !== null) {
                      setEditingSpellIndex(null)
                      setNewSpellIndex(null)
                      setSpellEditSnapshot(null)
                      return
                    }
                    const nextIndex = spells.length
                    onAddSpell(slotLevel)
                    setEditingSpellIndex(nextIndex)
                    setNewSpellIndex(nextIndex)
                  }}
                >
                  {editingSpellIndex !== null ? 'Confirmer sort' : '+ Ajouter sort'}
                </Button>
                {editingSpellIndex !== null && (
                  <Button
                    variant="small"
                    onClick={() => {
                      if (newSpellIndex !== null && newSpellIndex === editingSpellIndex) {
                        onRemoveSpell(editingSpellIndex)
                      } else if (
                        spellEditSnapshot &&
                        spellEditSnapshot.index === editingSpellIndex
                      ) {
                        onUpdateSpell(editingSpellIndex, spellEditSnapshot.spell)
                      }
                      setEditingSpellIndex(null)
                      setNewSpellIndex(null)
                      setSpellEditSnapshot(null)
                    }}
                  >
                    Annuler
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </PaperContainer>
  )
}
