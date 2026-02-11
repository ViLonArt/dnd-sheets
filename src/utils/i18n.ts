import en from '@/data/rules2024.i18n.en.json'
import fr from '@/data/rules2024.i18n.fr.json'
import type { Locale } from './advancementTypes'

type Dictionary = Record<string, string>

const DICTIONARIES: Record<Locale, Dictionary> = {
  en,
  fr,
}

export const getDictionary = (locale: Locale): Dictionary => DICTIONARIES[locale]

export const t = (key: string, locale: Locale, fallback?: string): string => {
  const dictionary = DICTIONARIES[locale]
  return dictionary?.[key] ?? fallback ?? key
}
