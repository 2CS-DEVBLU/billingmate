import { AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from 'next/link'

interface RegistrationIncompleteBannerProps {
  isAdmin: boolean
  company: any
}

export function RegistrationIncompleteBanner({ isAdmin, company }: RegistrationIncompleteBannerProps) {
  const needsTaxInfo = company?.country_code === 'BR' 
    ? !company?.cnpj_cpf 
    : !company?.vat_number

  if (!needsTaxInfo && company?.name) {
    return null
  }

  return (
    <Card className="border-yellow-800 bg-yellow-900/20 backdrop-blur mb-8">
      <CardHeader>
        <CardTitle className="text-yellow-300 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Complete Company Registration Required
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-yellow-200 mb-4">
          {isAdmin 
            ? 'As the company administrator, you must complete the company registration before using the system.'
            : 'Your company administrator needs to complete the company registration before you can use the system.'}
        </p>
        {isAdmin && (
          <Button asChild className="bg-yellow-600 hover:bg-yellow-700 text-white">
            <Link href="/dashboard/settings">Complete Registration Now</Link>
          </Button>
        )}
        {!isAdmin && (
          <p className="text-yellow-300 text-sm">
            Please contact your administrator to complete the registration.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
