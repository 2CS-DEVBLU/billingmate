// Datadog API client for fetching billing and usage data
export interface DatadogConfig {
  apiKey: string
  appKey: string
}

export interface BillingData {
  billing_period: string
  total_cost: number
  resources: ResourceCost[]
}

export interface ResourceCost {
  resource_type: string
  resource_id: string
  resource_name: string
  cost: number
  usage_hours?: number
  region?: string
  metadata?: Record<string, any>
}

export class DatadogAPI {
  private apiKey: string
  private appKey: string
  private baseUrl = "https://api.datadoghq.com"

  constructor(config: DatadogConfig) {
    this.apiKey = config.apiKey
    this.appKey = config.appKey
  }

  private async fetch(endpoint: string) {
    const url = `${this.baseUrl}${endpoint}`
    console.log("[v0] Fetching from:", url)
    
    const response = await fetch(url, {
      headers: {
        "DD-API-KEY": this.apiKey,
        "DD-APPLICATION-KEY": this.appKey,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const body = await response.text()
      console.error("[v0] Datadog API error:", response.status, body)
      throw new Error(`Datadog API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // Get historical cost data (v2 endpoint)
  async getHistoricalCost(startMonth: string, endMonth?: string) {
    console.log("[v0] Fetching historical cost from", startMonth, "to", endMonth || startMonth)
    const endpoint = endMonth 
      ? `/api/v2/usage/historical_cost?start_month=${startMonth}&end_month=${endMonth}`
      : `/api/v2/usage/historical_cost?start_month=${startMonth}`
    return this.fetch(endpoint)
  }

  // Get estimated cost for current/previous month
  async getEstimatedCost() {
    console.log("[v0] Fetching estimated cost")
    return this.fetch(`/api/v2/usage/estimated_cost`)
  }

  // Get projected cost
  async getProjectedCost() {
    console.log("[v0] Fetching projected cost")
    return this.fetch(`/api/v2/usage/projected_cost`)
  }

  // Get billable summary (v1 endpoint)
  async getBillableSummary(month: string) {
    console.log("[v0] Fetching billable summary for", month)
    return this.fetch(`/api/v1/usage/billable-summary?month=${month}`)
  }

  // Get billing dimension mapping
  async getBillingDimensionMapping() {
    console.log("[v0] Fetching billing dimension mapping")
    return this.fetch(`/api/v2/usage/billing_dimension_mapping`)
  }

  // Fetch comprehensive billing data with resource breakdown
  async fetchBillingData(year: number, month: number): Promise<BillingData> {
    console.log("[v0] Fetching Datadog billing data for", year, month)

    try {
      const monthStr = `${year}-${String(month).padStart(2, "0")}`
      const resources: ResourceCost[] = []
      let totalCost = 0

      // Fetch historical cost for this specific month
      const historicalData = await this.getHistoricalCost(monthStr).catch((error) => {
        console.error("[v0] Error fetching historical cost:", error)
        return null
      })

      if (historicalData && historicalData.data) {
        // Process historical cost data
        for (const item of historicalData.data) {
          if (item.date === monthStr) {
            // Extract charges by product
            const charges = item.charges || []
            
            for (const charge of charges) {
              const productName = charge.product_name || charge.charge_type || "Unknown Product"
              const cost = parseFloat(charge.charge_amount || charge.cost || 0)
              
              if (cost > 0) {
                resources.push({
                  resource_type: charge.charge_type || "usage",
                  resource_id: charge.product_name?.toLowerCase().replace(/\s+/g, "-") || "unknown",
                  resource_name: productName,
                  cost: cost,
                  metadata: {
                    product: productName,
                    charge_type: charge.charge_type,
                    usage_type: charge.usage_type,
                    org_name: charge.org_name,
                  },
                })
                totalCost += cost
              }
            }
          }
        }
      }

      // If historical data is not available or current month, try billable summary
      if (resources.length === 0) {
        const summaryData = await this.getBillableSummary(monthStr).catch((error) => {
          console.error("[v0] Error fetching billable summary:", error)
          return null
        })

        if (summaryData && summaryData.usage) {
          // Process billable summary data
          const usage = summaryData.usage
          
          // Infrastructure monitoring
          if (usage.infra_hosts) {
            const infraCost = usage.infra_hosts * 15 // Approximate cost
            resources.push({
              resource_type: "infrastructure",
              resource_id: "infra-hosts",
              resource_name: `Infrastructure Monitoring (${usage.infra_hosts} hosts)`,
              cost: infraCost,
              metadata: {
                product: "Infrastructure Monitoring",
                host_count: usage.infra_hosts,
              },
            })
            totalCost += infraCost
          }

          // APM
          if (usage.apm_hosts) {
            const apmCost = usage.apm_hosts * 31
            resources.push({
              resource_type: "apm",
              resource_id: "apm-hosts",
              resource_name: `APM (${usage.apm_hosts} hosts)`,
              cost: apmCost,
              metadata: {
                product: "APM",
                host_count: usage.apm_hosts,
              },
            })
            totalCost += apmCost
          }

          // Logs
          if (usage.indexed_logs_usage) {
            const logsCost = usage.indexed_logs_usage * 0.10
            resources.push({
              resource_type: "logs",
              resource_id: "logs-indexed",
              resource_name: `Log Management (${usage.indexed_logs_usage.toFixed(2)} GB)`,
              cost: logsCost,
              metadata: {
                product: "Log Management",
                gb_indexed: usage.indexed_logs_usage,
              },
            })
            totalCost += logsCost
          }

          // Custom metrics
          if (usage.custom_timeseries) {
            const metricsCost = (usage.custom_timeseries / 1000000) * 0.05
            resources.push({
              resource_type: "metrics",
              resource_id: "custom-metrics",
              resource_name: `Custom Metrics (${usage.custom_timeseries.toLocaleString()})`,
              cost: metricsCost,
              metadata: {
                product: "Custom Metrics",
                metric_count: usage.custom_timeseries,
              },
            })
            totalCost += metricsCost
          }
        }
      }

      console.log("[v0] Total cost:", totalCost, "Resources:", resources.length)

      return {
        billing_period: `${year}-${String(month).padStart(2, "0")}-01`,
        total_cost: totalCost,
        resources,
      }
    } catch (error) {
      console.error("[v0] Error fetching Datadog billing data:", error)
      // Return empty data instead of throwing to allow sync to continue for other months
      return {
        billing_period: `${year}-${String(month).padStart(2, "0")}-01`,
        total_cost: 0,
        resources: [],
      }
    }
  }

  // Generate cost optimization recommendations
  async generateRecommendations(billingData: BillingData): Promise<
    Array<{
      title: string
      description: string
      potential_savings: number
      priority: string
    }>
  > {
    const recommendations = []

    // Check for high infrastructure costs
    const infraResource = billingData.resources.find((r) => r.resource_type === "infrastructure")
    if (infraResource && infraResource.cost > 200) {
      recommendations.push({
        title: "Optimize Infrastructure Monitoring",
        description: `Your infrastructure monitoring costs are significant ($${infraResource.cost.toFixed(2)}). Review host tagging and consider consolidating monitoring for development/staging environments.`,
        potential_savings: infraResource.cost * 0.2,
        priority: "high",
      })
    }

    // Check for expensive log ingestion
    const logsResource = billingData.resources.find((r) => r.resource_type === "logs")
    if (logsResource && logsResource.cost > 100) {
      recommendations.push({
        title: "Reduce Log Ingestion Costs",
        description: `Log management costs are high ($${logsResource.cost.toFixed(2)}). Consider implementing log sampling, filtering noisy logs, or reducing retention periods.`,
        potential_savings: logsResource.cost * 0.3,
        priority: "high",
      })
    }

    // Check for custom metrics overhead
    const metricsResource = billingData.resources.find((r) => r.resource_type === "metrics")
    if (metricsResource && metricsResource.cost > 50) {
      recommendations.push({
        title: "Audit Custom Metrics",
        description: `High custom metrics usage detected ($${metricsResource.cost.toFixed(2)}). Review and remove unused or redundant metrics to optimize costs.`,
        potential_savings: metricsResource.cost * 0.25,
        priority: "medium",
      })
    }

    // Check APM usage
    const apmResource = billingData.resources.find((r) => r.resource_type === "apm")
    if (apmResource && apmResource.cost > 150) {
      recommendations.push({
        title: "Optimize APM Coverage",
        description: `APM costs are substantial ($${apmResource.cost.toFixed(2)}). Consider enabling APM only for production environments or critical services.`,
        potential_savings: apmResource.cost * 0.3,
        priority: "medium",
      })
    }

    // General recommendation if total cost is significant
    if (billingData.total_cost > 500 && recommendations.length === 0) {
      recommendations.push({
        title: "Review Datadog Usage",
        description: `Your total Datadog costs are $${billingData.total_cost.toFixed(2)}/month. Consider reviewing your usage patterns and optimizing resource allocation.`,
        potential_savings: billingData.total_cost * 0.15,
        priority: "medium",
      })
    }

    return recommendations
  }
}
