"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"

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
  dayOfWeek?: string
  time?: string
  duration?: string
}

interface CoachProfile {
  id: string
  name: string
  students: Student[]
  groups: Group[]
  attendanceRecords: any[]
  archivedTerms: any[]
  completedMakeupSessions: any[]
  makeupSessions?: any[]
}

interface GroupDialogProps {
  profileData: CoachProfile
  onUpdateProfile: (profile: CoachProfile) => void
  group?: Group
  children: React.ReactNode
}

export function GroupDialog({ profileData, onUpdateProfile, group, children }: GroupDialogProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    type: "group" as "group" | "private",
    dayOfWeek: "monday",
    time: "9:00 AM",
    duration: "1 hour",
    studentIds: [] as string[],
  })

  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name,
        type: group.type,
        dayOfWeek: group.dayOfWeek || "monday",
        time: group.time || "9:00 AM",
        duration: group.duration || "1 hour",
        studentIds: group.studentIds,
      })
    } else {
      setFormData({
        name: "",
        type: "group",
        dayOfWeek: "monday",
        time: "9:00 AM",
        duration: "1 hour",
        studentIds: [],
      })
    }
  }, [group, open])

  const handleStudentToggle = (studentId: string) => {
    setFormData((prev) => ({
      ...prev,
      studentIds: prev.studentIds.includes(studentId)
        ? prev.studentIds.filter((id) => id !== studentId)
        : [...prev.studentIds, studentId],
    }))
  }

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast("❌ Group name is required", "error")
      return
    }

    const updatedGroup: Group = {
      id: group?.id || `group_${Date.now()}`,
      name: formData.name.trim(),
      type: formData.type,
      dayOfWeek: formData.dayOfWeek,
      time: formData.time,
      duration: formData.duration,
      studentIds: formData.studentIds,
    }

    let updatedGroups: Group[]
    if (group) {
      updatedGroups = profileData.groups.map((g) => (g.id === group.id ? updatedGroup : g))
      toast(`✅ ${updatedGroup.name} updated successfully`, "success")
    } else {
      updatedGroups = [...profileData.groups, updatedGroup]
      toast(`✅ ${updatedGroup.name} created successfully`, "success")
    }

    onUpdateProfile({
      ...profileData,
      groups: updatedGroups,
    })

    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="glass-dropdown w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary-white">{group ? "Edit Group" : "Create New Group"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="group-name" className="text-secondary-white">
              Group Name
            </Label>
            <Input
              id="group-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter group name"
              className="glass-input text-primary-white placeholder:text-tertiary-white mt-1 text-sm"
            />
          </div>

          <div>
            <Label className="text-secondary-white">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: "group" | "private") => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger className="glass-input text-primary-white mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-dropdown">
                <SelectItem value="group" className="text-primary-white">
                  Group Class
                </SelectItem>
                <SelectItem value="private" className="text-primary-white">
                  Private Lesson
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-secondary-white">Day</Label>
              <Select
                value={formData.dayOfWeek}
                onValueChange={(value) => setFormData({ ...formData, dayOfWeek: value })}
              >
                <SelectTrigger className="glass-input text-primary-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-dropdown">
                  <SelectItem value="monday" className="text-primary-white">
                    Monday
                  </SelectItem>
                  <SelectItem value="tuesday" className="text-primary-white">
                    Tuesday
                  </SelectItem>
                  <SelectItem value="wednesday" className="text-primary-white">
                    Wednesday
                  </SelectItem>
                  <SelectItem value="thursday" className="text-primary-white">
                    Thursday
                  </SelectItem>
                  <SelectItem value="friday" className="text-primary-white">
                    Friday
                  </SelectItem>
                  <SelectItem value="saturday" className="text-primary-white">
                    Saturday
                  </SelectItem>
                  <SelectItem value="sunday" className="text-primary-white">
                    Sunday
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-secondary-white">Time</Label>
              <div className="flex gap-2 mt-1">
                <Select 
                  value={formData.time.split(':')[0]} 
                  onValueChange={(hour) => {
                    const [_, minute, period] = formData.time.split(/[: ]/)
                    setFormData({ ...formData, time: `${hour}:${minute} ${period}` })
                  }}
                >
                  <SelectTrigger className="glass-input text-primary-white flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-dropdown">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(hour => (
                      <SelectItem key={hour} value={hour.toString()} className="text-primary-white">
                        {hour}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select 
                  value={formData.time.split(':')[1].split(' ')[0]} 
                  onValueChange={(minute) => {
                    const [hour, _, period] = formData.time.split(/[: ]/)
                    setFormData({ ...formData, time: `${hour}:${minute} ${period}` })
                  }}
                >
                  <SelectTrigger className="glass-input text-primary-white flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-dropdown">
                    <SelectItem value="00" className="text-primary-white">00</SelectItem>
                    <SelectItem value="15" className="text-primary-white">15</SelectItem>
                    <SelectItem value="30" className="text-primary-white">30</SelectItem>
                    <SelectItem value="45" className="text-primary-white">45</SelectItem>
                  </SelectContent>
                </Select>
                <Select 
                  value={formData.time.split(' ')[1]} 
                  onValueChange={(period) => {
                    const [hour, minute] = formData.time.split(':')
                    const timeWithoutPeriod = minute.split(' ')[0]
                    setFormData({ ...formData, time: `${hour}:${timeWithoutPeriod} ${period}` })
                  }}
                >
                  <SelectTrigger className="glass-input text-primary-white flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-dropdown">
                    <SelectItem value="AM" className="text-primary-white">AM</SelectItem>
                    <SelectItem value="PM" className="text-primary-white">PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-secondary-white">Duration</Label>
            <Select value={formData.duration} onValueChange={(value) => setFormData({ ...formData, duration: value })}>
              <SelectTrigger className="glass-input text-primary-white mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-dropdown">
                <SelectItem value="30 minutes" className="text-primary-white">
                  30 minutes
                </SelectItem>
                <SelectItem value="45 minutes" className="text-primary-white">
                  45 minutes
                </SelectItem>
                <SelectItem value="1 hour" className="text-primary-white">
                  1 hour
                </SelectItem>
                <SelectItem value="1.5 hours" className="text-primary-white">
                  1.5 hours
                </SelectItem>
                <SelectItem value="2 hours" className="text-primary-white">
                  2 hours
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-secondary-white">Students ({formData.studentIds.length} selected)</Label>
            <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
              {profileData.students.length === 0 ? (
                <p className="text-tertiary-white text-sm">No students available. Add students first.</p>
              ) : (
                profileData.students.map((student) => (
                  <div key={student.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`student-${student.id}`}
                      checked={formData.studentIds.includes(student.id)}
                      onCheckedChange={() => handleStudentToggle(student.id)}
                    />
                    <Label htmlFor={`student-${student.id}`} className="text-secondary-white text-sm cursor-pointer">
                      {student.name}
                    </Label>
                  </div>
                ))
              )}
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
            {group ? "Update Group" : "Create Group"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
