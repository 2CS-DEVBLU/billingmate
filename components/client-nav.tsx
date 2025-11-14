"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { TrendingDown, LayoutDashboard, Settings, LogOut, CreditCard } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface ClientNavProps {
  companyName?: string
}

export function ClientNav({ companyName }: ClientNavProps) {
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
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <TrendingDown className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-white leading-none">BillingMate</span>
              {companyName && <span className="text-xs text-slate-500 leading-none mt-0.5">{companyName}</span>}
            </div>
          </Link>

          <nav className="hidden md:flex gap-1">
            <Button
              variant={pathname === "/dashboard" ? "secondary" : "ghost"}
              asChild
              className={
                pathname === "/dashboard"
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }
            >
              <Link href="/dashboard">
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
            </Button>
            <Button
              variant={pathname === "/dashboard/billing" ? "secondary" : "ghost"}
              asChild
              className={
                pathname === "/dashboard/billing"
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }
            >
              <Link href="/dashboard/billing">
                <CreditCard className="h-4 w-4 mr-2" />
                Billing
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
