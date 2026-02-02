import { useDeferredValue, useMemo, useState } from 'react'
import type { DragEvent } from 'react'
import { CLASSES_2024 } from '@/data/classTables2024'
import type { Spell, SpellSlots, SpellcastingAttribute } from '@/types/character'
import { useDragPreview, useOutsideClick } from '@/hooks'
import { searchSrdSpells } from '@/utils/spellSearch'
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
  onAddSpell: (level: number, template?: Partial<Spell>) => string
  onUpdateSpell: (index: number, updates: Partial<Spell>) => void
  onRemoveSpell: (index: number) => void
  onReorderSpells: (fromIndex: number, toIndex: number) => void
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
  onReorderSpells,
}: PcClassTabProps) {
  const [allowSlotOverrides, setAllowSlotOverrides] = useState(false)
  const [editingSpellId, setEditingSpellId] = useState<string | null>(null)
  const [spellEditSnapshot, setSpellEditSnapshot] = useState<{ id: string; spell: Spell } | null>(
    null
  )
  const [newSpellId, setNewSpellId] = useState<string | null>(null)
  const [openSpellMenuId, setOpenSpellMenuId] = useState<string | null>(null)
  const [expandedSpellDescriptionIndices, setExpandedSpellDescriptionIndices] = useState<
    Set<number>
  >(() => new Set())
  const [draggingSpellIndex, setDraggingSpellIndex] = useState<number | null>(null)
  const [dragOverSpellIndex, setDragOverSpellIndex] = useState<number | null>(null)
  const [dragOverSpellEdge, setDragOverSpellEdge] = useState<'top' | 'bottom' | null>(null)
  const [spellSearchQueries, setSpellSearchQueries] = useState<Record<string, string>>({})
  const deferredSpellSearchQueries = useDeferredValue(spellSearchQueries)
  const { setDragPreview, clearDragPreview } = useDragPreview()

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

  const parseNumber = (value: string) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  const formatSigned = (value: number) => (value >= 0 ? `+${value}` : `${value}`)

  const resetSpellDragState = () => {
    setDraggingSpellIndex(null)
    setDragOverSpellIndex(null)
    setDragOverSpellEdge(null)
    clearDragPreview()
  }

  const handleSpellDragStart = (index: number) => (event: DragEvent<HTMLElement>) => {
    if (editingSpellId !== null) return
    setDraggingSpellIndex(index)
    setDragOverSpellIndex(null)
    setDragOverSpellEdge(null)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', spells[index]?.id ?? String(index))
    const previewTarget = event.currentTarget.closest('[data-drag-preview]') as HTMLElement | null
    setDragPreview(event, previewTarget)
  }

  const handleSpellDragOver = (index: number) => (event: DragEvent<HTMLElement>) => {
    if (draggingSpellIndex === null || draggingSpellIndex === index) return
    event.preventDefault()
    const rect = event.currentTarget.getBoundingClientRect()
    const isTop = event.clientY - rect.top < rect.height / 2
    setDragOverSpellIndex(index)
    setDragOverSpellEdge(isTop ? 'top' : 'bottom')
    event.dataTransfer.dropEffect = 'move'
  }

  const handleSpellDrop = (index: number) => (event: DragEvent<HTMLElement>) => {
    event.preventDefault()
    if (draggingSpellIndex === null || draggingSpellIndex === index) {
      resetSpellDragState()
      return
    }
    const fromSpell = spells[draggingSpellIndex]
    const targetSpell = spells[index]
    if (!fromSpell || !targetSpell) {
      resetSpellDragState()
      return
    }
    if (String(fromSpell.level) !== String(targetSpell.level)) {
      resetSpellDragState()
      return
    }
    const insertIndex = dragOverSpellEdge === 'bottom' ? index + 1 : index
    onReorderSpells(draggingSpellIndex, insertIndex)
    resetSpellDragState()
  }

  const getSpellValueDisplay = (spell: Spell) => {
    if (spell.diceMode === 'custom') {
      return spell.diceCustom ?? ''
    }
    if (!spell.diceDie) {
      return spell.dice ?? ''
    }
    const count = Math.max(1, spell.diceCount || 1)
    const mod = parseNumber(spell.diceMod ?? '')
    return `${count}${spell.diceDie}${formatSigned(mod)}`
  }

  const formatSpellDamageValue = (spell: Spell) => {
    const base = getSpellValueDisplay(spell)
    if (!base) return ''
    return spell.damageType ? `${base} ${spell.damageType}` : base
  }

  const setSpellSearchQuery = (key: string, value: string) => {
    setSpellSearchQueries((prev) => ({ ...prev, [key]: value }))
  }

  const clearSpellSearchQuery = (key: string) => {
    setSpellSearchQueries((prev) => ({ ...prev, [key]: '' }))
  }

  const addSpellFromTemplate = (template: Spell, fallbackLevel: number, searchKey: string) => {
    const parsedLevel =
      typeof template.level === 'number' ? template.level : Number(template.level)
    const resolvedLevel = Number.isNaN(parsedLevel) ? fallbackLevel : parsedLevel
    const id = onAddSpell(resolvedLevel, template)
    setEditingSpellId(id)
    setNewSpellId(id)
    setSpellEditSnapshot(null)
    clearSpellSearchQuery(searchKey)
  }

  const addCustomSpell = (level: number, searchKey: string) => {
    const id = onAddSpell(level)
    setEditingSpellId(id)
    setNewSpellId(id)
    setSpellEditSnapshot(null)
    clearSpellSearchQuery(searchKey)
  }

  const renderSpellSearch = ({
    searchKey,
    levelFilter,
    excludeCantrips = false,
  }: {
    searchKey: string
    levelFilter?: number
    excludeCantrips?: boolean
  }) => {
    const rawQuery = spellSearchQueries[searchKey] ?? ''
    const deferredQuery = deferredSpellSearchQueries[searchKey] ?? ''
    const baseResults = deferredQuery
      ? searchSrdSpells(deferredQuery, {
          level: levelFilter,
          limit: levelFilter === undefined ? 20 : 10,
        })
      : []
    const filteredResults = excludeCantrips
      ? baseResults.filter((result) => String(result.spell.level) !== '0')
      : baseResults
    const results = filteredResults.slice(0, 8)
    const isDisabled = editingSpellId !== null
    const fallbackLevel = levelFilter ?? 1

    return (
      <div className="mt-1 flex flex-col gap-2">
        <input
          type="text"
          value={rawQuery}
          onChange={(e) => setSpellSearchQuery(searchKey, e.target.value)}
          disabled={isDisabled}
          className="w-full bg-transparent border border-[#bda68a] rounded px-2 py-1 text-xs"
          placeholder="Rechercher un sort SRD..."
        />
        {rawQuery.trim() && (
          <div className="border border-[#c9b89c] bg-white/60 rounded text-xs">
            {results.length === 0 ? (
              <div className="px-2 py-1 text-[11px] text-[#7a4b36]">Aucun résultat</div>
            ) : (
              results.map((result) => {
                const spellLevel =
                  typeof result.spell.level === 'number'
                    ? result.spell.level
                    : Number(result.spell.level)
                const levelLabel =
                  Number.isNaN(spellLevel) || spellLevel === 0
                    ? 'Tour de magie'
                    : `Niv. ${spellLevel}`
                return (
                  <button
                    key={result.spell.id}
                    type="button"
                    onClick={() => addSpellFromTemplate(result.spell, fallbackLevel, searchKey)}
                    disabled={isDisabled}
                    className="w-full text-left px-2 py-1 border-b border-[#eadfcf] last:border-b-0 hover:bg-[#f6efe4]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[11px]">{result.spell.name}</span>
                      <span className="text-[9px] text-[#7a4b36]">{levelLabel}</span>
                    </div>
                    <div className="text-[9px] text-[#7a4b36]">
                      {result.spell.school}
                      {result.spell.type ? ` • ${result.spell.type}` : ''}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        )}
        <Button
          variant="small"
          onClick={() => addCustomSpell(fallbackLevel, searchKey)}
          disabled={isDisabled}
        >
          + Ajouter sort perso
        </Button>
      </div>
    )
  }

  useOutsideClick({
    isActive: Boolean(openSpellMenuId),
    onOutsideClick: () => setOpenSpellMenuId(null),
    ignoreSelector: '[data-spell-menu]',
  })

  const renderSpellHeader = (includeLevel: boolean) => (
    <div
      className={`grid items-center gap-3 text-[9px] uppercase text-[#7a4b36] mb-1 ${
        includeLevel
          ? 'grid-cols-[2fr_0.6fr_1.2fr_1.2fr_1.2fr_1.2fr_1.2fr_0.9fr_1fr_0.6fr_0.6fr_1fr]'
          : 'grid-cols-[2fr_1.2fr_1.2fr_1.2fr_1.2fr_1.2fr_0.9fr_1fr_0.6fr_0.6fr_1fr]'
      }`}
    >
      <span className="font-semibold">Nom</span>
      {includeLevel && <span>Niv.</span>}
      <span>École</span>
      <span>Type</span>
      <span>Portée</span>
      <span>Durée</span>
      <span>Composants</span>
      <span>Valeur</span>
      <span>Jet de sauv.</span>
      <span>C/R</span>
      <span>Prépa.</span>
      <span className="text-right" aria-hidden="true">
        &nbsp;
      </span>
    </div>
  )

  const renderSpellRow = (spell: Spell, globalIdx: number, includeLevel: boolean) => {
    const isEditing = editingSpellId === spell.id
    const isDragging = draggingSpellIndex === globalIdx
    const isDragOver = dragOverSpellIndex === globalIdx
    const dragIndicator =
      isDragOver && dragOverSpellEdge === 'top'
        ? 'border-t-2 border-t-[#7a4b36]'
        : isDragOver && dragOverSpellEdge === 'bottom'
          ? 'border-b-2 border-b-[#7a4b36]'
          : ''
    const showDescription = expandedSpellDescriptionIndices.has(globalIdx)
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
    const damageTypeOptions = [
      { value: '', label: '—' },
      { value: 'Tranchant', label: 'Tranchant' },
      { value: 'Perforant', label: 'Perforant' },
      { value: 'Contondant', label: 'Contondant' },
      { value: 'Feu', label: 'Feu' },
      { value: 'Froid', label: 'Froid' },
      { value: 'Foudre', label: 'Foudre' },
      { value: 'Tonnerre', label: 'Tonnerre' },
      { value: 'Acide', label: 'Acide' },
      { value: 'Poison', label: 'Poison' },
      { value: 'Psychique', label: 'Psychique' },
      { value: 'Radiant', label: 'Radiant' },
      { value: 'Nécrotique', label: 'Nécrotique' },
      { value: 'Force', label: 'Force' },
    ]
    const currentActionType =
      spell.type === 'Action' || spell.type === 'Action bonus' ? spell.type : 'custom'
    const saveThrowValue = spell.saveThrow
      ? abilityLabels[spell.saveThrowAbility ?? 'STR'] ?? 'STR'
      : ''
    const valueMode = spell.diceMode === 'custom' ? 'custom' : 'dice'

    return (
      <div
        key={globalIdx}
        className={`border border-[#c9b89c] bg-white/40 p-1.5 mb-1 ${dragIndicator} ${
          isDragging ? 'opacity-60' : ''
        }`}
        onDragOver={handleSpellDragOver(globalIdx)}
        onDrop={handleSpellDrop(globalIdx)}
        onDragLeave={() => {
          if (dragOverSpellIndex === globalIdx) {
            setDragOverSpellIndex(null)
            setDragOverSpellEdge(null)
          }
        }}
      >
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
              <Button
                variant="small"
                onClick={() => {
                  setEditingSpellId(null)
                  setNewSpellId(null)
                  setSpellEditSnapshot(null)
                }}
              >
                OK
              </Button>
              <Button
                variant="small"
                onClick={() => {
                  if (newSpellId && newSpellId === spell.id) {
                    onRemoveSpell(globalIdx)
                  } else if (spellEditSnapshot && spellEditSnapshot.id === spell.id) {
                    onUpdateSpell(globalIdx, spellEditSnapshot.spell)
                  }
                  setEditingSpellId(null)
                  setNewSpellId(null)
                  setSpellEditSnapshot(null)
                }}
              >
                Annuler
              </Button>
            </div>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <FieldLabel>Niveau</FieldLabel>
                <input
                  type="number"
                  min="0"
                  max="9"
                  value={spell.level}
                  onChange={(e) =>
                    onUpdateSpell(globalIdx, { level: parseInt(e.target.value) || 0 })
                  }
                  className="w-full bg-transparent border border-[#bda68a] rounded px-1 py-0.5 text-xs"
                  placeholder="0"
                />
              </div>
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
                <FieldLabel>Valeur</FieldLabel>
                <Select
                  value={valueMode}
                  onChange={(e) =>
                    onUpdateSpell(globalIdx, {
                      diceMode: e.target.value as Spell['diceMode'],
                    })
                  }
                  options={[
                    { value: 'dice', label: 'Dés' },
                    { value: 'custom', label: 'Perso' },
                  ]}
                  className="text-[11px] min-h-[22px]"
                />
                {valueMode === 'custom' ? (
                  <input
                    type="text"
                    value={spell.diceCustom ?? ''}
                    onChange={(e) => onUpdateSpell(globalIdx, { diceCustom: e.target.value })}
                    className="w-full bg-transparent border border-[#bda68a] rounded px-1 py-0.5 text-xs"
                    placeholder="Valeur"
                  />
                ) : (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      value={spell.diceCount ?? 1}
                      onChange={(e) =>
                        onUpdateSpell(globalIdx, {
                          diceCount: Math.max(1, parseInt(e.target.value, 10) || 1),
                        })
                      }
                      className="w-10 text-center bg-transparent border border-[#bda68a] rounded px-1 py-0.5 text-[10px]"
                    />
                    <Select
                      value={spell.diceDie ?? ''}
                      onChange={(e) => onUpdateSpell(globalIdx, { diceDie: e.target.value })}
                      options={[
                        { value: '', label: '—' },
                        { value: 'd4', label: 'd4' },
                        { value: 'd6', label: 'd6' },
                        { value: 'd8', label: 'd8' },
                        { value: 'd10', label: 'd10' },
                        { value: 'd12', label: 'd12' },
                      ]}
                      className="text-[11px] min-h-[22px]"
                    />
                    <input
                      type="text"
                      value={spell.diceMod ?? ''}
                      onChange={(e) => onUpdateSpell(globalIdx, { diceMod: e.target.value })}
                      className="w-12 text-center bg-transparent border border-[#bda68a] rounded px-1 py-0.5 text-[10px]"
                      placeholder="Mod"
                    />
                  </div>
                )}
                <Select
                  value={spell.damageType ?? ''}
                  onChange={(e) => onUpdateSpell(globalIdx, { damageType: e.target.value })}
                  options={damageTypeOptions}
                  className="text-[11px] min-h-[22px] mt-1"
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
                  checked={spell.prepared ?? false}
                  onChange={(e) => onUpdateSpell(globalIdx, { prepared: e.target.checked })}
                  className="w-3 h-3"
                />
                <span>Préparé</span>
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
            <div
              data-drag-preview
              className={`grid items-center gap-3 text-[10px] ${
                includeLevel
                  ? 'grid-cols-[2fr_0.6fr_1.2fr_1.2fr_1.2fr_1.2fr_1.2fr_0.9fr_1fr_0.6fr_0.6fr_1fr]'
                  : 'grid-cols-[2fr_1.2fr_1.2fr_1.2fr_1.2fr_1.2fr_0.9fr_1fr_0.6fr_0.6fr_1fr]'
              } cursor-pointer`}
              onClick={() =>
                setExpandedSpellDescriptionIndices((prev) => {
                  const next = new Set(prev)
                  if (next.has(globalIdx)) {
                    next.delete(globalIdx)
                  } else {
                    next.add(globalIdx)
                  }
                  return next
                })
              }
            >
              <div className="flex items-center gap-1 min-w-0">
                <span
                  role="button"
                  aria-label="Réordonner le sort"
                  draggable={editingSpellId === null}
                  onDragStart={handleSpellDragStart(globalIdx)}
                  onDragEnd={resetSpellDragState}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="text-xs text-[#7a4b36] cursor-grab select-none"
                >
                  ⋮⋮
                </span>
                <span className="font-bold text-sm truncate">{spell.name || '—'}</span>
              </div>
              {includeLevel && renderSpellValue(String(spell.level ?? '—'))}
              {renderSpellValue(spell.school)}
              {renderSpellValue(spell.type)}
              {renderSpellValue(spell.range)}
              {renderSpellValue(spell.duration)}
              {renderSpellValue(spell.components)}
              {renderSpellValue(formatSpellDamageValue(spell))}
              {renderSpellValue(saveThrowValue)}
              {renderSpellValue(crTokens.join(', '))}
              <label
                className="flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={spell.prepared ?? false}
                  onChange={(e) => onUpdateSpell(globalIdx, { prepared: e.target.checked })}
                  className="w-3 h-3"
                />
              </label>
              <span className="relative flex justify-end items-center gap-2" data-spell-menu>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setOpenSpellMenuId(openSpellMenuId === spell.id ? null : spell.id)
                  }}
                  className="text-xs px-1"
                >
                  ⋯
                </button>
                {openSpellMenuId === spell.id && (
                  <div
                    className="absolute right-0 mt-5 z-10 bg-white border border-[#c9b89c] rounded shadow-sm text-xs"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (editingSpellId !== null) return
                        setSpellEditSnapshot({ id: spell.id, spell })
                        setEditingSpellId(spell.id)
                        setOpenSpellMenuId(null)
                      }}
                      className="block w-full text-left px-2 py-1 hover:bg-[#f6efe4]"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onRemoveSpell(globalIdx)
                        setOpenSpellMenuId(null)
                      }}
                      className="block w-full text-left px-2 py-1 hover:bg-[#f6efe4]"
                    >
                      Supprimer
                    </button>
                  </div>
                )}
              </span>
            </div>
            {spell.description && showDescription && (
              <div className="mt-1 border-l-2 border-[#bda68a] bg-white/30 px-2 py-1 text-[10px] whitespace-pre-wrap">
                {spell.description}
              </div>
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

      {isStandardCaster && !isPactMagic && (
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
                  {renderSpellHeader(false)}
                  {(spellsByLevel[slotLevel] || []).map((spell) => {
                    const globalIdx = spells.findIndex((s) => s === spell)
                    return renderSpellRow(spell, globalIdx, false)
                  })}
                </div>

                {renderSpellSearch({
                  searchKey: `standard-${slotLevel}`,
                  levelFilter: slotLevel,
                })}
              </div>
            )
          })}
        </div>
      )}

      {isPactMagic && (
        <div className="mt-2">
          <div className="mb-3 border border-[#c9b89c] p-2 bg-white/40">
            <SectionHeader as="h4" className="text-sm mb-1.5">
              Cantrips
            </SectionHeader>
            <div className="border border-[#c9b89c] bg-white/40 p-1.5 text-[11px]">
              {renderSpellHeader(false)}
              {(spellsByLevel[0] || []).map((spell) => {
                const globalIdx = spells.findIndex((s) => s === spell)
                return renderSpellRow(spell, globalIdx, false)
              })}
            </div>
            {renderSpellSearch({
              searchKey: 'pact-cantrips',
              levelFilter: 0,
            })}
          </div>
          <div className="mb-3 border border-[#c9b89c] p-2 bg-white/40">
            <SectionHeader as="h4" className="text-sm mb-1.5">
              Sorts
            </SectionHeader>
            <div className="border border-[#c9b89c] bg-white/40 p-1.5 text-[11px]">
              {renderSpellHeader(true)}
              {spells
                .filter((spell) => String(spell.level) !== '0')
                .map((spell) => {
                  const globalIdx = spells.findIndex((s) => s === spell)
                  return renderSpellRow(spell, globalIdx, true)
                })}
            </div>
            {renderSpellSearch({
              searchKey: 'pact-spells',
              excludeCantrips: true,
            })}
          </div>
        </div>
      )}

      {!isStandardCaster && !isPactMagic && (
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
                {renderSpellHeader(false)}
                {(spellsByLevel[slotLevel] || []).map((spell) => {
                  const globalIdx = spells.findIndex((s) => s === spell)
                  return renderSpellRow(spell, globalIdx, false)
                })}
              </div>
              {renderSpellSearch({
                searchKey: `misc-${slotLevel}`,
                levelFilter: slotLevel,
              })}
            </div>
          ))}
        </div>
      )}
    </PaperContainer>
  )
}
