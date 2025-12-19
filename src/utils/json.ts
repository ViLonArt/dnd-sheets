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
    
    // Migrate old classLevel to new class/level fields
    if (data && typeof data === 'object' && 'classLevel' in data && !('class' in data)) {
      const classLevel = data.classLevel as string
      // Try to parse "Class Name 5" or "Class 5" format
      const match = classLevel.match(/^(.+?)\s*(\d+)$/)
      if (match) {
        data.class = match[1].trim()
        data.level = parseInt(match[2], 10) || 1
      } else {
        data.class = classLevel
        data.level = 1
      }
      delete data.classLevel
    }
    
    // Migrate old spellAbility to new spellcastingAttribute
    if (data && typeof data === 'object' && 'spellAbility' in data && !('spellcastingAttribute' in data)) {
      const spellAbility = (data.spellAbility as string).toUpperCase().trim()
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
    
    // Validate with Zod - this ensures the data matches the Character interface
    const validated = CharacterSchema.parse(data) as Character
    return validated
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
    const data = JSON.parse(text) as unknown
    
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
    
    // Validate with Zod
    const validated = NpcSchema.parse(data)
    return validated
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

