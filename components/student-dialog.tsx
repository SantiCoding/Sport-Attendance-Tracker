"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

interface Student {
  id: string
  name: string
  notes: string
  prepaidSessions: number
  remainingSessions: number
  makeupSessions: number
}

interface CoachProfile {
  id: string
  name: string
  students: Student[]
  groups: any[]
  attendanceRecords: any[]
  archivedTerms: any[]
  completedMakeupSessions: any[]
  makeupSessions?: any[]
}

interface StudentDialogProps {
  profileData: CoachProfile
  onUpdateProfile: (profile: CoachProfile) => void
  student?: Student
  children: React.ReactNode
}

export function StudentDialog({ profileData, onUpdateProfile, student, children }: StudentDialogProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    notes: "",
    prepaidSessions: 0,
    remainingSessions: 0,
    makeupSessions: 0,
  })

  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name,
        notes: student.notes,
        prepaidSessions: student.prepaidSessions,
        remainingSessions: student.remainingSessions,
        makeupSessions: student.makeupSessions,
      })
    } else {
      setFormData({
        name: "",
        notes: "",
        prepaidSessions: 0,
        remainingSessions: 0,
        makeupSessions: 0,
      })
    }
  }, [student, open])

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast("❌ Student name is required", "error")
      return
    }

    const updatedStudent: Student = {
      id: student?.id || `student_${Date.now()}`,
      name: formData.name.trim(),
      notes: formData.notes,
      prepaidSessions: formData.prepaidSessions,
      remainingSessions: formData.remainingSessions,
      makeupSessions: formData.makeupSessions,
    }

    let updatedStudents: Student[]
    if (student) {
      updatedStudents = profileData.students.map((s) => (s.id === student.id ? updatedStudent : s))
      toast(`✅ ${updatedStudent.name} updated successfully`, "success")
    } else {
      updatedStudents = [...profileData.students, updatedStudent]
      toast(`✅ ${updatedStudent.name} added successfully`, "success")
    }

    onUpdateProfile({
      ...profileData,
      students: updatedStudents,
    })

    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="glass-dropdown w-[95vw] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-primary-white">{student ? "Edit Student" : "Add New Student"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="student-name" className="text-secondary-white">
              Student Name
            </Label>
            <Input
              id="student-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter student name"
              className="glass-input text-primary-white placeholder:text-tertiary-white mt-1 text-sm"
            />
          </div>
          <div>
            <Label htmlFor="student-notes" className="text-secondary-white">
              Notes (Optional)
            </Label>
            <Textarea
              id="student-notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add notes..."
              className="glass-input text-primary-white placeholder:text-tertiary-white mt-1 text-sm"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="prepaid-sessions" className="text-secondary-white">
                Prepaid
              </Label>
              <Input
                id="prepaid-sessions"
                type="number"
                min="0"
                value={formData.prepaidSessions}
                onChange={(e) => setFormData({ ...formData, prepaidSessions: Number.parseInt(e.target.value) || 0 })}
                className="glass-input text-primary-white mt-1"
              />
            </div>
            <div>
              <Label htmlFor="remaining-sessions" className="text-secondary-white">
                Remaining
              </Label>
              <Input
                id="remaining-sessions"
                type="number"
                min="0"
                value={formData.remainingSessions}
                onChange={(e) => setFormData({ ...formData, remainingSessions: Number.parseInt(e.target.value) || 0 })}
                className="glass-input text-primary-white mt-1"
              />
            </div>
            <div>
              <Label htmlFor="makeup-sessions" className="text-secondary-white">
                Make-ups
              </Label>
              <Input
                id="makeup-sessions"
                type="number"
                min="0"
                value={formData.makeupSessions}
                onChange={(e) => setFormData({ ...formData, makeupSessions: Number.parseInt(e.target.value) || 0 })}
                className="glass-input text-primary-white mt-1"
              />
            </div>
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="glass-button text-primary-white min-h-[48px] w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!formData.name.trim()}
            className="glass-button text-primary-white min-h-[48px] w-full sm:w-auto"
          >
            {student ? "Update Student" : "Add Student"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
