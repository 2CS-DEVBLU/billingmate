"use client"

import { Sidebar } from "@/components/sidebar"

interface DashboardShellProps {
  children: React.ReactNode
  companyName?: string
  isAdmin?: boolean
  userRole?: string
}

export function DashboardShell({ children, companyName, isAdmin, userRole }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-[#0b0b14]">
      <Sidebar companyName={companyName} isAdmin={isAdmin} userRole={userRole} />
      <main className="ml-[240px] min-h-screen transition-all duration-300">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
