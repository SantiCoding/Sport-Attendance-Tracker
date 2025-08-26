'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    console.log("🔍 Auth callback page: Starting...")
    console.log("🔍 Current URL:", window.location.href)
    console.log("🔍 Hash fragment:", window.location.hash)
    console.log("🔍 Search params:", window.location.search)
    console.log("🔍 Full URL parts:", {
      href: window.location.href,
      origin: window.location.origin,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash
    })
    
    // Check if we have hash fragment tokens
    if (typeof window !== 'undefined' && window.location.hash) {
      console.log("🔍 Auth callback page: Found hash fragment")
      
      // Extract tokens from hash
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      
      console.log("🔑 Auth callback page: Token check:", {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        accessTokenLength: accessToken?.length || 0
      })
      
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
      // Check if the URL contains tokens in the path (malformed URL)
      const currentUrl = window.location.href
      if (currentUrl.includes('access_token=')) {
        console.log("🔍 Auth callback page: Found tokens in URL path")
        
        // Extract tokens from the URL
        const urlParams = new URLSearchParams(currentUrl.split('?')[1] || currentUrl.split('#')[1] || '')
        const accessToken = urlParams.get('access_token')
        const refreshToken = urlParams.get('refresh_token')
        
        if (accessToken && refreshToken) {
          console.log("🔑 Auth callback page: Found OAuth tokens in URL path")
          
          // Store tokens temporarily in sessionStorage
          sessionStorage.setItem('oauth_access_token', accessToken)
          sessionStorage.setItem('oauth_refresh_token', refreshToken)
          
          // Redirect to main app
          console.log("🔄 Auth callback page: Redirecting to main app")
          router.replace('/')
        } else {
          console.log("⚠️ Auth callback page: No valid tokens found in URL path")
          router.replace('/')
        }
      } else {
        // Final fallback - try to extract tokens from anywhere in the URL
        console.log("🔍 Auth callback page: Trying final fallback token extraction")
        const fullUrl = window.location.href
        
        // Look for access_token anywhere in the URL
        const accessTokenMatch = fullUrl.match(/access_token=([^&]+)/)
        const refreshTokenMatch = fullUrl.match(/refresh_token=([^&]+)/)
        
        if (accessTokenMatch && refreshTokenMatch) {
          const accessToken = decodeURIComponent(accessTokenMatch[1])
          const refreshToken = decodeURIComponent(refreshTokenMatch[1])
          
          console.log("🔑 Auth callback page: Found tokens in URL via regex")
          sessionStorage.setItem('oauth_access_token', accessToken)
          sessionStorage.setItem('oauth_refresh_token', refreshToken)
          console.log("🔄 Auth callback page: Redirecting to main app")
          router.replace('/')
        } else {
          console.log("📄 Auth callback page: No tokens found anywhere, redirecting to main app")
          router.replace('/')
        }
      }
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
