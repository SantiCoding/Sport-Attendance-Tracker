"use client"

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface PerformanceOptimizerProps {
  children: React.ReactNode
  className?: string
}

export function PerformanceOptimizer({ children, className }: PerformanceOptimizerProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Enable hardware acceleration for smooth animations
    if (containerRef.current) {
      containerRef.current.style.transform = 'translateZ(0)'
      containerRef.current.style.willChange = 'transform'
    }

    // Cleanup
    return () => {
      if (containerRef.current) {
        containerRef.current.style.willChange = 'auto'
      }
    }
  }, [])

  return (
    <motion.div
      ref={containerRef}
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 0.8
      }}
      layout
    >
      {children}
    </motion.div>
  )
}

// Optimized card component with performance features
export function OptimizedCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <PerformanceOptimizer className={className}>
      <motion.div
        layout
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30
        }}
      >
        {children}
      </motion.div>
    </PerformanceOptimizer>
  )
}

// Optimized list component for better performance
export function OptimizedList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1
          }
        }
      }}
    >
      {children}
    </motion.div>
  )
}

// Optimized list item component
export function OptimizedListItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
      layout
    >
      {children}
    </motion.div>
  )
}
