import { AutoResizeTextarea, SectionHeader } from '@/components/ui'

type ConditionsSectionProps = {
  savingThrowAdvantages: string
  savingThrowDisadvantages: string
  conditions: string
  onSavingThrowAdvantagesChange: (value: string) => void
  onSavingThrowDisadvantagesChange: (value: string) => void
  onConditionsChange: (value: string) => void
}

export function ConditionsSection({
  savingThrowAdvantages,
  savingThrowDisadvantages,
  conditions,
  onSavingThrowAdvantagesChange,
  onSavingThrowDisadvantagesChange,
  onConditionsChange,
}: ConditionsSectionProps) {
  return (
    <div className="mt-3 border border-[#c9b89c] bg-white/60 rounded p-2 shadow-sm h-auto">
      <div className="grid grid-cols-3 gap-2">
        <div>
          <SectionHeader>Avantage JDS</SectionHeader>
          <AutoResizeTextarea
            value={savingThrowAdvantages}
            onChange={(e) => onSavingThrowAdvantagesChange(e.target.value)}
            className="mt-1"
            placeholder="Avantages"
          />
        </div>
        <div>
          <SectionHeader>Désavantage JDS</SectionHeader>
          <AutoResizeTextarea
            value={savingThrowDisadvantages}
            onChange={(e) => onSavingThrowDisadvantagesChange(e.target.value)}
            className="mt-1"
            placeholder="Désavantages"
          />
        </div>
        <div>
          <SectionHeader>États / Conditions</SectionHeader>
          <AutoResizeTextarea
            value={conditions}
            onChange={(e) => onConditionsChange(e.target.value)}
            className="mt-1"
            placeholder="États"
          />
        </div>
      </div>
    </div>
  )
}
