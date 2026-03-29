import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single()
  if (!profile?.company_id) return NextResponse.json({ error: "No company" }, { status: 400 })

  const { format, scope, filters } = await req.json()

  let data: any[] = []

  if (scope === "billing_history") {
    let query = supabase
      .from("billing_history")
      .select("billing_period, total_cost, currency, cloud_integrations(provider)")
      .eq("company_id", profile.company_id)
      .order("billing_period", { ascending: false })

    if (filters?.dateFrom) query = query.gte("billing_period", filters.dateFrom)
    if (filters?.dateTo) query = query.lte("billing_period", filters.dateTo)

    const { data: result } = await query
    data = (result || []).map((r: any) => ({
      period: r.billing_period,
      cost: r.total_cost,
      currency: r.currency,
      provider: r.cloud_integrations?.provider || "unknown",
    }))
  } else if (scope === "resource_costs") {
    const { data: billing } = await supabase
      .from("billing_history")
      .select("id")
      .eq("company_id", profile.company_id)

    const { data: result } = await supabase
      .from("resource_costs")
      .select("resource_type, resource_name, cost, region, billing_history(billing_period)")
      .in("billing_history_id", billing?.map((b) => b.id) || [])
      .order("cost", { ascending: false })
      .limit(500)

    data = (result || []).map((r: any) => ({
      type: r.resource_type,
      name: r.resource_name,
      cost: r.cost,
      region: r.region || "",
      period: r.billing_history?.billing_period || "",
    }))
  } else if (scope === "anomalies") {
    const { data: result } = await supabase
      .from("cost_anomalies")
      .select("detected_at, resource_type, expected_cost, actual_cost, variance_percent, severity, is_resolved")
      .eq("company_id", profile.company_id)
      .order("detected_at", { ascending: false })

    data = result || []
  }

  if (format === "csv") {
    if (data.length === 0) {
      return new Response("No data", { status: 200, headers: { "Content-Type": "text/plain" } })
    }
    const headers = Object.keys(data[0])
    const csv = [
      headers.join(","),
      ...data.map((row) => headers.map((h) => `"${String(row[h] ?? "").replace(/"/g, '""')}"`).join(",")),
    ].join("\n")

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename=billingmate-${scope}-${new Date().toISOString().split("T")[0]}.csv`,
      },
    })
  }

  // JSON format
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename=billingmate-${scope}-${new Date().toISOString().split("T")[0]}.json`,
    },
  })
}
