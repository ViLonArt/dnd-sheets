import { useRef, useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  useCharacterForm,
  useCharacterSheetActions,
  useClassSelection,
  useDerivedStats,
  useExportToImage,
  useSpellsActions,
  useSpellcastingStats,
  useSpellSlotTotals,
} from '@/hooks'
import { useAuth } from '@/contexts/AuthContext'
import {
  createCharacterSheet,
  getCharacterSheet,
  updateCharacterSheet,
  uploadImage,
  dataURLtoFile,
} from '@/services/sheetService'
import { CharacterHeaderSection } from '@/features/character-sheet/CharacterHeaderSection'
import { CharacterTabs } from '@/features/character-sheet/CharacterTabs'
import { CharacterToolbar } from '@/features/character-sheet/CharacterToolbar'
import { CoreTab } from '@/features/character-sheet/CoreTab'
import { InventoryTab } from '@/features/character-sheet/InventoryTab'
import { PortraitCropper } from '@/features/character-sheet/PortraitCropper'
import { SpellsTab } from '@/features/character-sheet/SpellsTab'
import { ErrorBanner, PaperContainer } from '@/components/ui'
import type { Character } from '@/types/character'

export default function CharacterSheetPage() {
  const { id } = useParams<{ id: string }>()
  const sheetRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const [sheetId, setSheetId] = useState<string | null>(null)
  const [initialCharacterData, setInitialCharacterData] = useState<Character | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const { character, updateField, updateCharacter, handleExport, handleImport, reset } =
    useCharacterForm(initialCharacterData)
  const { exportToPdf, exportToPng, isExporting } = useExportToImage()
  const PORTRAIT_ASPECT_RATIO = 160 / 220
  const [activeTab, setActiveTab] = useState<'core' | 'spells' | 'inventory'>('core')
  const isNew = !id || id === 'new'

  const { proficiencyBonus, constitutionMod, effectiveHpMax, initiativeTotal } = useDerivedStats({
    level: character.level,
    abilities: character.abilities,
    hitDiceType: character.hitDiceType,
    hpMaxOverride: character.hpMaxOverride,
    initMisc: character.initMisc,
  })

  const { baseSlotTotals, currentMaxSlots } = useSpellSlotTotals({
    characterClass: character.class,
    subclass: character.subclass,
    level: character.level,
    slotOverrides: character.slotOverrides,
  })

  const { classOptions, subclassOptions, handleClassChange } = useClassSelection({
    characterClass: character.class,
    subclass: character.subclass,
    updateCharacter,
  })

  const { spellDC, spellAttackBonus } = useSpellcastingStats({
    spellcastingAttribute: character.spellcastingAttribute,
    abilities: character.abilities,
    proficiencyBonus,
  })

  const {
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
  } = useCharacterSheetActions({
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
  })

  const { addSpell, updateSpell, removeSpell, updateSpellSlot, reorderSpells } = useSpellsActions({
    character,
    updateField,
    updateCharacter,
    currentMaxSlots,
    baseSlotTotals,
  })

  useEffect(() => {
    const loadSheet = async () => {
      if (isNew || !id) {
        setSheetId(null)
        setInitialCharacterData(undefined)
        setSaveError(null)
        return
      }

      setIsLoading(true)
      setSaveError(null)
      try {
        const sheet = await getCharacterSheet(id)
        setSheetId(sheet.id)
        setInitialCharacterData(sheet.data as Character)
      } catch (err) {
        console.error('Failed to load character sheet:', err)
        setSaveError(err instanceof Error ? err.message : 'Failed to load character sheet')
        setInitialCharacterData(undefined)
      } finally {
        setIsLoading(false)
      }
    }

    loadSheet()
  }, [id, isNew])

  const uploadPortraitIfNeeded = async (currentCharacter: Character) => {
    const portrait = currentCharacter.portrait
    if (!portrait || !portrait.startsWith('data:image/')) {
      return currentCharacter
    }

    setIsUploadingImage(true)
    try {
      const file = dataURLtoFile(portrait, 'portrait.png')
      const slug = currentCharacter.name
        ? currentCharacter.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 20)
        : 'character'
      const publicUrl = await uploadImage(file, slug)
      updateField('portrait', publicUrl)
      updateField('portraitState', { zoom: 1, offsetX: 0, offsetY: 0 })
      return {
        ...currentCharacter,
        portrait: publicUrl,
        portraitState: { zoom: 1, offsetX: 0, offsetY: 0 },
      }
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleSave = async () => {
    if (!user) {
      alert('You must be logged in to save sheets')
      return
    }

    setIsSaving(true)
    setSaveError(null)
    try {
      const characterToSave = await uploadPortraitIfNeeded(character)
      if (sheetId) {
        await updateCharacterSheet(sheetId, characterToSave)
        alert('Sheet saved successfully!')
      } else {
        const result = await createCharacterSheet(characterToSave)
        setSheetId(result.id)
        window.history.replaceState({}, '', `/character/${result.id}`)
        alert('Sheet saved successfully!')
      }
    } catch (err) {
      console.error('Failed to save character sheet:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to save character sheet'
      setSaveError(errorMessage)
      alert(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const combinedError = saveError || error

  return (
    <div className="min-h-screen p-5 bg-gray-200">
      <div className="max-w-[1100px] mx-auto flex flex-col gap-3">
        <CharacterToolbar
          isExporting={isExporting}
          isSaving={isSaving}
          onExport={handleExportClick}
          onImportFile={handleFileChange}
          onReset={handleReset}
          onDownloadPdf={handleDownloadPdf}
          onDownloadPng={handleDownloadPng}
          onSave={handleSave}
        />

        {combinedError && <ErrorBanner message={combinedError} />}

        {isLoading && (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
            Loading sheet...
          </div>
        )}

        <div ref={sheetRef}>
          <PaperContainer>
          <CharacterHeaderSection
            name={character.name}
            characterClass={character.class}
            subclass={character.subclass}
            level={character.level}
            background={character.background}
            race={character.race}
            alignment={character.alignment}
            xp={character.xp}
            portraitUrl={character.portrait}
            isUploadingImage={isUploadingImage}
            classOptions={classOptions}
            subclassOptions={subclassOptions}
            onNameChange={(value) => updateField('name', value)}
            onClassChange={handleClassChange}
            onSubclassChange={(value) => updateField('subclass', value)}
            onLevelChange={(value) => updateField('level', value)}
            onBackgroundChange={(value) => updateField('background', value)}
            onRaceChange={(value) => updateField('race', value)}
            onAlignmentChange={(value) => updateField('alignment', value)}
            onXpChange={(value) => updateField('xp', value)}
            onShortRest={handleShortRest}
            onLongRest={handleLongRest}
            onPortraitSelected={handlePortraitSelected}
            onPortraitDelete={handlePortraitDelete}
          />

          <CharacterTabs activeTab={activeTab} onTabChange={setActiveTab} />

          {activeTab === 'core' && (
            <CoreTab
              character={character}
              proficiencyBonus={proficiencyBonus}
              initiativeTotal={initiativeTotal}
              effectiveHpMax={effectiveHpMax}
              constitutionMod={constitutionMod}
              onUpdateField={updateField}
            />
          )}
          </PaperContainer>

          {activeTab === 'spells' && (
            <SpellsTab
              characterClass={character.class}
              subclass={character.subclass}
              level={character.level}
              spellSlots={character.spellSlots}
              spells={character.spells}
              spellcastingAttribute={character.spellcastingAttribute}
              spellDC={spellDC}
              spellAttackBonus={spellAttackBonus}
              currentMaxSlots={currentMaxSlots}
              onSpellcastingAttributeChange={(value) =>
                updateField('spellcastingAttribute', value)
              }
              onUpdateSpellSlot={updateSpellSlot}
              onAddSpell={addSpell}
              onUpdateSpell={updateSpell}
              onRemoveSpell={removeSpell}
              onReorderSpells={reorderSpells}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryTab
              inventory={character.inventory}
              biography={character.biography}
              backstory={character.backstory}
              onInventoryChange={(next) => updateField('inventory', next)}
              onBiographyChange={(value) => updateField('biography', value)}
              onBackstoryChange={(value) => updateField('backstory', value)}
            />
          )}
        </div>

        <PortraitCropper
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
