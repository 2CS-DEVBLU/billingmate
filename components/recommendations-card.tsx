"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Lightbulb, Check } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface Recommendation {
  id: string
  title: string
  description: string
  potential_savings: number
  priority: string
  status: string
}

interface RecommendationsCardProps {
  recommendations: Recommendation[]
  companyId: string
}

export function RecommendationsCard({ recommendations, companyId }: RecommendationsCardProps) {
  const router = useRouter()

  const getPriorityBadge = (priority: string) => {
    const colors = {
      high: "bg-red-900/50 text-red-300 border-red-800",
      medium: "bg-yellow-900/50 text-yellow-300 border-yellow-800",
      low: "bg-blue-900/50 text-blue-300 border-blue-800",
    }
    return colors[priority as keyof typeof colors] || colors.medium
  }

  const handleMarkCompleted = async (id: string) => {
    const supabase = createClient()
    await supabase.from("recommendations").update({ status: "completed" }).eq("id", id)
    router.refresh()
  }

  return (
    <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-white">Recommendations</CardTitle>
        <CardDescription className="text-slate-400">AI-powered cost optimization suggestions</CardDescription>
      </CardHeader>
      <CardContent>
        {recommendations.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Lightbulb className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No recommendations available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.slice(0, 3).map((rec) => (
              <div key={rec.id} className="p-4 rounded-lg border border-slate-800 bg-slate-950/50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-white text-sm">{rec.title}</h4>
                      <Badge variant="outline" className={getPriorityBadge(rec.priority)}>
                        {rec.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-400 line-clamp-2 mb-2">{rec.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-green-400">
                        Save ${Number(rec.potential_savings).toLocaleString()}/month
                      </div>
                      {rec.status === "open" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleMarkCompleted(rec.id)}
                          className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/30 h-7"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Mark Done
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
