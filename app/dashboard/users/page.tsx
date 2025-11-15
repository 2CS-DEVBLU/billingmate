import { redirect } from 'next/navigation'
import { createClient } from "@/lib/supabase/server"
import { UserManagementClient } from "@/components/user-management-client"

export default async function UsersPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  if (!profile) {
    redirect("/auth/login")
  }

  // Check if user is admin
  if (!profile.is_admin) {
    redirect("/dashboard")
  }

  // Fetch company data separately to avoid relationship ambiguity
  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("id", profile.company_id)
    .single()

  // Check if registration is complete
  if (!company?.is_registration_complete) {
    redirect("/dashboard/settings")
  }

  // Fetch all users in the company
  const { data: users } = await supabase
    .from("profiles")
    .select("*")
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false })

  // Fetch pending invitations
  const { data: invitations } = await supabase
    .from("user_invitations")
    .select("*")
    .eq("company_id", profile.company_id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  return (
    <UserManagementClient
      users={users || []}
      invitations={invitations || []}
      currentUserId={user.id}
    />
  )
}
