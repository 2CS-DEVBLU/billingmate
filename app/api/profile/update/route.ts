import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { userId, name } = await request.json()

    const supabase = await createClient()

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (error) {
      console.error("[v0] Error updating profile:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Profile update error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
