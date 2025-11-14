import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Cloud, Sparkles } from "lucide-react"

interface CloudAccount {
  id: string
  provider: string
  account_name: string
  account_id: string
  monthly_spend: number
}

interface CloudAccountsCardProps {
  cloudAccounts: CloudAccount[]
}

export function CloudAccountsCard({ cloudAccounts }: CloudAccountsCardProps) {
  const getProviderBadge = (provider: string) => {
    const colors = {
      aws: "bg-orange-900/50 text-orange-300 border-orange-800",
      azure: "bg-blue-900/50 text-blue-300 border-blue-800",
      gcp: "bg-green-900/50 text-green-300 border-green-800",
    }
    return colors[provider as keyof typeof colors] || "bg-slate-800 text-slate-300 border-slate-700"
  }

  return (
    <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-white">Cloud Accounts</CardTitle>
        <CardDescription className="text-slate-400">Your connected cloud provider accounts</CardDescription>
      </CardHeader>
      <CardContent>
        {cloudAccounts.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Cloud className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No cloud accounts connected yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cloudAccounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-4 rounded-lg border border-slate-800 bg-slate-950/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-900/50">
                    <Sparkles className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div>
                    <div className="font-medium text-white">{account.account_name}</div>
                    <div className="text-sm text-slate-500">{account.account_id}</div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className={getProviderBadge(account.provider)}>
                    {account.provider.toUpperCase()}
                  </Badge>
                  <div className="text-sm text-slate-400 mt-1">
                    ${Number(account.monthly_spend).toLocaleString()}/mo
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
