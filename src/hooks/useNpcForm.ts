import { useState, useEffect, useCallback } from 'react'
import type { Npc } from '@/types/npc'
import { createEmptyNpc } from '@/types/npc'
import {
  saveNpcToStorage,
  loadNpcFromStorage,
  exportNpcToJson,
  importNpcFromJson,
} from '@/utils'

export function useNpcForm() {
  const [npc, setNpc] = useState<Npc>(() => {
    const saved = loadNpcFromStorage()
    return saved || createEmptyNpc()
  })

  // Auto-save to localStorage whenever NPC changes
  useEffect(() => {
    saveNpcToStorage(npc)
  }, [npc])

  const updateNpc = useCallback((updates: Partial<Npc>) => {
    setNpc((prev) => ({ ...prev, ...updates }))
  }, [])

  const updateField = useCallback(<K extends keyof Npc>(
    field: K,
    value: Npc[K]
  ) => {
    setNpc((prev) => ({ ...prev, [field]: value }))
  }, [])

  const handleExport = useCallback(() => {
    try {
      exportNpcToJson(npc)
    } catch (error) {
      throw error
    }
  }, [npc])

  const handleImport = useCallback(async (file: File) => {
    try {
      const imported = await importNpcFromJson(file)
      setNpc(imported)
    } catch (error) {
      throw error
    }
  }, [])

  const reset = useCallback(() => {
    setNpc(createEmptyNpc())
  }, [])

  return {
    npc,
    updateNpc,
    updateField,
    handleExport,
    handleImport,
    reset,
  }
}

