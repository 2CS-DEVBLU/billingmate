"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface BillingHistory {
  billing_period: string
  total_cost: number
}

export function AwsBillingChart({ billingHistory }: { billingHistory: BillingHistory[] }) {
  const chartData = [...billingHistory].reverse().map((item) => ({
    month: new Date(item.billing_period).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    cost: Number.parseFloat(item.total_cost.toString()),
  }))

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">AWS Cost Trend</CardTitle>
        <CardDescription className="text-slate-400">
          Historical billing data for comparison and forecasting
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="month" stroke="#94a3b8" tick={{ fill: "#94a3b8" }} />
            <YAxis stroke="#94a3b8" tick={{ fill: "#94a3b8" }} tickFormatter={(value) => `$${value}`} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#f1f5f9" }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, "Cost"]}
            />
            <Line type="monotone" dataKey="cost" stroke="#f97316" strokeWidth={2} dot={{ fill: "#f97316", r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
