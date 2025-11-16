"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Server, Database, Network, HardDrive } from 'lucide-react'

interface ResourceCost {
  resource_type: string
  resource_name: string
  cost: number
  region?: string
  size_slug?: string
  metadata?: {
    product?: string
    description?: string
  }
}

const resourceIcons: Record<string, any> = {
  droplet: Server,
  database: Database,
  load_balancer: Network,
  storage: HardDrive,
}

export function DigitalOceanResourceBreakdown({ resourceCosts }: { resourceCosts: ResourceCost[] }) {
  // Group by resource type
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
        <CardDescription className="text-slate-400">Cost analysis by resource type</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(groupedByType).map(([type, data]) => {
          const Icon = resourceIcons[type] || Server

          return (
            <div key={type} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-indigo-400" />
                  <div>
                    <h3 className="text-white font-medium capitalize">{type.replace("_", " ")}</h3>
                    <p className="text-sm text-slate-400">
                      {data.count} resource{data.count !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-indigo-600/20 text-indigo-300">
                  ${data.total.toFixed(2)}/mo
                </Badge>
              </div>

              <div className="space-y-2 mt-3">
                {data.resources.slice(0, 3).map((resource, idx) => {
                  const displayName = resource.metadata?.product || resource.metadata?.description || resource.resource_name || 'Unknown Product'
                  
                  return (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-slate-300">{displayName}</span>
                      <span className="text-slate-400">${Number.parseFloat(resource.cost.toString()).toFixed(2)}</span>
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
            No resource data available. Sync your DigitalOcean account to see breakdown.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
