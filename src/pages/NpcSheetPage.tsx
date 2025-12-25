import React, { useRef, useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useNpcForm, useExportToImage } from '@/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { AuthButton } from '@/components/auth/AuthButton'
import { getSheet, createSheet, updateSheet } from '@/services/sheetService'
import {
  PaperContainer,
  Heading,
  Button,
  SectionHeader,
  PropertyLine,
  Box,
  Toolbar,
  Divider,
  AutoResizeTextarea,
} from '@/components/ui'
import { ImageCropperModal } from '@/components/ImageCropperModal'
import { calculateAbilityModifier } from '@/types/abilities'
import { ABILITIES_ORDER, ABILITY_LABELS } from '@/features/character-sheet/constants'
import { cn } from '@/utils/cn'

export default function NpcSheetPage() {
  const { id } = useParams<{ id: string }>()
  const sheetRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const portraitInputRef = useRef<HTMLInputElement>(null)
  const { npc, updateNpc, updateField, handleExport, handleImport, reset } = useNpcForm()
  const { exportToPdf, exportToPng, isExporting } = useExportToImage()
  const { user } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isCropperOpen, setIsCropperOpen] = useState(false)
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null)
  const [isReadOnly, setIsReadOnly] = useState(false)
  const [sheetId, setSheetId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Portrait frame aspect ratio: 160x220 = ~0.727
  const PORTRAIT_ASPECT_RATIO = 160 / 220

  // Load sheet data from URL if id exists
  useEffect(() => {
    const loadSheet = async () => {
      if (!id) {
        setIsReadOnly(false)
        setSheetId(null)
        return
      }

      setIsLoading(true)
      try {
        const sheet = await getSheet(id)
        setSheetId(sheet.id)
        
        // Check ownership
        const currentUserId = user?.id
        if (sheet.owner_id !== currentUserId || !currentUserId) {
          setIsReadOnly(true)
        } else {
          setIsReadOnly(false)
        }

        // Populate form with sheet data
        if (sheet.data) {
          updateNpc(sheet.data as typeof npc)
        }
      } catch (err) {
        console.error('Failed to load sheet:', err)
        setError(err instanceof Error ? err.message : 'Failed to load sheet')
      } finally {
        setIsLoading(false)
      }
    }

    loadSheet()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id])

  // Save sheet to Supabase
  const handleSave = async () => {
    if (!user) {
      alert('You must be logged in to save sheets')
      return
    }

    try {
      setError(null)
      if (sheetId) {
        // Update existing sheet
        await updateSheet(sheetId, npc)
        alert('Sheet saved successfully!')
      } else {
        // Create new sheet
        const result = await createSheet(npc)
        setSheetId(result.id)
        // Update URL without page reload
        window.history.replaceState({}, '', `/npc/${result.id}`)
        alert('Sheet saved successfully!')
      }
    } catch (err) {
      console.error('Failed to save sheet:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to save sheet'
      setError(errorMessage)
      alert(errorMessage)
    }
  }

  // Handle ability score changes
  const handleAbilityChange = (ability: string, value: number) => {
    const score = Math.max(1, Math.min(30, value || 10))
    updateField('abilities', { ...npc.abilities, [ability]: score })
  }

  // Portrait handling with cropper
  const handlePortraitClick = () => {
    if (isReadOnly) return
    portraitInputRef.current?.click()
  }

  const handlePortraitUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      setSelectedImageSrc(dataUrl)
      setIsCropperOpen(true)
    }
    reader.readAsDataURL(file)
    // Reset input so same file can be selected again
    e.target.value = ''
  }

  const handleCropperSave = (croppedImageUrl: string) => {
    updateField('portrait', croppedImageUrl)
    // Clean up old portraitState since we no longer need it
    updateField('portraitState', { zoom: 1, offsetX: 0, offsetY: 0 })
    setSelectedImageSrc(null)
  }

  const handleCropperClose = () => {
    setIsCropperOpen(false)
    setSelectedImageSrc(null)
  }

  const handlePortraitDelete = () => {
    updateField('portrait', null)
    updateField('portraitState', { zoom: 1, offsetX: 0, offsetY: 0 })
  }

  // Inline list management
  const addListItem = (field: 'skills' | 'special' | 'actions') => {
    if (isReadOnly) return
    updateField(field, [...npc[field], ''])
  }

  const updateListItem = (field: 'skills' | 'special' | 'actions', index: number, value: string) => {
    if (isReadOnly) return
    const newList = [...npc[field]]
    newList[index] = value
    updateField(field, newList)
  }

  const removeListItem = (field: 'skills' | 'special' | 'actions', index: number) => {
    if (isReadOnly) return
    updateField(field, npc[field].filter((_, i) => i !== index))
  }

  // Copy sheet to user's library
  const handleCopyToLibrary = async () => {
    if (!user) {
      alert('You must be logged in to copy sheets')
      return
    }

    try {
      setError(null)
      const result = await createSheet(npc)
      setSheetId(result.id)
      setIsReadOnly(false)
      // Update URL without page reload
      window.history.replaceState({}, '', `/npc/${result.id}`)
      alert('Sheet copied to your library!')
    } catch (err) {
      console.error('Failed to copy sheet:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to copy sheet'
      setError(errorMessage)
      alert(errorMessage)
    }
  }

  // Export handlers
  const handleExportClick = () => {
    try {
      handleExport()
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await handleImport(file)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    }
    e.target.value = ''
  }

  const handleDownloadPdf = async () => {
    try {
      await exportToPdf(sheetRef, 'fiche-pnj.pdf')
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF export failed')
    }
  }

  const handleDownloadPng = async () => {
    try {
      await exportToPng(sheetRef, 'fiche-pnj.png')
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PNG export failed')
    }
  }

  const handleReset = () => {
    if (window.confirm('Are you sure? Unsaved changes will be lost.')) {
      reset()
      setError(null)
    }
  }

  return (
    <div className="min-h-screen p-5 bg-gray-200">
      <div className="max-w-[1100px] mx-auto flex flex-col gap-5">
        <Toolbar
          left={
            <>
              <Button onClick={handleDownloadPdf} disabled={isExporting}>
                {isExporting ? 'Génération...' : 'Télécharger en PDF'}
              </Button>
              <Button onClick={handleDownloadPng} disabled={isExporting} variant="small">
                {isExporting ? 'Génération...' : 'Télécharger en PNG'}
              </Button>
              {!isReadOnly && (
                <>
                  <Button onClick={() => portraitInputRef.current?.click()}>
                    Choisir un portrait
                  </Button>
                  <input
                    ref={portraitInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePortraitUpload}
                    className="hidden"
                  />
                  <Button onClick={handlePortraitDelete} disabled={!npc.portrait}>
                    Supprimer le portrait
                  </Button>
                </>
              )}
            </>
          }
          right={
            <>
              <AuthButton />
              <Button onClick={handleExportClick}>Exporter la fiche (JSON)</Button>
              {!isReadOnly && (
                <>
                  <Button onClick={handleImportClick}>Importer une fiche</Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button onClick={handleSave} variant="small">
                    Save
                  </Button>
                  <Button onClick={handleReset} variant="small">
                    Reset
                  </Button>
                </>
              )}
            </>
          }
        />

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
            Loading sheet...
          </div>
        )}

        {isReadOnly && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            <strong>Read-Only Mode:</strong> This sheet belongs to another user. You can view it but cannot edit it.
            {user && (
              <Button onClick={handleCopyToLibrary} variant="small" className="ml-2">
                Copy to My Library
              </Button>
            )}
          </div>
        )}

        <div ref={sheetRef}>
          <PaperContainer>
          <div className="flex justify-between items-start gap-3">
            {/* Header with Name, Type, Description */}
            <div className="flex-1">
              <Heading
                as="h1"
                contentEditable={!isReadOnly}
                suppressContentEditableWarning
                onBlur={(e) => !isReadOnly && updateField('name', e.currentTarget.textContent || '')}
                className={cn('mb-1', isReadOnly && 'pointer-events-none')}
              >
                {npc.name || 'Nom du Monstre'}
              </Heading>
              <Heading
                as="h2"
                size="sm"
                className={cn('italic text-sm mb-1.5 font-normal', isReadOnly && 'pointer-events-none')}
                contentEditable={!isReadOnly}
                suppressContentEditableWarning
                onBlur={(e) => !isReadOnly && updateField('type', e.currentTarget.textContent || '')}
              >
                {npc.type || 'Humanoïde (Humain), Neutre Mauvais'}
              </Heading>
              <textarea
                value={npc.description}
                onChange={(e) => !isReadOnly && updateField('description', e.target.value)}
                disabled={isReadOnly}
                className="w-full bg-transparent border-none outline-none font-body text-sm resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Une courte description ou accroche."
                rows={3}
              />
            </div>

            {/* Portrait */}
            <div
              className={cn(
                "w-[160px] h-[220px] bg-gradient-to-br from-[#d2b48c] via-paper to-[#c9ad8f] border-2 border-dashed border-ink flex items-center justify-center text-ink font-display text-sm uppercase overflow-hidden relative",
                isReadOnly ? "cursor-default" : "cursor-pointer"
              )}
              onClick={handlePortraitClick}
            >
              {npc.portrait ? (
                <img
                  src={npc.portrait}
                  alt="Portrait"
                  className="w-full h-full object-cover block"
                  draggable={false}
                />
              ) : (
                <span>Portrait</span>
              )}
            </div>
          </div>

          <Divider variant="tapered" />

          {/* Property Lines */}
          <PropertyLine
            label="Classe d'Armure"
            value={npc.ca}
            editable={!isReadOnly}
            disabled={isReadOnly}
            onValueChange={(value) => updateField('ca', value)}
          />
          <PropertyLine
            label="Points de Vie"
            value={npc.pv}
            editable={!isReadOnly}
            disabled={isReadOnly}
            onValueChange={(value) => updateField('pv', value)}
          />
          <PropertyLine
            label="Vitesse"
            value={npc.speed}
            editable={!isReadOnly}
            disabled={isReadOnly}
            onValueChange={(value) => updateField('speed', value)}
          />

          <Divider variant="tapered" />

          {/* Abilities */}
          <SectionHeader>Attributs</SectionHeader>
          <div className="grid grid-cols-6 gap-1.5 text-ink font-bold text-center mt-1.5">
            {ABILITIES_ORDER.map((ability) => {
              const modifier = calculateAbilityModifier(npc.abilities[ability])
              return (
                <Box key={ability}>
                  <div className="text-xs tracking-wide">{ABILITY_LABELS[ability]}</div>
                  <div className="mt-1 flex flex-col gap-1">
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={npc.abilities[ability]}
                      onChange={(e) => handleAbilityChange(ability, parseInt(e.target.value) || 10)}
                      disabled={isReadOnly}
                      className="text-[15px] w-full bg-transparent border border-[#bda68a] rounded px-1 py-0.5 text-center focus:border-ink focus:outline-none font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="10"
                    />
                    <div className="text-[13px] font-semibold">
                      {modifier >= 0 ? `+${modifier}` : `${modifier}`}
                    </div>
                  </div>
                </Box>
              )
            })}
          </div>

          {/* Skills */}
          <SectionHeader className="mt-3">Compétences / JS / Résistances</SectionHeader>
          <div className="mt-1.5">
            {npc.skills.map((skill, idx) => (
              <div key={idx} className="flex items-start gap-1.5 mb-1.5">
                <Box className="flex-1">
                  <input
                    type="text"
                    value={skill}
                    onChange={(e) => updateListItem('skills', idx, e.target.value)}
                    disabled={isReadOnly}
                    className="w-full bg-transparent border-none outline-none text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Nouvelle compétence / JS"
                  />
                </Box>
                {!isReadOnly && (
                  <Button variant="small" onClick={() => removeListItem('skills', idx)}>
                    ×
                  </Button>
                )}
              </div>
            ))}
            {!isReadOnly && (
              <Button variant="small" onClick={() => addListItem('skills')} className="w-full mt-1.5">
                + Ajouter une ligne
              </Button>
            )}
          </div>

          {/* Special Abilities */}
          <SectionHeader className="mt-3">Aptitudes spéciales / Comportement</SectionHeader>
          <div className="mt-1.5">
            {npc.special.map((ability, idx) => (
              <div key={idx} className="flex items-start gap-1.5 mb-1.5">
                <Box className="flex-1">
                  <AutoResizeTextarea
                    value={ability}
                    onChange={(e) => updateListItem('special', idx, e.target.value)}
                    disabled={isReadOnly}
                    className="w-full bg-transparent border-none outline-none text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Nouvelle aptitude"
                  />
                </Box>
                {!isReadOnly && (
                  <Button variant="small" onClick={() => removeListItem('special', idx)}>
                    ×
                  </Button>
                )}
              </div>
            ))}
            {!isReadOnly && (
              <Button variant="small" onClick={() => addListItem('special')} className="w-full mt-1.5">
                + Ajouter une aptitude
              </Button>
            )}
          </div>

          {/* Actions */}
          <SectionHeader className="mt-3">Actions</SectionHeader>
          <div className="mt-1.5">
            {npc.actions.map((action, idx) => (
              <div key={idx} className="flex items-start gap-1.5 mb-1.5">
                <Box className="flex-1">
                  <AutoResizeTextarea
                    value={action}
                    onChange={(e) => updateListItem('actions', idx, e.target.value)}
                    disabled={isReadOnly}
                    className="w-full bg-transparent border-none outline-none text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Nouvelle action"
                  />
                </Box>
                {!isReadOnly && (
                  <Button variant="small" onClick={() => removeListItem('actions', idx)}>
                    ×
                  </Button>
                )}
              </div>
            ))}
            {!isReadOnly && (
              <Button variant="small" onClick={() => addListItem('actions')} className="w-full mt-1.5">
                + Ajouter une action
              </Button>
            )}
          </div>
        </PaperContainer>
        </div>

        {/* Image Cropper Modal */}
        <ImageCropperModal
          isOpen={isCropperOpen}
          imageSrc={selectedImageSrc}
          onClose={handleCropperClose}
          onSave={handleCropperSave}
          aspectRatio={PORTRAIT_ASPECT_RATIO}
        />
      </div>
    </div>
  )
}
