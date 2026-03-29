"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingDown, Loader2, Sparkles, Lock, CheckCircle, AlertCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { useI18n } from "@/lib/i18n/context"

interface Recommendation {
  title: string
  description: string
  potential_savings: number
  priority: string
  category: string
  provider: string
  actionable_steps?: string[]
}

const priorityColors: Record<string, string> = {
  high: "bg-red-500/10 text-red-300 border-red-500/30",
  medium: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  low: "bg-blue-500/10 text-blue-300 border-blue-500/30",
}

const providerColors: Record<string, string> = {
  aws: "bg-orange-500/10 text-orange-300 border-orange-500/30",
  digitalocean: "bg-blue-500/10 text-blue-300 border-blue-500/30",
  datadog: "bg-violet-500/10 text-violet-300 border-violet-500/30",
}

export function UnifiedRecommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [upgradeRequired, setUpgradeRequired] = useState(false)
  const { t } = useI18n()

  const fetch​Recs = async () => {
    setLoading(true)
    setError(null)
    setUpgradeRequired(false)

    try {
      const res = await fetch("/api/ai/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (!res.ok) throw new Error("Failed to generate recommendations")

      const data = await res.json()
      setRecommendations(data.recommendations || [])
      if (data.upgradeRequired) {
        setUpgradeRequired(true)
      }
    } catch {
      setError("Failed to generate recommendations")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetch​Recs()
  }, [])

  if (upgradeRequired) {
    return (
      <Card className="glass border-white/[0.06]">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Lock className="h-8 w-8 text-amber-400 mb-3" />
          <p className="text-sm font-medium text-white mb-1">{t.recommendations.proFeature}</p>
          <p className="text-xs text-slate-500 mb-4">{t.recommendations.upgradeToUnlock}</p>
          <Button asChild size="sm" className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white">
            <a href="/dashboard/billing">{t.common.upgrade}</a>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="glass border-white/[0.06]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-emerald-400" />
            <CardTitle className="text-sm text-white">{t.recommendations.aiCostOptimization}</CardTitle>
          </div>
          <Button
            onClick={fetch​Recs}
            disabled={loading}
            size="sm"
            className="h-7 text-[10px] bg-white/5 hover:bg-white/10 text-slate-400 border border-white/10"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            <span className="ml-1">{loading ? "..." : t.common.refresh}</span>
          </Button>
        </div>
        <p className="text-[11px] text-slate-500">{t.recommendations.basedOnUsage}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && recommendations.length === 0 && (
          <div className="text-center py-6">
            <Loader2 className="h-8 w-8 text-indigo-400 mx-auto mb-2 animate-spin" />
            <p className="text-xs text-slate-400">{t.recommendations.analyzing}</p>
          </div>
        )}

        {error && (
          <div className="text-center py-6">
            <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        {!loading && !error && recommendations.map((rec, i) => (
          <div key={i} className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02] space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-medium text-white">{rec.title}</h4>
              {rec.potential_savings > 0 && (
                <span className="text-xs font-semibold text-emerald-400 shrink-0">
                  -${rec.potential_savings.toFixed(0)}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">{rec.description}</p>
            <div className="flex items-center gap-2">
              <Badge className={`text-[9px] px-1.5 py-0 ${priorityColors[rec.priority] || ""}`}>
                {rec.priority}
              </Badge>
              {rec.provider && (
                <Badge className={`text-[9px] px-1.5 py-0 ${providerColors[rec.provider] || "bg-white/5 text-slate-400"}`}>
                  {rec.provider}
                </Badge>
              )}
            </div>
            {rec.actionable_steps && rec.actionable_steps.length > 0 && (
              <ul className="space-y-1 mt-2">
                {rec.actionable_steps.map((step, j) => (
                  <li key={j} className="text-[10px] text-slate-500 flex items-start gap-1.5">
                    <span className="text-indigo-400 mt-0.5">-</span>
                    {step}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}

        {!loading && !error && recommendations.length === 0 && !upgradeRequired && (
          <div className="text-center py-6">
            <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-xs text-slate-400">{t.recommendations.allOptimized}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
