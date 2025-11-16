import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendInvitationEmail } from "@/lib/email/send-invitation"

export async function POST(request: Request) {
  console.log("[v0] Invite API - Request received")
  
  try {
    console.log("[v0] Creating Supabase client...")
    const supabase = await createClient()
    console.log("[v0] Supabase client created")
    
    console.log("[v0] Getting authenticated user...")
    const { data: { user } } = await supabase.auth.getUser()
    console.log("[v0] User retrieved:", user?.id)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Parsing request body...")
    const body = await request.json()
    const { email, role } = body
    console.log("[v0] Email:", email, "Role:", role)

    if (!email || !role) {
      return NextResponse.json({ error: "Email and role are required" }, { status: 400 })
    }

    // Get user profile with company info
    console.log("[v0] Getting user profile...")
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, company_id, company_account_role, is_admin, full_name")
      .eq("id", user.id)
      .maybeSingle()

    console.log("[v0] Profile data:", profile)
    console.log("[v0] Profile error:", profileError)

    if (profileError || !profile) {
      console.error("[v0] Error fetching profile:", profileError)
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    if (!profile.company_id) {
      return NextResponse.json({ error: "No company associated with user" }, { status: 400 })
    }

    // Get company data separately
    console.log("[v0] Getting company data...")
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id, name, admin_user_id, cnpj_cpf, vat_number, is_registration_complete")
      .eq("id", profile.company_id)
      .maybeSingle()

    console.log("[v0] Company data:", company)
    console.log("[v0] Company error:", companyError)

    if (companyError || !company) {
      console.error("[v0] Error fetching company:", companyError)
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    // Check if user is admin
    const isAdmin = profile.company_account_role === 'admin' || 
                    profile.is_admin || 
                    company.admin_user_id === user.id

    if (!isAdmin) {
      return NextResponse.json({ error: "Only administrators can invite users" }, { status: 403 })
    }

    // Check if company registration is complete
    if (!company.is_registration_complete) {
      return NextResponse.json(
        { error: "Company registration must be completed before inviting users" },
        { status: 400 }
      )
    }

    // Check current user count (including admin)
    console.log("[v0] Counting existing users...")
    const { count, error: countError } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("company_id", profile.company_id)
      .eq("is_active", true)

    if (countError) {
      console.error("[v0] Error counting users:", countError)
      return NextResponse.json({ error: "Failed to check user limit" }, { status: 500 })
    }

    console.log("[v0] Current user count:", count)

    if (count && count >= 4) { // 1 admin + 3 users max
      return NextResponse.json(
        { error: "Maximum of 3 additional users allowed per company" },
        { status: 400 }
      )
    }

    // Check if user already exists in company
    console.log("[v0] Checking for existing user...")
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .eq("company_id", profile.company_id)
      .maybeSingle()

    console.log("[v0] Existing user:", existingUser)

    if (existingUser) {
      return NextResponse.json(
        { error: "User is already part of this company" },
        { status: 400 }
      )
    }

    // Check if invitation already exists
    console.log("[v0] Checking for existing invitation...")
    const { data: existingInvite } = await supabase
      .from("user_invitations")
      .select("id, status")
      .eq("email", email)
      .eq("company_id", profile.company_id)
      .maybeSingle()

    console.log("[v0] Existing invite:", existingInvite)

    if (existingInvite) {
      if (existingInvite.status === 'pending') {
        // Update existing pending invitation with new token and expiry
        console.log("[v0] Updating existing pending invitation...")
        const tokenArray = new Uint8Array(32)
        crypto.getRandomValues(tokenArray)
        const token = Array.from(tokenArray)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')

        const { data: updatedInvite, error: updateError } = await supabase
          .from("user_invitations")
          .update({
            role,
            token,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            invited_by: user.id,
          })
          .eq("id", existingInvite.id)
          .select()
          .maybeSingle()

        if (updateError) {
          console.error("[v0] Error updating invitation:", updateError)
          return NextResponse.json({ error: "Failed to resend invitation" }, { status: 500 })
        }

        console.log("[v0] Invitation updated:", updatedInvite)
        const invitationUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ''}/auth/accept-invite?token=${token}`

        return NextResponse.json({
          success: true,
          invitation: updatedInvite,
          invitationUrl,
          resent: true,
        })
      }
      
      // If invitation was accepted, they're already a user - handled by existingUser check above
      // If invitation was rejected or expired, allow creating a new one
      console.log("[v0] Deleting old rejected/expired invitation...")
      await supabase
        .from("user_invitations")
        .delete()
        .eq("id", existingInvite.id)
    }

    console.log("[v0] Generating invitation token...")
    const tokenArray = new Uint8Array(32)
    crypto.getRandomValues(tokenArray)
    const token = Array.from(tokenArray)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    console.log("[v0] Token generated")

    // Create invitation
    console.log("[v0] Creating invitation record...")
    const { data: invitation, error: inviteError } = await supabase
      .from("user_invitations")
      .insert({
        company_id: profile.company_id,
        invited_by: user.id,
        email,
        role,
        token,
        status: "pending",
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      })
      .select()
      .maybeSingle()

    if (inviteError) {
      console.error("[v0] Error creating invitation:", inviteError)
      return NextResponse.json({ error: "Failed to create invitation" }, { status: 500 })
    }

    console.log("[v0] Invitation created:", invitation)

    const host = request.headers.get('host')
    const protocol = request.headers.get('x-forwarded-proto') || 'https'
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`
    
    const invitationUrl = `${baseUrl}/auth/accept-invite?token=${token}`
    
    console.log("[v0] Invitation URL:", invitationUrl)

    // Send email notification
    const emailResult = await sendInvitationEmail({
      email,
      companyName: company.name,
      invitationUrl,
    })

    if (!emailResult.success) {
      console.warn("[v0] Email failed to send, but invitation was created")
    }

    return NextResponse.json({
      success: true,
      invitation,
      invitationUrl, // Still return URL for development/testing
      emailSent: emailResult.success,
    })
  } catch (error) {
    console.error("[v0] Critical error in invite route:", error)
    console.error("[v0] Error details:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : "No stack trace"
    })
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
