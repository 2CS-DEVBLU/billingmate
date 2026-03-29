"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { getDictionary, defaultLocale, type Locale, type Dictionary } from "./index"

interface I18nContextType {
  locale: Locale
  t: Dictionary
  setLocale: (locale: Locale) => void
}

const I18nContext = createContext<I18nContextType | null>(null)

export function I18nProvider({
  children,
  initialLocale,
}: {
  children: ReactNode
  initialLocale?: Locale
}) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (initialLocale) return initialLocale
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("billingmate-locale") as Locale | null
      if (saved) return saved
    }
    return defaultLocale
  })

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    if (typeof window !== "undefined") {
      localStorage.setItem("billingmate-locale", newLocale)
    }
  }, [])

  const t = getDictionary(locale)

  return (
    <I18nContext.Provider value={{ locale, t, setLocale }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider")
  }
  return context
}
