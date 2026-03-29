import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single()
  if (!profile?.company_id) return NextResponse.json({ error: "No company" }, { status: 400 })

  const { data: rules } = await supabase
    .from("budget_rules")
    .select("*, cloud_integrations(provider, provider_name)")
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false })

  return NextResponse.json({ rules: rules || [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase.from("profiles").select("company_id, company_account_role, is_admin").eq("id", user.id).single()
  if (!profile?.company_id) return NextResponse.json({ error: "No company" }, { status: 400 })
  if (profile.company_account_role !== "admin" && !profile.is_admin) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 })
  }

  const body = await req.json()
  const { name, integration_id, threshold_amount, threshold_type, baseline_amount, alert_channels } = body

  const { data: rule, error } = await supabase
    .from("budget_rules")
    .insert({
      company_id: profile.company_id,
      name,
      integration_id: integration_id || null,
      threshold_amount,
      threshold_type,
      baseline_amount: baseline_amount || null,
      alert_channels: alert_channels || ["in_app"],
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ rule })
}
