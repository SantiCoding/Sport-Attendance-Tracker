'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    // Check if we have hash fragment tokens
    if (typeof window !== 'undefined' && window.location.hash) {
      console.log("🔍 Auth callback page: Found hash fragment")
      
      // Extract tokens from hash
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      
      if (accessToken && refreshToken) {
        console.log("🔑 Auth callback page: Found OAuth tokens")
        
        // Store tokens temporarily in sessionStorage
        sessionStorage.setItem('oauth_access_token', accessToken)
        sessionStorage.setItem('oauth_refresh_token', refreshToken)
        
        // Redirect to main app
        console.log("🔄 Auth callback page: Redirecting to main app")
        router.replace('/')
      } else {
        console.log("⚠️ Auth callback page: No valid tokens found")
        router.replace('/')
      }
    } else {
      console.log("📄 Auth callback page: No hash fragment, redirecting to main app")
      router.replace('/')
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  )
}
