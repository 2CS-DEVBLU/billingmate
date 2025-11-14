// DigitalOcean API client for fetching billing and resource data
export interface DigitalOceanConfig {
  apiToken: string
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
  size_slug?: string
  metadata?: Record<string, any>
}

export class DigitalOceanAPI {
  private apiToken: string
  private baseUrl = "https://api.digitalocean.com/v2"

  constructor(config: DigitalOceanConfig) {
    this.apiToken = config.apiToken
  }

  private async fetch(endpoint: string) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`DigitalOcean API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // Get account balance and billing history
  async getBalance() {
    console.log("[v0] Fetching balance from /v2/customers/my/balance")
    return this.fetch("/customers/my/balance")
  }

  // Get billing history - returns invoices and payment events
  async getBillingHistory() {
    console.log("[v0] Fetching billing history from /v2/customers/my/billing_history")
    return this.fetch("/customers/my/billing_history")
  }

  // Get invoices for detailed billing information
  async getInvoices() {
    console.log("[v0] Fetching invoices from /v2/customers/my/invoices")
    return this.fetch("/customers/my/invoices")
  }

  // Get invoice by ID
  async getInvoiceById(invoiceUuid: string) {
    console.log("[v0] Fetching invoice details for", invoiceUuid)
    return this.fetch(`/customers/my/invoices/${invoiceUuid}`)
  }

  // Get all droplets
  async getDroplets() {
    return this.fetch("/droplets")
  }

  // Get all databases
  async getDatabases() {
    return this.fetch("/databases")
  }

  // Get all load balancers
  async getLoadBalancers() {
    return this.fetch("/load_balancers")
  }

  // Get all volumes (block storage)
  async getVolumes() {
    return this.fetch("/volumes")
  }

  // Get all spaces (object storage)
  async getSpaces() {
    return this.fetch("/spaces")
  }

  // Fetch comprehensive billing data with resource breakdown
  async fetchBillingData(year: number, month: number): Promise<BillingData> {
    console.log("[v0] Fetching DigitalOcean billing data for", year, month)

    try {
      // Fetch balance and billing history
      const [balance, billingHistory, invoices] = await Promise.all([
        this.getBalance().catch(() => ({ account_balance: "0", month_to_date_balance: "0", month_to_date_usage: "0" })),
        this.getBillingHistory().catch(() => ({ billing_history: [] })),
        this.getInvoices().catch(() => ({ invoices: [] })),
      ])

      console.log("[v0] Balance:", balance)
      console.log("[v0] Billing history items:", billingHistory.billing_history?.length || 0)
      console.log("[v0] Invoices:", invoices.invoices?.length || 0)

      // Find invoice for the specific month
      const targetInvoice = invoices.invoices?.find((inv: any) => {
        const invDate = new Date(inv.invoice_period)
        return invDate.getFullYear() === year && invDate.getMonth() + 1 === month
      })

      let totalCost = 0
      const resources: ResourceCost[] = []

      if (targetInvoice) {
        console.log("[v0] Found invoice for", year, month, ":", targetInvoice)
        totalCost = Number.parseFloat(targetInvoice.amount || "0")

        if (targetInvoice.invoice_uuid) {
          try {
            const invoiceDetails = await this.getInvoiceById(targetInvoice.invoice_uuid)

            if (invoiceDetails?.invoice_items && invoiceDetails.invoice_items.length > 0) {
              console.log("[v0] Processing", invoiceDetails.invoice_items.length, "invoice items with descriptions")

              for (const item of invoiceDetails.invoice_items) {
                // Extract product description and details
                const productName = item.product || "Other Service"
                const description = item.description || productName
                const amount = Number.parseFloat(item.amount || "0")

                console.log("[v0] Invoice item:", {
                  product: productName,
                  description: description,
                  amount: amount,
                  resource_id: item.resource_id || item.resource_uuid,
                })

                // Determine resource type from product name
                const productLower = productName.toLowerCase()
                let resourceType = "other"
                if (productLower.includes("droplet")) resourceType = "droplet"
                else if (productLower.includes("database") || productLower.includes("managed database"))
                  resourceType = "database"
                else if (productLower.includes("load balancer") || productLower.includes("lb"))
                  resourceType = "load_balancer"
                else if (
                  productLower.includes("space") ||
                  productLower.includes("storage") ||
                  productLower.includes("volume")
                )
                  resourceType = "storage"
                else if (productLower.includes("bandwidth") || productLower.includes("transfer"))
                  resourceType = "bandwidth"
                else if (productLower.includes("snapshot")) resourceType = "snapshot"
                else if (productLower.includes("floating ip") || productLower.includes("reserved ip"))
                  resourceType = "ip_address"
                else if (productLower.includes("kubernetes") || productLower.includes("doks"))
                  resourceType = "kubernetes"

                resources.push({
                  resource_type: resourceType,
                  resource_id:
                    item.resource_id || item.resource_uuid || item.uuid || `item-${item.grouping}-${Date.now()}`,
                  resource_name: description,
                  cost: amount,
                  usage_hours: Number.parseFloat(item.hours || "0"),
                  region: item.region || undefined,
                  metadata: {
                    product: productName,
                    description: description,
                    period: item.period,
                    grouping: item.grouping,
                    start_time: item.start_time,
                    end_time: item.end_time,
                  },
                })
              }

              console.log("[v0] Extracted", resources.length, "resources with product descriptions")
            }
          } catch (detailsError) {
            console.error("[v0] Failed to fetch invoice details:", detailsError)
          }
        }
      } else {
        const now = new Date()
        if (year === now.getFullYear() && month === now.getMonth() + 1) {
          totalCost = Number.parseFloat(balance.month_to_date_usage || "0")
          console.log("[v0] Using month-to-date balance:", totalCost)
        }
      }

      // If we have no invoice data, fetch resource information from other endpoints
      if (resources.length === 0 && totalCost === 0) {
        console.log("[v0] No invoice data, fetching current resources as estimate")

        const [droplets, databases, loadBalancers, volumes] = await Promise.all([
          this.getDroplets().catch(() => ({ droplets: [] })),
          this.getDatabases().catch(() => ({ databases: [] })),
          this.getLoadBalancers().catch(() => ({ load_balancers: [] })),
          this.getVolumes().catch(() => ({ volumes: [] })),
        ])

        // Process droplets
        if (droplets.droplets) {
          for (const droplet of droplets.droplets) {
            const monthlyCost = droplet.size?.price_monthly || 0
            totalCost += monthlyCost

            resources.push({
              resource_type: "droplet",
              resource_id: droplet.id.toString(),
              resource_name: droplet.name,
              cost: monthlyCost,
              usage_hours: 730,
              region: droplet.region?.slug,
              size_slug: droplet.size?.slug,
              metadata: {
                vcpus: droplet.vcpus,
                memory: droplet.memory,
                disk: droplet.disk,
                status: droplet.status,
              },
            })
          }
        }

        // Process databases
        if (databases.databases) {
          for (const db of databases.databases) {
            const monthlyCost = db.size?.price_monthly || 0
            totalCost += monthlyCost

            resources.push({
              resource_type: "database",
              resource_id: db.id,
              resource_name: db.name,
              cost: monthlyCost,
              region: db.region,
              size_slug: db.size,
              metadata: {
                engine: db.engine,
                version: db.version,
                num_nodes: db.num_nodes,
                status: db.status,
              },
            })
          }
        }

        // Process load balancers
        if (loadBalancers.load_balancers) {
          for (const lb of loadBalancers.load_balancers) {
            const monthlyCost = 10
            totalCost += monthlyCost

            resources.push({
              resource_type: "load_balancer",
              resource_id: lb.id,
              resource_name: lb.name,
              cost: monthlyCost,
              region: lb.region?.slug,
              metadata: {
                status: lb.status,
                ip: lb.ip,
              },
            })
          }
        }

        // Process volumes
        if (volumes.volumes) {
          for (const volume of volumes.volumes) {
            const gbCost = 0.1
            const monthlyCost = (volume.size_gigabytes || 0) * gbCost
            totalCost += monthlyCost

            resources.push({
              resource_type: "storage",
              resource_id: volume.id,
              resource_name: volume.name,
              cost: monthlyCost,
              region: volume.region?.slug,
              metadata: {
                size_gigabytes: volume.size_gigabytes,
                filesystem_type: volume.filesystem_type,
              },
            })
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
      console.error("[v0] Error fetching DigitalOcean billing data:", error)
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

    // Find idle droplets (low CPU usage could be detected with monitoring data)
    const droplets = billingData.resources.filter((r) => r.resource_type === "droplet")
    if (droplets.length > 0) {
      const totalDropletCost = droplets.reduce((sum, d) => sum + d.cost, 0)
      recommendations.push({
        title: "Review Droplet Utilization",
        description: `You have ${droplets.length} droplet(s) running. Consider downsizing underutilized instances or using autoscaling for variable workloads.`,
        potential_savings: totalDropletCost * 0.3, // Estimate 30% potential savings
        priority: "medium",
      })
    }

    // Check for expensive database instances
    const databases = billingData.resources.filter((r) => r.resource_type === "database")
    const expensiveDbs = databases.filter((db) => db.cost > 50)
    if (expensiveDbs.length > 0) {
      recommendations.push({
        title: "Optimize Database Instances",
        description: `Found ${expensiveDbs.length} database instance(s) costing over $50/month. Consider right-sizing based on actual usage patterns.`,
        potential_savings: expensiveDbs.reduce((sum, db) => sum + db.cost, 0) * 0.25,
        priority: "high",
      })
    }

    // Check for multiple load balancers
    const loadBalancers = billingData.resources.filter((r) => r.resource_type === "load_balancer")
    if (loadBalancers.length > 2) {
      recommendations.push({
        title: "Consolidate Load Balancers",
        description: `You have ${loadBalancers.length} load balancers. Consider consolidating services to reduce costs.`,
        potential_savings: (loadBalancers.length - 1) * 10,
        priority: "low",
      })
    }

    // Check for large storage volumes
    const volumes = billingData.resources.filter((r) => r.resource_type === "storage")
    const largeVolumes = volumes.filter((v) => v.cost > 10)
    if (largeVolumes.length > 0) {
      recommendations.push({
        title: "Audit Storage Usage",
        description: `Found ${largeVolumes.length} storage volume(s) with significant costs. Review and remove unused data or consider archival solutions.`,
        potential_savings: largeVolumes.reduce((sum, v) => sum + v.cost, 0) * 0.2,
        priority: "medium",
      })
    }

    return recommendations
  }

  async getInvoiceCSV(invoiceUuid: string): Promise<string> {
    console.log("[v0] Fetching invoice CSV for", invoiceUuid)
    const response = await fetch(`${this.baseUrl}/customers/my/invoices/${invoiceUuid}/csv`, {
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        "Content-Type": "text/csv",
      },
    })

    if (!response.ok) {
      throw new Error(`DigitalOcean API error: ${response.status} ${response.statusText}`)
    }

    return response.text()
  }

  parseInvoiceCSV(csvData: string): ResourceCost[] {
    const resources: ResourceCost[] = []
    const lines = csvData.split("\n")

    if (lines.length < 2) {
      return resources
    }

    // Parse CSV header
    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))

    // Parse each row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const values = line.split(",").map((v) => v.trim().replace(/"/g, ""))
      const row: Record<string, string> = {}

      headers.forEach((header, index) => {
        row[header] = values[index] || ""
      })

      // Extract product information
      const productName = row["Product"] || row["Description"] || "Unknown Product"
      const resourceId = row["Resource ID"] || row["Resource UUID"] || row["ID"] || "unknown"
      const amount = Number.parseFloat(row["Amount"] || row["Cost"] || "0")
      const hours = Number.parseFloat(row["Hours"] || row["Usage Hours"] || "0")
      const region = row["Region"] || undefined
      const resourceType = row["Product"]?.toLowerCase() || "other"

      if (amount > 0) {
        resources.push({
          resource_type: resourceType.includes("droplet")
            ? "droplet"
            : resourceType.includes("database")
              ? "database"
              : resourceType.includes("load balancer")
                ? "load_balancer"
                : resourceType.includes("space") || resourceType.includes("storage")
                  ? "storage"
                  : resourceType.includes("bandwidth")
                    ? "bandwidth"
                    : "other",
          resource_id: resourceId,
          resource_name: productName,
          cost: amount,
          usage_hours: hours,
          region,
          metadata: {
            product: row["Product"],
            description: row["Description"],
            period: row["Period"],
            grouping: row["Grouping"],
            raw_row: row,
          },
        })
      }
    }

    console.log("[v0] Parsed", resources.length, "resources from CSV")
    return resources
  }
}
