import { useMemo } from 'react'
import { CLASSES_2024 } from '@/data/classTables2024'
import { SUBCLASS_OPTIONS } from '@/data/dndRules'
import type { Character } from '@/types/character'

type UseClassSelectionParams = {
  characterClass: Character['class']
  subclass: Character['subclass']
  updateCharacter: (updates: Partial<Character>) => void
}

export function useClassSelection({
  characterClass,
  subclass,
  updateCharacter,
}: UseClassSelectionParams) {
  const classOptions = useMemo(
    () =>
      Object.values(CLASSES_2024).map((entry) => ({
        value: entry.name,
        label: entry.name,
      })),
    []
  )

  const subclassOptions = useMemo(
    () => SUBCLASS_OPTIONS[characterClass] ?? [],
    [characterClass]
  )

  const handleClassChange = (value: string) => {
    const nextSubclassOptions = SUBCLASS_OPTIONS[value] ?? []
    const nextSubclass = nextSubclassOptions.includes(subclass) ? subclass : ''
    updateCharacter({ class: value, subclass: nextSubclass })
  }

  return { classOptions, subclassOptions, handleClassChange }
}
