import { redirect } from 'next/navigation'
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AdminNav } from "@/components/admin-nav"
import { ArrowLeft, Users, UserPlus, Edit, Trash2, Ban, Lock } from 'lucide-react'
import Link from "next/link"
import { DeleteCompanyDialog } from "@/components/delete-company-dialog"
import { DeactivateCompanyDialog } from "@/components/deactivate-company-dialog"
import { Label } from "@/components/ui/label"

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

  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("company_id", params.id)

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

  const isBrazil = company.country === 'Brazil' || company.country_code === 'BR'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
      <AdminNav />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            href="/admin/companies"
            className="inline-flex items-center text-slate-400 hover:text-white mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Companies
          </Link>
          <h1 className="text-3xl font-bold text-white">Company Registration</h1>
          <p className="text-slate-400 mt-2">View and manage company information and details</p>
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

        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur max-w-4xl mb-6">
          <CardHeader>
            <CardTitle className="text-white">Company Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Company Unique ID */}
            {company.unique_id && (
              <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="h-4 w-4 text-slate-400" />
                  <Label className="text-slate-300 text-sm font-medium">Company Unique ID (Immutable)</Label>
                </div>
                <p className="text-white font-mono text-lg">{company.unique_id}</p>
                <p className="text-xs text-slate-500 mt-1">This ID cannot be changed and is used for account traceability</p>
              </div>
            )}

            {/* Company Details Section */}
            <div className="space-y-4 border-t border-slate-700 pt-6">
              <h3 className="text-lg font-semibold text-white">Company Details</h3>
              
              <div className="space-y-2">
                <Label className="text-slate-300">Company Name</Label>
                <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-md">
                  <p className="text-white">{company.name || <span className="text-slate-500">Not provided</span>}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Company Size</Label>
                  <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-md">
                    <p className="text-white">{company.company_size || <span className="text-slate-500">Not provided</span>}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Industry</Label>
                  <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-md">
                    <p className="text-white">{company.industry || <span className="text-slate-500">Not provided</span>}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Area of Operation</Label>
                  <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-md">
                    <p className="text-white">{company.area_of_operation || <span className="text-slate-500">Not provided</span>}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Administrator User</Label>
                  <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-md">
                    {adminUser ? (
                      <div>
                        <p className="text-white font-medium">{adminUser.full_name}</p>
                        <p className="text-sm text-slate-400">{adminUser.email}</p>
                      </div>
                    ) : (
                      <p className="text-slate-500">Not assigned</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Address Information Section */}
            <div className="space-y-4 border-t border-slate-700 pt-6">
              <h3 className="text-lg font-semibold text-white">Address Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-slate-300">Street</Label>
                  <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-md">
                    <p className="text-white">{company.street || <span className="text-slate-500">Not provided</span>}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Number</Label>
                  <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-md">
                    <p className="text-white">{company.number || <span className="text-slate-500">Not provided</span>}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Zip Code</Label>
                  <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-md">
                    <p className="text-white">{company.zip_code || <span className="text-slate-500">Not provided</span>}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Neighborhood</Label>
                  <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-md">
                    <p className="text-white">{company.neighborhood || <span className="text-slate-500">Not provided</span>}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">City</Label>
                  <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-md">
                    <p className="text-white">{company.city || <span className="text-slate-500">Not provided</span>}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">State</Label>
                  <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-md">
                    <p className="text-white">{company.state || <span className="text-slate-500">Not provided</span>}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Country</Label>
                  <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-md">
                    <p className="text-white">{company.country || <span className="text-slate-500">Not provided</span>}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tax Information Section */}
            {(company.cnpj_cpf || company.vat_number || company.state_registration || company.municipal_registration) && (
              <div className="space-y-4 border-t border-slate-700 pt-6">
                <h3 className="text-lg font-semibold text-white">Tax Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {isBrazil ? (
                    <>
                      <div className="space-y-2">
                        <Label className="text-slate-300">CNPJ / CPF</Label>
                        <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-md">
                          <p className="text-white">{company.cnpj_cpf || <span className="text-slate-500">Not provided</span>}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-300">State Registration (IE)</Label>
                        <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-md">
                          <p className="text-white">{company.state_registration || <span className="text-slate-500">Not provided</span>}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-300">Municipal Registration (IM)</Label>
                        <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-md">
                          <p className="text-white">{company.municipal_registration || <span className="text-slate-500">Not provided</span>}</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <Label className="text-slate-300">VAT / Tax ID</Label>
                      <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-md">
                        <p className="text-white">{company.vat_number || <span className="text-slate-500">Not provided</span>}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Subscription Information */}
            <div className="space-y-4 border-t border-slate-700 pt-6">
              <h3 className="text-lg font-semibold text-white">Subscription Details</h3>
              
              <div className="space-y-2">
                <Label className="text-slate-300">Contracted Plan</Label>
                <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-md">
                  {activeSubscription ? (
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-900/30 border-green-700 text-green-400 capitalize">
                        {activeSubscription.plan_type}
                      </Badge>
                      {activeSubscription.status && (
                        <span className="text-sm text-slate-400">
                          ({activeSubscription.status})
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-900/30 border-blue-700 text-blue-400">
                        Trial
                      </Badge>
                      <span className="text-sm text-slate-400">
                        (Free tier)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center gap-3 pt-6 border-t border-slate-700">
              <div className="flex gap-2">
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
              <Button
                asChild
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Link href={`/admin/companies/${company.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Data
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur max-w-4xl">
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
      </main>
    </div>
  )
}
