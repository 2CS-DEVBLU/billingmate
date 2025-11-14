"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, TrendingDown } from "lucide-react"

interface Recommendation {
  id: string
  title: string
  description: string
  potential_savings: number
  priority: string
  status: string
}

const priorityColors: Record<string, string> = {
  high: "bg-red-600/20 text-red-300 border-red-500/50",
  medium: "bg-yellow-600/20 text-yellow-300 border-yellow-500/50",
  low: "bg-blue-600/20 text-blue-300 border-blue-500/50",
}

export function DigitalOceanRecommendations({ recommendations }: { recommendations: Recommendation[] }) {
  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-green-400" />
          Cost Optimization
        </CardTitle>
        <CardDescription className="text-slate-400">
          AI-powered recommendations to reduce your cloud spend
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.map((rec) => (
          <div key={rec.id} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-start gap-3 flex-1">
                <AlertCircle className="w-5 h-5 text-indigo-400 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-white font-medium mb-1">{rec.title}</h3>
                  <p className="text-sm text-slate-400 mb-3">{rec.description}</p>

                  <div className="flex items-center gap-3">
                    <Badge className={priorityColors[rec.priority] || ""}>{rec.priority} priority</Badge>
                    <span className="text-sm text-green-400 font-medium">
                      Save ${Number.parseFloat(rec.potential_savings.toString()).toFixed(2)}/mo
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {recommendations.length === 0 && (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <p className="text-slate-300 font-medium mb-1">All optimized!</p>
            <p className="text-slate-400 text-sm">No cost optimization recommendations at this time.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
