import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AdminNav } from "@/components/admin-nav"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Edit, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function AdminUsersPage() {
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

  const { data: users, error } = await supabase
    .from("profiles")
    .select(`
      *,
      companies!profiles_company_id_fkey(name)
    `)
    .order("created_at", { ascending: false })

  console.log("[v0] Users data:", users)
  console.log("[v0] Users error:", error)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
      <AdminNav />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center gap-4">
          <Button
            variant="outline"
            asChild
            className="border-slate-700 text-slate-300 hover:bg-slate-800 bg-transparent"
          >
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">All Users</h1>
            <p className="text-slate-400 mt-2">Manage all users across all companies</p>
          </div>
        </div>

        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">System Users</CardTitle>
            <CardDescription className="text-slate-400">
              {users?.length || 0} {users?.length === 1 ? "user" : "users"} registered in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-slate-800">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 hover:bg-slate-800/50">
                    <TableHead className="text-slate-300">User</TableHead>
                    <TableHead className="text-slate-300">Email</TableHead>
                    <TableHead className="text-slate-300">Company</TableHead>
                    <TableHead className="text-slate-300">Company Role</TableHead>
                    <TableHead className="text-slate-300">System Role</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-300 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!users || users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-slate-500 py-8">
                        No users found in the system.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => {
                      const initials = user.full_name
                        ? user.full_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)
                        : user.email?.slice(0, 2).toUpperCase()

                      return (
                        <TableRow key={user.id} className="border-slate-800 hover:bg-slate-800/50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user.avatar_url || undefined} />
                                <AvatarFallback className="bg-indigo-600 text-white text-xs">{initials}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-white">{user.full_name || "No name"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-300">{user.email}</TableCell>
                          <TableCell className="text-slate-300">
                            {user.companies?.name || <span className="text-slate-500">No company</span>}
                          </TableCell>
                          <TableCell>
                            {user.company_role ? (
                              <Badge variant="outline" className="border-slate-700 text-slate-300">
                                {user.company_role}
                              </Badge>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                user.role === "admin"
                                  ? "bg-purple-900/30 border-purple-700 text-purple-400"
                                  : "bg-blue-900/30 border-blue-700 text-blue-400"
                              }
                            >
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {user.is_active ? (
                                <Badge className="bg-green-900/30 border-green-700 text-green-400">Active</Badge>
                              ) : (
                                <Badge className="bg-red-900/30 border-red-700 text-red-400">Inactive</Badge>
                              )}
                              {user.is_read_only && (
                                <Badge variant="outline" className="border-slate-700 text-slate-400">
                                  Read-only
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              className="border-indigo-700 text-indigo-400 hover:bg-indigo-900/30 hover:text-indigo-300 bg-transparent"
                            >
                              <Link href={`/admin/users/${user.id}/edit`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
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
