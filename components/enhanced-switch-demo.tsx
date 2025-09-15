"use client"

import React, { useState } from "react"
import { EnhancedSwitch } from "@/components/ui/enhanced-switch"
import { Brain, Zap, Moon, Sun, Wifi, WifiOff } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function EnhancedSwitchDemo() {
  const [smartMode, setSmartMode] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [wifiEnabled, setWifiEnabled] = useState(true)

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Enhanced Switch Demo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Smart Mode Switch */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Brain className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium">Smart Mode</span>
          </div>
          <EnhancedSwitch
            checked={smartMode}
            onCheckedChange={setSmartMode}
            leftIcon={<Brain className="h-3 w-3 text-blue-400" />}
            rightIcon={<Zap className="h-3 w-3 text-blue-400" />}
          />
        </div>

        {/* Dark Mode Switch */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Moon className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium">Dark Mode</span>
          </div>
          <EnhancedSwitch
            checked={darkMode}
            onCheckedChange={setDarkMode}
            leftIcon={<Sun className="h-3 w-3 text-yellow-400" />}
            rightIcon={<Moon className="h-3 w-3 text-blue-400" />}
          />
        </div>

        {/* WiFi Switch */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Wifi className="h-4 w-4 text-green-400" />
            <span className="text-sm font-medium">WiFi</span>
          </div>
          <EnhancedSwitch
            checked={wifiEnabled}
            onCheckedChange={setWifiEnabled}
            leftIcon={<WifiOff className="h-3 w-3 text-red-400" />}
            rightIcon={<Wifi className="h-3 w-3 text-green-400" />}
          />
        </div>

        {/* Status Display */}
        <div className="pt-4 border-t">
          <div className="text-xs text-gray-500 space-y-1">
            <div>Smart Mode: {smartMode ? "ON" : "OFF"}</div>
            <div>Dark Mode: {darkMode ? "ON" : "OFF"}</div>
            <div>WiFi: {wifiEnabled ? "ON" : "OFF"}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
