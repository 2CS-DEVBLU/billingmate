"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, DollarSign, Calendar, Zap, Target } from "lucide-react"

interface BillingRecord {
  billing_period: string
  total_cost: number
  resource_count: number
}

interface FinOpsMetricsProps {
  billingHistory: BillingRecord[]
}

export function FinOpsMetrics({ billingHistory }: FinOpsMetricsProps) {
  const currentMonth = billingHistory[0]
  const previousMonth = billingHistory[1]
  const last3Months = billingHistory.slice(0, 3)
  const last12Months = billingHistory

  const currentCost = currentMonth?.total_cost || 0
  const previousCost = previousMonth?.total_cost || 0
  const costTrend = previousCost > 0 ? ((currentCost - previousCost) / previousCost) * 100 : 0

  const avg3MonthCost =
    last3Months.length > 0 ? last3Months.reduce((sum, r) => sum + r.total_cost, 0) / last3Months.length : 0

  const avg12MonthCost =
    last12Months.length > 0 ? last12Months.reduce((sum, r) => sum + r.total_cost, 0) / last12Months.length : 0

  const totalAnnualCost = last12Months.reduce((sum, r) => sum + r.total_cost, 0)

  // Cost variance (standard deviation)
  const variance =
    last12Months.length > 1
      ? Math.sqrt(
          last12Months.reduce((sum, r) => sum + Math.pow(r.total_cost - avg12MonthCost, 2), 0) / last12Months.length,
        )
      : 0

  const costStability =
    variance < avg12MonthCost * 0.2 ? "Stable" : variance < avg12MonthCost * 0.5 ? "Moderate" : "Volatile"

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardDescription className="text-slate-400">Cost Trend</CardDescription>
            {costTrend > 0 ? (
              <TrendingUp className="h-5 w-5 text-red-400" />
            ) : (
              <TrendingDown className="h-5 w-5 text-green-400" />
            )}
          </div>
          <CardTitle className={`text-2xl ${costTrend > 0 ? "text-red-400" : "text-green-400"}`}>
            {costTrend > 0 ? "+" : ""}
            {costTrend.toFixed(1)}%
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400">Month-over-month change</p>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardDescription className="text-slate-400">3-Month Average</CardDescription>
            <Calendar className="h-5 w-5 text-blue-400" />
          </div>
          <CardTitle className="text-2xl text-white">${avg3MonthCost.toFixed(2)}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400">Rolling quarterly average</p>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardDescription className="text-slate-400">Annual Run Rate</CardDescription>
            <DollarSign className="h-5 w-5 text-purple-400" />
          </div>
          <CardTitle className="text-2xl text-white">${(currentCost * 12).toFixed(2)}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400">Projected annual spend</p>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardDescription className="text-slate-400">12-Month Total</CardDescription>
            <Target className="h-5 w-5 text-indigo-400" />
          </div>
          <CardTitle className="text-2xl text-white">${totalAnnualCost.toFixed(2)}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400">Actual annual spend</p>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardDescription className="text-slate-400">Cost Stability</CardDescription>
            <Zap className="h-5 w-5 text-yellow-400" />
          </div>
          <CardTitle className="text-2xl text-white">{costStability}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400">Variance: ${variance.toFixed(2)}</p>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardDescription className="text-slate-400">Cost per Resource</CardDescription>
            <DollarSign className="h-5 w-5 text-green-400" />
          </div>
          <CardTitle className="text-2xl text-white">
            ${currentMonth?.resource_count > 0 ? (currentCost / currentMonth.resource_count).toFixed(2) : "0.00"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400">Average cost efficiency</p>
        </CardContent>
      </Card>
    </div>
  )
}
