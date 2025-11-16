"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface CostData {
  date: string
  service_name: string
  cost: number
}

interface CostChartProps {
  costData: CostData[]
}

export function CostChart({ costData }: CostChartProps) {
  // Aggregate data by date
  const aggregatedData = costData.reduce(
    (acc, curr) => {
      const existing = acc.find((item) => item.date === curr.date)
      if (existing) {
        existing.cost += Number(curr.cost)
      } else {
        acc.push({ date: curr.date, cost: Number(curr.cost) })
      }
      return acc
    },
    [] as { date: string; cost: number }[],
  )

  // Sort by date and format
  const chartData = aggregatedData
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((item) => ({
      date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      cost: Number(item.cost.toFixed(2)),
    }))

  return (
    <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-white">Cost Trends</CardTitle>
        <CardDescription className="text-slate-400">Daily cloud spending over the last 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-80 text-slate-500">No cost data available</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#94a3b8" tick={{ fill: "#94a3b8" }} />
              <YAxis stroke="#94a3b8" tick={{ fill: "#94a3b8" }} tickFormatter={(value) => `$${value}`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: "0.5rem",
                  color: "#f8fafc",
                }}
                formatter={(value) => [`$${value}`, "Cost"]}
              />
              <Line type="monotone" dataKey="cost" stroke="#6366f1" strokeWidth={2} dot={{ fill: "#6366f1" }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
