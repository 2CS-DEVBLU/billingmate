import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUserWithCompany } from "@/lib/auth-utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock, Activity, AlertTriangle } from "lucide-react"

export default async function SyncHealthPage() {
  const { user, profile } = await getUserWithCompany()
  if (!user) redirect("/auth/login")
  if (!profile?.is_admin) redirect("/dashboard")

  const supabase = await createClient()

  // Get sync logs from last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: logs } = await supabase
    .from("sync_logs")
    .select("*, cloud_integrations(provider, provider_name)")
    .gte("started_at", thirtyDaysAgo.toISOString())
    .order("started_at", { ascending: false })
    .limit(100)

  const totalSyncs = logs?.length || 0
  const successSyncs = logs?.filter((l) => l.status === "success").length || 0
  const failedSyncs = logs?.filter((l) => l.status === "failed").length || 0
  const avgDuration = totalSyncs > 0
    ? (logs?.reduce((sum, l) => sum + (l.duration_seconds || 0), 0) || 0) / totalSyncs
    : 0

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Sync Health</h1>
        <p className="text-sm text-slate-500 mt-1">Last 30 days sync performance</p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card className="glass border-white/[0.06]">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <Activity className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{totalSyncs}</p>
              <p className="text-[11px] text-slate-500">Total syncs</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-white/[0.06]">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{successSyncs}</p>
              <p className="text-[11px] text-slate-500">Successful</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-white/[0.06]">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{failedSyncs}</p>
              <p className="text-[11px] text-slate-500">Failed</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-white/[0.06]">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{avgDuration.toFixed(0)}s</p>
              <p className="text-[11px] text-slate-500">Avg duration</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent logs */}
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Recent Sync Logs</h2>
      <div className="space-y-2">
        {logs?.map((log) => (
          <Card key={log.id} className="glass border-white/[0.06]">
            <CardContent className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                {log.status === "success" ? (
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                ) : log.status === "partial" ? (
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-400" />
                )}
                <div>
                  <p className="text-sm text-white">
                    {log.cloud_integrations?.provider_name || "Unknown"} · {log.sync_type}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {new Date(log.started_at).toLocaleString()} · {log.duration_seconds}s · {log.records_synced || 0} records
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {log.errors_count > 0 && (
                  <span className="text-[10px] text-red-400">{log.errors_count} errors</span>
                )}
                <Badge className={`text-[10px] ${
                  log.status === "success" ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30" :
                  log.status === "partial" ? "bg-amber-500/10 text-amber-300 border-amber-500/30" :
                  "bg-red-500/10 text-red-300 border-red-500/30"
                }`}>
                  {log.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
