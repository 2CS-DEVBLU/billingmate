import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log("[v0] Middleware - Path:", request.nextUrl.pathname, "User:", user?.email || "none")

  // Redirect logic for protected routes
  if (!user && !request.nextUrl.pathname.startsWith("/auth") && request.nextUrl.pathname !== "/") {
    console.log("[v0] Middleware - Redirecting to login (no user)")
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  // If user is logged in and tries to access auth pages, redirect to appropriate dashboard
  if (user && request.nextUrl.pathname.startsWith("/auth")) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    console.log("[v0] Middleware - User on auth page, role:", profile?.role)

    const url = request.nextUrl.clone()
    if (profile?.role === "admin") {
      url.pathname = "/admin"
    } else {
      url.pathname = "/dashboard"
    }
    console.log("[v0] Middleware - Redirecting to:", url.pathname)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
