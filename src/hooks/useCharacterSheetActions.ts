import { useCallback, useState, type ChangeEvent, type RefObject } from 'react'
import type { Character } from '@/types/character'

type UpdateField = <K extends keyof Character>(field: K, value: Character[K]) => void

type UseCharacterSheetActionsParams = {
  character: Character
  sheetRef: RefObject<HTMLElement>
  updateField: UpdateField
  updateCharacter: (updates: Partial<Character>) => void
  handleExport: () => void
  handleImport: (file: File) => Promise<void>
  reset: () => void
  exportToPdf: (elementRef: RefObject<HTMLElement>, filename: string) => Promise<void>
  exportToPng: (elementRef: RefObject<HTMLElement>, filename: string) => Promise<void>
  effectiveHpMax: number
}

export function useCharacterSheetActions({
  character,
  sheetRef,
  updateField,
  updateCharacter,
  handleExport,
  handleImport,
  reset,
  exportToPdf,
  exportToPng,
  effectiveHpMax,
}: UseCharacterSheetActionsParams) {
  const [error, setError] = useState<string | null>(null)
  const [isCropperOpen, setIsCropperOpen] = useState(false)
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null)

  const parseNumber = (value: string) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  const applyRest = useCallback(
    (type: 'short' | 'long') => {
      const maxHp = effectiveHpMax
      const currentHp = parseNumber(character.hpCurrent)
      const healed = Math.floor(maxHp / 2)
      const nextHp = type === 'long' ? maxHp : Math.min(maxHp, currentHp + healed)
      const nextFeatures = character.classFeatures.map((feature) => {
        if (!feature.resource) return feature
        if (type !== 'long' && feature.resource.reset !== 'short') return feature
        return {
          ...feature,
          resource: {
            ...feature.resource,
            current: 0,
          },
        }
      })
      const updates: Partial<Character> = {
        hpCurrent: String(nextHp),
        classFeatures: nextFeatures,
      }
      if (type === 'long') {
        updates.spellSlots = Object.fromEntries(
          Object.entries(character.spellSlots).map(([level, slot]) => [
            level,
            { ...slot, used: 0 },
          ])
        )
      }
      updateCharacter(updates)
    },
    [character.classFeatures, character.hpCurrent, character.spellSlots, effectiveHpMax, updateCharacter]
  )

  const handleShortRest = useCallback(() => applyRest('short'), [applyRest])
  const handleLongRest = useCallback(() => applyRest('long'), [applyRest])

  const handleExportClick = useCallback(() => {
    try {
      handleExport()
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    }
  }, [handleExport])

  const handleFileChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      try {
        await handleImport(file)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Import failed')
      }
      e.target.value = ''
    },
    [handleImport]
  )

  const handleDownloadPdf = useCallback(async () => {
    try {
      await exportToPdf(sheetRef, 'fiche-pj.pdf')
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF export failed')
    }
  }, [exportToPdf, sheetRef])

  const handleDownloadPng = useCallback(async () => {
    try {
      await exportToPng(sheetRef, 'fiche-pj.png')
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PNG export failed')
    }
  }, [exportToPng, sheetRef])

  const handleReset = useCallback(() => {
    if (window.confirm('Are you sure? Unsaved changes will be lost.')) {
      reset()
      setError(null)
    }
  }, [reset])

  const handlePortraitSelected = useCallback((dataUrl: string) => {
    setSelectedImageSrc(dataUrl)
    setIsCropperOpen(true)
  }, [])

  const handleCropperSave = useCallback(
    async (croppedImageUrl: string) => {
      setError(null)
      updateField('portrait', croppedImageUrl)
      updateField('portraitState', { zoom: 1, offsetX: 0, offsetY: 0 })
      setSelectedImageSrc(null)
    },
    [updateField]
  )

  const handleCropperClose = useCallback(() => {
    setIsCropperOpen(false)
    setSelectedImageSrc(null)
  }, [])

  const handlePortraitDelete = useCallback(() => {
    updateField('portrait', null)
    updateField('portraitState', { zoom: 1, offsetX: 0, offsetY: 0 })
  }, [updateField])

  return {
    error,
    isCropperOpen,
    selectedImageSrc,
    handleShortRest,
    handleLongRest,
    handleExportClick,
    handleFileChange,
    handleDownloadPdf,
    handleDownloadPng,
    handleReset,
    handlePortraitSelected,
    handleCropperSave,
    handleCropperClose,
    handlePortraitDelete,
  }
}
