import { createClient } from "@/lib/supabase/server"

export async function checkSubscriptionLimits(companyId: string) {
  const supabase = await createClient()
  
  // Get subscription
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("company_id", companyId)
    .single()
  
  if (!subscription) {
    return {
      hasActiveSubscription: false,
      canAddIntegration: false,
      canUseAI: false,
      maxAnalysisMonths: 3,
      isOverSpendLimit: false,
      limits: null
    }
  }
  
  // Check integration count
  const { data: integrations } = await supabase
    .from("cloud_integrations")
    .select("id")
    .eq("company_id", companyId)
    .eq("is_active", true)
  
  const integrationCount = integrations?.length || 0
  const canAddIntegration = integrationCount < (subscription.max_integrations || 1)
  
  // Check monthly spend
  const { data: billingData } = await supabase
    .from("billing_history")
    .select("total_cost")
    .eq("company_id", companyId)
    .gte("billing_period", new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString())
  
  const currentMonthSpend = billingData?.reduce((sum, b) => sum + Number(b.total_cost), 0) || 0
  const isOverSpendLimit = currentMonthSpend > (subscription.max_cloud_spend || 5000)
  
  return {
    hasActiveSubscription: subscription.status === 'active',
    canAddIntegration,
    canUseAI: subscription.ai_recommendations_enabled || false,
    maxAnalysisMonths: subscription.max_analysis_months || 3,
    isOverSpendLimit,
    limits: {
      maxIntegrations: subscription.max_integrations || 1,
      currentIntegrations: integrationCount,
      maxCloudSpend: subscription.max_cloud_spend || 5000,
      currentCloudSpend: currentMonthSpend,
      maxAnalysisMonths: subscription.max_analysis_months || 3,
      aiRecommendationsEnabled: subscription.ai_recommendations_enabled || false,
    }
  }
}
