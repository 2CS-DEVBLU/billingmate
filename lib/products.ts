export interface Product {
  id: string
  name: string
  description: string
  priceInCents: number
  features: string[]
  maxIntegrations: number
  maxCloudSpend: number
  maxAnalysisMonths: number
  aiRecommendationsEnabled: boolean
}

export const PRODUCTS: Product[] = [
  {
    id: "trial",
    name: "Trial",
    description: "Perfect for getting started",
    priceInCents: 0, // Free trial
    features: [
      "Up to $5K monthly cloud spend",
      "1 cloud account",
      "Real-time cost monitoring",
      "Basic recommendations",
      "Email support",
    ],
    maxIntegrations: 1,
    maxCloudSpend: 5000,
    maxAnalysisMonths: 3,
    aiRecommendationsEnabled: false,
  },
  {
    id: "starter",
    name: "Starter",
    description: "Perfect for small teams and startups",
    priceInCents: 1990, // $19.90
    features: [
      "Up to $50K monthly cloud spend",
      "3 cloud accounts",
      "Real-time cost monitoring",
      "AI-powered recommendations",
      "6 months analysis",
      "Email support",
    ],
    maxIntegrations: 3,
    maxCloudSpend: 50000,
    maxAnalysisMonths: 6,
    aiRecommendationsEnabled: true,
  },
  {
    id: "professional",
    name: "Professional",
    description: "For growing companies with significant cloud usage",
    priceInCents: 9990, // $99.90
    features: [
      "Up to $250K monthly cloud spend",
      "10 cloud accounts",
      "Advanced AI recommendations",
      "12 months analysis",
      "Anomaly detection",
      "Custom budget alerts",
      "Priority support",
    ],
    maxIntegrations: 10,
    maxCloudSpend: 250000,
    maxAnalysisMonths: 12,
    aiRecommendationsEnabled: true,
  },
]
