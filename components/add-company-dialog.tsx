"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"

interface AddCompanyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddCompanyDialog({ open, onOpenChange }: AddCompanyDialogProps) {
  const [name, setName] = useState("")
  const [industry, setIndustry] = useState("")
  const [companySize, setCompanySize] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.from("companies").insert({
        name,
        industry: industry || null,
        company_size: companySize || null,
      })

      if (error) throw error

      setName("")
      setIndustry("")
      setCompanySize("")
      onOpenChange(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create company")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle>Add New Company</DialogTitle>
          <DialogDescription className="text-slate-400">Create a new client company in the system</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-300">
              Company Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Acme Corporation"
              className="bg-slate-950 border-slate-800 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="industry" className="text-slate-300">
              Industry
            </Label>
            <Input
              id="industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="Technology, Finance, etc."
              className="bg-slate-950 border-slate-800 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="size" className="text-slate-300">
              Company Size
            </Label>
            <Select value={companySize} onValueChange={setCompanySize}>
              <SelectTrigger className="bg-slate-950 border-slate-800 text-white">
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800">
                <SelectItem value="1-10">1-10 employees</SelectItem>
                <SelectItem value="10-50">10-50 employees</SelectItem>
                <SelectItem value="50-200">50-200 employees</SelectItem>
                <SelectItem value="200-1000">200-1000 employees</SelectItem>
                <SelectItem value="1000+">1000+ employees</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex justify-end gap-3">
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
              {isLoading ? "Creating..." : "Create Company"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
