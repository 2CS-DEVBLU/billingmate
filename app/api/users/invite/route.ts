import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { crypto } from "crypto"

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

    // Get user profile with company info
    console.log("[v0] Getting user profile...")
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, company_id, company_account_role, is_admin")
      .eq("id", user.id)
      .single()

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
      .single()

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

    console.log("[v0] Parsing request body...")
    const { email, role } = await request.json()
    console.log("[v0] Email:", email, "Role:", role)

    if (!email || !role) {
      return NextResponse.json({ error: "Email and role are required" }, { status: 400 })
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

    if (existingInvite && existingInvite.status === 'pending') {
      return NextResponse.json(
        { error: "An invitation has already been sent to this email" },
        { status: 400 }
      )
    }

    // Generate invitation token
    console.log("[v0] Generating invitation token...")
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
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
      .single()

    if (inviteError) {
      console.error("[v0] Error creating invitation:", inviteError)
      return NextResponse.json({ error: "Failed to create invitation" }, { status: 500 })
    }

    console.log("[v0] Invitation created:", invitation)

    // TODO: Send invitation email with token
    // For now, we'll just return the invitation URL
    const invitationUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/accept-invite?token=${token}`
    
    console.log("[v0] Invitation URL:", invitationUrl)

    return NextResponse.json({
      success: true,
      invitation,
      invitationUrl, // In production, this would be sent via email
    })
  } catch (error) {
    console.error("[v0] Critical error in invite route:", error)
    console.error("[v0] Error name:", error instanceof Error ? error.name : "Unknown")
    console.error("[v0] Error message:", error instanceof Error ? error.message : "Unknown")
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
