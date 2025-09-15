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
  const [year, setYear] = useState(new Date().getFullYear().toString())

  const handleFinalize = () => {
    if (!termName.trim() || !startMonth || !endMonth || !year) return

    onFinalize({
      name: termName.trim(),
      startMonth,
      endMonth,
      year,
    })

    // Reset form and close dialog
    setTermName("")
    setStartMonth("")
    setEndMonth("")
    setYear(new Date().getFullYear().toString())
    onClose()
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-sm">
        <DialogHeader>
          <DialogTitle>Finalize Term</DialogTitle>
          <DialogDescription>Archive current attendance data and start a new term</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="form-field">
            <Label htmlFor="term-name">Term Name</Label>
            <Input
              id="term-name"
              value={termName}
              onChange={(e) => setTermName(e.target.value)}
              placeholder="e.g., Term 2 2025, Spring Semester"
              className="mt-1"
            />
          </div>

          <div className="form-grid grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="form-field">
              <Label htmlFor="start-month">Start Month</Label>
              <Select value={startMonth} onValueChange={setStartMonth}>
                <SelectTrigger id="start-month" className="mt-1">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month} value={month}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="form-field">
              <Label htmlFor="end-month">End Month</Label>
              <Select value={endMonth} onValueChange={setEndMonth}>
                <SelectTrigger id="end-month" className="mt-1">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month} value={month}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="form-field">
            <Label htmlFor="year">Year</Label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger id="year" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="liquid-glass border border-yellow-500/30 rounded-lg p-3">
            <p className="text-sm text-yellow-200">
              <strong>Warning:</strong> Finalizing this term will archive all current attendance data and reset the
              system for a new term. This action cannot be undone.
            </p>
          </div>
        </div>
        <DialogFooter className="form-buttons flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="min-h-[48px] w-full sm:w-auto bg-transparent">
            Cancel
          </Button>
          <Button
            onClick={handleFinalize}
            disabled={!termName.trim() || !startMonth || !endMonth || !year}
            className="min-h-[48px] w-full sm:w-auto"
          >
            Finalize Term
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
