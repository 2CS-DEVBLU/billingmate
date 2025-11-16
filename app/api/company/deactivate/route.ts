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

    // Check if user is company admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id, company_account_role, is_admin")
      .eq("id", user.id)
      .single()

    if (!profile || (profile.company_id !== companyId && profile.company_account_role !== 'admin' && !profile.is_admin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Deactivate company
    const { error: companyError } = await supabase
      .from("companies")
      .update({
        is_active: false,
        deactivated_at: new Date().toISOString(),
      })
      .eq("id", companyId)

    if (companyError) throw companyError

    // Deactivate all users in the company
    const { error: usersError } = await supabase
      .from("profiles")
      .update({ is_active: false })
      .eq("company_id", companyId)

    if (usersError) throw usersError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deactivating company:", error)
    return NextResponse.json(
      { error: "Failed to deactivate company" },
      { status: 500 }
    )
  }
}
