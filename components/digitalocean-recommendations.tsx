"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, TrendingDown, Loader2, Sparkles } from 'lucide-react'
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

export function DigitalOceanRecommendations({ 
  integrationId, 
  timeRange 
}: { 
  integrationId: string
  timeRange: number
}) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRecommendations = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log("[v0] Fetching AI recommendations for integration:", integrationId)
      
      const response = await fetch("/api/digitalocean/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ integrationId, timeRange }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate recommendations")
      }

      const data = await response.json()
      console.log("[v0] Received", data.recommendations?.length, "AI recommendations")
      setRecommendations(data.recommendations || [])
    } catch (err) {
      console.error("[v0] Error fetching recommendations:", err)
      setError("Failed to generate recommendations. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecommendations()
  }, [integrationId, timeRange])

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
            className="border-indigo-500 text-indigo-300 hover:bg-indigo-500/20"
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
          AI-powered recommendations based on your usage patterns
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && recommendations.length === 0 && (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 text-indigo-400 mx-auto mb-3 animate-spin" />
            <p className="text-slate-300 font-medium mb-1">Analyzing your cloud spending...</p>
            <p className="text-slate-400 text-sm">AI is reviewing your usage patterns to find optimization opportunities</p>
          </div>
        )}

        {error && (
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
                    <span className="text-sm text-green-400 font-medium">
                      Save ${rec.potential_savings.toFixed(2)}/mo
                    </span>
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
            <p className="text-slate-400 text-sm">Your cloud spending is well-optimized. Keep monitoring for changes.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
