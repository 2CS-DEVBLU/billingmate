import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify admin role
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
    }

    const { companyId } = await request.json()

    if (!companyId) {
      return NextResponse.json({ error: "Company ID is required" }, { status: 400 })
    }

    console.log("[v0] Starting company deletion for ID:", companyId)

    // Delete all related data in order (respecting foreign key constraints)
    
    // 1. Delete user invitations
    const { error: invitationsError } = await supabase
      .from("user_invitations")
      .delete()
      .eq("company_id", companyId)
    if (invitationsError) console.error("[v0] Error deleting invitations:", invitationsError)

    // 2. Delete alerts
    const { error: alertsError } = await supabase.from("alerts").delete().eq("company_id", companyId)
    if (alertsError) console.error("[v0] Error deleting alerts:", alertsError)

    // 3. Delete cost anomalies
    const { error: anomaliesError } = await supabase.from("cost_anomalies").delete().eq("company_id", companyId)
    if (anomaliesError) console.error("[v0] Error deleting anomalies:", anomaliesError)

    // 4. Delete sync logs
    const { error: syncLogsError } = await supabase.from("sync_logs").delete().eq("company_id", companyId)
    if (syncLogsError) console.error("[v0] Error deleting sync logs:", syncLogsError)

    // 5. Delete resource costs (linked to billing history)
    const { data: billingHistory } = await supabase
      .from("billing_history")
      .select("id")
      .eq("company_id", companyId)
    
    if (billingHistory && billingHistory.length > 0) {
      const billingIds = billingHistory.map((b) => b.id)
      const { error: resourceCostsError } = await supabase
        .from("resource_costs")
        .delete()
        .in("billing_history_id", billingIds)
      if (resourceCostsError) console.error("[v0] Error deleting resource costs:", resourceCostsError)
    }

    // 6. Delete billing history
    const { error: billingError } = await supabase.from("billing_history").delete().eq("company_id", companyId)
    if (billingError) console.error("[v0] Error deleting billing history:", billingError)

    // 7. Delete recommendations (linked to cloud accounts)
    const { data: cloudAccounts } = await supabase
      .from("cloud_accounts")
      .select("id")
      .eq("company_id", companyId)
    
    if (cloudAccounts && cloudAccounts.length > 0) {
      const accountIds = cloudAccounts.map((a) => a.id)
      const { error: recommendationsError } = await supabase
        .from("recommendations")
        .delete()
        .in("cloud_account_id", accountIds)
      if (recommendationsError) console.error("[v0] Error deleting recommendations:", recommendationsError)

      // 8. Delete cost data
      const { error: costDataError } = await supabase
        .from("cost_data")
        .delete()
        .in("cloud_account_id", accountIds)
      if (costDataError) console.error("[v0] Error deleting cost data:", costDataError)
    }

    // 9. Delete cloud accounts
    const { error: cloudAccountsError } = await supabase.from("cloud_accounts").delete().eq("company_id", companyId)
    if (cloudAccountsError) console.error("[v0] Error deleting cloud accounts:", cloudAccountsError)

    // 10. Delete cloud integrations
    const { error: integrationsError } = await supabase
      .from("cloud_integrations")
      .delete()
      .eq("company_id", companyId)
    if (integrationsError) console.error("[v0] Error deleting integrations:", integrationsError)

    // 11. Delete subscriptions
    const { error: subscriptionsError } = await supabase.from("subscriptions").delete().eq("company_id", companyId)
    if (subscriptionsError) console.error("[v0] Error deleting subscriptions:", subscriptionsError)

    // 12. Delete user profiles
    const { error: profilesError } = await supabase.from("profiles").delete().eq("company_id", companyId)
    if (profilesError) console.error("[v0] Error deleting profiles:", profilesError)

    // 13. Finally, delete the company
    const { error: companyError } = await supabase.from("companies").delete().eq("id", companyId)

    if (companyError) {
      console.error("[v0] Error deleting company:", companyError)
      return NextResponse.json({ error: "Failed to delete company: " + companyError.message }, { status: 500 })
    }

    console.log("[v0] Company and all associated data deleted successfully")

    return NextResponse.json({ success: true, message: "Company deleted successfully" })
  } catch (error) {
    console.error("[v0] Delete company error:", error)
    return NextResponse.json(
      { error: "Failed to delete company: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 }
    )
  }
}
