"use client"

import Link from "next/link"
import { usePathname } from 'next/navigation'
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TrendingDown, LayoutDashboard, Settings, LogOut, CreditCard, User, Building, Home } from 'lucide-react'
import { createClient } from "@/lib/supabase/client"
import { useRouter } from 'next/navigation'
import { InviteUserDialog } from '@/components/invite-user-dialog'
import { useState } from 'react'

interface ClientNavProps {
  companyName?: string
  isAdmin?: boolean
}

export function ClientNav({ companyName, isAdmin = false }: ClientNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)

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
            {isAdmin && (
              <Button
                variant={pathname === "/dashboard/users" ? "secondary" : "ghost"}
                asChild
                className={
                  pathname === "/dashboard/users"
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }
              >
                <Link href="/dashboard/users">
                  <User className="h-4 w-4 mr-2" />
                  Users
                </Link>
              </Button>
            )}
            {isAdmin && (
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
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800/50">
                <Settings className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-slate-800">
              <DropdownMenuLabel className="text-slate-300">Account Settings</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-800" />
              <DropdownMenuItem asChild className="text-slate-300 focus:bg-slate-800 focus:text-white cursor-pointer">
                <Link href="/dashboard/profile" className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  My Profile
                </Link>
              </DropdownMenuItem>
              {isAdmin && (
                <>
                  <DropdownMenuItem asChild className="text-slate-300 focus:bg-slate-800 focus:text-white cursor-pointer">
                    <Link href="/dashboard/settings" className="flex items-center">
                      <Building className="h-4 w-4 mr-2" />
                      Company Settings
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator className="bg-slate-800" />
              <DropdownMenuItem 
                onClick={handleSignOut}
                className="text-red-400 focus:bg-slate-800 focus:text-red-300 cursor-pointer"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
