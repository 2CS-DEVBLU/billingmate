import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption
} from "@/components/ui/table"
import { redirect } from 'next/navigation'
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AdminNav } from "@/components/admin-nav"
import { Settings, Eye, Building2, Users, DollarSign, TrendingUp } from 'lucide-react'
import Link from "next/link"
import { PRODUCTS } from "@/lib/products"

export default async function AdminDashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "admin") {
    redirect("/dashboard")
  }

  const { count: companiesCount } = await supabase
    .from("companies")
    .select("*", { count: "exact", head: true })
    .or("is_platform_owner.is.null,is_platform_owner.eq.false")

  const { count: usersCount } = await supabase.from("profiles").select("*", { count: "exact", head: true })

  const { data: companies } = await supabase
    .from("companies")
    .select(`
      *,
      subscriptions(*)
    `)
    .or("is_platform_owner.is.null,is_platform_owner.eq.false")
    .order("created_at", { ascending: false })

  const filteredCompanies = companies?.filter(company => 
    !company.is_platform_owner && 
    !company.name?.toLowerCase().includes('2cs')
  ) || []

  const getActiveSubscription = (company: any) => {
    if (!company.subscriptions || company.subscriptions.length === 0) {
      return null
    }
    // Return the most recent subscription regardless of status
    return company.subscriptions[0]
  }

  const calculateBillingMetrics = () => {
    let monthlyRecurringRevenue = 0
    let activeSubscriptions = 0
    let trialUsers = 0

    filteredCompanies.forEach(company => {
      const subscription = getActiveSubscription(company)
      if (subscription) {
        activeSubscriptions++
        const product = PRODUCTS.find(p => p.id === subscription.plan_type)
        if (product) {
          monthlyRecurringRevenue += product.priceInCents / 100
        }
      } else {
        trialUsers++
      }
    })

    const yearlyForecast = monthlyRecurringRevenue * 12
    const potentialFromTrials = trialUsers * (PRODUCTS.find(p => p.id === 'starter')?.priceInCents || 0) / 100

    return {
      monthlyRecurringRevenue,
      activeSubscriptions,
      trialUsers,
      yearlyForecast,
      potentialFromTrials
    }
  }

  const billingMetrics = calculateBillingMetrics()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
      <AdminNav />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Administration</h1>
          <p className="text-slate-400 mt-2">Manage companies and users in the system</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 max-w-6xl">
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur hover:bg-slate-900/70 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                  <Building2 className="h-6 w-6 text-indigo-400" />
                </div>
                <div>
                  <CardTitle className="text-white">Companies</CardTitle>
                  <CardDescription className="text-slate-400">
                    {companiesCount || 0} {companiesCount === 1 ? "company" : "companies"} in system
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                <Link href="/admin/companies">
                  <Building2 className="h-4 w-4 mr-2" />
                  View Companies
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur hover:bg-slate-900/70 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <Users className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-white">Users</CardTitle>
                  <CardDescription className="text-slate-400">
                    {usersCount || 0} {usersCount === 1 ? "user" : "users"} registered
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                <Link href="/admin/users">
                  <Users className="h-4 w-4 mr-2" />
                  View All Users
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur hover:bg-slate-900/70 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <Settings className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <CardTitle className="text-white">Platform Settings</CardTitle>
                  <CardDescription className="text-slate-400">
                    Configure integrations
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                <Link href="/admin/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Settings
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 max-w-6xl">
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                  <DollarSign className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <CardTitle className="text-white">Monthly Recurring Revenue</CardTitle>
                  <CardDescription className="text-slate-400">
                    Current active subscriptions
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-4xl font-bold text-green-400">
                    ${billingMetrics.monthlyRecurringRevenue.toFixed(2)}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    {billingMetrics.activeSubscriptions} active subscription{billingMetrics.activeSubscriptions !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-800">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Trial Users:</span>
                    <span className="text-white font-medium">{billingMetrics.trialUsers}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <TrendingUp className="h-6 w-6 text-amber-400" />
                </div>
                <div>
                  <CardTitle className="text-white">Revenue Forecast</CardTitle>
                  <CardDescription className="text-slate-400">
                    Projected annual revenue
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-4xl font-bold text-amber-400">
                    ${billingMetrics.yearlyForecast.toFixed(2)}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    Based on current subscriptions
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-800">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Potential from trials:</span>
                    <span className="text-green-400 font-medium">+${billingMetrics.potentialFromTrials.toFixed(2)}/mo</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Billing Overview</CardTitle>
              <CardDescription className="text-slate-400">
                Detailed breakdown of company subscriptions and revenue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-slate-800">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-slate-800/50">
                      <TableHead className="text-slate-300">Company</TableHead>
                      <TableHead className="text-slate-300">Plan</TableHead>
                      <TableHead className="text-slate-300">Status</TableHead>
                      <TableHead className="text-slate-300 text-right">Monthly Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!filteredCompanies || filteredCompanies.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-slate-500 py-8">
                          No companies found in the system.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCompanies.map((company) => {
                        const subscription = getActiveSubscription(company)
                        const product = subscription ? PRODUCTS.find(p => p.id === subscription.plan_type) : null
                        const monthlyRevenue = product ? product.priceInCents / 100 : 0

                        return (
                          <TableRow key={company.id} className="border-slate-800 hover:bg-slate-800/50">
                            <TableCell className="font-medium text-white">{company.name}</TableCell>
                            <TableCell>
                              {subscription ? (
                                <Badge className="bg-indigo-900/30 border-indigo-700 text-indigo-400">
                                  {product?.name || subscription.plan_type}
                                </Badge>
                              ) : (
                                <Badge className="bg-slate-800 border-slate-700 text-slate-400">
                                  Trial (Free)
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {subscription?.status === "active" ? (
                                <Badge className="bg-green-900/30 border-green-700 text-green-400">
                                  Active
                                </Badge>
                              ) : (
                                <Badge className="bg-amber-900/30 border-amber-700 text-amber-400">
                                  Trial
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-medium text-white">
                              {monthlyRevenue > 0 ? (
                                <span className="text-green-400">${monthlyRevenue.toFixed(2)}</span>
                              ) : (
                                <span className="text-slate-500">$0.00</span>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                  {filteredCompanies && filteredCompanies.length > 0 && (
                    <TableFooter>
                      <TableRow className="border-slate-800 bg-slate-800/50">
                        <TableCell colSpan={3} className="font-bold text-white">Total Monthly Revenue</TableCell>
                        <TableCell className="text-right font-bold text-green-400">
                          ${billingMetrics.monthlyRecurringRevenue.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  )}
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
