import { redirect } from 'next/navigation'
import { createClient } from "@/lib/supabase/server"
import { getUserWithCompany } from "@/lib/auth-utils"
import { ClientNav } from "@/components/client-nav"
import { CompanySettingsForm } from "@/components/company-settings-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, ShieldAlert } from 'lucide-react'
import Link from 'next/link'

export default async function SettingsPage() {
  const { user, profile, company, isAdmin } = await getUserWithCompany()

  if (!user) {
    redirect("/auth/login")
  }

  if (!profile || !profile.company_id) {
    redirect("/auth/login")
  }

  const supabase = await createClient()
  
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("company_id", company.id)
    .maybeSingle()

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
        <ClientNav companyName={company?.name} isAdmin={isAdmin} />
        <main className="container mx-auto px-4 py-8">
          <Card className="border-red-800 bg-red-900/20 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-red-300 flex items-center gap-2">
                <ShieldAlert className="h-5 w-5" />
                Access Denied
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-200 mb-4">
                Only company administrators can access company settings.
              </p>
              <p className="text-red-300 text-sm">
                Please contact your administrator if you need to update company information.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
      <ClientNav companyName={company?.name} isAdmin={isAdmin} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-slate-400 hover:text-white mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-white">Company Registration</h1>
          <p className="text-slate-400 mt-2">Update company information and details</p>
          {company?.unique_id && (
            <p className="text-slate-500 text-sm mt-1">
              Company ID: <span className="font-mono text-slate-400">{company.unique_id}</span>
            </p>
          )}
        </div>

        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur max-w-4xl">
          <CardHeader>
            <CardTitle className="text-white">Company Information</CardTitle>
          </CardHeader>
          <CardContent>
            <CompanySettingsForm company={company} subscription={subscription} isAdmin={isAdmin} />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
