import type { AbilityKey } from './abilities'

export type SlotOverrides = Record<number, number>

export interface PcData {
  class: string
  subclass?: string
  level: number
  slotOverrides: SlotOverrides
}

export interface ClassFeature {
  id: string
  name: string
  description: string
  activeFields: {
    type: boolean
    range: boolean
    value: boolean
    duration: boolean
    notes: boolean
    concentration: boolean
    ritual: boolean
  }
  data: {
    actionType?: 'action' | 'action bonus' | 'reaction' | 'passive' | 'free'
    range?: string
    value?: string
    valueDiceCount?: number
    valueDie?: string
    valueMod?: string
    valueUseAbility?: boolean
    valueAbility?: AbilityKey
    duration?: string
    notes?: string
    isConcentration?: boolean
    isRitual?: boolean
  }
  hasResource: boolean
  resource?: {
    current: number
    max: number
    reset: 'short' | 'long'
  }
}
