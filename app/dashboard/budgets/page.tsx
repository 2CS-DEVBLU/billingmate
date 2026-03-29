"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, AlertTriangle, DollarSign, Loader2 } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

interface BudgetRule {
  id: string
  name: string
  threshold_amount: number
  threshold_type: string
  baseline_amount?: number
  is_active: boolean
  last_triggered_at?: string
  cloud_integrations?: { provider: string; provider_name: string }
}

export default function BudgetsPage() {
  const [rules, setRules] = useState<BudgetRule[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: "", threshold_amount: "", threshold_type: "absolute", baseline_amount: "" })
  const { t } = useI18n()

  const fetchRules = async () => {
    const res = await fetch("/api/budgets")
    const data = await res.json()
    setRules(data.rules || [])
    setLoading(false)
  }

  useEffect(() => { fetchRules() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        threshold_amount: parseFloat(form.threshold_amount),
        threshold_type: form.threshold_type,
        baseline_amount: form.baseline_amount ? parseFloat(form.baseline_amount) : null,
      }),
    })
    setForm({ name: "", threshold_amount: "", threshold_type: "absolute", baseline_amount: "" })
    setShowForm(false)
    setSaving(false)
    fetchRules()
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/budgets/${id}`, { method: "DELETE" })
    fetchRules()
  }

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Budget Alerts</h1>
          <p className="text-sm text-slate-500 mt-1">{t.settings.registrationRequired}</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Budget
        </Button>
      </div>

      {showForm && (
        <Card className="glass border-white/[0.06] mb-6">
          <CardContent className="pt-6">
            <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label className="text-xs text-slate-400">Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Monthly AWS limit"
                  required
                  className="h-9 bg-white/[0.03] border-white/[0.08] text-white text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-slate-400">Type</Label>
                <select
                  value={form.threshold_type}
                  onChange={(e) => setForm({ ...form, threshold_type: e.target.value })}
                  className="w-full h-9 rounded-md bg-white/[0.03] border border-white/[0.08] text-white text-sm px-3"
                >
                  <option value="absolute">Absolute ($)</option>
                  <option value="percentage">Percentage (%)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-slate-400">
                  {form.threshold_type === "absolute" ? "Limit ($)" : "Threshold (%)"}
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.threshold_amount}
                  onChange={(e) => setForm({ ...form, threshold_amount: e.target.value })}
                  placeholder={form.threshold_type === "absolute" ? "500.00" : "20"}
                  required
                  className="h-9 bg-white/[0.03] border-white/[0.08] text-white text-sm"
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={saving} className="w-full h-9 bg-indigo-500 hover:bg-indigo-600 text-sm">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t.common.save}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-12"><Loader2 className="h-8 w-8 text-indigo-400 animate-spin mx-auto" /></div>
      ) : rules.length === 0 ? (
        <Card className="glass border-white/[0.06] border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DollarSign className="h-10 w-10 text-slate-600 mb-3" />
            <p className="text-sm text-slate-400">No budget rules yet. Create one to start monitoring.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <Card key={rule.id} className="glass border-white/[0.06]">
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${rule.last_triggered_at ? "bg-red-500/10" : "bg-emerald-500/10"}`}>
                    {rule.last_triggered_at ? (
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                    ) : (
                      <DollarSign className="h-5 w-5 text-emerald-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{rule.name}</p>
                    <p className="text-xs text-slate-500">
                      {rule.threshold_type === "absolute"
                        ? `Limit: $${rule.threshold_amount}`
                        : `+${rule.threshold_amount}% increase`}
                      {rule.cloud_integrations && ` · ${rule.cloud_integrations.provider_name}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {rule.last_triggered_at && (
                    <Badge className="text-[10px] bg-red-500/10 text-red-300 border-red-500/30">Triggered</Badge>
                  )}
                  <Badge className={`text-[10px] ${rule.is_active ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30" : "bg-white/5 text-slate-500 border-white/10"}`}>
                    {rule.is_active ? t.users.active : t.users.inactive}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(rule.id)}
                    className="h-8 w-8 p-0 text-slate-500 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
