import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

import { DigitalOceanSetupForm } from "@/components/digitalocean-setup-form"

export default async function DigitalOceanSetupPage() {
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
    <div className="max-w-2xl">
      <DigitalOceanSetupForm companyId={profile.company_id} />
    </div>
  )
}
