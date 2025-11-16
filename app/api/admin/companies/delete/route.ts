import { NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify admin role
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
    }

    const { companyId } = await request.json()

    if (!companyId) {
      return NextResponse.json({ error: "Company ID is required" }, { status: 400 })
    }

    console.log("[v0] Starting company deletion for ID:", companyId)

    const serviceSupabase = await createServiceClient()
    
    // Verify company exists first
    const { data: companyCheck, error: companyCheckError } = await serviceSupabase
      .from("companies")
      .select("id, name")
      .eq("id", companyId)
      .maybeSingle()
    
    if (companyCheckError || !companyCheck) {
      console.error("[v0] Company not found:", companyCheckError)
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }
    
    console.log("[v0] Deleting company via RPC:", companyCheck.name)
    
    // Call the database function that handles cascading deletion
    const { data: deleteResult, error: deleteError } = await serviceSupabase
      .rpc('delete_company_cascade', { p_company_id: companyId })
    
    if (deleteError) {
      console.error("[v0] RPC delete error:", deleteError)
      return NextResponse.json({ 
        error: "Failed to delete company: " + deleteError.message 
      }, { status: 500 })
    }
    
    console.log("[v0] Delete result:", deleteResult)
    
    if (deleteResult?.error) {
      return NextResponse.json({ error: deleteResult.error }, { status: 500 })
    }
    
    // Verify deletion
    const { data: verifyDeleted } = await serviceSupabase
      .from("companies")
      .select("id")
      .eq("id", companyId)
      .maybeSingle()
    
    if (verifyDeleted) {
      console.error("[v0] CRITICAL: Company still exists after deletion!")
      return NextResponse.json({ 
        error: "Company deletion verification failed - data still exists" 
      }, { status: 500 })
    }

    console.log("[v0] Company deletion verified successfully")

    return NextResponse.json({ 
      success: true, 
      message: "Company and all associated data deleted successfully",
      details: deleteResult 
    })
  } catch (error) {
    console.error("[v0] Delete company error:", error)
    return NextResponse.json(
      { error: "Failed to delete company: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 }
    )
  }
}
