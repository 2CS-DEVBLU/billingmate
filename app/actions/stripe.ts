"use server"

import { stripe } from "@/lib/stripe"
import { PRODUCTS } from "@/lib/products"
import { createClient } from "@/lib/supabase/server"

export async function startCheckoutSession(productId: string, companyId: string, userId: string) {
  const product = PRODUCTS.find((p) => p.id === productId)
  if (!product) {
    throw new Error(`Product with id "${productId}" not found`)
  }

  // Create or get Stripe customer
  const supabase = await createClient()
  const { data: existingSubscription } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("company_id", companyId)
    .single()

  let customerId = existingSubscription?.stripe_customer_id

  if (!customerId) {
    const { data: profile } = await supabase.from("profiles").select("email").eq("id", userId).single()

    const customer = await stripe.customers.create({
      email: profile?.email,
      metadata: {
        company_id: companyId,
        user_id: userId,
      },
    })
    customerId = customer.id
  }

  // Create Checkout Session
  const session = await stripe.checkout.sessions.create({
    ui_mode: "embedded",
    customer: customerId,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            description: product.description,
          },
          unit_amount: product.priceInCents,
          recurring: {
            interval: "month",
          },
        },
        quantity: 1,
      },
    ],
    mode: "subscription",
    redirect_on_completion: "never",
    metadata: {
      company_id: companyId,
      plan_type: productId,
    },
  })

  return session.client_secret!
}

export async function handleSubscriptionUpdate(sessionId: string) {
  const session = await stripe.checkout.sessions.retrieve(sessionId)

  if (session.status === "complete" && session.subscription) {
    const supabase = await createClient()
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string)

    const { error } = await supabase.from("subscriptions").upsert({
      company_id: session.metadata?.company_id,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
      plan_type: session.metadata?.plan_type,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })

    if (error) {
      console.error("Error updating subscription:", error)
      throw error
    }
  }
}
