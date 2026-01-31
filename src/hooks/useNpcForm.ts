import { useState, useEffect, useCallback, useRef } from 'react'
import type { Npc } from '@/types/npc'
import { createEmptyNpc } from '@/types/npc'
import {
  exportNpcToJson,
  importNpcFromJson,
} from '@/utils'

const normalizeNpcData = (data?: Npc): Npc => {
  const defaults = createEmptyNpc()
  if (!data) {
    return defaults
  }

  return {
    ...defaults,
    ...data,
    abilities: data.abilities ?? defaults.abilities,
    skills: Array.isArray(data.skills) ? data.skills : [],
    special: Array.isArray(data.special) ? data.special : [],
    actions: Array.isArray(data.actions) ? data.actions : [],
    legendary_actions: Array.isArray(data.legendary_actions) ? data.legendary_actions : [],
    portraitState: data.portraitState ?? defaults.portraitState,
  }
}

export function useNpcForm(initialData?: Npc) {
  const [npc, setNpc] = useState<Npc>(() => {
    return normalizeNpcData(initialData)
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
    setNpc(normalizeNpcData(initialData))
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

