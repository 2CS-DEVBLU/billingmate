import { createClient } from "@/lib/supabase/server"
import { checkSubscriptionLimits } from "@/lib/subscription-limits"
import { chatStream, type FinOpsContext } from "@/lib/ai/finops-assistant"

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
      return Response.json({ error: "AI chat requires a paid plan" }, { status: 403 })
    }

    const { messages } = await req.json()

    // Fetch all integrations
    const { data: integrations } = await supabase
      .from("cloud_integrations")
      .select("id, provider")
      .eq("company_id", profile.company_id)
      .eq("is_active", true)

    // Fetch billing history (last 3 months)
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

    const { data: billingHistory } = await supabase
      .from("billing_history")
      .select("*")
      .in("integration_id", (integrations || []).map((i) => i.id))
      .gte("billing_period", threeMonthsAgo.toISOString())
      .order("billing_period", { ascending: false })

    const { data: resourceCosts } = await supabase
      .from("resource_costs")
      .select("*")
      .in("billing_history_id", (billingHistory || []).map((b) => b.id))
      .order("cost", { ascending: false })
      .limit(50)

    const context: FinOpsContext = {
      companyId: profile.company_id,
      billingHistory: (billingHistory || []).map((b) => ({
        integration_id: b.integration_id,
        provider: integrations?.find((i) => i.id === b.integration_id)?.provider,
        billing_period: b.billing_period,
        total_cost: b.total_cost,
      })),
      resourceCosts: (resourceCosts || []).map((r) => ({
        resource_type: r.resource_type,
        resource_name: r.resource_name,
        cost: r.cost,
        metadata: r.metadata,
      })),
      providers: [...new Set((integrations || []).map((i) => i.provider))],
    }

    const result = chatStream(context, messages)

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Error in AI chat:", error)
    return Response.json({ error: "Failed to process chat" }, { status: 500 })
  }
}
