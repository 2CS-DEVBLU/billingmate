import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, AlertTriangle, Info } from "lucide-react"

interface Alert {
  id: string
  alert_type: string
  severity: string
  title: string
  message: string
  is_read: boolean
  created_at: string
  companies: {
    name: string
  } | null
}

interface RecentAlertsTableProps {
  alerts: Alert[]
}

export function RecentAlertsTable({ alerts }: RecentAlertsTableProps) {
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

  return (
    <div className="rounded-md border border-slate-800">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-800 hover:bg-slate-800/50">
            <TableHead className="text-slate-300 w-12"></TableHead>
            <TableHead className="text-slate-300">Company</TableHead>
            <TableHead className="text-slate-300">Alert</TableHead>
            <TableHead className="text-slate-300">Severity</TableHead>
            <TableHead className="text-slate-300">Time</TableHead>
            <TableHead className="text-slate-300">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alerts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                No alerts found
              </TableCell>
            </TableRow>
          ) : (
            alerts.map((alert) => (
              <TableRow key={alert.id} className="border-slate-800 hover:bg-slate-800/50">
                <TableCell>{getSeverityIcon(alert.severity)}</TableCell>
                <TableCell className="font-medium text-white">{alert.companies?.name || "Unknown"}</TableCell>
                <TableCell className="text-slate-300">
                  <div>
                    <div className="font-medium">{alert.title}</div>
                    <div className="text-sm text-slate-500 line-clamp-1">{alert.message}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getSeverityBadge(alert.severity)}>
                    {alert.severity}
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-300 text-sm">{new Date(alert.created_at).toLocaleString()}</TableCell>
                <TableCell>
                  {alert.is_read ? (
                    <Badge variant="outline" className="border-slate-700 text-slate-400">
                      Read
                    </Badge>
                  ) : (
                    <Badge className="bg-indigo-900/50 text-indigo-300 border-indigo-800">New</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
