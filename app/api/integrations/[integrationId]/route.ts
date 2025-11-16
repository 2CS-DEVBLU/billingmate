import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { integrationId: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id, is_admin")
      .eq("id", user.id)
      .maybeSingle()

    if (!profile || !profile.is_admin) {
      return NextResponse.json(
        { error: "Only administrators can update integrations" },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { api_key, api_token, config } = body

    // Build update object
    const updateData: any = {}
    if (api_key !== undefined) updateData.api_key = api_key
    if (api_token !== undefined) updateData.api_token = api_token
    if (config !== undefined) updateData.config = config

    // Update integration
    const { data: integration, error } = await supabase
      .from("cloud_integrations")
      .update(updateData)
      .eq("id", params.integrationId)
      .eq("company_id", profile.company_id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating integration:", error)
      return NextResponse.json(
        { error: "Failed to update integration" },
        { status: 500 }
      )
    }

    return NextResponse.json({ integration })
  } catch (error) {
    console.error("[v0] Error in PATCH /api/integrations/[integrationId]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { integrationId: string } }
) {
  console.log("[v0] DELETE integration API called - Integration ID:", params.integrationId)
  
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    console.log("[v0] User authenticated:", user?.email)

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id, is_admin")
      .eq("id", user.id)
      .maybeSingle()

    console.log("[v0] Profile fetched:", profile)

    if (!profile || !profile.is_admin) {
      return NextResponse.json(
        { error: "Only administrators can delete integrations" },
        { status: 403 }
      )
    }

    // Verify integration belongs to user's company
    const { data: integration } = await supabase
      .from("cloud_integrations")
      .select("id, company_id, provider")
      .eq("id", params.integrationId)
      .eq("company_id", profile.company_id)
      .maybeSingle()

    console.log("[v0] Integration to delete:", integration)

    if (!integration) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 }
      )
    }

    // Delete associated data in order (due to foreign key constraints)
    console.log("[v0] Deleting sync_logs...")
    const { error: syncLogsError } = await supabase
      .from("sync_logs")
      .delete()
      .eq("integration_id", params.integrationId)

    if (syncLogsError) {
      console.error("[v0] Error deleting sync_logs:", syncLogsError)
    }

    console.log("[v0] Deleting recommendations...")
    const { error: recommendationsError } = await supabase
      .from("recommendations")
      .delete()
      .eq("integration_id", params.integrationId)

    if (recommendationsError) {
      console.error("[v0] Error deleting recommendations:", recommendationsError)
    }

    console.log("[v0] Deleting resource_costs...")
    const { error: resourceCostsError } = await supabase
      .from("resource_costs")
      .delete()
      .eq("integration_id", params.integrationId)

    if (resourceCostsError) {
      console.error("[v0] Error deleting resource_costs:", resourceCostsError)
    }

    console.log("[v0] Deleting billing_history...")
    const { error: billingHistoryError } = await supabase
      .from("billing_history")
      .delete()
      .eq("integration_id", params.integrationId)

    if (billingHistoryError) {
      console.error("[v0] Error deleting billing_history:", billingHistoryError)
    }

    // Finally delete the integration itself
    console.log("[v0] Deleting integration...")
    const { error: integrationError } = await supabase
      .from("cloud_integrations")
      .delete()
      .eq("id", params.integrationId)
      .eq("company_id", profile.company_id)

    if (integrationError) {
      console.error("[v0] Error deleting integration:", integrationError)
      return NextResponse.json(
        { error: "Failed to delete integration" },
        { status: 500 }
      )
    }

    console.log("[v0] Integration deleted successfully")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in DELETE /api/integrations/[integrationId]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
