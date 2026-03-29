"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, TrendingDown, Loader2, Sparkles, Lock } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

interface Recommendation {
  title: string
  description: string
  potential_savings: number
  priority: string
  category: string
}

const priorityColors: Record<string, string> = {
  high: "bg-red-600/20 text-red-300 border-red-500/50",
  medium: "bg-yellow-600/20 text-yellow-300 border-yellow-500/50",
  low: "bg-blue-600/20 text-blue-300 border-blue-500/50",
}

const categoryIcons: Record<string, string> = {
  cost: "💰",
  performance: "⚡",
  security: "🔒",
  reliability: "🛡️",
}

export function AwsRecommendations({
  integrationId,
  timeRange,
}: {
  integrationId: string
  timeRange: number
}) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [upgradeRequired, setUpgradeRequired] = useState(false)

  const fetchRecommendations = async () => {
    setLoading(true)
    setError(null)
    setUpgradeRequired(false)

    try {
      const response = await fetch("/api/aws/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ integrationId, timeRange }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate recommendations")
      }

      const data = await response.json()
      setRecommendations(data.recommendations || [])
      if (data.upgradeRequired) {
        setUpgradeRequired(true)
        setError(data.message || "AI recommendations require a paid plan")
      }
    } catch (err) {
      setError("Failed to generate recommendations. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecommendations()
  }, [integrationId, timeRange])

  if (upgradeRequired) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-yellow-400" />
            <CardTitle className="text-white">AI Cost Optimization</CardTitle>
            <Badge className="bg-yellow-600/20 text-yellow-300 border-yellow-500/50">Pro Feature</Badge>
          </div>
          <CardDescription className="text-slate-400">
            Upgrade to unlock AI-powered recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8">
            <Sparkles className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
            <p className="text-slate-300 font-medium mb-2">AI Recommendations Unavailable</p>
            <p className="text-slate-400 text-sm mb-4">
              {error || "AI recommendations are not available on your current plan."}
            </p>
            <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
              <a href="/dashboard/billing">Upgrade Plan</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-green-400" />
            <CardTitle className="text-white">AI Cost Optimization</CardTitle>
          </div>
          <Button
            onClick={fetchRecommendations}
            disabled={loading}
            size="sm"
            variant="outline"
            className="border-orange-500 text-orange-300 hover:bg-orange-500/20"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span className="ml-2">{loading ? "Analyzing..." : "Refresh"}</span>
          </Button>
        </div>
        <CardDescription className="text-slate-400">
          AI-powered recommendations based on your last 3 months AWS usage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && recommendations.length === 0 && (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 text-orange-400 mx-auto mb-3 animate-spin" />
            <p className="text-slate-300 font-medium mb-1">Analyzing your AWS spending...</p>
            <p className="text-slate-400 text-sm">AI is reviewing your usage patterns to find optimization opportunities</p>
          </div>
        )}

        {error && !upgradeRequired && (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p className="text-red-300 font-medium mb-1">Error</p>
            <p className="text-slate-400 text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && recommendations.map((rec, index) => (
          <div key={index} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-start gap-3 flex-1">
                <span className="text-2xl">{categoryIcons[rec.category] || "💡"}</span>
                <div className="flex-1">
                  <h3 className="text-white font-medium mb-1">{rec.title}</h3>
                  <p className="text-sm text-slate-400 mb-3">{rec.description}</p>

                  <div className="flex items-center gap-3">
                    <Badge className={priorityColors[rec.priority] || ""}>{rec.priority} priority</Badge>
                    <Badge className="bg-emerald-600/20 text-emerald-300 border-emerald-500/50">
                      {rec.category}
                    </Badge>
                    {rec.potential_savings > 0 && (
                      <span className="text-sm text-green-400 font-medium">
                        Save ${rec.potential_savings.toFixed(2)}/mo
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {!loading && !error && recommendations.length === 0 && (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <p className="text-slate-300 font-medium mb-1">All optimized!</p>
            <p className="text-slate-400 text-sm">Your AWS spending is well-optimized. Keep monitoring for changes.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
