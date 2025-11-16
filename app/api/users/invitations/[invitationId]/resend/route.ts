import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { sendInvitationEmail } from "@/lib/email/send-invitation"

export async function POST(
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
      .select("company_id, is_admin, full_name, email")
      .eq("id", user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { data: invitation } = await supabase
      .from("user_invitations")
      .select("email, company_id")
      .eq("id", invitationId)
      .eq("company_id", profile.company_id)
      .single()

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
    }

    const { data: company } = await supabase
      .from("companies")
      .select("name")
      .eq("id", invitation.company_id)
      .single()

    // Generate new token and expiry
    const tokenBytes = new Uint8Array(32)
    crypto.getRandomValues(tokenBytes)
    const token = Array.from(tokenBytes, byte => byte.toString(16).padStart(2, '0')).join('')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

    // Update the invitation
    const { error: updateError } = await supabase
      .from("user_invitations")
      .update({
        token,
        expires_at: expiresAt.toISOString(),
        status: "pending",
      })
      .eq("id", invitationId)
      .eq("company_id", profile.company_id)

    if (updateError) {
      throw updateError
    }

    const invitationUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ''}/auth/accept-invite?token=${token}`
    
    const emailResult = await sendInvitationEmail({
      email: invitation.email,
      companyName: company?.name || "your company",
      invitationUrl,
    })

    console.log("[v0] Invitation resent, email result:", emailResult)

    return NextResponse.json({ 
      success: true,
      method: emailResult.method,
      url: emailResult.url,
      emailSent: emailResult.method === 'email'
    })
  } catch (error) {
    console.error("[v0] Error resending invitation:", error)
    return NextResponse.json(
      { error: "Failed to resend invitation" },
      { status: 500 }
    )
  }
}
