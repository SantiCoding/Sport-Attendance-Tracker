"use client"

import type React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import { Users, CalendarDays, Search, Clock, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"

interface MenuItem {
  icon: React.ReactNode
  label: string
  href: string
  gradient: string
  iconColor: string
}

const menuItems: MenuItem[] = [
  {
    icon: <Users className="h-5 w-5" />,
    label: "Students",
    href: "students",
    gradient: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.06) 50%, rgba(29,78,216,0) 100%)",
    iconColor: "text-blue-500",
  },
  {
    icon: <CalendarDays className="h-5 w-5" />,
    label: "Record",
    href: "attendance",
    gradient: "radial-gradient(circle, rgba(34,197,94,0.15) 0%, rgba(22,163,74,0.06) 50%, rgba(21,128,61,0) 100%)",
    iconColor: "text-green-500",
  },
  {
    icon: <Search className="h-5 w-5" />,
    label: "Search",
    href: "search",
    gradient: "radial-gradient(circle, rgba(249,115,22,0.15) 0%, rgba(234,88,12,0.06) 50%, rgba(194,65,12,0) 100%)",
    iconColor: "text-orange-500",
  },
  {
    icon: <Clock className="h-5 w-5" />,
    label: "Make-Up",
    href: "makeup",
    gradient: "radial-gradient(circle, rgba(168,85,247,0.15) 0%, rgba(139,92,246,0.06) 50%, rgba(109,40,217,0) 100%)",
    iconColor: "text-purple-500",
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    label: "Reports",
    href: "reports",
    gradient: "radial-gradient(circle, rgba(239,68,68,0.15) 0%, rgba(220,38,38,0.06) 50%, rgba(185,28,28,0) 100%)",
    iconColor: "text-red-500",
  },
]

interface MenuBarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function MenuBar({ activeTab, setActiveTab }: MenuBarProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

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
