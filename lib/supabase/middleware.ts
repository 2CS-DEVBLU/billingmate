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

  let user = null
  try {
    const { data, error } = await supabase.auth.getUser()
    
    // If we get a session_not_found error, clear the invalid session
    if (error?.message?.includes('session_not_found') || error?.message?.includes('Session from session_id claim')) {
      console.log("[v0] Middleware - Invalid session detected, clearing cookies")
      
      // Clear all auth-related cookies
      const response = NextResponse.next({
        request,
      })
      
      // Remove Supabase auth cookies
      const cookiesToRemove = request.cookies.getAll()
        .filter(cookie => cookie.name.includes('sb-') || cookie.name.includes('supabase'))
      
      cookiesToRemove.forEach(cookie => {
        response.cookies.delete(cookie.name)
      })
      
      // Redirect to login if trying to access protected route
      if (!request.nextUrl.pathname.startsWith("/auth") && request.nextUrl.pathname !== "/") {
        const url = request.nextUrl.clone()
        url.pathname = "/auth/login"
        return NextResponse.redirect(url)
      }
      
      return response
    }
    
    user = data.user
  } catch (error) {
    console.log("[v0] Middleware - Error getting user:", error)
    // Clear cookies and redirect on any auth error
    const response = NextResponse.next({ request })
    request.cookies.getAll().forEach(cookie => {
      if (cookie.name.includes('sb-') || cookie.name.includes('supabase')) {
        response.cookies.delete(cookie.name)
      }
    })
    
    if (!request.nextUrl.pathname.startsWith("/auth") && request.nextUrl.pathname !== "/") {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      return NextResponse.redirect(url)
    }
    
    return response
  }

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
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()

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
