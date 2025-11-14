import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ClientNav } from "@/components/client-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle2 } from "lucide-react"

export default async function BillingSuccessPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*, companies(*)").eq("id", user.id).single()

  if (!profile) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
      <ClientNav companyName={profile.companies?.name} />

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-900/50">
                  <CheckCircle2 className="h-10 w-10 text-green-400" />
                </div>
              </div>
              <CardTitle className="text-2xl text-white">Subscription Activated!</CardTitle>
              <CardDescription className="text-slate-400">Your payment was successful</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-slate-300">
                Thank you for subscribing to BillingMate. Your account has been upgraded and you now have access to all
                premium features.
              </p>
              <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
