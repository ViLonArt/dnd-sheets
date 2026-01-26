import { useState } from 'react'
import { Select, TextInput } from '@/components/ui'

type VitalsSectionProps = {
  ac: string
  initMisc: number
  initiativeTotalLabel: string
  speed: string
  hpCurrent: string
  effectiveHpMax: number
  hpMaxOverride: string
  tempHp: string
  hitDiceType: number
  level: number
  constitutionMod: number
  onAcChange: (value: string) => void
  onInitMiscChange: (value: number) => void
  onSpeedChange: (value: string) => void
  onHpCurrentChange: (value: string) => void
  onHpMaxOverrideChange: (value: string) => void
  onTempHpChange: (value: string) => void
  onHitDiceTypeChange: (value: number) => void
}

export function VitalsSection({
  ac,
  initMisc,
  initiativeTotalLabel,
  speed,
  hpCurrent,
  effectiveHpMax,
  hpMaxOverride,
  tempHp,
  hitDiceType,
  level,
  constitutionMod,
  onAcChange,
  onInitMiscChange,
  onSpeedChange,
  onHpCurrentChange,
  onHpMaxOverrideChange,
  onTempHpChange,
  onHitDiceTypeChange,
}: VitalsSectionProps) {
  const [isEditingInit, setIsEditingInit] = useState(false)

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        <TextInput label="CA" value={ac} onChange={(e) => onAcChange(e.target.value)} />
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-wider text-[#7a4b36]">
            Initiative
          </label>
          {isEditingInit ? (
            <input
              type="number"
              value={String(initMisc)}
              onChange={(e) => onInitMiscChange(parseInt(e.target.value) || 0)}
              onBlur={() => setIsEditingInit(false)}
              autoFocus
              placeholder="Bonus"
              className="border-b border-[#bda68a] min-h-[18px] px-0.5 pb-0.5 bg-transparent outline-none focus:border-ink font-body text-sm text-center"
            />
          ) : (
            <div
              onClick={() => setIsEditingInit(true)}
              className="border-b border-[#bda68a] min-h-[18px] px-0.5 pb-0.5 bg-transparent outline-none font-body text-sm text-center cursor-pointer"
            >
              {initiativeTotalLabel}
            </div>
          )}
        </div>
        <TextInput label="Vitesse" value={speed} onChange={(e) => onSpeedChange(e.target.value)} />
      </div>

      <div className="mt-2 border border-[#c9b89c] bg-white/40 p-2">
        <div className="grid grid-cols-3 gap-2 mt-1">
          <div className="border border-[#c9b89c] bg-white/60 rounded p-1.5 text-center">
            <div className="text-[10px] uppercase tracking-wider text-[#7a4b36]">
              PV Actuels
            </div>
            <input
              type="number"
              value={hpCurrent}
              onChange={(e) => {
                const next = Math.min(parseInt(e.target.value) || 0, effectiveHpMax)
                onHpCurrentChange(String(next))
              }}
              className="w-full text-center font-semibold bg-transparent border-none outline-none text-sm"
              placeholder="0"
            />
          </div>
          <div className="border border-[#c9b89c] bg-white/60 rounded p-1.5 text-center">
            <div className="text-[10px] uppercase tracking-wider text-[#7a4b36]">PV Max</div>
            <div className="text-xs font-semibold">{effectiveHpMax}</div>
            <input
              type="number"
              value={hpMaxOverride}
              onChange={(e) => onHpMaxOverrideChange(e.target.value)}
              className="w-full text-center font-semibold bg-transparent border border-[#bda68a] rounded px-1 py-0.5 text-xs mt-1"
              placeholder="Saisie manuelle"
            />
          </div>
          <div className="border border-[#bcd7ff] bg-[#e9f2ff] rounded p-1.5 text-center">
            <div className="text-[10px] uppercase tracking-wider text-[#4a6aa8]">PV Temp</div>
            <input
              type="number"
              value={tempHp}
              onChange={(e) => onTempHpChange(e.target.value)}
              className="w-full text-center font-semibold bg-transparent border-none outline-none text-sm"
              placeholder="0"
            />
          </div>
        </div>
        <div className="mt-2">
          <div className="border border-[#c9b89c] bg-white/60 rounded p-2 flex items-center gap-2">
            <Select
              label="Dés de Vie"
              value={String(hitDiceType)}
              onChange={(e) => onHitDiceTypeChange(parseInt(e.target.value) || 8)}
              className="w-20"
              options={[
                { value: '4', label: 'd4' },
                { value: '6', label: 'd6' },
                { value: '8', label: 'd8' },
                { value: '10', label: 'd10' },
                { value: '12', label: 'd12' },
              ]}
            />
            <div className="text-lg text-[#7a4b36] font-semibold">
              {level}d{hitDiceType} + {level * constitutionMod}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
