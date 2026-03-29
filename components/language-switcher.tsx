"use client"

import { useI18n } from "@/lib/i18n/context"
import { locales, localeNames, localeFlags, type Locale } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { Globe } from "lucide-react"
import { useState, useRef, useEffect } from "react"

export function LanguageSwitcher({ collapsed = false }: { collapsed?: boolean }) {
  const { locale, setLocale } = useI18n()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 transition-all hover:bg-white/[0.04] hover:text-white"
      >
        <Globe className="h-4 w-4 shrink-0" />
        {!collapsed && (
          <span className="flex items-center gap-2">
            <span className="text-[10px] font-bold bg-white/10 px-1.5 py-0.5 rounded">
              {localeFlags[locale]}
            </span>
            <span className="text-xs">{localeNames[locale]}</span>
          </span>
        )}
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-1 w-44 rounded-lg border border-white/[0.08] bg-[#14141f] p-1 shadow-xl z-50">
          {locales.map((loc) => (
            <button
              key={loc}
              onClick={() => {
                setLocale(loc)
                setOpen(false)
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                locale === loc
                  ? "bg-indigo-500/15 text-white"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
              )}
            >
              <span className="text-[10px] font-bold bg-white/10 px-1.5 py-0.5 rounded w-7 text-center">
                {localeFlags[loc]}
              </span>
              <span>{localeNames[loc]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
