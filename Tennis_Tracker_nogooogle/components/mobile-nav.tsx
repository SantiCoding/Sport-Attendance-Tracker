"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  name: string
  url: string
  icon: LucideIcon
  color: string
}

interface MobileNavProps {
  items: NavItem[]
  className?: string
}

export function MobileNav({ items, className }: MobileNavProps) {
  const [activeTab, setActiveTab] = useState(items[0].name)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <div
      className={cn(
        "fixed bottom-0 sm:top-0 left-1/2 -translate-x-1/2 z-50 mb-6 sm:pt-6",
        className,
      )}
    >
      <div className="flex items-center gap-3 glass-card py-1 px-1 rounded-full shadow-lg border border-white/10">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.name

          return (
            <Link
              key={item.name}
              href={item.url}
              onClick={() => setActiveTab(item.name)}
              className={cn(
                "relative cursor-pointer text-sm font-semibold px-6 py-2 rounded-full transition-all duration-300",
                "text-white/80 hover:text-white",
                isActive && "text-white",
              )}
              style={{
                '--tab-color': item.color
              } as React.CSSProperties}
            >
              <span className="hidden md:inline">{item.name}</span>
              <span className="md:hidden">
                <Icon size={18} strokeWidth={2.5} />
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
                  <div 
                    className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 rounded-t-full"
                    style={{ backgroundColor: item.color }}
                  >
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
            </Link>
          )
        })}
      </div>
    </div>
  )
}
