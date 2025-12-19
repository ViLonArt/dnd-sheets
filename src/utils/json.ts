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
    const validated = CharacterSchema.parse(data)
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

