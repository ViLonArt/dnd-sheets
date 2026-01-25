import { useState, useEffect, useCallback, useRef } from 'react'
import type { Character } from '@/types/character'
import { createEmptyCharacter } from '@/types/character'
import {
  saveCharacterToStorage,
  loadCharacterFromStorage,
  exportCharacterToJson,
  importCharacterFromJson,
} from '@/utils'
import { normalizeCharacterData } from '@/utils/characterMigrations'

export function useCharacterForm(initialData?: Character) {
  const [character, setCharacter] = useState<Character>(() => {
    if (initialData) {
      return normalizeCharacterData(
        initialData as unknown as Record<string, unknown>
      ) as unknown as Character
    }
    const saved = loadCharacterFromStorage()
    return saved || createEmptyCharacter()
  })
  const isInitialMount = useRef(true)

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    if (initialData) {
      setCharacter(
        normalizeCharacterData(
          initialData as unknown as Record<string, unknown>
        ) as unknown as Character
      )
      return
    }

    const saved = loadCharacterFromStorage()
    setCharacter(saved || createEmptyCharacter())
  }, [initialData])

  // Auto-save to localStorage whenever character changes
  useEffect(() => {
    saveCharacterToStorage(character)
  }, [character])

  const updateCharacter = useCallback((updates: Partial<Character>) => {
    setCharacter((prev) => ({ ...prev, ...updates }))
  }, [])

  const updateField = useCallback(<K extends keyof Character>(
    field: K,
    value: Character[K]
  ) => {
    setCharacter((prev) => ({ ...prev, [field]: value }))
  }, [])

  const handleExport = useCallback(() => {
    try {
      exportCharacterToJson(character)
    } catch (error) {
      throw error
    }
  }, [character])

  const handleImport = useCallback(async (file: File) => {
    try {
      const imported = await importCharacterFromJson(file)
      setCharacter(imported)
    } catch (error) {
      throw error
    }
  }, [])

  const reset = useCallback(() => {
    setCharacter(createEmptyCharacter())
  }, [])

  return {
    character,
    updateCharacter,
    updateField,
    handleExport,
    handleImport,
    reset,
  }
}

