import { redirect } from 'next/navigation'
import { createClient } from "@/lib/supabase/server"
import ManageIntegrationClient from "@/components/manage-integration-client"

export default async function DigitalOceanIntegrationPage() {
  console.log("[v0] DigitalOcean Integration Settings - Loading")
  
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/auth/login")
  }

  console.log("[v0] DigitalOcean Integration Settings - User:", user.email)

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  if (!profile || !profile.company_id) {
    redirect("/auth/sign-up")
  }

  console.log("[v0] DigitalOcean Integration Settings - Profile:", profile.id)

  const { data: integration, error } = await supabase
    .from("cloud_integrations")
    .select("*")
    .eq("company_id", profile.company_id)
    .eq("provider", "digitalocean")
    .maybeSingle()

  console.log("[v0] DigitalOcean Integration Settings - Integration:", integration?.id, "Error:", error)

  if (!integration) {
    redirect("/dashboard/integrations/digitalocean/setup")
  }

  return (
    <ManageIntegrationClient
      integration={integration}
      provider="digitalocean"
      isAdmin={profile.is_admin}
    />
  )
}
