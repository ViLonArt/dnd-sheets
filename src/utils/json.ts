import { CharacterSchema, type Character } from '@/types/character'
import { NpcSchema, type Npc } from '@/types/npc'
import { parseAbilityScore } from '@/types/abilities'

/**
 * Export character data to JSON file
 */
export function exportCharacterToJson(character: Character, filename = 'fiche-pj.json'): void {
  try {
    // Validate before export
    const validated = CharacterSchema.parse(character)
    // JSON.stringify automatically escapes newlines (\n) as \\n in the JSON string
    // This preserves multi-line text from textarea fields (e.g., attack notes, trait descriptions)
    const json = JSON.stringify(validated, null, 2)
    downloadJson(json, filename)
  } catch (error) {
    console.error('Export validation error:', error)
    throw new Error('Invalid character data: ' + (error instanceof Error ? error.message : 'Unknown error'))
  }
}

/**
 * Export NPC data to JSON file
 */
export function exportNpcToJson(npc: Npc, filename = 'fiche-pnj.json'): void {
  try {
    // Validate before export
    const validated = NpcSchema.parse(npc)
    // JSON.stringify automatically escapes newlines (\n) as \\n in the JSON string
    // This preserves multi-line text from textarea fields (e.g., actions, special abilities)
    const json = JSON.stringify(validated, null, 2)
    downloadJson(json, filename)
  } catch (error) {
    console.error('Export validation error:', error)
    throw new Error('Invalid NPC data: ' + (error instanceof Error ? error.message : 'Unknown error'))
  }
}

/**
 * Import character from JSON file
 */
export async function importCharacterFromJson(file: File): Promise<Character> {
  try {
    const text = await file.text()
    // JSON.parse automatically unescapes \\n back to \n in string values
    // This preserves multi-line text from textarea fields when importing
    const data = JSON.parse(text) as Record<string, unknown>
    
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
    
    // Guard clause: ensure data is an object
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid character data: expected an object')
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
      data.inventory = data.inventory.map((item) => {
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
      const validAbilities = new Set(['str', 'dex', 'con', 'int', 'wis', 'cha', 'none'])
      data.attacks = data.attacks.map((attack) => {
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

    if ('spells' in data && Array.isArray(data.spells)) {
      data.spells = data.spells.map((spell) => {
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
    
    // Validate with Zod - this ensures the data matches the Character interface
    const validated = CharacterSchema.parse(data)
    return (validated as unknown) as Character
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON file')
    }
    if (error instanceof Error && 'issues' in error) {
      // Zod validation error
      throw new Error('Invalid character data format: ' + error.message)
    }
    throw new Error('Failed to import character: ' + (error instanceof Error ? error.message : 'Unknown error'))
  }
}

/**
 * Import NPC from JSON file
 */
export async function importNpcFromJson(file: File): Promise<Npc> {
  try {
    const text = await file.text()
    // JSON.parse automatically unescapes \\n back to \n in string values
    // This preserves multi-line text from textarea fields when importing
    const data = JSON.parse(text) as unknown
    
    // Guard clause: ensure data is an object
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid NPC data: expected an object')
    }
    
    // Migrate old string format abilities to new number format
    if ('abilities' in data) {
      const abilities = (data.abilities as Record<string, unknown>) ?? {}
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
    
    // Validate with Zod
    const validated = NpcSchema.parse(data)
    return (validated as unknown) as Npc
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON file')
    }
    if (error instanceof Error && 'issues' in error) {
      // Zod validation error
      throw new Error('Invalid NPC data format: ' + error.message)
    }
    throw new Error('Failed to import NPC: ' + (error instanceof Error ? error.message : 'Unknown error'))
  }
}

/**
 * Helper to trigger JSON file download
 */
function downloadJson(json: string, filename: string): void {
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

