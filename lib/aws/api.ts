// AWS API client for fetching billing and cost data via Cost Explorer
import {
  CostExplorerClient,
  GetCostAndUsageCommand,
  GetCostForecastCommand,
  type ResultByTime,
} from "@aws-sdk/client-cost-explorer"

export interface AwsConfig {
  accessKeyId: string
  secretAccessKey: string
  region: string
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

export class AwsAPI {
  private client: CostExplorerClient

  constructor(config: AwsConfig) {
    this.client = new CostExplorerClient({
      region: config.region || "us-east-1",
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    })
  }

  // Get cost and usage for a specific month grouped by service
  async getCostByService(startDate: string, endDate: string): Promise<ResultByTime[]> {
    const command = new GetCostAndUsageCommand({
      TimePeriod: {
        Start: startDate,
        End: endDate,
      },
      Granularity: "MONTHLY",
      Metrics: ["UnblendedCost", "UsageQuantity"],
      GroupBy: [
        {
          Type: "DIMENSION",
          Key: "SERVICE",
        },
      ],
    })

    const response = await this.client.send(command)
    return response.ResultsByTime || []
  }

  // Get cost forecast for the current month
  async getCostForecast(): Promise<number> {
    try {
      const now = new Date()
      const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
      const endDate = `${now.getFullYear()}-${String(now.getMonth() + 2 > 12 ? 1 : now.getMonth() + 2).padStart(2, "0")}-01`

      // Forecast only works for future dates
      if (startDate >= endDate) return 0

      const command = new GetCostForecastCommand({
        TimePeriod: {
          Start: startDate,
          End: endDate,
        },
        Granularity: "MONTHLY",
        Metric: "UNBLENDED_COST",
      })

      const response = await this.client.send(command)
      return parseFloat(response.Total?.Amount || "0")
    } catch {
      return 0
    }
  }

  // Fetch comprehensive billing data with resource breakdown
  async fetchBillingData(year: number, month: number): Promise<BillingData> {
    try {
      const startDate = `${year}-${String(month).padStart(2, "0")}-01`
      const nextMonth = month === 12 ? 1 : month + 1
      const nextYear = month === 12 ? year + 1 : year
      const endDate = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`

      const results = await this.getCostByService(startDate, endDate)

      const resources: ResourceCost[] = []
      let totalCost = 0

      for (const result of results) {
        for (const group of result.Groups || []) {
          const serviceName = group.Keys?.[0] || "Unknown Service"
          const cost = parseFloat(group.Metrics?.UnblendedCost?.Amount || "0")
          const usageQuantity = parseFloat(group.Metrics?.UsageQuantity?.Amount || "0")

          if (cost > 0) {
            const serviceId = serviceName.toLowerCase().replace(/[^a-z0-9]+/g, "-")

            resources.push({
              resource_type: this.categorizeService(serviceName),
              resource_id: serviceId,
              resource_name: serviceName,
              cost,
              metadata: {
                product: serviceName,
                usage_quantity: usageQuantity,
                currency: group.Metrics?.UnblendedCost?.Unit || "USD",
              },
            })

            totalCost += cost
          }
        }
      }

      return {
        billing_period: `${year}-${String(month).padStart(2, "0")}-01`,
        total_cost: totalCost,
        resources,
      }
    } catch (error) {
      console.error("Error fetching AWS billing data:", error)
      return {
        billing_period: `${year}-${String(month).padStart(2, "0")}-01`,
        total_cost: 0,
        resources: [],
      }
    }
  }

  // Categorize AWS service into resource types
  private categorizeService(serviceName: string): string {
    const name = serviceName.toLowerCase()
    if (name.includes("ec2") || name.includes("elastic compute")) return "compute"
    if (name.includes("rds") || name.includes("aurora") || name.includes("dynamodb") || name.includes("redshift")) return "database"
    if (name.includes("s3")) return "storage"
    if (name.includes("lambda") || name.includes("fargate") || name.includes("ecs")) return "serverless"
    if (name.includes("cloudfront") || name.includes("route 53") || name.includes("elb") || name.includes("elastic load") || name.includes("vpc") || name.includes("nat gateway")) return "networking"
    if (name.includes("sagemaker") || name.includes("bedrock")) return "ai_ml"
    if (name.includes("cloudwatch") || name.includes("cloudtrail")) return "monitoring"
    if (name.includes("sns") || name.includes("sqs") || name.includes("kinesis")) return "messaging"
    if (name.includes("ecr") || name.includes("eks") || name.includes("container")) return "containers"
    return "other"
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

    // Check for high EC2 costs
    const computeResources = billingData.resources.filter((r) => r.resource_type === "compute")
    const totalComputeCost = computeResources.reduce((sum, r) => sum + r.cost, 0)
    if (totalComputeCost > 100) {
      recommendations.push({
        title: "Evaluate Reserved Instances or Savings Plans",
        description: `Your EC2/compute spend is $${totalComputeCost.toFixed(2)}/month. Consider Reserved Instances or Savings Plans for predictable workloads to save up to 72%.`,
        potential_savings: totalComputeCost * 0.35,
        priority: "high",
      })
    }

    // Check for S3 storage costs
    const storageResources = billingData.resources.filter((r) => r.resource_type === "storage")
    const totalStorageCost = storageResources.reduce((sum, r) => sum + r.cost, 0)
    if (totalStorageCost > 50) {
      recommendations.push({
        title: "Optimize S3 Storage Classes",
        description: `Your S3 storage costs $${totalStorageCost.toFixed(2)}/month. Review S3 lifecycle policies and consider Intelligent-Tiering or Glacier for infrequently accessed data.`,
        potential_savings: totalStorageCost * 0.4,
        priority: "high",
      })
    }

    // Check for database costs
    const dbResources = billingData.resources.filter((r) => r.resource_type === "database")
    const totalDbCost = dbResources.reduce((sum, r) => sum + r.cost, 0)
    if (totalDbCost > 100) {
      recommendations.push({
        title: "Right-size Database Instances",
        description: `Database spending is $${totalDbCost.toFixed(2)}/month. Analyze RDS/Aurora instance utilization and consider downsizing underutilized instances or switching to Aurora Serverless.`,
        potential_savings: totalDbCost * 0.25,
        priority: "medium",
      })
    }

    // Check for networking costs (NAT Gateway, etc.)
    const networkResources = billingData.resources.filter((r) => r.resource_type === "networking")
    const totalNetworkCost = networkResources.reduce((sum, r) => sum + r.cost, 0)
    if (totalNetworkCost > 50) {
      recommendations.push({
        title: "Review Networking Costs",
        description: `Networking costs are $${totalNetworkCost.toFixed(2)}/month. NAT Gateways and data transfer can be expensive. Consider VPC endpoints for S3/DynamoDB access and review cross-AZ traffic.`,
        potential_savings: totalNetworkCost * 0.3,
        priority: "medium",
      })
    }

    // Check for serverless costs
    const serverlessResources = billingData.resources.filter((r) => r.resource_type === "serverless")
    const totalServerlessCost = serverlessResources.reduce((sum, r) => sum + r.cost, 0)
    if (totalServerlessCost > 50) {
      recommendations.push({
        title: "Optimize Lambda Functions",
        description: `Serverless spending is $${totalServerlessCost.toFixed(2)}/month. Review Lambda memory allocation, optimize cold starts, and consider Graviton2 (ARM) for better price-performance.`,
        potential_savings: totalServerlessCost * 0.2,
        priority: "low",
      })
    }

    // General recommendation if total cost is significant
    if (billingData.total_cost > 500 && recommendations.length === 0) {
      recommendations.push({
        title: "Review AWS Cost Allocation",
        description: `Your total AWS spend is $${billingData.total_cost.toFixed(2)}/month. Enable AWS Cost Allocation Tags and review AWS Trusted Advisor for optimization opportunities.`,
        potential_savings: billingData.total_cost * 0.15,
        priority: "medium",
      })
    }

    return recommendations
  }
}
