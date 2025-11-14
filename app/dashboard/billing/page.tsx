import { redirect } from 'next/navigation'
import { getUserWithCompany } from "@/lib/auth-utils"
import { ClientNav } from "@/components/client-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check, AlertTriangle, ShieldAlert } from 'lucide-react'
import { CheckoutButton } from "@/components/checkout-button"
import { createClient } from "@/lib/supabase/server"

export default async function BillingPage() {
  const { user, profile, company, isAdmin } = await getUserWithCompany()

  if (!user) {
    redirect("/auth/login")
  }

  if (!profile || !profile.company_id) {
    redirect("/dashboard/settings")
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
        <ClientNav companyName={company?.name} isAdmin={isAdmin} />
        <main className="container mx-auto px-4 py-8">
          <Card className="border-red-800 bg-red-900/20 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-red-300 flex items-center gap-2">
                <ShieldAlert className="h-5 w-5" />
                Access Denied
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-200 mb-4">
                Only company administrators can access billing and subscription management.
              </p>
              <p className="text-red-300 text-sm">
                Please contact your administrator if you need to manage billing.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  if (!company?.is_active) {
    const canReactivate = company?.reactivation_allowed_at 
      ? new Date(company.reactivation_allowed_at) <= new Date()
      : false

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
        <ClientNav companyName={company?.name} isAdmin={isAdmin} />
        <main className="container mx-auto px-4 py-8">
          <Card className="border-red-800 bg-red-900/20 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-red-300 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Account Deactivated
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-red-200">
                Your account has been deactivated. All subscriptions have been canceled.
              </p>
              {canReactivate ? (
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  Reactivate Account
                </Button>
              ) : (
                <div>
                  <p className="text-red-300 text-sm mb-2">
                    You can reactivate your account after: {new Date(company.reactivation_allowed_at!).toLocaleDateString()}
                  </p>
                  <Button variant="outline" className="border-slate-600 text-slate-300">
                    Contact Support
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  const supabase = await createClient()

  const needsTaxInfo = !company?.cnpj_cpf && !company?.vat_number

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("company_id", profile.company_id)
    .maybeSingle()

  const currentPlan = subscription?.plan_type || "trial"

  const plans = [
    {
      id: "trial",
      name: "Trial",
      description: "Perfect for getting started",
      price: "Free",
      priceSubtext: "for 3 days",
      features: [
        "Up to $5K monthly cloud spend",
        "1 cloud account",
        "Real-time cost monitoring",
        "Basic recommendations",
        "Email support"
      ],
      buttonText: "Current Plan",
      buttonVariant: "secondary" as const
    },
    {
      id: "starter",
      name: "Starter",
      description: "Perfect for small teams and startups",
      price: "$19.90",
      priceSubtext: "/month",
      features: [
        "Up to $50K monthly cloud spend",
        "3 cloud accounts",
        "Real-time cost monitoring",
        "AI-powered recommendations",
        "Email support"
      ],
      buttonText: "Upgrade to Starter",
      buttonVariant: "default" as const
    },
    {
      id: "professional",
      name: "Professional",
      description: "For growing companies with significant cloud usage",
      price: "$99.90",
      priceSubtext: "/month",
      badge: "Coming Soon",
      features: [
        "Up to $250K monthly cloud spend",
        "10 cloud accounts",
        "Advanced AI recommendations",
        "Anomaly detection",
        "Custom budget alerts",
        "Priority support"
      ],
      buttonText: "Coming Soon",
      buttonVariant: "default" as const,
      highlighted: true,
      disabled: true
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
      <ClientNav companyName={company?.name} isAdmin={isAdmin} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Billing & Subscription</h1>
          <p className="text-slate-400 mt-2">Manage your subscription and upgrade or downgrade your plan</p>
        </div>

        {needsTaxInfo && (
          <Card className="border-yellow-800 bg-yellow-900/20 backdrop-blur mb-8">
            <CardHeader>
              <CardTitle className="text-yellow-300 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Complete Your Registration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-yellow-200 mb-4">
                {company?.country_code === 'BR' 
                  ? 'You must provide a CNPJ or CPF to use paid plans.'
                  : 'You must provide a VAT number to use paid plans.'}
              </p>
              <Button asChild className="bg-yellow-600 hover:bg-yellow-700 text-white">
                <a href="/dashboard/settings">Complete Registration</a>
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Choose Your Plan</h2>
          <p className="text-slate-400 mb-6">Select the plan that fits your organization</p>
          
          <div className="grid gap-8 lg:grid-cols-3">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={
                  plan.highlighted
                    ? "border-indigo-600 bg-gradient-to-b from-indigo-900/50 to-slate-900/50 backdrop-blur relative"
                    : "border-slate-800 bg-slate-900/50 backdrop-blur"
                }
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-indigo-600 text-white border-indigo-500">{plan.badge}</Badge>
                  </div>
                )}
                {currentPlan === plan.id && !plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-green-600 text-white border-green-500">Current Plan</Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-white">{plan.name}</CardTitle>
                  <CardDescription className={plan.highlighted ? "text-slate-300" : "text-slate-400"}>
                    {plan.description}
                  </CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-slate-400">{plan.priceSubtext}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {currentPlan === plan.id ? (
                    <Button disabled className="w-full bg-slate-800 text-slate-500">
                      Current Plan
                    </Button>
                  ) : plan.id === "trial" && currentPlan !== "trial" ? (
                    <Button 
                      className="w-full bg-slate-800 hover:bg-slate-700 text-white"
                    >
                      Downgrade to Trial
                    </Button>
                  ) : plan.disabled ? (
                    <Button 
                      disabled
                      className="w-full bg-slate-800 text-slate-500"
                    >
                      Coming Soon
                    </Button>
                  ) : (
                    <CheckoutButton 
                      productId={plan.id} 
                      companyId={profile.company_id} 
                      userId={user.id}
                      className={
                        plan.highlighted 
                          ? "w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                          : "w-full bg-slate-800 hover:bg-slate-700 text-white"
                      }
                    />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur mt-8">
          <CardHeader>
            <CardTitle className="text-white">Danger Zone</CardTitle>
            <CardDescription className="text-slate-400">
              Irreversible actions that affect your entire account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium">Deactivate Account</h3>
                <p className="text-sm text-slate-400">
                  Cancel all subscriptions and deactivate your account. You can reactivate after 30 days.
                </p>
              </div>
              <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
                Deactivate Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
