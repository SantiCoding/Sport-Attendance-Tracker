"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface TermFinalizationDialogProps {
  open: boolean
  onClose: () => void
  onFinalize: (termData: {
    name: string
    startMonth: string
    endMonth: string
    year: string
  }) => void
}

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

export function TermFinalizationDialog({ open, onClose, onFinalize }: TermFinalizationDialogProps) {
  const [termName, setTermName] = useState("")
  const [startMonth, setStartMonth] = useState("")
  const [endMonth, setEndMonth] = useState("")
  const currentYear = new Date().getFullYear().toString()

  const handleFinalize = () => {
    if (!termName.trim() || !startMonth || !endMonth) return

    onFinalize({
      name: termName.trim(),
      startMonth,
      endMonth,
      year: currentYear,
    })

    // Reset form and close dialog
    setTermName("")
    setStartMonth("")
    setEndMonth("")
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-dropdown w-[95vw] max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-primary-white">Finalize Term</DialogTitle>
          <DialogDescription className="text-secondary-white">
            Archive current attendance data and start a new term
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="form-field">
            <Label htmlFor="term-name" className="text-secondary-white">
              Term Name
            </Label>
            <Input
              id="term-name"
              value={termName}
              onChange={(e) => setTermName(e.target.value)}
              placeholder={`Term 2 – ${currentYear}`}
              className="glass-input text-primary-white placeholder:text-tertiary-white mt-1 text-sm"
            />
          </div>

          <div className="form-grid grid grid-cols-2 gap-3">
            <div className="form-field">
              <Label htmlFor="start-month" className="text-secondary-white">
                Start Month
              </Label>
              <Select value={startMonth} onValueChange={setStartMonth}>
                <SelectTrigger id="start-month" className="glass-input text-primary-white mt-1">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="glass-dropdown">
                  {months.map((month) => (
                    <SelectItem key={month} value={month} className="text-primary-white">
                      {month.slice(0, 3)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="form-field">
              <Label htmlFor="end-month" className="text-secondary-white">
                End Month
              </Label>
              <Select value={endMonth} onValueChange={setEndMonth}>
                <SelectTrigger id="end-month" className="glass-input text-primary-white mt-1">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="glass-dropdown">
                  {months.map((month) => (
                    <SelectItem key={month} value={month} className="text-primary-white">
                      {month.slice(0, 3)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="glass-card border border-yellow-500/30 rounded-lg p-3">
            <p className="text-sm text-yellow-200">
              <strong>Warning:</strong> Finalizing this term will archive all current attendance data and reset the
              system for a new term. This action cannot be undone.
            </p>
          </div>
        </div>
        <DialogFooter className="form-buttons flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="glass-button text-primary-white min-h-[48px] w-full sm:w-auto bg-transparent"
          >
            Cancel
          </Button>
          <Button
            onClick={handleFinalize}
            disabled={!termName.trim() || !startMonth || !endMonth}
            className="glass-button text-primary-white min-h-[48px] w-full sm:w-auto"
          >
            Finalize Term
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
