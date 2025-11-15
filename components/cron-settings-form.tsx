"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, PlayCircle, CheckCircle, AlertCircle, Copy, ExternalLink } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"

export function CronSettingsForm() {
  const [cronSecret, setCronSecret] = useState("")
  const [isTestingCron, setIsTestingCron] = useState(false)
  const [lastSyncResult, setLastSyncResult] = useState<any>(null)
  const { toast } = useToast()

  const cronUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://your-app.vercel.app'}/api/cron/daily-sync`

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: "The URL has been copied to your clipboard.",
    })
  }

  const testCronJob = async () => {
    setIsTestingCron(true)
    try {
      const response = await fetch("/api/cron/daily-sync", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${cronSecret}`,
        },
      })

      const data = await response.json()
      setLastSyncResult(data)

      if (response.ok) {
        toast({
          title: "Cron job executed successfully",
          description: `Synced ${data.synced || 0} integration(s).`,
        })
      } else {
        toast({
          title: "Cron job failed",
          description: data.error || "Unknown error occurred",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error testing cron job",
        description: error instanceof Error ? error.message : "Failed to execute cron job",
        variant: "destructive",
      })
    } finally {
      setIsTestingCron(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="cronUrl" className="text-slate-300">
            Cron Endpoint URL
          </Label>
          <div className="flex gap-2">
            <Input
              id="cronUrl"
              value={cronUrl}
              readOnly
              className="font-mono text-sm bg-slate-950 border-slate-700 text-slate-300"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(cronUrl)}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-slate-500">
            Use this URL in your cron service (Vercel Cron, GitHub Actions, etc.)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cronSecret" className="text-slate-300">
            Cron Secret (Authorization Bearer Token)
          </Label>
          <div className="flex gap-2">
            <Input
              id="cronSecret"
              type="password"
              value={cronSecret}
              onChange={(e) => setCronSecret(e.target.value)}
              placeholder="Enter CRON_SECRET value for testing"
              className="font-mono text-sm bg-slate-950 border-slate-700 text-slate-300"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(cronSecret)}
              disabled={!cronSecret}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-slate-500">
            Enter the CRON_SECRET from your environment variables to test the endpoint. The actual secret is stored securely on the server.
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={testCronJob}
          disabled={isTestingCron || !cronSecret}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <PlayCircle className="h-4 w-4 mr-2" />
          {isTestingCron ? "Testing..." : "Test Cron Job"}
        </Button>
        <Button
          variant="outline"
          asChild
          className="border-slate-700 text-slate-300 hover:bg-slate-800"
        >
          <a href="https://vercel.com/docs/cron-jobs" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Vercel Cron Docs
          </a>
        </Button>
      </div>

      {lastSyncResult && (
        <Card className="border-slate-800 bg-slate-950">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {lastSyncResult.success ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <h3 className="font-semibold text-white">Last Sync: Successful</h3>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-red-400" />
                    <h3 className="font-semibold text-white">Last Sync: Failed</h3>
                  </>
                )}
              </div>

              {lastSyncResult.message && (
                <p className="text-sm text-slate-400">{lastSyncResult.message}</p>
              )}

              {lastSyncResult.results && lastSyncResult.results.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-slate-300">Results:</h4>
                  <div className="space-y-2">
                    {lastSyncResult.results.map((result: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800"
                      >
                        <div className="flex items-center gap-3">
                          <Clock className="h-4 w-4 text-slate-500" />
                          <div>
                            <p className="text-sm font-medium text-white">{result.provider}</p>
                            <p className="text-xs text-slate-500">
                              Integration ID: {result.integration_id}
                            </p>
                          </div>
                        </div>
                        <Badge
                          className={
                            result.status === "success"
                              ? "bg-green-900/30 border-green-700 text-green-400"
                              : "bg-red-900/30 border-red-700 text-red-400"
                          }
                        >
                          {result.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-slate-800 bg-slate-950">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-indigo-400" />
              Recommended Cron Schedule
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <Badge className="bg-indigo-900/30 border-indigo-700 text-indigo-400 font-mono">
                  0 0 * * *
                </Badge>
                <p className="text-slate-400">Daily at midnight (recommended for billing data)</p>
              </div>
              <div className="flex items-start gap-2">
                <Badge className="bg-indigo-900/30 border-indigo-700 text-indigo-400 font-mono">
                  0 */6 * * *
                </Badge>
                <p className="text-slate-400">Every 6 hours (for more frequent updates)</p>
              </div>
              <div className="flex items-start gap-2">
                <Badge className="bg-indigo-900/30 border-indigo-700 text-indigo-400 font-mono">
                  0 */12 * * *
                </Badge>
                <p className="text-slate-400">Every 12 hours (balanced approach)</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
