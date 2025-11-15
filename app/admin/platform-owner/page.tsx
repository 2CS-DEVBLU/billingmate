import { redirect } from 'next/navigation'
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AdminNav } from "@/components/admin-nav"
import { ArrowLeft, Building, MapPin, FileText, Calendar, Users } from 'lucide-react'
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export default async function PlatformOwnerPage() {
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

  // Get platform owner company
  const { data: platformOwner } = await supabase
    .from("companies")
    .select(`
      *,
      subscriptions(*),
      cloud_integrations(*)
    `)
    .eq("is_platform_owner", true)
    .maybeSingle()

  if (!platformOwner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
        <AdminNav />
        <main className="container mx-auto px-4 py-8">
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Platform Owner Not Found</CardTitle>
              <CardDescription className="text-slate-400">
                No company is marked as the platform owner. Please configure this in the database.
              </CardDescription>
            </CardHeader>
          </Card>
        </main>
      </div>
    )
  }

  // Get user count for platform owner
  const { count: userCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("company_id", platformOwner.id)

  // Format address
  const formatAddress = () => {
    if (platformOwner.street) {
      return `${platformOwner.street}${platformOwner.number ? ", " + platformOwner.number : ""}${
        platformOwner.neighborhood ? ", " + platformOwner.neighborhood : ""
      }, ${platformOwner.city || ""}${platformOwner.state ? ", " + platformOwner.state : ""} ${
        platformOwner.zip_code || ""
      }, ${platformOwner.country || ""}`
    }
    return platformOwner.address || "Not provided"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
      <AdminNav />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button variant="ghost" asChild className="text-slate-400 hover:text-white mb-4">
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-white">{platformOwner.name}</h1>
                <Badge className="bg-indigo-900/30 border-indigo-700 text-indigo-400">
                  Platform Owner
                </Badge>
              </div>
              <p className="text-slate-400 mt-2">Company that owns and operates BillingMate</p>
            </div>
            <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Link href={`/admin/companies/${platformOwner.id}/edit`}>
                Edit Company Details
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Company Information */}
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Building className="h-5 w-5 text-indigo-400" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-slate-400">Industry</p>
                <p className="text-white font-medium">{platformOwner.industry || "Not specified"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Company Size</p>
                <p className="text-white font-medium">{platformOwner.company_size || "Not specified"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Area of Operation</p>
                <p className="text-white font-medium">{platformOwner.area_of_operation || "Not specified"}</p>
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MapPin className="h-5 w-5 text-emerald-400" />
                Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white">{formatAddress()}</p>
            </CardContent>
          </Card>

          {/* Tax Information */}
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-400" />
                Tax Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-slate-400">Country</p>
                <p className="text-white font-medium">{platformOwner.country || "Not specified"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">
                  {platformOwner.country === "Brazil" ? "CNPJ/CPF" : "VAT Number"}
                </p>
                <p className="text-white font-medium">
                  {platformOwner.country === "Brazil"
                    ? platformOwner.cnpj_cpf || "Not provided"
                    : platformOwner.vat_number || "Not provided"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Users */}
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-400" />
                Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white mb-2">{userCount || 0}</p>
              <p className="text-slate-400 text-sm">Total users in platform owner company</p>
              <Button asChild variant="outline" size="sm" className="mt-4 border-slate-700 text-slate-300 hover:bg-slate-800">
                <Link href={`/admin/companies/${platformOwner.id}/users`}>
                  View Users
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Integrations */}
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Building className="h-5 w-5 text-orange-400" />
                Cloud Integrations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white mb-2">
                {platformOwner.cloud_integrations?.length || 0}
              </p>
              <p className="text-slate-400 text-sm">Active cloud provider integrations</p>
            </CardContent>
          </Card>

          {/* Created Date */}
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-yellow-400" />
                Registration Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white font-medium">
                {new Date(platformOwner.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
