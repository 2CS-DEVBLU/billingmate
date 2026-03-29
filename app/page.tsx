"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Brain, Shield, Zap, Globe, LineChart, Check, BarChart3 } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { AuthLanguageSwitcher } from "@/components/auth-language-switcher"

export default function HomePage() {
  const { t } = useI18n()

  return (
    <div className="min-h-screen bg-[#0b0b14]">
      {/* Header */}
      <header className="border-b border-white/[0.06] backdrop-blur-xl sticky top-0 z-50 bg-[#0b0b14]/80">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">BillingMate</span>
          </div>
          <nav className="hidden gap-6 md:flex">
            <Link href="#features" className="text-sm text-slate-400 hover:text-white transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="text-sm text-slate-400 hover:text-white transition-colors">
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <AuthLanguageSwitcher />
            <Button variant="ghost" asChild className="text-slate-400 hover:text-white">
              <Link href="/auth/login">{t.common.signIn}</Link>
            </Button>
            <Button asChild className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white shadow-lg shadow-indigo-500/20">
              <Link href="/auth/sign-up">{t.common.signUp}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute top-20 left-1/4 h-96 w-96 rounded-full bg-indigo-500/5 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-violet-500/5 blur-3xl" />
        <div className="container mx-auto px-4 py-28 text-center relative z-10">
          <Badge className="mb-6 bg-indigo-500/10 text-indigo-300 border-indigo-500/20">FinOps Intelligence Platform</Badge>
          <h1 className="mb-6 text-5xl font-bold leading-tight text-white md:text-6xl lg:text-7xl text-balance">
            {t.auth.tagline}{" "}
            <span className="gradient-text">{t.auth.taglineHighlight}</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-400 leading-relaxed text-balance">
            {t.auth.description}
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" asChild className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white text-base shadow-lg shadow-indigo-500/20">
              <Link href="/auth/sign-up">
                {t.auth.createAccount}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>

          <div className="mt-16 flex justify-center gap-8 text-sm text-slate-500">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">40%</div>
              <div>{t.auth.avgSavings}</div>
            </div>
            <div className="w-px bg-white/10" />
            <div className="text-center">
              <div className="text-3xl font-bold text-white">3+</div>
              <div>{t.auth.cloudProviders}</div>
            </div>
            <div className="w-px bg-white/10" />
            <div className="text-center">
              <div className="text-3xl font-bold text-white">AI</div>
              <div>{t.auth.poweredInsights}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white">Features</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Brain, title: "AI Recommendations", desc: "Intelligent cost optimization suggestions based on usage patterns.", color: "from-indigo-500 to-violet-500" },
            { icon: LineChart, title: "Real-Time Analytics", desc: "Monitor cloud spending with detailed breakdowns by service.", color: "from-emerald-500 to-teal-500" },
            { icon: Shield, title: "Budget Alerts", desc: "Custom budgets with instant alerts when thresholds are exceeded.", color: "from-orange-500 to-amber-500" },
            { icon: Globe, title: "Multi-Cloud", desc: "Unified view across AWS, DigitalOcean, Datadog and more.", color: "from-blue-500 to-cyan-500" },
            { icon: Zap, title: "Auto Optimization", desc: "Identify waste automatically. Rightsize instances, delete unused resources.", color: "from-violet-500 to-purple-500" },
            { icon: BarChart3, title: "Savings Tracking", desc: "Track cost savings over time and measure optimization ROI.", color: "from-pink-500 to-rose-500" },
          ].map((feature) => (
            <div key={feature.title} className="glass border-white/[0.06] rounded-xl p-6 glass-hover transition-all duration-300">
              <div className={`mb-4 h-10 w-10 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg`}>
                <feature.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="container mx-auto px-4 py-20">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white">{t.billing.plans}</h2>
        </div>
        <div className="grid gap-6 lg:grid-cols-3 max-w-5xl mx-auto">
          {/* Trial */}
          <div className="glass border-white/[0.06] rounded-2xl p-6">
            <h3 className="text-white font-semibold text-lg">{t.billing.trial}</h3>
            <div className="mt-3 mb-6">
              <span className="text-4xl font-bold text-white">Free</span>
            </div>
            <ul className="space-y-3 mb-6">
              {["$5K cloud spend", "1 integration", "3-month analysis", "Basic recommendations"].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-slate-400">
                  <Check className="h-4 w-4 text-indigo-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Button asChild className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10">
              <Link href="/auth/sign-up">{t.auth.createAccount}</Link>
            </Button>
          </div>

          {/* Starter */}
          <div className="glass border-indigo-500/30 rounded-2xl p-6 relative glow-sm">
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500/20 text-indigo-300 border-indigo-500/30">Popular</Badge>
            <h3 className="text-white font-semibold text-lg">{t.billing.starter}</h3>
            <div className="mt-3 mb-6">
              <span className="text-4xl font-bold text-white">$19.90</span>
              <span className="text-slate-500">/mo</span>
            </div>
            <ul className="space-y-3 mb-6">
              {["$50K cloud spend", "3 integrations", "6-month analysis", "AI recommendations", "Email support"].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-slate-300">
                  <Check className="h-4 w-4 text-indigo-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Button asChild className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white shadow-lg shadow-indigo-500/20">
              <Link href="/auth/sign-up">{t.auth.createAccount}</Link>
            </Button>
          </div>

          {/* Professional */}
          <div className="glass border-white/[0.06] rounded-2xl p-6">
            <h3 className="text-white font-semibold text-lg">{t.billing.professional}</h3>
            <div className="mt-3 mb-6">
              <span className="text-4xl font-bold text-white">$99.90</span>
              <span className="text-slate-500">/mo</span>
            </div>
            <ul className="space-y-3 mb-6">
              {["$250K cloud spend", "10 integrations", "12-month analysis", "AI + anomaly detection", "Custom budget alerts", "Priority support"].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-slate-400">
                  <Check className="h-4 w-4 text-indigo-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Button asChild className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10">
              <Link href="/auth/sign-up">{t.auth.createAccount}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="glass border-indigo-500/20 rounded-2xl p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-violet-500/5" />
          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to optimize?</h2>
            <p className="max-w-lg mx-auto text-slate-400 mb-8">{t.auth.description}</p>
            <Button size="lg" asChild className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white shadow-lg shadow-indigo-500/20">
              <Link href="/auth/sign-up">
                {t.auth.createAccount}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06]">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-white">BillingMate</span>
            </div>
            <p className="text-xs text-slate-600">
              Powered by <span className="text-slate-500">2CS Consulting</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
