"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts"

interface BillingRecord {
  billing_period: string
  total_cost: number
  resource_count: number
}

interface MonthlyAverageChartProps {
  billingHistory: BillingRecord[]
}

export function MonthlyAverageChart({ billingHistory }: MonthlyAverageChartProps) {
  const chartData = billingHistory
    .slice()
    .reverse()
    .map((record) => ({
      month: new Date(record.billing_period).toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      cost: Number(record.total_cost.toFixed(2)),
    }))

  const averageCost =
    billingHistory.length > 0
      ? billingHistory.reduce((sum, record) => sum + record.total_cost, 0) / billingHistory.length
      : 0

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">12-Month Average Cost</CardTitle>
        <CardDescription className="text-slate-400">
          Average: <span className="text-white font-semibold">${averageCost.toFixed(2)}</span>/month
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="month" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #475569",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#e2e8f0" }}
            />
            <Legend />
            <Bar dataKey="cost" fill="#6366f1" name="Monthly Cost ($)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
