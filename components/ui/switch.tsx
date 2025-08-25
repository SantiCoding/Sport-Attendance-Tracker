"use client"

import * as React from "react"
import {
  Switch as AriaSwitch,
  SwitchProps as AriaSwitchProps,
  composeRenderProps,
} from "react-aria-components"

import { cn } from "@/lib/utils"

const Switch = ({ children, className, ...props }: AriaSwitchProps) => (
  <AriaSwitch
    className={composeRenderProps(className, (className) =>
      cn(
        "group inline-flex items-center gap-2 text-sm font-medium leading-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-70",
        className
      )
    )}
    {...props}
  >
    {composeRenderProps(children, (children) => (
      <>
        <div
          className={cn(
            "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-all duration-300 ease-in-out",
            /* Focus Visible */
            "group-data-[focus-visible]:outline-none group-data-[focus-visible]:ring-2 group-data-[focus-visible]:ring-white/20 group-data-[focus-visible]:ring-offset-2 group-data-[focus-visible]:ring-offset-transparent",
            /* Disabled */
            "group-data-[disabled]:cursor-not-allowed group-data-[disabled]:opacity-50",
            /* Selected - Glass morphism effect */
            "bg-white/10 backdrop-blur-sm group-data-[selected]:bg-white/20 group-data-[selected]:shadow-lg group-data-[selected]:shadow-white/10",
            /* Readonly */
            "group-data-[readonly]:cursor-default",
            /* Resets */
            "focus-visible:outline-none"
          )}
        >
          <div
            className={cn(
              "pointer-events-none block size-5 rounded-full transition-all duration-300 ease-in-out",
              /* Glass morphism thumb */
              "bg-white/90 backdrop-blur-sm shadow-lg shadow-black/20 ring-1 ring-white/20",
              /* Selected */
              "translate-x-0 group-data-[selected]:translate-x-5 group-data-[selected]:bg-white group-data-[selected]:shadow-xl group-data-[selected]:shadow-white/30"
            )}
          />
        </div>
        {children}
      </>
    ))}
  </AriaSwitch>
)

export { Switch }
