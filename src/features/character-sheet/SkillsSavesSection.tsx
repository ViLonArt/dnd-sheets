import { Box, FieldLabel, SectionHeader } from '@/components/ui'
import { ABILITIES_ORDER, SKILL_DATA } from '@/features/character-sheet/constants'
import {
  calculateAbilityModifier,
  type AbilityKey,
  type Abilities,
  type SavingThrowProficiencies,
  type SkillKey,
  type SkillProficiencies,
} from '@/types/abilities'

const ABILITY_NAMES_FR: Record<AbilityKey, string> = {
  str: 'Force',
  dex: 'Dextérité',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Sagesse',
  cha: 'Charisme',
}

type SkillsSavesSectionProps = {
  abilities: Abilities
  saves: SavingThrowProficiencies
  skills: SkillProficiencies
  proficiencyBonus: number
  formatSigned: (value: number) => string
  getProficiencyLabel: (value: number) => string
  getProficiencyBadgeClasses: (value: number) => string
  onAbilitiesChange: (next: Abilities) => void
  onSavesChange: (next: SavingThrowProficiencies) => void
  onSkillsChange: (next: SkillProficiencies) => void
}

export function SkillsSavesSection({
  abilities,
  saves,
  skills,
  proficiencyBonus,
  formatSigned,
  getProficiencyLabel,
  getProficiencyBadgeClasses,
  onAbilitiesChange,
  onSavesChange,
  onSkillsChange,
}: SkillsSavesSectionProps) {
  const handleAbilityChange = (ability: AbilityKey, value: number) => {
    const score = Math.max(1, Math.min(30, value || 10))
    onAbilitiesChange({ ...abilities, [ability]: score })
  }

  const getSkillBonus = (skillKey: SkillKey) => {
    const skill = SKILL_DATA.find((s) => s.key === skillKey)
    if (!skill) return 0
    const abilityScore = abilities[skill.ability]
    const abilityMod = calculateAbilityModifier(abilityScore)
    const proficiencyLevel = skills[skillKey] || 0
    return abilityMod + proficiencyBonus * proficiencyLevel
  }

  const getSavingThrowBonus = (ability: AbilityKey) => {
    const abilityMod = calculateAbilityModifier(abilities[ability])
    return abilityMod + (saves[ability] ? proficiencyBonus : 0)
  }

  const cycleSkillProficiency = (skillKey: SkillKey) => {
    const current = skills[skillKey] || 0
    const nextValue = current === 2 ? 0 : ((current + 1) as 0 | 1 | 2)
    onSkillsChange({ ...skills, [skillKey]: nextValue })
  }

  return (
    <div className="col-span-2 min-w-[180px] pr-4 border-r border-[#c9b89c]">
      <SectionHeader>Caractéristiques</SectionHeader>
      <div className="mt-1 flex items-center gap-2">
        <FieldLabel>Bonus de Maîtrise</FieldLabel>
        <Box className="bg-white/60 text-center font-semibold">+{proficiencyBonus}</Box>
      </div>
      <div className="flex flex-col gap-2 mt-1.5">
        {ABILITIES_ORDER.map((ability) => {
          const abilitySkills = SKILL_DATA.filter((skill) => skill.ability === ability)
          return (
            <div key={ability} className="border border-[#c9b89c] bg-white/35 p-0.5">
              <div className="border border-[#c9b89c] bg-white/60 px-1 py-0.5 flex items-center gap-1 text-[12px] overflow-hidden">
                <div className="font-display text-ink text-[11px] uppercase flex-1 truncate">
                  {ABILITY_NAMES_FR[ability]}
                </div>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={abilities[ability]}
                  onChange={(e) =>
                    handleAbilityChange(ability, parseInt(e.target.value) || 10)
                  }
                  className="w-10 text-center font-semibold bg-transparent border border-[#bda68a] rounded px-1 py-0.5 text-[11px] focus:border-ink focus:outline-none shrink-0"
                  placeholder="10"
                />
                <div className="text-right font-semibold text-[11px] min-w-[28px] shrink-0">
                  {formatSigned(calculateAbilityModifier(abilities[ability]))}
                </div>
              </div>
              <div className="mt-1 flex items-center gap-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => onSavesChange({ ...saves, [ability]: !saves[ability] })}
                  className={`w-6 h-6 rounded-full border flex items-center justify-center ${getProficiencyBadgeClasses(
                    saves[ability] ? 1 : 0
                  )}`}
                  title={saves[ability] ? 'Maîtrise' : 'Non maîtrisé'}
                >
                  {getProficiencyLabel(saves[ability] ? 1 : 0)}
                </button>
                <span>Jet {formatSigned(getSavingThrowBonus(ability))}</span>
              </div>
              {abilitySkills.length > 0 && (
                <div className="mt-1 text-[10px]">
                  {abilitySkills.map((skill) => {
                    const proficiencyLevel = skills[skill.key] || 0
                    const bonus = getSkillBonus(skill.key)
                    return (
                      <div key={skill.key} className="flex items-center gap-1 mb-0.5">
                        <button
                          type="button"
                          onClick={() => cycleSkillProficiency(skill.key)}
                          className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] ${getProficiencyBadgeClasses(
                            proficiencyLevel
                          )}`}
                          title={
                            proficiencyLevel === 2
                              ? 'Expertise'
                              : proficiencyLevel === 1
                              ? 'Maîtrise'
                              : 'Non maîtrisé'
                          }
                        >
                          {getProficiencyLabel(proficiencyLevel)}
                        </button>
                        <span className="flex-1 truncate">{skill.label}</span>
                        <span className="min-w-[24px] text-right font-semibold">
                          {formatSigned(bonus)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
