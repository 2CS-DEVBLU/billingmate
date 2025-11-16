"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts"

interface ResourceCost {
  resource_type: string
  cost: number
}

const COLORS = {
  infrastructure: "#3b82f6",
  apm: "#a78bfa",
  logs: "#10b981",
  metrics: "#f59e0b",
  synthetics: "#ec4899",
  rum: "#f97316",
  other: "#6b7280",
}

const TYPE_LABELS: Record<string, string> = {
  infrastructure: "Infrastructure",
  apm: "APM",
  logs: "Logs",
  metrics: "Metrics",
  synthetics: "Synthetics",
  rum: "RUM",
  other: "Other",
}

export function DatadogResourceBreakdown({ resourceCosts }: { resourceCosts: ResourceCost[] }) {
  // Group costs by resource type
  const breakdown = resourceCosts.reduce(
    (acc, resource) => {
      const type = resource.resource_type || "other"
      acc[type] = (acc[type] || 0) + Number(resource.cost)
      return acc
    },
    {} as Record<string, number>
  )

  const chartData = Object.entries(breakdown).map(([type, cost]) => ({
    name: TYPE_LABELS[type] || type,
    value: Number(cost.toFixed(2)),
    type,
  }))

  const totalCost = chartData.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Cost Breakdown by Service</CardTitle>
        <CardDescription className="text-slate-400">Distribution of costs across Datadog products</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">
            No resource data available. Sync your Datadog account to see breakdown.
          </p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.type as keyof typeof COLORS] || COLORS.other} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                  formatter={(value: number) => `$${value.toFixed(2)}`}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>

            <div className="mt-6 space-y-2">
              {chartData.map((item) => (
                <div key={item.type} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[item.type as keyof typeof COLORS] || COLORS.other }}
                    />
                    <span className="text-slate-300">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400">{((item.value / totalCost) * 100).toFixed(1)}%</span>
                    <span className="text-white font-medium">${item.value.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
