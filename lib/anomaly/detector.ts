import { createAdminClient } from "@/lib/supabase/server"

interface DetectedAnomaly {
  integration_id: string
  resource_type: string
  expected_cost: number
  actual_cost: number
  variance_percent: number
  severity: "low" | "medium" | "high" | "critical"
  description: string
}

function calculateSeverity(stdDevs: number): "low" | "medium" | "high" | "critical" {
  if (stdDevs >= 5) return "critical"
  if (stdDevs >= 4) return "high"
  if (stdDevs >= 3) return "medium"
  return "low"
}

export async function detectAnomalies(companyId: string, integrationId?: string): Promise<DetectedAnomaly[]> {
  const supabase = await createAdminClient()

  // Get billing history (last 12 months)
  let query = supabase
    .from("billing_history")
    .select("*")
    .eq("company_id", companyId)
    .order("billing_period", { ascending: true })

  if (integrationId) {
    query = query.eq("integration_id", integrationId)
  }

  const { data: history } = await query
  if (!history || history.length < 3) return [] // Need at least 3 months

  const anomalies: DetectedAnomaly[] = []

  // Group by integration
  const byIntegration: Record<string, typeof history> = {}
  for (const h of history) {
    if (!byIntegration[h.integration_id]) byIntegration[h.integration_id] = []
    byIntegration[h.integration_id].push(h)
  }

  for (const [intId, records] of Object.entries(byIntegration)) {
    if (records.length < 3) continue

    const costs = records.map((r) => r.total_cost)
    const latest = costs[costs.length - 1]
    const previous = costs.slice(0, -1)

    const mean = previous.reduce((a, b) => a + b, 0) / previous.length
    const variance = previous.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / previous.length
    const stdDev = Math.sqrt(variance)

    if (stdDev === 0) continue

    const zScore = (latest - mean) / stdDev

    if (zScore > 2) {
      const variancePercent = ((latest - mean) / mean) * 100
      const severity = calculateSeverity(zScore)

      anomalies.push({
        integration_id: intId,
        resource_type: "total",
        expected_cost: mean,
        actual_cost: latest,
        variance_percent: variancePercent,
        severity,
        description: `Monthly cost of $${latest.toFixed(2)} is ${variancePercent.toFixed(0)}% above the average of $${mean.toFixed(2)} (${zScore.toFixed(1)} standard deviations)`,
      })
    }
  }

  // Store anomalies
  for (const anomaly of anomalies) {
    await supabase.from("cost_anomalies").insert({
      company_id: companyId,
      integration_id: anomaly.integration_id,
      detected_at: new Date().toISOString(),
      resource_type: anomaly.resource_type,
      expected_cost: anomaly.expected_cost,
      actual_cost: anomaly.actual_cost,
      variance_percent: anomaly.variance_percent,
      severity: anomaly.severity,
      description: anomaly.description,
      is_resolved: false,
    })
  }

  return anomalies
}
