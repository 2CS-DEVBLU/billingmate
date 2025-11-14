"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CheckoutForm } from "./checkout-form"

interface CheckoutButtonProps {
  productId: string
  companyId: string
  userId: string
  className?: string
}

export function CheckoutButton({ productId, companyId, userId, className }: CheckoutButtonProps) {
  const [showCheckout, setShowCheckout] = useState(false)

  return (
    <>
      <Button onClick={() => setShowCheckout(true)} className={className || "w-full bg-indigo-600 hover:bg-indigo-700"}>
        Subscribe Now
      </Button>

      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Complete Your Subscription</DialogTitle>
            <DialogDescription className="text-slate-400">
              Enter your payment details to start your subscription
            </DialogDescription>
          </DialogHeader>
          <CheckoutForm
            productId={productId}
            companyId={companyId}
            userId={userId}
            onSuccess={() => setShowCheckout(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
