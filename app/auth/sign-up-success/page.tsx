import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-3xl font-bold text-white">BillingMate</h1>
          </div>
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Check Your Email</CardTitle>
              <CardDescription className="text-slate-400">We&apos;ve sent you a confirmation link</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-300">
                Thank you for signing up! Please check your email and click the confirmation link to activate your
                account.
              </p>
              <p className="text-sm text-slate-400">
                Once confirmed, you&apos;ll be able to sign in and start optimizing your cloud costs.
              </p>
              <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700">
                <Link href="/auth/login">Back to Sign In</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
