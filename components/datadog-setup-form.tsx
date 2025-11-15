"use client"

import { useState } from "react"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

type DatadogSetupFormProps = {
  companyId: string
}

export function DatadogSetupForm({ companyId }: DatadogSetupFormProps) {
  const router = useRouter()
  const [apiKey, setApiKey] = useState("")
  const [appKey, setAppKey] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/integrations/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: companyId,
          provider: "datadog",
          provider_name: "Datadog",
          api_key: apiKey,
          credentials: { app_key: appKey },
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to connect Datadog")
      }

      router.push("/dashboard/datadog")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Failed to connect Datadog")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white text-2xl">Connect Datadog</CardTitle>
        <CardDescription className="text-slate-400">
          Enter your Datadog API and Application keys to start monitoring your observability costs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="apiKey" className="text-slate-200">
              API Key
            </Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Datadog API key"
              required
              className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
            />
            <p className="text-xs text-slate-500">
              You can generate an API key from your Datadog account under Organization Settings → API Keys
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="appKey" className="text-slate-200">
              Application Key
            </Label>
            <Input
              id="appKey"
              type="password"
              value={appKey}
              onChange={(e) => setAppKey(e.target.value)}
              placeholder="Enter your Datadog application key"
              required
              className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
            />
            <p className="text-xs text-slate-500">
              Application keys can be created under Organization Settings → Application Keys
            </p>
          </div>

          <Button
            type="submit"
            disabled={loading || !apiKey || !appKey}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            {loading ? "Connecting..." : "Connect Datadog"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
