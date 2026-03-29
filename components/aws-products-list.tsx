"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Server, Database, Network, HardDrive, Cloud, Cpu, BarChart3, MessageSquare, Box } from "lucide-react"

interface ResourceCost {
  resource_type: string
  resource_id: string
  resource_name: string
  cost: number
  usage_hours?: number
  region?: string
  metadata?: Record<string, any>
}

interface AwsProductsListProps {
  resourceCosts: ResourceCost[]
  timeRange?: string
}

const getProductIcon = (type: string) => {
  switch (type) {
    case "compute": return <Server className="h-5 w-5" />
    case "database": return <Database className="h-5 w-5" />
    case "networking": return <Network className="h-5 w-5" />
    case "storage": return <HardDrive className="h-5 w-5" />
    case "serverless": return <Cpu className="h-5 w-5" />
    case "containers": return <Box className="h-5 w-5" />
    case "monitoring": return <BarChart3 className="h-5 w-5" />
    case "messaging": return <MessageSquare className="h-5 w-5" />
    default: return <Cloud className="h-5 w-5" />
  }
}

const getProductColor = (type: string) => {
  switch (type) {
    case "compute": return "text-orange-400"
    case "database": return "text-purple-400"
    case "networking": return "text-green-400"
    case "storage": return "text-blue-400"
    case "serverless": return "text-yellow-400"
    case "containers": return "text-cyan-400"
    default: return "text-slate-400"
  }
}

const formatProductType = (type: string) => {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export function AwsProductsList({ resourceCosts, timeRange = "1" }: AwsProductsListProps) {
  const productsByType = resourceCosts.reduce(
    (acc, resource) => {
      if (!acc[resource.resource_type]) {
        acc[resource.resource_type] = []
      }
      acc[resource.resource_type].push(resource)
      return acc
    },
    {} as Record<string, ResourceCost[]>,
  )

  const typeTotals = Object.entries(productsByType)
    .map(([type, resources]) => ({
      type,
      count: resources.length,
      totalCost: resources.reduce((sum, r) => sum + r.cost, 0),
    }))
    .sort((a, b) => b.totalCost - a.totalCost)

  const monthsNumber = Number.parseInt(timeRange)
  const periodLabel = monthsNumber === 1 ? "per month" : `per ${monthsNumber} months`

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Active Services</CardTitle>
        <CardDescription className="text-slate-400">AWS services currently in use</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {typeTotals.map(({ type, count, totalCost }) => (
            <div
              key={type}
              className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700"
            >
              <div className="flex items-center gap-3">
                <div className={`${getProductColor(type)}`}>{getProductIcon(type)}</div>
                <div>
                  <p className="text-white font-medium">{formatProductType(type)}</p>
                  <p className="text-sm text-slate-400">
                    {count} service{count !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-semibold">${totalCost.toFixed(2)}</p>
                <p className="text-xs text-slate-400">{periodLabel}</p>
              </div>
            </div>
          ))}

          {typeTotals.length === 0 && <p className="text-center text-slate-400 py-4">No active services found</p>}
        </div>
      </CardContent>
    </Card>
  )
}
