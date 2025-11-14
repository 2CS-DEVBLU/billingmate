import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminNav } from "@/components/admin-nav"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { EditCompanyForm } from "@/components/edit-company-form"

export default async function EditCompanyPage({ params }: { params: { id: string } }) {
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

  const { data: company } = await supabase
    .from("companies")
    .select(`
      *,
      profiles!companies_admin_user_id_fkey(id, full_name, email)
    `)
    .eq("id", params.id)
    .single()

  if (!company) {
    redirect("/admin/companies")
  }

  const { data: allUsers } = await supabase
    .from("profiles")
    .select("id, full_name, email, company_id")
    .eq("company_id", params.id)
    .order("full_name")

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
      <AdminNav />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            href={`/admin/companies/${params.id}`}
            className="inline-flex items-center text-slate-400 hover:text-white mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Company Details
          </Link>
          <h1 className="text-3xl font-bold text-white">Edit Company Registration</h1>
          <p className="text-slate-400 mt-2">Update company information and details</p>
        </div>

        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur max-w-4xl">
          <CardHeader>
            <CardTitle className="text-white">Company Information</CardTitle>
          </CardHeader>
          <CardContent>
            <EditCompanyForm company={company} users={allUsers || []} />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
