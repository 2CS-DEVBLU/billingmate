"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { TrendingDown, LayoutDashboard, Building2, Settings, LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function AdminNav() {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <header className="border-b border-slate-800/50 backdrop-blur-sm sticky top-0 z-50 bg-slate-950/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <TrendingDown className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">BillingMate</span>
            <span className="text-xs text-slate-500 ml-2 px-2 py-1 rounded bg-indigo-900/50 border border-indigo-800">
              ADMIN
            </span>
          </Link>

          <nav className="hidden md:flex gap-1">
            <Button
              variant={pathname === "/admin" ? "secondary" : "ghost"}
              asChild
              className={
                pathname === "/admin"
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }
            >
              <Link href="/admin">
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
            </Button>
            <Button
              variant={pathname === "/admin/companies" ? "secondary" : "ghost"}
              asChild
              className={
                pathname === "/admin/companies"
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }
            >
              <Link href="/admin/companies">
                <Building2 className="h-4 w-4 mr-2" />
                Companies
              </Link>
            </Button>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800/50">
            <Settings className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="text-slate-400 hover:text-white hover:bg-slate-800/50"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  )
}
