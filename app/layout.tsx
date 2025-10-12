import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ToastProvider } from "../toast"
import { PWAProvider } from "../pwa-provider"
import { SpeedInsights } from "@vercel/speed-insights/next"

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial']
})

export const metadata: Metadata = {
  title: "Tennis Attendance Tracker",
  description: "Professional tennis attendance management system for coaches",
  generator: "v0.app",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Tennis Tracker",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/placeholder-logo.png",
    shortcut: "/placeholder-logo.png",
    apple: "/placeholder-logo.png",
  },
  // Performance optimizations
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Tennis Attendance Tracker",
    description: "Professional tennis attendance management system for coaches",
    type: "website",
  },
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a0a",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Tennis Tracker" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#0a0a0a" />
        <meta name="application-name" content="Tennis Tracker" />
        <meta name="msapplication-TileColor" content="#0a0a0a" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="color-scheme" content="dark" />
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Critical CSS for initial render */
            html, body {
              height: 100%;
              margin: 0;
              padding: 0;
              overflow: hidden;
            }
            
            body { 
              font-family: ${inter.style.fontFamily}, system-ui, -apple-system, sans-serif;
              background: #0a0a0a;
              background-image: 
                radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.15) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.15) 0%, transparent 50%),
                radial-gradient(circle at 40% 80%, rgba(120, 200, 255, 0.15) 0%, transparent 50%);
              background-attachment: fixed;
              overflow-x: hidden;
              color: #ffffff;
            }
            
            .app-wrapper {
              display: flex;
              flex-direction: column;
              height: 100vh;
              overflow: hidden;
            }
            
            .app-content {
              flex: 1 1 auto;
              overflow-y: auto;
              -webkit-overflow-scrolling: touch;
              padding-bottom: calc(72px + env(safe-area-inset-bottom));
              box-sizing: border-box;
            }
            
            .bottom-nav {
              flex: 0 0 auto;
              height: 72px;
              z-index: 999;
              border-top: 1px solid rgba(255,255,255,0.1);
              background: rgba(20,20,20,0.95);
              backdrop-filter: blur(12px);
            }
            
            /* Prevent layout shift */
            .loading-placeholder {
              min-height: 100vh;
              background: #0a0a0a;
            }
          `
        }} />
      </head>
      <body className={inter.className}>
        <PWAProvider>
          <ToastProvider>{children}</ToastProvider>
        </PWAProvider>
        <SpeedInsights />
      </body>
    </html>
  )
}
