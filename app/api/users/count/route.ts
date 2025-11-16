import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single()

    if (profileError || !profile?.company_id) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Count active users in company
    const { count, error: countError } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("company_id", profile.company_id)
      .eq("is_active", true)

    if (countError) {
      console.error("[v0] Error counting users:", countError)
      return NextResponse.json({ error: "Failed to count users" }, { status: 500 })
    }

    return NextResponse.json({ count: count || 0 })
  } catch (error) {
    console.error("[v0] Error in count route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
