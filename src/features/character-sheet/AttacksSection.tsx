import { useState } from 'react'
import { AutoResizeTextarea, Box, Button, FieldLabel, SectionHeader, Select } from '@/components/ui'
import { useOutsideClick } from '@/hooks'
import { calculateAbilityModifier } from '@/types/abilities'
import type { Attack } from '@/types/character'
import type { Abilities } from '@/types/abilities'

type AttacksSectionProps = {
  attacks: Attack[]
  abilities: Abilities
  proficiencyBonus: number
  formatSigned: (value: number) => string
  getProficiencyLabel: (value: number) => string
  getProficiencyBadgeClasses: (value: number) => string
  onAttacksChange: (nextAttacks: Attack[]) => void
}

export function AttacksSection({
  attacks,
  abilities,
  proficiencyBonus,
  formatSigned,
  getProficiencyLabel,
  getProficiencyBadgeClasses,
  onAttacksChange,
}: AttacksSectionProps) {
  const [editingAttackId, setEditingAttackId] = useState<string | null>(null)
  const [attackEditSnapshot, setAttackEditSnapshot] = useState<{ id: string; attack: Attack } | null>(
    null
  )
  const [newAttackId, setNewAttackId] = useState<string | null>(null)
  const [openAttackMenuId, setOpenAttackMenuId] = useState<string | null>(null)
  const [expandedAttackIds, setExpandedAttackIds] = useState<Set<string>>(() => new Set())

  useOutsideClick({
    isActive: Boolean(openAttackMenuId),
    onOutsideClick: () => setOpenAttackMenuId(null),
    ignoreSelector: '[data-attack-menu]',
  })

  const parseNumber = (value: string) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  const createAttackId = () => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID()
    }
    return `atk-${Date.now()}`
  }

  const addAttack = () => {
    const id = createAttackId()
    onAttacksChange([
      ...attacks,
      {
        id,
        name: '',
        damageDiceCount: 1,
        damageDie: '',
        ability: 'str',
        magicMod: '0',
        proficiencyLevel: 0,
        property: '',
        notes: '',
        special: '',
      },
    ])
    return id
  }

  const updateAttack = (index: number, updates: Partial<Attack>) => {
    const newAttacks = [...attacks]
    const current = newAttacks[index]
    if (!current) return
    newAttacks[index] = {
      id: current.id,
      name: updates.name ?? current.name,
      damageDiceCount: updates.damageDiceCount ?? current.damageDiceCount,
      damageDie: updates.damageDie ?? current.damageDie,
      ability: updates.ability ?? current.ability,
      magicMod: updates.magicMod ?? current.magicMod,
      proficiencyLevel: updates.proficiencyLevel ?? current.proficiencyLevel,
      property: updates.property ?? current.property,
      notes: updates.notes ?? current.notes,
      special: updates.special ?? current.special,
    }
    onAttacksChange(newAttacks)
  }

  const removeAttack = (index: number) => {
    const removedId = attacks[index]?.id
    onAttacksChange(attacks.filter((_, i) => i !== index))
    if (removedId && editingAttackId === removedId) {
      setEditingAttackId(null)
      setNewAttackId(null)
      setAttackEditSnapshot(null)
    }
    if (removedId && openAttackMenuId === removedId) {
      setOpenAttackMenuId(null)
    }
  }

  const cancelAttackEdit = () => {
    if (!editingAttackId) return
    if (newAttackId && newAttackId === editingAttackId) {
      onAttacksChange(attacks.filter((attack) => attack.id !== editingAttackId))
    } else if (attackEditSnapshot && attackEditSnapshot.id === editingAttackId) {
      onAttacksChange(
        attacks.map((attack) =>
          attack.id === editingAttackId ? attackEditSnapshot.attack : attack
        )
      )
    }
    setEditingAttackId(null)
    setNewAttackId(null)
    setAttackEditSnapshot(null)
  }

  const getAttackAutoBonus = (attack: Attack) => {
    const abilityMod = calculateAbilityModifier(abilities[attack.ability]) || 0
    const magicMod = parseNumber(attack.magicMod)
    const profMult = attack.proficiencyLevel ? 1 : 0
    return (abilityMod || 0) + (magicMod || 0) + proficiencyBonus * profMult
  }

  const getAttackDamageDisplay = (attack: Attack) => {
    if (!attack.damageDie) return '—'
    const abilityMod = calculateAbilityModifier(abilities[attack.ability]) || 0
    const magicMod = parseNumber(attack.magicMod)
    const totalMod = abilityMod + magicMod
    const count = Math.max(1, attack.damageDiceCount || 1)
    return `${count}${attack.damageDie}${formatSigned(totalMod)}`
  }

  return (
    <div className="mt-2.5 border border-[#c9b89c] bg-white/60 rounded p-2 shadow-sm h-auto">
      <SectionHeader>Attaques</SectionHeader>
      <div className="grid grid-cols-[1fr_0.4fr_0.55fr_1fr_0.7fr_1fr_auto] gap-1 text-[11px] mt-1">
        <FieldLabel className="text-center">Nom</FieldLabel>
        <FieldLabel className="text-center">Maîtrise</FieldLabel>
        <FieldLabel className="text-center">Bonus Attaque</FieldLabel>
        <FieldLabel className="text-center">Damage</FieldLabel>
        <FieldLabel className="text-center">Propriété</FieldLabel>
        <FieldLabel className="text-center">Spécial</FieldLabel>
        <FieldLabel className="text-center" aria-hidden="true">
          &nbsp;
        </FieldLabel>
      </div>
      <div className="mt-1">
        {attacks.map((attack, idx) => (
          <div
            key={attack.id}
            className="mb-1 border border-[#c9b89c] bg-white/40 p-1.5"
          >
            {editingAttackId === attack.id ? (
              <>
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-1 items-start">
                  <Box className="flex flex-col gap-1 text-center">
                    <FieldLabel className="text-center">Nom</FieldLabel>
                    <AutoResizeTextarea
                      value={attack.name}
                      onChange={(e) => updateAttack(idx, { name: e.target.value })}
                      className="w-full bg-transparent border-none outline-none font-bold leading-tight text-center"
                      placeholder="Nom"
                    />
                  </Box>
                  <Box className="flex flex-col items-center gap-1 text-center">
                    <FieldLabel className="text-center">Maîtrise</FieldLabel>
                    <button
                      type="button"
                      onClick={() => {
                        const nextLevel =
                          attack.proficiencyLevel === 2
                            ? 0
                            : ((attack.proficiencyLevel + 1) as 0 | 1 | 2)
                        updateAttack(idx, { proficiencyLevel: nextLevel })
                      }}
                      className={`w-4 h-4 rounded-full border flex items-center justify-center text-[9px] ${getProficiencyBadgeClasses(attack.proficiencyLevel)}`}
                      title={
                        attack.proficiencyLevel === 2
                          ? 'Expertise'
                          : attack.proficiencyLevel === 1
                          ? 'Maîtrise'
                          : 'Aucune'
                      }
                    >
                      {getProficiencyLabel(attack.proficiencyLevel)}
                    </button>
                  </Box>
                  <Box className="flex flex-col items-center gap-1 text-[10px] font-semibold text-center">
                    <FieldLabel className="text-center">Bonus</FieldLabel>
                    {formatSigned(getAttackAutoBonus(attack))}
                  </Box>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="small"
                      onClick={() => {
                        setEditingAttackId(null)
                        setNewAttackId(null)
                        setAttackEditSnapshot(null)
                      }}
                    >
                      OK
                    </Button>
                    <Button variant="small" onClick={cancelAttackEdit}>
                      Annuler
                    </Button>
                  </div>
                </div>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  <Box className="flex flex-col gap-1 text-center">
                    <FieldLabel className="text-center">Carac.</FieldLabel>
                    <Select
                      value={attack.ability}
                      onChange={(e) =>
                        updateAttack(idx, { ability: e.target.value as Attack['ability'] })
                      }
                      options={[
                        { value: 'str', label: 'FOR' },
                        { value: 'dex', label: 'DEX' },
                        { value: 'con', label: 'CON' },
                        { value: 'int', label: 'INT' },
                        { value: 'wis', label: 'SAG' },
                        { value: 'cha', label: 'CHA' },
                      ]}
                      className="text-[11px] min-h-[22px]"
                    />
                  </Box>
                  <Box className="flex flex-col gap-1 text-center">
                    <FieldLabel className="text-center">Mod</FieldLabel>
                    <input
                      type="number"
                      value={attack.magicMod}
                      onChange={(e) => updateAttack(idx, { magicMod: e.target.value })}
                      className="w-full bg-transparent border-none outline-none text-xs text-center"
                      placeholder="0"
                    />
                  </Box>
                  <Box className="flex flex-col gap-1 text-center">
                    <FieldLabel className="text-center">Dés</FieldLabel>
                    <div className="flex items-center justify-center gap-1">
                      <input
                        type="number"
                        min="1"
                        value={attack.damageDiceCount}
                        onChange={(e) =>
                          updateAttack(idx, {
                            damageDiceCount: Math.max(1, parseInt(e.target.value) || 1),
                          })
                        }
                        className="w-10 text-center bg-transparent border border-[#bda68a] rounded px-1 py-0.5 text-[10px]"
                      />
                      <Select
                        value={attack.damageDie}
                        onChange={(e) => updateAttack(idx, { damageDie: e.target.value })}
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
                    </div>
                  </Box>
                  <Box className="flex flex-col gap-1 text-center">
                    <FieldLabel className="text-center">Propriété</FieldLabel>
                    <AutoResizeTextarea
                      value={attack.property}
                      onChange={(e) => updateAttack(idx, { property: e.target.value })}
                      className="w-full bg-transparent border-none outline-none text-xs text-center"
                      placeholder="Propriété"
                    />
                  </Box>
                  <Box className="flex flex-col gap-1 text-center">
                    <FieldLabel className="text-center">Notes</FieldLabel>
                    <AutoResizeTextarea
                      value={attack.notes}
                      onChange={(e) => updateAttack(idx, { notes: e.target.value })}
                      className="w-full bg-transparent border-none outline-none text-xs text-center"
                      placeholder="Magie / Notes"
                    />
                  </Box>
                  <Box className="flex flex-col gap-1 text-center">
                    <FieldLabel className="text-center">Spécial</FieldLabel>
                    <AutoResizeTextarea
                      value={attack.special}
                      onChange={(e) => updateAttack(idx, { special: e.target.value })}
                      className={
                        attack.proficiencyLevel === 2
                          ? 'w-full bg-transparent border-none outline-none text-xs text-center'
                          : 'w-full bg-gray-100 border border-gray-200 outline-none text-xs text-gray-500 text-center'
                      }
                      placeholder="Spécial"
                      disabled={attack.proficiencyLevel !== 2}
                    />
                  </Box>
                </div>
              </>
            ) : (
              <>
                <div
                  className="grid grid-cols-[1fr_0.4fr_0.55fr_1fr_0.7fr_1fr_auto] gap-1 items-center cursor-pointer"
                  onClick={() =>
                    setExpandedAttackIds((prev) => {
                      const next = new Set(prev)
                      if (next.has(attack.id)) {
                        next.delete(attack.id)
                      } else {
                        next.add(attack.id)
                      }
                      return next
                    })
                  }
                >
                  <div>
                    <div className="font-bold leading-tight text-center">
                      {attack.name || '—'}
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        const nextLevel =
                          attack.proficiencyLevel === 2
                            ? 0
                            : ((attack.proficiencyLevel + 1) as 0 | 1 | 2)
                        updateAttack(idx, { proficiencyLevel: nextLevel })
                      }}
                      className={`w-4 h-4 rounded-full border flex items-center justify-center text-[9px] ${getProficiencyBadgeClasses(attack.proficiencyLevel)}`}
                      title={
                        attack.proficiencyLevel === 2
                          ? 'Expertise'
                          : attack.proficiencyLevel === 1
                          ? 'Maîtrise'
                          : 'Aucune'
                      }
                    >
                      {getProficiencyLabel(attack.proficiencyLevel)}
                    </button>
                  </div>
                  <div className="text-[10px] font-semibold text-center mr-1">
                    {formatSigned(getAttackAutoBonus(attack))}
                  </div>
                  <div className="text-xs text-center">{getAttackDamageDisplay(attack)}</div>
                  <div className="text-xs text-center">
                    <AutoResizeTextarea
                      value={attack.property}
                      onChange={(e) => updateAttack(idx, { property: e.target.value })}
                      className="w-full bg-transparent border-none outline-none text-xs text-center"
                      placeholder="Propriété"
                    />
                  </div>
                  <div className="text-xs text-center">
                    {attack.proficiencyLevel === 2 ? (
                      <AutoResizeTextarea
                        value={attack.special}
                        onChange={(e) => updateAttack(idx, { special: e.target.value })}
                        className="w-full bg-transparent border-none outline-none text-xs text-center"
                        placeholder="Spécial"
                      />
                    ) : (
                      '_'
                    )}
                  </div>
                  <div
                    className="relative flex items-center justify-end"
                    data-attack-menu
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenAttackMenuId(
                          openAttackMenuId === attack.id ? null : attack.id
                        )
                      }}
                      className="text-xs px-1"
                    >
                      ⋯
                    </button>
                    {openAttackMenuId === attack.id && (
                      <div className="absolute right-0 mt-5 z-10 bg-white border border-[#c9b89c] rounded shadow-sm text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            if (editingAttackId !== null) return
                            setAttackEditSnapshot({ id: attack.id, attack })
                            setEditingAttackId(attack.id)
                            setOpenAttackMenuId(null)
                          }}
                          className="block w-full text-left px-2 py-1 hover:bg-[#f6efe4]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            removeAttack(idx)
                            setOpenAttackMenuId(null)
                          }}
                          className="block w-full text-left px-2 py-1 hover:bg-[#f6efe4]"
                        >
                          Supprimer
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {expandedAttackIds.has(attack.id) && attack.notes && (
                  <div className="mt-1 border-l-2 border-[#bda68a] bg-white/30 px-2 py-1 text-[10px]">
                    <div className="whitespace-pre-wrap">{attack.notes}</div>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
        <div className="mt-1 flex items-center gap-2">
          <Button
            variant="small"
            onClick={() => {
              const id = addAttack()
              setEditingAttackId(id)
              setNewAttackId(id)
            }}
            disabled={editingAttackId !== null}
          >
            + Ajouter une attaque
          </Button>
        </div>
      </div>
    </div>
  )
}
