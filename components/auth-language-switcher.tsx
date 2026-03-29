"use client"

import { useI18n } from "@/lib/i18n/context"
import { locales, localeFlags, type Locale } from "@/lib/i18n"

export function AuthLanguageSwitcher() {
  const { locale, setLocale } = useI18n()

  return (
    <div className="flex gap-1">
      {locales.map((loc) => (
        <button
          key={loc}
          onClick={() => setLocale(loc)}
          className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${
            locale === loc
              ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
              : "bg-white/5 text-slate-500 border border-transparent hover:text-slate-300 hover:bg-white/10"
          }`}
        >
          {localeFlags[loc]}
        </button>
      ))}
    </div>
  )
}
