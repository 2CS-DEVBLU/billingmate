import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PATCH(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = await createClient()
    const { userId } = params
    const { is_admin } = await request.json()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current user's profile
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("company_id, is_admin")
      .eq("id", user.id)
      .single()

    if (!currentProfile?.is_admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get target user's profile
    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", userId)
      .single()

    if (targetProfile?.company_id !== currentProfile.company_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Update the user role
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ is_admin })
      .eq("id", userId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error updating user role:", error)
    return NextResponse.json(
      { error: "Failed to update user role" },
      { status: 500 }
    )
  }
}
