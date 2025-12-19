import React, { useRef, useState } from 'react'
import { useNpcForm, useExportToImage } from '@/hooks'
import {
  PaperContainer,
  Heading,
  Button,
  SectionHeader,
  PropertyLine,
  Box,
  Toolbar,
  Divider,
} from '@/components/ui'
import { ImageCropperModal } from '@/components/ImageCropperModal'
import { calculateAbilityModifier } from '@/types/abilities'
import { ABILITIES_ORDER, ABILITY_LABELS } from '@/features/character-sheet/constants'

export default function NpcSheetPage() {
  const sheetRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const portraitInputRef = useRef<HTMLInputElement>(null)
  const { npc, updateField, handleExport, handleImport, reset } = useNpcForm()
  const { exportToPdf, isExporting } = useExportToImage()
  const [error, setError] = useState<string | null>(null)
  const [isCropperOpen, setIsCropperOpen] = useState(false)
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null)

  // Portrait frame aspect ratio: 160x220 = ~0.727
  const PORTRAIT_ASPECT_RATIO = 160 / 220

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
          }
          right={
            <>
              <Button onClick={handleExportClick}>Exporter la fiche (JSON)</Button>
              <Button onClick={handleImportClick}>Importer une fiche</Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button onClick={handleReset} variant="small">
                Reset
              </Button>
            </>
          }
        />

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div ref={sheetRef}>
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
              className="w-[160px] h-[220px] bg-gradient-to-br from-[#d2b48c] via-paper to-[#c9ad8f] border-2 border-dashed border-ink flex items-center justify-center text-ink font-display text-sm uppercase overflow-hidden relative cursor-pointer"
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
              <div key={idx} className="flex items-start gap-1.5 mb-1.5">
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
              <div key={idx} className="flex items-start gap-1.5 mb-1.5">
                <Box className="flex-1">
                  <input
                    type="text"
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
              <div key={idx} className="flex items-start gap-1.5 mb-1.5">
                <Box className="flex-1">
                  <input
                    type="text"
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
