import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ integrationId: string }> }
) {
  try {
    const { integrationId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id, role")
      .eq("id", user.id)
      .single()

    if (!profile?.company_id) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const isAdmin = profile.role === "admin"
    if (!isAdmin) {
      return NextResponse.json({ error: "Only administrators can update integrations" }, { status: 403 })
    }

    const body = await request.json()

    const { error } = await supabase
      .from("cloud_integrations")
      .update(body)
      .eq("id", integrationId)
      .eq("company_id", profile.company_id)

    if (error) {
      console.error("[v0] Error updating integration:", error)
      return NextResponse.json({ error: "Failed to update integration" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in PATCH /api/integrations/[integrationId]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ integrationId: string }> }
) {
  try {
    const { integrationId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id, role")
      .eq("id", user.id)
      .single()

    if (!profile?.company_id) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const isAdmin = profile.role === "admin"
    if (!isAdmin) {
      return NextResponse.json({ error: "Only administrators can delete integrations" }, { status: 403 })
    }

    await supabase
      .from("recommendations")
      .delete()
      .eq("cloud_account_id", integrationId)

    const { data: billingHistory } = await supabase
      .from("billing_history")
      .select("id")
      .eq("integration_id", integrationId)

    if (billingHistory && billingHistory.length > 0) {
      const billingIds = billingHistory.map(b => b.id)
      await supabase
        .from("resource_costs")
        .delete()
        .in("billing_history_id", billingIds)
    }

    await supabase
      .from("billing_history")
      .delete()
      .eq("integration_id", integrationId)

    await supabase
      .from("sync_logs")
      .delete()
      .eq("integration_id", integrationId)

    const { error } = await supabase
      .from("cloud_integrations")
      .delete()
      .eq("id", integrationId)
      .eq("company_id", profile.company_id)

    if (error) {
      console.error("[v0] Error deleting integration:", error)
      return NextResponse.json({ error: "Failed to delete integration" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in DELETE /api/integrations/[integrationId]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
