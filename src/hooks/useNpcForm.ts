import { useState, useEffect, useCallback, useRef } from 'react'
import type { Npc } from '@/types/npc'
import { createEmptyNpc } from '@/types/npc'
import {
  exportNpcToJson,
  importNpcFromJson,
} from '@/utils'

export function useNpcForm(initialData?: Npc) {
  const [npc, setNpc] = useState<Npc>(() => {
    return initialData || createEmptyNpc()
  })
  const isInitialMount = useRef(true)

  // Update form state when initialData changes (e.g., after API fetch)
  useEffect(() => {
    // Skip on initial mount since useState already handles it
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    // When initialData changes, update form state
    if (initialData) {
      setNpc(initialData)
    } else {
      // Reset to empty when navigating to blank sheet
      setNpc(createEmptyNpc())
    }
  }, [initialData])

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

