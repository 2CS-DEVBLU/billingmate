"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface CompanySettingsFormProps {
  company: {
    id: string
    name: string
    cnpj_cpf: string | null
    vat_number: string | null
    country_code: string
    is_registration_complete: boolean
    address: string | null
    industry: string | null
  }
}

export function CompanySettingsForm({ company }: CompanySettingsFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    name: company.name || "",
    country_code: company.country_code || "BR",
    cnpj_cpf: company.cnpj_cpf || "",
    vat_number: company.vat_number || "",
    address: company.address || "",
    industry: company.industry || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Validate required fields based on country
      if (formData.country_code === "BR" && !formData.cnpj_cpf.trim()) {
        throw new Error("CNPJ or CPF is required for Brazilian companies")
      }
      if (formData.country_code !== "BR" && !formData.vat_number.trim()) {
        throw new Error("VAT number is required for international companies")
      }

      const response = await fetch("/api/company/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: company.id,
          ...formData,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update company")
      }

      setSuccess(true)
      setTimeout(() => {
        router.refresh()
      }, 1500)
    } catch (err) {
      console.error("[v0] Error updating company:", err)
      setError(err instanceof Error ? err.message : "Failed to update company")
    } finally {
      setLoading(false)
    }
  }

  const isBrazil = formData.country_code === "BR"

  return (
    <Card className="border-slate-800 bg-slate-900/50 backdrop-blur max-w-2xl">
      <CardHeader>
        <CardTitle className="text-white">Company Registration</CardTitle>
        <CardDescription className="text-slate-400">
          Complete your company registration to access all features
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-300">
              Company Name
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country" className="text-slate-300">
              Country
            </Label>
            <Select
              value={formData.country_code}
              onValueChange={(value) =>
                setFormData({ ...formData, country_code: value })
              }
            >
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue />
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

          {isBrazil ? (
            <div className="space-y-2">
              <Label htmlFor="cnpj_cpf" className="text-slate-300">
                CNPJ or CPF <span className="text-red-400">*</span>
              </Label>
              <Input
                id="cnpj_cpf"
                value={formData.cnpj_cpf}
                onChange={(e) => setFormData({ ...formData, cnpj_cpf: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="00.000.000/0000-00 or 000.000.000-00"
                required
              />
              <p className="text-xs text-slate-500">
                Required for Brazilian companies and individuals
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="vat_number" className="text-slate-300">
                VAT / Tax ID <span className="text-red-400">*</span>
              </Label>
              <Input
                id="vat_number"
                value={formData.vat_number}
                onChange={(e) => setFormData({ ...formData, vat_number: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Enter your VAT or Tax ID"
                required
              />
              <p className="text-xs text-slate-500">
                Required for international companies
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="industry" className="text-slate-300">
              Industry
            </Label>
            <Input
              id="industry"
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white"
              placeholder="e.g., Technology, Healthcare, Finance"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="text-slate-300">
              Address
            </Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white"
              placeholder="Company address"
            />
          </div>

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

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
