import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { companyId } = await request.json()

    if (!companyId) {
      return NextResponse.json({ error: "Company ID is required" }, { status: 400 })
    }

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get company to check reactivation eligibility
    const { data: company } = await supabase
      .from("companies")
      .select("deactivated_at, reactivation_cooldown_until")
      .eq("id", companyId)
      .single()

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    // Check if still in cooldown period
    if (company.reactivation_cooldown_until) {
      const cooldownDate = new Date(company.reactivation_cooldown_until)
      if (cooldownDate > new Date()) {
        return NextResponse.json(
          { 
            error: `Company can be reactivated after ${cooldownDate.toLocaleDateString()}. Please contact support if you need immediate assistance.` 
          },
          { status: 403 }
        )
      }
    }

    // Check 30-day limit
    if (company.deactivated_at) {
      const deactivatedDate = new Date(company.deactivated_at)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      if (deactivatedDate < thirtyDaysAgo) {
        return NextResponse.json(
          { error: "30-day reactivation window has passed. Please contact support." },
          { status: 403 }
        )
      }
    }

    // Reactivate company
    const { error: companyError } = await supabase
      .from("companies")
      .update({
        is_active: true,
        deactivated_at: null,
        reactivation_cooldown_until: null,
      })
      .eq("id", companyId)

    if (companyError) throw companyError

    // Reactivate all users in the company
    const { error: usersError } = await supabase
      .from("profiles")
      .update({ is_active: true })
      .eq("company_id", companyId)

    if (usersError) throw usersError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error reactivating company:", error)
    return NextResponse.json(
      { error: "Failed to reactivate company" },
      { status: 500 }
    )
  }
}
