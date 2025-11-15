"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { Save, Loader2, Lock } from 'lucide-react'

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
  vat_number: string | null
  country_code: string
  admin_user_id: string | null
  unique_id: string | null
  street?: string | null
  number?: string | null
  zip_code?: string | null
  neighborhood?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
}

export function EditCompanyForm({ company, users }: { company: Company; users: User[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [formData, setFormData] = useState({
    name: company.name || "",
    company_size: company.company_size || "",
    industry: company.industry || "",
    area_of_operation: company.area_of_operation || "",
    country_code: company.country_code || "BR",
    cnpj_cpf: company.cnpj_cpf || "",
    vat_number: company.vat_number || "",
    admin_user_id: company.admin_user_id || "",
    street: company.street || "",
    number: company.number || "",
    zip_code: company.zip_code || "",
    neighborhood: company.neighborhood || "",
    city: company.city || "",
    state: company.state || "",
    country: company.country || "",
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
        name: formData.name,
        company_size: formData.company_size || null,
        industry: formData.industry || null,
        area_of_operation: formData.area_of_operation || null,
        admin_user_id: formData.admin_user_id || null,
        country_code: formData.country_code,
        street: formData.street || null,
        number: formData.number || null,
        zip_code: formData.zip_code || null,
        neighborhood: formData.neighborhood || null,
        city: formData.city || null,
        state: formData.state || null,
        country: formData.country || null,
        ...(isAdmin ? { 
          cnpj_cpf: formData.country_code === 'BR' ? formData.cnpj_cpf || null : null,
          vat_number: formData.country_code !== 'BR' ? formData.vat_number || null : null
        } : {}),
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

  const hasCountry = formData.country_code !== ""
  const hasAddress = formData.street && formData.city && formData.country
  const isBrazil = formData.country_code === "BR"

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
          <Label htmlFor="country_code" className="text-slate-300">
            Country *
          </Label>
          <Select
            value={formData.country_code}
            onValueChange={(value) => setFormData({ ...formData, country_code: value })}
          >
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="BR">Brazil</SelectItem>
              <SelectItem value="US">United States</SelectItem>
              <SelectItem value="GB">United Kingdom</SelectItem>
              <SelectItem value="DE">Germany</SelectItem>
              <SelectItem value="FR">France</SelectItem>
              <SelectItem value="CA">Canada</SelectItem>
              <SelectItem value="AU">Australia</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {hasCountry && (
          <>
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

            <div className="space-y-2 md:col-span-2">
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
          </>
        )}
      </div>

      {hasCountry && (
        <div className="space-y-4 border-t border-slate-700 pt-6">
          <h3 className="text-lg font-semibold text-white">Address Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="street" className="text-slate-300">
                Street
              </Label>
              <Input
                id="street"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                placeholder="Street name"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="number" className="text-slate-300">
                Number
              </Label>
              <Input
                id="number"
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                placeholder="123"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="zip_code" className="text-slate-300">
                Zip Code
              </Label>
              <Input
                id="zip_code"
                value={formData.zip_code}
                onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                placeholder="12345-678"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="neighborhood" className="text-slate-300">
                Neighborhood
              </Label>
              <Input
                id="neighborhood"
                value={formData.neighborhood}
                onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                placeholder="District/Neighborhood"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city" className="text-slate-300">
                City
              </Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="City"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state" className="text-slate-300">
                State
              </Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="State/Province"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country" className="text-slate-300">
                Country
              </Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="Country"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>
        </div>
      )}

      {hasAddress && (
        <div className="space-y-4 border-t border-slate-700 pt-6">
          <h3 className="text-lg font-semibold text-white">Tax Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isBrazil ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="cnpj_cpf" className="text-slate-300">
                    CNPJ / CPF *
                  </Label>
                  {!isAdmin && <Lock className="h-3 w-3 text-slate-500" />}
                </div>
                <Input
                  id="cnpj_cpf"
                  value={formData.cnpj_cpf}
                  onChange={(e) => setFormData({ ...formData, cnpj_cpf: e.target.value })}
                  placeholder="00.000.000/0000-00 or 000.000.000-00"
                  className="bg-slate-800 border-slate-700 text-white"
                  disabled={!isAdmin}
                  required
                />
                {!isAdmin && <p className="text-xs text-slate-500">Only platform administrators can edit CNPJ/CPF</p>}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="vat_number" className="text-slate-300">
                    VAT / Tax ID *
                  </Label>
                  {!isAdmin && <Lock className="h-3 w-3 text-slate-500" />}
                </div>
                <Input
                  id="vat_number"
                  value={formData.vat_number}
                  onChange={(e) => setFormData({ ...formData, vat_number: e.target.value })}
                  placeholder="Enter VAT or Tax ID"
                  className="bg-slate-800 border-slate-700 text-white"
                  disabled={!isAdmin}
                  required
                />
                {!isAdmin && <p className="text-xs text-slate-500">Only platform administrators can edit VAT</p>}
              </div>
            )}
          </div>
        </div>
      )}

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
