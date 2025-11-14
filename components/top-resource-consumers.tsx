"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp } from 'lucide-react'

interface ResourceCost {
  resource_type: string
  resource_id: string
  resource_name: string
  cost: number
  usage_hours?: number
  region?: string
  size_slug?: string
  metadata?: Record<string, any>
}

interface TopResourceConsumersProps {
  resourceCosts: ResourceCost[]
}

export function TopResourceConsumers({ resourceCosts }: TopResourceConsumersProps) {
  console.log("[v0] TopResourceConsumers received:", resourceCosts.length, "resources")
  
  if (resourceCosts.length > 0) {
    console.log("[v0] First resource structure:", JSON.stringify(resourceCosts[0], null, 2))
  }

  // Sort by cost descending and take top 10
  const topResources = [...resourceCosts].sort((a, b) => b.cost - a.cost).slice(0, 10)

  const totalCost = resourceCosts.reduce((sum, r) => sum + r.cost, 0)

  const getTypeColor = (type: string) => {
    switch (type) {
      case "droplet":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "database":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30"
      case "load_balancer":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "storage":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30"
      case "spaces":
        return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
      case "bandwidth":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30"
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30"
    }
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-red-400" />
          <CardTitle className="text-white">Top Resource Consumers</CardTitle>
        </div>
        <CardDescription className="text-slate-400">Resources consuming the most budget</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topResources.map((resource, index) => {
            const percentage = totalCost > 0 ? (resource.cost / totalCost) * 100 : 0
            
            const productName = 
              resource.metadata?.product || 
              resource.metadata?.description || 
              resource.resource_name || 
              'Unknown Product'
            
            const productDescription = resource.metadata?.description
            // Only show description if it's different from the product name
            const shouldShowDescription = productDescription && 
              productDescription !== productName && 
              productDescription !== resource.metadata?.product

            return (
              <div
                key={resource.resource_id}
                className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-700 text-slate-300 text-sm font-medium flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{productName}</p>
                    {shouldShowDescription && (
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{productDescription}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="outline" className={`text-xs ${getTypeColor(resource.resource_type)}`}>
                        {resource.resource_type}
                      </Badge>
                      {resource.region && <span className="text-xs text-slate-500">{resource.region}</span>}
                      {resource.size_slug && <span className="text-xs text-slate-500">{resource.size_slug}</span>}
                      {resource.metadata?.period && (
                        <span className="text-xs text-slate-500">{resource.metadata.period}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="text-white font-semibold">${resource.cost.toFixed(2)}</p>
                  <p className="text-xs text-slate-400">{percentage.toFixed(1)}% of total</p>
                </div>
              </div>
            )
          })}

          {topResources.length === 0 && <p className="text-center text-slate-400 py-4">No resource data available</p>}
        </div>
      </CardContent>
    </Card>
  )
}
