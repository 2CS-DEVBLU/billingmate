import { redirect } from "next/navigation"
import { getUserWithCompany } from "@/lib/auth-utils"
import { DashboardShell } from "@/components/dashboard-shell"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile, company, isAdmin } = await getUserWithCompany()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <DashboardShell
      companyName={company?.name}
      isAdmin={isAdmin}
      userRole={profile?.company_account_role}
    >
      {children}
    </DashboardShell>
  )
}
