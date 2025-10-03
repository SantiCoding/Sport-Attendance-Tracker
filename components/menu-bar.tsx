"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { motion, PanInfo } from "framer-motion"
import { Users, CalendarDays, Search, Clock, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"

interface MenuItem {
  icon: React.ReactNode
  label: string
  href: string
  gradient: string
  iconColor: string
  color: string
}

const menuItems: MenuItem[] = [
  {
    icon: <Users className="h-5 w-5" />,
    label: "Students",
    href: "students",
    gradient: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.06) 50%, rgba(29,78,216,0) 100%)",
    iconColor: "text-blue-500",
    color: "#3b82f6",
  },
  {
    icon: <CalendarDays className="h-5 w-5" />,
    label: "Record",
    href: "attendance",
    gradient: "radial-gradient(circle, rgba(34,197,94,0.15) 0%, rgba(22,163,74,0.06) 50%, rgba(21,128,61,0) 100%)",
    iconColor: "text-green-500",
    color: "#22c55e",
  },
  {
    icon: <Search className="h-5 w-5" />,
    label: "Search",
    href: "search",
    gradient: "radial-gradient(circle, rgba(249,115,22,0.15) 0%, rgba(234,88,12,0.06) 50%, rgba(194,65,12,0) 100%)",
    iconColor: "text-orange-500",
    color: "#f97316",
  },
  {
    icon: <Clock className="h-5 w-5" />,
    label: "Makeup",
    href: "makeup",
    gradient: "radial-gradient(circle, rgba(168,85,247,0.15) 0%, rgba(139,92,246,0.06) 50%, rgba(109,40,217,0) 100%)",
    iconColor: "text-purple-500",
    color: "#a855f7",
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    label: "Reports",
    href: "reports",
    gradient: "radial-gradient(circle, rgba(239,68,68,0.15) 0%, rgba(220,38,38,0.06) 50%, rgba(185,28,28,0) 100%)",
    iconColor: "text-red-500",
    color: "#ef4444",
  },
]

interface MenuBarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function MenuBar({ activeTab, setActiveTab }: MenuBarProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Enhanced navigation with smooth animations and proper mobile fixed positioning
  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-[9999] bg-black/95 backdrop-blur-xl border-t border-white/20 shadow-2xl"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        WebkitTransform: 'translateZ(0)',
        transform: 'translateZ(0)',
        willChange: 'transform'
      }}
    >
      <div className="grid w-full grid-cols-5 h-16 relative">
        {menuItems.map((item) => {
          const isActive = activeTab === item.href

          return (
            <button
              key={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 p-1 transition-all duration-300 ease-out",
                "hover:bg-white/10 active:bg-white/15"
              )}
              onClick={() => setActiveTab(item.href)}
            >
              {/* Animated background for active tab */}
              {isActive && (
                <motion.div
                  layoutId="activeTabBackground"
                  className="absolute inset-0 bg-white/10 rounded-lg"
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                    mass: 0.8
                  }}
                />
              )}
              
              {/* Icon with smooth color transition */}
              <motion.div 
                className={cn(
                  "relative z-10 transition-colors duration-300",
                  isActive ? item.iconColor : "text-white/60"
                )}
                animate={{
                  scale: isActive ? 1.1 : 1,
                  y: isActive ? -1 : 0
                }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 25,
                  mass: 0.6
                }}
              >
                {item.icon}
              </motion.div>
              
              {/* Label with smooth color transition */}
              <motion.span 
                className={cn(
                  "relative z-10 text-xs font-medium transition-colors duration-300",
                  isActive ? "text-white" : "text-white/60"
                )}
                animate={{
                  scale: isActive ? 1.05 : 1,
                  y: isActive ? -1 : 0
                }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 25,
                  mass: 0.6
                }}
              >
                {item.label}
              </motion.span>
              
              {/* Top indicator with smooth animation */}
              {isActive && (
                <motion.div 
                  className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  exit={{ scaleX: 0, opacity: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                    mass: 0.5
                  }}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

