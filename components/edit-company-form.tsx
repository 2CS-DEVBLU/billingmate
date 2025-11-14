"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { Save, Loader2, Lock } from "lucide-react"

interface User {
  id: string
  full_name: string | null
  email: string
}

interface Company {
  id: string
  name: string
  company_size: string | null
  industry: string | null
  address: string | null
  area_of_operation: string | null
  cnpj_cpf: string | null
  admin_user_id: string | null
  unique_id: string | null
}

export function EditCompanyForm({ company, users }: { company: Company; users: User[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [formData, setFormData] = useState({
    name: company.name || "",
    company_size: company.company_size || "",
    industry: company.industry || "",
    address: company.address || "",
    area_of_operation: company.area_of_operation || "",
    cnpj_cpf: company.cnpj_cpf || "",
    admin_user_id: company.admin_user_id || "",
  })

  useEffect(() => {
    const checkAdminStatus = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", (await supabase.auth.getUser()).data.user?.id || "")
        .single()

      setIsAdmin(data?.role === "admin")
    }

    checkAdminStatus()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()

      const updateData = {
        ...formData,
        admin_user_id: formData.admin_user_id || null,
        company_size: formData.company_size || null,
        industry: formData.industry || null,
        address: formData.address || null,
        area_of_operation: formData.area_of_operation || null,
        ...(isAdmin ? { cnpj_cpf: formData.cnpj_cpf || null } : {}),
      }

      const { error } = await supabase.from("companies").update(updateData).eq("id", company.id)

      if (error) throw error

      router.push(`/admin/companies/${company.id}`)
      router.refresh()
    } catch (error) {
      console.error("Error updating company:", error)
      alert("Failed to update company")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {company.unique_id && (
        <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="h-4 w-4 text-slate-400" />
            <Label className="text-slate-300 text-sm font-medium">Company Unique ID (Immutable)</Label>
          </div>
          <p className="text-white font-mono text-lg">{company.unique_id}</p>
          <p className="text-xs text-slate-500 mt-1">This ID cannot be changed and is used for account traceability</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-slate-300">
            Company Name *
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="bg-slate-800 border-slate-700 text-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="company_size" className="text-slate-300">
            Company Size
          </Label>
          <Select
            value={formData.company_size}
            onValueChange={(value) => setFormData({ ...formData, company_size: value })}
          >
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1-10">1-10 employees</SelectItem>
              <SelectItem value="11-50">11-50 employees</SelectItem>
              <SelectItem value="51-200">51-200 employees</SelectItem>
              <SelectItem value="201-500">201-500 employees</SelectItem>
              <SelectItem value="501+">501+ employees</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="industry" className="text-slate-300">
            Industry
          </Label>
          <Input
            id="industry"
            value={formData.industry}
            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            placeholder="e.g., Technology, Healthcare"
            className="bg-slate-800 border-slate-700 text-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="area_of_operation" className="text-slate-300">
            Area of Operation
          </Label>
          <Input
            id="area_of_operation"
            value={formData.area_of_operation}
            onChange={(e) => setFormData({ ...formData, area_of_operation: e.target.value })}
            placeholder="e.g., Cloud Computing, SaaS"
            className="bg-slate-800 border-slate-700 text-white"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address" className="text-slate-300">
            Address
          </Label>
          <Textarea
            id="address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Company physical address"
            className="bg-slate-800 border-slate-700 text-white"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="cnpj_cpf" className="text-slate-300">
              CNPJ / CPF
            </Label>
            {!isAdmin && <Lock className="h-3 w-3 text-slate-500" />}
          </div>
          <Input
            id="cnpj_cpf"
            value={formData.cnpj_cpf}
            onChange={(e) => setFormData({ ...formData, cnpj_cpf: e.target.value })}
            placeholder="00.000.000/0000-00"
            className="bg-slate-800 border-slate-700 text-white"
            disabled={!isAdmin}
          />
          {!isAdmin && <p className="text-xs text-slate-500">Only platform administrators can edit CNPJ/CPF</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="admin_user" className="text-slate-300">
            Administrator User
          </Label>
          <Select
            value={formData.admin_user_id}
            onValueChange={(value) => setFormData({ ...formData, admin_user_id: value })}
          >
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder="Select admin user" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.full_name || user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="border-slate-700 text-slate-300 hover:bg-slate-800"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="bg-purple-600 hover:bg-purple-700 text-white">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
