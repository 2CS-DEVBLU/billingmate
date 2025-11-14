"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2, UserPlus, Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface InviteUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InviteUserDialog({ open, onOpenChange }: InviteUserDialogProps) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"viewer" | "admin">("viewer")
  const [loading, setLoading] = useState(false)
  const [currentUsers, setCurrentUsers] = useState<number | null>(null)
  const { toast } = useToast()

  // Fetch current user count when dialog opens
  const handleOpenChange = async (isOpen: boolean) => {
    onOpenChange(isOpen)
    if (isOpen) {
      try {
        const response = await fetch("/api/users/count")
        const data = await response.json()
        setCurrentUsers(data.count)
      } catch (error) {
        console.error("[v0] Error fetching user count:", error)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send invitation")
      }

      toast({
        title: "Invitation sent",
        description: `An invitation has been sent to ${email}`,
      })

      setEmail("")
      setRole("viewer")
      onOpenChange(false)
    } catch (error) {
      console.error("[v0] Error sending invitation:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send invitation",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const usersRemaining = currentUsers !== null ? Math.max(0, 3 - currentUsers) : null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-indigo-400" />
            Invite User
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Invite team members to access your company&apos;s billing data. Maximum 3 users per company.
          </DialogDescription>
        </DialogHeader>

        {usersRemaining !== null && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Users className="h-4 w-4" />
                User Slots
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">{usersRemaining}</span>
                <span className="text-slate-400">of 3 slots available</span>
              </div>
              {usersRemaining === 0 && (
                <p className="text-sm text-red-400 mt-2">
                  You have reached the maximum number of users. Remove a user to invite another.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-300">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              disabled={loading || usersRemaining === 0}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role" className="text-slate-300">Role</Label>
            <Select value={role} onValueChange={(value: "viewer" | "admin") => setRole(value)} disabled={loading || usersRemaining === 0}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="viewer" className="text-white">
                  Viewer - Can view billing data only
                </SelectItem>
                <SelectItem value="admin" className="text-white">
                  Administrator - Full access to settings and billing
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">
              Viewers can only view billing data. Administrators can manage company settings and billing.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || usersRemaining === 0}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
