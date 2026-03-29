"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

interface ExportDialogProps {
  scope?: "billing_history" | "resource_costs" | "anomalies"
}

export function ExportButton({ scope = "billing_history" }: ExportDialogProps) {
  const [exporting, setExporting] = useState(false)
  const [format, setFormat] = useState<"csv" | "json">("csv")
  const [open, setOpen] = useState(false)
  const { t } = useI18n()

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format, scope }),
      })

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `billingmate-${scope}-${new Date().toISOString().split("T")[0]}.${format}`
      a.click()
      URL.revokeObjectURL(url)
      setOpen(false)
    } finally {
      setExporting(false)
    }
  }

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        size="sm"
        className="h-8 text-xs bg-white/5 hover:bg-white/10 text-slate-400 border border-white/10"
      >
        <Download className="h-3 w-3 mr-1.5" />
        {t.common.export}
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={format}
        onChange={(e) => setFormat(e.target.value as "csv" | "json")}
        className="h-8 rounded-md bg-white/[0.03] border border-white/[0.08] text-white text-xs px-2"
      >
        <option value="csv">CSV</option>
        <option value="json">JSON</option>
      </select>
      <Button
        onClick={handleExport}
        disabled={exporting}
        size="sm"
        className="h-8 text-xs bg-indigo-500 hover:bg-indigo-600 text-white"
      >
        {exporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3 mr-1.5" />}
        {exporting ? "..." : t.common.export}
      </Button>
      <Button
        onClick={() => setOpen(false)}
        size="sm"
        className="h-8 text-xs bg-white/5 hover:bg-white/10 text-slate-400 border border-white/10"
      >
        {t.common.cancel}
      </Button>
    </div>
  )
}
