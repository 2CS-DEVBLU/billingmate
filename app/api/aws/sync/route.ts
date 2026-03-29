import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { AwsAPI } from "@/lib/aws/api"

export async function POST(request: NextRequest) {
  let logId: string | null = null
  const startTime = Date.now()

  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("profiles").select("company_id, role").eq("id", user.id).single()

    if (!profile?.company_id) {
      return NextResponse.json({ error: "No company found" }, { status: 400 })
    }

    const { integrationId, syncType = "manual" } = await request.json()

    if (!integrationId) {
      return NextResponse.json({ error: "Integration ID required" }, { status: 400 })
    }

    const { data: syncLog } = await supabase
      .from("sync_logs")
      .insert({
        company_id: profile.company_id,
        integration_id: integrationId,
        sync_type: syncType,
        status: "running",
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    logId = syncLog?.id || null

    // Get integration details
    const { data: integration } = await supabase
      .from("cloud_integrations")
      .select("*")
      .eq("id", integrationId)
      .eq("company_id", profile.company_id)
      .eq("provider", "aws")
      .single()

    if (!integration) {
      return NextResponse.json({ error: "Integration not found" }, { status: 404 })
    }

    const lastManualSync = integration.last_manual_sync ? new Date(integration.last_manual_sync) : null
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

    if (syncType === "manual" && lastManualSync && lastManualSync > fiveMinutesAgo) {
      if (logId) {
        await supabase
          .from("sync_logs")
          .update({
            status: "failed",
            completed_at: new Date().toISOString(),
            duration_seconds: Math.floor((Date.now() - startTime) / 1000),
            error_message: "Sync cooldown active",
          })
          .eq("id", logId)
      }

      const secondsRemaining = Math.ceil((lastManualSync.getTime() + 5 * 60 * 1000 - Date.now()) / 1000)
      return NextResponse.json(
        {
          error: "Please wait before syncing again",
          cooldownRemaining: secondsRemaining,
        },
        { status: 429 },
      )
    }

    // Update last sync timestamp immediately to prevent concurrent requests
    if (syncType === "manual") {
      await supabase
        .from("cloud_integrations")
        .update({ last_manual_sync: new Date().toISOString() })
        .eq("id", integrationId)
    } else if (syncType === "automated") {
      await supabase
        .from("cloud_integrations")
        .update({ last_auto_sync: new Date().toISOString() })
        .eq("id", integrationId)
    }

    // Initialize AWS API client
    const awsAPI = new AwsAPI({
      accessKeyId: integration.api_key,
      secretAccessKey: integration.config?.secret_access_key,
      region: integration.config?.region || "us-east-1",
    })

    // Fetch billing data for the last 12 months
    const now = new Date()
    const syncResults = []
    let totalRecords = 0
    let totalErrors = 0

    for (let i = 0; i < 12; i++) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const year = targetDate.getFullYear()
      const month = targetDate.getMonth() + 1

      try {
        const billingData = await awsAPI.fetchBillingData(year, month)

        // Insert or update billing history
        const { data: billingHistory, error: bhError } = await supabase
          .from("billing_history")
          .upsert(
            {
              company_id: profile.company_id,
              integration_id: integrationId,
              billing_period: billingData.billing_period,
              total_cost: billingData.total_cost,
              currency: "USD",
              raw_data: billingData,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: "integration_id,billing_period",
            },
          )
          .select()
          .single()

        if (bhError) {
          console.error("Error inserting AWS billing history:", bhError)
          continue
        }

        // Delete existing resource costs for this period
        await supabase.from("resource_costs").delete().eq("billing_history_id", billingHistory.id)

        if (billingData.resources.length > 0) {
          const resourceCosts = billingData.resources.map((resource) => ({
            billing_history_id: billingHistory.id,
            resource_type: resource.resource_type,
            resource_id: resource.resource_id,
            resource_name: resource.resource_name,
            cost: resource.cost,
            usage_hours: resource.usage_hours,
            region: resource.region,
            metadata: resource.metadata || {},
          }))

          const { error: rcError } = await supabase.from("resource_costs").insert(resourceCosts)

          if (rcError) {
            console.error("Error inserting AWS resource costs:", rcError)
          }
        }

        // Generate and store recommendations (only for current month)
        if (i === 0) {
          const recommendations = await awsAPI.generateRecommendations(billingData)

          for (const rec of recommendations) {
            await supabase.from("recommendations").insert({
              cloud_account_id: integration.id,
              title: rec.title,
              description: rec.description,
              potential_savings: rec.potential_savings,
              priority: rec.priority,
              status: "active",
            })
          }
        }

        totalRecords += 1 + billingData.resources.length

        syncResults.push({
          period: billingData.billing_period,
          total_cost: billingData.total_cost,
          resource_count: billingData.resources.length,
        })
      } catch (error) {
        console.error("Error syncing AWS month", year, month, error)
        totalErrors++
        syncResults.push({
          period: `${year}-${String(month).padStart(2, "0")}-01`,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    // Update last_sync timestamp
    await supabase.from("cloud_integrations").update({ last_sync: new Date().toISOString() }).eq("id", integrationId)

    if (logId) {
      await supabase
        .from("sync_logs")
        .update({
          status: totalErrors === 0 ? "success" : totalErrors < 12 ? "partial" : "failed",
          completed_at: new Date().toISOString(),
          duration_seconds: Math.floor((Date.now() - startTime) / 1000),
          records_synced: totalRecords,
          errors_count: totalErrors,
          sync_details: syncResults,
        })
        .eq("id", logId)
    }

    return NextResponse.json({
      success: true,
      message: "AWS billing data synced successfully",
      results: syncResults,
      logId,
    })
  } catch (error) {
    console.error("AWS sync error:", error)

    if (logId) {
      const supabase = await createClient()
      await supabase
        .from("sync_logs")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          duration_seconds: Math.floor((Date.now() - startTime) / 1000),
          errors_count: 1,
          error_message: error instanceof Error ? error.message : "Unknown error",
        })
        .eq("id", logId)
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to sync AWS billing data" },
      { status: 500 },
    )
  }
}
