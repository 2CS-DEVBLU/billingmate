import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function DELETE(
  request: Request,
  { params }: { params: { invitationId: string } }
) {
  try {
    const supabase = await createClient()
    const { invitationId } = params

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current user's profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id, is_admin")
      .eq("id", user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Delete the invitation
    const { error: deleteError } = await supabase
      .from("user_invitations")
      .delete()
      .eq("id", invitationId)
      .eq("company_id", profile.company_id)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting invitation:", error)
    return NextResponse.json(
      { error: "Failed to delete invitation" },
      { status: 500 }
    )
  }
}
