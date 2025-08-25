"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

interface PasteStudentListDialogProps {
  open: boolean
  onClose: () => void
  onSave: (names: string[]) => void
}

export function PasteStudentListDialog({ open, onClose, onSave }: PasteStudentListDialogProps) {
  const [pastedText, setPastedText] = useState("")

  const parsedNames = useMemo(() => {
    if (!pastedText.trim()) return []
    // Split by newline or comma, trim whitespace, and filter out empty strings
    return pastedText
      .split(/[\n,]/)
      .map((name) => name.trim())
      .filter((name) => name.length > 0)
  }, [pastedText])

  const handleSave = () => {
    if (parsedNames.length === 0) return
    onSave(parsedNames)
    setPastedText("") // Reset after saving
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Paste Student List</DialogTitle>
          <DialogDescription>
            Paste a list of student names below. You can separate names by a new line or a comma.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="student-list-paste">Student Names</Label>
            <Textarea
              id="student-list-paste"
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="John Doe&#10;Jane Smith,&#10;Peter Jones"
              rows={10}
            />
          </div>
          {parsedNames.length > 0 && (
            <div>
              <Label>Preview ({parsedNames.length} names found)</Label>
              <div className="mt-2 max-h-40 overflow-y-auto rounded-md border p-2 space-y-1 touch-pan-y">
                {parsedNames.map((name, index) => (
                  <Badge key={index} variant="secondary" className="mr-1 mb-1">
                    {name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="min-h-[44px]">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={parsedNames.length === 0} className="min-h-[44px]">
            Add {parsedNames.length > 0 ? `${parsedNames.length} ` : ""}Student(s)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
