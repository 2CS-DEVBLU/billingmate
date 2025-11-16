"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserPlus, MoreVertical, Mail, Trash2, Shield, Eye, Clock, Users, UserCheck, UserX } from 'lucide-react'
import { InviteUserDialog } from "@/components/invite-user-dialog"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  full_name: string | null
  is_admin: boolean
  is_active: boolean
  created_at: string
}

interface Invitation {
  id: string
  email: string
  role: string
  status: string
  created_at: string
  expires_at: string
}

interface UserManagementClientProps {
  users: User[]
  invitations: Invitation[]
  currentUserId: string
}

export function UserManagementClient({ users, invitations, currentUserId }: UserManagementClientProps) {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const activeUsers = users.filter(u => u.is_active).length
  const admins = users.filter(u => u.is_admin).length
  const expiredInvitations = invitations.filter(inv => new Date(inv.expires_at) < new Date()).length

  const handleResendInvitation = async (invitationId: string, email: string) => {
    setLoading(invitationId)
    try {
      const response = await fetch(`/api/users/invitations/${invitationId}/resend`, {
        method: "POST",
      })

      if (!response.ok) throw new Error("Failed to resend invitation")

      const data = await response.json()

      if (data.method === 'manual' && data.url) {
        toast({
          title: "Invitation Updated",
          description: (
            <div className="space-y-2">
              <p className="text-sm">Copy this invitation link and share it manually with {email}:</p>
              <div className="bg-slate-800 p-2 rounded text-xs break-all font-mono">{data.url}</div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(data.url)
                  toast({ title: "Copied!", description: "Invitation URL copied to clipboard" })
                }}
                className="text-xs text-indigo-400 hover:underline"
              >
                Click to copy
              </button>
            </div>
          ),
          duration: 15000,
        })
      } else {
        toast({
          title: "Invitation resent",
          description: `A new invitation has been sent to ${email}`,
        })
      }
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend invitation",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  const handleChangeRole = async (userId: string, newRole: boolean) => {
    setLoading(userId)
    try {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_admin: newRole }),
      })

      if (!response.ok) throw new Error("Failed to update role")

      toast({
        title: "Role updated",
        description: `User role has been changed to ${newRole ? "Administrator" : "Viewer"}`,
      })
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to remove ${email} from your company?`)) {
      return
    }

    setLoading(userId)
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete user")

      toast({
        title: "User removed",
        description: `${email} has been removed from your company`,
      })
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove user",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  const handleDeleteInvitation = async (invitationId: string, email: string) => {
    if (!confirm(`Are you sure you want to cancel the invitation for ${email}?`)) {
      return
    }

    setLoading(invitationId)
    try {
      const response = await fetch(`/api/users/invitations/${invitationId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete invitation")

      toast({
        title: "Invitation cancelled",
        description: `Invitation for ${email} has been cancelled`,
      })
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel invitation",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-3">Team Management</h1>
          <p className="text-slate-400 text-lg">Manage your team members, roles, and invitations</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-indigo-900/40 to-indigo-900/20 border-indigo-800/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium mb-1">Total Users</p>
                  <p className="text-3xl font-bold text-white">{users.length}</p>
                  <p className="text-indigo-400 text-xs mt-1">of 3 available</p>
                </div>
                <div className="h-12 w-12 bg-indigo-600/20 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-indigo-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-900/40 to-green-900/20 border-green-800/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium mb-1">Active Users</p>
                  <p className="text-3xl font-bold text-white">{activeUsers}</p>
                  <p className="text-green-400 text-xs mt-1">currently active</p>
                </div>
                <div className="h-12 w-12 bg-green-600/20 rounded-full flex items-center justify-center">
                  <UserCheck className="h-6 w-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-900/40 to-purple-900/20 border-purple-800/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium mb-1">Administrators</p>
                  <p className="text-3xl font-bold text-white">{admins}</p>
                  <p className="text-purple-400 text-xs mt-1">admin users</p>
                </div>
                <div className="h-12 w-12 bg-purple-600/20 rounded-full flex items-center justify-center">
                  <Shield className="h-6 w-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-900/40 to-amber-900/20 border-amber-800/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium mb-1">Pending Invites</p>
                  <p className="text-3xl font-bold text-white">{invitations.length}</p>
                  {expiredInvitations > 0 && (
                    <p className="text-red-400 text-xs mt-1">{expiredInvitations} expired</p>
                  )}
                  {expiredInvitations === 0 && invitations.length > 0 && (
                    <p className="text-amber-400 text-xs mt-1">awaiting response</p>
                  )}
                </div>
                <div className="h-12 w-12 bg-amber-600/20 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6">
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-2xl text-white">Team Members</CardTitle>
                <CardDescription className="text-slate-400 mt-1">
                  All active users in your organization
                </CardDescription>
              </div>
              <Button 
                onClick={() => setInviteDialogOpen(true)} 
                className="bg-indigo-600 hover:bg-indigo-700 shadow-lg"
                disabled={users.length >= 3}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Invite User
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-slate-800 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 bg-slate-800/50 hover:bg-slate-800/50">
                      <TableHead className="text-slate-300 font-semibold">User</TableHead>
                      <TableHead className="text-slate-300 font-semibold">Email</TableHead>
                      <TableHead className="text-slate-300 font-semibold">Role</TableHead>
                      <TableHead className="text-slate-300 font-semibold">Status</TableHead>
                      <TableHead className="text-slate-300 font-semibold">Joined</TableHead>
                      <TableHead className="text-slate-300 font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} className="border-slate-800 hover:bg-slate-800/30">
                        <TableCell className="text-white font-medium">
                          {user.full_name || "—"}
                        </TableCell>
                        <TableCell className="text-slate-300">{user.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant={user.is_admin ? "default" : "secondary"}
                            className={
                              user.is_admin
                                ? "bg-indigo-600 text-white border-indigo-500"
                                : "bg-slate-700 text-slate-300 border-slate-600"
                            }
                          >
                            {user.is_admin ? (
                              <>
                                <Shield className="h-3 w-3 mr-1" />
                                Administrator
                              </>
                            ) : (
                              <>
                                <Eye className="h-3 w-3 mr-1" />
                                Viewer
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={user.is_active ? "default" : "secondary"}
                            className={
                              user.is_active
                                ? "bg-green-600 text-white border-green-500"
                                : "bg-slate-700 text-slate-300 border-slate-600"
                            }
                          >
                            {user.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-400">
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {user.id !== currentUserId && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-slate-400 hover:text-white hover:bg-slate-800"
                                  disabled={loading === user.id}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800">
                                <DropdownMenuLabel className="text-slate-300">Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-slate-800" />
                                <DropdownMenuItem
                                  onClick={() => handleChangeRole(user.id, !user.is_admin)}
                                  className="text-slate-300 focus:bg-slate-800 focus:text-white cursor-pointer"
                                >
                                  <Shield className="h-4 w-4 mr-2" />
                                  Change to {user.is_admin ? "Viewer" : "Admin"}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteUser(user.id, user.email)}
                                  className="text-red-400 focus:bg-slate-800 focus:text-red-300 cursor-pointer"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remove User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                          {user.id === currentUserId && (
                            <Badge variant="secondary" className="bg-slate-700 text-slate-400 border-slate-600">
                              You
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {invitations.length > 0 && (
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-2xl text-white">Pending Invitations</CardTitle>
                <CardDescription className="text-slate-400 mt-1">
                  {invitations.length} invitation(s) waiting to be accepted
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-slate-800 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-800 bg-slate-800/50 hover:bg-slate-800/50">
                        <TableHead className="text-slate-300 font-semibold">Email</TableHead>
                        <TableHead className="text-slate-300 font-semibold">Role</TableHead>
                        <TableHead className="text-slate-300 font-semibold">Status</TableHead>
                        <TableHead className="text-slate-300 font-semibold">Sent</TableHead>
                        <TableHead className="text-slate-300 font-semibold">Expires</TableHead>
                        <TableHead className="text-slate-300 font-semibold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invitations.map((invitation) => {
                        const isExpired = new Date(invitation.expires_at) < new Date()
                        return (
                          <TableRow key={invitation.id} className="border-slate-800 hover:bg-slate-800/30">
                            <TableCell className="text-white font-medium">{invitation.email}</TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className="bg-slate-700 text-slate-300 border-slate-600"
                              >
                                {invitation.role === "admin" ? "Administrator" : "Viewer"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={isExpired ? "destructive" : "secondary"}
                                className={
                                  isExpired
                                    ? "bg-red-600 text-white border-red-500"
                                    : "bg-amber-600 text-white border-amber-500"
                                }
                              >
                                <Clock className="h-3 w-3 mr-1" />
                                {isExpired ? "Expired" : "Pending"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-slate-400">
                              {new Date(invitation.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-slate-400">
                              {new Date(invitation.expires_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-slate-400 hover:text-white hover:bg-slate-800"
                                    disabled={loading === invitation.id}
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800">
                                  <DropdownMenuLabel className="text-slate-300">Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator className="bg-slate-800" />
                                  <DropdownMenuItem
                                    onClick={() => handleResendInvitation(invitation.id, invitation.email)}
                                    className="text-slate-300 focus:bg-slate-800 focus:text-white cursor-pointer"
                                  >
                                    <Mail className="h-4 w-4 mr-2" />
                                    Resend Invitation
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteInvitation(invitation.id, invitation.email)}
                                    className="text-red-400 focus:bg-slate-800 focus:text-red-300 cursor-pointer"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Cancel Invitation
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <InviteUserDialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen} />
    </div>
  )
}
