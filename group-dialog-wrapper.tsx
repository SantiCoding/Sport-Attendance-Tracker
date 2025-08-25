"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { PlusCircle, Edit } from "lucide-react"
import { GroupDialog } from "./group-dialog"

interface Student {
  id: string
  name: string
  notes: string
  prepaidSessions: number
  remainingSessions: number
  makeupSessions: number
}

interface Group {
  id: string
  name: string
  type: "group" | "private"
  studentIds: string[]
}

interface GroupDialogWrapperProps {
  group?: Group | null
  students: Student[]
  buttonText?: string
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  icon?: boolean
  onSave: (group: Omit<Group, "id">) => void
}

export function GroupDialogWrapper({
  group = null,
  students,
  buttonText = "Add Group",
  variant = "default",
  icon = false,
  onSave,
}: GroupDialogWrapperProps) {
  const [open, setOpen] = useState(false)
  const [currentGroup, setCurrentGroup] = useState<Group | null>(group)

  const handleOpen = () => {
    setCurrentGroup(group)
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  const handleSave = (groupData: Omit<Group, "id">) => {
    onSave(groupData)
    setOpen(false)
  }

  return (
    <>
      <Button variant={variant} onClick={handleOpen}>
        {icon && (group ? <Edit className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />)}
        {buttonText}
      </Button>
      <GroupDialog group={currentGroup} students={students} open={open} onClose={handleClose} onSave={handleSave} />
    </>
  )
}
