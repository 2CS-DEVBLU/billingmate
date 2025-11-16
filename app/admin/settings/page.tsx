import { redirect } from 'next/navigation'
import { createClient } from "@/lib/supabase/server"
import { AdminNav } from "@/components/admin-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { OpenAISettingsForm } from "@/components/openai-settings-form"
import { CronSettingsForm } from "@/components/cron-settings-form"

export default async function AdminSettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "admin") {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
      <AdminNav />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Platform Settings</h1>
          <p className="text-slate-400 mt-2">Configure platform-wide settings and integrations</p>
        </div>

        <div className="space-y-6">
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Automatic Sync Configuration</CardTitle>
              <CardDescription className="text-slate-400">
                Configure automated cron jobs for syncing cloud provider billing data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CronSettingsForm />
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">AI Integration</CardTitle>
              <CardDescription className="text-slate-400">
                Configure OpenAI API for AI-powered cost recommendations and insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OpenAISettingsForm />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
