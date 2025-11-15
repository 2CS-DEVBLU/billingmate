"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, TrendingDown, AlertTriangle, Info } from 'lucide-react'

type Recommendation = {
  id: string
  title: string
  description: string
  potential_savings: number
  priority: string
  status: string
}

type DatadogRecommendationsProps = {
  integrationId: string
  timeRange: number
}

const priorityIcons = {
  high: AlertTriangle,
  medium: TrendingDown,
  low: Info,
}

const priorityColors = {
  high: "text-red-400",
  medium: "text-yellow-400",
  low: "text-blue-400",
}

export function DatadogRecommendations({ integrationId, timeRange }: DatadogRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    loadRecommendations()
  }, [integrationId])

  const loadRecommendations = async () => {
    try {
      const response = await fetch("/api/datadog/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ integrationId, timeRange }),
      })

      if (response.ok) {
        const data = await response.json()
        setRecommendations(data.recommendations || [])
      }
    } catch (error) {
      console.error("Failed to load recommendations:", error)
    } finally {
      setLoading(false)
    }
  }

  const generateRecommendations = async () => {
    setGenerating(true)
    try {
      const response = await fetch("/api/datadog/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ integrationId, timeRange }),
      })

      if (response.ok) {
        const data = await response.json()
        setRecommendations(data.recommendations || [])
      }
    } catch (error) {
      console.error("Failed to generate recommendations:", error)
    } finally {
      setGenerating(false)
    }
  }

  const totalSavings = recommendations.reduce((sum, rec) => sum + rec.potential_savings, 0)

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Cost Optimization</CardTitle>
            <CardDescription className="text-slate-400">
              Recommendations to reduce your Datadog spending
            </CardDescription>
          </div>
          <Button
            onClick={generateRecommendations}
            disabled={generating}
            size="sm"
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {generating ? "Generating..." : "Refresh"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
          </div>
        ) : recommendations.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">
            No recommendations available. Generate recommendations to identify cost savings opportunities.
          </p>
        ) : (
          <>
            <div className="mb-4 p-3 bg-green-900/20 border border-green-700 rounded-lg">
              <p className="text-sm text-green-400 font-medium">
                Potential savings: ${totalSavings.toFixed(2)}/month
              </p>
            </div>

            <div className="space-y-4">
              {recommendations.map((rec) => {
                const Icon = priorityIcons[rec.priority as keyof typeof priorityIcons] || Info
                const iconColor = priorityColors[rec.priority as keyof typeof priorityColors]

                return (
                  <div key={rec.id} className="p-4 bg-slate-900/30 rounded-lg space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2 flex-1">
                        <Icon className={`h-5 w-5 mt-0.5 ${iconColor}`} />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-white">{rec.title}</h4>
                          <p className="text-xs text-slate-400 mt-1">{rec.description}</p>
                        </div>
                      </div>
                      <Badge
                        variant={rec.priority === "high" ? "destructive" : "secondary"}
                        className="shrink-0"
                      >
                        {rec.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                      <span className="text-xs text-slate-400">Potential Savings</span>
                      <span className="text-sm font-semibold text-green-400">
                        ${rec.potential_savings.toFixed(2)}/month
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
