"use client"

import { useState } from "react"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"
import { AlertCircle, Loader2 } from 'lucide-react'

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
      const supabase = createClient()

      const { error: insertError } = await supabase.from("cloud_integrations").insert({
        company_id: companyId,
        provider: "datadog",
        provider_name: "Datadog",
        api_key: apiKey,
        config: { app_key: appKey },
        is_active: true,
        is_enabled: true,
      })

      if (insertError) throw insertError

      router.push("/dashboard/datadog")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Failed to connect Datadog")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="text-4xl">🐶</div>
          <div>
            <CardTitle className="text-white text-2xl">Connect Datadog</CardTitle>
            <CardDescription className="text-slate-400 mt-2">
              Enter your Datadog API and Application keys to start monitoring your observability costs
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
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
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
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
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />
            <p className="text-xs text-slate-500">
              Application keys can be created under Organization Settings → Application Keys
            </p>
          </div>

          {error && (
            <Alert className="bg-red-500/10 border-red-500/20 text-red-400">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={loading || !apiKey || !appKey}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Connect Datadog
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
