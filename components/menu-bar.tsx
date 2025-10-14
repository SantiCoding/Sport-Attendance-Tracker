"use client"

import type React from "react"
import { useState, useEffect, useCallback, memo } from "react"
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

const MenuBar = memo(function MenuBar({ activeTab, setActiveTab }: MenuBarProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const handleTabClick = useCallback((href: string) => {
    setActiveTab(href)
  }, [setActiveTab])


  return (
    <nav
      data-nav="bottom"
      className="bottom-nav"
      style={{
        // Add safe area padding for mobile
        paddingBottom: isMobile ? 'env(safe-area-inset-bottom, 0px)' : '0px'
      } as React.CSSProperties}
    >
      <div className="flex items-center justify-center w-full bg-background/5 backdrop-blur-lg border-t border-white/20 py-1 px-2 shadow-2xl">
        {menuItems.map((item) => {
          const isActive = activeTab === item.href

          return (
                     <button
                       key={item.href}
                       onClick={() => handleTabClick(item.href)}
                       className={cn(
                         "tab relative cursor-pointer text-sm font-semibold px-2 py-2 flex-1",
                         "text-white/80 hover:text-white",
                         isActive && "active text-white"
                       )}
                     >
                       {/* Icon and Label with Optimized Animations */}
                       <div className="flex flex-col items-center gap-1">
                         <div
                           className={cn(
                             "transition-colors duration-300",
                             isActive ? item.iconColor : "text-white/60"
                           )}
                         >
                           {item.icon}
                         </div>
                         <span className="text-xs font-medium transition-colors duration-300">
                           {item.label}
                         </span>
                       </div>

                       {/* Optimized Lamp Indicator with Gradient Glow */}
                       {isActive && (
                         <motion.div
                           layoutId="lamp"
                           className="absolute inset-0 w-full"
                           style={{
                             zIndex: -1,
                             background: item.gradient,
                             willChange: 'transform, opacity',
                             transform: 'translateZ(0)',
                             backfaceVisibility: 'hidden'
                           }}
                           initial={false}
                           transition={{
                             type: "spring",
                             stiffness: 400,
                             damping: 25,
                             mass: 0.6
                           }}
                         >
                           {/* Top indicator bar with gradient glow */}
                           <div
                             className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1"
                             style={{
                               background: `linear-gradient(90deg, ${item.color}40, ${item.color}80, ${item.color}40)`,
                               zIndex: 1
                             }}
                           >
                             {/* Gradient blur effects */}
                             <div
                               className="absolute w-12 h-6 rounded-full blur-md -top-2 -left-2"
                               style={{
                                 background: `${item.color}20`,
                                 zIndex: 0
                               }}
                             />
                             <div
                               className="absolute w-8 h-6 rounded-full blur-md -top-1"
                               style={{
                                 background: `${item.color}20`,
                                 zIndex: 0
                               }}
                             />
                             <div
                               className="absolute w-4 h-4 rounded-full blur-sm top-0 left-2"
                               style={{
                                 background: `${item.color}20`,
                                 zIndex: 0
                               }}
                             />
                           </div>
                         </motion.div>
                       )}
            </button>
          )
        })}
      </div>
    </nav>
  )
})

export { MenuBar }

