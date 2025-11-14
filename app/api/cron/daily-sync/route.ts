import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// This endpoint should be called by a cron job (e.g., Vercel Cron, GitHub Actions, etc.)
// Add authentication header check in production
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret in production
    const authHeader = request.headers.get("authorization")
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()

    console.log("[v0] Starting automated daily sync")

    // Get all active integrations that have auto_sync_enabled
    const { data: integrations } = await supabase
      .from("cloud_integrations")
      .select("id, company_id, provider, auto_sync_enabled")
      .eq("is_active", true)
      .eq("auto_sync_enabled", true)

    if (!integrations || integrations.length === 0) {
      return NextResponse.json({ message: "No integrations to sync" })
    }

    const results = []

    for (const integration of integrations) {
      try {
        console.log("[v0] Syncing integration:", integration.id, integration.provider)

        // Call the appropriate sync endpoint based on provider
        if (integration.provider === "digitalocean") {
          const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/digitalocean/sync`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              integrationId: integration.id,
              syncType: "automated",
            }),
          })

          const data = await response.json()

          results.push({
            integration_id: integration.id,
            provider: integration.provider,
            status: response.ok ? "success" : "failed",
            message: data.message || data.error,
          })
        }
      } catch (error) {
        console.error("[v0] Error syncing integration:", integration.id, error)
        results.push({
          integration_id: integration.id,
          provider: integration.provider,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    console.log("[v0] Automated sync completed:", results)

    return NextResponse.json({
      success: true,
      message: "Automated sync completed",
      synced: results.length,
      results,
    })
  } catch (error) {
    console.error("[v0] Automated sync error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to run automated sync" },
      { status: 500 },
    )
  }
}
