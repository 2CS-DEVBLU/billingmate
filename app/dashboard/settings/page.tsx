import { redirect } from 'next/navigation'
import { createClient } from "@/lib/supabase/server"
import { ClientNav } from "@/components/client-nav"
import { CompanySettingsForm } from "@/components/company-settings-form"

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, companies(*)")
    .eq("id", user.id)
    .single()

  if (!profile || !profile.company_id) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
      <ClientNav companyName={profile.companies?.name} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Company Settings</h1>
          <p className="text-slate-400 mt-2">Manage your company registration details</p>
        </div>

        <CompanySettingsForm company={profile.companies} />
      </main>
    </div>
  )
}
