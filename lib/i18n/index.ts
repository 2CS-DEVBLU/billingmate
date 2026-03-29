import ptBR from "./dictionaries/pt-BR.json"
import enUS from "./dictionaries/en-US.json"
import es from "./dictionaries/es.json"

export type Locale = "pt-BR" | "en-US" | "es"
export type Dictionary = typeof enUS

export const locales: Locale[] = ["pt-BR", "en-US", "es"]

export const localeNames: Record<Locale, string> = {
  "pt-BR": "Portugues",
  "en-US": "English",
  "es": "Espanol",
}

export const localeFlags: Record<Locale, string> = {
  "pt-BR": "BR",
  "en-US": "US",
  "es": "ES",
}

const dictionaries: Record<Locale, Dictionary> = {
  "pt-BR": ptBR,
  "en-US": enUS,
  "es": es,
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] || dictionaries["en-US"]
}

export const defaultLocale: Locale = "pt-BR"
