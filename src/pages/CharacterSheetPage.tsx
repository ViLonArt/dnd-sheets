import { useRef, useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCharacterForm, useExportToImage } from '@/hooks'
import { AuthButton } from '@/components/auth/AuthButton'
import { PcClassTab } from '@/components/PcClassTab'
import {
  PaperContainer,
  TextInput,
  AutoResizeTextarea,
  Button,
  SectionHeader,
  FieldLabel,
  Box,
  Toolbar,
  Select,
} from '@/components/ui'
import { calculateAbilityModifier, type AbilityKey } from '@/types/abilities'
import { ABILITIES_ORDER, SKILL_DATA } from '@/features/character-sheet/constants'
import { applySlotOverrides } from '@/data/classTables'
import { CLASSES_2024 } from '@/data/classTables2024'
import { SUBCLASS_OPTIONS } from '@/data/dndRules'
import type {
  Attack,
  Spell,
  ItemCategory,
  ClassFeature,
  SpeciesTrait,
  Feat,
  InventoryItem,
  Character,
} from '@/types/character'

const ABILITY_NAMES_FR: Record<(typeof ABILITIES_ORDER)[number], string> = {
  str: 'Force',
  dex: 'Dextérité',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Sagesse',
  cha: 'Charisme',
}

const THIRD_CASTER_SLOTS: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [2, 0, 0, 0, 0, 0, 0, 0, 0],
  [3, 0, 0, 0, 0, 0, 0, 0, 0],
  [3, 0, 0, 0, 0, 0, 0, 0, 0],
  [3, 0, 0, 0, 0, 0, 0, 0, 0],
  [4, 2, 0, 0, 0, 0, 0, 0, 0],
  [4, 2, 0, 0, 0, 0, 0, 0, 0],
  [4, 2, 0, 0, 0, 0, 0, 0, 0],
  [4, 3, 0, 0, 0, 0, 0, 0, 0],
  [4, 3, 0, 0, 0, 0, 0, 0, 0],
  [4, 3, 0, 0, 0, 0, 0, 0, 0],
  [4, 3, 2, 0, 0, 0, 0, 0, 0],
  [4, 3, 2, 0, 0, 0, 0, 0, 0],
  [4, 3, 2, 0, 0, 0, 0, 0, 0],
  [4, 3, 3, 0, 0, 0, 0, 0, 0],
  [4, 3, 3, 1, 0, 0, 0, 0, 0],
  [4, 3, 3, 1, 0, 0, 0, 0, 0],
  [4, 3, 3, 2, 0, 0, 0, 0, 0],
  [4, 3, 3, 2, 0, 0, 0, 0, 0],
]

const THIRD_CASTER_SUBCLASSES = new Set([
  'Escroc Arcanique',
  'Filou Arcanique',
  'Chevalier Occulte',
  'Arcane Trickster',
  'Eldritch Knight',
])

export default function CharacterSheetPage() {
  const sheetRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { character, updateField, updateCharacter, handleExport, handleImport, reset } = useCharacterForm()
  const { exportToPdf, exportToPng, isExporting } = useExportToImage()
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'core' | 'spells' | 'inventory'>('core')
  const [isEditingInit, setIsEditingInit] = useState(false)
  const [editingFeatureId, setEditingFeatureId] = useState<string | null>(null)
  const [expandedFeatureDescriptionIds, setExpandedFeatureDescriptionIds] = useState<Set<string>>(
    () => new Set()
  )
  const [openFeatureMenuId, setOpenFeatureMenuId] = useState<string | null>(null)
  const [editingAttackId, setEditingAttackId] = useState<string | null>(null)
  const [attackEditSnapshot, setAttackEditSnapshot] = useState<{ id: string; attack: Attack } | null>(
    null
  )
  const [newAttackId, setNewAttackId] = useState<string | null>(null)
  const [openAttackMenuId, setOpenAttackMenuId] = useState<string | null>(null)
  const [expandedAttackId, setExpandedAttackId] = useState<string | null>(null)
  const [featureEditSnapshots, setFeatureEditSnapshots] = useState<Record<string, ClassFeature>>({})
  const [newFeatureId, setNewFeatureId] = useState<string | null>(null)
  const [expandedInventoryNotesId, setExpandedInventoryNotesId] = useState<string | null>(
    null
  )
  const [editingInventoryId, setEditingInventoryId] = useState<string | null>(null)
  const [inventoryEditSnapshot, setInventoryEditSnapshot] = useState<{
    id: string
    item: InventoryItem
  } | null>(null)
  const [newInventoryId, setNewInventoryId] = useState<string | null>(null)
  const [openInventoryMenuId, setOpenInventoryMenuId] = useState<string | null>(null)

  // Calculate proficiency bonus from level
  const proficiencyBonus = useMemo(() => {
    const level = character.level || 1
    return Math.ceil(level / 4) + 1
  }, [character.level])

  const constitutionMod = useMemo(
    () => calculateAbilityModifier(character.abilities.con),
    [character.abilities.con]
  )

  const avgPerLevel = useMemo(() => character.hitDiceType / 2 + 1, [character.hitDiceType])

  const baseSlotTotals = useMemo(() => {
    const classData = CLASSES_2024[character.class]
    const levelIndex = Math.max(1, Math.min(20, character.level)) - 1
    const isThirdCaster = THIRD_CASTER_SUBCLASSES.has(character.subclass ?? '')
    const slots = isThirdCaster
      ? THIRD_CASTER_SLOTS[levelIndex] ?? []
      : classData?.levels[levelIndex]?.slots ?? []
    const totals: Record<number, number> = {}
    for (let slotLevel = 1; slotLevel <= 9; slotLevel += 1) {
      totals[slotLevel] = isThirdCaster ? slots[slotLevel - 1] ?? 0 : slots[slotLevel] ?? 0
    }
    return totals
  }, [character.class, character.level, character.subclass])

  const currentMaxSlots = useMemo(
    () => applySlotOverrides(baseSlotTotals, character.slotOverrides),
    [baseSlotTotals, character.slotOverrides]
  )

  const classOptions = useMemo(
    () =>
      Object.values(CLASSES_2024).map((entry) => ({
        value: entry.name,
        label: entry.name,
      })),
    []
  )

  const subclassOptions = useMemo(
    () => SUBCLASS_OPTIONS[character.class] ?? [],
    [character.class]
  )

  const handleClassChange = (value: string) => {
    const nextSubclassOptions = SUBCLASS_OPTIONS[value] ?? []
    const nextSubclass = nextSubclassOptions.includes(character.subclass) ? character.subclass : ''
    updateCharacter({ class: value, subclass: nextSubclass })
  }

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
    const level = character.level
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

    if (character.class === 'Barde') {
      const chaMod = calculateAbilityModifier(character.abilities.cha)
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

    if (character.class === 'Barbare') {
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

    if (character.class === 'Clerc') {
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

    if (character.class === 'Druide') {
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

    if (character.class === 'Guerrier' && character.subclass === 'Maître de Guerre') {
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

    if (character.class === 'Moine') {
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

    if (character.class === 'Paladin') {
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

    if (character.class === 'Rôdeur') {
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

    if (character.class === 'Ensorceleur') {
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
  }, [
    character.class,
    character.subclass,
    character.level,
    character.abilities.cha,
    proficiencyBonus,
  ])

  const coreResourceIds = useMemo(
    () => new Set(classResourceDefinitions.map((resource) => resource.id)),
    [classResourceDefinitions]
  )

  const manualClassFeatures = useMemo(
    () =>
      character.classFeatures
        .map((feature, index) => ({ feature, index }))
        .filter(({ feature }) => !coreResourceIds.has(feature.id)),
    [character.classFeatures, coreResourceIds]
  )

  const calculatedHpMax = useMemo(() => {
    const hpLevel1 = character.hitDiceType + constitutionMod
    const hpSubsequent = Math.max(0, character.level - 1) * (avgPerLevel + constitutionMod)
    return Math.floor(hpLevel1 + hpSubsequent)
  }, [character.hitDiceType, character.level, constitutionMod, avgPerLevel])

  const effectiveHpMax = useMemo(() => {
    const override = parseInt(character.hpMaxOverride, 10)
    if (Number.isFinite(override) && override > 0) return override
    return calculatedHpMax
  }, [character.hpMaxOverride, calculatedHpMax])

  const initiativeTotal = useMemo(() => {
    const dexMod = calculateAbilityModifier(character.abilities.dex)
    return dexMod + (character.initMisc || 0)
  }, [character.abilities.dex, character.initMisc])

  // Calculate Spell Save DC automatically based on spellcastingAttribute
  const spellDC = useMemo(() => {
    if (character.spellcastingAttribute === 'None') return ''
    const abilityMap: Record<string, keyof typeof character.abilities> = {
      'INT': 'int',
      'WIS': 'wis',
      'CHA': 'cha',
    }
    const mappedKey = abilityMap[character.spellcastingAttribute]
    if (!mappedKey) return ''
    const abilityScore = character.abilities[mappedKey]
    const abilityModifier = calculateAbilityModifier(abilityScore)
    return 8 + proficiencyBonus + abilityModifier
  }, [character.spellcastingAttribute, character.abilities, proficiencyBonus])

  // Calculate Spell Attack Bonus automatically based on spellcastingAttribute
  const spellAttackBonus = useMemo(() => {
    if (character.spellcastingAttribute === 'None') return ''
    const abilityMap: Record<string, keyof typeof character.abilities> = {
      'INT': 'int',
      'WIS': 'wis',
      'CHA': 'cha',
    }
    const mappedKey = abilityMap[character.spellcastingAttribute]
    if (!mappedKey) return ''
    const abilityScore = character.abilities[mappedKey]
    const abilityModifier = calculateAbilityModifier(abilityScore)
    return proficiencyBonus + abilityModifier
  }, [character.spellcastingAttribute, character.abilities, proficiencyBonus])

  // Handle ability score changes
  const handleAbilityChange = (ability: string, value: number) => {
    const score = Math.max(1, Math.min(30, value || 10))
    updateField('abilities', { ...character.abilities, [ability]: score })
  }

  const formatSigned = (value: number) => (value >= 0 ? `+${value}` : `${value}`)

  // Handle skill proficiency toggle (0 -> 1 -> 2 -> 0)
  const cycleSkillProficiency = (skillKey: string) => {
    const current = character.skills[skillKey as keyof typeof character.skills] ?? 0
    const next = current >= 2 ? 0 : ((current + 1) as 0 | 1 | 2)
    updateField('skills', {
      ...character.skills,
      [skillKey]: next,
    })
  }

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

  // Calculate skill bonus
  const getSkillBonus = (skillKey: string) => {
    const skill = SKILL_DATA.find((s) => s.key === skillKey)
    if (!skill) return 0
    const abilityScore = character.abilities[skill.ability]
    const abilityMod = calculateAbilityModifier(abilityScore)
    const proficiencyLevel = character.skills[skillKey as keyof typeof character.skills] || 0
    return abilityMod + proficiencyBonus * proficiencyLevel
  }

  const getSavingThrowBonus = (ability: keyof typeof character.saves) => {
    const abilityMod = calculateAbilityModifier(character.abilities[ability])
    return abilityMod + (character.saves[ability] ? proficiencyBonus : 0)
  }

  const parseNumber = (value: string) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  const getAttackAutoBonus = (attack: Attack) => {
    const abilityMod = calculateAbilityModifier(character.abilities[attack.ability]) || 0
    const magicMod = parseNumber(attack.magicMod)
    const profMult = attack.proficiencyLevel ? 1 : 0
    return (abilityMod || 0) + (magicMod || 0) + proficiencyBonus * profMult
  }

  const getAttackDamageDisplay = (attack: Attack) => {
    if (!attack.damageDie) return '—'
    const abilityMod = calculateAbilityModifier(character.abilities[attack.ability]) || 0
    const magicMod = parseNumber(attack.magicMod)
    const totalMod = abilityMod + magicMod
    const count = Math.max(1, attack.damageDiceCount || 1)
    return `${count}${attack.damageDie}${formatSigned(totalMod)}`
  }

  const getFeatureValueDisplay = (feature: ClassFeature) => {
    const valueDie = feature.data.valueDie
    const count = Math.max(1, feature.data.valueDiceCount || 1)
    const flatMod = parseNumber(feature.data.valueMod ?? '')
    const useAbility = feature.data.valueUseAbility && feature.data.valueAbility
    const abilityMod = useAbility
      ? calculateAbilityModifier(
          character.abilities[feature.data.valueAbility as keyof typeof character.abilities]
        ) || 0
      : 0
    if (!valueDie) {
      if (feature.data.value) return feature.data.value
      return '—'
    }
    const totalMod = flatMod + abilityMod
    return `${count}${valueDie}${formatSigned(totalMod)}`
  }

  const applyRest = (type: 'short' | 'long') => {
    const maxHp = effectiveHpMax
    const currentHp = parseNumber(character.hpCurrent)
    const healed = Math.floor(maxHp / 2)
    const nextHp = type === 'long' ? maxHp : Math.min(maxHp, currentHp + healed)
    const nextFeatures = character.classFeatures.map((feature) => {
      if (!feature.resource) return feature
      if (type !== 'long' && feature.resource.reset !== 'short') return feature
      return {
        ...feature,
        resource: {
          ...feature.resource,
          current: 0,
        },
      }
    })
    const updates: Partial<Character> = {
      hpCurrent: String(nextHp),
      classFeatures: nextFeatures,
    }
    if (type === 'long') {
      updates.spellSlots = Object.fromEntries(
        Object.entries(character.spellSlots).map(([level, slot]) => [
          level,
          { ...slot, used: 0 },
        ])
      )
    }
    updateCharacter(updates)
  }

  const handleShortRest = () => applyRest('short')
  const handleLongRest = () => applyRest('long')

  // Attacks management
  const addAttack = () => {
    const id = createAttackId()
    updateField('attacks', [
      ...character.attacks,
      {
        id,
        name: '',
        damageDiceCount: 1,
        damageDie: '',
        ability: 'str',
        magicMod: '0',
        proficiencyLevel: 0,
        property: '',
        notes: '',
        special: '',
      },
    ])
    return id
  }

  const updateAttack = (index: number, updates: Partial<Attack>) => {
    const newAttacks = [...character.attacks]
    const current = newAttacks[index]
    if (!current) return
    newAttacks[index] = { 
      id: current.id,
      name: updates.name ?? current.name,
      damageDiceCount: updates.damageDiceCount ?? current.damageDiceCount,
      damageDie: updates.damageDie ?? current.damageDie,
      ability: updates.ability ?? current.ability,
      magicMod: updates.magicMod ?? current.magicMod,
      proficiencyLevel: updates.proficiencyLevel ?? current.proficiencyLevel,
      property: updates.property ?? current.property,
      notes: updates.notes ?? current.notes,
      special: updates.special ?? current.special,
    }
    updateField('attacks', newAttacks)
  }

  const removeAttack = (index: number) => {
    const removedId = character.attacks[index]?.id
    updateField('attacks', character.attacks.filter((_, i) => i !== index))
    if (removedId && editingAttackId === removedId) {
      setEditingAttackId(null)
      setNewAttackId(null)
      setAttackEditSnapshot(null)
    }
    if (removedId && openAttackMenuId === removedId) {
      setOpenAttackMenuId(null)
    }
  }

  // Proficiencies management
  // Class features management
  const addClassFeature = () => {
    if (editingFeatureId) return
    const newFeature = createEmptyClassFeature()
    updateField('classFeatures', [...character.classFeatures, newFeature])
    setEditingFeatureId(newFeature.id)
    setNewFeatureId(newFeature.id)
  }

  const updateClassFeature = (index: number, updates: Partial<ClassFeature>) => {
    const newItems = [...character.classFeatures]
    const current = newItems[index]
    if (!current) return
    newItems[index] = {
      ...current,
      ...updates,
    }
    updateField('classFeatures', newItems)
  }

  const updateClassFeatureAt = (index: number, updater: (feature: ClassFeature) => ClassFeature) => {
    const newItems = [...character.classFeatures]
    const current = newItems[index]
    if (!current) return
    newItems[index] = updater(current)
    updateField('classFeatures', newItems)
  }

  const updateCoreResource = (resourceId: string, nextCurrent: number) => {
    const definition = classResourceDefinitions.find((resource) => resource.id === resourceId)
    if (!definition || definition.isUnlimited) return
    const max = Math.max(0, definition.max)
    const clamped = Math.max(0, Math.min(max, nextCurrent))
    const existingIndex = character.classFeatures.findIndex((feature) => feature.id === resourceId)
    const nextFeatures = [...character.classFeatures]
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
    updateField('classFeatures', nextFeatures)
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
    const stored = character.classFeatures.find((entry) => entry.id === linkId)
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
    const removedId = character.classFeatures[index]?.id
    updateField('classFeatures', character.classFeatures.filter((_, i) => i !== index))
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

  const createAttackId = () => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID()
    }
    return `atk-${Date.now()}`
  }

  const createInventoryItemId = () => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID()
    }
    return `inv-${Date.now()}`
  }

  const cancelClassFeatureEdit = (featureId: string) => {
    if (newFeatureId === featureId) {
      const index = character.classFeatures.findIndex((feature) => feature.id === featureId)
      if (index >= 0) {
        updateField('classFeatures', character.classFeatures.filter((_, i) => i !== index))
      }
      setNewFeatureId(null)
      setEditingFeatureId(null)
      return
    }
    const snapshot = featureEditSnapshots[featureId]
    if (snapshot) {
      updateField(
        'classFeatures',
        character.classFeatures.map((feature) => (feature.id === featureId ? snapshot : feature))
      )
      setFeatureEditSnapshots((prev) => {
        const next = { ...prev }
        delete next[featureId]
        return next
      })
    }
    setEditingFeatureId(null)
  }

  // Species traits management
  const addSpeciesTrait = () => {
    updateField('speciesTraits', [...character.speciesTraits, { name: '', description: '' }])
  }

  const updateSpeciesTrait = (index: number, updates: Partial<SpeciesTrait>) => {
    const newItems = [...character.speciesTraits]
    const current = newItems[index]
    if (!current) return
    newItems[index] = {
      name: updates.name ?? current.name,
      description: updates.description ?? current.description,
    }
    updateField('speciesTraits', newItems)
  }

  const removeSpeciesTrait = (index: number) => {
    updateField('speciesTraits', character.speciesTraits.filter((_, i) => i !== index))
  }

  // Feats management
  const addFeat = () => {
    updateField('feats', [...character.feats, { name: '', description: '' }])
  }

  const updateFeat = (index: number, updates: Partial<Feat>) => {
    const newItems = [...character.feats]
    const current = newItems[index]
    if (!current) return
    newItems[index] = {
      name: updates.name ?? current.name,
      description: updates.description ?? current.description,
    }
    updateField('feats', newItems)
  }

  const removeFeat = (index: number) => {
    updateField('feats', character.feats.filter((_, i) => i !== index))
  }


  // Inventory management
  const addInventoryItem = (category: ItemCategory) => {
    const id = createInventoryItemId()
    updateField('inventory', [
      ...character.inventory,
      { id, name: '', quantity: '', notes: '', category },
    ])
    return id
  }

  const updateInventoryItem = (
    index: number,
    updates: Partial<{ name: string; quantity: string; notes: string; category: ItemCategory }>
  ) => {
    const newItems = [...character.inventory]
    const current = newItems[index]
    if (!current) return
    newItems[index] = {
      id: current.id,
      name: updates.name ?? current.name,
      quantity: updates.quantity ?? current.quantity,
      notes: updates.notes ?? current.notes,
      category: updates.category ?? current.category,
    }
    updateField('inventory', newItems)
  }

  const removeInventoryItem = (index: number) => {
    const removedId = character.inventory[index]?.id
    updateField('inventory', character.inventory.filter((_, i) => i !== index))
    if (removedId && editingInventoryId === removedId) {
      setEditingInventoryId(null)
      setNewInventoryId(null)
      setInventoryEditSnapshot(null)
    }
    if (removedId && openInventoryMenuId === removedId) {
      setOpenInventoryMenuId(null)
    }
  }

  const cancelInventoryEdit = () => {
    if (editingInventoryId === null) return
    if (newInventoryId !== null && newInventoryId === editingInventoryId) {
      updateField('inventory', character.inventory.filter((item) => item.id !== editingInventoryId))
    } else if (inventoryEditSnapshot && inventoryEditSnapshot.id === editingInventoryId) {
      updateField(
        'inventory',
        character.inventory.map((item) =>
          item.id === editingInventoryId ? inventoryEditSnapshot.item : item
        )
      )
    }
    setEditingInventoryId(null)
    setNewInventoryId(null)
    setInventoryEditSnapshot(null)
  }

  const cancelAttackEdit = () => {
    if (!editingAttackId) return
    if (newAttackId && newAttackId === editingAttackId) {
      updateField('attacks', character.attacks.filter((attack) => attack.id !== editingAttackId))
    } else if (attackEditSnapshot && attackEditSnapshot.id === editingAttackId) {
      updateField(
        'attacks',
        character.attacks.map((attack) =>
          attack.id === editingAttackId ? attackEditSnapshot.attack : attack
        )
      )
    }
    setEditingAttackId(null)
    setNewAttackId(null)
    setAttackEditSnapshot(null)
  }

  // Spells management
  const addSpell = (level: number) => {
    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `spell-${Date.now()}`
    updateField('spells', [
      ...character.spells,
      {
        id,
        name: '',
        level: level.toString(),
        school: '',
        type: '',
        range: '',
        duration: '',
        components: '',
        dice: '',
        diceMode: 'dice',
        diceCount: 1,
        diceDie: '',
        diceMod: '',
        diceCustom: '',
        concentration: false,
        ritual: false,
        saveThrow: false,
        saveThrowAbility: 'STR',
        description: '',
      },
    ])
    return id
  }

  const updateSpell = (index: number, updates: Partial<Spell>) => {
    const newSpells = [...character.spells]
    const current = newSpells[index]
    if (!current) return
    newSpells[index] = {
      id: current.id,
      name: updates.name ?? current.name,
      level: updates.level ?? current.level,
      school: updates.school ?? current.school,
      type: updates.type ?? current.type,
      range: updates.range ?? current.range,
      duration: updates.duration ?? current.duration,
      components: updates.components ?? current.components,
      dice: updates.dice ?? current.dice,
      diceMode: updates.diceMode ?? current.diceMode,
      diceCount: updates.diceCount ?? current.diceCount,
      diceDie: updates.diceDie ?? current.diceDie,
      diceMod: updates.diceMod ?? current.diceMod,
      diceCustom: updates.diceCustom ?? current.diceCustom,
      concentration: updates.concentration ?? current.concentration,
      ritual: updates.ritual ?? current.ritual,
      saveThrow: updates.saveThrow ?? current.saveThrow,
      saveThrowAbility: updates.saveThrowAbility ?? current.saveThrowAbility,
      description: updates.description ?? current.description,
    }
    updateField('spells', newSpells)
  }

  const removeSpell = (index: number) => {
    updateField('spells', character.spells.filter((_, i) => i !== index))
  }

  // Spell slots management
  const updateSpellSlot = (level: number, field: 'total' | 'used', value: number) => {
    const slots = { ...character.spellSlots }
    if (!slots[level]) {
      slots[level] = { total: 0, used: 0 }
    }

    if (field === 'used') {
      const maxForLevel = currentMaxSlots[level] ?? 0
      slots[level] = { ...slots[level], used: value, total: maxForLevel }
      updateField('spellSlots', slots)
      return
    }

    const baseTotal = baseSlotTotals[level] ?? 0
    const nextOverrides = { ...character.slotOverrides, [level]: value - baseTotal }
    slots[level] = { ...slots[level], total: Math.max(0, value) }
    updateCharacter({ slotOverrides: nextOverrides, spellSlots: slots })
  }

  // Export handlers
  const handleExportClick = () => {
    try {
      handleExport()
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await handleImport(file)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    }
    e.target.value = ''
  }

  const handleDownloadPdf = async () => {
    try {
      await exportToPdf(sheetRef, 'fiche-pj.pdf')
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF export failed')
    }
  }

  const handleDownloadPng = async () => {
    try {
      await exportToPng(sheetRef, 'fiche-pj.png')
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PNG export failed')
    }
  }

  const handleReset = () => {
    if (window.confirm('Are you sure? Unsaved changes will be lost.')) {
      reset()
      setError(null)
    }
  }

  const inventoryCategories: Array<{ key: ItemCategory; label: string }> = [
    { key: 'weapons', label: 'Équipé / Armes / Armures' },
    { key: 'consumables', label: 'Consommables' },
    { key: 'other', label: 'Autre' },
  ]
  const editingInventoryCategory =
    editingInventoryId !== null
      ? character.inventory.find((item) => item.id === editingInventoryId)?.category
      : null

  useEffect(() => {
    if (!openInventoryMenuId) return
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) return
      if (target.closest('[data-inventory-menu]')) return
      setOpenInventoryMenuId(null)
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [openInventoryMenuId])

  useEffect(() => {
    if (!openAttackMenuId) return
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) return
      if (target.closest('[data-attack-menu]')) return
      setOpenAttackMenuId(null)
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [openAttackMenuId])

  useEffect(() => {
    if (!openFeatureMenuId) return
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) return
      if (target.closest('[data-feature-menu]')) return
      setOpenFeatureMenuId(null)
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [openFeatureMenuId])

  return (
    <div className="min-h-screen p-5 bg-gray-200">
      <div className="max-w-[1100px] mx-auto flex flex-col gap-3">
        <Toolbar
          left={
            <Link to="/">
              <Button>⬅ Retour</Button>
            </Link>
          }
          right={
            <>
              <AuthButton />
              <Button onClick={handleExportClick}>Exporter la fiche (JSON)</Button>
              <Button onClick={handleImportClick}>Importer une fiche</Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button onClick={handleReset} variant="small">
                Reset
              </Button>
              <Button onClick={handleDownloadPdf} disabled={isExporting}>
                {isExporting ? 'Génération...' : 'Télécharger en PDF'}
              </Button>
              <Button onClick={handleDownloadPng} disabled={isExporting} variant="small">
                {isExporting ? 'Génération...' : 'Télécharger en PNG'}
              </Button>
              <Button onClick={handleDownloadPng} disabled={isExporting} variant="small">
                {isExporting ? 'Génération...' : 'Télécharger en PNG'}
              </Button>
            </>
          }
        />

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div ref={sheetRef}>
          <PaperContainer>
          {/* Header */}
          <header>
            <input
              type="text"
              value={character.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Nom du personnage"
              className="font-display text-ink text-[26px] mb-2 uppercase bg-transparent border-none outline-none focus:underline w-full"
            />
            <div className="grid grid-cols-4 gap-x-2.5 gap-y-1.5 text-xs">
              <Select
                label="Classe"
                value={character.class}
                onChange={(e) => handleClassChange(e.target.value)}
                options={classOptions}
              />
              <Select
                label={CLASSES_2024[character.class]?.subclassLabel ?? 'Sous-classe'}
                value={character.subclass}
                onChange={(e) => updateField('subclass', e.target.value)}
                options={subclassOptions.map((option) => ({
                  value: option,
                  label: option,
                }))}
                disabled={character.level < 3}
              />
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-wider text-[#7a4b36]">
                  Niveau
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={character.level}
                  onChange={(e) => {
                    const level = parseInt(e.target.value) || 1
                    updateField('level', Math.max(1, Math.min(20, level)))
                  }}
                  className="w-12 text-center font-semibold bg-transparent border border-[#bda68a] rounded px-1 py-0.5 text-xs focus:border-ink focus:outline-none"
                  placeholder="1"
                />
              </div>
              <TextInput
                label="Passif/Profession"
                value={character.background}
                onChange={(e) => updateField('background', e.target.value)}
                className="text-xs"
              />
              <TextInput
                label="Race"
                value={character.race}
                onChange={(e) => updateField('race', e.target.value)}
                className="text-xs"
              />
              <TextInput
                label="Alignement"
                value={character.alignment}
                onChange={(e) => updateField('alignment', e.target.value)}
                className="text-xs"
              />
              <TextInput
                label="Points d'expérience"
                value={character.xp}
                onChange={(e) => updateField('xp', e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="mt-2 flex justify-end gap-2">
              <Button variant="small" onClick={handleShortRest}>
                Repos court
              </Button>
              <Button variant="small" onClick={handleLongRest}>
                Repos long
              </Button>
            </div>
          </header>

          <div className="mt-3 flex gap-2">
            <Button
              onClick={() => setActiveTab('core')}
              className={activeTab === 'core' ? 'bg-[#e6d3b4]' : ''}
            >
              Cœur & Combat
            </Button>
            <Button
              onClick={() => setActiveTab('spells')}
              className={activeTab === 'spells' ? 'bg-[#e6d3b4]' : ''}
            >
              Sorts
            </Button>
            <Button
              onClick={() => setActiveTab('inventory')}
              className={activeTab === 'inventory' ? 'bg-[#e6d3b4]' : ''}
            >
              Inventaire & Bio
            </Button>
          </div>

          {activeTab === 'core' && (
            <div className="mt-3 grid grid-cols-12 gap-6">
              <div className="col-span-2 min-w-[180px] pr-4 border-r border-[#c9b89c]">
              <SectionHeader>Caractéristiques</SectionHeader>
                <div className="mt-1 flex items-center gap-2">
                  <FieldLabel>Bonus de Maîtrise</FieldLabel>
                  <Box className="bg-white/60 text-center font-semibold">+{proficiencyBonus}</Box>
                </div>
              <div className="flex flex-col gap-2 mt-1.5">
                {ABILITIES_ORDER.map((ability) => {
                  const skills = SKILL_DATA.filter((skill) => skill.ability === ability)
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
                          value={character.abilities[ability]}
                          onChange={(e) => handleAbilityChange(ability, parseInt(e.target.value) || 10)}
                          className="w-10 text-center font-semibold bg-transparent border border-[#bda68a] rounded px-1 py-0.5 text-[11px] focus:border-ink focus:outline-none shrink-0"
                          placeholder="10"
                        />
                        <div className="text-right font-semibold text-[11px] min-w-[28px] shrink-0">
                          {formatSigned(calculateAbilityModifier(character.abilities[ability]))}
                        </div>
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-[10px]">
                        <button
                          type="button"
                          onClick={() =>
                            updateField('saves', { ...character.saves, [ability]: !character.saves[ability] })
                          }
                          className={`w-6 h-6 rounded-full border flex items-center justify-center ${getProficiencyBadgeClasses(character.saves[ability] ? 1 : 0)}`}
                          title={character.saves[ability] ? 'Maîtrise' : 'Non maîtrisé'}
                        >
                          {getProficiencyLabel(character.saves[ability] ? 1 : 0)}
                        </button>
                        <span>Jet {formatSigned(getSavingThrowBonus(ability))}</span>
                      </div>
                      {skills.length > 0 && (
                        <div className="mt-1 text-[10px]">
                          {skills.map((skill) => {
                            const proficiencyLevel = character.skills[skill.key] || 0
                            const bonus = getSkillBonus(skill.key)
                            return (
                              <div key={skill.key} className="flex items-center gap-1 mb-0.5">
                                <button
                                  type="button"
                                  onClick={() => cycleSkillProficiency(skill.key)}
                                  className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] ${getProficiencyBadgeClasses(proficiencyLevel)}`}
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

              <div className="col-span-10 pl-4">
                <div className="grid grid-cols-3 gap-2">
                  <TextInput
                    label="CA"
                    value={character.ac}
                    onChange={(e) => updateField('ac', e.target.value)}
                  />
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase tracking-wider text-[#7a4b36]">
                      Initiative
                    </label>
                    {isEditingInit ? (
                      <input
                        type="number"
                        value={String(character.initMisc)}
                        onChange={(e) => updateField('initMisc', parseInt(e.target.value) || 0)}
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
                        {formatSigned(initiativeTotal)}
                      </div>
                    )}
                  </div>
                  <TextInput
                    label="Vitesse"
                    value={character.speed}
                    onChange={(e) => updateField('speed', e.target.value)}
                  />
                </div>
                <div className="mt-2 border border-[#c9b89c] bg-white/40 p-2">
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    <div className="border border-[#c9b89c] bg-white/60 rounded p-1.5 text-center">
                      <div className="text-[10px] uppercase tracking-wider text-[#7a4b36]">
                        PV Actuels
                      </div>
                      <input
                        type="number"
                    value={character.hpCurrent}
                        onChange={(e) => {
                          const next = Math.min(parseInt(e.target.value) || 0, effectiveHpMax)
                          updateField('hpCurrent', String(next))
                        }}
                        className="w-full text-center font-semibold bg-transparent border-none outline-none text-sm"
                        placeholder="0"
                      />
                    </div>
                    <div className="border border-[#c9b89c] bg-white/60 rounded p-1.5 text-center">
                      <div className="text-[10px] uppercase tracking-wider text-[#7a4b36]">
                        PV Max
                      </div>
                      <div className="text-xs font-semibold">{effectiveHpMax}</div>
                      <input
                        type="number"
                        value={character.hpMaxOverride}
                        onChange={(e) => updateField('hpMaxOverride', e.target.value)}
                        className="w-full text-center font-semibold bg-transparent border border-[#bda68a] rounded px-1 py-0.5 text-xs mt-1"
                        placeholder="Saisie manuelle"
                      />
                    </div>
                    <div className="border border-[#bcd7ff] bg-[#e9f2ff] rounded p-1.5 text-center">
                      <div className="text-[10px] uppercase tracking-wider text-[#4a6aa8]">
                        PV Temp
                      </div>
                      <input
                        type="number"
                        value={character.tempHp}
                        onChange={(e) => updateField('tempHp', e.target.value)}
                        className="w-full text-center font-semibold bg-transparent border-none outline-none text-sm"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="border border-[#c9b89c] bg-white/60 rounded p-2 flex items-center gap-2">
                      <Select
                        label="Dés de Vie"
                        value={String(character.hitDiceType)}
                        onChange={(e) => updateField('hitDiceType', parseInt(e.target.value) || 8)}
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
                        {character.level}d{character.hitDiceType} + {character.level * constitutionMod}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 border border-[#c9b89c] bg-white/60 rounded p-2 shadow-sm h-auto">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <SectionHeader>Avantage JDS</SectionHeader>
                      <AutoResizeTextarea
                        value={character.savingThrowAdvantages}
                        onChange={(e) => updateField('savingThrowAdvantages', e.target.value)}
                        className="mt-1"
                        placeholder="Avantages"
                      />
                    </div>
                    <div>
                      <SectionHeader>Désavantage JDS</SectionHeader>
                      <AutoResizeTextarea
                        value={character.savingThrowDisadvantages}
                        onChange={(e) => updateField('savingThrowDisadvantages', e.target.value)}
                        className="mt-1"
                        placeholder="Désavantages"
                      />
                    </div>
                    <div>
                      <SectionHeader>États / Conditions</SectionHeader>
                      <AutoResizeTextarea
                        value={character.conditions}
                        onChange={(e) => updateField('conditions', e.target.value)}
                        className="mt-1"
                        placeholder="États"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 border border-[#c9b89c] bg-white/60 rounded p-2 shadow-sm h-auto">
                  <SectionHeader>Attaques</SectionHeader>
                  <div className="grid grid-cols-[1fr_0.4fr_0.55fr_1fr_0.7fr_1fr_auto] gap-1 text-[11px] mt-1">
                    <FieldLabel className="text-center">Nom</FieldLabel>
                    <FieldLabel className="text-center">Maîtrise</FieldLabel>
                    <FieldLabel className="text-center">Bonus Attaque</FieldLabel>
                    <FieldLabel className="text-center">Damage</FieldLabel>
                    <FieldLabel className="text-center">Propriété</FieldLabel>
                    <FieldLabel className="text-center">Spécial</FieldLabel>
                    <FieldLabel className="text-center" aria-hidden="true">
                      &nbsp;
                    </FieldLabel>
                  </div>
              <div className="mt-1">
                {character.attacks.map((attack, idx) => (
                  <div
                    key={attack.id}
                    className="mb-1 border border-[#c9b89c] bg-white/40 p-1.5"
                  >
                    {editingAttackId === attack.id ? (
                      <>
                        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-1 items-start">
                          <Box className="flex flex-col gap-1 text-center">
                            <FieldLabel className="text-center">Nom</FieldLabel>
                            <AutoResizeTextarea
                              value={attack.name}
                              onChange={(e) => updateAttack(idx, { name: e.target.value })}
                              className="w-full bg-transparent border-none outline-none font-bold leading-tight text-center"
                              placeholder="Nom"
                            />
                          </Box>
                          <Box className="flex flex-col items-center gap-1 text-center">
                            <FieldLabel className="text-center">Maîtrise</FieldLabel>
                            <button
                              type="button"
                              onClick={() => {
                                const nextLevel =
                                  attack.proficiencyLevel === 2
                                    ? 0
                                    : ((attack.proficiencyLevel + 1) as 0 | 1 | 2)
                                updateAttack(idx, { proficiencyLevel: nextLevel })
                              }}
                              className={`w-4 h-4 rounded-full border flex items-center justify-center text-[9px] ${getProficiencyBadgeClasses(attack.proficiencyLevel)}`}
                              title={
                                attack.proficiencyLevel === 2
                                  ? 'Expertise'
                                  : attack.proficiencyLevel === 1
                                  ? 'Maîtrise'
                                  : 'Aucune'
                              }
                            >
                              {getProficiencyLabel(attack.proficiencyLevel)}
                            </button>
                          </Box>
                          <Box className="flex flex-col items-center gap-1 text-[10px] font-semibold text-center">
                            <FieldLabel className="text-center">Bonus</FieldLabel>
                            {formatSigned(getAttackAutoBonus(attack))}
                          </Box>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="small"
                              onClick={() => {
                                setEditingAttackId(null)
                                setNewAttackId(null)
                                setAttackEditSnapshot(null)
                              }}
                            >
                              OK
                            </Button>
                            <Button variant="small" onClick={cancelAttackEdit}>
                              Annuler
                            </Button>
                          </div>
                        </div>
                        <div className="mt-1 grid grid-cols-2 gap-2">
                          <Box className="flex flex-col gap-1 text-center">
                            <FieldLabel className="text-center">Carac.</FieldLabel>
                            <Select
                              value={attack.ability}
                              onChange={(e) =>
                                updateAttack(idx, { ability: e.target.value as Attack['ability'] })
                              }
                              options={[
                                { value: 'str', label: 'FOR' },
                                { value: 'dex', label: 'DEX' },
                                { value: 'con', label: 'CON' },
                                { value: 'int', label: 'INT' },
                                { value: 'wis', label: 'SAG' },
                                { value: 'cha', label: 'CHA' },
                              ]}
                              className="text-[11px] min-h-[22px]"
                            />
                          </Box>
                          <Box className="flex flex-col gap-1 text-center">
                            <FieldLabel className="text-center">Mod</FieldLabel>
                            <input
                              type="number"
                              value={attack.magicMod}
                              onChange={(e) => updateAttack(idx, { magicMod: e.target.value })}
                              className="w-full bg-transparent border-none outline-none text-xs text-center"
                              placeholder="0"
                            />
                          </Box>
                          <Box className="flex flex-col gap-1 text-center">
                            <FieldLabel className="text-center">Dés</FieldLabel>
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                min="1"
                                value={attack.damageDiceCount}
                                onChange={(e) =>
                                  updateAttack(idx, {
                                    damageDiceCount: Math.max(1, parseInt(e.target.value) || 1),
                                  })
                                }
                                className="w-10 text-center bg-transparent border border-[#bda68a] rounded px-1 py-0.5 text-[10px]"
                              />
                              <Select
                                value={attack.damageDie}
                                onChange={(e) => updateAttack(idx, { damageDie: e.target.value })}
                                options={[
                                  { value: '', label: '—' },
                                  { value: 'd4', label: 'd4' },
                                  { value: 'd6', label: 'd6' },
                                  { value: 'd8', label: 'd8' },
                                  { value: 'd10', label: 'd10' },
                                  { value: 'd12', label: 'd12' },
                                ]}
                                className="text-[11px] min-h-[22px]"
                              />
                            </div>
                          </Box>
                          <Box className="flex flex-col gap-1 text-center">
                            <FieldLabel className="text-center">Propriété</FieldLabel>
                            <AutoResizeTextarea
                              value={attack.property}
                              onChange={(e) => updateAttack(idx, { property: e.target.value })}
                              className="w-full bg-transparent border-none outline-none text-xs text-center"
                              placeholder="Propriété"
                            />
                          </Box>
                          <Box className="flex flex-col gap-1 text-center">
                            <FieldLabel className="text-center">Notes</FieldLabel>
                            <AutoResizeTextarea
                              value={attack.notes}
                              onChange={(e) => updateAttack(idx, { notes: e.target.value })}
                              className="w-full bg-transparent border-none outline-none text-xs text-center"
                              placeholder="Magie / Notes"
                            />
                          </Box>
                          <Box className="flex flex-col gap-1 text-center">
                            <FieldLabel className="text-center">Spécial</FieldLabel>
                            <AutoResizeTextarea
                              value={attack.special}
                              onChange={(e) => updateAttack(idx, { special: e.target.value })}
                              className={
                                attack.proficiencyLevel === 2
                                  ? 'w-full bg-transparent border-none outline-none text-xs text-center'
                                  : 'w-full bg-gray-100 border border-gray-200 outline-none text-xs text-gray-500 text-center'
                              }
                              placeholder="Spécial"
                              disabled={attack.proficiencyLevel !== 2}
                            />
                          </Box>
                        </div>
                      </>
                    ) : (
                      <>
                        <div
                          className="grid grid-cols-[1fr_0.4fr_0.55fr_1fr_0.7fr_1fr_auto] gap-1 items-center cursor-pointer"
                          onClick={() =>
                            setExpandedAttackId(expandedAttackId === attack.id ? null : attack.id)
                          }
                        >
                          <div>
                            <div className="font-bold leading-tight text-center">{attack.name || '—'}</div>
                          </div>
                          <div className="flex items-center justify-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                const nextLevel =
                                  attack.proficiencyLevel === 2
                                    ? 0
                                    : ((attack.proficiencyLevel + 1) as 0 | 1 | 2)
                                updateAttack(idx, { proficiencyLevel: nextLevel })
                              }}
                              className={`w-4 h-4 rounded-full border flex items-center justify-center text-[9px] ${getProficiencyBadgeClasses(attack.proficiencyLevel)}`}
                              title={
                                attack.proficiencyLevel === 2
                                  ? 'Expertise'
                                  : attack.proficiencyLevel === 1
                                  ? 'Maîtrise'
                                  : 'Aucune'
                              }
                            >
                              {getProficiencyLabel(attack.proficiencyLevel)}
                            </button>
                          </div>
                          <div className="text-[10px] font-semibold text-center mr-1">
                            {formatSigned(getAttackAutoBonus(attack))}
                          </div>
                          <div className="text-xs text-center">{getAttackDamageDisplay(attack)}</div>
                          <div className="text-xs text-center">
                            <AutoResizeTextarea
                              value={attack.property}
                              onChange={(e) => updateAttack(idx, { property: e.target.value })}
                              className="w-full bg-transparent border-none outline-none text-xs text-center"
                              placeholder="Propriété"
                            />
                          </div>
                          <div className="text-xs text-center">
                            {attack.proficiencyLevel === 2 ? (
                              <AutoResizeTextarea
                                value={attack.special}
                                onChange={(e) => updateAttack(idx, { special: e.target.value })}
                                className="w-full bg-transparent border-none outline-none text-xs text-center"
                                placeholder="Spécial"
                              />
                            ) : (
                              '_'
                            )}
                          </div>
                          <div
                            className="relative flex items-center justify-end"
                            data-attack-menu
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setOpenAttackMenuId(
                                  openAttackMenuId === attack.id ? null : attack.id
                                )
                              }}
                              className="text-xs px-1"
                            >
                              ⋯
                            </button>
                            {openAttackMenuId === attack.id && (
                              <div className="absolute right-0 mt-5 z-10 bg-white border border-[#c9b89c] rounded shadow-sm text-xs">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (editingAttackId !== null) return
                                    setAttackEditSnapshot({ id: attack.id, attack })
                                    setEditingAttackId(attack.id)
                                    setOpenAttackMenuId(null)
                                  }}
                                  className="block w-full text-left px-2 py-1 hover:bg-[#f6efe4]"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    removeAttack(idx)
                                    setOpenAttackMenuId(null)
                                  }}
                                  className="block w-full text-left px-2 py-1 hover:bg-[#f6efe4]"
                                >
                                  Supprimer
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        {expandedAttackId === attack.id && attack.notes && (
                          <div className="mt-1 border-l-2 border-[#bda68a] bg-white/30 px-2 py-1 text-[10px]">
                            <div className="whitespace-pre-wrap">{attack.notes}</div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
                <div className="mt-1 flex items-center gap-2">
                  <Button
                    variant="small"
                    onClick={() => {
                      const id = addAttack()
                      setEditingAttackId(id)
                      setNewAttackId(id)
                    }}
                    disabled={editingAttackId !== null}
                  >
                    + Ajouter une attaque
                  </Button>
                </div>
                  </div>
              </div>

                <div className="mt-3 border border-[#c9b89c] bg-white/60 rounded p-2 shadow-sm h-auto">
                  <SectionHeader>Aptitudes de Classe</SectionHeader>
                  <div className="mt-1">
                    {classResourceDefinitions.length > 0 && (
                      <div className="mb-2">
                        <FieldLabel>Ressources de classe</FieldLabel>
                        <div className="mt-1 space-y-2">
                          {classResourceDefinitions.map((resource) => {
                            const stored = character.classFeatures.find(
                              (feature) => feature.id === resource.id
                            )
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
                                    className="w-3 h-3"
                                  />
                                  <span>{field.label}</span>
                                </label>
                              ))}
                            </div>

                            <div className="mt-1 grid grid-cols-2 gap-2">
                              {feature.activeFields.type && (
                                <Select
                                  label="Type d'action"
                                  value={feature.data.actionType ?? ''}
                                  onChange={(e) =>
                                    updateClassFeatureAt(index, (current) => ({
                                      ...current,
                                      data: {
                                        ...current.data,
                                        actionType: (e.target.value ||
                                          undefined) as ClassFeature['data']['actionType'],
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
                              )}
                              {feature.activeFields.range && (
                                <div className="flex flex-col gap-1">
                                  <FieldLabel>Portée</FieldLabel>
                                  <input
                                    type="text"
                                    value={feature.data.range ?? ''}
                                    onChange={(e) =>
                                      updateClassFeatureAt(index, (current) => ({
                                        ...current,
                                        data: { ...current.data, range: e.target.value },
                                      }))
                                    }
                                    className="w-full bg-transparent border border-[#bda68a] rounded px-1 py-0.5 text-xs"
                                    placeholder="ex: 18 m"
                                  />
                                </div>
                              )}
                              {feature.activeFields.value && (
                                <div className="flex flex-col gap-1">
                                  <FieldLabel>Valeur</FieldLabel>
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
                                            valueDiceCount: Math.max(
                                              1,
                                              parseInt(e.target.value, 10) || 1
                                            ),
                                          },
                                        }))
                                      }
                                      className="w-10 text-center bg-transparent border border-[#bda68a] rounded px-1 py-0.5 text-[10px]"
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
                                      className="text-[11px] min-h-[22px]"
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
                                      className="w-12 text-center bg-transparent border border-[#bda68a] rounded px-1 py-0.5 text-[10px]"
                                      placeholder="Mod"
                                    />
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px]">
                                    <label className="flex items-center gap-1">
                                      <input
                                        type="checkbox"
                                        checked={feature.data.valueUseAbility ?? false}
                                        onChange={(e) =>
                                          updateClassFeatureAt(index, (current) => ({
                                            ...current,
                                            data: {
                                              ...current.data,
                                              valueUseAbility: e.target.checked,
                                              valueAbility: e.target.checked
                                                ? current.data.valueAbility ?? 'str'
                                                : current.data.valueAbility,
                                            },
                                          }))
                                        }
                                        className="w-3 h-3"
                                      />
                                      <span>Carac.</span>
                                    </label>
                                    {feature.data.valueUseAbility && (
                                      <Select
                                        value={feature.data.valueAbility ?? 'str'}
                                        onChange={(e) =>
                                          updateClassFeatureAt(index, (current) => ({
                                            ...current,
                                            data: {
                                              ...current.data,
                                              valueAbility: e.target.value as AbilityKey,
                                            },
                                          }))
                                        }
                                        options={[
                                          { value: 'str', label: 'FOR' },
                                          { value: 'dex', label: 'DEX' },
                                          { value: 'con', label: 'CON' },
                                          { value: 'int', label: 'INT' },
                                          { value: 'wis', label: 'SAG' },
                                          { value: 'cha', label: 'CHA' },
                                        ]}
                                        className="text-[11px] min-h-[22px]"
                                      />
                                    )}
                                  </div>
                                </div>
                              )}
                              {feature.activeFields.duration && (
                                <div className="flex flex-col gap-1">
                                  <FieldLabel>Durée</FieldLabel>
                                  <input
                                    type="text"
                                    value={feature.data.duration ?? ''}
                                    onChange={(e) =>
                                      updateClassFeatureAt(index, (current) => ({
                                        ...current,
                                        data: { ...current.data, duration: e.target.value },
                                      }))
                                    }
                                    className="w-full bg-transparent border border-[#bda68a] rounded px-1 py-0.5 text-xs"
                                    placeholder="ex: 1 min"
                                  />
                                </div>
                              )}
                            </div>

                            <div className="mt-1 flex flex-wrap items-center gap-3 text-[10px]">
                              <Select
                                label="Ressource"
                                value={getFeatureResourceMode(feature)}
                                onChange={(e) =>
                                  updateClassFeatureAt(index, (current) => {
                                    const mode = e.target.value as
                                      | 'none'
                                      | 'independent'
                                      | 'class'
                                    const hasResource = mode !== 'none'
                                    return {
                                      ...current,
                                      hasResource,
                                      resourceMode: mode,
                                      resourceLinkId:
                                        mode === 'class'
                                          ? current.resourceLinkId ??
                                            classResourceDefinitions[0]?.id
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
                            </div>

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

                <div className="mt-3 border border-[#c9b89c] bg-white/60 rounded p-2 shadow-sm h-auto">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <SectionHeader>Traits d'Espèce</SectionHeader>
                      <div className="mt-1">
                        {character.speciesTraits.map((trait, idx) => (
                          <div
                            key={`species-${idx}`}
                            className="grid grid-cols-[1fr_1.4fr_auto] gap-1 items-start mb-1"
                          >
                            <Box>
                              <AutoResizeTextarea
                                value={trait.name}
                                onChange={(e) => updateSpeciesTrait(idx, { name: e.target.value })}
                                className="w-full bg-transparent border-none outline-none font-bold leading-tight"
                                placeholder="Trait"
                              />
                            </Box>
                            <Box>
                              <AutoResizeTextarea
                                value={trait.description}
                                onChange={(e) => updateSpeciesTrait(idx, { description: e.target.value })}
                                className="w-full bg-transparent border-none outline-none text-xs"
                                placeholder="Description"
                              />
                            </Box>
                            <Button variant="small" onClick={() => removeSpeciesTrait(idx)}>
                              ×
                            </Button>
                          </div>
                        ))}
                        <Button variant="small" onClick={addSpeciesTrait} className="mt-1">
                          + Ajouter un trait
                        </Button>
                      </div>
                    </div>
                    <div>
                      <SectionHeader>Dons</SectionHeader>
                      <div className="mt-1">
                        {character.feats.map((feat, idx) => (
                          <div
                            key={`feat-${idx}`}
                            className="grid grid-cols-[1fr_1.4fr_auto] gap-1 items-start mb-1"
                          >
                            <Box>
                              <AutoResizeTextarea
                                value={feat.name}
                                onChange={(e) => updateFeat(idx, { name: e.target.value })}
                                className="w-full bg-transparent border-none outline-none font-bold leading-tight"
                                placeholder="Don"
                              />
                            </Box>
                            <Box>
                              <AutoResizeTextarea
                                value={feat.description}
                                onChange={(e) => updateFeat(idx, { description: e.target.value })}
                                className="w-full bg-transparent border-none outline-none text-xs"
                                placeholder="Description"
                              />
                            </Box>
                            <Button variant="small" onClick={() => removeFeat(idx)}>
                              ×
                            </Button>
                          </div>
                        ))}
                        <Button variant="small" onClick={addFeat} className="mt-1">
                          + Ajouter un don
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 border border-[#c9b89c] bg-white/60 rounded p-2 shadow-sm h-auto">
                  <SectionHeader>Maîtrises Additionnelles</SectionHeader>
                  <AutoResizeTextarea
                    value={character.proficienciesText}
                    onChange={(e) => updateField('proficienciesText', e.target.value)}
                    className="mt-1"
                    placeholder="Armures, armes, outils..."
                />
              </div>
              </div>
            </div>
          )}
          </PaperContainer>

          {activeTab === 'spells' && (
            <>
              <SectionHeader>Sorts</SectionHeader>
              <PcClassTab
                className={character.class}
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
            </>
          )}

          {activeTab === 'inventory' && (
            <PaperContainer>
              <SectionHeader>Inventaire</SectionHeader>
              <div className="mt-1">
                {(() => {
                  const goldIndex = character.inventory.findIndex(
                    (item) => item.category === 'currency'
                  )
                  const goldItem = goldIndex >= 0 ? character.inventory[goldIndex] : undefined
                  return (
                    <div className="flex justify-center mb-2">
                      <Box className="relative px-3 py-1 text-center">
                        <span className="block text-[9px] uppercase text-[#7a4b36] mb-0.5">
                          PO
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="small"
                            onClick={() => {
                              const current = parseInt(goldItem?.quantity ?? '0') || 0
                              const next = Math.max(0, current - 1)
                            if (goldIndex >= 0) {
                                updateInventoryItem(goldIndex, {
                                  quantity: String(next),
                                  name: 'PO',
                                  category: 'currency',
                                })
                              } else {
                                updateField('inventory', [
                                  ...character.inventory,
                                {
                                  id: createInventoryItemId(),
                                  name: 'PO',
                                  quantity: String(next),
                                  notes: '',
                                  category: 'currency',
                                },
                                ])
                              }
                            }}
                          >
                            -
                          </Button>
                          <input
                            type="text"
                            value={goldItem?.quantity ?? ''}
                            onChange={(e) => {
                              const value = e.target.value
                            if (goldIndex >= 0) {
                                updateInventoryItem(goldIndex, {
                                  quantity: value,
                                  name: 'PO',
                                  category: 'currency',
                                })
                              } else {
                                updateField('inventory', [
                                  ...character.inventory,
                                {
                                  id: createInventoryItemId(),
                                  name: 'PO',
                                  quantity: value,
                                  notes: '',
                                  category: 'currency',
                                },
                                ])
                              }
                            }}
                            size={Math.max(2, String(goldItem?.quantity ?? '').length)}
                            className="w-auto min-w-[32px] bg-transparent border-none outline-none text-sm text-center font-semibold"
                            placeholder="0"
                          />
                          <Button
                            variant="small"
                            onClick={() => {
                              const current = parseInt(goldItem?.quantity ?? '0') || 0
                              const next = current + 1
                            if (goldIndex >= 0) {
                                updateInventoryItem(goldIndex, {
                                  quantity: String(next),
                                  name: 'PO',
                                  category: 'currency',
                                })
                              } else {
                                updateField('inventory', [
                                  ...character.inventory,
                                {
                                  id: createInventoryItemId(),
                                  name: 'PO',
                                  quantity: String(next),
                                  notes: '',
                                  category: 'currency',
                                },
                                ])
                              }
                            }}
                          >
                            +
                          </Button>
                        </div>
                      </Box>
                    </div>
                  )
                })()}
                <div className="grid grid-cols-3 gap-2">
                  {inventoryCategories.map((section) => (
                    <div key={section.key} className="border border-[#c9b89c] bg-white/40 p-2">
                      <div className="flex items-center justify-between">
                        <FieldLabel>{section.label}</FieldLabel>
                      </div>
                      <div className="mt-1">
                        {character.inventory.map((item, idx) => {
                          if (item.category !== section.key) return null
                          const isEditingItem = editingInventoryId === item.id
                          return (
                            <div key={item.id} className="mb-1">
                              {isEditingItem ? (
                                <>
                                  <div className="grid grid-cols-[1.4fr_0.4fr_auto] gap-1 items-center">
                                    <Box>
                                      <input
                                        type="text"
                                        value={item.name}
                                        onChange={(e) =>
                                          updateInventoryItem(idx, { name: e.target.value })
                                        }
                                        className="w-full bg-transparent border-none outline-none font-bold leading-tight"
                                        placeholder="Objet"
                                      />
                                    </Box>
                                    <Box>
                                      <input
                                        type="text"
                                        value={item.quantity}
                                        onChange={(e) =>
                                          updateInventoryItem(idx, { quantity: e.target.value })
                                        }
                                        className="w-full bg-transparent border-none outline-none text-xs text-center"
                                        placeholder="Qté"
                                      />
                                    </Box>
                                    <div className="flex items-center justify-end gap-1">
                                      <Button
                                        variant="small"
                                        onClick={() => {
                                          setEditingInventoryId(null)
                                          setNewInventoryId(null)
                                          setInventoryEditSnapshot(null)
                                        }}
                                      >
                                        OK
                                      </Button>
                                      <Button variant="small" onClick={cancelInventoryEdit}>
                                        Annuler
                                      </Button>
                                    </div>
                                  </div>
                                  <Box className="mt-1">
                                    <AutoResizeTextarea
                                      value={item.notes}
                                      onChange={(e) =>
                                        updateInventoryItem(idx, { notes: e.target.value })
                                      }
                                      className="w-full bg-transparent border-none outline-none text-xs"
                                      placeholder="Notes"
                                    />
                                  </Box>
                                </>
                              ) : (
                                <>
                                  <div className="grid grid-cols-[1.4fr_0.4fr_auto] gap-1 items-center">
                                    <Box>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setExpandedInventoryNotesId(
                                            expandedInventoryNotesId === item.id ? null : item.id
                                          )
                                        }
                                        className="w-full text-left bg-transparent border-none outline-none font-bold leading-tight"
                                      >
                                        {item.name || 'Objet'}
                                      </button>
                                    </Box>
                                    <div className="flex items-center gap-1 justify-center">
                                      <Button
                                        variant="small"
                                        onClick={() => {
                                          const current = parseInt(item.quantity || '0') || 0
                                          updateInventoryItem(idx, { quantity: String(Math.max(0, current - 1)) })
                                        }}
                                      >
                                        -
                                      </Button>
                                      <input
                                        type="text"
                                        value={item.quantity}
                                        onChange={(e) =>
                                          updateInventoryItem(idx, { quantity: e.target.value })
                                        }
                                        className="w-10 bg-transparent border-none outline-none text-xs text-center"
                                        placeholder="0"
                                      />
                                      <Button
                                        variant="small"
                                        onClick={() => {
                                          const current = parseInt(item.quantity || '0') || 0
                                          updateInventoryItem(idx, { quantity: String(current + 1) })
                                        }}
                                      >
                                        +
                                      </Button>
                                    </div>
                                    <div className="flex items-center justify-end">
                                      <div className="relative" data-inventory-menu>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setOpenInventoryMenuId(
                                              openInventoryMenuId === item.id ? null : item.id
                                            )
                                          }
                                          className="text-xs px-1"
                                        >
                                          ⋯
                                        </button>
                                        {openInventoryMenuId === item.id && (
                                          <div className="absolute right-0 mt-1 z-10 bg-white border border-[#c9b89c] rounded shadow-sm text-xs">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                if (editingInventoryId !== null) return
                                                setInventoryEditSnapshot({ id: item.id, item })
                                                setEditingInventoryId(item.id)
                                                setOpenInventoryMenuId(null)
                                              }}
                                              className="block w-full text-left px-2 py-1 hover:bg-[#f6efe4]"
                                            >
                                              Edit
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                removeInventoryItem(idx)
                                                setOpenInventoryMenuId(null)
                                              }}
                                              className="block w-full text-left px-2 py-1 hover:bg-[#f6efe4]"
                                            >
                                              Supprimer
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  {expandedInventoryNotesId === item.id && (
                                    <div className="mt-1 border-l-2 border-[#bda68a] bg-white/30 px-2 py-1">
                                      <AutoResizeTextarea
                                        value={item.notes}
                                        onChange={(e) =>
                                          updateInventoryItem(idx, { notes: e.target.value })
                                        }
                                        className="w-full bg-transparent border-none outline-none text-xs"
                                        placeholder="Notes"
                                      />
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          )
                        })}
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <Button
                          variant="small"
                          onClick={() => {
                            const nextId = addInventoryItem(section.key)
                            setEditingInventoryId(nextId)
                            setNewInventoryId(nextId)
                          }}
                          disabled={
                            editingInventoryId !== null &&
                            editingInventoryCategory !== section.key
                          }
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <SectionHeader className="mt-2.5">Description & Notes</SectionHeader>
              <div className="mt-1 space-y-2">
                <AutoResizeTextarea
                  label="Description du personnage"
                  value={character.biography}
                  onChange={(e) => updateField('biography', e.target.value)}
                />
                <AutoResizeTextarea
                  label="Notes"
                  value={character.backstory}
                  onChange={(e) => updateField('backstory', e.target.value)}
                />
              </div>
            </PaperContainer>
          )}
        </div>
      </div>
    </div>
  )
}
