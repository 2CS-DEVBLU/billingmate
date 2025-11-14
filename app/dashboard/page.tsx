import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingDown, Server, AlertCircle } from "lucide-react"
import { ClientNav } from "@/components/client-nav"
import { CostChart } from "@/components/cost-chart"
import { CloudAccountsCard } from "@/components/cloud-accounts-card"
import { RecommendationsCard } from "@/components/recommendations-card"
import { AlertsCard } from "@/components/alerts-card"
import { ProviderSelector } from "@/components/provider-selector"

export default async function ClientDashboard({
  searchParams,
}: {
  searchParams: { provider?: string }
}) {
  const supabase = await createClient()
  const selectedProvider = searchParams.provider || "all"

  console.log("[v0] Dashboard - Loading")

  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log("[v0] Dashboard - User:", user?.email || "none")

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*, companies!profiles_company_id_fkey(*)")
    .eq("id", user.id)
    .single()

  console.log("[v0] Dashboard - Profile:", profile?.email, "Company:", profile?.company_id, "Error:", profileError)

  if (!profile) {
    console.log("[v0] Dashboard - No profile, redirecting to login")
    redirect("/auth/login")
  }

  if (!profile.company_id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center">
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur max-w-md">
          <CardHeader>
            <CardTitle className="text-white">No Company Assigned</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-400">
              Your account is not associated with a company yet. Please contact your administrator to assign you to a
              company.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { data: integrations } = await supabase
    .from("cloud_integrations")
    .select("*")
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false })

  const activeIntegrations = integrations?.filter((i) => i.is_active) || []

  // If no integrations, redirect to setup
  if (activeIntegrations.length === 0) {
    redirect("/dashboard/integrations")
  }

  if (!searchParams.provider) {
    redirect("/dashboard/integrations")
  }

  let cloudAccountsQuery = supabase.from("cloud_accounts").select("*").eq("company_id", profile.company_id)

  if (selectedProvider !== "all") {
    cloudAccountsQuery = cloudAccountsQuery.eq("provider", selectedProvider)
  }

  const { data: cloudAccounts } = await cloudAccountsQuery.order("created_at", { ascending: false })

  const totalMonthlySpend = cloudAccounts?.reduce((sum, account) => sum + Number(account.monthly_spend), 0) || 0

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  let costDataQuery = supabase
    .from("cost_data")
    .select("*, cloud_accounts!inner(company_id, provider)")
    .eq("cloud_accounts.company_id", profile.company_id)
    .gte("date", thirtyDaysAgo.toISOString().split("T")[0])

  if (selectedProvider !== "all") {
    costDataQuery = costDataQuery.eq("cloud_accounts.provider", selectedProvider)
  }

  const { data: costData } = await costDataQuery.order("date", { ascending: true })

  let recommendationsQuery = supabase
    .from("recommendations")
    .select("*, cloud_accounts!inner(company_id, provider)")
    .eq("cloud_accounts.company_id", profile.company_id)
    .order("priority", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(5)

  if (selectedProvider !== "all") {
    recommendationsQuery = recommendationsQuery.eq("cloud_accounts.provider", selectedProvider)
  }

  const { data: recommendations } = await recommendationsQuery

  const totalPotentialSavings = recommendations?.reduce((sum, rec) => sum + Number(rec.potential_savings), 0) || 0
  const openRecommendations = recommendations?.filter((r) => r.status === "open").length || 0

  // Fetch alerts
  const { data: alerts } = await supabase
    .from("alerts")
    .select("*")
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false })
    .limit(5)

  const unreadAlerts = alerts?.filter((a) => !a.is_read).length || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
      <ClientNav companyName={profile.companies?.name} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-slate-400 mt-2">Welcome back, {profile.full_name || "User"}</p>
          </div>
          <ProviderSelector
            integrations={integrations || []}
            selectedProvider={selectedProvider}
            companyId={profile.company_id}
          />
        </div>

        {/* Key Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Monthly Spend</CardTitle>
              <DollarSign className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">${totalMonthlySpend.toLocaleString()}</div>
              <p className="text-xs text-slate-500 mt-1">
                {selectedProvider === "all" ? "All providers" : selectedProvider.toUpperCase()}
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Potential Savings</CardTitle>
              <TrendingDown className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400">${totalPotentialSavings.toLocaleString()}</div>
              <p className="text-xs text-slate-500 mt-1">{openRecommendations} open recommendations</p>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Cloud Accounts</CardTitle>
              <Server className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{cloudAccounts?.length || 0}</div>
              <p className="text-xs text-slate-500 mt-1">Connected accounts</p>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Alerts</CardTitle>
              <AlertCircle className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-400">{unreadAlerts}</div>
              <p className="text-xs text-slate-500 mt-1">Unread alerts</p>
            </CardContent>
          </Card>
        </div>

        {/* Cost Chart */}
        <div className="mb-8">
          <CostChart costData={costData || []} />
        </div>

        {/* Cloud Accounts & Recommendations */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          <CloudAccountsCard cloudAccounts={cloudAccounts || []} />
          <RecommendationsCard recommendations={recommendations || []} companyId={profile.company_id} />
        </div>

        {/* Alerts */}
        <AlertsCard alerts={alerts || []} companyId={profile.company_id} />
      </main>
    </div>
  )
}
