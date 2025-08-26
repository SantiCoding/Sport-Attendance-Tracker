import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "../../supabase"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")

  if (error) {
    console.error("OAuth error:", error, errorDescription)
    // Redirect to main app with error
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error)}`, request.url))
  }

  if (code) {
    try {
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error("Error exchanging code for session:", exchangeError)
        return NextResponse.redirect(new URL(`/?error=${encodeURIComponent("Failed to complete sign in")}`, request.url))
      }

      if (data.session) {
        console.log("Successfully signed in:", data.session.user.email)
      }
    } catch (error) {
      console.error("Unexpected error during auth callback:", error)
      return NextResponse.redirect(new URL(`/?error=${encodeURIComponent("Unexpected error during sign in")}`, request.url))
    }
  }

  // Redirect to the main app
  return NextResponse.redirect(new URL("/", request.url))
}
