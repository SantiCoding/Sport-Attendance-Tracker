"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { TermFinalizationDialog } from "./term-finalization-dialog"

interface TermFinalizationDialogWrapperProps {
  buttonText?: string
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  onFinalize: (termData: {
    name: string
    startMonth: string
    endMonth: string
    year: string
  }) => void
}

export function TermFinalizationDialogWrapper({
  buttonText = "Finalize Term",
  variant = "default",
  onFinalize,
}: TermFinalizationDialogWrapperProps) {
  const [open, setOpen] = useState(false)

  const handleOpen = () => {
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  const handleFinalize = (termData: {
    name: string
    startMonth: string
    endMonth: string
    year: string
  }) => {
    onFinalize(termData)
    setOpen(false)
  }

  return (
    <>
      <Button variant={variant} onClick={handleOpen} className="glass-button text-primary-white">
        {buttonText}
      </Button>
      <TermFinalizationDialog open={open} onClose={handleClose} onFinalize={handleFinalize} />
    </>
  )
}
