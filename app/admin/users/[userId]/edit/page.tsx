import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AdminNav } from "@/components/admin-nav"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { EditUserForm } from "@/components/edit-user-form"

export default async function EditUserPage({ params }: { params: { userId: string } }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "admin") {
    redirect("/dashboard")
  }

  const { data: targetUser, error } = await supabase
    .from("profiles")
    .select(`
      *,
      companies!profiles_company_id_fkey(*)
    `)
    .eq("id", params.userId)
    .single()

  console.log("[v0] Target user:", targetUser)
  console.log("[v0] Target user error:", error)

  if (!targetUser) {
    redirect("/admin/users")
  }

  const { data: companies } = await supabase.from("companies").select("id, name").order("name")

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
      <AdminNav />

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8 flex items-center gap-4">
          <Button
            variant="outline"
            asChild
            className="border-slate-700 text-slate-300 hover:bg-slate-800 bg-transparent"
          >
            <Link href="/admin/users">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Edit User</h1>
            <p className="text-slate-400 mt-2">Update user information</p>
          </div>
        </div>

        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">User Information</CardTitle>
          </CardHeader>
          <CardContent>
            <EditUserForm user={targetUser} companies={companies || []} />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
