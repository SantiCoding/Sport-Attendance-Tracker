"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface EnhancedSwitchProps extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  showIcons?: boolean
}

const EnhancedSwitch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  EnhancedSwitchProps
>(({ className, leftIcon, rightIcon, showIcons = true, ...props }, ref) => {
  const [isChecked, setIsChecked] = React.useState(props.checked || false)

  const handleCheckedChange = (checked: boolean) => {
    setIsChecked(checked)
    props.onCheckedChange?.(checked)
  }

  return (
    <div className="relative inline-flex items-center">
      {/* Left Icon */}
      {showIcons && (
        <motion.div
          className="absolute left-1 z-10 flex items-center justify-center"
          animate={{
            opacity: isChecked ? 0.4 : 1,
            scale: isChecked ? 0.8 : 1,
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {leftIcon}
        </motion.div>
      )}

      {/* Switch Container */}
      <SwitchPrimitives.Root
        className={cn(
          "peer relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-50",
          "data-[state=checked]:bg-blue-500/30 data-[state=unchecked]:bg-white/10",
          "data-[state=checked]:shadow-lg data-[state=checked]:shadow-blue-500/20",
          className
        )}
        {...props}
        ref={ref}
        onCheckedChange={handleCheckedChange}
      >
        {/* Background Glow Effect */}
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            background: isChecked 
              ? "radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%)",
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        />

        {/* Animated Thumb */}
        <SwitchPrimitives.Thumb asChild>
          <motion.div
            className="pointer-events-none relative block h-5 w-5 rounded-full bg-white/90 backdrop-blur-sm shadow-lg shadow-black/20 ring-1 ring-white/20 overflow-hidden"
            style={{ 
              backgroundImage: 'none',
              content: 'none',
              '::before': { content: 'none' },
              '::after': { content: 'none' }
            }}
            animate={{
              x: isChecked ? 20 : 0,
              scale: isChecked ? 1.1 : 1,
              rotate: isChecked ? 360 : 0,
            }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 30,
              duration: 0.4,
            }}
          >
            {/* Inner Glow */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ 
                backgroundImage: 'none',
                content: 'none'
              }}
              animate={{
                background: isChecked
                  ? "radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)"
                  : "radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%)",
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            />
          </motion.div>
        </SwitchPrimitives.Thumb>

        {/* Ripple Effect */}
        <AnimatePresence>
          {isChecked && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-blue-400/50"
              initial={{ scale: 1, opacity: 0.8 }}
              animate={{ scale: 1.2, opacity: 0 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          )}
        </AnimatePresence>
      </SwitchPrimitives.Root>

      {/* Right Icon */}
      {showIcons && (
        <motion.div
          className="absolute right-1 z-10 flex items-center justify-center"
          animate={{
            opacity: isChecked ? 1 : 0.4,
            scale: isChecked ? 1 : 0.8,
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {rightIcon}
        </motion.div>
      )}
    </div>
  )
})

EnhancedSwitch.displayName = "EnhancedSwitch"

export { EnhancedSwitch }
