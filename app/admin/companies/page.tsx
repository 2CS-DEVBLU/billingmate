import { redirect } from 'next/navigation'
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AdminNav } from "@/components/admin-nav"
import { Eye, ArrowLeft } from 'lucide-react'
import Link from "next/link"

export default async function CompaniesPage() {
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

  const { data: companies } = await supabase
    .from("companies")
    .select(`
      *,
      subscriptions(*)
    `)
    .eq("is_platform_owner", false)
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
          <Button variant="ghost" asChild className="text-slate-400 hover:text-white mb-4">
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-white">Client Companies</h1>
          <p className="text-slate-400 mt-2">View and manage all client companies in the system</p>
        </div>

        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">All Client Companies</CardTitle>
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
                        No client companies found in the system.
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
                                {subscription.plan_type}
                              </Badge>
                            ) : (
                              <span className="text-slate-500">No active plan</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
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
      </main>
    </div>
  )
}
