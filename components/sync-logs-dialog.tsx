"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, CheckCircle, XCircle, AlertCircle, Clock } from "lucide-react"

interface SyncLog {
  id: string
  sync_type: string
  status: string
  started_at: string
  completed_at: string | null
  duration_seconds: number | null
  records_synced: number
  errors_count: number
  error_message: string | null
  sync_details: any
}

interface SyncLogsDialogProps {
  logs: SyncLog[]
  isOpen: boolean
  onClose: () => void
}

export function SyncLogsDialog({ logs, isOpen, onClose }: SyncLogsDialogProps) {
  const [selectedLog, setSelectedLog] = useState<SyncLog | null>(null)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case "failed":
        return <XCircle className="w-4 h-4 text-red-400" />
      case "partial":
        return <AlertCircle className="w-4 h-4 text-yellow-400" />
      case "running":
        return <Clock className="w-4 h-4 text-blue-400 animate-spin" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-900/30 text-green-400 border-green-700"
      case "failed":
        return "bg-red-900/30 text-red-400 border-red-700"
      case "partial":
        return "bg-yellow-900/30 text-yellow-400 border-yellow-700"
      case "running":
        return "bg-blue-900/30 text-blue-400 border-blue-700"
      default:
        return "bg-slate-700 text-slate-300"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-xl text-white flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Sync History & Logs
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            View detailed logs of all data synchronization attempts
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[500px]">
          {/* Logs List */}
          <ScrollArea className="h-full pr-4">
            <div className="space-y-2">
              {logs.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No sync logs available</p>
              ) : (
                logs.map((log) => (
                  <button
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedLog?.id === log.id
                        ? "bg-indigo-900/30 border-indigo-600"
                        : "bg-slate-800/50 border-slate-700 hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(log.status)}
                        <Badge variant="outline" className={`text-xs ${getStatusColor(log.status)}`}>
                          {log.status}
                        </Badge>
                      </div>
                      <Badge variant="outline" className="text-xs bg-slate-700/50 text-slate-300 border-slate-600">
                        {log.sync_type}
                      </Badge>
                    </div>

                    <div className="text-sm space-y-1">
                      <p className="text-slate-300">
                        {new Date(log.started_at).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {log.duration_seconds && (
                        <p className="text-slate-500 text-xs">{log.duration_seconds}s duration</p>
                      )}
                      {log.records_synced > 0 && (
                        <p className="text-slate-500 text-xs">{log.records_synced} records synced</p>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Log Details */}
          <ScrollArea className="h-full border-l border-slate-700 pl-4">
            {selectedLog ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-2">Status</h3>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedLog.status)}
                    <Badge variant="outline" className={getStatusColor(selectedLog.status)}>
                      {selectedLog.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-2">Timing</h3>
                  <div className="space-y-1 text-sm text-slate-300">
                    <p>Started: {new Date(selectedLog.started_at).toLocaleString()}</p>
                    {selectedLog.completed_at && (
                      <p>Completed: {new Date(selectedLog.completed_at).toLocaleString()}</p>
                    )}
                    {selectedLog.duration_seconds && <p>Duration: {selectedLog.duration_seconds} seconds</p>}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-2">Statistics</h3>
                  <div className="space-y-1 text-sm text-slate-300">
                    <p>Records Synced: {selectedLog.records_synced}</p>
                    <p>Errors: {selectedLog.errors_count}</p>
                  </div>
                </div>

                {selectedLog.error_message && (
                  <div>
                    <h3 className="text-sm font-medium text-red-400 mb-2">Error Message</h3>
                    <div className="p-3 bg-red-900/20 border border-red-700 rounded text-sm text-red-300">
                      {selectedLog.error_message}
                    </div>
                  </div>
                )}

                {selectedLog.sync_details && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-2">Sync Details</h3>
                    <div className="p-3 bg-slate-800/50 border border-slate-700 rounded">
                      <pre className="text-xs text-slate-300 overflow-auto">
                        {JSON.stringify(selectedLog.sync_details, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">Select a log to view details</div>
            )}
          </ScrollArea>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose} variant="outline" className="bg-slate-800 border-slate-700 hover:bg-slate-700">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
