"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration)
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError)
          })
      })
    }

    // Check if app is already installed
    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true)
      }
    }

    checkIfInstalled()

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallPrompt(true)
    }

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
      console.log('PWA was installed')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    } else {
      console.log('User dismissed the install prompt')
    }

    setDeferredPrompt(null)
    setShowInstallPrompt(false)
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    setDeferredPrompt(null)
  }

  return (
    <>
      {children}
      
      {/* Install Prompt */}
      {showInstallPrompt && !isInstalled && (
        <div className="fixed bottom-20 left-4 right-4 z-[9999] sm:bottom-4 sm:left-4 sm:right-4 sm:max-w-sm sm:ml-auto">
          <Card className="glass-card border-blue-500/30 bg-blue-900/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-primary-white text-lg flex items-center gap-2">
                <Download className="h-5 w-5 text-blue-400" />
                Install Tennis Tracker
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-secondary-white text-sm">
                Install this app on your device for quick access and offline functionality.
              </p>
              <div className="flex gap-2">
                <Button 
                  onClick={handleInstallClick}
                  className="flex-1 glass-button text-primary-white bg-blue-500/20 hover:bg-blue-500/30"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Install
                </Button>
                <Button 
                  onClick={handleDismiss}
                  variant="outline"
                  size="sm"
                  className="glass-button text-primary-white border-white/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
