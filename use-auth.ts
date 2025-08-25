"use client"

import { useState, useEffect } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

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
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
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
