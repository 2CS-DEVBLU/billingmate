"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Cloud,
  TrendingDown,
  Users,
  CreditCard,
  Settings,
  LogOut,
  User,
  Building,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  DollarSign,
  AlertTriangle,
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useI18n } from "@/lib/i18n/context"

interface SidebarProps {
  companyName?: string
  isAdmin?: boolean
  userRole?: string
}

export function Sidebar({ companyName, isAdmin = false, userRole }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const { t } = useI18n()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  const mainLinks = [
    { href: "/dashboard", label: t.nav.overview, icon: LayoutDashboard },
    { href: "/dashboard/integrations", label: t.nav.integrations, icon: Cloud },
    { href: "/dashboard/budgets", label: "Budgets", icon: DollarSign },
    { href: "/dashboard/anomalies", label: "Anomalies", icon: AlertTriangle },
  ]

  const adminLinks = isAdmin
    ? [
        { href: "/dashboard/users", label: t.nav.team, icon: Users },
        { href: "/dashboard/billing", label: t.nav.billing, icon: CreditCard },
      ]
    : []

  const settingsLinks = [
    { href: "/dashboard/profile", label: t.nav.profile, icon: User },
    ...(isAdmin ? [{ href: "/dashboard/settings", label: t.nav.company, icon: Building }] : []),
  ]

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname.startsWith(href)
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-white/[0.06] bg-[rgba(11,11,20,0.95)] backdrop-blur-xl transition-all duration-300",
        collapsed ? "w-[68px]" : "w-[240px]"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-white/[0.06] px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20">
          <BarChart3 className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-bold text-white tracking-tight">BillingMate</span>
            {companyName && (
              <span className="text-[10px] text-slate-500 truncate">{companyName}</span>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {!collapsed && (
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              {t.nav.menu}
            </p>
          )}
          {mainLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive(link.href)
                  ? "bg-gradient-to-r from-indigo-500/15 to-violet-500/10 text-white shadow-sm shadow-indigo-500/5 border border-indigo-500/20"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
              )}
            >
              <link.icon className={cn("h-4 w-4 shrink-0", isActive(link.href) ? "text-indigo-400" : "")} />
              {!collapsed && <span>{link.label}</span>}
            </Link>
          ))}
        </div>

        {adminLinks.length > 0 && (
          <div className="mt-6 space-y-1">
            {!collapsed && (
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                {t.nav.manage}
              </p>
            )}
            {adminLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive(link.href)
                    ? "bg-gradient-to-r from-indigo-500/15 to-violet-500/10 text-white shadow-sm shadow-indigo-500/5 border border-indigo-500/20"
                    : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
                )}
              >
                <link.icon className={cn("h-4 w-4 shrink-0", isActive(link.href) ? "text-indigo-400" : "")} />
                {!collapsed && <span>{link.label}</span>}
              </Link>
            ))}
          </div>
        )}

        <div className="mt-6 space-y-1">
          {!collapsed && (
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              {t.nav.settings}
            </p>
          )}
          {settingsLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive(link.href)
                  ? "bg-gradient-to-r from-indigo-500/15 to-violet-500/10 text-white shadow-sm shadow-indigo-500/5 border border-indigo-500/20"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
              )}
            >
              <link.icon className={cn("h-4 w-4 shrink-0", isActive(link.href) ? "text-indigo-400" : "")} />
              {!collapsed && <span>{link.label}</span>}
            </Link>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-white/[0.06] p-3 space-y-1">
        <LanguageSwitcher collapsed={collapsed} />

        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-all hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>{t.common.signOut}</span>}
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs text-slate-500 transition-all hover:bg-white/[0.04] hover:text-slate-400"
        >
          {collapsed ? <ChevronRight className="h-4 w-4 shrink-0" /> : <ChevronLeft className="h-4 w-4 shrink-0" />}
          {!collapsed && <span>{t.nav.collapse}</span>}
        </button>
      </div>
    </aside>
  )
}
