import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function DELETE(
  request: Request,
  { params }: { params: { invitationId: string } }
) {
  try {
    const supabase = await createClient()
    const { invitationId } = params

    console.log("[v0] Delete invitation request for:", invitationId)

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.log("[v0] Delete invitation - No user authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Delete invitation - User:", user.email)

    // Get current user's profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id, is_admin")
      .eq("id", user.id)
      .maybeSingle()

    console.log("[v0] Delete invitation - Profile:", profile)

    if (!profile?.is_admin) {
      console.log("[v0] Delete invitation - User is not admin")
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    console.log("[v0] Delete invitation - Deleting invitation:", invitationId, "for company:", profile.company_id)

    // Delete the invitation
    const { error: deleteError, data: deletedData } = await supabase
      .from("user_invitations")
      .delete()
      .eq("id", invitationId)
      .eq("company_id", profile.company_id)
      .select()

    console.log("[v0] Delete invitation - Delete result:", { deletedData, deleteError })

    if (deleteError) {
      console.error("[v0] Delete invitation - Error:", deleteError)
      throw deleteError
    }

    console.log("[v0] Delete invitation - Success")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting invitation:", error)
    return NextResponse.json(
      { error: "Failed to delete invitation" },
      { status: 500 }
    )
  }
}
