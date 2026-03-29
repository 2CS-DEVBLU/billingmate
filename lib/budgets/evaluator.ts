import { createAdminClient } from "@/lib/supabase/server"

export async function evaluateBudgets(companyId: string) {
  const supabase = await createAdminClient()

  // Get active budget rules
  const { data: rules } = await supabase
    .from("budget_rules")
    .select("*")
    .eq("company_id", companyId)
    .eq("is_active", true)

  if (!rules || rules.length === 0) return []

  const alerts: Array<{ ruleId: string; ruleName: string; severity: string; message: string }> = []

  for (const rule of rules) {
    // Check cooldown (only trigger once per day)
    if (rule.last_triggered_at) {
      const lastTriggered = new Date(rule.last_triggered_at)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      if (lastTriggered > oneDayAgo) continue
    }

    // Get current month spend
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`

    let query = supabase
      .from("billing_history")
      .select("total_cost")
      .eq("company_id", companyId)
      .gte("billing_period", currentMonth)

    if (rule.integration_id) {
      query = query.eq("integration_id", rule.integration_id)
    }

    const { data: billing } = await query

    const currentSpend = billing?.reduce((sum, b) => sum + (b.total_cost || 0), 0) || 0

    let exceeded = false
    let severity = "warning"
    let message = ""

    if (rule.threshold_type === "absolute") {
      exceeded = currentSpend >= rule.threshold_amount
      const overBy = ((currentSpend - rule.threshold_amount) / rule.threshold_amount) * 100
      severity = overBy > 25 ? "critical" : "warning"
      message = `Budget "${rule.name}" exceeded: $${currentSpend.toFixed(2)} / $${rule.threshold_amount.toFixed(2)} (${overBy.toFixed(0)}% over)`
    } else if (rule.threshold_type === "percentage" && rule.baseline_amount) {
      const changePercent = ((currentSpend - rule.baseline_amount) / rule.baseline_amount) * 100
      exceeded = changePercent >= rule.threshold_amount
      severity = changePercent > rule.threshold_amount * 1.5 ? "critical" : "warning"
      message = `Budget "${rule.name}": spend increased ${changePercent.toFixed(1)}% vs baseline $${rule.baseline_amount.toFixed(2)}`
    }

    if (exceeded) {
      // Create alert
      await supabase.from("alerts").insert({
        company_id: companyId,
        alert_type: "budget_exceeded",
        severity,
        title: `Budget Alert: ${rule.name}`,
        message,
        is_read: false,
      })

      // Update last_triggered_at
      await supabase
        .from("budget_rules")
        .update({ last_triggered_at: new Date().toISOString() })
        .eq("id", rule.id)

      alerts.push({ ruleId: rule.id, ruleName: rule.name, severity, message })
    }
  }

  return alerts
}
