"use server"

import { stripe } from "@/lib/stripe"
import { PRODUCTS } from "@/lib/products"
import { createClient } from "@/lib/supabase/server"

export async function startCheckoutSession(productId: string, companyId: string, userId: string) {
  const product = PRODUCTS.find((p) => p.id === productId)
  if (!product) {
    throw new Error(`Product with id "${productId}" not found`)
  }

  const supabase = await createClient()
  
  if (productId !== 'trial') {
    const { data: company } = await supabase
      .from("companies")
      .select("is_registration_complete, cnpj_cpf, vat_number, country_code")
      .eq("id", companyId)
      .single()

    if (!company?.is_registration_complete) {
      throw new Error("Company registration must be complete. Please provide CNPJ/CPF (Brazil) or VAT number (other countries).")
    }
  }

  // Create or get Stripe customer
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
      max_integrations: product.maxIntegrations.toString(),
      max_cloud_spend: product.maxCloudSpend.toString(),
      max_analysis_months: product.maxAnalysisMonths.toString(),
      ai_recommendations_enabled: product.aiRecommendationsEnabled.toString(),
    },
  })

  return session.client_secret!
}

export async function handleSubscriptionUpdate(sessionId: string) {
  const session = await stripe.checkout.sessions.retrieve(sessionId)

  if (session.status === "complete" && session.subscription) {
    const supabase = await createClient()
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
    
    const metadata = session.metadata || {}

    const { error } = await supabase.from("subscriptions").upsert({
      company_id: metadata.company_id,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
      plan_type: metadata.plan_type,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      max_integrations: parseInt(metadata.max_integrations || '1'),
      max_cloud_spend: parseFloat(metadata.max_cloud_spend || '5000'),
      max_analysis_months: parseInt(metadata.max_analysis_months || '3'),
      ai_recommendations_enabled: metadata.ai_recommendations_enabled === 'true',
    })

    if (error) {
      console.error("Error updating subscription:", error)
      throw error
    }
  }
}
