import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function DELETE(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = await createClient()
    const { userId } = params

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

    // Prevent self-deletion
    if (userId === user.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
    }

    // Delete the user profile
    const { error: deleteError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting user:", error)
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    )
  }
}
