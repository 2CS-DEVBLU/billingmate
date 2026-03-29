"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { BarChart3, Loader2 } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { AuthLanguageSwitcher } from "@/components/auth-language-switcher"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [cnpjCpf, setCnpjCpf] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { t } = useI18n()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error: authError, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
          data: {
            full_name: fullName,
            company_name: companyName,
            cnpj_cpf: cnpjCpf,
            role: "client",
          },
        },
      })

      if (authError) throw authError
      if (!data.user) throw new Error("User creation failed")

      router.push("/auth/sign-up-success")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred during sign up")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-[#0b0b14]">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-violet-600/10 to-transparent" />
        <div className="absolute top-1/3 left-1/3 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <BarChart3 className="h-7 w-7 text-white" />
            </div>
            <span className="text-3xl font-bold text-white tracking-tight">BillingMate</span>
          </div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            {t.auth.tagline}<br />
            <span className="gradient-text">{t.auth.taglineHighlight}</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-md">{t.auth.description}</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="flex lg:hidden items-center gap-3 mb-8 justify-center">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">BillingMate</span>
          </div>

          <div className="glass border-white/[0.06] rounded-2xl p-8">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h1 className="text-xl font-bold text-white">{t.auth.createAccount}</h1>
                <p className="text-sm text-slate-500 mt-1">Start your free trial</p>
              </div>
              <AuthLanguageSwitcher />
            </div>

            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-11 bg-white/[0.03] border-white/[0.08] text-white placeholder:text-slate-600 focus:border-indigo-500/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  {t.settings.companyName}
                </Label>
                <Input
                  id="companyName"
                  type="text"
                  placeholder="Acme Inc"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="h-11 bg-white/[0.03] border-white/[0.08] text-white placeholder:text-slate-600 focus:border-indigo-500/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnpjCpf" className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  {t.settings.taxId}
                </Label>
                <Input
                  id="cnpjCpf"
                  type="text"
                  placeholder="00.000.000/0000-00"
                  value={cnpjCpf}
                  onChange={(e) => setCnpjCpf(e.target.value)}
                  className="h-11 bg-white/[0.03] border-white/[0.08] text-white placeholder:text-slate-600 focus:border-indigo-500/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  {t.auth.email}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 bg-white/[0.03] border-white/[0.08] text-white placeholder:text-slate-600 focus:border-indigo-500/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  {t.auth.password}
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 bg-white/[0.03] border-white/[0.08] text-white focus:border-indigo-500/50"
                />
              </div>

              {error && (
                <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-medium shadow-lg shadow-indigo-500/20"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  t.auth.createAccount
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-500">
              {t.auth.hasAccount}{" "}
              <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                {t.common.signIn}
              </Link>
            </div>
          </div>

          <p className="mt-6 text-center text-[11px] text-slate-600">
            Powered by <span className="text-slate-500">2CS Consulting</span>
          </p>
        </div>
      </div>
    </div>
  )
}
