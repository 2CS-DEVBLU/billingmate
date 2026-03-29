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
import { AlertCircle, Loader2, Info } from "lucide-react"

const AWS_REGIONS = [
  { value: "us-east-1", label: "US East (N. Virginia)" },
  { value: "us-east-2", label: "US East (Ohio)" },
  { value: "us-west-1", label: "US West (N. California)" },
  { value: "us-west-2", label: "US West (Oregon)" },
  { value: "eu-west-1", label: "Europe (Ireland)" },
  { value: "eu-west-2", label: "Europe (London)" },
  { value: "eu-west-3", label: "Europe (Paris)" },
  { value: "eu-central-1", label: "Europe (Frankfurt)" },
  { value: "ap-southeast-1", label: "Asia Pacific (Singapore)" },
  { value: "ap-southeast-2", label: "Asia Pacific (Sydney)" },
  { value: "ap-northeast-1", label: "Asia Pacific (Tokyo)" },
  { value: "ap-south-1", label: "Asia Pacific (Mumbai)" },
  { value: "sa-east-1", label: "South America (São Paulo)" },
  { value: "ca-central-1", label: "Canada (Central)" },
]

type AwsSetupFormProps = {
  companyId: string
}

export function AwsSetupForm({ companyId }: AwsSetupFormProps) {
  const router = useRouter()
  const [accessKeyId, setAccessKeyId] = useState("")
  const [secretAccessKey, setSecretAccessKey] = useState("")
  const [region, setRegion] = useState("us-east-1")
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
        provider: "aws",
        provider_name: "Amazon Web Services",
        api_key: accessKeyId,
        config: { secret_access_key: secretAccessKey, region },
        is_active: true,
        is_enabled: true,
      })

      if (insertError) throw insertError

      router.push("/dashboard/aws")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Failed to connect AWS")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="text-4xl">☁️</div>
          <div>
            <CardTitle className="text-white text-2xl">Connect Amazon Web Services</CardTitle>
            <CardDescription className="text-slate-400 mt-2">
              Enter your AWS credentials to start monitoring your cloud costs
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6 bg-blue-500/10 border-blue-500/20">
          <Info className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-blue-300 text-sm space-y-2">
            <p className="font-semibold">Required IAM Permissions:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li><strong>ce:GetCostAndUsage</strong> - Access cost and usage data</li>
              <li><strong>ce:GetCostForecast</strong> - Access cost forecasts</li>
              <li><strong>ce:GetTags</strong> - Access cost allocation tags</li>
            </ul>
            <p className="text-xs text-blue-400 mt-2">
              Create a dedicated IAM user with read-only Cost Explorer access. Never use your root account credentials.
            </p>
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="accessKeyId" className="text-slate-200">
              Access Key ID <span className="text-red-400">*</span>
            </Label>
            <Input
              id="accessKeyId"
              type="text"
              value={accessKeyId}
              onChange={(e) => setAccessKeyId(e.target.value)}
              placeholder="AKIAIOSFODNN7EXAMPLE"
              required
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="secretAccessKey" className="text-slate-200">
              Secret Access Key <span className="text-red-400">*</span>
            </Label>
            <Input
              id="secretAccessKey"
              type="password"
              value={secretAccessKey}
              onChange={(e) => setSecretAccessKey(e.target.value)}
              placeholder="Enter your AWS secret access key"
              required
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="region" className="text-slate-200">
              Region <span className="text-red-400">*</span>
            </Label>
            <select
              id="region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full rounded-md bg-slate-800 border border-slate-700 text-white px-3 py-2 text-sm"
            >
              {AWS_REGIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label} ({r.value})
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500">
              Select your primary AWS region. Cost Explorer data is global, but this sets the API endpoint region.
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
              disabled={loading || !accessKeyId || !secretAccessKey}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Connect AWS
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
