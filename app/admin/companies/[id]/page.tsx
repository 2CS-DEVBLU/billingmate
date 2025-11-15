import { redirect } from 'next/navigation'
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AdminNav } from "@/components/admin-nav"
import { ArrowLeft, Users, UserPlus, Edit, Trash2, Ban, CheckCircle } from 'lucide-react'
import Link from "next/link"
import { DeleteCompanyDialog } from "@/components/delete-company-dialog"
import { DeactivateCompanyDialog } from "@/components/deactivate-company-dialog"

export default async function CompanyDetailPage({ params }: { params: { id: string } }) {
  console.log("[v0] Loading company detail page for ID:", params.id)

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

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("*")
    .eq("id", params.id)
    .maybeSingle()

  console.log("[v0] Company data:", company)
  console.log("[v0] Company error:", companyError)

  if (!company || companyError) {
    console.log("[v0] Company not found, redirecting")
    redirect("/admin/companies")
  }

  const { data: subscriptions, error: subError } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("company_id", params.id)

  console.log("[v0] Subscriptions query result:", subscriptions)
  console.log("[v0] Subscriptions error:", subError)
  console.log("[v0] Active subscription:", subscriptions?.[0])

  let adminUser = null
  if (company.admin_user_id) {
    const { data: admin } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("id", company.admin_user_id)
      .single()
    adminUser = admin
  }

  const { count: userCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("company_id", params.id)

  const { count: integrationCount } = await supabase
    .from("cloud_integrations")
    .select("*", { count: "exact", head: true })
    .eq("company_id", params.id)

  const activeSubscription = subscriptions?.[0]

  const isIncomplete =
    !company.name ||
    !company.company_size ||
    (!company.cnpj_cpf && !company.vat_number) ||
    !company.area_of_operation ||
    !company.admin_user_id

  const formatAddress = () => {
    const parts = []
    if (company.street) parts.push(company.street)
    if (company.number) parts.push(company.number)
    if (company.neighborhood) parts.push(company.neighborhood)
    if (company.city) parts.push(company.city)
    if (company.state) parts.push(company.state)
    if (company.zip_code) parts.push(company.zip_code)
    if (company.country) parts.push(company.country)
    return parts.length > 0 ? parts.join(", ") : null
  }

  const formattedAddress = formatAddress()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
      <AdminNav />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button variant="ghost" asChild className="text-slate-400 hover:text-white mb-4">
            <Link href="/admin/companies">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Companies
            </Link>
          </Button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">{company.name}</h1>
              <p className="text-slate-400 mt-2">Complete company registration and user management</p>
            </div>
            <div className="flex items-center gap-2">
              {isIncomplete && (
                <Badge variant="outline" className="border-amber-700 text-amber-400 bg-amber-900/20">
                  Incomplete Registration
                </Badge>
              )}
              {company.is_active ? (
                <DeactivateCompanyDialog
                  companyId={company.id}
                  companyName={company.name}
                  userCount={userCount || 0}
                />
              ) : (
                <DeactivateCompanyDialog
                  companyId={company.id}
                  companyName={company.name}
                  userCount={userCount || 0}
                  isReactivating
                />
              )}
              <DeleteCompanyDialog
                companyId={company.id}
                companyName={company.name}
                userCount={userCount || 0}
                integrationCount={integrationCount || 0}
              />
            </div>
          </div>
        </div>

        {!company.is_active && (
          <Card className="border-red-800 bg-red-900/20 backdrop-blur mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Ban className="h-5 w-5 text-red-400" />
                <div>
                  <p className="text-red-300 font-medium">Company Deactivated</p>
                  <p className="text-red-400 text-sm mt-1">
                    This company and all its users have been deactivated. 
                    {company.deactivated_at && (
                      <> Deactivated on {new Date(company.deactivated_at).toLocaleDateString()}.</>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6">
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Company Registration</CardTitle>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-indigo-700 text-indigo-400 hover:bg-indigo-900/30 bg-transparent"
              >
                <Link href={`/admin/companies/${company.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Data
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-sm text-slate-400">Company ID</p>
                  <p className="text-white font-mono text-sm">
                    {company.unique_id || <span className="text-slate-600">Not generated</span>}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-slate-400">Company Name</p>
                  <p className="text-white font-medium">
                    {company.name || <span className="text-slate-600">Not provided</span>}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-slate-400">Company Size</p>
                  <p className="text-white font-medium">
                    {company.company_size || <span className="text-slate-600">Not provided</span>}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-slate-400">Industry</p>
                  <p className="text-white font-medium">
                    {company.industry || <span className="text-slate-600">Not provided</span>}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-slate-400">Area of Operation</p>
                  <p className="text-white font-medium">
                    {company.area_of_operation || <span className="text-slate-600">Not provided</span>}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-slate-400">Country</p>
                  <p className="text-white font-medium">
                    {company.country_code || <span className="text-slate-600">Not provided</span>}
                  </p>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <p className="text-sm text-slate-400">Address</p>
                  <p className="text-white font-medium">
                    {formattedAddress || <span className="text-slate-600">Not provided</span>}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-slate-400">
                    {company.country === 'Brazil' ? 'CNPJ/CPF' : 'VAT Number'}
                  </p>
                  <p className="text-white font-medium">
                    {company.cnpj_cpf || company.vat_number || <span className="text-slate-600">Not provided</span>}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-slate-400">Administrator User</p>
                  {adminUser ? (
                    <div>
                      <p className="text-white font-medium">{adminUser.full_name}</p>
                      <p className="text-sm text-slate-500">{adminUser.email}</p>
                    </div>
                  ) : (
                    <p className="text-slate-600">Not assigned</p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-slate-400">Contracted Plan</p>
                  {activeSubscription ? (
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-900/30 border-green-700 text-green-400 capitalize">
                        {activeSubscription.plan_type}
                      </Badge>
                      {activeSubscription.status && (
                        <span className="text-xs text-slate-500">
                          ({activeSubscription.status})
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-900/30 border-blue-700 text-blue-400">
                        Trial
                      </Badge>
                      <span className="text-xs text-slate-500">
                        (Free tier)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Users</CardTitle>
                  <p className="text-slate-400 text-sm mt-1">Manage users and access permissions for this company</p>
                </div>
                <div className="flex gap-2">
                  <Button asChild className="bg-purple-600 hover:bg-purple-700 text-white">
                    <Link href={`/admin/companies/${company.id}/users/new`}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Create User
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="border-indigo-700 text-indigo-400 hover:bg-indigo-900/30 bg-transparent"
                  >
                    <Link href={`/admin/companies/${company.id}/users`}>
                      <Users className="h-4 w-4 mr-2" />
                      View Users
                    </Link>
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
      </main>
    </div>
  )
}
