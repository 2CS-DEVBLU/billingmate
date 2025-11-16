import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", currentUser.id).single()

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const {
      email,
      password,
      fullName,
      companyId,
      companyRole,
      systemRole,
      companyAccountRole,
      isActive,
      isReader,
      avatarUrl,
    } = body

    const generatedPassword = password || Math.random().toString(36).slice(-10) + "A1!"

    const host = request.headers.get('host')
    const protocol = request.headers.get('x-forwarded-proto') || 'https'
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: generatedPassword,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${baseUrl}/dashboard`,
      },
    })

    if (authError) {
      console.error("Auth error:", authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: "User creation failed" }, { status: 500 })
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        email: email,
        company_id: companyId,
        role: systemRole,
        company_role: companyRole,
        company_account_role: companyAccountRole,
        is_active: isActive,
        is_reader: isReader,
        avatar_url: avatarUrl,
      })
      .eq("id", authData.user.id)

    if (profileError) {
      console.error("Profile update error:", profileError)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      userId: authData.user.id,
      message: password ? "User created successfully" : `User created with password: ${generatedPassword}`,
    })
  } catch (error) {
    console.error("Create user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
