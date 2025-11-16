"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Upload } from "lucide-react"

interface AddUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  companies: Array<{ id: string; name: string }>
}

export function AddUserDialog({ open, onOpenChange, companies }: AddUserDialogProps) {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [companyId, setCompanyId] = useState("")
  const [companyRole, setCompanyRole] = useState("")
  const [systemRole, setSystemRole] = useState<"client" | "admin">("client")
  const [companyAccountRole, setCompanyAccountRole] = useState<"admin" | "viewer">("viewer")
  const [isActive, setIsActive] = useState(true)
  const [isReader, setIsReader] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Create auth user with admin API (requires service role key)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: password || Math.random().toString(36).slice(-8),
        options: {
          data: {
            full_name: fullName,
            company_id: companyId,
          },
        },
      })

      if (authError) throw authError

      if (!authData.user) {
        throw new Error("User creation failed")
      }

      // Update profile with additional fields
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          company_id: companyId,
          role: systemRole,
          company_role: companyRole || null,
          is_active: isActive,
          is_reader: isReader,
          company_account_role: companyAccountRole,
          avatar_url: avatarUrl || null,
        })
        .eq("id", authData.user.id)

      if (profileError) throw profileError

      // Reset form
      setFullName("")
      setEmail("")
      setCompanyId("")
      setCompanyRole("")
      setSystemRole("client")
      setCompanyAccountRole("viewer")
      setIsActive(true)
      setIsReader(false)
      setAvatarUrl("")
      setPassword("")
      onOpenChange(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user")
    } finally {
      setIsLoading(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register System User</DialogTitle>
          <DialogDescription className="text-slate-400">
            Create a new user account with comprehensive access settings
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarUrl || "/placeholder.svg"} alt={fullName} />
              <AvatarFallback className="bg-indigo-900 text-indigo-200 text-lg">
                {fullName ? getInitials(fullName) : <Upload className="h-8 w-8" />}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Label htmlFor="avatar" className="text-slate-300">
                Avatar URL
              </Label>
              <Input
                id="avatar"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="bg-slate-950 border-slate-800 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-slate-300">
                Full Name <span className="text-red-400">*</span>
              </Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="John Smith"
                className="bg-slate-950 border-slate-800 text-white"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">
                Email <span className="text-red-400">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="john@company.com"
                className="bg-slate-950 border-slate-800 text-white"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-300">
              Password <span className="text-slate-500 text-xs">(leave blank for auto-generated)</span>
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-slate-950 border-slate-800 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Company Affiliation */}
            <div className="space-y-2">
              <Label htmlFor="company" className="text-slate-300">
                Company Affiliation <span className="text-red-400">*</span>
              </Label>
              <Select value={companyId} onValueChange={setCompanyId} required>
                <SelectTrigger className="bg-slate-950 border-slate-800 text-white">
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Company Role */}
            <div className="space-y-2">
              <Label htmlFor="companyRole" className="text-slate-300">
                Company Role
              </Label>
              <Input
                id="companyRole"
                value={companyRole}
                onChange={(e) => setCompanyRole(e.target.value)}
                placeholder="CFO, Engineer, Manager, etc."
                className="bg-slate-950 border-slate-800 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* System Role */}
            <div className="space-y-2">
              <Label htmlFor="systemRole" className="text-slate-300">
                System Role <span className="text-red-400">*</span>
              </Label>
              <Select value={systemRole} onValueChange={(value: "client" | "admin") => setSystemRole(value)} required>
                <SelectTrigger className="bg-slate-950 border-slate-800 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Company Account Role */}
            <div className="space-y-2">
              <Label htmlFor="accountRole" className="text-slate-300">
                Company Account Role <span className="text-red-400">*</span>
              </Label>
              <Select
                value={companyAccountRole}
                onValueChange={(value: "admin" | "viewer") => setCompanyAccountRole(value)}
                required
              >
                <SelectTrigger className="bg-slate-950 border-slate-800 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  <SelectItem value="admin">Company Admin</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status Toggles */}
          <div className="space-y-4 border border-slate-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-slate-300">Access Settings</h3>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isActive" className="text-slate-300">
                  Active User
                </Label>
                <p className="text-xs text-slate-500">User can log in and access the system</p>
              </div>
              <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isReader" className="text-slate-300">
                  Read-Only Access
                </Label>
                <p className="text-xs text-slate-500">User can only view data, cannot make changes</p>
              </div>
              <Switch id="isReader" checked={isReader} onCheckedChange={setIsReader} />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="text-slate-300 hover:text-white"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700">
              {isLoading ? "Creating User..." : "Create User"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
