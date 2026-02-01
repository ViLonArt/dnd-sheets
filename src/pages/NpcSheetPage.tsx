import React, { useRef, useState, useEffect } from 'react'
import type { DragEvent } from 'react'
import { useParams } from 'react-router-dom'
import { useDragPreview, useNpcForm, useExportToImage } from '@/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { AuthButton } from '@/components/auth/AuthButton'
import { getSheet, createSheet, updateSheet, uploadImage, dataURLtoFile } from '@/services/sheetService'
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
import { NpcStatBlock } from '@/components/NpcStatBlock'
import { calculateAbilityModifier } from '@/types/abilities'
import { ABILITIES_ORDER, ABILITY_LABELS } from '@/features/character-sheet/constants'
import { cn } from '@/utils/cn'
import type { Npc } from '@/types/npc'

export default function NpcSheetPage() {
  const { id } = useParams<{ id: string }>()
  const sheetRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const portraitInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isCropperOpen, setIsCropperOpen] = useState(false)
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null)
  const [sheetId, setSheetId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [initialNpcData, setInitialNpcData] = useState<Npc | undefined>(undefined)
  const [draggingSkillIndex, setDraggingSkillIndex] = useState<number | null>(null)
  const [dragOverSkillIndex, setDragOverSkillIndex] = useState<number | null>(null)
  const [dragOverSkillEdge, setDragOverSkillEdge] = useState<'top' | 'bottom' | null>(null)
  const [draggingSpecialIndex, setDraggingSpecialIndex] = useState<number | null>(null)
  const [dragOverSpecialIndex, setDragOverSpecialIndex] = useState<number | null>(null)
  const [dragOverSpecialEdge, setDragOverSpecialEdge] = useState<'top' | 'bottom' | null>(null)
  const [draggingActionIndex, setDraggingActionIndex] = useState<number | null>(null)
  const [dragOverActionIndex, setDragOverActionIndex] = useState<number | null>(null)
  const [dragOverActionEdge, setDragOverActionEdge] = useState<'top' | 'bottom' | null>(null)
  const { setDragPreview, clearDragPreview } = useDragPreview()
  
  // Determine if this is a new sheet
  const isNew = !id || id === 'new'
  const [isEditing, setIsEditing] = useState(isNew)
  
  const { npc, updateField, handleExport, handleImport, reset } = useNpcForm(initialNpcData)
  const { exportToPdf, exportToPng, isExporting } = useExportToImage()

  // Portrait frame aspect ratio: 160x220 = ~0.727
  const PORTRAIT_ASPECT_RATIO = 160 / 220

  // Load sheet data from URL if id exists
  useEffect(() => {
    const loadSheet = async () => {
      if (!id) {
        setSheetId(null)
        setInitialNpcData(undefined) // Reset to blank sheet
        setIsEditing(true) // New sheet starts in edit mode
        return
      }

      setIsLoading(true)
      try {
        const sheet = await getSheet(id)
        setSheetId(sheet.id)

        // Set initial data to populate form
        if (sheet.data) {
          setInitialNpcData(sheet.data as Npc)
        } else {
          setInitialNpcData(undefined)
        }
        
        // Existing sheet starts in view mode
        setIsEditing(false)
      } catch (err) {
        console.error('Failed to load sheet:', err)
        setError(err instanceof Error ? err.message : 'Failed to load sheet')
        setInitialNpcData(undefined)
      } finally {
        setIsLoading(false)
      }
    }

    loadSheet()
  }, [id])

  // Save sheet to Supabase
  const handleSave = async () => {
    if (!user) {
      alert('You must be logged in to save sheets')
      return
    }

    try {
      setError(null)
      const npcToSave = await uploadPortraitIfNeeded(npc)
      if (sheetId) {
        // Update existing sheet
        await updateSheet(sheetId, npcToSave)
        alert('Sheet saved successfully!')
      } else {
        // Create new sheet
        const result = await createSheet(npcToSave)
        setSheetId(result.id)
        // Update URL without page reload
        window.history.replaceState({}, '', `/npc/${result.id}`)
        alert('Sheet saved successfully!')
      }
      // Return to view mode after successful save
      setIsEditing(false)
    } catch (err) {
      console.error('Failed to save sheet:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to save sheet'
      setError(errorMessage)
      alert(errorMessage)
    }
  }

  const uploadPortraitIfNeeded = async (currentNpc: Npc) => {
    const portrait = currentNpc.portrait
    if (!portrait || !portrait.startsWith('data:image/')) {
      return currentNpc
    }

    setIsUploadingImage(true)
    try {
      const file = dataURLtoFile(portrait, 'portrait.png')
      const slug = currentNpc.name
        ? currentNpc.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 20)
        : 'npc'
      const publicUrl = await uploadImage(file, slug)
      updateField('portrait', publicUrl)
      updateField('portraitState', { zoom: 1, offsetX: 0, offsetY: 0 })
      return {
        ...currentNpc,
        portrait: publicUrl,
        portraitState: { zoom: 1, offsetX: 0, offsetY: 0 },
      }
    } finally {
      setIsUploadingImage(false)
    }
  }

  // Handle ability score changes
  const handleAbilityChange = (ability: string, value: number) => {
    const score = Math.max(1, Math.min(30, value || 10))
    updateField('abilities', { ...npc.abilities, [ability]: score })
  }

  // Portrait handling with cropper
  const handlePortraitClick = () => {
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

  const handleCropperSave = async (croppedImageUrl: string) => {
    setError(null)

    try {
      updateField('portrait', croppedImageUrl)
      updateField('portraitState', { zoom: 1, offsetX: 0, offsetY: 0 })

      setSelectedImageSrc(null)
    } catch (err) {
      console.error('Failed to set portrait:', err)
      setError(err instanceof Error ? err.message : 'Failed to set portrait')
    }
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
    updateField(field, [...npc[field], ''])
  }

  const updateListItem = (field: 'skills' | 'special' | 'actions', index: number, value: string) => {
    const newList = [...npc[field]]
    newList[index] = value
    updateField(field, newList)
  }

  const removeListItem = (field: 'skills' | 'special' | 'actions', index: number) => {
    updateField(field, npc[field].filter((_, i) => i !== index))
  }

  const resetNpcDragState = (field: 'skills' | 'special' | 'actions') => {
    if (field === 'skills') {
      setDraggingSkillIndex(null)
      setDragOverSkillIndex(null)
      setDragOverSkillEdge(null)
      clearDragPreview()
      return
    }
    if (field === 'special') {
      setDraggingSpecialIndex(null)
      setDragOverSpecialIndex(null)
      setDragOverSpecialEdge(null)
      clearDragPreview()
      return
    }
    setDraggingActionIndex(null)
    setDragOverActionIndex(null)
    setDragOverActionEdge(null)
    clearDragPreview()
  }

  const reorderNpcList = (
    field: 'skills' | 'special' | 'actions',
    fromIndex: number,
    toIndex: number
  ) => {
    if (fromIndex === toIndex) return
    const next = [...npc[field]]
    const [moved] = next.splice(fromIndex, 1)
    if (!moved) return
    const insertIndex = fromIndex < toIndex ? Math.max(0, toIndex - 1) : toIndex
    next.splice(insertIndex, 0, moved)
    updateField(field, next)
  }

  const handleNpcDragStart =
    (field: 'skills' | 'special' | 'actions', index: number) =>
    (event: DragEvent<HTMLElement>) => {
      if (field === 'skills') {
        setDraggingSkillIndex(index)
        setDragOverSkillIndex(null)
        setDragOverSkillEdge(null)
      } else if (field === 'special') {
        setDraggingSpecialIndex(index)
        setDragOverSpecialIndex(null)
        setDragOverSpecialEdge(null)
      } else {
        setDraggingActionIndex(index)
        setDragOverActionIndex(null)
        setDragOverActionEdge(null)
      }
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', `${field}-${index}`)
      const previewTarget = event.currentTarget.closest('[data-drag-preview]') as HTMLElement | null
      setDragPreview(event, previewTarget)
    }

  const handleNpcDragOver =
    (field: 'skills' | 'special' | 'actions', index: number) =>
    (event: DragEvent<HTMLElement>) => {
      const draggingIndex =
        field === 'skills'
          ? draggingSkillIndex
          : field === 'special'
          ? draggingSpecialIndex
          : draggingActionIndex
      if (draggingIndex === null || draggingIndex === index) return
      event.preventDefault()
      const rect = event.currentTarget.getBoundingClientRect()
      const isTop = event.clientY - rect.top < rect.height / 2
      if (field === 'skills') {
        setDragOverSkillIndex(index)
        setDragOverSkillEdge(isTop ? 'top' : 'bottom')
      } else if (field === 'special') {
        setDragOverSpecialIndex(index)
        setDragOverSpecialEdge(isTop ? 'top' : 'bottom')
      } else {
        setDragOverActionIndex(index)
        setDragOverActionEdge(isTop ? 'top' : 'bottom')
      }
      event.dataTransfer.dropEffect = 'move'
    }

  const handleNpcDrop =
    (field: 'skills' | 'special' | 'actions', index: number) =>
    (event: DragEvent<HTMLElement>) => {
      event.preventDefault()
      const draggingIndex =
        field === 'skills'
          ? draggingSkillIndex
          : field === 'special'
          ? draggingSpecialIndex
          : draggingActionIndex
      const edge =
        field === 'skills'
          ? dragOverSkillEdge
          : field === 'special'
          ? dragOverSpecialEdge
          : dragOverActionEdge
      if (draggingIndex === null || draggingIndex === index) {
        resetNpcDragState(field)
        return
      }
      const insertIndex = edge === 'bottom' ? index + 1 : index
      reorderNpcList(field, draggingIndex, insertIndex)
      resetNpcDragState(field)
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
              {isEditing && (
                <>
                  <Button 
                    onClick={() => portraitInputRef.current?.click()}
                    disabled={isUploadingImage}
                  >
                    {isUploadingImage ? 'Téléchargement...' : 'Choisir un portrait'}
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
              {isEditing ? (
                <>
                  <Button onClick={handleImportClick}>Importer une fiche</Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button onClick={() => setIsEditing(false)} variant="small">
                    Cancel
                  </Button>
                  <Button onClick={handleSave} variant="small">
                    Save
                  </Button>
                  <Button onClick={handleReset} variant="small">
                    Reset
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={() => setIsEditing(true)} variant="small">
                    Edit
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

        {isUploadingImage && (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
            Uploading image...
          </div>
        )}

        <div ref={sheetRef}>
          {isEditing ? (
            <PaperContainer>
          <div className="flex justify-between items-start gap-3">
            {/* Header with Name, Type, Description */}
            <div className="flex-1">
              <Heading
                as="h1"
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => updateField('name', e.currentTarget.textContent || '')}
                className="mb-1"
              >
                {npc.name || 'Nom du Monstre'}
              </Heading>
              <Heading
                as="h2"
                size="sm"
                className="italic text-sm mb-1.5 font-normal"
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => updateField('type', e.currentTarget.textContent || '')}
              >
                {npc.type || 'Humanoïde (Humain), Neutre Mauvais'}
              </Heading>
              <textarea
                value={npc.description}
                onChange={(e) => updateField('description', e.target.value)}
                className="w-full bg-transparent border-none outline-none font-body text-sm resize-none"
                placeholder="Une courte description ou accroche."
                rows={3}
              />
            </div>

            {/* Portrait */}
            <div
              className={cn(
                "w-[160px] h-[220px] bg-gradient-to-br from-[#d2b48c] via-paper to-[#c9ad8f] border-2 border-dashed border-ink flex items-center justify-center text-ink font-display text-sm uppercase overflow-hidden relative cursor-pointer",
                isUploadingImage && "opacity-50 cursor-wait"
              )}
              onClick={handlePortraitClick}
            >
              {isUploadingImage ? (
                <span className="text-xs">Uploading...</span>
              ) : npc.portrait ? (
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
            editable
            onValueChange={(value) => updateField('ca', value)}
          />
          <PropertyLine
            label="Points de Vie"
            value={npc.pv}
            editable
            onValueChange={(value) => updateField('pv', value)}
          />
          <PropertyLine
            label="Vitesse"
            value={npc.speed}
            editable
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
                      className="text-[15px] w-full bg-transparent border border-[#bda68a] rounded px-1 py-0.5 text-center focus:border-ink focus:outline-none font-bold"
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
              <div
                key={idx}
                data-drag-preview
                className={`flex items-start gap-1.5 mb-1.5 ${
                  dragOverSkillIndex === idx && dragOverSkillEdge === 'top'
                    ? 'border-t-2 border-t-[#7a4b36]'
                    : dragOverSkillIndex === idx && dragOverSkillEdge === 'bottom'
                      ? 'border-b-2 border-b-[#7a4b36]'
                      : ''
                } ${draggingSkillIndex === idx ? 'opacity-60' : ''}`}
                onDragOver={handleNpcDragOver('skills', idx)}
                onDrop={handleNpcDrop('skills', idx)}
                onDragLeave={() => {
                  if (dragOverSkillIndex === idx) {
                    setDragOverSkillIndex(null)
                    setDragOverSkillEdge(null)
                  }
                }}
              >
                <span
                  role="button"
                  aria-label="Réordonner la compétence"
                  draggable
                  onDragStart={handleNpcDragStart('skills', idx)}
                  onDragEnd={() => resetNpcDragState('skills')}
                  className="text-xs text-[#7a4b36] cursor-grab select-none mt-1"
                >
                  ⋮⋮
                </span>
                <Box className="flex-1">
                  <input
                    type="text"
                    value={skill}
                    onChange={(e) => updateListItem('skills', idx, e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-xs"
                    placeholder="Nouvelle compétence / JS"
                  />
                </Box>
                <Button variant="small" onClick={() => removeListItem('skills', idx)}>
                  ×
                </Button>
              </div>
            ))}
            <Button variant="small" onClick={() => addListItem('skills')} className="w-full mt-1.5">
              + Ajouter une ligne
            </Button>
          </div>

          {/* Special Abilities */}
          <SectionHeader className="mt-3">Aptitudes spéciales / Comportement</SectionHeader>
          <div className="mt-1.5">
            {npc.special.map((ability, idx) => (
              <div
                key={idx}
                data-drag-preview
                className={`flex items-start gap-1.5 mb-1.5 ${
                  dragOverSpecialIndex === idx && dragOverSpecialEdge === 'top'
                    ? 'border-t-2 border-t-[#7a4b36]'
                    : dragOverSpecialIndex === idx && dragOverSpecialEdge === 'bottom'
                      ? 'border-b-2 border-b-[#7a4b36]'
                      : ''
                } ${draggingSpecialIndex === idx ? 'opacity-60' : ''}`}
                onDragOver={handleNpcDragOver('special', idx)}
                onDrop={handleNpcDrop('special', idx)}
                onDragLeave={() => {
                  if (dragOverSpecialIndex === idx) {
                    setDragOverSpecialIndex(null)
                    setDragOverSpecialEdge(null)
                  }
                }}
              >
                <span
                  role="button"
                  aria-label="Réordonner l'aptitude"
                  draggable
                  onDragStart={handleNpcDragStart('special', idx)}
                  onDragEnd={() => resetNpcDragState('special')}
                  className="text-xs text-[#7a4b36] cursor-grab select-none mt-1"
                >
                  ⋮⋮
                </span>
                <Box className="flex-1">
                  <AutoResizeTextarea
                    value={ability}
                    onChange={(e) => updateListItem('special', idx, e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-xs"
                    placeholder="Nouvelle aptitude"
                  />
                </Box>
                <Button variant="small" onClick={() => removeListItem('special', idx)}>
                  ×
                </Button>
              </div>
            ))}
            <Button variant="small" onClick={() => addListItem('special')} className="w-full mt-1.5">
              + Ajouter une aptitude
            </Button>
          </div>

          {/* Actions */}
          <SectionHeader className="mt-3">Actions</SectionHeader>
          <div className="mt-1.5">
            {npc.actions.map((action, idx) => (
              <div
                key={idx}
                data-drag-preview
                className={`flex items-start gap-1.5 mb-1.5 ${
                  dragOverActionIndex === idx && dragOverActionEdge === 'top'
                    ? 'border-t-2 border-t-[#7a4b36]'
                    : dragOverActionIndex === idx && dragOverActionEdge === 'bottom'
                      ? 'border-b-2 border-b-[#7a4b36]'
                      : ''
                } ${draggingActionIndex === idx ? 'opacity-60' : ''}`}
                onDragOver={handleNpcDragOver('actions', idx)}
                onDrop={handleNpcDrop('actions', idx)}
                onDragLeave={() => {
                  if (dragOverActionIndex === idx) {
                    setDragOverActionIndex(null)
                    setDragOverActionEdge(null)
                  }
                }}
              >
                <span
                  role="button"
                  aria-label="Réordonner l'action"
                  draggable
                  onDragStart={handleNpcDragStart('actions', idx)}
                  onDragEnd={() => resetNpcDragState('actions')}
                  className="text-xs text-[#7a4b36] cursor-grab select-none mt-1"
                >
                  ⋮⋮
                </span>
                <Box className="flex-1">
                  <AutoResizeTextarea
                    value={action}
                    onChange={(e) => updateListItem('actions', idx, e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-xs"
                    placeholder="Nouvelle action"
                  />
                </Box>
                <Button variant="small" onClick={() => removeListItem('actions', idx)}>
                  ×
                </Button>
              </div>
            ))}
            <Button variant="small" onClick={() => addListItem('actions')} className="w-full mt-1.5">
              + Ajouter une action
            </Button>
          </div>
        </PaperContainer>
          ) : (
            <NpcStatBlock npc={npc} onEdit={() => setIsEditing(true)} />
          )}
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
