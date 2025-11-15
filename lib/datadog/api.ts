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
  private baseUrl = "https://api.datadoghq.com/api/v2"

  constructor(config: DatadogConfig) {
    this.apiKey = config.apiKey
    this.appKey = config.appKey
  }

  private async fetch(endpoint: string) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        "DD-API-KEY": this.apiKey,
        "DD-APPLICATION-KEY": this.appKey,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Datadog API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // Get usage data for monitoring
  async getUsageSummary(startDate: string, endDate: string) {
    console.log("[v0] Fetching Datadog usage summary from", startDate, "to", endDate)
    return this.fetch(`/usage/summary?start_date=${startDate}&end_date=${endDate}`)
  }

  // Get hosts usage
  async getHostsUsage(startDate: string, endDate: string) {
    console.log("[v0] Fetching hosts usage")
    return this.fetch(`/usage/hosts?start_date=${startDate}&end_date=${endDate}`)
  }

  // Get logs usage
  async getLogsUsage(startDate: string, endDate: string) {
    console.log("[v0] Fetching logs usage")
    return this.fetch(`/usage/logs?start_date=${startDate}&end_date=${endDate}`)
  }

  // Get metrics usage
  async getMetricsUsage(startDate: string, endDate: string) {
    console.log("[v0] Fetching metrics usage")
    return this.fetch(`/usage/timeseries?start_date=${startDate}&end_date=${endDate}`)
  }

  // Get APM usage
  async getAPMUsage(startDate: string, endDate: string) {
    console.log("[v0] Fetching APM usage")
    return this.fetch(`/usage/traces?start_date=${startDate}&end_date=${endDate}`)
  }

  // Get synthetics usage
  async getSyntheticsUsage(startDate: string, endDate: string) {
    console.log("[v0] Fetching synthetics usage")
    return this.fetch(`/usage/synthetics?start_date=${startDate}&end_date=${endDate}`)
  }

  // Get RUM (Real User Monitoring) usage
  async getRUMUsage(startDate: string, endDate: string) {
    console.log("[v0] Fetching RUM usage")
    return this.fetch(`/usage/rum_sessions?start_date=${startDate}&end_date=${endDate}`)
  }

  // Pricing estimates based on Datadog pricing (approximate)
  private readonly PRICING = {
    host_per_month: 15, // Infrastructure monitoring per host
    apm_host_per_month: 31, // APM per host
    logs_per_gb: 0.10, // Log management per GB ingested
    metrics_per_million: 0.05, // Custom metrics per million
    synthetics_per_test: 5, // Synthetics per test per month
    rum_per_1k_sessions: 1.5, // RUM per 1,000 sessions
  }

  // Fetch comprehensive billing data with resource breakdown
  async fetchBillingData(year: number, month: number): Promise<BillingData> {
    console.log("[v0] Fetching Datadog billing data for", year, month)

    try {
      // Calculate date range for the month
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0)
      const startDateStr = startDate.toISOString().split("T")[0]
      const endDateStr = endDate.toISOString().split("T")[0]

      // Fetch all usage data in parallel
      const [hostsUsage, logsUsage, metricsUsage, apmUsage, syntheticsUsage, rumUsage] = await Promise.all([
        this.getHostsUsage(startDateStr, endDateStr).catch(() => ({ usage: [] })),
        this.getLogsUsage(startDateStr, endDateStr).catch(() => ({ usage: [] })),
        this.getMetricsUsage(startDateStr, endDateStr).catch(() => ({ usage: [] })),
        this.getAPMUsage(startDateStr, endDateStr).catch(() => ({ usage: [] })),
        this.getSyntheticsUsage(startDateStr, endDateStr).catch(() => ({ usage: [] })),
        this.getRUMUsage(startDateStr, endDateStr).catch(() => ({ usage: [] })),
      ])

      console.log("[v0] Fetched usage data for all Datadog services")

      const resources: ResourceCost[] = []
      let totalCost = 0

      // Process hosts usage
      if (hostsUsage.usage && hostsUsage.usage.length > 0) {
        const totalHosts = hostsUsage.usage.reduce((sum: number, day: any) => {
          return sum + (day.host_count || 0)
        }, 0)
        const avgHosts = Math.ceil(totalHosts / hostsUsage.usage.length)
        const hostsCost = avgHosts * this.PRICING.host_per_month

        if (avgHosts > 0) {
          resources.push({
            resource_type: "infrastructure",
            resource_id: "hosts-monitoring",
            resource_name: `Infrastructure Monitoring (${avgHosts} hosts)`,
            cost: hostsCost,
            metadata: {
              avg_hosts: avgHosts,
              product: "Infrastructure Monitoring",
            },
          })
          totalCost += hostsCost
        }
      }

      // Process APM usage
      if (apmUsage.usage && apmUsage.usage.length > 0) {
        const totalAPMHosts = apmUsage.usage.reduce((sum: number, day: any) => {
          return sum + (day.apm_host_count || 0)
        }, 0)
        const avgAPMHosts = Math.ceil(totalAPMHosts / apmUsage.usage.length)
        const apmCost = avgAPMHosts * this.PRICING.apm_host_per_month

        if (avgAPMHosts > 0) {
          resources.push({
            resource_type: "apm",
            resource_id: "apm-monitoring",
            resource_name: `APM & Distributed Tracing (${avgAPMHosts} hosts)`,
            cost: apmCost,
            metadata: {
              avg_apm_hosts: avgAPMHosts,
              product: "APM",
            },
          })
          totalCost += apmCost
        }
      }

      // Process logs usage
      if (logsUsage.usage && logsUsage.usage.length > 0) {
        const totalLogsGB = logsUsage.usage.reduce((sum: number, day: any) => {
          return sum + (day.ingested_logs_bytes || 0) / (1024 * 1024 * 1024)
        }, 0)
        const logsCost = totalLogsGB * this.PRICING.logs_per_gb

        if (totalLogsGB > 0) {
          resources.push({
            resource_type: "logs",
            resource_id: "logs-management",
            resource_name: `Log Management (${totalLogsGB.toFixed(2)} GB)`,
            cost: logsCost,
            metadata: {
              total_gb: totalLogsGB,
              product: "Log Management",
            },
          })
          totalCost += logsCost
        }
      }

      // Process metrics usage
      if (metricsUsage.usage && metricsUsage.usage.length > 0) {
        const totalMetrics = metricsUsage.usage.reduce((sum: number, day: any) => {
          return sum + (day.num_custom_timeseries || 0)
        }, 0)
        const avgMetrics = totalMetrics / metricsUsage.usage.length
        const metricsCost = (avgMetrics / 1000000) * this.PRICING.metrics_per_million

        if (avgMetrics > 0) {
          resources.push({
            resource_type: "metrics",
            resource_id: "custom-metrics",
            resource_name: `Custom Metrics (${Math.round(avgMetrics).toLocaleString()})`,
            cost: metricsCost,
            metadata: {
              avg_metrics: avgMetrics,
              product: "Custom Metrics",
            },
          })
          totalCost += metricsCost
        }
      }

      // Process synthetics usage
      if (syntheticsUsage.usage && syntheticsUsage.usage.length > 0) {
        const totalTests = syntheticsUsage.usage.reduce((sum: number, day: any) => {
          return sum + (day.check_calls_count || 0)
        }, 0)
        const avgTests = Math.ceil(totalTests / syntheticsUsage.usage.length / 30) // Approximate tests per day to monthly
        const syntheticsCost = avgTests * this.PRICING.synthetics_per_test

        if (avgTests > 0) {
          resources.push({
            resource_type: "synthetics",
            resource_id: "synthetics-monitoring",
            resource_name: `Synthetic Monitoring (${avgTests} tests)`,
            cost: syntheticsCost,
            metadata: {
              avg_tests: avgTests,
              product: "Synthetic Monitoring",
            },
          })
          totalCost += syntheticsCost
        }
      }

      // Process RUM usage
      if (rumUsage.usage && rumUsage.usage.length > 0) {
        const totalSessions = rumUsage.usage.reduce((sum: number, day: any) => {
          return sum + (day.session_count || 0)
        }, 0)
        const rumCost = (totalSessions / 1000) * this.PRICING.rum_per_1k_sessions

        if (totalSessions > 0) {
          resources.push({
            resource_type: "rum",
            resource_id: "rum-monitoring",
            resource_name: `Real User Monitoring (${totalSessions.toLocaleString()} sessions)`,
            cost: rumCost,
            metadata: {
              total_sessions: totalSessions,
              product: "RUM",
            },
          })
          totalCost += rumCost
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
      throw error
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

    // Check for high host count
    const infraResource = billingData.resources.find((r) => r.resource_type === "infrastructure")
    if (infraResource && infraResource.cost > 200) {
      recommendations.push({
        title: "Optimize Infrastructure Monitoring",
        description: `Your infrastructure monitoring costs are significant. Review host tagging and consider consolidating monitoring for development/staging environments.`,
        potential_savings: infraResource.cost * 0.2,
        priority: "high",
      })
    }

    // Check for expensive log ingestion
    const logsResource = billingData.resources.find((r) => r.resource_type === "logs")
    if (logsResource && logsResource.cost > 100) {
      recommendations.push({
        title: "Reduce Log Ingestion Costs",
        description: `Log management costs are high. Consider implementing log sampling, filtering noisy logs, or reducing retention periods.`,
        potential_savings: logsResource.cost * 0.3,
        priority: "high",
      })
    }

    // Check for custom metrics overhead
    const metricsResource = billingData.resources.find((r) => r.resource_type === "metrics")
    if (metricsResource && metricsResource.cost > 50) {
      recommendations.push({
        title: "Audit Custom Metrics",
        description: `High custom metrics usage detected. Review and remove unused or redundant metrics to optimize costs.`,
        potential_savings: metricsResource.cost * 0.25,
        priority: "medium",
      })
    }

    // Check APM usage
    const apmResource = billingData.resources.find((r) => r.resource_type === "apm")
    if (apmResource && apmResource.cost > 150) {
      recommendations.push({
        title: "Optimize APM Coverage",
        description: `APM costs are substantial. Consider enabling APM only for production environments or critical services.`,
        potential_savings: apmResource.cost * 0.3,
        priority: "medium",
      })
    }

    return recommendations
  }
}
