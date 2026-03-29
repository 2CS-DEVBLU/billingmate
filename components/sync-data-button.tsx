"use client"

import { Button } from "./ui/button"
import { RefreshCw } from 'lucide-react'
import { useState, useTransition } from "react"
import { useRouter } from 'next/navigation'

export function SyncDataButton({
  integrationId,
  canSync,
  cooldownRemaining,
  provider = "digitalocean", // Added provider prop with default value
}: {
  integrationId: string
  canSync: boolean
  cooldownRemaining: number
  provider?: "digitalocean" | "datadog" | "aws"
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isSyncing, setIsSyncing] = useState(false)

  const handleSync = async () => {
    if (!canSync || isSyncing) return

    setIsSyncing(true)

    try {
      const response = await fetch(`/api/${provider}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ integrationId, syncType: "manual" }),
      })

      if (response.ok) {
        startTransition(() => {
          router.refresh()
        })
      }
    } catch (error) {
      console.error("[v0] Sync error:", error)
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <Button
      variant="outline"
      className="bg-indigo-600 hover:bg-indigo-700 border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={!canSync || isSyncing || isPending}
      onClick={handleSync}
    >
      <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing || isPending ? "animate-spin" : ""}`} />
      {isSyncing || isPending
        ? "Syncing..."
        : canSync
          ? "Sync Data"
          : `Wait ${Math.floor(cooldownRemaining / 60)}:${(cooldownRemaining % 60).toString().padStart(2, "0")}`}
    </Button>
  )
}
