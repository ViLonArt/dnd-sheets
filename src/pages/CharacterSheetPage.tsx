import { useRef, useState, useMemo } from 'react'
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
import { calculateAbilityModifier } from '@/types/abilities'
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
  const [expandedFeatureDescriptionId, setExpandedFeatureDescriptionId] = useState<string | null>(
    null
  )

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
    data: {},
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

  // Attacks management
  const addAttack = () => {
    updateField('attacks', [
      ...character.attacks,
      {
        name: '',
        damage: '',
        ability: 'str',
        magicMod: '0',
        proficiencyLevel: 0,
        notes: '',
        special: '',
      },
    ])
  }

  const updateAttack = (index: number, updates: Partial<Attack>) => {
    const newAttacks = [...character.attacks]
    const current = newAttacks[index]
    if (!current) return
    newAttacks[index] = { 
      name: updates.name ?? current.name,
      damage: updates.damage ?? current.damage,
      ability: updates.ability ?? current.ability,
      magicMod: updates.magicMod ?? current.magicMod,
      proficiencyLevel: updates.proficiencyLevel ?? current.proficiencyLevel,
      notes: updates.notes ?? current.notes,
      special: updates.special ?? current.special,
    }
    updateField('attacks', newAttacks)
  }

  const removeAttack = (index: number) => {
    updateField('attacks', character.attacks.filter((_, i) => i !== index))
  }

  // Proficiencies management
  // Class features management
  const addClassFeature = () => {
    updateField('classFeatures', [...character.classFeatures, createEmptyClassFeature()])
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

  const removeClassFeature = (index: number) => {
    updateField('classFeatures', character.classFeatures.filter((_, i) => i !== index))
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
    updateField('inventory', [
      ...character.inventory,
      { name: '', quantity: '', notes: '', category },
    ])
  }

  const updateInventoryItem = (
    index: number,
    updates: Partial<{ name: string; quantity: string; notes: string; category: ItemCategory }>
  ) => {
    const newItems = [...character.inventory]
    const current = newItems[index]
    if (!current) return
    newItems[index] = {
      name: updates.name ?? current.name,
      quantity: updates.quantity ?? current.quantity,
      notes: updates.notes ?? current.notes,
      category: updates.category ?? current.category,
    }
    updateField('inventory', newItems)
  }

  const removeInventoryItem = (index: number) => {
    updateField('inventory', character.inventory.filter((_, i) => i !== index))
  }

  // Spells management
  const addSpell = (level: number) => {
    updateField('spells', [
      ...character.spells,
      {
        name: '',
        level: level.toString(),
        school: '',
        type: '',
        range: '',
        duration: '',
        components: '',
        dice: '',
        concentration: false,
        ritual: false,
        saveThrow: false,
        saveThrowAbility: 'STR',
        description: '',
      },
    ])
  }

  const updateSpell = (index: number, updates: Partial<Spell>) => {
    const newSpells = [...character.spells]
    const current = newSpells[index]
    if (!current) return
    newSpells[index] = {
      name: updates.name ?? current.name,
      level: updates.level ?? current.level,
      school: updates.school ?? current.school,
      type: updates.type ?? current.type,
      range: updates.range ?? current.range,
      duration: updates.duration ?? current.duration,
      components: updates.components ?? current.components,
      dice: updates.dice ?? current.dice,
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

  const inventorySections: Array<{ key: ItemCategory; label: string }> = [
    { key: 'weapons', label: 'Équipé / Armes / Armures' },
    { key: 'consumables', label: 'Consommables' },
    { key: 'currency', label: 'Or & Monnaie' },
    { key: 'other', label: 'Autre' },
  ]

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
              <div className="col-span-2 min-w-[180px]">
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

              <div className="col-span-10">
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
                  <div className="grid grid-cols-[1fr_0.6fr_0.4fr_0.6fr_0.7fr_0.8fr_2fr_2fr_auto] gap-1 text-[11px] mt-1">
                <FieldLabel>Nom</FieldLabel>
                    <FieldLabel>Carac.</FieldLabel>
                    <FieldLabel>Mod</FieldLabel>
                    <FieldLabel>Maîtrise</FieldLabel>
                    <FieldLabel>Bonus Attaque</FieldLabel>
                    <FieldLabel>Damage</FieldLabel>
                <FieldLabel>Notes</FieldLabel>
                    <FieldLabel>Spécial</FieldLabel>
                <FieldLabel className="text-center">Suppr.</FieldLabel>
              </div>
              <div className="mt-1">
                {character.attacks.map((attack, idx) => (
                  <div
                    key={idx}
                        className="grid grid-cols-[1fr_0.6fr_0.4fr_0.6fr_0.7fr_0.8fr_2fr_2fr_auto] gap-1 items-center mb-1"
                  >
                    <Box>
                        <AutoResizeTextarea
                        value={attack.name}
                        onChange={(e) => updateAttack(idx, { name: e.target.value })}
                          className="w-full bg-transparent border-none outline-none font-bold leading-tight"
                        placeholder="Nom"
                      />
                    </Box>
                      <Select
                        value={attack.ability}
                        onChange={(e) => updateAttack(idx, { ability: e.target.value as Attack['ability'] })}
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
                    <Box>
                      <input
                          type="number"
                          value={attack.magicMod}
                          onChange={(e) => updateAttack(idx, { magicMod: e.target.value })}
                          className="w-full bg-transparent border-none outline-none text-xs text-center"
                          placeholder="0"
                      />
                    </Box>
                      <Box className="text-center">
                        <button
                          type="button"
                          onClick={() => {
                            const nextLevel = attack.proficiencyLevel === 2
                              ? 0
                              : ((attack.proficiencyLevel + 1) as 0 | 1 | 2)
                            updateAttack(idx, { proficiencyLevel: nextLevel })
                          }}
                          className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] ${getProficiencyBadgeClasses(attack.proficiencyLevel)}`}
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
                      <Box className="text-xs font-semibold text-center">
                        {formatSigned(getAttackAutoBonus(attack))}
                    </Box>
                    <Box>
                      <input
                        type="text"
                        value={attack.damage}
                        onChange={(e) => updateAttack(idx, { damage: e.target.value })}
                        className="w-full bg-transparent border-none outline-none text-xs"
                          placeholder="1d8+X"
                      />
                    </Box>
                    <Box>
                      <AutoResizeTextarea
                        value={attack.notes}
                        onChange={(e) => updateAttack(idx, { notes: e.target.value })}
                        className="w-full bg-transparent border-none outline-none text-xs"
                          placeholder="Magie / Notes"
                      />
                    </Box>
                      <Box>
                        <AutoResizeTextarea
                          value={attack.special}
                          onChange={(e) => updateAttack(idx, { special: e.target.value })}
                          className={
                            attack.proficiencyLevel === 2
                              ? 'w-full bg-transparent border-none outline-none text-xs'
                              : 'w-full bg-gray-100 border border-gray-200 outline-none text-xs text-gray-500'
                          }
                          placeholder="Spécial"
                          disabled={attack.proficiencyLevel !== 2}
                        />
                      </Box>
                      <button
                        type="button"
                        onClick={() => removeAttack(idx)}
                        className="text-gray-400 hover:text-red-500 text-xs px-1"
                      >
                        ×
                      </button>
                  </div>
                ))}
                <Button variant="small" onClick={addAttack} className="mt-1">
                      + Ajouter une attaque
                </Button>
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
                        className="mb-2 border border-[#c9b89c] bg-white/40 p-1.5"
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
                              <Button variant="small" onClick={() => setEditingFeatureId(null)}>
                                OK
                              </Button>
                              <Button variant="small" onClick={() => removeClassFeature(index)}>
                                ×
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
                                  <input
                                    type="text"
                                    value={feature.data.value ?? ''}
                                    onChange={(e) =>
                                      updateClassFeatureAt(index, (current) => ({
                                        ...current,
                                        data: { ...current.data, value: e.target.value },
                                      }))
                                    }
                                    className="w-full bg-transparent border border-[#bda68a] rounded px-1 py-0.5 text-xs"
                                    placeholder="ex: 1d8+3"
                                  />
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
                              <label className="flex items-center gap-1">
                                <input
                                  type="checkbox"
                                  checked={feature.hasResource}
                                  onChange={(e) =>
                                    updateClassFeatureAt(index, (current) => ({
                                      ...current,
                                      hasResource: e.target.checked,
                                      resource: e.target.checked
                                        ? current.resource ?? { current: 0, max: 0, reset: 'long' }
                                        : undefined,
                                    }))
                                  }
                                  className="w-3 h-3"
                                />
                                <span>Ressource</span>
                              </label>
                            </div>

                            {feature.hasResource && (
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
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <div className="font-bold text-sm truncate">{feature.name || '—'}</div>
                              {feature.hasResource && (
                                <div className="flex items-center gap-1 text-[10px]">
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
                                </div>
                              )}
                              <div className="ml-auto">
                                <Button
                                  variant="small"
                                  onClick={() => setEditingFeatureId(feature.id)}
                                >
                                  Edit
                                </Button>
                              </div>
                            </div>
                            <div className="mt-1 flex items-start gap-3 text-[10px] flex-wrap">
                              {feature.activeFields.type && feature.data.actionType && (
                                <div className="flex flex-col">
                                  <span className="text-[9px] uppercase text-[#7a4b36]">Type</span>
                                  <span>{feature.data.actionType}</span>
                                </div>
                              )}
                              {feature.activeFields.range && feature.data.range && (
                                <div className="flex flex-col">
                                  <span className="text-[9px] uppercase text-[#7a4b36]">Portée</span>
                                  <span>{feature.data.range}</span>
                                </div>
                              )}
                              {feature.activeFields.value && feature.data.value && (
                                <div className="flex flex-col">
                                  <span className="text-[9px] uppercase text-[#7a4b36]">Valeur</span>
                                  <span>{feature.data.value}</span>
                                </div>
                              )}
                              {feature.activeFields.duration && feature.data.duration && (
                                <div className="flex flex-col">
                                  <span className="text-[9px] uppercase text-[#7a4b36]">Durée</span>
                                  <span>{feature.data.duration}</span>
                                </div>
                              )}
                              {(feature.activeFields.concentration || feature.activeFields.ritual) &&
                                (feature.data.isConcentration || feature.data.isRitual) && (
                                  <div className="flex flex-col">
                                    <span className="text-[9px] uppercase text-[#7a4b36]">&nbsp;</span>
                                    <span>
                                      {[
                                        feature.activeFields.concentration &&
                                          feature.data.isConcentration
                                          ? 'C'
                                          : null,
                                        feature.activeFields.ritual && feature.data.isRitual
                                          ? 'R'
                                          : null,
                                      ]
                                        .filter(Boolean)
                                        .join(', ')}
                                    </span>
                                  </div>
                                )}
                              {feature.description && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedFeatureDescriptionId(
                                      expandedFeatureDescriptionId === feature.id ? null : feature.id
                                    )
                                  }
                                  className="px-1 py-0.5 border border-[#bda68a] rounded self-end"
                                >
                                  Description
                                </button>
                              )}
                            </div>
                            {feature.description &&
                              expandedFeatureDescriptionId === feature.id && (
                                <div className="mt-1 text-[10px] whitespace-pre-wrap">
                                  {feature.description}
                                </div>
                              )}
                          </>
                        )}
                      </div>
                    ))}

                    <Button variant="small" onClick={addClassFeature} className="mt-1">
                      + Ajouter une aptitude
                    </Button>
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
              <div className="mt-1 space-y-2">
                {inventorySections.map((section) => (
                  <div key={section.key} className="border border-[#c9b89c] bg-white/40 p-2">
                    <div className="flex items-center justify-between">
                      <FieldLabel>{section.label}</FieldLabel>
                      <Button variant="small" onClick={() => addInventoryItem(section.key)}>
                        + Add
                      </Button>
                    </div>
                    <div className="mt-1">
                      {character.inventory.map((item, idx) => {
                        if (item.category !== section.key) return null
                        return (
                          <div
                            key={`${section.key}-${idx}`}
                            className="grid grid-cols-[1.2fr_0.4fr_0.8fr_1.2fr_auto] gap-1 items-center mb-1"
                          >
                            <Box>
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => updateInventoryItem(idx, { name: e.target.value })}
                                className="w-full bg-transparent border-none outline-none font-bold text-lg leading-tight"
                                placeholder="Objet"
                              />
                            </Box>
                            <Box>
                              <input
                                type="text"
                                value={item.quantity}
                                onChange={(e) => updateInventoryItem(idx, { quantity: e.target.value })}
                                className="w-full bg-transparent border-none outline-none text-xs text-center"
                                placeholder="Qté"
                              />
                            </Box>
                            <Select
                              value={item.category}
                              onChange={(e) =>
                                updateInventoryItem(idx, { category: e.target.value as ItemCategory })
                              }
                              options={inventorySections.map((option) => ({
                                value: option.key,
                                label: option.label,
                              }))}
                              className="text-[11px] min-h-[22px]"
                            />
                            <Box>
                              <AutoResizeTextarea
                                value={item.notes}
                                onChange={(e) => updateInventoryItem(idx, { notes: e.target.value })}
                                className="w-full bg-transparent border-none outline-none text-xs"
                                placeholder="Notes"
                              />
                            </Box>
                            <Button variant="small" onClick={() => removeInventoryItem(idx)}>
                              ×
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
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
