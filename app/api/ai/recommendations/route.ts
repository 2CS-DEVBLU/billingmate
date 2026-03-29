import { createClient } from "@/lib/supabase/server"
import { checkSubscriptionLimits } from "@/lib/subscription-limits"
import { generateRecommendations, type FinOpsContext } from "@/lib/ai/finops-assistant"

export async function POST(req: Request) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single()

    if (!profile?.company_id) {
      return Response.json({ error: "No company found" }, { status: 400 })
    }

    const limits = await checkSubscriptionLimits(profile.company_id)
    if (!limits.canUseAI) {
      return Response.json({
        recommendations: [],
        message: "AI recommendations require a paid plan. Upgrade to unlock.",
        upgradeRequired: true,
      })
    }

    // Fetch all integrations for this company
    const { data: integrations } = await supabase
      .from("cloud_integrations")
      .select("id, provider")
      .eq("company_id", profile.company_id)
      .eq("is_active", true)

    if (!integrations || integrations.length === 0) {
      return Response.json({ recommendations: [], message: "No active integrations" })
    }

    // Fetch billing history (last 3 months, all providers)
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

    const { data: billingHistory } = await supabase
      .from("billing_history")
      .select("*")
      .in("integration_id", integrations.map((i) => i.id))
      .gte("billing_period", threeMonthsAgo.toISOString())
      .order("billing_period", { ascending: false })

    // Fetch resource costs
    const { data: resourceCosts } = await supabase
      .from("resource_costs")
      .select("*")
      .in("billing_history_id", billingHistory?.map((b) => b.id) || [])
      .order("cost", { ascending: false })

    const context: FinOpsContext = {
      companyId: profile.company_id,
      billingHistory: (billingHistory || []).map((b) => ({
        integration_id: b.integration_id,
        provider: integrations.find((i) => i.id === b.integration_id)?.provider,
        billing_period: b.billing_period,
        total_cost: b.total_cost,
      })),
      resourceCosts: (resourceCosts || []).map((r) => ({
        resource_type: r.resource_type,
        resource_name: r.resource_name,
        cost: r.cost,
        metadata: r.metadata,
      })),
      providers: [...new Set(integrations.map((i) => i.provider))],
    }

    const recommendations = await generateRecommendations(context)

    return Response.json({ recommendations })
  } catch (error) {
    console.error("Error generating AI recommendations:", error)
    return Response.json({ error: "Failed to generate recommendations" }, { status: 500 })
  }
}
