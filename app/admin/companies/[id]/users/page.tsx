import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AdminNav } from "@/components/admin-nav"
import { ArrowLeft, UserPlus, Edit } from "lucide-react"
import Link from "next/link"

export default async function CompanyUsersPage({ params }: { params: { id: string } }) {
  console.log("[v0] Loading users page for company ID:", params.id)

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    console.log("[v0] No user found, redirecting to login")
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "admin") {
    console.log("[v0] User is not admin, redirecting to dashboard")
    redirect("/dashboard")
  }

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("*")
    .eq("id", params.id)
    .single()

  console.log("[v0] Company data:", company)
  console.log("[v0] Company error:", companyError)

  if (!company || companyError) {
    console.log("[v0] Company not found, redirecting")
    redirect("/admin/companies")
  }

  const { data: users, error: usersError } = await supabase
    .from("profiles")
    .select("*")
    .eq("company_id", params.id)
    .order("created_at", { ascending: false })

  console.log("[v0] Users data:", users)
  console.log("[v0] Users error:", usersError)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
      <AdminNav />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button variant="ghost" asChild className="text-slate-400 hover:text-white mb-4">
            <Link href={`/admin/companies/${params.id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Company
            </Link>
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">{company.name} - Users</h1>
              <p className="text-slate-400 mt-2">Manage users for this company</p>
            </div>
            <Button asChild className="bg-purple-600 hover:bg-purple-700 text-white">
              <Link href={`/admin/companies/${params.id}/users/new`}>
                <UserPlus className="h-4 w-4 mr-2" />
                Create User
              </Link>
            </Button>
          </div>
        </div>

        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Company Users</CardTitle>
            <CardDescription className="text-slate-400">
              {users?.length || 0} {users?.length === 1 ? "user" : "users"} in this company
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-slate-800">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 hover:bg-slate-800/50">
                    <TableHead className="text-slate-300">User</TableHead>
                    <TableHead className="text-slate-300">Email</TableHead>
                    <TableHead className="text-slate-300">Company Role</TableHead>
                    <TableHead className="text-slate-300">System Role</TableHead>
                    <TableHead className="text-slate-300">Account Role</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-300 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!users || users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-slate-500 py-8">
                        No users found for this company.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((usr) => (
                      <TableRow key={usr.id} className="border-slate-800 hover:bg-slate-800/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={usr.avatar_url || undefined} />
                              <AvatarFallback className="bg-indigo-900/30 text-indigo-300">
                                {usr.full_name?.charAt(0) || usr.email?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-white font-medium">{usr.full_name || "No name"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-300">{usr.email || "No email"}</TableCell>
                        <TableCell>
                          {usr.company_role ? (
                            <Badge variant="outline" className="border-slate-700 text-slate-300">
                              {usr.company_role}
                            </Badge>
                          ) : (
                            <span className="text-slate-500">Not set</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              usr.role === "admin"
                                ? "bg-purple-900/30 border-purple-700 text-purple-400"
                                : "bg-blue-900/30 border-blue-700 text-blue-400"
                            }
                          >
                            {usr.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {usr.company_account_role ? (
                            <Badge variant="outline" className="border-slate-700 text-slate-300">
                              {usr.company_account_role}
                            </Badge>
                          ) : (
                            <span className="text-slate-500">Not set</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={
                                usr.is_active
                                  ? "bg-green-900/30 border-green-700 text-green-400"
                                  : "bg-red-900/30 border-red-700 text-red-400"
                              }
                            >
                              {usr.is_active ? "Active" : "Inactive"}
                            </Badge>
                            {usr.is_reader && (
                              <Badge variant="outline" className="border-yellow-700 text-yellow-400">
                                Reader
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="border-indigo-700 text-indigo-400 hover:bg-indigo-900/30 bg-transparent"
                          >
                            <Link href={`/admin/companies/${params.id}/users/${usr.id}/edit`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
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
