import type { ClassFeature } from '@/types/pc'

export type Stats = {
  charismaMod: number
  wisdomMod: number
  proficiencyBonus: number
}

const clampMin = (value: number, min: number) => Math.max(min, value)

const createCounter = (
  name: string,
  max: number,
  reset: 'short' | 'long'
): Partial<ClassFeature> => ({
  name,
  description: '',
  hasResource: true,
  resource: {
    current: 0,
    max,
    reset,
  },
})

export function getCoreResources(
  className: string,
  subclass: string,
  level: number,
  stats: Stats
): Partial<ClassFeature>[] {
  const features: Partial<ClassFeature>[] = []
  const safeLevel = Math.max(1, Math.min(20, Math.floor(level || 1)))

  switch (className) {
    case 'Barbare': {
      let max = 2
      if (safeLevel >= 17) max = 6
      else if (safeLevel >= 12) max = 5
      else if (safeLevel >= 6) max = 4
      else if (safeLevel >= 3) max = 3
      features.push(createCounter('Rage', max, 'long'))
      break
    }
    case 'Barde': {
      const max = clampMin(stats.charismaMod, 1)
      const reset = safeLevel >= 5 ? 'short' : 'long'
      const die =
        safeLevel >= 15 ? 'd12' : safeLevel >= 10 ? 'd10' : safeLevel >= 5 ? 'd8' : 'd6'
      features.push(createCounter(`Inspiration Bardique (${die})`, max, reset))
      break
    }
    case 'Clerc': {
      if (safeLevel >= 2) {
        const max = safeLevel >= 18 ? 4 : safeLevel >= 6 ? 3 : 2
        features.push(createCounter('Conduit Divin', max, 'short'))
      }
      break
    }
    case 'Druide': {
      if (safeLevel >= 2) {
        const max = safeLevel >= 17 ? 4 : safeLevel >= 6 ? 3 : 2
        features.push(createCounter('Forme Sauvage', max, 'long'))
      }
      break
    }
    case 'Guerrier': {
      if (subclass === 'Maître de Guerre' && safeLevel >= 3) {
        let max = 4
        if (safeLevel >= 15) max = 6
        else if (safeLevel >= 7) max = 5
        features.push(createCounter('Dés de Supériorité', max, 'short'))
      }
      break
    }
    case 'Moine': {
      if (safeLevel >= 2) {
        features.push(createCounter('Points de Focalisation', safeLevel, 'short'))
      }
      break
    }
    case 'Paladin': {
      if (safeLevel >= 3) {
        const max = safeLevel >= 11 ? 3 : 2
        features.push(createCounter('Conduit Divin', max, 'short'))
      }
      break
    }
    case 'Rôdeur': {
      const max = Math.max(1, stats.proficiencyBonus)
      features.push(createCounter('Ennemi Juré (Chasseur)', max, 'long'))
      break
    }
    case 'Ensorceleur': {
      if (safeLevel >= 2) {
        features.push(createCounter('Points de Sorcellerie', safeLevel, 'long'))
      }
      break
    }
    default:
      break
  }

  return features
}
