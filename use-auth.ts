"use client"

import { useState, useEffect } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase, isSupabaseConfigured } from "./supabase"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if Supabase is properly configured
    const initializeAuth = async () => {
      if (!isSupabaseConfigured) {
        setLoading(false)
        return
      }

      try {
        // Handle OAuth hash fragment tokens
        if (typeof window !== 'undefined' && window.location.hash) {
          console.log("Found hash fragment:", window.location.hash.substring(0, 100) + "...")
          const hashParams = new URLSearchParams(window.location.hash.substring(1))
          const accessToken = hashParams.get('access_token')
          const refreshToken = hashParams.get('refresh_token')
          
          console.log("Extracted tokens:", { 
            hasAccessToken: !!accessToken, 
            hasRefreshToken: !!refreshToken,
            accessTokenLength: accessToken?.length || 0
          })
          
          if (accessToken && refreshToken) {
            console.log("Processing OAuth tokens from hash fragment")
            try {
              const { data, error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              })
              
              if (error) {
                console.error("Error setting session from tokens:", error)
              } else if (data.session) {
                console.log("Successfully set session from OAuth tokens")
                setUser(data.session.user)
                // Clear the hash fragment
                window.history.replaceState({}, '', '/')
                console.log("Cleared hash fragment, user should now be signed in")
                // Force a page refresh to ensure everything updates
                window.location.reload()
              }
            } catch (error) {
              console.error("Error processing OAuth tokens:", error)
            }
          } else {
            console.log("No valid tokens found in hash fragment")
          }
        }

        // Get initial session
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error("Error getting session:", error)
        }

        setUser(data.session?.user ?? null)
        setLoading(false)

        // Listen for auth changes
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user ?? null)
          setLoading(false)
        })

        return () => subscription.unsubscribe()
      } catch (error) {
        console.error("Error initializing auth:", error)
        setLoading(false)
        return () => {}
      }
    }

    initializeAuth()
  }, [])

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured) {
      alert(
        "Cloud sync is not available in preview mode. To enable Google sign-in, please deploy the app with proper Supabase configuration.",
      )
      return
    }

    try {
      // Use the Vercel domain for production, fallback to current origin
      const redirectUrl = process.env.NODE_ENV === 'production' 
        ? 'https://tennis-tracker-five.vercel.app/auth/callback'
        : `${window.location.origin}/auth/callback`

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })
      if (error) {
        console.error("Error signing in with Google:", error)
        alert("Failed to sign in with Google. Please try again later.")
      }
    } catch (error) {
      console.error("Error signing in with Google:", error)
      alert("Failed to sign in with Google. Please try again later.")
    }
  }

  const signOut = async () => {
    if (!isSupabaseConfigured) {
      return
    }

    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("Error signing out:", error)
        alert("Failed to sign out. Please try again later.")
      }
    } catch (error) {
      console.error("Error signing out:", error)
      alert("Failed to sign out. Please try again later.")
    }
  }

  return {
    user,
    loading,
    signInWithGoogle,
    signOut,
    isSupabaseConfigured,
  }
}
