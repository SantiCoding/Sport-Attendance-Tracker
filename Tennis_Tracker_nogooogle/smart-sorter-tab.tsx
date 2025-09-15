"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Brain, Wand2, Users, Clock } from "lucide-react"
import { useToast } from "@/components/toast"

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
}

interface SmartSorterTabProps {
  profileData: CoachProfile | null
  updateProfile: (profile: CoachProfile) => void
  onSortComplete: () => void
  isActive: boolean
}

export function SmartSorterTab({ profileData, updateProfile, onSortComplete, isActive }: SmartSorterTabProps) {
  const { toast } = useToast()
  const [inputText, setInputText] = useState("")
  const [parsedData, setParsedData] = useState<{
    groups: Array<{ name: string; students: string[]; type: "group" | "private"; schedule?: string }>
    students: Array<{ name: string; sessions: number }>
  } | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const parseSmartInput = () => {
    if (!inputText.trim()) {
      toast("❌ Please enter some text to parse", "error")
      return
    }

    setIsProcessing(true)

    // Simple parsing logic - this could be enhanced with AI
    const lines = inputText.split("\n").filter((line) => line.trim())
    const groups: Array<{ name: string; students: string[]; type: "group" | "private"; schedule?: string }> = []
    const students: Array<{ name: string; sessions: number }> = []

    let currentGroup: { name: string; students: string[]; type: "group" | "private"; schedule?: string } | null = null

    for (const line of lines) {
      const trimmedLine = line.trim()

      // Check if it's a group header
      if (trimmedLine.includes("Group") || trimmedLine.includes("Class") || trimmedLine.includes("Private")) {
        if (currentGroup) {
          groups.push(currentGroup)
        }
        currentGroup = {
          name: trimmedLine,
          students: [],
          type: trimmedLine.toLowerCase().includes("private") ? "private" : "group",
          schedule: undefined,
        }
      }
      // Check if it's a schedule line
      else if (trimmedLine.match(/\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/i)) {
        if (currentGroup) {
          currentGroup.schedule = trimmedLine
        }
      }
      // Check if it's a student name (simple heuristic)
      else if (trimmedLine.length > 2 && !trimmedLine.includes(":") && currentGroup) {
        const sessionMatch = trimmedLine.match(/(\d+)\s*(session|lesson)/i)
        const sessions = sessionMatch ? Number.parseInt(sessionMatch[1]) : 8 // Default to 8 sessions

        const studentName = trimmedLine.replace(/\d+\s*(session|lesson)/gi, "").trim()
        currentGroup.students.push(studentName)

        // Add to students array if not already exists
        if (!students.find((s) => s.name === studentName)) {
          students.push({ name: studentName, sessions })
        }
      }
    }

    if (currentGroup) {
      groups.push(currentGroup)
    }

    setParsedData({ groups, students })
    setIsProcessing(false)

    if (groups.length === 0 && students.length === 0) {
      toast("❌ No groups or students found in the text", "error")
    } else {
      toast(`✅ Found ${groups.length} groups and ${students.length} students`, "success")
    }
  }

  const applySortedData = () => {
    if (!parsedData || !profileData) return

    const newStudents = parsedData.students.map((studentData) => ({
      id: `student_${Date.now()}_${Math.random()}`,
      name: studentData.name,
      notes: "",
      prepaidSessions: studentData.sessions,
      remainingSessions: studentData.sessions,
      makeupSessions: 0,
    }))

    const newGroups = parsedData.groups.map((groupData) => {
      const studentIds = groupData.students
        .map((studentName) => {
          const student = newStudents.find((s) => s.name === studentName)
          return student?.id || ""
        })
        .filter(Boolean)

      const scheduleMatch = groupData.schedule?.match(/(\w+)\s+(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i)

      return {
        id: `group_${Date.now()}_${Math.random()}`,
        name: groupData.name,
        type: groupData.type,
        studentIds,
        dayOfWeek: scheduleMatch?.[1] || undefined,
        time: scheduleMatch?.[2] || undefined,
        duration: "1 hour",
      }
    })

    const updatedProfile = {
      ...profileData,
      students: [...profileData.students, ...newStudents],
      groups: [...profileData.groups, ...newGroups],
    }

    updateProfile(updatedProfile)
    toast(`✅ Added ${newStudents.length} students and ${newGroups.length} groups`, "success")

    // Clear the form
    setInputText("")
    setParsedData(null)
    onSortComplete()
  }

  if (!profileData) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6 text-center">
          <p className="text-secondary-white">Please create a coach profile first.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-primary-white flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Smart Sorter
          </CardTitle>
          <p className="text-secondary-white">
            Paste your student and group information, and let AI organize it for you.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-secondary-white">Paste your text (groups, students, schedules)</Label>
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Example:
Advanced Group
Monday 4:00 PM
John Smith 8 sessions
Sarah Johnson 10 sessions

Beginner Private
Tuesday 3:00 PM  
Mike Wilson 6 sessions`}
              className="glass-input text-primary-white placeholder:text-tertiary-white min-h-[200px]"
            />
          </div>
          <Button
            onClick={parseSmartInput}
            disabled={isProcessing || !inputText.trim()}
            className="glass-button text-primary-white"
          >
            <Wand2 className="h-4 w-4 mr-2" />
            {isProcessing ? "Processing..." : "Parse Text"}
          </Button>
        </CardContent>
      </Card>

      {parsedData && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-primary-white">Parsed Results</CardTitle>
            <p className="text-secondary-white">Review the parsed data before applying</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {parsedData.groups.length > 0 && (
              <div>
                <h3 className="font-semibold text-primary-white mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Groups ({parsedData.groups.length})
                </h3>
                <div className="space-y-3">
                  {parsedData.groups.map((group, index) => (
                    <div key={index} className="glass-card p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-primary-white">{group.name}</h4>
                        <Badge
                          className={
                            group.type === "group" ? "bg-blue-500/20 text-blue-300" : "bg-purple-500/20 text-purple-300"
                          }
                        >
                          {group.type}
                        </Badge>
                      </div>
                      {group.schedule && (
                        <p className="text-sm text-secondary-white flex items-center gap-1 mb-2">
                          <Clock className="h-3 w-3" />
                          {group.schedule}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {group.students.map((student, studentIndex) => (
                          <Badge key={studentIndex} variant="outline" className="text-xs">
                            {student}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {parsedData.students.length > 0 && (
              <div>
                <h3 className="font-semibold text-primary-white mb-3">Students ({parsedData.students.length})</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {parsedData.students.map((student, index) => (
                    <div key={index} className="glass-card p-2">
                      <p className="font-medium text-primary-white text-sm">{student.name}</p>
                      <p className="text-xs text-secondary-white">{student.sessions} sessions</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setInputText("")
                  setParsedData(null)
                }}
                variant="outline"
                className="flex-1"
              >
                Clear
              </Button>
              <Button onClick={applySortedData} className="glass-button flex-1 text-primary-white">
                Apply Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
