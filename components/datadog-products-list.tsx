"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search } from 'lucide-react'

interface ResourceCost {
  id: string
  resource_type: string
  resource_name: string
  cost: number
  metadata?: any
}

interface DatadogProductsListProps {
  resourceCosts: ResourceCost[]
  timeRange?: string
}

const productTypeColors: Record<string, string> = {
  infrastructure: "bg-blue-600",
  apm: "bg-purple-600",
  logs: "bg-green-600",
  metrics: "bg-yellow-600",
  synthetics: "bg-pink-600",
  rum: "bg-orange-600",
  other: "bg-gray-600",
}

const productTypeLabels: Record<string, string> = {
  infrastructure: "Infrastructure",
  apm: "APM",
  logs: "Logs",
  metrics: "Metrics",
  synthetics: "Synthetics",
  rum: "RUM",
  other: "Other",
}

export function DatadogProductsList({ resourceCosts, timeRange = "1" }: DatadogProductsListProps) {
  const [searchTerm, setSearchTerm] = useState("")

  // Sort by cost descending
  const sortedProducts = [...resourceCosts].sort((a, b) => Number(b.cost) - Number(a.cost))

  const filteredProducts = sortedProducts.filter(
    (product) =>
      product.resource_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.resource_type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  console.log("[v0] DatadogProductsList received:", resourceCosts.length, "resources")

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Products & Services</CardTitle>
        <CardDescription className="text-slate-400">Datadog services currently in use</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>
        </div>

        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {filteredProducts.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No products found</p>
          ) : (
            filteredProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-3 bg-slate-900/30 rounded-lg hover:bg-slate-900/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Badge className={`${productTypeColors[product.resource_type] || productTypeColors.other} text-white shrink-0`}>
                    {productTypeLabels[product.resource_type] || product.resource_type}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">{product.resource_name}</p>
                    {product.metadata?.product && (
                      <p className="text-xs text-slate-400 truncate">{product.metadata.product}</p>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-sm font-semibold text-white">${Number(product.cost).toFixed(2)}</p>
                  <p className="text-xs text-slate-400">per month</p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
