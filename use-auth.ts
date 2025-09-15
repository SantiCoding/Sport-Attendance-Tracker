"use client"

import { useState } from "react"

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)

  // Simple guest mode functionality
  const signInAsGuest = () => {
    setUser({ id: 'guest', email: 'guest@local.com', name: 'Guest User' })
    setLoading(false)
  }

  const signOut = () => {
    setUser(null)
    setLoading(false)
  }

  return {
    user,
    loading,
    signInAsGuest,
    signOut,
    isSupabaseConfigured: false,
  }
}
