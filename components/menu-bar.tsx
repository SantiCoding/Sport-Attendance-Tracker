"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
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
    label: "Make-Up",
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
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Use enhanced mobile navigation for mobile devices
  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="flex items-center justify-center p-2">
          <div className="flex items-center gap-2 glass-card py-1 px-2 rounded-full shadow-lg border border-white/10 w-full overflow-visible">
            {menuItems.map((item) => {
              const isActive = activeTab === item.href

              return (
                <motion.div
                  key={item.href}
                  className={cn(
                    "relative cursor-pointer text-sm font-semibold px-3 py-1 rounded-full transition-all duration-300 flex-1",
                    "text-white/80 hover:text-white",
                    isActive && "text-white",
                  )}
                  onClick={() => setActiveTab(item.href)}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="flex flex-col items-center gap-1">
                    <span className="text-base">
                      {item.icon}
                    </span>
                    <span className="text-[11px] leading-tight">
                      {item.label}
                    </span>
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="lamp"
                      className="absolute inset-0 w-full rounded-full -z-10"
                      style={{
                        background: `linear-gradient(135deg, ${item.color}20, ${item.color}10)`,
                        backdropFilter: 'blur(10px)',
                      }}
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    >
                      {/* Top indicator that matches the tab color */}
                      <div 
                        className="absolute -top-1 left-1/2 -translate-x-1/2 w-10 h-1.5 rounded-t-full"
                        style={{ backgroundColor: item.color }}
                      >
                        {/* Multiple glow layers for enhanced effect */}
                        <div 
                          className="absolute w-14 h-6 rounded-full blur-md -top-2 -left-2"
                          style={{ backgroundColor: `${item.color}30` }}
                        />
                        <div 
                          className="absolute w-10 h-6 rounded-full blur-md -top-1"
                          style={{ backgroundColor: `${item.color}25` }}
                        />
                        <div 
                          className="absolute w-6 h-4 rounded-full blur-sm top-0 left-2"
                          style={{ backgroundColor: `${item.color}20` }}
                        />
                        {/* Additional glow for more intensity */}
                        <div 
                          className="absolute w-18 h-8 rounded-full blur-lg -top-3 -left-4"
                          style={{ backgroundColor: `${item.color}15` }}
                        />
                        {/* Extra glow layer for the "pressed" effect */}
                        <div 
                          className="absolute w-22 h-10 rounded-full blur-xl -top-4 -left-6"
                          style={{ backgroundColor: `${item.color}10` }}
                        />
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )})}
          </div>
        </div>
      </div>
    )
  }

  // Desktop navigation (original enhanced version)
  return (
    <div className="fixed bottom-0 left-0 right-0 liquid-glass border-t border-white/20 shadow-lg transition-colors duration-300 z-50">
      <div className="grid w-full grid-cols-5 h-16 rounded-none relative z-10">
        {menuItems.map((item) => (
          <motion.div
            key={item.href}
            className={cn(
              "relative flex flex-col items-center justify-center gap-1 p-1 cursor-pointer overflow-hidden",
            )}
            onClick={() => setActiveTab(item.href)}
            onHoverStart={() => setHoveredItem(item.href)}
            onHoverEnd={() => setHoveredItem(null)}
            whileTap={{ scale: 0.95 }}
          >
            {activeTab === item.href && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute inset-0 rounded-none bg-white/10"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
            {hoveredItem === item.href && (
              <motion.div
                className="absolute inset-0 rounded-none opacity-0"
                style={{ background: item.gradient }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            )}
            <motion.div
              className={cn(
                "relative z-10",
                activeTab === item.href || hoveredItem === item.href ? item.iconColor : "text-primary-white",
              )}
              animate={{
                scale: activeTab === item.href ? 1.1 : 1,
                y: activeTab === item.href ? -2 : 0,
              }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              {item.icon}
            </motion.div>
            <motion.span
              className={cn("relative z-10 text-xs font-medium text-primary-white")}
              animate={{
                scale: activeTab === item.href ? 1.05 : 1,
                y: activeTab === item.href ? -2 : 0,
              }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              {item.label}
            </motion.span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
