import { redirect } from 'next/navigation'
import { createClient } from "@/lib/supabase/server"
import ManageIntegrationClient from "@/components/manage-integration-client"

export default async function AwsIntegrationPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  if (!profile || !profile.company_id) {
    redirect("/auth/sign-up")
  }

  const { data: integration } = await supabase
    .from("cloud_integrations")
    .select("*")
    .eq("company_id", profile.company_id)
    .eq("provider", "aws")
    .maybeSingle()

  if (!integration) {
    redirect("/dashboard/integrations/aws/setup")
  }

  return (
    <ManageIntegrationClient
      integration={integration}
      provider="aws"
      isAdmin={profile.is_admin}
    />
  )
}
