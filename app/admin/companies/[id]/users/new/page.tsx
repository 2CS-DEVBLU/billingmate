import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AdminNav } from "@/components/admin-nav"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { CreateUserForm } from "@/components/create-user-form"

export default async function CreateUserPage({ params }: { params: { id: string } }) {
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

  const { data: company } = await supabase.from("companies").select("*").eq("id", params.id).single()

  if (!company) {
    redirect("/admin/companies")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
      <AdminNav />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Button variant="ghost" asChild className="text-slate-400 hover:text-white mb-4">
            <Link href={`/admin/companies/${params.id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to {company.name}
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-white">Create New User</h1>
          <p className="text-slate-400 mt-2">Add a new user to {company.name}</p>
        </div>

        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">User Information</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateUserForm companyId={params.id} companyName={company.name} />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
