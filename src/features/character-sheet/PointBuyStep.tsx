import { useCallback } from 'react'
import type { AbilityKey } from '@/types/abilities'
import {
  POINT_BUY_TOTAL_POINTS,
  POINT_BUY_MIN_SCORE,
  POINT_BUY_MAX_SCORE,
  getPointCost,
} from '@/utils/pointBuyRules'
import { FieldLabel } from '@/components/ui'
import { cn } from '@/utils/cn'

const ABILITY_ORDER: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

type PointBuyStepProps = {
  baseAbilities: Record<AbilityKey, number>
  onAbilityChange: (ability: AbilityKey, value: number) => void
  abilityLabels: Record<AbilityKey, string>
  locale: 'en' | 'fr'
}

const LABELS = {
  en: {
    title: 'Ability Scores (Point Buy)',
    hint: '27 points. Each stat 8–15. Background bonuses (+2/+1 or +1/+1/+1) applied at the end.',
    remaining: 'Remaining',
    cost: 'cost',
  },
  fr: {
    title: 'Caractéristiques (Point Buy)',
    hint: '27 points. Chaque stat 8–15. Bonus d\'historique appliqués à la fin.',
    remaining: 'Restant',
    cost: 'coût',
  },
} as const

export function PointBuyStep({
  baseAbilities,
  onAbilityChange,
  abilityLabels,
  locale,
}: PointBuyStepProps) {
  const totalCost = ABILITY_ORDER.reduce(
    (sum, key) => sum + getPointCost(baseAbilities[key] ?? 10),
    0
  )
  const remaining = POINT_BUY_TOTAL_POINTS - totalCost
  const isValid = remaining === 0
  const t = LABELS[locale]

  const handleIncrement = useCallback(
    (ability: AbilityKey) => {
      const current = baseAbilities[ability] ?? 10
      if (current < POINT_BUY_MAX_SCORE) {
        onAbilityChange(ability, current + 1)
      }
    },
    [baseAbilities, onAbilityChange]
  )

  const handleDecrement = useCallback(
    (ability: AbilityKey) => {
      const current = baseAbilities[ability] ?? 10
      if (current > POINT_BUY_MIN_SCORE) {
        onAbilityChange(ability, current - 1)
      }
    },
    [baseAbilities, onAbilityChange]
  )

  return (
    <div className="grid gap-4">
      <FieldLabel>{t.title}</FieldLabel>
      <p className="text-xs text-[#7a4b36]">{t.hint}</p>

      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded border',
          isValid ? 'bg-green-50/80 border-green-600/50' : 'bg-red-50/80 border-red-600/50'
        )}
      >
        <span className="text-sm font-medium">{t.remaining}:</span>
        <span className={cn('font-bold', isValid ? 'text-green-700' : 'text-red-700')}>
          {remaining} / {POINT_BUY_TOTAL_POINTS}
        </span>
      </div>

      <div className="grid gap-2">
        {ABILITY_ORDER.map((ability) => {
          const score = baseAbilities[ability] ?? 10
          const cost = getPointCost(score)
          const canDecrease = score > POINT_BUY_MIN_SCORE
          const canIncrease = score < POINT_BUY_MAX_SCORE

          return (
            <div
              key={ability}
              className="flex items-center gap-2 p-2 rounded bg-white/60 border border-[#c9b89c]"
            >
              <span className="text-xs w-12 font-medium">{abilityLabels[ability]}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleDecrement(ability)}
                  disabled={!canDecrease}
                  className={cn(
                    'w-8 h-8 rounded border text-sm font-bold',
                    canDecrease
                      ? 'border-[#7a4b36] bg-[#f3e2c8] hover:bg-[#e8d4bc]'
                      : 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
                  )}
                >
                  -
                </button>
                <span className="w-8 text-center font-semibold">{score}</span>
                <button
                  type="button"
                  onClick={() => handleIncrement(ability)}
                  disabled={!canIncrease}
                  className={cn(
                    'w-8 h-8 rounded border text-sm font-bold',
                    canIncrease
                      ? 'border-[#7a4b36] bg-[#f3e2c8] hover:bg-[#e8d4bc]'
                      : 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
                  )}
                >
                  +
                </button>
              </div>
              <span className="text-[10px] text-[#7a4b36] ml-2">
                ({cost} {t.cost})
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
