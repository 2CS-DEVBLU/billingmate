import { Badge } from "@/components/ui/badge"
import { TableCell } from "@/components/ui/table"
import { TableBody } from "@/components/ui/table"
import { TableHead } from "@/components/ui/table"
import { TableRow } from "@/components/ui/table"
import { TableHeader } from "@/components/ui/table"
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
import { Settings, Eye, Building2, Users } from 'lucide-react'
import Link from "next/link"

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

  const { count: companiesCount } = await supabase.from("companies").select("*", { count: "exact", head: true })

  const { count: usersCount } = await supabase.from("profiles").select("*", { count: "exact", head: true })

  const { data: companies } = await supabase
    .from("companies")
    .select(`
      *,
      subscriptions(*)
    `)
    .order("created_at", { ascending: false })

  const getActiveSubscription = (company: any) => {
    if (!company.subscriptions || company.subscriptions.length === 0) {
      return null
    }
    return company.subscriptions.find((sub: any) => sub.status === "active")
  }

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

        {/* Companies table section */}
        <div className="mt-8">
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Companies</CardTitle>
              <CardDescription className="text-slate-400">
                {companies?.length || 0} {companies?.length === 1 ? "company" : "companies"} registered
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-slate-800">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-slate-800/50">
                      <TableHead className="text-slate-300">Company Name</TableHead>
                      <TableHead className="text-slate-300">Industry</TableHead>
                      <TableHead className="text-slate-300">Contracted Plan</TableHead>
                      <TableHead className="text-slate-300 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!companies || companies.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-slate-500 py-8">
                          No companies found in the system.
                        </TableCell>
                      </TableRow>
                    ) : (
                      companies.map((company) => {
                        const subscription = getActiveSubscription(company)

                        return (
                          <TableRow key={company.id} className="border-slate-800 hover:bg-slate-800/50">
                            <TableCell className="font-medium text-white">{company.name}</TableCell>
                            <TableCell className="text-slate-300">
                              {company.industry || <span className="text-slate-500">Not specified</span>}
                            </TableCell>
                            <TableCell>
                              {subscription ? (
                                <Badge className="bg-green-900/30 border-green-700 text-green-400">
                                  {subscription.plan_name}
                                </Badge>
                              ) : (
                                <span className="text-slate-500">No active plan</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  asChild
                                  className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-transparent"
                                >
                                  <Link href={`/admin/companies/${company.id}/setup`}>
                                    <Settings className="h-4 w-4 mr-2" />
                                    Setup
                                  </Link>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  asChild
                                  className="border-indigo-700 text-indigo-400 hover:bg-indigo-900/30 hover:text-indigo-300 bg-transparent"
                                >
                                  <Link href={`/admin/companies/${company.id}`}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View
                                  </Link>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
