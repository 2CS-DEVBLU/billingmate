"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Server, Database, Network, HardDrive, Cloud } from 'lucide-react'

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

interface DigitalOceanProductsListProps {
  resourceCosts: ResourceCost[]
}

const getProductIcon = (type: string) => {
  switch (type) {
    case "droplet":
      return <Server className="h-5 w-5" />
    case "database":
      return <Database className="h-5 w-5" />
    case "load_balancer":
      return <Network className="h-5 w-5" />
    case "storage":
      return <HardDrive className="h-5 w-5" />
    default:
      return <Cloud className="h-5 w-5" />
  }
}

const getProductColor = (type: string) => {
  switch (type) {
    case "droplet":
      return "text-blue-400"
    case "database":
      return "text-purple-400"
    case "load_balancer":
      return "text-green-400"
    case "storage":
      return "text-orange-400"
    default:
      return "text-slate-400"
  }
}

const formatProductType = (type: string) => {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export function DigitalOceanProductsList({ resourceCosts }: DigitalOceanProductsListProps) {
  // Group products by type
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

  // Calculate totals by type
  const typeTotals = Object.entries(productsByType).map(([type, resources]) => ({
    type,
    count: resources.length,
    totalCost: resources.reduce((sum, r) => sum + r.cost, 0),
  }))

  console.log("[v0] DigitalOceanProductsList received:", resourceCosts.length, "resources")

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Active Products</CardTitle>
        <CardDescription className="text-slate-400">DigitalOcean services currently in use</CardDescription>
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
                    {count} instance{count !== 1 ? "s" : ""}
                  </p>
                  {productsByType[type][0]?.metadata?.description && (
                    <p className="text-xs text-slate-500 mt-1 truncate max-w-xs">
                      {productsByType[type][0].metadata.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-semibold">${totalCost.toFixed(2)}</p>
                <p className="text-xs text-slate-400">per month</p>
              </div>
            </div>
          ))}

          {typeTotals.length === 0 && <p className="text-center text-slate-400 py-4">No active products found</p>}
        </div>
      </CardContent>
    </Card>
  )
}
