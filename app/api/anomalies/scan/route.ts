import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { detectAnomalies } from "@/lib/anomaly/detector"

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single()
  if (!profile?.company_id) return NextResponse.json({ error: "No company" }, { status: 400 })

  const anomalies = await detectAnomalies(profile.company_id)

  return NextResponse.json({ anomalies, count: anomalies.length })
}
