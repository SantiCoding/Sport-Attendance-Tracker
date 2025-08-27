import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ToastProvider } from "../toast"
import { PWAProvider } from "../pwa-provider"
import { SpeedInsights } from "@vercel/speed-insights/next"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Tennis Attendance Tracker",
  description: "Professional tennis attendance management system for coaches",
  generator: "v0.app",
  manifest: "/manifest.json",
  themeColor: "#0a0a0a",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
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
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Tennis Tracker" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#0a0a0a" />
        <meta name="application-name" content="Tennis Tracker" />
        <meta name="msapplication-TileColor" content="#0a0a0a" />
        <meta name="msapplication-tap-highlight" content="no" />
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
