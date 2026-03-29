import { redirect } from 'next/navigation'
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DollarSign, TrendingDown, TrendingUp, Server, Cloud, ExternalLink, Database, ArrowUpRight, ArrowDownRight, Zap } from 'lucide-react'
import { getUserWithCompany } from "@/lib/auth-utils"
import { RegistrationIncompleteBanner } from "@/components/registration-incomplete-banner"
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UnifiedRecommendations } from "@/components/unified-recommendations"

const PROVIDERS = [
  { id: "digitalocean", name: "DigitalOcean", icon: "DO", color: "from-blue-500 to-cyan-500", description: "Droplets, databases & services" },
  { id: "datadog", name: "Datadog", icon: "DD", color: "from-violet-500 to-purple-600", description: "Monitoring & observability" },
  { id: "aws", name: "AWS", icon: "AWS", color: "from-orange-500 to-amber-500", description: "EC2, S3, RDS & more" },
  { id: "azure", name: "Azure", icon: "AZ", color: "from-sky-500 to-blue-600", description: "Compute, storage & databases", comingSoon: true },
]

export default async function ClientDashboard() {
  const supabase = await createClient()
  const { user, profile, company, isAdmin } = await getUserWithCompany()

  if (!user) redirect("/auth/login")
  if (!profile) redirect("/auth/login")

  if (!profile.company_id) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="glass max-w-md">
          <CardHeader>
            <CardTitle className="text-white">No Company Assigned</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-400">Your account is not associated with a company yet. Please contact your administrator.</p>
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
      totalCurrentMonthCost += billingHistory[0]?.total_cost || 0
      totalPreviousMonthCost += billingHistory[1]?.total_cost || 0

      const { data: resources } = await supabase
        .from("resource_costs")
        .select("id")
        .in("billing_history_id", billingHistory.map(b => b.id))

      const resourceCount = resources?.length || 0
      totalResourceCount += resourceCount
      integrationStats.push({
        provider: integration.provider,
        cost: billingHistory[0]?.total_cost || 0,
        resources: resourceCount,
      })
    }
  }

  const costChange = totalPreviousMonthCost > 0
    ? ((totalCurrentMonthCost - totalPreviousMonthCost) / totalPreviousMonthCost) * 100
    : 0

  return (
    <>
      {isAdmin && needsTaxInfo && (
        <RegistrationIncompleteBanner isAdmin={isAdmin} company={company} />
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Welcome back, <span className="gradient-text">{profile.full_name || "User"}</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">Here's your cloud cost overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="glass border-white/[0.06] overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">Current Month</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-indigo-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${totalCurrentMonthCost.toFixed(2)}</div>
            {costChange !== 0 && (
              <div className="flex items-center gap-1 mt-2">
                {costChange > 0 ? (
                  <div className="flex items-center gap-1 text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                    <ArrowUpRight className="h-3 w-3" />
                    +{costChange.toFixed(1)}%
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <ArrowDownRight className="h-3 w-3" />
                    {costChange.toFixed(1)}%
                  </div>
                )}
                <span className="text-[10px] text-slate-600">vs last month</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass border-white/[0.06] overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">Resources</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Database className="h-4 w-4 text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalResourceCount}</div>
            <p className="text-[10px] text-slate-600 mt-2">Tracked across all providers</p>
          </CardContent>
        </Card>

        <Card className="glass border-white/[0.06] overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">Integrations</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <Zap className="h-4 w-4 text-violet-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{activeIntegrations.length}</div>
            <p className="text-[10px] text-slate-600 mt-2">Active connections</p>
          </CardContent>
        </Card>

        <Card className="glass border-white/[0.06] overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">Previous Month</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-slate-500/10 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-slate-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-400">${totalPreviousMonthCost.toFixed(2)}</div>
            <p className="text-[10px] text-slate-600 mt-2">Last month total</p>
          </CardContent>
        </Card>
      </div>

      {/* Providers */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Cloud Providers</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {PROVIDERS.map((provider) => {
            const integration = activeIntegrations.find((i) => i.provider === provider.id)
            const isConnected = !!integration
            const stat = integrationStats.find((s) => s.provider === provider.id)

            return (
              <div
                key={provider.id}
                className={`glass border-white/[0.06] rounded-xl p-4 transition-all duration-300 ${
                  provider.comingSoon ? "opacity-40" : "hover:border-white/[0.12] glass-hover"
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${provider.color} flex items-center justify-center shadow-lg`}>
                    <span className="text-[10px] font-bold text-white">{provider.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{provider.name}</span>
                      {isConnected && (
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                      )}
                      {provider.comingSoon && (
                        <Badge className="text-[9px] bg-white/5 text-slate-500 border-white/10 px-1.5 py-0">Soon</Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">{provider.description}</p>
                  </div>
                </div>

                {isConnected && stat ? (
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-white">${stat.cost.toFixed(2)}</span>
                    <Link href={`/dashboard/${provider.id}`}>
                      <Button size="sm" className="h-7 text-xs bg-white/5 hover:bg-white/10 text-white border border-white/10">
                        View
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                ) : provider.comingSoon ? (
                  <div className="text-xs text-slate-600">Under development</div>
                ) : (
                  <Link href="/dashboard/integrations">
                    <Button size="sm" className="w-full h-7 text-xs bg-gradient-to-r from-indigo-500/20 to-violet-500/20 hover:from-indigo-500/30 hover:to-violet-500/30 text-indigo-300 border border-indigo-500/20">
                      Connect
                    </Button>
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* AI Recommendations + Provider Breakdown */}
      {integrationStats.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-[1fr_380px] mb-8">
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Cost Breakdown</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {integrationStats.map((stat) => {
              const provider = PROVIDERS.find((p) => p.id === stat.provider)
              return (
                <Card key={stat.provider} className="glass border-white/[0.06]">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-6 w-6 rounded bg-gradient-to-br ${provider?.color || 'from-slate-500 to-slate-600'} flex items-center justify-center`}>
                          <span className="text-[8px] font-bold text-white">{provider?.icon}</span>
                        </div>
                        <CardTitle className="text-sm text-white">{provider?.name || stat.provider}</CardTitle>
                      </div>
                      <Badge className="text-[10px] bg-white/5 border-white/10 text-slate-400">
                        {stat.resources} resources
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold text-white mb-3">${stat.cost.toFixed(2)}</div>
                    <Link href={`/dashboard/${stat.provider}`}>
                      <Button variant="outline" size="sm" className="w-full h-8 text-xs border-white/10 text-slate-400 hover:text-white hover:bg-white/5">
                        View Details
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">AI Insights</h2>
          <UnifiedRecommendations />
        </div>
        </div>
      )}

      {activeIntegrations.length === 0 && (
        <Card className="glass border-white/[0.06] border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4">
              <Cloud className="h-6 w-6 text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Get Started</h3>
            <p className="text-sm text-slate-500 mb-4 text-center max-w-sm">
              Connect your first cloud provider to start tracking costs and optimizing spending
            </p>
            <Link href="/dashboard/integrations">
              <Button className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white shadow-lg shadow-indigo-500/20">
                Connect Provider
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </>
  )
}
