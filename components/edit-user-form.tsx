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
import { createClient } from "@/lib/supabase/client"

interface EditUserFormProps {
  user: {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
    company_role: string | null
    role: string
    company_account_role: string | null
    is_active: boolean
    is_reader: boolean
    company_id: string | null
  }
  companies: Array<{ id: string; name: string }>
  companyId?: string
}

export function EditUserForm({ user, companies, companyId }: EditUserFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: user.full_name || "",
    avatar_url: user.avatar_url || "",
    company_role: user.company_role || "",
    role: user.role || "client",
    company_account_role: user.company_account_role || "viewer",
    is_active: user.is_active ?? true,
    is_reader: user.is_reader ?? false,
    company_id: user.company_id || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    console.log("[v0] Form submit started")
    console.log("[v0] Form data:", formData)

    try {
      const supabase = createClient()

      const updateData = {
        full_name: formData.full_name || null,
        avatar_url: formData.avatar_url || null,
        company_role: formData.company_role || null,
        role: formData.role,
        company_account_role: formData.company_account_role || null,
        is_active: formData.is_active,
        is_reader: formData.is_reader,
        company_id: formData.company_id || null,
        updated_at: new Date().toISOString(),
      }

      console.log("[v0] Update data:", updateData)
      console.log("[v0] Updating user ID:", user.id)

      const { data, error } = await supabase.from("profiles").update(updateData).eq("id", user.id).select()

      console.log("[v0] Update result:", { data, error })

      if (error) {
        console.error("[v0] Update error:", error)
        throw error
      }

      console.log("[v0] Update successful, redirecting...")

      if (companyId) {
        router.push(`/admin/companies/${companyId}/users`)
      } else {
        router.push("/admin/users")
      }
      router.refresh()
    } catch (error) {
      console.error("[v0] Error updating user:", error)
      alert(`Failed to update user: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={formData.avatar_url || undefined} />
          <AvatarFallback className="bg-indigo-900/30 text-indigo-300 text-xl">
            {formData.full_name?.charAt(0) || user.email?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Label htmlFor="avatar_url" className="text-slate-300">
            Avatar URL
          </Label>
          <Input
            id="avatar_url"
            type="url"
            value={formData.avatar_url}
            onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
            placeholder="https://example.com/avatar.jpg"
            className="bg-slate-800 border-slate-700 text-white"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="full_name" className="text-slate-300">
          Full Name
        </Label>
        <Input
          id="full_name"
          value={formData.full_name}
          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          placeholder="John Doe"
          className="bg-slate-800 border-slate-700 text-white"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-slate-300">
          Email (Read-only)
        </Label>
        <Input
          id="email"
          type="email"
          value={user.email}
          disabled
          className="bg-slate-800/50 border-slate-700 text-slate-400"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="company_id" className="text-slate-300">
          Company Affiliation
        </Label>
        <Select value={formData.company_id} onValueChange={(value) => setFormData({ ...formData, company_id: value })}>
          <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
            <SelectValue placeholder="Select company" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            {companies.map((company) => (
              <SelectItem key={company.id} value={company.id} className="text-white">
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="company_role" className="text-slate-300">
          Company Role
        </Label>
        <Select
          value={formData.company_role}
          onValueChange={(value) => setFormData({ ...formData, company_role: value })}
        >
          <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="CFO" className="text-white">
              CFO
            </SelectItem>
            <SelectItem value="Finance Manager" className="text-white">
              Finance Manager
            </SelectItem>
            <SelectItem value="Engineer" className="text-white">
              Engineer
            </SelectItem>
            <SelectItem value="DevOps" className="text-white">
              DevOps
            </SelectItem>
            <SelectItem value="Product Manager" className="text-white">
              Product Manager
            </SelectItem>
            <SelectItem value="Other" className="text-white">
              Other
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="role" className="text-slate-300">
            System Role
          </Label>
          <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="admin" className="text-white">
                Admin
              </SelectItem>
              <SelectItem value="client" className="text-white">
                Client
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="company_account_role" className="text-slate-300">
            Company Account Role
          </Label>
          <Select
            value={formData.company_account_role}
            onValueChange={(value) => setFormData({ ...formData, company_account_role: value })}
          >
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="administrator" className="text-white">
                Administrator
              </SelectItem>
              <SelectItem value="viewer" className="text-white">
                Viewer
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-lg border border-slate-800 bg-slate-800/30">
          <div className="space-y-0.5">
            <Label htmlFor="is_active" className="text-slate-300">
              Active Status
            </Label>
            <p className="text-sm text-slate-500">User can log in and access the system</p>
          </div>
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg border border-slate-800 bg-slate-800/30">
          <div className="space-y-0.5">
            <Label htmlFor="is_reader" className="text-slate-300">
              Read-Only Access
            </Label>
            <p className="text-sm text-slate-500">User can only view data, not modify</p>
          </div>
          <Switch
            id="is_reader"
            checked={formData.is_reader}
            onCheckedChange={(checked) => setFormData({ ...formData, is_reader: checked })}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={loading} className="bg-purple-600 hover:bg-purple-700 text-white">
          {loading ? "Saving..." : "Save Changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="border-slate-700 text-slate-300 hover:bg-slate-800"
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
