"use client"

import { useCallback } from "react"
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { startCheckoutSession } from "@/app/actions/stripe"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface CheckoutFormProps {
  productId: string
  companyId: string
  userId: string
  onSuccess: () => void
}

export function CheckoutForm({ productId, companyId, userId, onSuccess }: CheckoutFormProps) {
  const fetchClientSecret = useCallback(() => {
    return startCheckoutSession(productId, companyId, userId)
  }, [productId, companyId, userId])

  return (
    <div id="checkout">
      <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  )
}
