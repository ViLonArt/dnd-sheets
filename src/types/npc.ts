import { z } from 'zod'
import type { Abilities } from './abilities'
import { AbilitiesSchema } from './abilities'

/**
 * Portrait state for image positioning/zooming
 */
export interface PortraitState {
  zoom: number
  offsetX: number
  offsetY: number
}

/**
 * NPC/Monster sheet data model
 */
export interface Npc {
  name: string
  type: string // e.g., "Humanoïde (Humain), Neutre Mauvais"
  description: string
  ca: string // Classe d'Armure (Armor Class)
  pv: string // Points de Vie (Hit Points)
  speed: string
  abilities: Abilities
  skills: string[] // Array of skill/resistance strings
  special: string[] // Array of special ability strings
  actions: string[] // Array of action strings
  portrait: string | null // Data URL or null
  portraitState: PortraitState
}

/**
 * Zod schema for PortraitState
 */
export const PortraitStateSchema = z.object({
  zoom: z.number().min(0.5).max(3),
  offsetX: z.number(),
  offsetY: z.number(),
})

/**
 * Zod schema for Npc (full validation)
 */
export const NpcSchema = z.object({
  name: z.string(),
  type: z.string(),
  description: z.string(),
  ca: z.string(),
  pv: z.string(),
  speed: z.string(),
  abilities: AbilitiesSchema,
  skills: z.array(z.string()),
  special: z.array(z.string()),
  actions: z.array(z.string()),
  portrait: z.string().nullable(),
  portraitState: PortraitStateSchema,
})

/**
 * Type guard to check if data is a valid Npc
 */
export function isValidNpc(data: unknown): data is Npc {
  return NpcSchema.safeParse(data).success
}

/**
 * Default empty Npc
 */
export function createEmptyNpc(): Npc {
  return {
    name: '',
    type: '',
    description: '',
    ca: '',
    pv: '',
    speed: '',
    abilities: {
      str: 10,
      dex: 10,
      con: 10,
      int: 10,
      wis: 10,
      cha: 10,
    },
    skills: [],
    special: [],
    actions: [],
    portrait: null,
    portraitState: {
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
    },
  }
}

