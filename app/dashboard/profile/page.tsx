import { redirect } from 'next/navigation'
import { createClient } from "@/lib/supabase/server"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProfileForm } from "@/components/profile-form"

export default async function ProfilePage() {
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

  if (!profile) {
    redirect("/auth/login")
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">My Profile</h1>
        <p className="text-slate-400 mt-2">Manage your personal account information</p>
      </div>

      <Card className="glass border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-white">Profile Information</CardTitle>
          <CardDescription className="text-slate-400">
            Update your personal details and contact information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm profile={profile} user={user} />
        </CardContent>
      </Card>
    </div>
  )
}
