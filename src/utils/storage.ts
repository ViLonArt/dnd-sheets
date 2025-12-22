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

