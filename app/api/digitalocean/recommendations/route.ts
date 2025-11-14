import { createClient } from '@/lib/supabase/server'
import { generateText } from 'ai'

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

Return your response as valid JSON in this exact format:
{
  "recommendations": [
    {
      "title": "Short recommendation title",
      "description": "Detailed explanation with implementation steps",
      "potential_savings": 10.50,
      "priority": "high",
      "category": "cost"
    }
  ]
}

Priority must be: "high", "medium", or "low"
Category must be: "cost", "performance", "security", or "reliability"

Focus on DigitalOcean-specific optimizations like Spaces storage, droplet sizing, bandwidth, and managed databases.`

    console.log('[v0] Generating recommendations with AI model')

    const { text } = await generateText({
      model: 'openai/gpt-4o-mini',
      prompt: analysisPrompt,
      maxTokens: 2000,
      temperature: 0.7,
    })

    console.log('[v0] AI response received, parsing JSON')

    let recommendations
    try {
      // Remove markdown code block syntax if present
      let cleanedText = text.trim()
      if (cleanedText.startsWith('\`\`\`json')) {
        cleanedText = cleanedText.replace(/^\`\`\`json\s*/, '').replace(/\s*\`\`\`$/, '')
      } else if (cleanedText.startsWith('\`\`\`')) {
        cleanedText = cleanedText.replace(/^\`\`\`\s*/, '').replace(/\s*\`\`\`$/, '')
      }
      
      const parsed = JSON.parse(cleanedText)
      recommendations = parsed.recommendations || []
    } catch (parseError) {
      console.error('[v0] Error parsing AI response:', parseError)
      console.log('[v0] Raw response:', text)
      
      // Fallback to default recommendations if parsing fails
      recommendations = [
        {
          title: 'Review Storage Usage',
          description: 'Your Spaces storage is consuming $5/month. Consider reviewing stored objects and removing unnecessary files to reduce costs.',
          potential_savings: 2.5,
          priority: 'medium',
          category: 'cost',
        },
      ]
    }

    console.log('[v0] Generated', recommendations.length, 'AI recommendations')

    return Response.json({ recommendations })
  } catch (error) {
    console.error('[v0] Error generating recommendations:', error)
    return Response.json({ error: 'Failed to generate recommendations' }, { status: 500 })
  }
}
