import { NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"

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

    const serviceSupabase = await createServiceClient()
    
    const { data: companyCheck, error: companyCheckError } = await serviceSupabase
      .from("companies")
      .select("id, name")
      .eq("id", companyId)
      .single()
    
    if (companyCheckError || !companyCheck) {
      console.error("[v0] Company not found:", companyCheckError)
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }
    
    console.log("[v0] Deleting company:", companyCheck.name)
    
    // Delete all related data in order (respecting foreign key constraints)
    
    // 1. Delete user invitations
    const { data: deletedInvitations, error: invitationsError } = await serviceSupabase
      .from("user_invitations")
      .delete()
      .eq("company_id", companyId)
      .select()
    console.log("[v0] Deleted invitations:", deletedInvitations?.length || 0, "Error:", invitationsError)
    
    // 2. Delete alerts
    const { data: deletedAlerts, error: alertsError } = await serviceSupabase
      .from("alerts")
      .delete()
      .eq("company_id", companyId)
      .select()
    console.log("[v0] Deleted alerts:", deletedAlerts?.length || 0, "Error:", alertsError)

    // 3. Delete cost anomalies
    const { data: deletedAnomalies, error: anomaliesError } = await serviceSupabase
      .from("cost_anomalies")
      .delete()
      .eq("company_id", companyId)
      .select()
    console.log("[v0] Deleted anomalies:", deletedAnomalies?.length || 0, "Error:", anomaliesError)

    // 4. Delete sync logs
    const { data: deletedSyncLogs, error: syncLogsError } = await serviceSupabase
      .from("sync_logs")
      .delete()
      .eq("company_id", companyId)
      .select()
    console.log("[v0] Deleted sync logs:", deletedSyncLogs?.length || 0, "Error:", syncLogsError)

    // 5. Delete resource costs (linked to billing history)
    const { data: billingHistory } = await serviceSupabase
      .from("billing_history")
      .select("id")
      .eq("company_id", companyId)
    
    console.log("[v0] Found billing history records:", billingHistory?.length || 0)
    
    if (billingHistory && billingHistory.length > 0) {
      const billingIds = billingHistory.map((b) => b.id)
      const { data: deletedResourceCosts, error: resourceCostsError } = await serviceSupabase
        .from("resource_costs")
        .delete()
        .in("billing_history_id", billingIds)
        .select()
      console.log("[v0] Deleted resource costs:", deletedResourceCosts?.length || 0, "Error:", resourceCostsError)
    }

    // 6. Delete billing history
    const { data: deletedBilling, error: billingError } = await serviceSupabase
      .from("billing_history")
      .delete()
      .eq("company_id", companyId)
      .select()
    console.log("[v0] Deleted billing history:", deletedBilling?.length || 0, "Error:", billingError)

    // 7. Delete recommendations (linked to cloud accounts)
    const { data: cloudAccounts } = await serviceSupabase
      .from("cloud_accounts")
      .select("id")
      .eq("company_id", companyId)
    
    console.log("[v0] Found cloud accounts:", cloudAccounts?.length || 0)
    
    if (cloudAccounts && cloudAccounts.length > 0) {
      const accountIds = cloudAccounts.map((a) => a.id)
      const { data: deletedRecommendations, error: recommendationsError } = await serviceSupabase
        .from("recommendations")
        .delete()
        .in("cloud_account_id", accountIds)
        .select()
      console.log("[v0] Deleted recommendations:", deletedRecommendations?.length || 0, "Error:", recommendationsError)

      // 8. Delete cost data
      const { data: deletedCostData, error: costDataError } = await serviceSupabase
        .from("cost_data")
        .delete()
        .in("cloud_account_id", accountIds)
        .select()
      console.log("[v0] Deleted cost data:", deletedCostData?.length || 0, "Error:", costDataError)
    }

    // 9. Delete cloud accounts
    const { data: deletedCloudAccounts, error: cloudAccountsError } = await serviceSupabase
      .from("cloud_accounts")
      .delete()
      .eq("company_id", companyId)
      .select()
    console.log("[v0] Deleted cloud accounts:", deletedCloudAccounts?.length || 0, "Error:", cloudAccountsError)

    // 10. Delete cloud integrations
    const { data: deletedIntegrations, error: integrationsError } = await serviceSupabase
      .from("cloud_integrations")
      .delete()
      .eq("company_id", companyId)
      .select()
    console.log("[v0] Deleted integrations:", deletedIntegrations?.length || 0, "Error:", integrationsError)

    // 11. Delete subscriptions
    const { data: deletedSubscriptions, error: subscriptionsError } = await serviceSupabase
      .from("subscriptions")
      .delete()
      .eq("company_id", companyId)
      .select()
    console.log("[v0] Deleted subscriptions:", deletedSubscriptions?.length || 0, "Error:", subscriptionsError)

    // 12. Delete user profiles
    const { data: deletedProfiles, error: profilesError } = await serviceSupabase
      .from("profiles")
      .delete()
      .eq("company_id", companyId)
      .select()
    console.log("[v0] Deleted profiles:", deletedProfiles?.length || 0, "Error:", profilesError)

    // 13. Finally, delete the company
    const { data: deletedCompany, error: companyError } = await serviceSupabase
      .from("companies")
      .delete()
      .eq("id", companyId)
      .select()

    console.log("[v0] Deleted company:", deletedCompany?.length || 0, "Error:", companyError)

    if (companyError) {
      console.error("[v0] Error deleting company:", companyError)
      return NextResponse.json({ error: "Failed to delete company: " + companyError.message }, { status: 500 })
    }
    
    const { data: verifyDeleted } = await serviceSupabase
      .from("companies")
      .select("id")
      .eq("id", companyId)
      .maybeSingle()
    
    if (verifyDeleted) {
      console.error("[v0] CRITICAL: Company still exists after deletion!")
      return NextResponse.json({ error: "Company deletion verification failed - data still exists" }, { status: 500 })
    }

    console.log("[v0] Company deletion verified - company no longer exists")

    return NextResponse.json({ success: true, message: "Company deleted successfully" })
  } catch (error) {
    console.error("[v0] Delete company error:", error)
    return NextResponse.json(
      { error: "Failed to delete company: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 }
    )
  }
}
