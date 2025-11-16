"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, AlertTriangle, Info, Check } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface Alert {
  id: string
  alert_type: string
  severity: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

interface AlertsCardProps {
  alerts: Alert[]
  companyId: string
}

export function AlertsCard({ alerts, companyId }: AlertsCardProps) {
  const router = useRouter()

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertCircle className="h-4 w-4 text-red-400" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />
      default:
        return <Info className="h-4 w-4 text-blue-400" />
    }
  }

  const getSeverityBadge = (severity: string) => {
    const colors = {
      critical: "bg-red-900/50 text-red-300 border-red-800",
      warning: "bg-yellow-900/50 text-yellow-300 border-yellow-800",
      info: "bg-blue-900/50 text-blue-300 border-blue-800",
    }
    return colors[severity as keyof typeof colors] || colors.info
  }

  const handleMarkRead = async (id: string) => {
    const supabase = createClient()
    await supabase.from("alerts").update({ is_read: true }).eq("id", id)
    router.refresh()
  }

  return (
    <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-white">Recent Alerts</CardTitle>
        <CardDescription className="text-slate-400">Important notifications about your cloud spending</CardDescription>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Info className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No alerts at this time</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start gap-3 p-4 rounded-lg border border-slate-800 bg-slate-950/50"
              >
                <div className="mt-0.5">{getSeverityIcon(alert.severity)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-white text-sm">{alert.title}</h4>
                    <Badge variant="outline" className={getSeverityBadge(alert.severity)}>
                      {alert.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-400 mb-2">{alert.message}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">{new Date(alert.created_at).toLocaleString()}</span>
                    {!alert.is_read && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMarkRead(alert.id)}
                        className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/30 h-7"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Mark Read
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
