import { useCallback, useEffect, useRef } from 'react'
import type { Character } from '@/types/character'
import type { ClassFeature } from '@/types/character'
import type { PendingChoice } from '@/types/character'
import {
  getClassFeaturesForLevel,
  getScaledValueAtLevel,
} from '@/data/classFeatureRegistry'
import { t } from '@/utils/i18n'
import type { AdvancementState } from '@/types/character'

type UseFeaturePropagationParams = {
  character: Character
  updateCharacter: (updates: Partial<Character>) => void
  locale: 'en' | 'fr'
}

/**
 * Converts a RESOURCE-type Feature to a ClassFeature for the character sheet.
 */
function featureToClassFeature(
  feature: { id: string; nameKey: string; descriptionKey?: string; scaling?: { byLevel: Record<number, number>; reset?: 'short' | 'long' }; resourceId?: string },
  level: number,
  locale: 'en' | 'fr'
): ClassFeature {
  const max = feature.scaling?.byLevel
    ? getScaledValueAtLevel(feature.scaling.byLevel, level)
    : 1
  let reset = feature.scaling?.reset ?? 'long'
  if (feature.resourceId === 'bardicInspiration' && level >= 5) reset = 'short'

  return {
    id: feature.id,
    name: t(feature.nameKey, locale),
    description: feature.descriptionKey ? t(feature.descriptionKey, locale) : '',
    activeFields: {
      type: true,
      range: false,
      value: true,
      duration: false,
      notes: false,
      concentration: false,
      ritual: false,
    },
    data: {
      actionType: 'passive',
      value: `${max}/${reset === 'long' ? 'Long Rest' : 'Short Rest'}`,
    },
    hasResource: true,
    resourceMode: 'independent',
    resource: {
      current: 0,
      max,
      reset,
    },
  }
}

/**
 * Converts a PASSIVE or ACTION-type Feature to a ClassFeature.
 */
function passiveOrActionFeatureToClassFeature(
  feature: { id: string; nameKey: string; descriptionKey?: string },
  type: 'PASSIVE' | 'ACTION',
  locale: 'en' | 'fr'
): ClassFeature {
  const actionType = type === 'ACTION' ? 'action' : 'passive'
  return {
    id: feature.id,
    name: t(feature.nameKey, locale),
    description: feature.descriptionKey ? t(feature.descriptionKey, locale) : '',
    activeFields: {
      type: true,
      range: false,
      value: false,
      duration: false,
      notes: false,
      concentration: false,
      ritual: false,
    },
    data: {
      actionType,
    },
    hasResource: false,
  }
}

/**
 * Hook that propagates class features when class/level changes.
 * - PASSIVE and RESOURCE features are auto-added to classFeatures.
 * - CHOICE features are added to pendingChoices for UI resolution.
 */
export function useFeaturePropagation({
  character,
  updateCharacter,
  locale,
}: UseFeaturePropagationParams) {
  const lastProcessedRef = useRef<string>('')

  const mergeAdvancement = useCallback(
    (adv: AdvancementState | undefined, overrides: Partial<AdvancementState> = {}): AdvancementState => ({
      classes: adv?.classes ?? [],
      feats: adv?.feats ?? [],
      weaponMasteries: adv?.weaponMasteries ?? [],
      weaponProficiencies: adv?.weaponProficiencies ?? [],
      choices: adv?.choices ?? {},
      pendingChoices: adv?.pendingChoices ?? [],
      advancementMode: adv?.advancementMode,
      speciesId: adv?.speciesId,
      backgroundId: adv?.backgroundId,
      ...overrides,
    }),
    []
  )

  useEffect(() => {
    const advancement = character.advancement
    const classes = advancement?.classes ?? []
    const primaryClass = classes.reduce(
      (best, c) => (c.level > (best?.level ?? 0) ? c : best),
      classes[0]
    )

    if (!primaryClass) return

    const classId = primaryClass.classId
    const subclassId = primaryClass.subclassId
    const level = character.level
    const cacheKey = `${classId}-${subclassId ?? ''}-${level}-${locale}`

    if (lastProcessedRef.current === cacheKey) return
    lastProcessedRef.current = cacheKey

    const features = getClassFeaturesForLevel(classId, level, subclassId)
    if (features.length === 0) return

    const existingFeatureIds = new Set(character.classFeatures.map((f) => f.id))
    const existingChoiceIds = new Set(
      (advancement?.pendingChoices ?? []).map((c) => c.featureId)
    )

    const newClassFeatures: ClassFeature[] = []
    const newPendingChoices: PendingChoice[] = []

    for (const f of features) {
      if (f.type === 'PASSIVE' || f.type === 'RESOURCE' || f.type === 'ACTION') {
        const resourceStorageId = f.type === 'RESOURCE' && f.resourceId ? f.resourceId : f.id
        const resourceExists =
          (f.type === 'RESOURCE' && (existingFeatureIds.has(f.id) || existingFeatureIds.has(resourceStorageId))) ||
          (f.type !== 'RESOURCE' && existingFeatureIds.has(f.id))

        if (f.type === 'RESOURCE' && f.scaling) {
          if (resourceExists) {
            const existingIndex = character.classFeatures.findIndex(
              (cf) => cf.id === f.id || cf.id === resourceStorageId
            )
            if (existingIndex >= 0) {
              const existing = character.classFeatures[existingIndex]
              const max = getScaledValueAtLevel(f.scaling.byLevel, level)
              const reset = f.scaling.reset ?? 'long'
              const nextFeatures = [...character.classFeatures]
              nextFeatures[existingIndex] = {
                ...existing!,
                resource: {
                  current: Math.min(existing?.resource?.current ?? 0, max),
                  max,
                  reset,
                },
                data: {
                  ...existing?.data,
                  value: `${max}/${reset === 'long' ? 'Long Rest' : 'Short Rest'}`,
                },
              }
              updateCharacter({
                classFeatures: nextFeatures,
                advancement: mergeAdvancement(advancement),
              })
              return
            }
          }
          const cf = featureToClassFeature(f, level, locale)
          cf.id = resourceStorageId
          newClassFeatures.push(cf)
        } else if (!resourceExists) {
          newClassFeatures.push(
            passiveOrActionFeatureToClassFeature(f, f.type === 'ACTION' ? 'ACTION' : 'PASSIVE', locale)
          )
        }
      } else if (f.type === 'CHOICE' && f.choices) {
        const choiceResolved = advancement?.choices?.[`feature-${f.id}`] != null
        if (choiceResolved || existingChoiceIds.has(f.id)) continue

        newPendingChoices.push({
          id: `pending-${f.id}-${level}`,
          featureId: f.id,
          featureNameKey: f.nameKey,
          pool: f.choices.pool,
          count: f.choices.count,
          category: f.choices.category,
          level: f.level,
        })
      }
    }

    if (newClassFeatures.length === 0 && newPendingChoices.length === 0) return

    const nextClassFeatures = [...character.classFeatures]
    for (const cf of newClassFeatures) {
      if (!nextClassFeatures.some((e) => e.id === cf.id)) {
        nextClassFeatures.push(cf)
      }
    }

    const nextPendingChoices = [...(advancement?.pendingChoices ?? [])]
    for (const pc of newPendingChoices) {
      if (!nextPendingChoices.some((p) => p.featureId === pc.featureId && p.level === pc.level)) {
        nextPendingChoices.push(pc)
      }
    }

    updateCharacter({
      classFeatures: nextClassFeatures,
      advancement: mergeAdvancement(advancement, { pendingChoices: nextPendingChoices }),
    })
  }, [character.advancement, character.classFeatures, character.level, locale, mergeAdvancement, updateCharacter])
}
