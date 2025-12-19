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
    return JSON.parse(data) as Character
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

