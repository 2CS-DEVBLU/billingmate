"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, CheckCircle, Loader2, Save, Trash2, RefreshCw, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface CompanySettingsFormProps {
  company: {
    id: string
    name: string
    cnpj_cpf: string | null
    vat_number: string | null
    country_code: string
    is_registration_complete: boolean
    is_active: boolean
    unique_id: string | null
    industry: string | null
    company_size: string | null
    area_of_operation: string | null
    street?: string | null
    number?: string | null
    zip_code?: string | null
    neighborhood?: string | null
    city?: string | null
    state?: string | null
    country?: string | null
  }
  subscription?: {
    plan_type: string
    status: string
  } | null
  isAdmin: boolean
}

export function CompanySettingsForm({ company, subscription, isAdmin }: CompanySettingsFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deactivating, setDeactivating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    name: company.name || "",
    country_code: company.country_code || "",
    cnpj_cpf: company.cnpj_cpf || "",
    vat_number: company.vat_number || "",
    industry: company.industry || "",
    company_size: company.company_size || "",
    area_of_operation: company.area_of_operation || "",
    street: company.street || "",
    number: company.number || "",
    zip_code: company.zip_code || "",
    neighborhood: company.neighborhood || "",
    city: company.city || "",
    state: company.state || "",
    country: company.country || "",
  })

  const hasAddress = formData.street && formData.city && formData.state && formData.country
  const isBrazil = formData.country_code === "BR"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      if (hasAddress) {
        if (formData.country_code === "BR" && !formData.cnpj_cpf.trim()) {
          throw new Error("CNPJ or CPF is required for Brazilian companies")
        }
        if (formData.country_code !== "BR" && !formData.vat_number.trim()) {
          throw new Error("VAT number is required for international companies")
        }
      }

      const response = await fetch("/api/company/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: company.id,
          ...formData,
        }),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to update company")
      }

      setSuccess(true)
      setTimeout(() => {
        router.refresh()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update company")
    } finally {
      setLoading(false)
    }
  }

  const handleDeactivate = async () => {
    setDeactivating(true)
    try {
      const response = await fetch("/api/company/deactivate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: company.id }),
      })

      if (!response.ok) {
        throw new Error("Failed to deactivate company")
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to deactivate company")
    } finally {
      setDeactivating(false)
    }
  }

  const handleReactivate = async () => {
    setDeactivating(true)
    try {
      const response = await fetch("/api/company/reactivate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: company.id }),
      })

      if (!response.ok) {
        throw new Error("Failed to reactivate company")
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reactivate company")
    } finally {
      setDeactivating(false)
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

      {subscription && (
        <div className="p-4 bg-indigo-900/20 border border-indigo-700 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-slate-300 text-sm font-medium">Contracted Plan</Label>
              <p className="text-white font-semibold text-lg capitalize mt-1">{subscription.plan_type}</p>
            </div>
            <div className="text-right">
              <span className={`text-xs px-3 py-1 rounded-full ${
                subscription.status === 'active' 
                  ? 'bg-green-900/30 border border-green-700 text-green-400'
                  : 'bg-yellow-900/30 border border-yellow-700 text-yellow-400'
              }`}>
                {subscription.status}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
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
      </div>

      <div className="space-y-4 border-t border-slate-700 pt-6">
        <h3 className="text-lg font-semibold text-white">Company Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>
      </div>

      <div className="space-y-4 border-t border-slate-700 pt-6">
        <h3 className="text-lg font-semibold text-white">Address Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="street" className="text-slate-300">
              Street *
            </Label>
            <Input
              id="street"
              value={formData.street}
              onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              placeholder="Street name"
              className="bg-slate-800 border-slate-700 text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="number" className="text-slate-300">
              Number *
            </Label>
            <Input
              id="number"
              value={formData.number}
              onChange={(e) => setFormData({ ...formData, number: e.target.value })}
              placeholder="123"
              className="bg-slate-800 border-slate-700 text-white"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="zip_code" className="text-slate-300">
              Zip Code *
            </Label>
            <Input
              id="zip_code"
              value={formData.zip_code}
              onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
              placeholder="12345-678"
              className="bg-slate-800 border-slate-700 text-white"
              required
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
              City *
            </Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="City"
              className="bg-slate-800 border-slate-700 text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="state" className="text-slate-300">
              State *
            </Label>
            <Input
              id="state"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              placeholder="State/Province"
              className="bg-slate-800 border-slate-700 text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country" className="text-slate-300">
              Country *
            </Label>
            <Select
              value={formData.country}
              onValueChange={(value) => {
                setFormData({ ...formData, country: value })
                const countryCodeMap: Record<string, string> = {
                  'Brazil': 'BR',
                  'United States': 'US',
                  'United Kingdom': 'GB',
                  'Germany': 'DE',
                  'France': 'FR',
                  'Canada': 'CA',
                  'Australia': 'AU',
                }
                const code = countryCodeMap[value] || 'OTHER'
                setFormData(prev => ({ ...prev, country: value, country_code: code }))
              }}
            >
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="Brazil">Brazil</SelectItem>
                <SelectItem value="United States">United States</SelectItem>
                <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                <SelectItem value="Germany">Germany</SelectItem>
                <SelectItem value="France">France</SelectItem>
                <SelectItem value="Canada">Canada</SelectItem>
                <SelectItem value="Australia">Australia</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {hasAddress && (
        <div className="space-y-4 border-t border-slate-700 pt-6">
          <h3 className="text-lg font-semibold text-white">Tax Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isBrazil ? (
              <div className="space-y-2">
                <Label htmlFor="cnpj_cpf" className="text-slate-300">
                  CNPJ / CPF *
                </Label>
                <Input
                  id="cnpj_cpf"
                  value={formData.cnpj_cpf}
                  onChange={(e) => setFormData({ ...formData, cnpj_cpf: e.target.value })}
                  placeholder="00.000.000/0000-00 or 000.000.000-00"
                  className="bg-slate-800 border-slate-700 text-white"
                  required
                />
                <p className="text-xs text-slate-400">Required for Brazilian companies</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="vat_number" className="text-slate-300">
                  VAT / Tax ID *
                </Label>
                <Input
                  id="vat_number"
                  value={formData.vat_number}
                  onChange={(e) => setFormData({ ...formData, vat_number: e.target.value })}
                  placeholder="Enter VAT or Tax ID"
                  className="bg-slate-800 border-slate-700 text-white"
                  required
                />
                <p className="text-xs text-slate-400">Required for tax compliance</p>
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-900/20 border border-green-800 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <p className="text-sm text-green-300">Company details updated successfully!</p>
        </div>
      )}

      <div className="flex justify-between gap-3 pt-4 border-t border-slate-700">
        {isAdmin && (
          company.is_active ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={deactivating}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {deactivating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deactivating...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Deactivate Company
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-slate-900 border-slate-700">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">Deactivate Company Account</AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-400">
                    This will deactivate your company account and all associated users. Your subscription will be canceled.
                    You can reactivate within 30 days, or contact support after that period.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeactivate}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Deactivate
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button
              type="button"
              onClick={handleReactivate}
              disabled={deactivating}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {deactivating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Reactivating...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reactivate Company
                </>
              )}
            </Button>
          )
        )}
        
        <Button type="submit" disabled={loading} className="bg-purple-600 hover:bg-purple-700 text-white ml-auto">
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
