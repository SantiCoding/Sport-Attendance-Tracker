import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "../../supabase"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")

  console.log("Auth callback received:", { code: !!code, error, errorDescription })

  if (error) {
    console.error("OAuth error:", error, errorDescription)
    // Redirect to main app with error
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error)}`, request.url))
  }

  if (code) {
    try {
      console.log("Exchanging code for session...")
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error("Error exchanging code for session:", exchangeError)
        return NextResponse.redirect(new URL(`/?error=${encodeURIComponent("Failed to complete sign in")}`, request.url))
      }

      if (data.session) {
        console.log("Successfully signed in:", data.session.user.email)
        // Set a cookie to indicate successful sign-in
        const response = NextResponse.redirect(new URL("/", request.url))
        response.cookies.set("auth_success", "true", { maxAge: 60, httpOnly: false })
        return response
      } else {
        console.error("No session data received")
        return NextResponse.redirect(new URL(`/?error=${encodeURIComponent("No session data received")}`, request.url))
      }
    } catch (error) {
      console.error("Unexpected error during auth callback:", error)
      return NextResponse.redirect(new URL(`/?error=${encodeURIComponent("Unexpected error during sign in")}`, request.url))
    }
  }

  // No code or error, redirect to main app
  console.log("No code or error in callback, redirecting to main app")
  return NextResponse.redirect(new URL("/", request.url))
}
