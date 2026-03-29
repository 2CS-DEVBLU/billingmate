"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Server, Database, HardDrive, Network, Cloud, Cpu, BarChart3, MessageSquare, Box } from "lucide-react"

interface ResourceCost {
  resource_type: string
  resource_name: string
  cost: number
  region?: string
  metadata?: {
    product?: string
    description?: string
  }
}

const resourceIcons: Record<string, any> = {
  compute: Server,
  database: Database,
  storage: HardDrive,
  networking: Network,
  serverless: Cpu,
  ai_ml: BarChart3,
  monitoring: BarChart3,
  messaging: MessageSquare,
  containers: Box,
}

export function AwsResourceBreakdown({ resourceCosts }: { resourceCosts: ResourceCost[] }) {
  const groupedByType = resourceCosts.reduce(
    (acc, resource) => {
      if (!acc[resource.resource_type]) {
        acc[resource.resource_type] = { count: 0, total: 0, resources: [] }
      }
      acc[resource.resource_type].count++
      acc[resource.resource_type].total += Number.parseFloat(resource.cost.toString())
      acc[resource.resource_type].resources.push(resource)
      return acc
    },
    {} as Record<string, { count: number; total: number; resources: ResourceCost[] }>,
  )

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Resource Breakdown</CardTitle>
        <CardDescription className="text-slate-400">Cost analysis by AWS service category</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(groupedByType)
          .sort(([, a], [, b]) => b.total - a.total)
          .map(([type, data]) => {
            const Icon = resourceIcons[type] || Cloud

            return (
              <div key={type} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-orange-400" />
                    <div>
                      <h3 className="text-white font-medium capitalize">{type.replace("_", " ")}</h3>
                      <p className="text-sm text-slate-400">
                        {data.count} service{data.count !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-orange-600/20 text-orange-300">
                    ${data.total.toFixed(2)}/mo
                  </Badge>
                </div>

                <div className="space-y-2 mt-3">
                  {data.resources.slice(0, 3).map((resource, idx) => {
                    const displayName = resource.metadata?.product || resource.resource_name || "Unknown Service"

                    return (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-slate-300 truncate mr-2">{displayName}</span>
                        <span className="text-slate-400 shrink-0">${Number.parseFloat(resource.cost.toString()).toFixed(2)}</span>
                      </div>
                    )
                  })}
                  {data.resources.length > 3 && (
                    <p className="text-xs text-slate-500 mt-2">+{data.resources.length - 3} more</p>
                  )}
                </div>
              </div>
            )
          })}

        {resourceCosts.length === 0 && (
          <p className="text-slate-400 text-center py-8">
            No resource data available. Sync your AWS account to see breakdown.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
