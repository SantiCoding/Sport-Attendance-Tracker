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
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const getCurrentTabIndex = () => {
    return menuItems.findIndex(item => item.href === activeTab)
  }

  const handleSwipe = (event: any, info: PanInfo) => {
    if (!isMobile) return

    const threshold = 50 // Minimum distance for swipe
    const currentIndex = getCurrentTabIndex()
    
    if (info.offset.x > threshold && currentIndex > 0) {
      // Swipe right - go to previous tab
      const newIndex = currentIndex - 1
      setActiveTab(menuItems[newIndex].href)
    } else if (info.offset.x < -threshold && currentIndex < menuItems.length - 1) {
      // Swipe left - go to next tab
      const newIndex = currentIndex + 1
      setActiveTab(menuItems[newIndex].href)
    }
  }

  const handleDragStart = () => {
    setIsDragging(true)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  // Use enhanced mobile navigation for mobile devices
  if (isMobile) {
    return (
      <div className="sticky bottom-0 left-0 right-0 z-[100] bg-black/20 backdrop-blur-sm">
        <div className="flex items-center justify-center">
          <motion.div 
            ref={containerRef}
            className="flex items-center gap-2 sm:gap-4 w-full h-16"
            drag="x"
            dragConstraints={{ left: -100, right: 100 }}
            dragElastic={0.2}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onPanEnd={handleSwipe}
            dragMomentum={false}
            whileDrag={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {menuItems.map((item) => {
              const isActive = activeTab === item.href

              return (
                <motion.div
                  key={item.href}
                  className={cn(
                    "relative cursor-pointer text-xs sm:text-sm font-semibold px-2 sm:px-3 py-1 rounded-full transition-all duration-300 flex-1",
                    "text-white/80 hover:text-white",
                    isActive && "text-white",
                    isDragging && "pointer-events-none"
                  )}
                  onClick={() => !isDragging && setActiveTab(item.href)}
                  whileTap={{ scale: isDragging ? 1 : 0.95 }}
                >
                  <span className="flex flex-col items-center gap-1">
                    <motion.span 
                      className="text-sm sm:text-base"
                      animate={{
                        scale: isActive ? 1.05 : 1,
                        y: isActive ? -1 : 0,
                      }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 300, 
                        damping: 25,
                        duration: 0.2
                      }}
                    >
                      {item.icon}
                    </motion.span>
                    <motion.span 
                      className="text-[8px] sm:text-[10px] leading-tight"
                      animate={{
                        scale: isActive ? 1.02 : 1,
                        y: isActive ? -1 : 0,
                      }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 300, 
                        damping: 25,
                        duration: 0.2
                      }}
                    >
                      {item.label}
                    </motion.span>
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
                        className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full"
                        style={{ backgroundColor: item.color }}
                      >
                        {/* Multiple glow layers for enhanced effect */}
                        <div 
                          className="absolute w-12 h-6 rounded-full blur-md -top-2 -left-2"
                          style={{ backgroundColor: `${item.color}20` }}
                        />
                        <div 
                          className="absolute w-8 h-6 rounded-full blur-md -top-1"
                          style={{ backgroundColor: `${item.color}20` }}
                        />
                        <div 
                          className="absolute w-4 h-4 rounded-full blur-sm top-0 left-2"
                          style={{ backgroundColor: `${item.color}20` }}
                        />
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </div>
    )
  }

  // Desktop navigation (original enhanced version)
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] liquid-glass border-t border-white/20 shadow-lg transition-colors duration-300">
      <div className="grid w-full grid-cols-5 h-16 rounded-none relative z-10">
        {menuItems.map((item) => (
          <motion.div
            key={item.href}
            className={cn(
              "relative flex flex-col items-center justify-center gap-1 p-1 cursor-pointer",
            )}
            onClick={() => setActiveTab(item.href)}
            onHoverStart={() => setHoveredItem(item.href)}
            onHoverEnd={() => setHoveredItem(null)}
            whileTap={{ scale: 0.95 }}
          >
            {activeTab === item.href && (
              <motion.div
                layoutId="lamp"
                className="absolute inset-0 w-full rounded-none -z-10"
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
                  className="absolute -top-1 left-1/2 -translate-x-1/2 w-10 h-1.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                >
                  {/* Multiple glow layers for enhanced effect */}
                  <div 
                    className="absolute w-14 h-6 rounded-full blur-md -top-2 -left-2"
                    style={{ backgroundColor: `${item.color}20` }}
                  />
                  <div 
                    className="absolute w-10 h-6 rounded-full blur-md -top-1"
                    style={{ backgroundColor: `${item.color}20` }}
                  />
                  <div 
                    className="absolute w-6 h-4 rounded-full blur-sm top-0 left-2"
                    style={{ backgroundColor: `${item.color}20` }}
                  />
                </div>
              </motion.div>
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
                scale: activeTab === item.href ? 1.05 : 1,
                y: activeTab === item.href ? -1 : 0,
              }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 25,
                duration: 0.2
              }}
            >
              {item.icon}
            </motion.div>
            <motion.span
              className={cn("relative z-10 text-xs font-medium text-primary-white")}
              animate={{
                scale: activeTab === item.href ? 1.02 : 1,
                y: activeTab === item.href ? -1 : 0,
              }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 25,
                duration: 0.2
              }}
            >
              {item.label}
            </motion.span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

