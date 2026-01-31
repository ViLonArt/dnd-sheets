import { CharacterSchema, type Character } from '@/types/character'
import { NpcSchema, type Npc } from '@/types/npc'
import { parseAbilityScore } from '@/types/abilities'
import { normalizeCharacterData } from './characterMigrations'

const normalizeNpcData = (data: Record<string, unknown>): Record<string, unknown> => {
  if (!('legendary_actions' in data)) {
    const legacyLegendary = data['legendaryActions']
    data.legendary_actions = legacyLegendary ?? []
    if ('legendaryActions' in data) {
      delete data['legendaryActions']
    }
  }

  const listFields = ['skills', 'special', 'actions', 'legendary_actions'] as const
  for (const field of listFields) {
    const value = data[field]
    if (Array.isArray(value)) {
      data[field] = value.filter((item) => typeof item === 'string')
    } else if (typeof value === 'string' && value.trim()) {
      data[field] = [value]
    } else {
      data[field] = []
    }
  }

  if ('abilities' in data && data.abilities && typeof data.abilities === 'object') {
    const abilities = (data.abilities as Record<string, unknown>) ?? {}
    const migratedAbilities: Record<string, number> = {}
    for (const [key, value] of Object.entries(abilities)) {
      if (typeof value === 'string') {
        migratedAbilities[key] = parseAbilityScore(value)
      } else if (typeof value === 'number') {
        migratedAbilities[key] = value
      } else {
        migratedAbilities[key] = 10
      }
    }
    data.abilities = migratedAbilities
  }

  return data
}

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
    const normalized = normalizeNpcData({ ...(npc as unknown as Record<string, unknown>) })
    const validated = NpcSchema.parse(normalized)
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
    
    // Guard clause: ensure data is an object
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid character data: expected an object')
    }

    const normalized = normalizeCharacterData(data)

    // Validate with Zod - this ensures the data matches the Character interface
    const validated = CharacterSchema.parse(normalized)
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
    
    const normalized = normalizeNpcData(data as Record<string, unknown>)

    // Validate with Zod
    const validated = NpcSchema.parse(normalized)
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

