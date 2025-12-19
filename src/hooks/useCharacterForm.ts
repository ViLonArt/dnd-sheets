import { useState, useEffect, useCallback } from 'react'
import type { Character } from '@/types/character'
import { createEmptyCharacter } from '@/types/character'
import {
  saveCharacterToStorage,
  loadCharacterFromStorage,
  exportCharacterToJson,
  importCharacterFromJson,
} from '@/utils'

export function useCharacterForm() {
  const [character, setCharacter] = useState<Character>(() => {
    const saved = loadCharacterFromStorage()
    return saved || createEmptyCharacter()
  })

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

