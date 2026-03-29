import { createClient } from '@/lib/supabase/server'
import { generateText } from 'ai'
import { xai } from '@ai-sdk/xai'
import { checkSubscriptionLimits } from '@/lib/subscription-limits'

export async function POST(req: Request) {
  try {
    const { integrationId, timeRange } = await req.json()

    const supabase = await createClient()

    const { data: integration } = await supabase
      .from('cloud_integrations')
      .select('company_id')
      .eq('id', integrationId)
      .single()

    if (!integration) {
      return Response.json({ error: 'Integration not found' }, { status: 404 })
    }

    const limits = await checkSubscriptionLimits(integration.company_id)

    if (!limits.canUseAI) {
      return Response.json({
        recommendations: [],
        message: 'AI recommendations are not available on your current plan. Upgrade to Starter or Professional plan to unlock AI-powered insights.',
        upgradeRequired: true
      })
    }

    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

    const { data: billingHistory, error: billingError } = await supabase
      .from('billing_history')
      .select('*')
      .eq('integration_id', integrationId)
      .gte('billing_period', threeMonthsAgo.toISOString())
      .order('billing_period', { ascending: false })

    if (billingError) {
      return Response.json({ error: 'Failed to fetch billing history' }, { status: 500 })
    }

    const { data: resources, error: resourcesError } = await supabase
      .from('resource_costs')
      .select('*')
      .in('billing_history_id', billingHistory?.map(b => b.id) || [])
      .order('cost', { ascending: false })

    if (resourcesError) {
      return Response.json({ error: 'Failed to fetch resources' }, { status: 500 })
    }

    const activeServices = new Set<string>()
    const serviceDetails: Record<string, { count: number; cost: number; products: Set<string> }> = {}

    resources?.forEach(r => {
      const product = r.metadata?.product || r.resource_name || r.resource_type
      activeServices.add(product)

      if (!serviceDetails[r.resource_type]) {
        serviceDetails[r.resource_type] = { count: 0, cost: 0, products: new Set() }
      }
      serviceDetails[r.resource_type].count++
      serviceDetails[r.resource_type].cost += r.cost || 0
      if (product) serviceDetails[r.resource_type].products.add(product)
    })

    const totalCost = billingHistory?.reduce((sum, b) => sum + (b.total_cost || 0), 0) || 0
    const avgMonthlyCost = totalCost / (billingHistory?.length || 1)

    const topExpenses = resources?.slice(0, 10).map(r => ({
      name: r.metadata?.product || r.resource_name || 'Unknown',
      type: r.resource_type,
      cost: r.cost,
    }))

    const analysisPrompt = `You are a FinOps expert analyzing Amazon Web Services (AWS) cloud spending for the LAST 3 MONTHS ONLY.

**CRITICAL CONTEXT - Currently Active AWS Services:**
${Array.from(activeServices).map(s => `✓ ${s}`).join('\n')}

**Spending Analysis (Last 3 Months):**
- Total spend: $${totalCost.toFixed(2)}
- Average monthly cost: $${avgMonthlyCost.toFixed(2)}
- Number of active services: ${resources?.length || 0}
- Analysis period: Last 3 months

**Resource Usage by Category:**
${Object.entries(serviceDetails)
  .map(([type, data]) => {
    const products = Array.from(data.products).join(', ')
    return `- ${type}: ${data.count} services ($${data.cost.toFixed(2)}/mo total)
  Active: ${products}`
  })
  .join('\n')}

**Top 10 Cost Drivers:**
${topExpenses?.map((r, i) =>
  `${i + 1}. ${r.name} (${r.type}): $${r.cost?.toFixed(2)}/mo`
).join('\n')}

**IMPORTANT RULES:**
1. DO NOT suggest services that are already active (see list above)
2. Only analyze data from the last 3 months
3. Focus on optimizing EXISTING services, not adding new ones
4. Be specific about which service to optimize (use exact names)
5. Calculate realistic savings based on actual usage patterns

Generate 3-5 specific, actionable AWS cost optimization recommendations:
- Reserved Instances / Savings Plans for steady-state EC2, RDS, ElastiCache
- S3 lifecycle policies and Intelligent-Tiering
- Right-sizing EC2 instances based on utilization
- Idle or underutilized RDS/ElastiCache instances
- NAT Gateway optimization and VPC endpoint usage
- Unused EBS volumes and snapshots
- Lambda memory/timeout optimization

Return ONLY valid JSON in this format (no markdown, no extra text):
{
  "recommendations": [
    {
      "title": "Optimize [Specific AWS Service]",
      "description": "Detailed explanation with implementation steps based on actual 3-month usage",
      "potential_savings": 10.50,
      "priority": "high",
      "category": "cost"
    }
  ]
}

Priority: "high" | "medium" | "low"
Category: "cost" | "performance" | "security" | "reliability"`

    const { text } = await generateText({
      model: xai('grok-3-mini-fast'),
      prompt: analysisPrompt,
      maxOutputTokens: 2000,
      temperature: 0.5,
    })

    let recommendations
    try {
      let cleanedText = text.trim()
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }

      const parsed = JSON.parse(cleanedText)
      recommendations = parsed.recommendations || []
    } catch (parseError) {
      recommendations = [
        {
          title: 'Review AWS Cost Allocation',
          description: 'Enable Cost Allocation Tags and review AWS Trusted Advisor recommendations for optimization opportunities across your account.',
          potential_savings: 0,
          priority: 'low',
          category: 'cost',
        },
      ]
    }

    return Response.json({ recommendations })
  } catch (error) {
    console.error('Error generating AWS recommendations:', error)
    return Response.json({ error: 'Failed to generate recommendations' }, { status: 500 })
  }
}
