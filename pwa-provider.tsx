"use client"

import type React from "react"

import { useEffect } from "react"
import { registerServiceWorker } from "./register-sw"

export function PWAProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    registerServiceWorker()
  }, [])

  return <>{children}</>
}
