import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ClientNav } from "@/components/client-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CreditCard, Check } from "lucide-react"
import { PRODUCTS } from "@/lib/products"
import { CheckoutButton } from "@/components/checkout-button"

export default async function BillingPage() {
  const supabase = await createClient()

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*, companies(*)").eq("id", user.id).single()

  if (!profile || !profile.company_id) {
    redirect("/auth/login")
  }

  // Get subscription info
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("company_id", profile.company_id)
    .single()

  const currentPlan = subscription?.plan_type || "none"

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
      <ClientNav companyName={profile.companies?.name} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Billing & Subscription</h1>
          <p className="text-slate-400 mt-2">Manage your subscription and payment methods</p>
        </div>

        {/* Current Subscription */}
        {subscription && (
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur mb-8">
            <CardHeader>
              <CardTitle className="text-white">Current Subscription</CardTitle>
              <CardDescription className="text-slate-400">Your active plan details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
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
