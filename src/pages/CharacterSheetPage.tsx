import { useRef, useState, useEffect, useCallback } from 'react'
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
import { LevelUpWizard } from '@/features/character-sheet/LevelUpWizard'
import { CharacterCreationWizard } from '@/features/character-sheet/CharacterCreationWizard'
import { PortraitCropper } from '@/features/character-sheet/PortraitCropper'
import { SpellsTab } from '@/features/character-sheet/SpellsTab'
import { ErrorBanner, PaperContainer } from '@/components/ui'
import type { Character } from '@/types/character'
import type { SpellLocale } from '@/utils/spellLocale'
import { translateSpellToLocale } from '@/utils/spellTranslation'
import { t } from '@/utils'

const SPELL_LOCALE_STORAGE_KEY = 'dnd-sheets:spell-locale'

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
  const [spellLocale, setSpellLocale] = useState<SpellLocale>('en')
  const [isLevelUpOpen, setIsLevelUpOpen] = useState(false)
  const [isCreationWizardOpen, setIsCreationWizardOpen] = useState(false)
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

  const { addSpell, updateSpell, removeSpell, updateSpellSlot, reorderSpells, replaceSpells } =
    useSpellsActions({
    character,
    updateField,
    updateCharacter,
    currentMaxSlots,
    baseSlotTotals,
    })

  const applySpellLocale = useCallback(
    (nextLocale: SpellLocale, spellList: Character['spells']) => {
      let hasChanges = false
      const nextSpells = spellList.map((spell) => {
        const translated = translateSpellToLocale(spell, nextLocale)
        if (translated) {
          hasChanges = true
          return translated
        }
        return spell
      })
      if (hasChanges) {
        replaceSpells(nextSpells)
      }
    },
    [replaceSpells]
  )

  const handleSpellLocaleChange = useCallback(
    (nextLocale: SpellLocale) => {
      setSpellLocale(nextLocale)
      applySpellLocale(nextLocale, character.spells)
    },
    [applySpellLocale, character.spells]
  )

  const uiLocale = 'fr'

  const handleApplyLevelUp = useCallback(
    (nextCharacter: Character) => {
      updateCharacter(nextCharacter)
    },
    [updateCharacter]
  )

  const handleCreationWizardComplete = useCallback(
    (nextCharacter: Character) => {
      updateCharacter(nextCharacter)
      setIsCreationWizardOpen(false)
    },
    [updateCharacter]
  )

  useEffect(() => {
    const stored =
      typeof window !== 'undefined'
        ? window.localStorage.getItem(SPELL_LOCALE_STORAGE_KEY)
        : null
    if (stored === 'en' || stored === 'fr') {
      setSpellLocale(stored)
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SPELL_LOCALE_STORAGE_KEY, spellLocale)
    }
  }, [spellLocale])

  useEffect(() => {
    applySpellLocale(spellLocale, character.spells)
  }, [spellLocale, character.spells, applySpellLocale])

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
          spellLocale={spellLocale}
          onSpellLocaleChange={handleSpellLocaleChange}
          onExport={handleExportClick}
          onImportFile={handleFileChange}
          onReset={handleReset}
          onDownloadPdf={handleDownloadPdf}
          onDownloadPng={handleDownloadPng}
          onSave={handleSave}
          onCreateWithWizard={isNew ? () => setIsCreationWizardOpen(true) : undefined}
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
            onLevelUp={() => setIsLevelUpOpen(true)}
            levelUpLabel={t('ui.levelUp.title', uiLocale)}
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
              spellLocale={spellLocale}
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

        <LevelUpWizard
          isOpen={isLevelUpOpen}
          character={character}
          locale={uiLocale}
          onApply={handleApplyLevelUp}
          onClose={() => setIsLevelUpOpen(false)}
        />
        <CharacterCreationWizard
          isOpen={isCreationWizardOpen}
          locale={uiLocale}
          onComplete={handleCreationWizardComplete}
          onClose={() => setIsCreationWizardOpen(false)}
        />
      </div>
    </div>
  )
}
