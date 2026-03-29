"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Settings, Cloud } from "lucide-react"
import Link from "next/link"

type Integration = {
  id: string
  provider: string
  provider_name: string
  is_active: boolean
  is_enabled: boolean
}

type ProviderSelectorProps = {
  integrations: Integration[]
  selectedProvider: string
  companyId: string
}

export function ProviderSelector({ integrations, selectedProvider, companyId }: ProviderSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleProviderChange = (value: string) => {
    const providerRoutes: Record<string, string> = {
      digitalocean: "/dashboard/digitalocean",
      datadog: "/dashboard/datadog",
      aws: "/dashboard/aws",
    }
    router.push(providerRoutes[value] || "/dashboard/integrations")
  }

  const activeIntegrations = integrations.filter((i) => i.is_active)

  const effectiveProvider = selectedProvider

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Cloud className="h-5 w-5 text-slate-400" />
        <Select value={effectiveProvider} onValueChange={handleProviderChange}>
          <SelectTrigger className="w-[200px] bg-slate-900/50 border-slate-700 text-white">
            <SelectValue placeholder="Select provider" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700">
            {activeIntegrations.map((integration) => (
              <SelectItem key={integration.id} value={integration.provider} className="text-white">
                {integration.provider_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Link href="/dashboard/integrations">
        <Button variant="outline" size="sm" className="bg-slate-900/50 border-slate-700 text-white hover:bg-slate-800">
          <Settings className="h-4 w-4 mr-2" />
          Manage
        </Button>
      </Link>
    </div>
  )
}
