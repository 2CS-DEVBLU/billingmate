import { redirect } from 'next/navigation'
import { createClient } from "@/lib/supabase/server"
import ManageIntegrationClient from "@/components/manage-integration-client"

export default async function DatadogIntegrationPage() {
  console.log("[v0] Datadog Integration Settings - Loading")
  
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/auth/login")
  }

  console.log("[v0] Datadog Integration Settings - User:", user.email)

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  if (!profile || !profile.company_id) {
    redirect("/auth/sign-up")
  }

  console.log("[v0] Datadog Integration Settings - Profile:", profile.id)

  const { data: integration, error } = await supabase
    .from("cloud_integrations")
    .select("*")
    .eq("company_id", profile.company_id)
    .eq("provider", "datadog")
    .maybeSingle()

  console.log("[v0] Datadog Integration Settings - Integration:", integration?.id, "Error:", error)

  if (!integration) {
    redirect("/dashboard/integrations/datadog/setup")
  }

  return (
    <ManageIntegrationClient
      integration={integration}
      provider="datadog"
      isAdmin={profile.is_admin}
    />
  )
}
