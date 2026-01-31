import { useCallback } from 'react'
import type { Character, Spell } from '@/types/character'

type UpdateField = <K extends keyof Character>(field: K, value: Character[K]) => void

type UseSpellsActionsParams = {
  character: Character
  updateField: UpdateField
  updateCharacter: (updates: Partial<Character>) => void
  currentMaxSlots: Record<number, number>
  baseSlotTotals: Record<number, number>
}

export function useSpellsActions({
  character,
  updateField,
  updateCharacter,
  currentMaxSlots,
  baseSlotTotals,
}: UseSpellsActionsParams) {
  const addSpell = useCallback(
    (level: number) => {
      const id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `spell-${Date.now()}`
      updateField('spells', [
        ...character.spells,
        {
          id,
          name: '',
          level: level.toString(),
          school: '',
          type: '',
          range: '',
          duration: '',
          components: '',
          dice: '',
          diceMode: 'dice',
          diceCount: 1,
          diceDie: '',
          diceMod: '',
          diceCustom: '',
        damageType: '',
          concentration: false,
          ritual: false,
        prepared: false,
          saveThrow: false,
          saveThrowAbility: 'STR',
          description: '',
        },
      ])
      return id
    },
    [character.spells, updateField]
  )

  const updateSpell = useCallback(
    (index: number, updates: Partial<Spell>) => {
      const newSpells = [...character.spells]
      const current = newSpells[index]
      if (!current) return
      newSpells[index] = {
        id: current.id,
        name: updates.name ?? current.name,
        level: updates.level ?? current.level,
        school: updates.school ?? current.school,
        type: updates.type ?? current.type,
        range: updates.range ?? current.range,
        duration: updates.duration ?? current.duration,
        components: updates.components ?? current.components,
        dice: updates.dice ?? current.dice,
        diceMode: updates.diceMode ?? current.diceMode,
        diceCount: updates.diceCount ?? current.diceCount,
        diceDie: updates.diceDie ?? current.diceDie,
        diceMod: updates.diceMod ?? current.diceMod,
        diceCustom: updates.diceCustom ?? current.diceCustom,
        damageType: updates.damageType ?? current.damageType,
        concentration: updates.concentration ?? current.concentration,
        ritual: updates.ritual ?? current.ritual,
        prepared: updates.prepared ?? current.prepared,
        saveThrow: updates.saveThrow ?? current.saveThrow,
        saveThrowAbility: updates.saveThrowAbility ?? current.saveThrowAbility,
        description: updates.description ?? current.description,
      }
      updateField('spells', newSpells)
    },
    [character.spells, updateField]
  )

  const reorderSpells = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return
      const next = [...character.spells]
      const [moved] = next.splice(fromIndex, 1)
      if (!moved) return
      const insertIndex = fromIndex < toIndex ? Math.max(0, toIndex - 1) : toIndex
      next.splice(insertIndex, 0, moved)
      updateField('spells', next)
    },
    [character.spells, updateField]
  )

  const removeSpell = useCallback(
    (index: number) => {
      updateField('spells', character.spells.filter((_, i) => i !== index))
    },
    [character.spells, updateField]
  )

  const updateSpellSlot = useCallback(
    (level: number, field: 'total' | 'used', value: number) => {
      const slots = { ...character.spellSlots }
      if (!slots[level]) {
        slots[level] = { total: 0, used: 0 }
      }

      if (field === 'used') {
        const maxForLevel = currentMaxSlots[level] ?? 0
        slots[level] = { ...slots[level], used: value, total: maxForLevel }
        updateField('spellSlots', slots)
        return
      }

      const baseTotal = baseSlotTotals[level] ?? 0
      const nextOverrides = { ...character.slotOverrides, [level]: value - baseTotal }
      slots[level] = { ...slots[level], total: Math.max(0, value) }
      updateCharacter({ slotOverrides: nextOverrides, spellSlots: slots })
    },
    [
      baseSlotTotals,
      character.slotOverrides,
      character.spellSlots,
      currentMaxSlots,
      updateCharacter,
      updateField,
    ]
  )

  return { addSpell, updateSpell, removeSpell, updateSpellSlot, reorderSpells }
}
