import { AutoResizeTextarea, SectionHeader } from '@/components/ui'
import { AttacksSection } from '@/features/character-sheet/AttacksSection'
import { ClassFeaturesSection } from '@/features/character-sheet/ClassFeaturesSection'
import { ConditionsSection } from '@/features/character-sheet/ConditionsSection'
import { SkillsSavesSection } from '@/features/character-sheet/SkillsSavesSection'
import { TraitsFeatsSection } from '@/features/character-sheet/TraitsFeatsSection'
import { VitalsSection } from '@/features/character-sheet/VitalsSection'
import type { Character } from '@/types/character'

type UpdateField = <K extends keyof Character>(field: K, value: Character[K]) => void

type CoreTabProps = {
  character: Character
  proficiencyBonus: number
  initiativeTotal: number
  effectiveHpMax: number
  constitutionMod: number
  onUpdateField: UpdateField
}

export function CoreTab({
  character,
  proficiencyBonus,
  initiativeTotal,
  effectiveHpMax,
  constitutionMod,
  onUpdateField,
}: CoreTabProps) {
  const formatSigned = (value: number) => (value >= 0 ? `+${value}` : `${value}`)

  const getProficiencyLabel = (value: number) => {
    if (value === 1) return 'M'
    if (value === 2) return 'E'
    return ''
  }

  const getProficiencyBadgeClasses = (value: number) => {
    if (value === 1) {
      return 'border-black bg-gray-200 text-black font-bold'
    }
    if (value === 2) {
      return 'border-black bg-black text-white font-bold'
    }
    return 'border-gray-300 text-transparent'
  }

  return (
    <div className="mt-3 grid grid-cols-12 gap-6">
      <SkillsSavesSection
        abilities={character.abilities}
        saves={character.saves}
        skills={character.skills}
        proficiencyBonus={proficiencyBonus}
        formatSigned={formatSigned}
        getProficiencyLabel={getProficiencyLabel}
        getProficiencyBadgeClasses={getProficiencyBadgeClasses}
        onAbilitiesChange={(next) => onUpdateField('abilities', next)}
        onSavesChange={(next) => onUpdateField('saves', next)}
        onSkillsChange={(next) => onUpdateField('skills', next)}
      />

      <div className="col-span-10 pl-4">
        <VitalsSection
          ac={character.ac}
          initMisc={character.initMisc}
          initiativeTotalLabel={formatSigned(initiativeTotal)}
          speed={character.speed}
          hpCurrent={character.hpCurrent}
          effectiveHpMax={effectiveHpMax}
          hpMaxOverride={character.hpMaxOverride}
          tempHp={character.tempHp}
          hitDiceType={character.hitDiceType}
          level={character.level}
          constitutionMod={constitutionMod}
          onAcChange={(value) => onUpdateField('ac', value)}
          onInitMiscChange={(value) => onUpdateField('initMisc', value)}
          onSpeedChange={(value) => onUpdateField('speed', value)}
          onHpCurrentChange={(value) => onUpdateField('hpCurrent', value)}
          onHpMaxOverrideChange={(value) => onUpdateField('hpMaxOverride', value)}
          onTempHpChange={(value) => onUpdateField('tempHp', value)}
          onHitDiceTypeChange={(value) => onUpdateField('hitDiceType', value)}
        />

        <ConditionsSection
          savingThrowAdvantages={character.savingThrowAdvantages}
          savingThrowDisadvantages={character.savingThrowDisadvantages}
          conditions={character.conditions}
          onSavingThrowAdvantagesChange={(value) =>
            onUpdateField('savingThrowAdvantages', value)
          }
          onSavingThrowDisadvantagesChange={(value) =>
            onUpdateField('savingThrowDisadvantages', value)
          }
          onConditionsChange={(value) => onUpdateField('conditions', value)}
        />

        <AttacksSection
          attacks={character.attacks}
          abilities={character.abilities}
          proficiencyBonus={proficiencyBonus}
          formatSigned={formatSigned}
          getProficiencyLabel={getProficiencyLabel}
          getProficiencyBadgeClasses={getProficiencyBadgeClasses}
          onAttacksChange={(next) => onUpdateField('attacks', next)}
        />

        <ClassFeaturesSection
          characterClass={character.class}
          subclass={character.subclass}
          level={character.level}
          abilities={character.abilities}
          proficiencyBonus={proficiencyBonus}
          classFeatures={character.classFeatures}
          onClassFeaturesChange={(next) => onUpdateField('classFeatures', next)}
        />

        <TraitsFeatsSection
          speciesTraits={character.speciesTraits}
          feats={character.feats}
          onSpeciesTraitsChange={(next) => onUpdateField('speciesTraits', next)}
          onFeatsChange={(next) => onUpdateField('feats', next)}
        />

        <div className="mt-3 border border-[#c9b89c] bg-white/60 rounded p-2 shadow-sm h-auto">
          <SectionHeader>Maîtrises Additionnelles</SectionHeader>
          <AutoResizeTextarea
            value={character.proficienciesText}
            onChange={(e) => onUpdateField('proficienciesText', e.target.value)}
            className="mt-1"
            placeholder="Armures, armes, outils..."
          />
        </div>
      </div>
    </div>
  )
}
