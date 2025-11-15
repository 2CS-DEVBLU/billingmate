import { redirect } from 'next/navigation'
import { createClient } from "@/lib/supabase/server"
import { getUserWithCompany } from "@/lib/auth-utils"
import { ClientNav } from "@/components/client-nav"
import { ManageIntegrationClient } from "@/components/manage-integration-client"

export default async function ManageDigitalOceanPage() {
  const supabase = await createClient()
  const { user, profile, company, isAdmin } = await getUserWithCompany()

  if (!user || !profile || !profile.company_id) {
    redirect("/auth/login")
  }

  const { data: integration } = await supabase
    .from("cloud_integrations")
    .select("*")
    .eq("company_id", profile.company_id)
    .eq("provider", "digitalocean")
    .maybeSingle()

  if (!integration) {
    redirect("/dashboard/integrations")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
      <ClientNav companyName={company?.name} isAdmin={isAdmin} />
      <main className="container mx-auto px-4 py-8">
        <ManageIntegrationClient
          integration={integration}
          providerName="DigitalOcean"
          providerLogo="🌊"
          isAdmin={isAdmin}
        />
      </main>
    </div>
  )
}
