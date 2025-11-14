import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, TrendingDown, Brain, Shield, Zap, Globe, LineChart, Check } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-800/50 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <TrendingDown className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">BillingMate</span>
          </div>
          <nav className="hidden gap-6 md:flex">
            <Link href="#features" className="text-sm text-slate-300 hover:text-white">
              Features
            </Link>
            <Link href="#pricing" className="text-sm text-slate-300 hover:text-white">
              Pricing
            </Link>
            <Link href="#about" className="text-sm text-slate-300 hover:text-white">
              About
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild className="text-slate-300 hover:text-white">
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
              <Link href="/auth/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <Badge className="mb-6 bg-indigo-900/50 text-indigo-300 border-indigo-800">FinOps Intelligence Platform</Badge>
        <h1 className="mb-6 text-5xl font-bold leading-tight text-white md:text-6xl lg:text-7xl text-balance">
          Optimize Your Cloud Costs with AI-Powered Insights
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-300 leading-relaxed text-balance">
          BillingMate helps engineering and finance teams reduce cloud spending by up to 40% through intelligent cost
          analysis, real-time monitoring, and automated recommendations.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button size="lg" asChild className="bg-indigo-600 hover:bg-indigo-700 text-base">
            <Link href="/auth/sign-up">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-slate-700 bg-slate-900/50 text-white hover:bg-slate-800 text-base"
          >
            View Demo
          </Button>
        </div>
        <p className="mt-6 text-sm text-slate-500">14-day free trial • No credit card required • Cancel anytime</p>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-white">Everything You Need for Cloud Cost Management</h2>
          <p className="mx-auto max-w-2xl text-slate-400">
            Comprehensive FinOps platform with AI-driven insights to help you understand, optimize, and control your
            cloud spending.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-900/50">
                <Brain className="h-6 w-6 text-indigo-400" />
              </div>
              <CardTitle className="text-white">AI-Powered Recommendations</CardTitle>
              <CardDescription className="text-slate-400">
                Get intelligent suggestions to reduce costs based on your usage patterns and industry best practices.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-900/50">
                <LineChart className="h-6 w-6 text-indigo-400" />
              </div>
              <CardTitle className="text-white">Real-Time Cost Analytics</CardTitle>
              <CardDescription className="text-slate-400">
                Monitor your cloud spending in real-time with detailed breakdowns by service, project, and team.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-900/50">
                <Shield className="h-6 w-6 text-indigo-400" />
              </div>
              <CardTitle className="text-white">Budget Alerts & Anomaly Detection</CardTitle>
              <CardDescription className="text-slate-400">
                Set custom budgets and get instant alerts when spending exceeds thresholds or unusual patterns are
                detected.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-900/50">
                <Globe className="h-6 w-6 text-indigo-400" />
              </div>
              <CardTitle className="text-white">Multi-Cloud Support</CardTitle>
              <CardDescription className="text-slate-400">
                Unified view across AWS, Azure, and Google Cloud Platform. Manage all your cloud accounts in one place.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-900/50">
                <Zap className="h-6 w-6 text-indigo-400" />
              </div>
              <CardTitle className="text-white">Automated Cost Optimization</CardTitle>
              <CardDescription className="text-slate-400">
                Identify and eliminate waste automatically. Rightsize instances, delete unused resources, and more.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-900/50">
                <TrendingDown className="h-6 w-6 text-indigo-400" />
              </div>
              <CardTitle className="text-white">Savings Tracking</CardTitle>
              <CardDescription className="text-slate-400">
                Track your cost savings over time and measure the ROI of your optimization efforts.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-4 py-20">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-white">Simple, Transparent Pricing</h2>
          <p className="mx-auto max-w-2xl text-slate-400">
            Choose the plan that fits your organization. Start with a 3-day free trial.
          </p>
        </div>
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Trial Plan */}
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Trial</CardTitle>
              <CardDescription className="text-slate-400">Perfect for getting started</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold text-white">Free</span>
                <span className="text-slate-400"> for 3 days</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-300">Up to $5K monthly cloud spend</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-300">1 cloud account</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-300">Real-time cost monitoring</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-300">Basic recommendations</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-300">Email support</span>
                </li>
              </ul>
              <Button asChild className="w-full bg-slate-800 hover:bg-slate-700 text-white">
                <Link href="/auth/sign-up">Start Free Trial</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Starter Plan */}
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Starter</CardTitle>
              <CardDescription className="text-slate-400">Perfect for small teams and startups</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold text-white">$19.90</span>
                <span className="text-slate-400">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-300">Up to $50K monthly cloud spend</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-300">3 cloud accounts</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-300">Real-time cost monitoring</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-300">Basic recommendations</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-300">Email support</span>
                </li>
              </ul>
              <Button asChild className="w-full bg-slate-800 hover:bg-slate-700 text-white">
                <Link href="/auth/sign-up">Start Free Trial</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Professional Plan */}
          <Card className="border-indigo-600 bg-gradient-to-b from-indigo-900/50 to-slate-900/50 backdrop-blur relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <Badge className="bg-slate-600 text-white border-slate-500">Coming Soon</Badge>
            </div>
            <CardHeader>
              <CardTitle className="text-white">Professional</CardTitle>
              <CardDescription className="text-slate-300">
                For growing companies with significant cloud usage
              </CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold text-white">$99.90</span>
                <span className="text-slate-400">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-300">Up to $250K monthly cloud spend</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-300">10 cloud accounts</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-300">Advanced AI recommendations</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-300">Anomaly detection</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-300">Custom budget alerts</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-300">Priority support</span>
                </li>
              </ul>
              <Button disabled className="w-full bg-slate-700 text-slate-400">
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="border-indigo-800 bg-gradient-to-r from-indigo-900/50 to-slate-900/50 backdrop-blur">
          <CardContent className="flex flex-col items-center gap-6 py-16 text-center">
            <h2 className="text-3xl font-bold text-white md:text-4xl text-balance">
              Ready to Start Saving on Cloud Costs?
            </h2>
            <p className="max-w-2xl text-lg text-slate-300 text-balance">
              Join hundreds of companies already optimizing their cloud spending with BillingMate. Start your free trial
              today.
            </p>
            <Button size="lg" asChild className="bg-indigo-600 hover:bg-indigo-700">
              <Link href="/auth/sign-up">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 bg-slate-950/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-12">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
                  <TrendingDown className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white">BillingMate</span>
              </div>
              <p className="text-sm text-slate-400">AI-powered FinOps platform for cloud cost optimization.</p>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-semibold text-white">Product</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <Link href="#features" className="hover:text-white">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#pricing" className="hover:text-white">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Documentation
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-semibold text-white">Company</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <Link href="#" className="hover:text-white">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Careers
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-semibold text-white">Legal</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <Link href="#" className="hover:text-white">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Security
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          
        </div>
      </footer>
    </div>
  )
}
