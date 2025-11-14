import { redirect } from 'next/navigation'
import { createClient } from "@/lib/supabase/server"
import { ClientNav } from "@/components/client-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CreditCard, Check, AlertTriangle } from 'lucide-react'
import { PRODUCTS } from "@/lib/products"
import { CheckoutButton } from "@/components/checkout-button"

export default async function BillingPage() {
  const supabase = await createClient()

  console.log("[v0] Billing Page - Loading")

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*, companies!profiles_company_id_fkey(*)")
    .eq("id", user.id)
    .single()

  console.log("[v0] Billing Page - Profile:", profile?.email, "Company:", profile?.company_id, "Error:", profileError?.message)

  if (!profile || !profile.company_id) {
    redirect("/dashboard/settings")
  }

  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("id", profile.company_id)
    .single()

  const isRegistrationComplete = company?.is_registration_complete || false
  const needsTaxInfo = !company?.cnpj_cpf && !company?.vat_number

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("company_id", profile.company_id)
    .maybeSingle()

  const currentPlan = subscription?.plan_type || "trial"
  
  const { data: billingData } = await supabase
    .from("billing_history")
    .select("total_cost")
    .eq("company_id", profile.company_id)
    .gte("billing_period", new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString())
  
  const currentMonthSpend = billingData?.reduce((sum, b) => sum + Number(b.total_cost), 0) || 0
  
  const { data: integrations } = await supabase
    .from("cloud_integrations")
    .select("id")
    .eq("company_id", profile.company_id)
    .eq("is_active", true)
  
  const integrationCount = integrations?.length || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
      <ClientNav companyName={profile.companies?.name} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Billing & Subscription</h1>
          <p className="text-slate-400 mt-2">Manage your subscription and payment methods</p>
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

        {/* Current Subscription */}
        {subscription && (
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur mb-8">
            <CardHeader>
              <CardTitle className="text-white">Current Subscription</CardTitle>
              <CardDescription className="text-slate-400">Your active plan details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-bold text-white capitalize">{subscription.plan_type}</h3>
                    <Badge
                      className={
                        subscription.status === "active"
                          ? "bg-green-900/50 text-green-300 border-green-800"
                          : "bg-yellow-900/50 text-yellow-300 border-yellow-800"
                      }
                    >
                      {subscription.status}
                    </Badge>
                  </div>
                  <p className="text-slate-400">
                    {subscription.current_period_end && (
                      <>Next billing date: {new Date(subscription.current_period_end).toLocaleDateString()}</>
                    )}
                  </p>
                </div>
                <CreditCard className="h-12 w-12 text-slate-600" />
              </div>
              
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-700">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Integrations</p>
                  <p className="text-lg font-semibold text-white">
                    {integrationCount} / {subscription.max_integrations || 1}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">Monthly Spend</p>
                  <p className="text-lg font-semibold text-white">
                    ${currentMonthSpend.toFixed(0)} / ${subscription.max_cloud_spend?.toFixed(0) || '5,000'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">AI Recommendations</p>
                  <p className="text-lg font-semibold text-white">
                    {subscription.ai_recommendations_enabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available Plans */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Available Plans</h2>
          <div className="grid gap-6 lg:grid-cols-3">
            {PRODUCTS.map((product) => (
              <Card
                key={product.id}
                className={`border-slate-800 bg-slate-900/50 backdrop-blur ${
                  currentPlan === product.id ? "ring-2 ring-indigo-600" : ""
                }`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-white">{product.name}</CardTitle>
                    {currentPlan === product.id && (
                      <Badge className="bg-indigo-900/50 text-indigo-300 border-indigo-800">Current Plan</Badge>
                    )}
                  </div>
                  <CardDescription className="text-slate-400">{product.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-white">
                      {product.priceInCents > 0 ? `$${(product.priceInCents / 100).toFixed(0)}` : "Custom"}
                    </span>
                    {product.priceInCents > 0 && <span className="text-slate-400">/month</span>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {product.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {currentPlan === product.id ? (
                    <Button disabled className="w-full bg-slate-800 text-slate-500">
                      Current Plan
                    </Button>
                  ) : product.id === "enterprise" ? (
                    <Button className="w-full bg-slate-800 hover:bg-slate-700 text-white">Contact Sales</Button>
                  ) : (
                    <CheckoutButton productId={product.id} companyId={profile.company_id} userId={user.id} />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
