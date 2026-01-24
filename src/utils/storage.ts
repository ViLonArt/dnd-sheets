import type { Character } from '@/types/character'
import { normalizeCharacterData } from './characterMigrations'

const CHARACTER_STORAGE_KEY = 'dnd-character-data'

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
    const normalized = normalizeCharacterData(parsed)
    return normalized as unknown as Character
  } catch (error) {
    console.error('Failed to load character from localStorage:', error)
    return null
  }
}
