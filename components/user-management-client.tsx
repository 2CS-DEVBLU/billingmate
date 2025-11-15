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
import { UserPlus, MoreVertical, Mail, Trash2, Shield, Eye, Clock, CheckCircle2 } from 'lucide-react'
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

  const handleResendInvitation = async (invitationId: string, email: string) => {
    setLoading(invitationId)
    try {
      const response = await fetch(`/api/users/invitations/${invitationId}/resend`, {
        method: "POST",
      })

      if (!response.ok) throw new Error("Failed to resend invitation")

      toast({
        title: "Invitation resent",
        description: `A new invitation has been sent to ${email}`,
      })
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
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
          <p className="text-slate-400">Manage team members and invitations for your company</p>
        </div>

        <div className="grid gap-6">
          {/* Active Users */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white">Active Users</CardTitle>
                <CardDescription className="text-slate-400">
                  {users.length} of 3 users in your company
                </CardDescription>
              </div>
              <Button onClick={() => setInviteDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite User
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 hover:bg-slate-800/50">
                    <TableHead className="text-slate-300">User</TableHead>
                    <TableHead className="text-slate-300">Email</TableHead>
                    <TableHead className="text-slate-300">Role</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-300">Joined</TableHead>
                    <TableHead className="text-slate-300 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className="border-slate-800 hover:bg-slate-800/50">
                      <TableCell className="text-white font-medium">
                        {user.full_name || "—"}
                      </TableCell>
                      <TableCell className="text-slate-300">{user.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={user.is_admin ? "default" : "secondary"}
                          className={
                            user.is_admin
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-700 text-slate-300"
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
                              ? "bg-green-600 text-white"
                              : "bg-slate-700 text-slate-300"
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
                                className="text-slate-400 hover:text-white"
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pending Invitations */}
          {invitations.length > 0 && (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Pending Invitations</CardTitle>
                <CardDescription className="text-slate-400">
                  {invitations.length} invitation(s) waiting to be accepted
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-slate-800/50">
                      <TableHead className="text-slate-300">Email</TableHead>
                      <TableHead className="text-slate-300">Role</TableHead>
                      <TableHead className="text-slate-300">Status</TableHead>
                      <TableHead className="text-slate-300">Sent</TableHead>
                      <TableHead className="text-slate-300">Expires</TableHead>
                      <TableHead className="text-slate-300 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invitations.map((invitation) => {
                      const isExpired = new Date(invitation.expires_at) < new Date()
                      return (
                        <TableRow key={invitation.id} className="border-slate-800 hover:bg-slate-800/50">
                          <TableCell className="text-white">{invitation.email}</TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className="bg-slate-700 text-slate-300"
                            >
                              {invitation.role === "admin" ? "Administrator" : "Viewer"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={isExpired ? "destructive" : "secondary"}
                              className={
                                isExpired
                                  ? "bg-red-600 text-white"
                                  : "bg-amber-600 text-white"
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
                                  className="text-slate-400 hover:text-white"
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
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <InviteUserDialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen} />
    </div>
  )
}
