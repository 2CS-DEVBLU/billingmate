import { createClient } from '@/lib/supabase/server'
import { generateObject } from 'ai'
import { z } from 'zod'

const recommendationSchema = z.object({
  recommendations: z.array(
    z.object({
      title: z.string().describe('Short, actionable recommendation title'),
      description: z.string().describe('Detailed explanation of the recommendation and how to implement it'),
      potential_savings: z.number().describe('Estimated monthly savings in USD'),
      priority: z.enum(['high', 'medium', 'low']).describe('Priority level based on potential impact'),
      category: z.enum(['cost', 'performance', 'security', 'reliability']).describe('Type of recommendation'),
    })
  ),
})

export async function POST(req: Request) {
  try {
    console.log('[v0] Fetching AI recommendations')
    const { integrationId, timeRange } = await req.json()

    const supabase = await createClient()

    const { data: billingHistory, error: billingError } = await supabase
      .from('billing_history')
      .select('*')
      .eq('integration_id', integrationId)
      .order('billing_period', { ascending: false })
      .limit(timeRange === 1 ? 1 : timeRange === 3 ? 3 : timeRange === 6 ? 6 : 12)

    if (billingError) {
      console.error('[v0] Error fetching billing history:', billingError)
      return Response.json({ error: 'Failed to fetch billing history' }, { status: 500 })
    }

    const { data: resources, error: resourcesError } = await supabase
      .from('resource_costs')
      .select('*')
      .in('billing_history_id', billingHistory?.map(b => b.id) || [])
      .order('cost', { ascending: false })

    if (resourcesError) {
      console.error('[v0] Error fetching resources:', resourcesError)
      return Response.json({ error: 'Failed to fetch resources' }, { status: 500 })
    }

    const totalCost = billingHistory?.reduce((sum, b) => sum + (b.amount || 0), 0) || 0
    const avgMonthlyCost = totalCost / (billingHistory?.length || 1)
    const resourcesByType = resources?.reduce((acc, r) => {
      acc[r.resource_type] = acc[r.resource_type] || { count: 0, cost: 0 }
      acc[r.resource_type].count++
      acc[r.resource_type].cost += r.cost || 0
      return acc
    }, {} as Record<string, { count: number; cost: number }>)

    const topExpenses = resources?.slice(0, 5).map(r => ({
      name: r.resource_name,
      type: r.resource_type,
      cost: r.cost,
      metadata: r.metadata,
    }))

    const analysisPrompt = `You are a FinOps expert analyzing DigitalOcean cloud spending. Generate 3-5 actionable cost optimization recommendations based on this data:

**Spending Overview:**
- Total spend over ${timeRange} month(s): $${totalCost.toFixed(2)}
- Average monthly cost: $${avgMonthlyCost.toFixed(2)}
- Number of resources: ${resources?.length || 0}

**Resource Breakdown:**
${Object.entries(resourcesByType || {})
  .map(([type, data]) => `- ${type}: ${data.count} resources, $${data.cost.toFixed(2)}/mo`)
  .join('\n')}

**Top 5 Most Expensive Resources:**
${topExpenses?.map((r, i) => `${i + 1}. ${r.name} (${r.type}): $${r.cost?.toFixed(2)}/mo`).join('\n')}

Generate specific, actionable recommendations focusing on:
1. Right-sizing resources based on actual usage
2. Identifying unused or underutilized resources
3. Reserved capacity or commitment savings opportunities
4. Cost-effective alternatives for current services
5. Best practices for cloud cost optimization

Each recommendation should include concrete steps to implement and realistic savings estimates. Focus on DigitalOcean-specific optimizations like Spaces storage optimization, droplet sizing, bandwidth usage, and managed database configurations.`

    console.log('[v0] Generating recommendations with AI model')

    const { object } = await generateObject({
      model: 'openai/gpt-5',
      schema: recommendationSchema,
      messages: [
        {
          role: 'user',
          content: analysisPrompt,
        },
      ],
      maxOutputTokens: 2000,
      temperature: 0.7,
    })

    console.log('[v0] Generated', object.recommendations.length, 'AI recommendations')

    return Response.json({ recommendations: object.recommendations })
  } catch (error) {
    console.error('[v0] Error generating recommendations:', error)
    return Response.json({ error: 'Failed to generate recommendations' }, { status: 500 })
  }
}
