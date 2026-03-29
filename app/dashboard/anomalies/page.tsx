import { createClient } from "@/lib/supabase/server"
import { getUserWithCompany } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, TrendingUp, Activity } from "lucide-react"
import { AnomalyActions } from "@/components/anomaly-actions"

const severityConfig: Record<string, { color: string; bg: string }> = {
  critical: { color: "text-red-300", bg: "bg-red-500/10 border-red-500/30" },
  high: { color: "text-orange-300", bg: "bg-orange-500/10 border-orange-500/30" },
  medium: { color: "text-amber-300", bg: "bg-amber-500/10 border-amber-500/30" },
  low: { color: "text-blue-300", bg: "bg-blue-500/10 border-blue-500/30" },
}

export default async function AnomaliesPage() {
  const { user, profile } = await getUserWithCompany()
  if (!user || !profile?.company_id) redirect("/auth/login")

  const supabase = await createClient()

  const { data: anomalies } = await supabase
    .from("cost_anomalies")
    .select("*, cloud_integrations(provider, provider_name)")
    .eq("company_id", profile.company_id)
    .order("detected_at", { ascending: false })
    .limit(50)

  const unresolved = anomalies?.filter((a) => !a.is_resolved) || []
  const resolved = anomalies?.filter((a) => a.is_resolved) || []

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Anomaly Detection</h1>
          <p className="text-sm text-slate-500 mt-1">Cost spikes and unusual patterns</p>
        </div>
        <AnomalyActions />
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card className="glass border-white/[0.06]">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{unresolved.length}</p>
              <p className="text-[11px] text-slate-500">Open anomalies</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-white/[0.06]">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{resolved.length}</p>
              <p className="text-[11px] text-slate-500">Resolved</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-white/[0.06]">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <Activity className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{anomalies?.length || 0}</p>
              <p className="text-[11px] text-slate-500">Total detected</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Anomalies list */}
      {(anomalies?.length || 0) === 0 ? (
        <Card className="glass border-white/[0.06] border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-10 w-10 text-emerald-400 mb-3" />
            <p className="text-sm text-white font-medium">No anomalies detected</p>
            <p className="text-xs text-slate-500 mt-1">Your costs look normal. Run a scan to check again.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {anomalies?.map((anomaly) => {
            const config = severityConfig[anomaly.severity] || severityConfig.low
            return (
              <Card key={anomaly.id} className={`glass border-white/[0.06] ${anomaly.is_resolved ? "opacity-60" : ""}`}>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${anomaly.is_resolved ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                      {anomaly.is_resolved ? (
                        <CheckCircle className="h-5 w-5 text-emerald-400" />
                      ) : (
                        <TrendingUp className="h-5 w-5 text-red-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{anomaly.description}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {anomaly.cloud_integrations?.provider_name || "Unknown"} · {new Date(anomaly.detected_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right mr-2">
                      <p className="text-sm font-bold text-white">${anomaly.actual_cost?.toFixed(2)}</p>
                      <p className="text-[10px] text-slate-500">expected ${anomaly.expected_cost?.toFixed(2)}</p>
                    </div>
                    <Badge className={`text-[10px] ${config.bg} ${config.color}`}>
                      {anomaly.severity}
                    </Badge>
                    {anomaly.is_resolved && (
                      <Badge className="text-[10px] bg-emerald-500/10 text-emerald-300 border-emerald-500/30">resolved</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}
