import { redirect } from 'next/navigation'
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DollarSign, TrendingDown, Server, Cloud, ExternalLink, BadgeIcon } from 'lucide-react'
import { ClientNav } from "@/components/client-nav"
import { getUserWithCompany } from "@/lib/auth-utils"
import { RegistrationIncompleteBanner } from "@/components/registration-incomplete-banner"
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const AVAILABLE_PROVIDERS = [
  {
    id: "digitalocean",
    name: "DigitalOcean",
    description: "Monitor your DigitalOcean droplets, databases, and services",
    logo: "🌊",
  },
  {
    id: "aws",
    name: "Amazon Web Services",
    description: "Track costs across EC2, S3, RDS, and other AWS services",
    logo: "☁️",
    comingSoon: true,
  },
  {
    id: "azure",
    name: "Microsoft Azure",
    description: "Monitor Azure compute, storage, and database costs",
    logo: "🔷",
    comingSoon: true,
  },
]

export default async function ClientDashboard() {
  const supabase = await createClient()

  console.log("[v0] Dashboard - Loading")

  const { user, profile, company, isAdmin } = await getUserWithCompany()

  console.log("[v0] Dashboard - User:", user?.email || "none")

  if (!user) {
    redirect("/auth/login")
  }

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

  const needsTaxInfo = !company?.cnpj_cpf && !company?.vat_number

  const { data: integrations } = await supabase
    .from("cloud_integrations")
    .select("*")
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false })

  const activeIntegrations = integrations?.filter((i) => i.is_active) || []

  // Fetch all billing history for the company (last 3 months)
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  let totalCurrentMonthCost = 0
  let totalPreviousMonthCost = 0
  let totalResourceCount = 0
  let integrationStats: Array<{ provider: string; cost: number; resources: number }> = []

  for (const integration of activeIntegrations) {
    const { data: billingHistory } = await supabase
      .from("billing_history")
      .select("*")
      .eq("integration_id", integration.id)
      .gte("billing_period", threeMonthsAgo.toISOString().split('T')[0])
      .order("billing_period", { ascending: false })
      .limit(3)

    if (billingHistory && billingHistory.length > 0) {
      const currentMonth = billingHistory[0]
      const previousMonth = billingHistory[1]

      totalCurrentMonthCost += currentMonth?.total_cost || 0
      totalPreviousMonthCost += previousMonth?.total_cost || 0

      // Count resources for this integration
      const { data: resources } = await supabase
        .from("resource_costs")
        .select("id")
        .in("billing_history_id", billingHistory.map(b => b.id))

      const resourceCount = resources?.length || 0
      totalResourceCount += resourceCount

      integrationStats.push({
        provider: integration.provider,
        cost: currentMonth?.total_cost || 0,
        resources: resourceCount
      })
    }
  }

  const costChange = totalPreviousMonthCost > 0 
    ? ((totalCurrentMonthCost - totalPreviousMonthCost) / totalPreviousMonthCost) * 100 
    : 0

  console.log("[v0] Dashboard - Total costs:", { current: totalCurrentMonthCost, previous: totalPreviousMonthCost, change: costChange })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
      <ClientNav companyName={company?.name} isAdmin={isAdmin} />

      <main className="container mx-auto px-4 py-8">
        {isAdmin && needsTaxInfo && (
          <RegistrationIncompleteBanner 
            isAdmin={isAdmin}
            company={company}
          />
        )}

        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-slate-400 mt-2">Welcome back, {profile.full_name || "User"}</p>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Select a Provider
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {AVAILABLE_PROVIDERS.map((provider) => {
              const integration = activeIntegrations.find((i) => i.provider === provider.id)
              const isConnected = !!integration

              return (
                <Card
                  key={provider.id}
                  className={`border-slate-800 bg-slate-900/50 backdrop-blur ${provider.comingSoon ? "opacity-60" : ""}`}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-4xl">{provider.logo}</div>
                      <div>
                        <CardTitle className="text-white flex items-center gap-2">
                          {provider.name}
                          {provider.comingSoon && (
                            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                              Coming Soon
                            </Badge>
                          )}
                          {isConnected && (
                            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                              Connected
                            </Badge>
                          )}
                        </CardTitle>
                      </div>
                    </div>
                    <CardDescription className="text-slate-400">{provider.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {provider.comingSoon ? (
                      <Button disabled className="w-full bg-slate-800/50 text-slate-500 cursor-not-allowed">
                        Under Development
                      </Button>
                    ) : isConnected ? (
                      <Link href={`/dashboard/${provider.id}`}>
                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Dashboard
                        </Button>
                      </Link>
                    ) : (
                      <Link href="/dashboard/integrations">
                        <Button className="w-full bg-slate-700 hover:bg-slate-600 text-white">
                          Connect Provider
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Current Month Spend</CardTitle>
              <DollarSign className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">${totalCurrentMonthCost.toFixed(2)}</div>
              {costChange !== 0 && (
                <div className="flex items-center gap-1 mt-2">
                  {costChange > 0 ? (
                    <TrendingUp className="h-4 w-4 text-red-400" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-green-400" />
                  )}
                  <span className={`text-xs ${costChange > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {costChange > 0 ? '+' : ''}{costChange.toFixed(1)}% vs last month
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Active Resources</CardTitle>
              <Database className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{totalResourceCount}</div>
              <p className="text-xs text-slate-500 mt-1">Tracked resources</p>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Integrations</CardTitle>
              <Server className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{activeIntegrations.length}</div>
              <p className="text-xs text-slate-500 mt-1">Active connections</p>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Previous Month</CardTitle>
              <DollarSign className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-400">${totalPreviousMonthCost.toFixed(2)}</div>
              <p className="text-xs text-slate-500 mt-1">Last month spend</p>
            </CardContent>
          </Card>
        </div>

        {activeIntegrations.length > 0 ? (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">Provider Breakdown</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {integrationStats.map((stat) => (
                  <Card key={stat.provider} className="border-slate-800 bg-slate-900/50 backdrop-blur">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg text-white capitalize">{stat.provider}</CardTitle>
                        <Badge variant="outline" className="text-xs">
                          {stat.resources} resources
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-white mb-3">${stat.cost.toFixed(2)}</div>
                      <Link href={`/dashboard/${stat.provider}`}>
                        <Button variant="outline" size="sm" className="w-full">
                          View Details
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {needsTaxInfo && (
              <Card className="border-yellow-700 bg-yellow-900/20 backdrop-blur mb-6">
                <CardHeader>
                  <CardTitle className="text-yellow-400 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Complete Registration Required
                  </CardTitle>
                  <CardDescription className="text-yellow-200/80">
                    {isAdmin ? (
                      "Complete your company registration to access all features and AI-powered recommendations."
                    ) : (
                      "Your administrator needs to complete the company registration to unlock all features."
                    )}
                  </CardDescription>
                </CardHeader>
                {isAdmin && (
                  <CardContent>
                    <Link href="/dashboard/settings">
                      <Button className="bg-yellow-600 hover:bg-yellow-700">
                        Complete Registration
                      </Button>
                    </Link>
                  </CardContent>
                )}
              </Card>
            )}
          </>
        ) : (
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Get Started</CardTitle>
              <CardDescription className="text-slate-400">
                Connect your cloud provider to start tracking costs and optimizing spending
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/integrations">
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  Connect Provider
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
