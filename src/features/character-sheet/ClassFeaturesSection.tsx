import { useMemo, useState } from 'react'
import { AutoResizeTextarea, Box, Button, FieldLabel, SectionHeader, Select } from '@/components/ui'
import { useOutsideClick } from '@/hooks'
import { calculateAbilityModifier} from '@/types/abilities'
import type { Abilities } from '@/types/abilities'
import type { ClassFeature } from '@/types/character'

type ClassFeaturesSectionProps = {
  characterClass: string
  subclass: string
  level: number
  abilities: Abilities
  proficiencyBonus: number
  classFeatures: ClassFeature[]
  onClassFeaturesChange: (next: ClassFeature[]) => void
}

export function ClassFeaturesSection({
  characterClass,
  subclass,
  level,
  abilities,
  proficiencyBonus,
  classFeatures,
  onClassFeaturesChange,
}: ClassFeaturesSectionProps) {
  const [editingFeatureId, setEditingFeatureId] = useState<string | null>(null)
  const [expandedFeatureDescriptionIds, setExpandedFeatureDescriptionIds] = useState<Set<string>>(
    () => new Set()
  )
  const [openFeatureMenuId, setOpenFeatureMenuId] = useState<string | null>(null)
  const [featureEditSnapshots, setFeatureEditSnapshots] = useState<Record<string, ClassFeature>>({})
  const [newFeatureId, setNewFeatureId] = useState<string | null>(null)

  useOutsideClick({
    isActive: Boolean(openFeatureMenuId),
    onOutsideClick: () => setOpenFeatureMenuId(null),
    ignoreSelector: '[data-feature-menu]',
  })

  const createClassFeatureId = () => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID()
    }
    return `feature-${Date.now()}`
  }

  const createEmptyClassFeature = (): ClassFeature => ({
    id: createClassFeatureId(),
    name: '',
    description: '',
    activeFields: {
      type: false,
      range: false,
      value: false,
      duration: false,
      notes: false,
      concentration: false,
      ritual: false,
    },
    data: {
      valueDiceCount: 1,
      valueDie: '',
      valueMod: '',
      valueUseAbility: false,
      valueAbility: 'str',
    },
    hasResource: false,
  })

  const classResourceDefinitions = useMemo(() => {
    const resources: Array<{
      id: string
      name: string
      description: string
      max: number
      reset: 'short' | 'long'
      isUnlimited?: boolean
      isUnlocked: boolean
      displayMax?: string
    }> = []

    if (characterClass === 'Barde') {
      const chaMod = calculateAbilityModifier(abilities.cha)
      const max = Math.max(1, chaMod)
      const reset = level >= 5 ? 'short' : 'long'
      const die =
        level >= 15 ? 'd12' : level >= 10 ? 'd10' : level >= 5 ? 'd8' : 'd6'
      resources.push({
        id: 'bardic_inspiration',
        name: `Inspiration Bardique (${die})`,
        description:
          'Utilisations = mod. CHA (min 1). Dès le niveau 5, récupère après repos court ou long; 1 utilisation peut être récupérée via un emplacement de sort.',
        max,
        reset,
        isUnlocked: level >= 1,
      })
    }

    if (characterClass === 'Barbare') {
      const max =
        level >= 20
          ? 0
          : level >= 17
          ? 6
          : level >= 12
          ? 5
          : level >= 6
          ? 4
          : level >= 3
          ? 3
          : level >= 1
          ? 2
          : 0
      resources.push({
        id: 'rage',
        name: 'Rage',
        description: 'Nombre d’utilisations par repos long. Reprend 1 utilisation après un repos court.',
        max,
        reset: 'long',
        isUnlimited: level >= 20,
        displayMax: level >= 20 ? '∞' : undefined,
        isUnlocked: level >= 1,
      })
    }

    if (characterClass === 'Clerc') {
      const max = level >= 18 ? 4 : level >= 6 ? 3 : level >= 2 ? 2 : 0
      resources.push({
        id: 'channel_divinity_cleric',
        name: 'Canalisation divine',
        description: 'Récupère après repos court ou long.',
        max,
        reset: 'short',
        isUnlocked: level >= 2,
      })
    }

    if (characterClass === 'Druide') {
      const max = level >= 17 ? 4 : level >= 6 ? 3 : level >= 2 ? 2 : 0
      resources.push({
        id: 'wild_shape',
        name: 'Forme sauvage',
        description:
          'Utilisations par repos long. Récupère 1 utilisation après un repos court.',
        max,
        reset: 'long',
        isUnlocked: level >= 2,
      })
    }

    if (characterClass === 'Guerrier' && subclass === 'Maître de Guerre') {
      const max = level >= 15 ? 6 : level >= 7 ? 5 : level >= 3 ? 4 : 0
      const die = level >= 18 ? 'd12' : level >= 10 ? 'd10' : 'd8'
      resources.push({
        id: 'superiority_dice',
        name: `Dés de supériorité (${die})`,
        description: 'Récupère après repos court ou long.',
        max,
        reset: 'short',
        isUnlocked: level >= 3,
      })
    }

    if (characterClass === 'Moine') {
      const max = level >= 2 ? level : 0
      resources.push({
        id: 'focus_points',
        name: 'Points de Focalisation',
        description:
          'Points = niveau de Moine. Récupère après repos court ou long; récupération ponctuelle possible au repos court.',
        max,
        reset: 'short',
        isUnlocked: level >= 2,
      })
    }

    if (characterClass === 'Paladin') {
      const max = level >= 11 ? 3 : level >= 3 ? 2 : 0
      resources.push({
        id: 'channel_divinity_paladin',
        name: 'Canalisation divine',
        description: 'Récupère après repos court ou long.',
        max,
        reset: 'short',
        isUnlocked: level >= 3,
      })
    }

    if (characterClass === 'Rôdeur') {
      resources.push({
        id: 'favored_enemy',
        name: "Ennemi juré (Chasseur)",
        description:
          'Lancez gratuitement Marque du chasseur un nombre de fois par repos long égal au bonus de maîtrise.',
        max: proficiencyBonus,
        reset: 'long',
        isUnlocked: level >= 1,
      })
    }

    if (characterClass === 'Ensorceleur') {
      const max = level >= 2 ? level : 0
      resources.push({
        id: 'sorcery_points',
        name: 'Points de Sorcellerie',
        description:
          'Points = niveau d’Ensorceleur. Récupère après repos long; récupération partielle possible au repos court.',
        max,
        reset: 'long',
        isUnlocked: level >= 2,
      })
    }

    return resources.filter((resource) => resource.isUnlocked)
  }, [abilities.cha, characterClass, level, proficiencyBonus, subclass])

  const coreResourceIds = useMemo(
    () => new Set(classResourceDefinitions.map((resource) => resource.id)),
    [classResourceDefinitions]
  )

  const manualClassFeatures = useMemo(
    () =>
      classFeatures
        .map((feature, index) => ({ feature, index }))
        .filter(({ feature }) => !coreResourceIds.has(feature.id)),
    [classFeatures, coreResourceIds]
  )

  const parseNumber = (value: string) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  const getFeatureValueDisplay = (feature: ClassFeature) => {
    const valueDie = feature.data.valueDie
    const count = Math.max(1, feature.data.valueDiceCount || 1)
    const flatMod = parseNumber(feature.data.valueMod ?? '')
    const useAbility = feature.data.valueUseAbility && feature.data.valueAbility
    const abilityMod = useAbility
      ? calculateAbilityModifier(abilities[feature.data.valueAbility as keyof typeof abilities]) || 0
      : 0
    if (!valueDie) {
      if (feature.data.value) return feature.data.value
      return '—'
    }
    const totalMod = flatMod + abilityMod
    return `${count}${valueDie}${totalMod >= 0 ? `+${totalMod}` : totalMod}`
  }

  const addClassFeature = () => {
    if (editingFeatureId) return
    const newFeature = createEmptyClassFeature()
    onClassFeaturesChange([...classFeatures, newFeature])
    setEditingFeatureId(newFeature.id)
    setNewFeatureId(newFeature.id)
  }

  const updateClassFeature = (index: number, updates: Partial<ClassFeature>) => {
    const newItems = [...classFeatures]
    const current = newItems[index]
    if (!current) return
    newItems[index] = {
      ...current,
      ...updates,
    }
    onClassFeaturesChange(newItems)
  }

  const updateClassFeatureAt = (index: number, updater: (feature: ClassFeature) => ClassFeature) => {
    const newItems = [...classFeatures]
    const current = newItems[index]
    if (!current) return
    newItems[index] = updater(current)
    onClassFeaturesChange(newItems)
  }

  const updateCoreResource = (resourceId: string, nextCurrent: number) => {
    const definition = classResourceDefinitions.find((resource) => resource.id === resourceId)
    if (!definition || definition.isUnlimited) return
    const max = Math.max(0, definition.max)
    const clamped = Math.max(0, Math.min(max, nextCurrent))
    const existingIndex = classFeatures.findIndex((feature) => feature.id === resourceId)
    const nextFeatures = [...classFeatures]
    if (existingIndex >= 0) {
      const existing = nextFeatures[existingIndex]
      nextFeatures[existingIndex] = {
        ...(existing ?? createEmptyClassFeature()),
        id: existing?.id ?? resourceId,
        name: definition.name,
        description: existing?.description || definition.description,
        data: existing?.data ?? {},
        hasResource: true,
        resource: {
          current: clamped,
          max,
          reset: definition.reset,
        },
      }
    } else {
      nextFeatures.unshift({
        id: resourceId,
        name: definition.name,
        description: definition.description,
        activeFields: {
          type: false,
          range: false,
          value: false,
          duration: false,
          notes: false,
          concentration: false,
          ritual: false,
        },
        data: {},
        hasResource: true,
        resource: {
          current: clamped,
          max,
          reset: definition.reset,
        },
      })
    }
    onClassFeaturesChange(nextFeatures)
  }

  const getFeatureResourceMode = (feature: ClassFeature) => {
    if (feature.resourceMode) return feature.resourceMode
    return feature.hasResource ? 'independent' : 'none'
  }

  const getLinkedClassResource = (feature: ClassFeature) => {
    const defaultId = classResourceDefinitions[0]?.id
    const linkId = feature.resourceLinkId ?? defaultId
    if (!linkId) return null
    const definition = classResourceDefinitions.find((resource) => resource.id === linkId)
    if (!definition) return null
    const stored = classFeatures.find((entry) => entry.id === linkId)
    const max = Math.max(0, definition.max)
    const current = Math.min(stored?.resource?.current ?? 0, max)
    return {
      id: linkId,
      current,
      max,
      reset: definition.reset,
    }
  }

  const removeClassFeature = (index: number) => {
    const removedId = classFeatures[index]?.id
    onClassFeaturesChange(classFeatures.filter((_, i) => i !== index))
    if (removedId && editingFeatureId === removedId) {
      setEditingFeatureId(null)
    }
    if (removedId && newFeatureId === removedId) {
      setNewFeatureId(null)
    }
    if (removedId && featureEditSnapshots[removedId]) {
      setFeatureEditSnapshots((prev) => {
        const next = { ...prev }
        delete next[removedId]
        return next
      })
    }
  }

  const cancelClassFeatureEdit = (featureId: string) => {
    if (newFeatureId === featureId) {
      const index = classFeatures.findIndex((feature) => feature.id === featureId)
      if (index >= 0) {
        onClassFeaturesChange(classFeatures.filter((_, i) => i !== index))
      }
      setNewFeatureId(null)
      setEditingFeatureId(null)
      return
    }
    const snapshot = featureEditSnapshots[featureId]
    if (snapshot) {
      onClassFeaturesChange(
        classFeatures.map((feature) => (feature.id === featureId ? snapshot : feature))
      )
      setFeatureEditSnapshots((prev) => {
        const next = { ...prev }
        delete next[featureId]
        return next
      })
    }
    setEditingFeatureId(null)
  }

  return (
    <div className="mt-3 border border-[#c9b89c] bg-white/60 rounded p-2 shadow-sm h-auto">
      <SectionHeader>Aptitudes de Classe</SectionHeader>
      <div className="mt-1">
        {classResourceDefinitions.length > 0 && (
          <div className="mb-2">
            <FieldLabel>Ressources de classe</FieldLabel>
            <div className="mt-1 space-y-2">
              {classResourceDefinitions.map((resource) => {
                const stored = classFeatures.find((feature) => feature.id === resource.id)
                const max = Math.max(0, resource.max)
                const current = Math.min(stored?.resource?.current ?? 0, max)
                const displayMax = resource.displayMax ?? String(max)
                const resetLabel =
                  resource.reset === 'short' ? 'Repos court/long' : 'Repos long'
                const canTrack = resource.isUnlimited || max > 0
                return (
                  <div
                    key={resource.id}
                    className="border border-[#b59d7a] bg-[#efe1c6]/70 rounded p-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={resource.name}
                          size={Math.max(1, resource.name.length)}
                          readOnly
                          className="bg-transparent border-none outline-none font-bold text-sm"
                        />
                        <div className="flex items-center gap-1 text-[10px]">
                          {canTrack ? (
                            resource.isUnlimited ? (
                              <span className="min-w-[30px] text-center">
                                {displayMax}
                              </span>
                            ) : (
                              <>
                                <Button
                                  variant="small"
                                  onClick={() =>
                                    updateCoreResource(resource.id, current - 1)
                                  }
                                >
                                  -
                                </Button>
                                <span className="min-w-[18px] text-center">{current}</span>
                                <span>/</span>
                                <span className="min-w-[18px] text-center">
                                  {displayMax}
                                </span>
                                <Button
                                  variant="small"
                                  onClick={() =>
                                    updateCoreResource(resource.id, current + 1)
                                  }
                                >
                                  +
                                </Button>
                              </>
                            )
                          ) : (
                            <span className="text-[10px] text-[#7a4b36]">—</span>
                          )}
                        </div>
                      </div>
                      {canTrack && (
                        <div className="text-[10px] text-[#7a4b36]">{resetLabel}</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {manualClassFeatures.map(({ feature, index }) => (
          <div
            key={feature.id}
            className="mb-2 border border-[#c9b89c] bg-white/40 p-1.5 cursor-pointer"
            onClick={() =>
              setExpandedFeatureDescriptionIds((prev) => {
                const next = new Set(prev)
                if (next.has(feature.id)) {
                  next.delete(feature.id)
                } else {
                  next.add(feature.id)
                }
                return next
              })
            }
          >
            {editingFeatureId === feature.id ? (
              <>
                <div className="grid grid-cols-[1fr_1.4fr_auto_auto] gap-1 items-start">
                  <Box>
                    <AutoResizeTextarea
                      value={feature.name}
                      onChange={(e) =>
                        updateClassFeature(index, { name: e.target.value })
                      }
                      className="w-full bg-transparent border-none outline-none font-bold leading-tight"
                      placeholder="Aptitude"
                    />
                  </Box>
                  <Box>
                    <AutoResizeTextarea
                      value={feature.description}
                      onChange={(e) =>
                        updateClassFeature(index, { description: e.target.value })
                      }
                      className="w-full bg-transparent border-none outline-none text-xs"
                      placeholder="Description"
                    />
                  </Box>
                  <Button
                    variant="small"
                    onClick={() => {
                      setEditingFeatureId(null)
                      setNewFeatureId(null)
                      if (featureEditSnapshots[feature.id]) {
                        setFeatureEditSnapshots((prev) => {
                          const next = { ...prev }
                          delete next[feature.id]
                          return next
                        })
                      }
                    }}
                  >
                    OK
                  </Button>
                  <Button
                    variant="small"
                    onClick={() => cancelClassFeatureEdit(feature.id)}
                  >
                    Annuler
                  </Button>
                </div>

                <div className="mt-1 grid grid-cols-7 gap-1 text-[10px]">
                  {[
                    { key: 'type', label: 'Type' },
                    { key: 'range', label: 'Portée' },
                    { key: 'value', label: 'Valeur' },
                    { key: 'duration', label: 'Durée' },
                    { key: 'concentration', label: 'Concentration' },
                    { key: 'ritual', label: 'Rituel' },
                  ].map((field) => (
                    <label key={field.key} className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={
                          feature.activeFields[
                            field.key as keyof typeof feature.activeFields
                          ]
                        }
                        onChange={(e) =>
                          updateClassFeatureAt(index, (current) => ({
                            ...current,
                            activeFields: {
                              ...current.activeFields,
                              [field.key]: e.target.checked,
                            },
                            data:
                              field.key === 'concentration'
                                ? {
                                    ...current.data,
                                    isConcentration: e.target.checked,
                                  }
                                : field.key === 'ritual'
                                ? {
                                    ...current.data,
                                    isRitual: e.target.checked,
                                  }
                                : current.data,
                          }))
                        }
                      />
                      <span>{field.label}</span>
                    </label>
                  ))}
                </div>

                <div className="mt-1 grid grid-cols-7 gap-1 text-[10px]">
                  {feature.activeFields.type ? (
                    <Select
                      value={feature.data.actionType ?? ''}
                      onChange={(e) =>
                        updateClassFeatureAt(index, (current) => ({
                          ...current,
                          data: {
                            ...current.data,
                            actionType: e.target.value as ClassFeature['data']['actionType'],
                          },
                        }))
                      }
                      options={[
                        { value: '', label: '—' },
                        { value: 'action', label: 'Action' },
                        { value: 'bonus', label: 'Bonus' },
                        { value: 'reaction', label: 'Réaction' },
                        { value: 'passive', label: 'Passif' },
                        { value: 'free', label: 'Libre' },
                      ]}
                    />
                  ) : (
                    <span />
                  )}
                  {feature.activeFields.range ? (
                    <input
                      type="text"
                      value={feature.data.range ?? ''}
                      onChange={(e) =>
                        updateClassFeatureAt(index, (current) => ({
                          ...current,
                          data: { ...current.data, range: e.target.value },
                        }))
                      }
                      className="w-full bg-transparent border border-[#bda68a] rounded px-1 py-0.5 text-[10px]"
                      placeholder="Portée"
                    />
                  ) : (
                    <span />
                  )}
                  {feature.activeFields.value ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="1"
                        value={feature.data.valueDiceCount ?? 1}
                        onChange={(e) =>
                          updateClassFeatureAt(index, (current) => ({
                            ...current,
                            data: {
                              ...current.data,
                              valueDiceCount: Math.max(1, parseInt(e.target.value) || 1),
                            },
                          }))
                        }
                        className="w-8 text-center bg-transparent border border-[#bda68a] rounded px-1 py-0.5 text-[10px]"
                      />
                      <Select
                        value={feature.data.valueDie ?? ''}
                        onChange={(e) =>
                          updateClassFeatureAt(index, (current) => ({
                            ...current,
                            data: { ...current.data, valueDie: e.target.value },
                          }))
                        }
                        options={[
                          { value: '', label: '—' },
                          { value: 'd4', label: 'd4' },
                          { value: 'd6', label: 'd6' },
                          { value: 'd8', label: 'd8' },
                          { value: 'd10', label: 'd10' },
                          { value: 'd12', label: 'd12' },
                        ]}
                      />
                      <input
                        type="text"
                        value={feature.data.valueMod ?? ''}
                        onChange={(e) =>
                          updateClassFeatureAt(index, (current) => ({
                            ...current,
                            data: { ...current.data, valueMod: e.target.value },
                          }))
                        }
                        className="w-10 text-center bg-transparent border border-[#bda68a] rounded px-1 py-0.5 text-[10px]"
                        placeholder="Mod"
                      />
                    </div>
                  ) : (
                    <span />
                  )}
                  {feature.activeFields.duration ? (
                    <input
                      type="text"
                      value={feature.data.duration ?? ''}
                      onChange={(e) =>
                        updateClassFeatureAt(index, (current) => ({
                          ...current,
                          data: { ...current.data, duration: e.target.value },
                        }))
                      }
                      className="w-full bg-transparent border border-[#bda68a] rounded px-1 py-0.5 text-[10px]"
                      placeholder="Durée"
                    />
                  ) : (
                    <span />
                  )}
                  {feature.activeFields.concentration ? (
                    <label className="flex items-center gap-1 text-[10px]">
                      <input
                        type="checkbox"
                        checked={feature.data.isConcentration ?? false}
                        onChange={(e) =>
                          updateClassFeatureAt(index, (current) => ({
                            ...current,
                            data: {
                              ...current.data,
                              isConcentration: e.target.checked,
                            },
                          }))
                        }
                      />
                      <span>C</span>
                    </label>
                  ) : (
                    <span />
                  )}
                  {feature.activeFields.ritual ? (
                    <label className="flex items-center gap-1 text-[10px]">
                      <input
                        type="checkbox"
                        checked={feature.data.isRitual ?? false}
                        onChange={(e) =>
                          updateClassFeatureAt(index, (current) => ({
                            ...current,
                            data: {
                              ...current.data,
                              isRitual: e.target.checked,
                            },
                          }))
                        }
                      />
                      <span>R</span>
                    </label>
                  ) : (
                    <span />
                  )}
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-3 text-[10px]">
                  <Select
                    label="Ressource"
                    value={getFeatureResourceMode(feature)}
                    onChange={(e) =>
                      updateClassFeatureAt(index, (current) => {
                        const mode = e.target.value as 'none' | 'independent' | 'class'
                        const hasResource = mode !== 'none'
                        return {
                          ...current,
                          hasResource,
                          resourceMode: mode,
                          resourceLinkId:
                            mode === 'class'
                              ? current.resourceLinkId ?? classResourceDefinitions[0]?.id
                              : undefined,
                          resource:
                            mode === 'independent'
                              ? current.resource ?? {
                                  current: 0,
                                  max: 0,
                                  reset: 'long',
                                }
                              : undefined,
                        }
                      })
                    }
                    options={[
                      { value: 'none', label: 'Aucun' },
                      { value: 'independent', label: 'Indépendant' },
                      { value: 'class', label: 'Ressource de classe' },
                    ]}
                  />
                  {getFeatureResourceMode(feature) === 'independent' && (
                    <div className="mt-1 flex items-center gap-1 text-[10px]">
                      <input
                        type="number"
                        min="0"
                        value={feature.resource?.current ?? 0}
                        onChange={(e) =>
                          updateClassFeatureAt(index, (current) => ({
                            ...current,
                            resource: {
                              current: Math.max(0, parseInt(e.target.value) || 0),
                              max: current.resource?.max ?? 0,
                              reset: current.resource?.reset ?? 'long',
                            },
                          }))
                        }
                        className="w-10 text-center bg-transparent border border-[#bda68a] rounded px-1 py-0.5 text-[10px]"
                      />
                      <span>/</span>
                      <input
                        type="number"
                        min="0"
                        value={feature.resource?.max ?? 0}
                        onChange={(e) =>
                          updateClassFeatureAt(index, (current) => ({
                            ...current,
                            resource: {
                              current: Math.min(
                                current.resource?.current ?? 0,
                                Math.max(0, parseInt(e.target.value) || 0)
                              ),
                              max: Math.max(0, parseInt(e.target.value) || 0),
                              reset: current.resource?.reset ?? 'long',
                            },
                          }))
                        }
                        className="w-10 text-center bg-transparent border border-[#bda68a] rounded px-1 py-0.5 text-[10px]"
                      />
                      <Select
                        label="Repos"
                        value={feature.resource?.reset ?? 'long'}
                        onChange={(e) =>
                          updateClassFeatureAt(index, (current) => ({
                            ...current,
                            resource: {
                              current: current.resource?.current ?? 0,
                              max: current.resource?.max ?? 0,
                              reset: e.target.value === 'short' ? 'short' : 'long',
                            },
                          }))
                        }
                        options={[
                          { value: 'long', label: 'Long' },
                          { value: 'short', label: 'Court' },
                        ]}
                      />
                    </div>
                  )}

                  {getFeatureResourceMode(feature) === 'class' && (
                    <div className="mt-1 flex items-center gap-2 text-[10px]">
                      {classResourceDefinitions.length > 1 && (
                        <Select
                          label="Ressource de classe"
                          value={feature.resourceLinkId ?? classResourceDefinitions[0]?.id ?? ''}
                          onChange={(e) =>
                            updateClassFeatureAt(index, (current) => ({
                              ...current,
                              resourceLinkId: e.target.value,
                            }))
                          }
                          options={classResourceDefinitions.map((resource) => ({
                            value: resource.id,
                            label: resource.name,
                          }))}
                        />
                      )}
                      {(() => {
                        const linked = getLinkedClassResource(feature)
                        if (!linked) return <span>—</span>
                        return (
                          <>
                            <input
                              type="number"
                              min="0"
                              value={linked.current}
                              onChange={(e) =>
                                updateCoreResource(
                                  linked.id,
                                  Math.min(
                                    linked.max,
                                    Math.max(0, parseInt(e.target.value) || 0)
                                  )
                                )
                              }
                              className="w-10 text-center bg-transparent border border-[#bda68a] rounded px-1 py-0.5 text-[10px]"
                            />
                            <span>/</span>
                            <span className="min-w-[18px] text-center">{linked.max}</span>
                          </>
                        )
                      })()}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <div className="font-bold text-sm truncate">{feature.name || '—'}</div>
                  {getFeatureResourceMode(feature) === 'independent' && (
                    <div
                      className="flex items-center gap-1 text-[10px]"
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <input
                        type="number"
                        min="0"
                        value={feature.resource?.current ?? 0}
                        onChange={(e) =>
                          updateClassFeatureAt(index, (current) => ({
                            ...current,
                            resource: {
                              current: Math.min(
                                current.resource?.max ?? 0,
                                Math.max(0, parseInt(e.target.value) || 0)
                              ),
                              max: current.resource?.max ?? 0,
                              reset: current.resource?.reset ?? 'long',
                            },
                          }))
                        }
                        className="w-10 text-center bg-transparent border border-[#bda68a] rounded px-1 py-0.5 text-[10px]"
                      />
                      <span>/</span>
                      <span className="min-w-[18px] text-center">
                        {feature.resource?.max ?? 0}
                      </span>
                      <span className="text-[10px] text-[#7a4b36]">
                        {(feature.resource?.reset ?? 'long') === 'short'
                          ? 'Repos court/long'
                          : 'Repos long'}
                      </span>
                    </div>
                  )}
                  {getFeatureResourceMode(feature) === 'class' && (() => {
                    const linked = getLinkedClassResource(feature)
                    if (!linked) return null
                    return (
                      <div
                        className="flex items-center gap-1 text-[10px]"
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <input
                          type="number"
                          min="0"
                          value={linked.current}
                          onChange={(e) =>
                            updateCoreResource(
                              linked.id,
                              Math.min(linked.max, Math.max(0, parseInt(e.target.value) || 0))
                            )
                          }
                          className="w-10 text-center bg-transparent border border-[#bda68a] rounded px-1 py-0.5 text-[10px]"
                        />
                        <span>/</span>
                        <span className="min-w-[18px] text-center">{linked.max}</span>
                        <span className="text-[10px] text-[#7a4b36]">
                          {linked.reset === 'short' ? 'Repos court/long' : 'Repos long'}
                        </span>
                      </div>
                    )
                  })()}
                  <div
                    className="ml-auto relative"
                    data-feature-menu
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenFeatureMenuId(
                          openFeatureMenuId === feature.id ? null : feature.id
                        )
                      }}
                      className="text-xs px-1"
                    >
                      ⋯
                    </button>
                    {openFeatureMenuId === feature.id && (
                      <div className="absolute right-0 mt-1 z-10 bg-white border border-[#c9b89c] rounded shadow-sm text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            if (editingFeatureId !== null) return
                            if (!featureEditSnapshots[feature.id]) {
                              setFeatureEditSnapshots((prev) => ({
                                ...prev,
                                [feature.id]: feature,
                              }))
                            }
                            setEditingFeatureId(feature.id)
                            setOpenFeatureMenuId(null)
                          }}
                          className="block w-full text-left px-2 py-1 hover:bg-[#f6efe4]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            removeClassFeature(index)
                            setOpenFeatureMenuId(null)
                          }}
                          className="block w-full text-left px-2 py-1 hover:bg-[#f6efe4]"
                        >
                          Supprimer
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-1 grid grid-cols-[1fr_1fr_1fr_1fr_0.6fr] items-start gap-3 text-[10px]">
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase text-[#7a4b36]">Type</span>
                    <span>{feature.activeFields.type ? feature.data.actionType || '—' : '—'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase text-[#7a4b36]">Portée</span>
                    <span>{feature.activeFields.range ? feature.data.range || '—' : '—'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase text-[#7a4b36]">Valeur</span>
                    <span>{feature.activeFields.value ? getFeatureValueDisplay(feature) : '—'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase text-[#7a4b36]">Durée</span>
                    <span>{feature.activeFields.duration ? feature.data.duration || '—' : '—'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase text-[#7a4b36]">C/R</span>
                    <span>
                      {(feature.activeFields.concentration || feature.activeFields.ritual) &&
                      (feature.data.isConcentration || feature.data.isRitual)
                        ? [
                            feature.activeFields.concentration &&
                            feature.data.isConcentration
                              ? 'C'
                              : null,
                            feature.activeFields.ritual && feature.data.isRitual
                              ? 'R'
                              : null,
                          ]
                            .filter(Boolean)
                            .join(', ')
                        : '—'}
                    </span>
                  </div>
                </div>
                {feature.description &&
                  expandedFeatureDescriptionIds.has(feature.id) && (
                    <div className="mt-1 border-l-2 border-[#bda68a] bg-white/30 px-2 py-1 text-[10px] whitespace-pre-wrap">
                      {feature.description}
                    </div>
                  )}
              </>
            )}
          </div>
        ))}

        <div className="mt-1 flex items-center gap-2">
          <Button
            variant="small"
            onClick={() => addClassFeature()}
            disabled={editingFeatureId !== null}
          >
            + Ajouter une aptitude
          </Button>
        </div>
      </div>
    </div>
  )
}
