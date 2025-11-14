"use client"

import { useState } from "react"
import { SyncLogsDialog } from "./sync-logs-dialog"
import { Button } from "./ui/button"
import { FileText } from "lucide-react"

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

export function SyncLogsDialogWrapper({ logs }: { logs: SyncLog[] }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        variant="outline"
        className="fixed bottom-6 right-6 bg-indigo-600 hover:bg-indigo-700 border-indigo-500 shadow-lg"
        onClick={() => setIsOpen(true)}
      >
        <FileText className="w-4 h-4 mr-2" />
        View Sync Logs ({logs.length})
      </Button>

      <SyncLogsDialog logs={logs} isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
