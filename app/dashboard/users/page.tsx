import { redirect } from 'next/navigation'
import { createClient } from "@/lib/supabase/server"
import { UserManagementClient } from "@/components/user-management-client"

export default async function UsersPage() {
  const supabase = await createClient()

  console.log("[v0] Users Page - Loading")

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  console.log("[v0] Users Page - User:", user?.email, "Error:", userError)

  if (userError || !user) {
    console.log("[v0] Users Page - No user, redirecting to login")
    redirect("/auth/login")
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*, companies(*)")
    .eq("id", user.id)
    .maybeSingle()

  console.log("[v0] Users Page - Profile:", profile?.id, "Error:", profileError)

  if (!profile) {
    console.log("[v0] Users Page - No profile, redirecting to login")
    redirect("/auth/login")
  }

  // Check if user is admin
  if (!profile.is_admin) {
    console.log("[v0] Users Page - Not admin, redirecting to dashboard")
    redirect("/dashboard")
  }

  // Check if registration is complete
  if (!profile.companies?.is_registration_complete) {
    console.log("[v0] Users Page - Registration incomplete, redirecting to settings")
    redirect("/dashboard/settings")
  }

  // Fetch all users in the company
  const { data: users } = await supabase
    .from("profiles")
    .select("*")
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false })

  console.log("[v0] Users Page - Fetched", users?.length || 0, "users")

  // Fetch pending invitations
  const { data: invitations } = await supabase
    .from("user_invitations")
    .select("*")
    .eq("company_id", profile.company_id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  console.log("[v0] Users Page - Fetched", invitations?.length || 0, "invitations")

  return (
    <UserManagementClient
      users={users || []}
      invitations={invitations || []}
      currentUserId={user.id}
    />
  )
}
