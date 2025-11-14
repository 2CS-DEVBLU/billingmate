import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ClientNav } from "@/components/client-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Cloud, Plus, Settings, ExternalLink, Activity } from "lucide-react"
import Link from "next/link"

const AVAILABLE_PROVIDERS = [
  {
    id: "digitalocean",
    name: "DigitalOcean",
    description: "Monitor your DigitalOcean droplets, databases, and services",
    logo: "🌊",
    enabled: true,
    comingSoon: false,
  },
  {
    id: "aws",
    name: "Amazon Web Services",
    description: "Track costs across EC2, S3, RDS, and other AWS services",
    logo: "☁️",
    enabled: false,
    comingSoon: true,
  },
  {
    id: "azure",
    name: "Microsoft Azure",
    description: "Monitor Azure compute, storage, and database costs",
    logo: "🔷",
    enabled: false,
    comingSoon: true,
  },
  {
    id: "datadog",
    name: "Datadog",
    description: "Track your monitoring and observability costs",
    logo: "🐕",
    enabled: false,
    comingSoon: true,
  },
]

export default async function IntegrationsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, companies!profiles_company_id_fkey(*)")
    .eq("id", user.id)
    .single()

  if (!profile || !profile.company_id) {
    redirect("/auth/login")
  }

  const { data: integrations } = await supabase
    .from("cloud_integrations")
    .select("*")
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false })

  const integrationsMap = new Map(integrations?.map((i) => [i.provider, i]) || [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
      <ClientNav companyName={profile.companies?.name} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Cloud className="h-8 w-8" />
            Cloud Integrations
          </h1>
          <p className="text-slate-400 mt-2">
            Select an integration to view its dashboard or configure new provider accounts
          </p>
        </div>

        {integrations && integrations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Your Connected Integrations
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {integrations
                .filter((i) => i.is_active)
                .map((integration) => {
                  const provider = AVAILABLE_PROVIDERS.find((p) => p.id === integration.provider)
                  if (!provider) return null

                  return (
                    <Card key={integration.id} className="border-slate-800 bg-slate-900/50 backdrop-blur">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">{provider.logo}</div>
                          <div className="flex-1">
                            <CardTitle className="text-white text-lg">{provider.name}</CardTitle>
                            <p className="text-xs text-slate-400 mt-1">
                              {integration.last_sync
                                ? `Synced ${new Date(integration.last_sync).toLocaleDateString()}`
                                : "Not synced yet"}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <Link href={`/dashboard/${provider.id}`}>
                          <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Dashboard
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  )
                })}
            </div>
          </div>
        )}

        <h2 className="text-xl font-semibold text-white mb-4">
          {integrations && integrations.length > 0 ? "Add More Providers" : "Available Providers"}
        </h2>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {AVAILABLE_PROVIDERS.map((provider) => {
            const integration = integrationsMap.get(provider.id)
            const isConnected = !!integration

            return (
              <Card
                key={provider.id}
                className={`border-slate-800 bg-slate-900/50 backdrop-blur ${!provider.enabled ? "opacity-60" : ""}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-4xl">{provider.logo}</div>
                      <div>
                        <CardTitle className="text-white flex items-center gap-2">
                          {provider.name}
                          {provider.comingSoon && (
                            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                              Coming Soon
                            </Badge>
                          )}
                          {isConnected && provider.enabled && (
                            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                              Connected
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="text-slate-400 mt-1">{provider.description}</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {provider.enabled ? (
                    isConnected ? (
                      <div className="space-y-3">
                        <div className="text-sm text-slate-400">
                          <p>
                            Status:{" "}
                            <span className={integration.is_active ? "text-green-400" : "text-red-400"}>
                              {integration.is_active ? "Active" : "Inactive"}
                            </span>
                          </p>
                          {integration.last_sync && (
                            <p className="mt-1">
                              Last sync:{" "}
                              <span className="text-white">{new Date(integration.last_sync).toLocaleString()}</span>
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Link href={`/dashboard/integrations/${provider.id}`} className="flex-1">
                            <Button
                              variant="outline"
                              className="w-full bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                            >
                              <Settings className="h-4 w-4 mr-2" />
                              Configure
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <Link href={`/dashboard/integrations/${provider.id}/setup`}>
                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                          <Plus className="h-4 w-4 mr-2" />
                          Connect {provider.name}
                        </Button>
                      </Link>
                    )
                  ) : (
                    <Button disabled className="w-full bg-slate-800/50 text-slate-500 cursor-not-allowed">
                      Under Development
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </main>
    </div>
  )
}
