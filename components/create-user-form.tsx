"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Upload } from "lucide-react"

interface CreateUserFormProps {
  companyId: string
  companyName: string
}

export function CreateUserForm({ companyId, companyName }: CreateUserFormProps) {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
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
      const response = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password: password || undefined,
          fullName,
          companyId,
          companyRole: companyRole || null,
          systemRole,
          companyAccountRole,
          isActive,
          isReader,
          avatarUrl: avatarUrl || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create user")
      }

      router.push(`/admin/companies/${companyId}/users`)
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
    <form onSubmit={handleSubmit} className="space-y-6">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      <div className="space-y-2">
        <Label htmlFor="password" className="text-slate-300">
          Password <span className="text-slate-500 text-xs font-normal">(leave blank for auto-generated password)</span>
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

      <div className="space-y-2">
        <Label className="text-slate-300">Company Affiliation</Label>
        <div className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-white">{companyName}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </div>

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
            <SelectItem value="admin">Company Administrator</SelectItem>
            <SelectItem value="viewer">Viewer User</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4 border border-slate-800 rounded-lg p-4 bg-slate-950/50">
        <h3 className="text-sm font-medium text-slate-300">Access Settings</h3>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="isActive" className="text-slate-300">
              Active User Status
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
          onClick={() => router.push(`/admin/companies/${companyId}`)}
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
  )
}
