import type { Character } from '@/types/character'
import type { Npc } from '@/types/npc'

const CHARACTER_STORAGE_KEY = 'dnd-character-data'
const NPC_STORAGE_KEY = 'dnd-npc-data'

/**
 * Save character to localStorage
 */
export function saveCharacterToStorage(character: Character): void {
  try {
    localStorage.setItem(CHARACTER_STORAGE_KEY, JSON.stringify(character))
  } catch (error) {
    console.error('Failed to save character to localStorage:', error)
    throw new Error('Failed to save character data')
  }
}

/**
 * Load character from localStorage
 */
export function loadCharacterFromStorage(): Character | null {
  try {
    const data = localStorage.getItem(CHARACTER_STORAGE_KEY)
    if (!data) return null
    const parsed = JSON.parse(data) as Record<string, unknown>
    
    // Migrate old classLevel to new class/level fields
    if ('classLevel' in parsed && !('class' in parsed)) {
      const classLevel = (parsed.classLevel as string) ?? ''
      const match = classLevel.match(/^(.+?)\s*(\d+)$/)
      if (match && match[1] && match[2]) {
        parsed.class = match[1].trim()
        parsed.level = parseInt(match[2], 10) || 1
      } else {
        parsed.class = classLevel
        parsed.level = 1
      }
      delete parsed.classLevel
    }
    
    // Migrate old spellAbility to new spellcastingAttribute
    if ('spellAbility' in parsed && !('spellcastingAttribute' in parsed)) {
      const spellAbility = ((parsed.spellAbility as string) ?? '').toUpperCase().trim()
      if (spellAbility.includes('INT') || spellAbility.includes('INTELLIGENCE')) {
        parsed.spellcastingAttribute = 'INT'
      } else if (spellAbility.includes('WIS') || spellAbility.includes('WISDOM') || spellAbility.includes('SAG')) {
        parsed.spellcastingAttribute = 'WIS'
      } else if (spellAbility.includes('CHA') || spellAbility.includes('CHARISMA')) {
        parsed.spellcastingAttribute = 'CHA'
      } else {
        parsed.spellcastingAttribute = 'None'
      }
      delete parsed.spellAbility
    }
    
    // Ensure level exists and is valid
    if (!('level' in parsed) || typeof parsed.level !== 'number') {
      parsed.level = 1
    }
    if (typeof parsed.level === 'number') {
      parsed.level = Math.max(1, Math.min(20, parsed.level))
    }
    
    // Ensure spellcastingAttribute exists
    if (!('spellcastingAttribute' in parsed)) {
      parsed.spellcastingAttribute = 'None'
    }
    
    // Ensure new fields exist for backward compatibility
    if (!('biography' in parsed)) {
      parsed.biography = ''
    }
    if (!('otherProficiencies' in parsed)) {
      parsed.otherProficiencies = ''
    }
    if (!('featuresTraits' in parsed)) {
      parsed.featuresTraits = ''
    }
    if (!('proficiencies' in parsed)) {
      parsed.proficiencies = []
    }
    if ('proficiencies' in parsed && Array.isArray(parsed.proficiencies)) {
      const validCategories = new Set(['armor', 'weapon', 'tool', 'other'])
      parsed.proficiencies = parsed.proficiencies.map((item) => {
        if (!item || typeof item !== 'object') {
          return { name: '', description: '', category: 'other' }
        }
        const data = item as Record<string, unknown>
        const category =
          typeof data.category === 'string' && validCategories.has(data.category)
            ? data.category
            : 'other'
        return {
          name: typeof data.name === 'string' ? data.name : '',
          description: typeof data.description === 'string'
            ? data.description
            : typeof data.type === 'string'
            ? data.type
            : '',
          category,
        }
      })
    }
    if (!('classFeatures' in parsed)) {
      parsed.classFeatures = []
    }
    if (!('speciesTraits' in parsed)) {
      parsed.speciesTraits = []
    }
    if (!('feats' in parsed)) {
      parsed.feats = []
    }
    if (!('savingThrowAdvantages' in parsed)) {
      parsed.savingThrowAdvantages = ''
    }
    if (!('savingThrowDisadvantages' in parsed)) {
      parsed.savingThrowDisadvantages = ''
    }
    if (!('conditions' in parsed)) {
      parsed.conditions = ''
    }
    if (!('initMisc' in parsed)) {
      parsed.initMisc = 0
    }
    if (!('hitDiceType' in parsed)) {
      parsed.hitDiceType = 8
    }
    if (!('hpMaxOverride' in parsed)) {
      parsed.hpMaxOverride = ''
    }
    if (!('tempHp' in parsed)) {
      parsed.tempHp = ''
    }
    if (!('inventory' in parsed)) {
      parsed.inventory = []
    }
    if ('inventory' in parsed && Array.isArray(parsed.inventory)) {
      const validCategories = new Set(['weapons', 'consumables', 'currency', 'other'])
      parsed.inventory = parsed.inventory.map((item) => {
        if (!item || typeof item !== 'object') {
          return { name: '', quantity: '', notes: '', category: 'other' }
        }
        const itemData = item as Record<string, unknown>
        const category = typeof itemData.category === 'string' && validCategories.has(itemData.category)
          ? itemData.category
          : 'other'
        return {
          name: typeof itemData.name === 'string' ? itemData.name : '',
          quantity: typeof itemData.quantity === 'string' ? itemData.quantity : '',
          notes: typeof itemData.notes === 'string' ? itemData.notes : '',
          category,
        }
      })
    }

    if ('equipment' in parsed && Array.isArray(parsed.inventory) && parsed.inventory.length === 0) {
      const equipment = typeof parsed.equipment === 'string' ? parsed.equipment : ''
      if (equipment.trim()) {
        parsed.inventory = [
          { name: '', quantity: '', notes: equipment, category: 'other' },
        ]
      }
      delete parsed.equipment
    }

    if ('skills' in parsed && parsed.skills && typeof parsed.skills === 'object') {
      const skills = parsed.skills as Record<string, unknown>
      for (const [key, value] of Object.entries(skills)) {
        if (typeof value === 'boolean') {
          skills[key] = value ? 1 : 0
        } else if (typeof value === 'number') {
          skills[key] = Math.max(0, Math.min(2, Math.round(value)))
        } else {
          skills[key] = 0
        }
      }
      parsed.skills = skills
    }

    if ('attacks' in parsed && Array.isArray(parsed.attacks)) {
      const validAbilities = new Set(['str', 'dex', 'con', 'int', 'wis', 'cha', 'none'])
      parsed.attacks = parsed.attacks.map((attack) => {
        if (!attack || typeof attack !== 'object') return attack
        const attackData = attack as Record<string, unknown>
        const bonus = typeof attackData.bonus === 'string' ? attackData.bonus : ''
        const ability = typeof attackData.ability === 'string' && validAbilities.has(attackData.ability)
          ? attackData.ability
          : 'none'
        return {
          name: typeof attackData.name === 'string' ? attackData.name : '',
          bonus,
          damage: typeof attackData.damage === 'string' ? attackData.damage : '',
          notes: typeof attackData.notes === 'string' ? attackData.notes : '',
          ability,
          proficient: Boolean(attackData.proficient),
          bonusMod: typeof attackData.bonusMod === 'string' ? attackData.bonusMod : '',
          useManualBonus:
            typeof attackData.useManualBonus === 'boolean' ? attackData.useManualBonus : Boolean(bonus),
        }
      })
    }

    if ('spells' in parsed && Array.isArray(parsed.spells)) {
      parsed.spells = parsed.spells.map((spell) => {
        if (!spell || typeof spell !== 'object') return spell
        const spellData = spell as Record<string, unknown>
        return {
          name: typeof spellData.name === 'string' ? spellData.name : '',
          level: typeof spellData.level === 'number' || typeof spellData.level === 'string' ? spellData.level : 0,
          notes: typeof spellData.notes === 'string' ? spellData.notes : '',
          prepared: Boolean(spellData.prepared),
          concentration: Boolean(spellData.concentration),
          ritual: Boolean(spellData.ritual),
          verbal: Boolean(spellData.verbal),
        }
      })
    }
    
    return (parsed as unknown) as Character
  } catch (error) {
    console.error('Failed to load character from localStorage:', error)
    return null
  }
}

/**
 * Clear character from localStorage
 */
export function clearCharacterStorage(): void {
  localStorage.removeItem(CHARACTER_STORAGE_KEY)
}

/**
 * Save NPC to localStorage
 */
export function saveNpcToStorage(npc: Npc): void {
  try {
    localStorage.setItem(NPC_STORAGE_KEY, JSON.stringify(npc))
  } catch (error) {
    console.error('Failed to save NPC to localStorage:', error)
    throw new Error('Failed to save NPC data')
  }
}

/**
 * Load NPC from localStorage
 */
export function loadNpcFromStorage(): Npc | null {
  try {
    const data = localStorage.getItem(NPC_STORAGE_KEY)
    if (!data) return null
    return JSON.parse(data) as Npc
  } catch (error) {
    console.error('Failed to load NPC from localStorage:', error)
    return null
  }
}

/**
 * Clear NPC from localStorage
 */
export function clearNpcStorage(): void {
  localStorage.removeItem(NPC_STORAGE_KEY)
}

