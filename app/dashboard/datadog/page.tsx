import { redirect } from 'next/navigation'
import { createClient } from "@/lib/supabase/server"
import { getUserWithCompany } from "@/lib/auth-utils"
import { ClientNav } from "@/components/client-nav"
import { RegistrationIncompleteBanner } from "@/components/registration-incomplete-banner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DatadogBillingChart } from "@/components/datadog-billing-chart"
import { DatadogResourceBreakdown } from "@/components/datadog-resource-breakdown"
import { DatadogRecommendations } from "@/components/datadog-recommendations"
import { DatadogProductsList } from "@/components/datadog-products-list"
import { TopResourceConsumers } from "@/components/top-resource-consumers"
import { TimeRangeSelector } from "@/components/time-range-selector"
import { SyncLogsDialogWrapper } from "@/components/sync-logs-dialog-wrapper"
import { SyncDataButton } from "@/components/sync-data-button"
import { MonthlyAverageChart } from "@/components/monthly-average-chart"
import { FinOpsMetrics } from "@/components/finops-metrics"
import Link from 'next/link'
import { Button } from "@/components/ui/button"

export default async function DatadogDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ timeRange?: string }>
}) {
  console.log("[v0] Datadog Dashboard - Loading")

  const params = await searchParams
  const timeRange = params.timeRange || "1"

  const supabase = await createClient()

  const { user, profile, company, isAdmin } = await getUserWithCompany()

  console.log("[v0] Datadog Dashboard - User:", user?.email)

  if (!user) {
    redirect("/auth/login")
  }

  if (!profile || !profile.company_id) {
    redirect("/auth/login")
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan_type, max_analysis_months")
    .eq("company_id", profile.company_id)
    .maybeSingle()

  const planType = subscription?.plan_type || "trial"
  const maxAnalysisMonths = subscription?.max_analysis_months || 3

  const needsTaxInfo = !company?.cnpj_cpf && !company?.vat_number

  if (needsTaxInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
        <ClientNav companyName={company?.name} isAdmin={isAdmin} />
        <main className="container mx-auto px-4 py-8">
          <Card className="bg-slate-800/50 border-slate-700 max-w-2xl mx-auto mt-20">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Complete Company Registration</CardTitle>
              <CardDescription className="text-slate-400">
                Access to billing data and cost analytics is restricted until your company registration is complete.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-300">
                {isAdmin ? (
                  <>
                    As a company administrator, you need to complete the company registration by providing required tax information before accessing cost analytics.
                  </>
                ) : (
                  <>
                    Your company administrator needs to complete the company registration before you can access cost analytics. Please contact your administrator to complete the setup.
                  </>
                )}
              </p>
              {isAdmin && (
                <div className="flex gap-3 pt-4">
                  <Link href="/dashboard/settings">
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                      Complete Registration
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  const { data: integration, error: integrationError } = await supabase
    .from("cloud_integrations")
    .select("*")
    .eq("company_id", profile.company_id)
    .eq("provider", "datadog")
    .maybeSingle() // Changed from .single() to .maybeSingle() to handle case when integration doesn't exist

  console.log("[v0] Datadog Dashboard - Integration:", integration?.id, "Error:", integrationError)

  if (!integration) {
    redirect("/dashboard/integrations")
  }

  // Calculate cooldown remaining
  const lastManualSync = integration.last_manual_sync ? new Date(integration.last_manual_sync) : null
  const now = new Date()
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
  const canSync = !lastManualSync || lastManualSync < fiveMinutesAgo
  const cooldownRemaining =
    lastManualSync && lastManualSync >= fiveMinutesAgo
      ? Math.ceil((lastManualSync.getTime() + 5 * 60 * 1000 - now.getTime()) / 1000)
      : 0

  const monthsToFetch = Number.parseInt(timeRange)
  const { data: billingHistory } = await supabase
    .from("billing_history")
    .select("*")
    .eq("integration_id", integration.id)
    .order("billing_period", { ascending: false })
    .limit(monthsToFetch)

  let resourceCosts = []

  if (billingHistory && billingHistory.length > 0) {
    const billingIds = billingHistory.map(b => b.id)
    const { data: costs } = await supabase
      .from("resource_costs")
      .select("*")
      .in("billing_history_id", billingIds)
    
    resourceCosts = costs || []
    console.log("[v0] Fetched", resourceCosts.length, "resource costs from database")
  }

  const displayProducts = resourceCosts

  // Get recommendations
  const { data: recommendations } = await supabase
    .from("recommendations")
    .select("*")
    .eq("cloud_account_id", integration.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })

  const { data: syncLogs } = await supabase
    .from("sync_logs")
    .select("*")
    .eq("integration_id", integration.id)
    .order("started_at", { ascending: false })
    .limit(50)

  // Calculate metrics
  const currentMonthCost = billingHistory?.[0]?.total_cost || 0
  const previousMonth = billingHistory?.[1]
  const previousMonthCost = previousMonth?.total_cost || 0
  const costChange = previousMonthCost > 0 ? ((currentMonthCost - previousMonthCost) / previousMonthCost) * 100 : 0

  const totalPotentialSavings = recommendations?.reduce((sum, rec) => sum + (rec.potential_savings || 0), 0) || 0

  const lastSync = integration.last_sync ? new Date(integration.last_sync).toLocaleString() : "Never"

  console.log("[v0] Datadog Dashboard - Rendering with", billingHistory?.length, "billing records and", displayProducts.length, "products")

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      <ClientNav companyName={company?.name} isAdmin={isAdmin} />

      <main className="container mx-auto px-4 py-8">
        {isAdmin && needsTaxInfo && (
          <RegistrationIncompleteBanner 
            isAdmin={isAdmin}
            company={company}
          />
        )}

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Datadog Cost Analytics</h1>
            <p className="text-slate-400">Comprehensive billing analysis and optimization recommendations</p>
            <p className="text-sm text-slate-500 mt-1">Last sync: {lastSync}</p>
          </div>

          <div className="flex gap-3 items-center">
            <TimeRangeSelector currentRange={timeRange} maxMonths={maxAnalysisMonths} />
            <SyncDataButton integrationId={integration.id} canSync={canSync} cooldownRemaining={cooldownRemaining} provider="datadog" />
          </div>
        </div>

        {!canSync && (
          <div className="mb-6 p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg">
            <p className="text-sm text-yellow-400">
              Manual sync is on cooldown. Please wait {Math.floor(cooldownRemaining / 60)} minutes and{" "}
              {cooldownRemaining % 60} seconds before syncing again.
            </p>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-3">
              <CardDescription className="text-slate-400">Current Month Spend</CardDescription>
              <CardTitle className="text-3xl text-white">${currentMonthCost.toFixed(2)}</CardTitle>
            </CardHeader>
            <CardContent>
              {costChange !== 0 && (
                <Badge variant={costChange > 0 ? "destructive" : "default"} className="text-xs">
                  {costChange > 0 ? "+" : ""}
                  {costChange.toFixed(1)}% vs last month
                </Badge>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-3">
              <CardDescription className="text-slate-400">Active Products</CardDescription>
              <CardTitle className="text-3xl text-white">{displayProducts.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-400">Tracked across {billingHistory?.length || 0} months</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-3">
              <CardDescription className="text-slate-400">Potential Savings</CardDescription>
              <CardTitle className="text-3xl text-green-400">${totalPotentialSavings.toFixed(2)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-400">{recommendations?.length || 0} recommendations</p>
            </CardContent>
          </Card>
        </div>

        {/* FinOps Metrics section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">FinOps Key Metrics</h2>
          <FinOpsMetrics billingHistory={billingHistory || []} />
        </div>

        <div className="mb-8">
          <MonthlyAverageChart billingHistory={billingHistory || []} />
        </div>

        {/* Original billing trend chart */}
        <div className="mb-8">
          <DatadogBillingChart billingHistory={billingHistory || []} />
        </div>

        {displayProducts.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <DatadogProductsList resourceCosts={displayProducts} timeRange={timeRange} />
            <TopResourceConsumers resourceCosts={displayProducts} />
          </div>
        ) : (
          <Card className="bg-slate-800/50 border-slate-700 mb-8">
            <CardHeader>
              <CardTitle className="text-white">Product Details</CardTitle>
              <CardDescription className="text-slate-400">
                No detailed product data available yet. Sync your account to fetch product information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-400">
                Product-level cost breakdown will appear here after your first successful sync with Datadog API.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Resource Breakdown and Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <DatadogResourceBreakdown resourceCosts={displayProducts} />
          <DatadogRecommendations 
            integrationId={integration.id} 
            timeRange={Number.parseInt(timeRange)}
          />
        </div>
      </main>

      {/* Sync Logs Dialog */}
      <SyncLogsDialogWrapper logs={syncLogs || []} />
    </div>
  )
}
