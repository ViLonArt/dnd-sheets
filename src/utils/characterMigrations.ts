import { parseAbilityScore } from '@/types/abilities'
import { CLASSES_2024 } from '@/data/classTables2024'

const getBaseSlotsFrom2024 = (className: string, level: number) => {
  const classData = CLASSES_2024[className]
  const levelIndex = Math.max(1, Math.min(20, level)) - 1
  const slots = classData?.levels[levelIndex]?.slots ?? []
  const totals: Record<number, number> = {}
  for (let slotLevel = 1; slotLevel <= 9; slotLevel += 1) {
    totals[slotLevel] = slots[slotLevel] ?? 0
  }
  return totals
}

export function normalizeCharacterData(data: Record<string, unknown>): Record<string, unknown> {
  // Migrate old string format abilities to new number format
  if (data && typeof data === 'object' && 'abilities' in data) {
    const abilities = data.abilities as Record<string, unknown>
    const migratedAbilities: Record<string, number> = {}
    for (const [key, value] of Object.entries(abilities)) {
      if (typeof value === 'string') {
        // Old format: "16 (+3)" -> 16
        migratedAbilities[key] = parseAbilityScore(value)
      } else if (typeof value === 'number') {
        // New format: already a number
        migratedAbilities[key] = value
      } else {
        migratedAbilities[key] = 10
      }
    }
    data.abilities = migratedAbilities
  }

  // Migrate old classLevel to new class/level fields
  if ('classLevel' in data && !('class' in data)) {
    const classLevel = (data.classLevel as string) ?? ''
    // Try to parse "Class Name 5" or "Class 5" format
    const match = classLevel.match(/^(.+?)\s*(\d+)$/)
    if (match && match[1] && match[2]) {
      data.class = match[1].trim()
      data.level = parseInt(match[2], 10) || 1
    } else {
      data.class = classLevel
      data.level = 1
    }
    delete data.classLevel
  }

  // Migrate old spellAbility to new spellcastingAttribute
  if ('spellAbility' in data && !('spellcastingAttribute' in data)) {
    const spellAbility = ((data.spellAbility as string) ?? '').toUpperCase().trim()
    if (spellAbility.includes('INT') || spellAbility.includes('INTELLIGENCE')) {
      data.spellcastingAttribute = 'INT'
    } else if (spellAbility.includes('WIS') || spellAbility.includes('WISDOM') || spellAbility.includes('SAG')) {
      data.spellcastingAttribute = 'WIS'
    } else if (spellAbility.includes('CHA') || spellAbility.includes('CHARISMA')) {
      data.spellcastingAttribute = 'CHA'
    } else {
      data.spellcastingAttribute = 'None'
    }
    delete data.spellAbility
  }

  // Ensure level exists and is valid
  if (!('level' in data) || typeof data.level !== 'number') {
    data.level = 1
  }
  if (typeof data.level === 'number') {
    data.level = Math.max(1, Math.min(20, data.level))
  }

  // Ensure spellcastingAttribute exists
  if (!('spellcastingAttribute' in data)) {
    data.spellcastingAttribute = 'None'
  }

  // Ensure subclass exists
  if (!('subclass' in data)) {
    data.subclass = ''
  }
  if (!('subclassNotes' in data)) {
    data.subclassNotes = ''
  }

  // Ensure new fields exist for backward compatibility
  if (!('biography' in data)) {
    data.biography = ''
  }
  if (!('otherProficiencies' in data)) {
    data.otherProficiencies = ''
  }
  if (!('featuresTraits' in data)) {
    data.featuresTraits = ''
  }
  if (!('portrait' in data)) {
    data.portrait = null
  }
  if (!('portraitState' in data) || !data.portraitState || typeof data.portraitState !== 'object') {
    data.portraitState = { zoom: 1, offsetX: 0, offsetY: 0 }
  } else {
    const state = data.portraitState as Record<string, unknown>
    data.portraitState = {
      zoom: typeof state.zoom === 'number' ? state.zoom : 1,
      offsetX: typeof state.offsetX === 'number' ? state.offsetX : 0,
      offsetY: typeof state.offsetY === 'number' ? state.offsetY : 0,
    }
  }
  if (!('proficiencies' in data)) {
    data.proficiencies = []
  }
  if (!('proficienciesText' in data)) {
    data.proficienciesText = ''
  }
  if ('proficiencies' in data && Array.isArray(data.proficiencies)) {
    const validCategories = new Set(['armor', 'weapon', 'tool', 'other'])
    data.proficiencies = data.proficiencies.map((item) => {
      if (!item || typeof item !== 'object') {
        return { name: '', description: '', category: 'other' }
      }
      const entry = item as Record<string, unknown>
      const category =
        typeof entry.category === 'string' && validCategories.has(entry.category)
          ? entry.category
          : 'other'
      return {
        name: typeof entry.name === 'string' ? entry.name : '',
        description: typeof entry.description === 'string'
          ? entry.description
          : typeof entry.type === 'string'
          ? entry.type
          : '',
        category,
      }
    })
  }
  if (!('classFeatures' in data)) {
    data.classFeatures = []
  }
  if ('classFeatures' in data && Array.isArray(data.classFeatures)) {
    data.classFeatures = data.classFeatures.map((feature, index) => {
      if (!feature || typeof feature !== 'object') {
        return {
          id: `feature-${index}`,
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
        }
      }
      const entry = feature as Record<string, unknown>
      const activeFieldsSource =
        entry.activeFields && typeof entry.activeFields === 'object'
          ? (entry.activeFields as Record<string, unknown>)
          : {}
      const dataSource =
        entry.data && typeof entry.data === 'object' ? (entry.data as Record<string, unknown>) : {}
      const valueAbilitySource =
        typeof dataSource.valueAbility === 'string' ? dataSource.valueAbility : undefined
      const valueAbility =
        valueAbilitySource && ['str', 'dex', 'con', 'int', 'wis', 'cha'].includes(valueAbilitySource)
          ? (valueAbilitySource as 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha')
          : undefined
      const actionTypeSource =
        typeof dataSource.actionType === 'string' ? dataSource.actionType : undefined
      const normalizedActionType =
        actionTypeSource === 'bonus' ? 'action bonus' : actionTypeSource
      const actionType =
        normalizedActionType &&
        ['action', 'action bonus', 'reaction', 'passive', 'free'].includes(normalizedActionType)
          ? (normalizedActionType as 'action' | 'action bonus' | 'reaction' | 'passive' | 'free')
          : undefined
      const legacyNotes = typeof entry.level === 'string' ? entry.level : ''
      const legacyUsesCurrent = typeof entry.usesCurrent === 'number' ? entry.usesCurrent : undefined
      const legacyUsesMax = typeof entry.usesMax === 'number' ? entry.usesMax : undefined
      const hasLegacyResource = legacyUsesCurrent !== undefined || legacyUsesMax !== undefined
      const resourceSource =
        entry.resource && typeof entry.resource === 'object'
          ? (entry.resource as Record<string, unknown>)
          : {}
      const hasResource =
        typeof entry.hasResource === 'boolean' ? entry.hasResource : hasLegacyResource
      return {
        id: typeof entry.id === 'string' ? entry.id : `feature-${index}`,
        name: typeof entry.name === 'string' ? entry.name : '',
        description: typeof entry.description === 'string' ? entry.description : '',
        activeFields: {
          type: typeof activeFieldsSource.type === 'boolean' ? activeFieldsSource.type : false,
          range: typeof activeFieldsSource.range === 'boolean' ? activeFieldsSource.range : false,
          value: typeof activeFieldsSource.value === 'boolean' ? activeFieldsSource.value : false,
          duration:
            typeof activeFieldsSource.duration === 'boolean' ? activeFieldsSource.duration : false,
          notes: typeof activeFieldsSource.notes === 'boolean' ? activeFieldsSource.notes : false,
          concentration:
            typeof activeFieldsSource.concentration === 'boolean'
              ? activeFieldsSource.concentration
              : false,
          ritual: typeof activeFieldsSource.ritual === 'boolean' ? activeFieldsSource.ritual : false,
        },
        data: {
          actionType,
          range: typeof dataSource.range === 'string' ? dataSource.range : undefined,
          value: typeof dataSource.value === 'string' ? dataSource.value : undefined,
          valueDiceCount:
            typeof dataSource.valueDiceCount === 'number'
              ? Math.max(1, Math.floor(dataSource.valueDiceCount))
              : undefined,
          valueDie: typeof dataSource.valueDie === 'string' ? dataSource.valueDie : undefined,
          valueMod: typeof dataSource.valueMod === 'string' ? dataSource.valueMod : undefined,
          valueUseAbility:
            typeof dataSource.valueUseAbility === 'boolean'
              ? dataSource.valueUseAbility
              : undefined,
          valueAbility,
          duration: typeof dataSource.duration === 'string' ? dataSource.duration : undefined,
          notes:
            typeof dataSource.notes === 'string'
              ? dataSource.notes
              : legacyNotes || undefined,
          isConcentration:
            typeof dataSource.isConcentration === 'boolean'
              ? dataSource.isConcentration
              : undefined,
          isRitual: typeof dataSource.isRitual === 'boolean' ? dataSource.isRitual : undefined,
        },
        hasResource,
        resourceMode:
          typeof entry.resourceMode === 'string'
            ? (entry.resourceMode as 'none' | 'independent' | 'class')
            : hasResource
            ? 'independent'
            : 'none',
        resourceLinkId:
          typeof entry.resourceLinkId === 'string' ? entry.resourceLinkId : undefined,
        resource: hasResource
          ? {
              current:
                typeof resourceSource.current === 'number'
                  ? Math.max(0, resourceSource.current)
                  : Math.max(0, legacyUsesCurrent ?? 0),
              max:
                typeof resourceSource.max === 'number'
                  ? Math.max(0, resourceSource.max)
                  : Math.max(0, legacyUsesMax ?? 0),
              reset:
                typeof resourceSource.reset === 'string' && resourceSource.reset === 'short'
                  ? 'short'
                  : 'long',
            }
          : undefined,
      }
    })
  }
  if (!('speciesTraits' in data)) {
    data.speciesTraits = []
  }
  if (!('feats' in data)) {
    data.feats = []
  }
  if (!('savingThrowAdvantages' in data)) {
    data.savingThrowAdvantages = ''
  }
  if (!('savingThrowDisadvantages' in data)) {
    data.savingThrowDisadvantages = ''
  }
  if (!('conditions' in data)) {
    data.conditions = ''
  }
  if (!('initMisc' in data)) {
    data.initMisc = 0
  }
  if (!('hitDiceType' in data)) {
    data.hitDiceType = 8
  }
  if (!('hpMaxOverride' in data)) {
    data.hpMaxOverride = ''
  }
  if (!('tempHp' in data)) {
    data.tempHp = ''
  }
  if (!('inventory' in data)) {
    data.inventory = []
  }
  if ('inventory' in data && Array.isArray(data.inventory)) {
    const validCategories = new Set(['weapons', 'consumables', 'currency', 'other'])
    data.inventory = data.inventory.map((item, index) => {
      if (!item || typeof item !== 'object') {
        return { id: `inv-${index}`, name: '', quantity: '', notes: '', category: 'other' }
      }
      const itemData = item as Record<string, unknown>
      const category = typeof itemData.category === 'string' && validCategories.has(itemData.category)
        ? itemData.category
        : 'other'
      return {
        id: typeof itemData.id === 'string' ? itemData.id : `inv-${index}`,
        name: typeof itemData.name === 'string' ? itemData.name : '',
        quantity: typeof itemData.quantity === 'string' ? itemData.quantity : '',
        notes: typeof itemData.notes === 'string' ? itemData.notes : '',
        category,
      }
    })
  }

  if ('equipment' in data && Array.isArray(data.inventory) && data.inventory.length === 0) {
    const equipment = typeof data.equipment === 'string' ? data.equipment : ''
    if (equipment.trim()) {
      data.inventory = [
        { name: '', quantity: '', notes: equipment, category: 'other' },
      ]
    }
    delete data.equipment
  }

  if ('skills' in data && data.skills && typeof data.skills === 'object') {
    const skills = data.skills as Record<string, unknown>
    for (const [key, value] of Object.entries(skills)) {
      if (typeof value === 'boolean') {
        skills[key] = value ? 1 : 0
      } else if (typeof value === 'number') {
        skills[key] = Math.max(0, Math.min(2, Math.round(value)))
      } else {
        skills[key] = 0
      }
    }
    data.skills = skills
  }

  if ('attacks' in data && Array.isArray(data.attacks)) {
    const validAbilities = new Set(['str', 'dex', 'con', 'int', 'wis', 'cha'])
    data.attacks = data.attacks.map((attack, index) => {
      if (!attack || typeof attack !== 'object') return attack
      const attackData = attack as Record<string, unknown>
      const ability =
        typeof attackData.ability === 'string' && validAbilities.has(attackData.ability)
          ? (attackData.ability as 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha')
          : 'str'
      const proficiencyLevel =
        typeof attackData.proficiencyLevel === 'number'
          ? Math.max(0, Math.min(2, Math.round(attackData.proficiencyLevel)))
          : typeof attackData.proficient === 'boolean'
          ? attackData.proficient
            ? 1
            : 0
          : 0
      const magicMod =
        typeof attackData.magicMod === 'string'
          ? attackData.magicMod
          : typeof attackData.bonusMod === 'string'
          ? attackData.bonusMod
          : typeof attackData.bonus === 'string'
          ? attackData.bonus
          : '0'
      return {
        id: typeof attackData.id === 'string' ? attackData.id : `atk-${index}`,
        name: typeof attackData.name === 'string' ? attackData.name : '',
        damageDiceCount:
          typeof attackData.damageDiceCount === 'number'
            ? Math.max(1, Math.floor(attackData.damageDiceCount))
            : 1,
        damageDie: typeof attackData.damageDie === 'string'
          ? attackData.damageDie
          : typeof attackData.damage === 'string'
          ? attackData.damage
          : '',
        damageType: typeof attackData.damageType === 'string' ? attackData.damageType : '',
        notes: typeof attackData.notes === 'string' ? attackData.notes : '',
        property: typeof attackData.property === 'string' ? attackData.property : '',
        special: typeof attackData.special === 'string' ? attackData.special : '',
        ability,
        magicMod,
        proficiencyLevel,
      }
    })
  }

  if ('spells' in data && Array.isArray(data.spells)) {
    data.spells = data.spells.map((spell, index) => {
      if (!spell || typeof spell !== 'object') return spell
      const spellData = spell as Record<string, unknown>
      const legacyNotes = typeof spellData.notes === 'string' ? spellData.notes : ''
      const legacyVerbal = Boolean(spellData.verbal)
      const components =
        typeof spellData.components === 'string'
          ? spellData.components
          : legacyVerbal
          ? 'V'
          : ''
      const diceModeSource =
        typeof spellData.diceMode === 'string' ? spellData.diceMode : undefined
      const diceMode =
        diceModeSource === 'dice' || diceModeSource === 'custom' ? diceModeSource : undefined
      const diceCustomSource =
        typeof spellData.diceCustom === 'string'
          ? spellData.diceCustom
          : typeof spellData.dice === 'string'
          ? spellData.dice
          : ''
      return {
        id: typeof spellData.id === 'string' ? spellData.id : `spell-${index}`,
        sourceId: typeof spellData.sourceId === 'string' ? spellData.sourceId : undefined,
        name: typeof spellData.name === 'string' ? spellData.name : '',
        level:
          typeof spellData.level === 'number' || typeof spellData.level === 'string'
            ? spellData.level
            : 0,
        school: typeof spellData.school === 'string' ? spellData.school : '',
        type: typeof spellData.type === 'string' ? spellData.type : '',
        range: typeof spellData.range === 'string' ? spellData.range : '',
        duration: typeof spellData.duration === 'string' ? spellData.duration : '',
        components,
        dice: typeof spellData.dice === 'string' ? spellData.dice : '',
        diceMode: diceMode ?? (diceCustomSource ? 'custom' : 'dice'),
        diceCount:
          typeof spellData.diceCount === 'number'
            ? Math.max(1, Math.floor(spellData.diceCount))
            : 1,
        diceDie: typeof spellData.diceDie === 'string' ? spellData.diceDie : '',
        diceMod: typeof spellData.diceMod === 'string' ? spellData.diceMod : '',
        diceCustom: diceCustomSource,
        damageType: typeof spellData.damageType === 'string' ? spellData.damageType : '',
        concentration: Boolean(spellData.concentration),
        ritual: Boolean(spellData.ritual),
        saveThrow: Boolean(spellData.saveThrow),
        prepared: Boolean(spellData.prepared),
        saveThrowAbility:
          typeof spellData.saveThrowAbility === 'string'
            ? (spellData.saveThrowAbility as 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA')
            : 'STR',
        description:
          typeof spellData.description === 'string'
            ? spellData.description
            : legacyNotes,
      }
    })
  }

  // Ensure slotOverrides exists (migrate from old totals if possible)
  if (!('slotOverrides' in data) || !data.slotOverrides || typeof data.slotOverrides !== 'object') {
    const overrides: Record<number, number> = {}
    const className =
      typeof data.class === 'string'
        ? data.class
        : typeof (data as Record<string, unknown>).className === 'string'
        ? ((data as Record<string, unknown>).className as string)
        : ''
    const baseSlots = getBaseSlotsFrom2024(className, data.level as number)
    const spellSlots = data.spellSlots as Record<number, { total?: unknown }> | undefined
    for (let level = 1; level <= 9; level += 1) {
      const total = spellSlots?.[level]?.total
      if (typeof total === 'number' && Number.isFinite(total)) {
        overrides[level] = total - (baseSlots[level] ?? 0)
      }
    }
    data.slotOverrides = overrides
  } else {
    const overrides = data.slotOverrides as Record<string, unknown>
    const cleaned: Record<number, number> = {}
    for (const [key, value] of Object.entries(overrides)) {
      const level = Number(key)
      if (!Number.isFinite(level) || typeof value !== 'number' || !Number.isFinite(value)) continue
      cleaned[level] = value
    }
    data.slotOverrides = cleaned
  }

  return data
}
