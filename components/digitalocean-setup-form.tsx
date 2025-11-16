"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"
import { AlertCircle, Loader2 } from "lucide-react"

type DigitalOceanSetupFormProps = {
  companyId: string
}

export function DigitalOceanSetupForm({ companyId }: DigitalOceanSetupFormProps) {
  const router = useRouter()
  const [apiToken, setApiToken] = useState("")
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
        provider: "digitalocean",
        provider_name: "DigitalOcean",
        api_token: apiToken,
        is_active: true,
        is_enabled: true,
      })

      if (insertError) throw insertError

      router.push("/dashboard/integrations")
    } catch (err: any) {
      setError(err.message || "Failed to connect DigitalOcean")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="text-4xl">🌊</div>
          <div>
            <CardTitle className="text-white text-2xl">Connect DigitalOcean</CardTitle>
            <CardDescription className="text-slate-400 mt-2">
              Enter your DigitalOcean API token to start monitoring your infrastructure costs
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="apiToken" className="text-white">
              API Token
            </Label>
            <Input
              id="apiToken"
              type="password"
              placeholder="Enter your DigitalOcean API token"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              required
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />
            <p className="text-xs text-slate-500">
              You can generate an API token from your DigitalOcean account settings under API &gt; Tokens/Keys
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
              disabled={loading || !apiToken}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Connect DigitalOcean
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
