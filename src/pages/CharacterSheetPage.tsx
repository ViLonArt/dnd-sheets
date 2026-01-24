import { useRef, useState } from 'react'
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
import { CharacterHeaderSection } from '@/features/character-sheet/CharacterHeaderSection'
import { CharacterTabs } from '@/features/character-sheet/CharacterTabs'
import { CharacterToolbar } from '@/features/character-sheet/CharacterToolbar'
import { CoreTab } from '@/features/character-sheet/CoreTab'
import { InventoryTab } from '@/features/character-sheet/InventoryTab'
import { PortraitCropper } from '@/features/character-sheet/PortraitCropper'
import { SpellsTab } from '@/features/character-sheet/SpellsTab'
import { ErrorBanner, PaperContainer } from '@/components/ui'

export default function CharacterSheetPage() {
  const sheetRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const { character, updateField, updateCharacter, handleExport, handleImport, reset } = useCharacterForm()
  const { exportToPdf, exportToPng, isExporting } = useExportToImage()
  const PORTRAIT_ASPECT_RATIO = 160 / 220
  const [activeTab, setActiveTab] = useState<'core' | 'spells' | 'inventory'>('core')

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
    isUploadingImage,
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
    user,
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

  const { addSpell, updateSpell, removeSpell, updateSpellSlot } = useSpellsActions({
    character,
    updateField,
    updateCharacter,
    currentMaxSlots,
    baseSlotTotals,
  })

  return (
    <div className="min-h-screen p-5 bg-gray-200">
      <div className="max-w-[1100px] mx-auto flex flex-col gap-3">
        <CharacterToolbar
          isExporting={isExporting}
          onExport={handleExportClick}
          onImportFile={handleFileChange}
          onReset={handleReset}
          onDownloadPdf={handleDownloadPdf}
          onDownloadPng={handleDownloadPng}
        />

        {error && <ErrorBanner message={error} />}

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
