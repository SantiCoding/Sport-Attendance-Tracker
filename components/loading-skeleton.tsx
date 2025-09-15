"use client"

import { motion } from "framer-motion"

export function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="glass-card p-8 max-w-md w-full mx-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse" />
          <h1 className="text-2xl font-bold text-primary-white mb-2">
            Tennis Tracker
          </h1>
          <p className="text-secondary-white mb-6">
            Loading your coaching data...
          </p>
          <div className="space-y-3">
            <div className="h-4 bg-white/10 rounded animate-pulse" />
            <div className="h-4 bg-white/10 rounded animate-pulse w-3/4 mx-auto" />
            <div className="h-4 bg-white/10 rounded animate-pulse w-1/2 mx-auto" />
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="glass-card p-6 animate-pulse">
      <div className="space-y-4">
        <div className="h-6 bg-white/10 rounded w-3/4" />
        <div className="h-4 bg-white/10 rounded w-full" />
        <div className="h-4 bg-white/10 rounded w-2/3" />
        <div className="h-10 bg-white/10 rounded" />
      </div>
    </div>
  )
}
