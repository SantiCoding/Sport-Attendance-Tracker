"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { PlusCircle, Edit } from "lucide-react"
import { StudentDialog } from "./student-dialog"

interface Student {
  id: string
  name: string
  notes: string
  prepaidSessions: number
  remainingSessions: number
  makeupSessions: number
}

interface StudentDialogWrapperProps {
  student?: Student | null
  buttonText?: string
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  icon?: boolean
  onSave: (student: Omit<Student, "id">) => void
}

export function StudentDialogWrapper({
  student = null,
  buttonText = "Add Student",
  variant = "default",
  icon = false,
  onSave,
}: StudentDialogWrapperProps) {
  const [open, setOpen] = useState(false)
  const [currentStudent, setCurrentStudent] = useState<Student | null>(student)

  const handleOpen = () => {
    setCurrentStudent(student)
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  const handleSave = (studentData: Omit<Student, "id">) => {
    onSave(studentData)
    setOpen(false)
  }

  return (
    <>
      <Button variant={variant} onClick={handleOpen}>
        {icon && (student ? <Edit className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />)}
        {buttonText}
      </Button>
      <StudentDialog student={currentStudent} open={open} onClose={handleClose} onSave={handleSave} />
    </>
  )
}
