import { useMemo } from 'react'
import type { AbilityKey } from '@/types/abilities'
import { parseAbilityScore, calculateAbilityModifier } from '@/types/abilities'

interface AbilityBlockProps {
  ability: AbilityKey
  label: string
  value: string
  onChange: (value: string) => void
  proficiencyBonus: number
  skillProficiencies: Record<string, boolean>
  skills: Array<{ key: string; label: string; ability: AbilityKey }>
}

export function AbilityBlock({
  ability,
  label,
  value,
  onChange,
  proficiencyBonus,
  skillProficiencies,
  skills,
}: AbilityBlockProps) {
  const abilityScore = useMemo(() => parseAbilityScore(value), [value])
  const abilityModifier = useMemo(
    () => calculateAbilityModifier(abilityScore),
    [abilityScore]
  )

  const relevantSkills = skills.filter((s) => s.ability === ability)

  return (
    <div className="border border-[#c9b89c] bg-white/35 p-1.5">
      <div className="border border-[#c9b89c] bg-white/60 px-1.5 py-1 grid grid-cols-[1fr_auto] items-center text-[13px]">
        <div className="font-display text-ink text-xs uppercase">{label}</div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="text-right font-semibold bg-transparent border-none outline-none focus:underline text-xs"
          placeholder="10 (+0)"
        />
      </div>
      {relevantSkills.length > 0 && (
        <div className="mt-1 text-[11px]">
          {relevantSkills.map((skill) => {
            const isProficient = skillProficiencies[skill.key] || false
            const bonus = abilityModifier + (isProficient ? proficiencyBonus : 0)
            return (
              <div key={skill.key} className="flex items-center gap-1 mb-0.5">
                <input
                  type="checkbox"
                  checked={isProficient}
                  onChange={() => {
                    // This will be handled by parent
                  }}
                  className="w-2.5 h-2.5"
                />
                <span className="flex-1">{skill.label}</span>
                <span className="min-w-[30px] text-right font-semibold">
                  {bonus >= 0 ? '+' : ''}{bonus}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

