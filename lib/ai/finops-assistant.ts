import { generateText, streamText } from "ai"
import { xai } from "@ai-sdk/xai"

export interface FinOpsContext {
  companyId: string
  billingHistory: Array<{
    integration_id: string
    provider?: string
    billing_period: string
    total_cost: number
  }>
  resourceCosts: Array<{
    resource_type: string
    resource_name: string
    cost: number
    metadata?: Record<string, any>
  }>
  providers: string[]
}

export interface FinOpsRecommendation {
  title: string
  description: string
  potential_savings: number
  priority: "high" | "medium" | "low"
  category: "cost" | "performance" | "security" | "reliability"
  provider: string
  actionable_steps: string[]
}

const SYSTEM_PROMPT = `You are a senior FinOps specialist and cloud cost optimization expert.
You analyze cloud infrastructure spending across multiple providers (AWS, DigitalOcean, Datadog) and provide actionable recommendations.

Your expertise includes:
- AWS: EC2 rightsizing, Reserved Instances, Savings Plans, S3 lifecycle policies, NAT Gateway optimization, EBS cleanup
- DigitalOcean: Droplet rightsizing, database optimization, load balancer consolidation, storage management
- Datadog: Host optimization, log volume reduction, APM sampling, custom metrics audit
- Cross-provider: Cost allocation, idle resource detection, commitment strategies, forecasting

Rules:
1. Only analyze and optimize EXISTING resources - never suggest adding new services
2. Be specific - reference actual resource names and costs from the data
3. Calculate realistic savings based on actual usage patterns
4. Prioritize by impact: high (>20% savings), medium (10-20%), low (<10%)
5. Provide actionable steps, not vague suggestions
6. Always respond in the same language the user writes in`

const model = xai("grok-3-mini-fast")

function buildContextPrompt(context: FinOpsContext): string {
  const totalSpend = context.billingHistory.reduce((sum, b) => sum + b.total_cost, 0)
  const avgMonthly = totalSpend / (context.billingHistory.length || 1)

  const resourcesByType: Record<string, { count: number; cost: number; items: string[] }> = {}
  for (const r of context.resourceCosts) {
    if (!resourcesByType[r.resource_type]) {
      resourcesByType[r.resource_type] = { count: 0, cost: 0, items: [] }
    }
    resourcesByType[r.resource_type].count++
    resourcesByType[r.resource_type].cost += r.cost
    if (resourcesByType[r.resource_type].items.length < 5) {
      resourcesByType[r.resource_type].items.push(
        `${r.metadata?.product || r.resource_name}: $${r.cost.toFixed(2)}`
      )
    }
  }

  const topResources = [...context.resourceCosts]
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 10)

  return `
**Active Providers:** ${context.providers.join(", ")}

**Spending Summary (last ${context.billingHistory.length} months):**
- Total spend: $${totalSpend.toFixed(2)}
- Average monthly: $${avgMonthly.toFixed(2)}
- Active resources: ${context.resourceCosts.length}

**Monthly Breakdown:**
${context.billingHistory
  .sort((a, b) => b.billing_period.localeCompare(a.billing_period))
  .slice(0, 6)
  .map((b) => `- ${b.billing_period}: $${b.total_cost.toFixed(2)}`)
  .join("\n")}

**Resources by Category:**
${Object.entries(resourcesByType)
  .sort(([, a], [, b]) => b.cost - a.cost)
  .map(([type, data]) => `- ${type}: ${data.count} resources, $${data.cost.toFixed(2)}/mo\n  ${data.items.join(", ")}`)
  .join("\n")}

**Top 10 Cost Drivers:**
${topResources.map((r, i) => `${i + 1}. ${r.metadata?.product || r.resource_name} (${r.resource_type}): $${r.cost.toFixed(2)}`).join("\n")}
`
}

export async function generateRecommendations(
  context: FinOpsContext
): Promise<FinOpsRecommendation[]> {
  const contextPrompt = buildContextPrompt(context)

  const prompt = `${contextPrompt}

Based on this cloud spending data, generate 3-5 specific, actionable cost optimization recommendations.

Return ONLY valid JSON (no markdown, no extra text):
{
  "recommendations": [
    {
      "title": "Optimize [Specific Resource]",
      "description": "Detailed explanation with implementation steps",
      "potential_savings": 10.50,
      "priority": "high",
      "category": "cost",
      "provider": "aws",
      "actionable_steps": ["Step 1", "Step 2"]
    }
  ]
}`

  const { text } = await generateText({
    model,
    system: SYSTEM_PROMPT,
    prompt,
    maxOutputTokens: 2000,
    temperature: 0.4,
  })

  try {
    let cleaned = text.trim()
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "")
    }
    const parsed = JSON.parse(cleaned)
    return parsed.recommendations || []
  } catch {
    return []
  }
}

export async function analyzeSpike(
  context: FinOpsContext,
  spikeDetails: { period: string; expected: number; actual: number }
) {
  const contextPrompt = buildContextPrompt(context)

  const prompt = `${contextPrompt}

**COST SPIKE DETECTED:**
- Period: ${spikeDetails.period}
- Expected cost: $${spikeDetails.expected.toFixed(2)}
- Actual cost: $${spikeDetails.actual.toFixed(2)}
- Variance: +${((spikeDetails.actual - spikeDetails.expected) / spikeDetails.expected * 100).toFixed(1)}%

Analyze this cost spike. Explain the likely causes based on the resource data and suggest remediation steps.`

  const { text } = await generateText({
    model,
    system: SYSTEM_PROMPT,
    prompt,
    maxOutputTokens: 1000,
    temperature: 0.3,
  })

  return text
}

export function chatStream(
  context: FinOpsContext,
  messages: Array<{ role: "user" | "assistant"; content: string }>
) {
  const contextPrompt = buildContextPrompt(context)

  const systemWithContext = `${SYSTEM_PROMPT}

Here is the current cloud spending data for this company:
${contextPrompt}

Use this data to answer the user's questions about their cloud costs. Be specific, reference actual numbers, and provide actionable advice.`

  return streamText({
    model,
    system: systemWithContext,
    messages,
    maxOutputTokens: 1500,
    temperature: 0.5,
  })
}

export async function generateMonthlyReport(context: FinOpsContext): Promise<string> {
  const contextPrompt = buildContextPrompt(context)

  const { text } = await generateText({
    model,
    system: SYSTEM_PROMPT,
    prompt: `${contextPrompt}

Generate a concise monthly FinOps report summarizing:
1. Total spend and trend (increasing/decreasing/stable)
2. Top 3 cost drivers
3. Key optimization opportunities
4. Forecast for next month

Format as clean markdown.`,
    maxOutputTokens: 1500,
    temperature: 0.3,
  })

  return text
}
