import { redirect } from 'next/navigation'
import { createClient } from "@/lib/supabase/server"
import { ClientNav } from "@/components/client-nav"
import { DatadogSetupForm } from "@/components/datadog-setup-form"

export default async function DatadogSetupPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, companies!profiles_company_id_fkey(*)")
    .eq("id", user.id)
    .single()

  if (!profile || !profile.company_id) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      <ClientNav companyName={profile.companies?.name} />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <DatadogSetupForm companyId={profile.company_id} />
      </main>
    </div>
  )
}
