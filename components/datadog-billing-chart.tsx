"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"

type BillingHistory = {
  billing_period: string
  total_cost: number
}

export function DatadogBillingChart({ billingHistory }: { billingHistory: BillingHistory[] }) {
  const chartData = [...billingHistory].reverse().map((item) => ({
    month: new Date(item.billing_period).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    cost: Number.parseFloat(item.total_cost.toString()),
  }))

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Billing Trend</CardTitle>
        <CardDescription className="text-slate-400">Monthly spending over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="month" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" tickFormatter={(value) => `$${value}`} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
              labelStyle={{ color: "#f1f5f9" }}
              itemStyle={{ color: "#a78bfa" }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, "Cost"]}
            />
            <Legend />
            <Line type="monotone" dataKey="cost" stroke="#a78bfa" strokeWidth={2} name="Monthly Cost" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
