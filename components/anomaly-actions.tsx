"use client"

import { Button } from "@/components/ui/button"
import { Loader2, Scan } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function AnomalyActions() {
  const [scanning, setScanning] = useState(false)
  const router = useRouter()

  const handleScan = async () => {
    setScanning(true)
    await fetch("/api/anomalies/scan", { method: "POST" })
    setScanning(false)
    router.refresh()
  }

  return (
    <Button
      onClick={handleScan}
      disabled={scanning}
      className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white"
    >
      {scanning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Scan className="h-4 w-4 mr-2" />}
      {scanning ? "Scanning..." : "Run Scan"}
    </Button>
  )
}
