"use client"

import React, { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Search, User, Users, Edit, Trash2, Download, CalendarDays, Clock, Archive, CheckSquare, Square, X, BarChart3 } from "lucide-react"
import { StudentDialog } from "@/components/student-dialog"
import { useToast } from "@/toast"
import { format, startOfWeek, endOfWeek, isWithinInterval, parseISO, startOfDay, endOfDay, addDays, subDays } from "date-fns"
import { cn } from "@/lib/utils"

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
  dayOfWeek?: string | string[]
  time?: string
  duration?: string
}

interface AttendanceRecord {
  id: string
  date: string
  time: string
  groupId: string
  studentId: string
  status: "present" | "absent" | "canceled"
  notes: string
  cancelReason?: string
  timeAdjustmentAmount?: string
  timeAdjustmentType?: "more" | "less"
  timeAdjustmentReason?: string
  isMakeupSession?: boolean
  originalGroupId?: string
}

interface CoachProfile {
  id: string
  name: string
  students: Student[]
  groups: Group[]
  attendanceRecords: AttendanceRecord[]
  archivedTerms: any[]
  completedMakeupSessions: any[]
  archivedSessions?: AttendanceRecord[]
}

interface StudentSearchTabProps {
  profileData: CoachProfile | null
  updateProfile: (profile: CoachProfile) => void
  isActive: boolean
}

export function StudentSearchTab({ profileData, updateProfile, isActive }: StudentSearchTabProps) {
  const { toast } = useToast()
  const [viewMode, setViewMode] = useState<"students" | "sessions">("students")
  
  // Student view state
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("name")
  const [filterBy, setFilterBy] = useState("all_students")
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set())
  
  // Session view state
  const [sessionViewMode, setSessionViewMode] = useState<"all" | "by_group" | "by_week" | "by_student" | "private">("all")
  const [sessionSearchTerm, setSessionSearchTerm] = useState("")
  const [sessionSortBy, setSessionSortBy] = useState<"newest" | "oldest">("newest")
  const [selectedGroupId, setSelectedGroupId] = useState<string>("all")
  const [selectedStudentId, setSelectedStudentId] = useState<string>("all")
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date | undefined>(undefined)
  const [customDateRange, setCustomDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [showArchived, setShowArchived] = useState(false)
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set())
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  const formatDayDisplay = (dayOfWeek: string | string[] | undefined) => {
    if (!dayOfWeek) return "Not specified"
    if (Array.isArray(dayOfWeek)) {
      const dayMap: { [key: string]: string } = {
        monday: "Mon",
        tuesday: "Tue", 
        wednesday: "Wed",
        thursday: "Thu",
        friday: "Fri",
        saturday: "Sat",
        sunday: "Sun"
      }
      return dayOfWeek.map(day => dayMap[day] || day).join(", ")
    }
    const dayMap: { [key: string]: string } = {
      monday: "Mon",
      tuesday: "Tue", 
      wednesday: "Wed",
      thursday: "Thu",
      friday: "Fri",
      saturday: "Sat",
      sunday: "Sun"
    }
    return dayMap[dayOfWeek] || dayOfWeek
  }

  const filteredAndSortedStudents = useMemo(() => {
    if (!profileData) return []

    let filtered = profileData.students ?? []

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (student) =>
          student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.notes.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Apply category filter
    if (filterBy !== "all_students") {
      switch (filterBy) {
        case "active":
          filtered = filtered.filter((student) => student.remainingSessions > 0)
          break
        case "inactive":
          filtered = filtered.filter((student) => student.remainingSessions === 0)
          break
        case "has_makeups":
          filtered = filtered.filter((student) => student.makeupSessions > 0)
          break
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "remaining_sessions":
          return b.remainingSessions - a.remainingSessions
        case "makeup_sessions":
          return b.makeupSessions - a.makeupSessions
        case "prepaid_sessions":
          return b.prepaidSessions - a.prepaidSessions
        default:
          return 0
      }
    })

    return filtered
  }, [profileData, searchTerm, sortBy, filterBy])

  const getStudentGroups = (studentId: string) => {
    if (!profileData) return []
    return (profileData.groups ?? []).filter((group) => group.studentIds.includes(studentId))
  }

  const deleteStudent = (studentId: string) => {
    if (!profileData) return

    const student = (profileData.students ?? []).find((s) => s.id === studentId)
    if (!student) return

    // Remove student from all groups
    const updatedGroups = (profileData.groups ?? []).map((group) => ({
      ...group,
      studentIds: group.studentIds.filter((id) => id !== studentId),
    }))

    // Remove student from students list
    const updatedStudents = (profileData.students ?? []).filter((s) => s.id !== studentId)

    updateProfile({
      ...profileData,
      students: updatedStudents,
      groups: updatedGroups,
    })

    toast(`✅ ${student.name} has been removed`, "success")
  }

  const toggleStudentExpansion = (studentId: string) => {
    setExpandedStudents((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(studentId)) {
        newSet.delete(studentId)
      } else {
        newSet.add(studentId)
      }
      return newSet
    })
  }

  // Get current week (Monday to Saturday)
  const getCurrentWeek = () => {
    const now = new Date()
    const monday = startOfWeek(now, { weekStartsOn: 1 }) // Monday = 1
    const saturday = addDays(monday, 5) // Saturday is 5 days after Monday
    return { start: monday, end: saturday }
  }

  // Get all sessions (active or archived)
  const getAllSessions = useMemo(() => {
    if (!profileData) return []
    const records = showArchived 
      ? (profileData.archivedSessions ?? [])
      : (profileData.attendanceRecords ?? [])
    return records
  }, [profileData, showArchived])

  // Filter and organize sessions
  const organizedSessions = useMemo(() => {
    if (!profileData) return { sections: [], stats: { total: 0, present: 0, absent: 0, canceled: 0 } }
    
    let sessions = [...getAllSessions]

    // Apply search filter
    if (sessionSearchTerm.trim()) {
      sessions = sessions.filter(record => {
        const student = profileData.students.find(s => s.id === record.studentId)
        const group = profileData.groups.find(g => g.id === record.groupId)
        const searchLower = sessionSearchTerm.toLowerCase()
        return (
          student?.name.toLowerCase().includes(searchLower) ||
          group?.name.toLowerCase().includes(searchLower) ||
          record.date.includes(searchLower) ||
          record.time.toLowerCase().includes(searchLower)
        )
      })
    }

    // Apply view mode filters
    if (sessionViewMode === "private") {
      sessions = sessions.filter(record => {
        const group = profileData.groups.find(g => g.id === record.groupId)
        return group?.type === "private"
      })
    } else if (sessionViewMode === "by_group" && selectedGroupId !== "all") {
      sessions = sessions.filter(record => record.groupId === selectedGroupId)
    } else if (sessionViewMode === "by_student" && selectedStudentId !== "all") {
      sessions = sessions.filter(record => record.studentId === selectedStudentId)
    } else if (sessionViewMode === "by_week") {
      const week = selectedWeekStart 
        ? { start: startOfWeek(selectedWeekStart, { weekStartsOn: 1 }), end: addDays(startOfWeek(selectedWeekStart, { weekStartsOn: 1 }), 5) }
        : getCurrentWeek()
      sessions = sessions.filter(record => {
        const recordDate = parseISO(record.date)
        return isWithinInterval(recordDate, { start: week.start, end: week.end })
      })
    }

    // Apply custom date range
    if (customDateRange.from && customDateRange.to) {
      sessions = sessions.filter(record => {
        const recordDate = parseISO(record.date)
        return isWithinInterval(recordDate, { start: customDateRange.from!, end: customDateRange.to! })
      })
    }

    // Sort sessions
    const sortedSessions = [...sessions].sort((a, b) => {
      const dateA = parseISO(a.date).getTime()
      const dateB = parseISO(b.date).getTime()
      if (sessionSortBy === "newest") {
        return dateB - dateA
      } else {
        return dateA - dateB
      }
    })
    sessions = sortedSessions

    // Organize into sections based on view mode
    const sections: Array<{ key: string; title: string; sessions: AttendanceRecord[] }> = []
    
    if (sessionViewMode === "by_group") {
      const groupsMap = new Map<string, AttendanceRecord[]>()
      sessions.forEach(record => {
        const groupId = record.groupId
        if (!groupsMap.has(groupId)) {
          groupsMap.set(groupId, [])
        }
        groupsMap.get(groupId)!.push(record)
      })
      groupsMap.forEach((groupSessions, groupId) => {
        const group = profileData.groups.find(g => g.id === groupId)
        sections.push({
          key: `group-${groupId}`,
          title: group?.name || "Unknown Group",
          sessions: groupSessions
        })
      })
    } else if (sessionViewMode === "by_week") {
      const weeksMap = new Map<string, AttendanceRecord[]>()
      sessions.forEach(record => {
        const recordDate = parseISO(record.date)
        const weekStart = startOfWeek(recordDate, { weekStartsOn: 1 })
        const weekKey = format(weekStart, "yyyy-MM-dd")
        if (!weeksMap.has(weekKey)) {
          weeksMap.set(weekKey, [])
        }
        weeksMap.get(weekKey)!.push(record)
      })
      weeksMap.forEach((weekSessions, weekKey) => {
        const weekStart = parseISO(weekKey + "T00:00:00")
        const weekEnd = addDays(weekStart, 5)
        sections.push({
          key: `week-${weekKey}`,
          title: `${format(weekStart, "MMM dd")} - ${format(weekEnd, "MMM dd, yyyy")}`,
          sessions: weekSessions
        })
      })
    } else if (sessionViewMode === "by_student") {
      const studentsMap = new Map<string, AttendanceRecord[]>()
      sessions.forEach(record => {
        const studentId = record.studentId
        if (!studentsMap.has(studentId)) {
          studentsMap.set(studentId, [])
        }
        studentsMap.get(studentId)!.push(record)
      })
      studentsMap.forEach((studentSessions, studentId) => {
        const student = profileData.students.find(s => s.id === studentId)
        sections.push({
          key: `student-${studentId}`,
          title: student?.name || "Unknown Student",
          sessions: studentSessions
        })
      })
    } else {
      // All sessions or private - group by date
      const datesMap = new Map<string, AttendanceRecord[]>()
      sessions.forEach(record => {
        const dateKey = record.date
        if (!datesMap.has(dateKey)) {
          datesMap.set(dateKey, [])
        }
        datesMap.get(dateKey)!.push(record)
      })
      datesMap.forEach((dateSessions, dateKey) => {
        const date = parseISO(dateKey)
        sections.push({
          key: `date-${dateKey}`,
          title: format(date, "MMM dd, yyyy"),
          sessions: dateSessions
        })
      })
    }

    // Calculate stats
    const stats = {
      total: sessions.length,
      present: sessions.filter(s => s.status === "present").length,
      absent: sessions.filter(s => s.status === "absent").length,
      canceled: sessions.filter(s => s.status === "canceled").length
    }

    return { sections, stats, allSessions: sessions }
  }, [profileData, getAllSessions, sessionViewMode, sessionSearchTerm, sessionSortBy, selectedGroupId, selectedStudentId, selectedWeekStart, customDateRange])

  // Export functions
  const exportSessions = (sessionsToExport: AttendanceRecord[], filename: string) => {
    if (!profileData || sessionsToExport.length === 0) {
      toast("❌ No sessions to export", "error")
      return
    }

    const csvData: string[][] = []
    csvData.push(["Group Name", "Date", "Time", "Student Name", "Status", "Duration", "Time Adjustment", "Reason", "Notes", "Makeup"])

    // Organize by group, then date, then time
    const organized: Record<string, Record<string, Record<string, AttendanceRecord[]>>> = {}
    
    sessionsToExport.forEach(record => {
      const group = profileData.groups.find(g => g.id === record.groupId)
      const groupName = group?.name || "Unknown Group"
      const date = record.date
      const time = record.time

      if (!organized[groupName]) organized[groupName] = {}
      if (!organized[groupName][date]) organized[groupName][date] = {}
      if (!organized[groupName][date][time]) organized[groupName][date][time] = []
      
      organized[groupName][date][time].push(record)
    })

    // Generate CSV with sections
    Object.keys(organized).sort().forEach(groupName => {
      csvData.push([`=== ${groupName} ===`, "", "", "", "", "", "", "", "", ""])
      
      Object.keys(organized[groupName]).sort().forEach(date => {
        csvData.push([`--- ${format(parseISO(date), "MMM dd, yyyy")} ---`, "", "", "", "", "", "", "", "", ""])
        
        Object.keys(organized[groupName][date]).sort().forEach(time => {
          organized[groupName][date][time].forEach(record => {
            const student = profileData.students.find(s => s.id === record.studentId)
            const group = profileData.groups.find(g => g.id === record.groupId)
            const recordGroup = profileData.groups.find(g => g.id === record.groupId)
            
            const isMakeupSession = record.status === "present" && 
              (record.isMakeupSession || (recordGroup && group && recordGroup.id !== group.id))
            
            let baseDuration = 1.5
            let timeAdjustment = 0
            let timeAdjustmentReason = ""
            
            if (record.timeAdjustmentAmount && record.timeAdjustmentType) {
              const adjustmentAmount = parseFloat(record.timeAdjustmentAmount) || 0
              timeAdjustment = record.timeAdjustmentType === "more" ? adjustmentAmount : -adjustmentAmount
              timeAdjustmentReason = record.timeAdjustmentReason || ""
            }
            
            const actualDuration = baseDuration + (timeAdjustment / 60)
            const wholeHours = Math.floor(actualDuration)
            const minutes = Math.round((actualDuration - wholeHours) * 60)
            const durationText = minutes > 0 ? `${wholeHours}h ${minutes}m` : `${wholeHours}h`

            csvData.push([
              groupName,
              format(parseISO(record.date), "MMM dd, yyyy"),
              record.time,
              student?.name || "Unknown",
              isMakeupSession ? "Makeup" : record.status,
              durationText,
              timeAdjustment !== 0 ? `${timeAdjustment > 0 ? "+" : ""}${timeAdjustment}min` : "",
              timeAdjustmentReason,
              record.notes || "",
              isMakeupSession ? `Yes (from ${recordGroup?.name || "Unknown"})` : "No"
            ])
          })
        })
      })
      
      csvData.push(["", "", "", "", "", "", "", "", "", ""])
    })

    // Add summary
    csvData.push(["", "", "", "", "", "", "", "", "", ""])
    csvData.push(["=== SUMMARY ===", "", "", "", "", "", "", "", "", ""])
    csvData.push(["Total Sessions", sessionsToExport.length.toString(), "", "", "", "", "", "", "", ""])
    csvData.push(["Present", sessionsToExport.filter(s => s.status === "present").length.toString(), "", "", "", "", "", "", "", ""])
    csvData.push(["Absent", sessionsToExport.filter(s => s.status === "absent").length.toString(), "", "", "", "", "", "", "", ""])
    csvData.push(["Canceled", sessionsToExport.filter(s => s.status === "canceled").length.toString(), "", "", "", "", "", "", "", ""])

    const csvContent = csvData
      .map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(","))
      .join("\r\n")

    const csvWithBOM = "\uFEFF" + csvContent
    const blob = new Blob([csvWithBOM], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.style.display = "none"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast("✅ Sessions exported successfully", "success")
  }

  const exportCurrentView = () => {
    const filename = showArchived 
      ? `Archived_Sessions_${format(new Date(), "yyyy-MM-dd")}.csv`
      : `Sessions_${format(new Date(), "yyyy-MM-dd")}.csv`
    exportSessions(organizedSessions.allSessions, filename)
  }

  const exportThisWeek = () => {
    const week = getCurrentWeek()
    const weekSessions = organizedSessions.allSessions.filter(record => {
      const recordDate = parseISO(record.date)
      return isWithinInterval(recordDate, { start: week.start, end: week.end })
    })
    const filename = `Sessions_Week_${format(week.start, "MMMdd")}-${format(week.end, "MMMdd_yyyy")}.csv`
    exportSessions(weekSessions, filename)
  }

  // Archive functions
  const archiveSessions = (sessionIds: string[]) => {
    if (!profileData || sessionIds.length === 0) return

    const sessionsToArchive = profileData.attendanceRecords.filter(r => sessionIds.includes(r.id))
    const updatedRecords = profileData.attendanceRecords.filter(r => !sessionIds.includes(r.id))
    const updatedArchived = [...(profileData.archivedSessions ?? []), ...sessionsToArchive]

    updateProfile({
      ...profileData,
      attendanceRecords: updatedRecords,
      archivedSessions: updatedArchived
    })

    setSelectedSessions(new Set())
    toast(`✅ Archived ${sessionIds.length} session(s)`, "success")
  }

  const archiveOldSessions = (monthsOld: number) => {
    if (!profileData) return

    const cutoffDate = subDays(new Date(), monthsOld * 30)
    const sessionsToArchive = profileData.attendanceRecords.filter(record => {
      const recordDate = parseISO(record.date)
      return recordDate < cutoffDate
    })

    if (sessionsToArchive.length === 0) {
      toast("ℹ️ No sessions found older than the selected period", "info")
      return
    }

    const updatedRecords = profileData.attendanceRecords.filter(record => {
      const recordDate = parseISO(record.date)
      return recordDate >= cutoffDate
    })
    const updatedArchived = [...(profileData.archivedSessions ?? []), ...sessionsToArchive]

    updateProfile({
      ...profileData,
      attendanceRecords: updatedRecords,
      archivedSessions: updatedArchived
    })

    toast(`✅ Archived ${sessionsToArchive.length} session(s)`, "success")
  }

  const restoreSessions = (sessionIds: string[]) => {
    if (!profileData || sessionIds.length === 0) return

    const sessionsToRestore = (profileData.archivedSessions ?? []).filter(r => sessionIds.includes(r.id))
    const updatedArchived = (profileData.archivedSessions ?? []).filter(r => !sessionIds.includes(r.id))
    const updatedRecords = [...profileData.attendanceRecords, ...sessionsToRestore]

    updateProfile({
      ...profileData,
      attendanceRecords: updatedRecords,
      archivedSessions: updatedArchived
    })

    setSelectedSessions(new Set())
    toast(`✅ Restored ${sessionIds.length} session(s)`, "success")
  }

  const deleteSessions = (sessionIds: string[]) => {
    if (!profileData || sessionIds.length === 0) return

    const records = showArchived ? profileData.archivedSessions ?? [] : profileData.attendanceRecords
    const updatedRecords = records.filter(r => !sessionIds.includes(r.id))

    if (showArchived) {
      updateProfile({
        ...profileData,
        archivedSessions: updatedRecords
      })
    } else {
      updateProfile({
        ...profileData,
        attendanceRecords: updatedRecords
      })
    }

    setSelectedSessions(new Set())
    toast(`✅ Deleted ${sessionIds.length} session(s)`, "success")
  }

  // Bulk selection helpers
  const toggleSessionSelection = (sessionId: string) => {
    setSelectedSessions((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId)
      } else {
        newSet.add(sessionId)
      }
      return newSet
    })
  }

  const selectAllSessions = () => {
    setSelectedSessions(new Set(organizedSessions.allSessions.map(s => s.id)))
  }

  const deselectAllSessions = () => {
    setSelectedSessions(new Set())
  }

  const toggleSectionExpansion = (sectionKey: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(sectionKey)) {
        newSet.delete(sectionKey)
      } else {
        newSet.add(sectionKey)
      }
      return newSet
    })
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
          <div className="flex items-center justify-between">
            <CardTitle className="text-primary-white flex items-center gap-2">
              <Search className="h-5 w-5" />
              {viewMode === "students" ? "Student Search & Management" : "Session Management"}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "students" ? "default" : "outline"}
                onClick={() => setViewMode("students")}
                className={viewMode === "students" ? "glass-button text-primary-white" : "glass-button-outline"}
                size="sm"
              >
                <User className="h-4 w-4 mr-2" />
                Students
              </Button>
              <Button
                variant={viewMode === "sessions" ? "default" : "outline"}
                onClick={() => setViewMode("sessions")}
                className={viewMode === "sessions" ? "glass-button text-primary-white" : "glass-button-outline"}
                size="sm"
              >
                <CalendarDays className="h-4 w-4 mr-2" />
                Sessions
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {viewMode === "students" ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-secondary-white">Search Students</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-tertiary-white" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by name or notes..."
                      className="glass-input text-primary-white placeholder:text-tertiary-white pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-secondary-white">Sort By</Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="glass-input text-primary-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass-dropdown">
                      <SelectItem value="name" className="text-primary-white">
                        Name (A-Z)
                      </SelectItem>
                      <SelectItem value="remaining_sessions" className="text-primary-white">
                        Remaining Sessions
                      </SelectItem>
                      <SelectItem value="makeup_sessions" className="text-primary-white">
                        Make-up Sessions
                      </SelectItem>
                      <SelectItem value="prepaid_sessions" className="text-primary-white">
                        Prepaid Sessions
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-secondary-white">Filter By</Label>
                  <Select value={filterBy} onValueChange={setFilterBy}>
                    <SelectTrigger className="glass-input text-primary-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass-dropdown">
                      <SelectItem value="all_students" className="text-primary-white">
                        All Students
                      </SelectItem>
                      <SelectItem value="active" className="text-primary-white">
                        Active (Has Sessions)
                      </SelectItem>
                      <SelectItem value="inactive" className="text-primary-white">
                        Inactive (No Sessions)
                      </SelectItem>
                      <SelectItem value="has_makeups" className="text-primary-white">
                        Has Make-ups
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-secondary-white">
                  Showing {filteredAndSortedStudents.length} of {(profileData.students ?? []).length} students
                </p>
                <StudentDialog profileData={profileData} onUpdateProfile={updateProfile}>
                  <Button className="glass-button text-primary-white">
                    <User className="h-4 w-4 mr-2" />
                    Add Student
                  </Button>
                </StudentDialog>
              </div>
            </>
          ) : (
            <>
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="glass-card p-3">
                  <p className="text-secondary-white text-sm">Total Sessions</p>
                  <p className="font-semibold text-primary-white text-xl">{organizedSessions.stats.total}</p>
                </div>
                <div className="glass-card p-3">
                  <p className="text-secondary-white text-sm">Present</p>
                  <p className="font-semibold text-green-400 text-xl">{organizedSessions.stats.present}</p>
                </div>
                <div className="glass-card p-3">
                  <p className="text-secondary-white text-sm">Absent</p>
                  <p className="font-semibold text-red-400 text-xl">{organizedSessions.stats.absent}</p>
                </div>
                <div className="glass-card p-3">
                  <p className="text-secondary-white text-sm">Canceled</p>
                  <p className="font-semibold text-yellow-400 text-xl">{organizedSessions.stats.canceled}</p>
                </div>
              </div>

              {/* Filters and Controls */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-secondary-white">View Mode</Label>
                    <Select value={sessionViewMode} onValueChange={(v: any) => setSessionViewMode(v)}>
                      <SelectTrigger className="glass-input text-primary-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-dropdown">
                        <SelectItem value="all" className="text-primary-white">All Sessions</SelectItem>
                        <SelectItem value="by_group" className="text-primary-white">By Group</SelectItem>
                        <SelectItem value="by_week" className="text-primary-white">By Week</SelectItem>
                        <SelectItem value="by_student" className="text-primary-white">By Student</SelectItem>
                        <SelectItem value="private" className="text-primary-white">Private Sessions</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {sessionViewMode === "by_group" && (
                    <div>
                      <Label className="text-secondary-white">Select Group</Label>
                      <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                        <SelectTrigger className="glass-input text-primary-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="glass-dropdown">
                          <SelectItem value="all" className="text-primary-white">All Groups</SelectItem>
                          {profileData.groups.map(group => (
                            <SelectItem key={group.id} value={group.id} className="text-primary-white">
                              {group.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {sessionViewMode === "by_student" && (
                    <div>
                      <Label className="text-secondary-white">Select Student</Label>
                      <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                        <SelectTrigger className="glass-input text-primary-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="glass-dropdown">
                          <SelectItem value="all" className="text-primary-white">All Students</SelectItem>
                          {profileData.students.map(student => (
                            <SelectItem key={student.id} value={student.id} className="text-primary-white">
                              {student.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {sessionViewMode === "by_week" && (
                    <div>
                      <Label className="text-secondary-white">Select Week</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="glass-input text-primary-white w-full justify-start">
                            <CalendarDays className="h-4 w-4 mr-2" />
                            {selectedWeekStart ? format(selectedWeekStart, "MMM dd, yyyy") : "This Week"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="glass-dropdown">
                          <Calendar
                            mode="single"
                            selected={selectedWeekStart}
                            onSelect={(date: Date | undefined) => setSelectedWeekStart(date)}
                            className="rounded-md"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}

                  <div>
                    <Label className="text-secondary-white">Sort By</Label>
                    <Select value={sessionSortBy} onValueChange={(v: any) => setSessionSortBy(v)}>
                      <SelectTrigger className="glass-input text-primary-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-dropdown">
                        <SelectItem value="newest" className="text-primary-white">Newest First</SelectItem>
                        <SelectItem value="oldest" className="text-primary-white">Oldest First</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-secondary-white">Search Sessions</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-tertiary-white" />
                      <Input
                        value={sessionSearchTerm}
                        onChange={(e) => setSessionSearchTerm(e.target.value)}
                        placeholder="Search by student, group, date, time..."
                        className="glass-input text-primary-white placeholder:text-tertiary-white pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-secondary-white">Custom Date Range</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="glass-input text-primary-white w-full justify-start">
                          <CalendarDays className="h-4 w-4 mr-2" />
                          {customDateRange.from && customDateRange.to
                            ? `${format(customDateRange.from, "MMM dd")} - ${format(customDateRange.to, "MMM dd, yyyy")}`
                            : "Select date range"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="glass-dropdown">
                        <Calendar
                          mode="range"
                          selected={{ from: customDateRange.from, to: customDateRange.to }}
                          onSelect={(range: { from?: Date; to?: Date } | undefined) => 
                            setCustomDateRange({ from: range?.from, to: range?.to })
                          }
                          className="rounded-md"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={exportCurrentView}
                    className="glass-button text-primary-white"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Current View
                  </Button>
                  {sessionViewMode === "by_week" && (
                    <Button
                      onClick={exportThisWeek}
                      className="glass-button text-primary-white"
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export This Week
                    </Button>
                  )}
                  {selectedSessions.size > 0 && (
                    <>
                      <Button
                        onClick={() => exportSessions(
                          organizedSessions.allSessions.filter(s => selectedSessions.has(s.id)),
                          `Selected_Sessions_${format(new Date(), "yyyy-MM-dd")}.csv`
                        )}
                        className="glass-button text-primary-white"
                        size="sm"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export Selected ({selectedSessions.size})
                      </Button>
                      {!showArchived && (
                        <Button
                          onClick={() => archiveSessions(Array.from(selectedSessions))}
                          className="glass-button text-primary-white bg-yellow-500/20 hover:bg-yellow-500/30"
                          size="sm"
                        >
                          <Archive className="h-4 w-4 mr-2" />
                          Archive Selected
                        </Button>
                      )}
                      {showArchived && (
                        <Button
                          onClick={() => restoreSessions(Array.from(selectedSessions))}
                          className="glass-button text-primary-white bg-green-500/20 hover:bg-green-500/30"
                          size="sm"
                        >
                          <Archive className="h-4 w-4 mr-2" />
                          Restore Selected
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            className="glass-delete-button"
                            size="sm"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Selected
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="glass-card border-white/20">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-primary-white">Delete Sessions</AlertDialogTitle>
                            <AlertDialogDescription className="text-secondary-white">
                              Are you sure you want to delete {selectedSessions.size} session(s)? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="glass-button-outline">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteSessions(Array.from(selectedSessions))}
                              className="glass-delete-button"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                  <div className="flex-1" />
                  {selectedSessions.size > 0 && (
                    <Button
                      onClick={deselectAllSessions}
                      variant="outline"
                      className="glass-button-outline"
                      size="sm"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Deselect All
                    </Button>
                  )}
                  {selectedSessions.size === 0 && organizedSessions.allSessions.length > 0 && (
                    <Button
                      onClick={selectAllSessions}
                      variant="outline"
                      className="glass-button-outline"
                      size="sm"
                    >
                      <CheckSquare className="h-4 w-4 mr-2" />
                      Select All
                    </Button>
                  )}
                  <Button
                    onClick={() => setShowArchived(!showArchived)}
                    variant={showArchived ? "default" : "outline"}
                    className={showArchived ? "glass-button text-primary-white" : "glass-button-outline"}
                    size="sm"
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    {showArchived ? "View Active" : "View Archived"}
                  </Button>
                  {!showArchived && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="glass-button-outline" size="sm">
                          <Archive className="h-4 w-4 mr-2" />
                          Archive Old
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="glass-dropdown">
                        <div className="space-y-2">
                          <Label className="text-primary-white">Archive sessions older than:</Label>
                          <div className="space-y-1">
                            {[1, 3, 6, 12].map(months => (
                              <Button
                                key={months}
                                variant="ghost"
                                onClick={() => archiveOldSessions(months)}
                                className="w-full justify-start text-primary-white hover:bg-white/10"
                                size="sm"
                              >
                                {months} {months === 1 ? "Month" : "Months"}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Sessions List */}
      {viewMode === "sessions" && (
        <div className="space-y-3">
          {organizedSessions.sections.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="p-6 text-center">
                <p className="text-secondary-white">
                  {showArchived ? "No archived sessions found" : "No sessions found"}
                </p>
              </CardContent>
            </Card>
          ) : (
            organizedSessions.sections.map((section) => {
              const isExpanded = expandedSections.has(section.key)
              const sectionStats = {
                total: section.sessions.length,
                present: section.sessions.filter(s => s.status === "present").length,
                absent: section.sessions.filter(s => s.status === "absent").length,
                canceled: section.sessions.filter(s => s.status === "canceled").length
              }

              return (
                <Card key={section.key} className="glass-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div 
                        className="flex-1 cursor-pointer flex items-center gap-3"
                        onClick={() => toggleSectionExpansion(section.key)}
                      >
                        <h3 className="text-primary-white font-semibold text-lg">{section.title}</h3>
                        <Badge className="glass-card text-primary-white border-white/20">
                          {sectionStats.total} sessions
                        </Badge>
                        <div className="flex gap-2 text-xs">
                          <span className="text-green-400">{sectionStats.present} present</span>
                          <span className="text-red-400">{sectionStats.absent} absent</span>
                          {sectionStats.canceled > 0 && (
                            <span className="text-yellow-400">{sectionStats.canceled} canceled</span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSectionExpansion(section.key)}
                        className="text-primary-white"
                      >
                        {isExpanded ? "Collapse" : "Expand"}
                      </Button>
                    </div>
                  </CardHeader>
                  {isExpanded && (
                    <CardContent>
                      <div className="space-y-2">
                        {section.sessions.map((record) => {
                          const student = profileData.students.find(s => s.id === record.studentId)
                          const group = profileData.groups.find(g => g.id === record.groupId)
                          const isSelected = selectedSessions.has(record.id)
                          const recordDate = parseISO(record.date)

                          let baseDuration = 1.5
                          let timeAdjustment = 0
                          if (record.timeAdjustmentAmount && record.timeAdjustmentType) {
                            const adjustmentAmount = parseFloat(record.timeAdjustmentAmount) || 0
                            timeAdjustment = record.timeAdjustmentType === "more" ? adjustmentAmount : -adjustmentAmount
                          }
                          const actualDuration = baseDuration + (timeAdjustment / 60)
                          const wholeHours = Math.floor(actualDuration)
                          const minutes = Math.round((actualDuration - wholeHours) * 60)
                          const durationText = minutes > 0 ? `${wholeHours}h ${minutes}m` : `${wholeHours}h`

                          return (
                            <div
                              key={record.id}
                              className={cn(
                                "glass-card p-3 flex items-center gap-3 hover:bg-white/5 transition-colors",
                                isSelected && "bg-blue-500/20 border-blue-500/50"
                              )}
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleSessionSelection(record.id)}
                                className="border-white/20"
                              />
                              <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                                <div>
                                  <p className="text-secondary-white text-xs">Student</p>
                                  <p className="text-primary-white font-medium">{student?.name || "Unknown"}</p>
                                </div>
                                <div>
                                  <p className="text-secondary-white text-xs">Group</p>
                                  <p className="text-primary-white font-medium">{group?.name || "Unknown"}</p>
                                </div>
                                <div>
                                  <p className="text-secondary-white text-xs">Date & Time</p>
                                  <p className="text-primary-white font-medium">
                                    {format(recordDate, "MMM dd, yyyy")} {record.time}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-secondary-white text-xs">Status</p>
                                  <Badge
                                    className={cn(
                                      "text-xs",
                                      record.status === "present" && "bg-green-500/20 text-green-400 border-green-500/50",
                                      record.status === "absent" && "bg-red-500/20 text-red-400 border-red-500/50",
                                      record.status === "canceled" && "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
                                    )}
                                  >
                                    {record.status}
                                  </Badge>
                                </div>
                                <div>
                                  <p className="text-secondary-white text-xs">Duration</p>
                                  <p className="text-primary-white font-medium">{durationText}</p>
                                </div>
                              </div>
                              {record.notes && (
                                <div className="text-xs text-secondary-white max-w-xs truncate" title={record.notes}>
                                  {record.notes}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  )}
                </Card>
              )
            })
          )}
        </div>
      )}

      {/* Students List - only show in student view */}
      {viewMode === "students" && (
        <div className="space-y-3">
          {filteredAndSortedStudents.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="p-6 text-center">
                <p className="text-secondary-white">
                  {searchTerm || filterBy !== "all_students"
                    ? "No students match your search criteria"
                    : "No students found"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredAndSortedStudents.map((student) => {
              const studentGroups = getStudentGroups(student.id)

              return (
                <Card key={student.id} className="glass-card">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 cursor-pointer" onClick={() => toggleStudentExpansion(student.id)}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-primary-white text-lg">{student.name}</h3>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {studentGroups.map((group) => (
                                <Badge 
                                  key={group.id} 
                                  className="text-xs glass-card text-primary-white border-white/20 hover:bg-white/10 transition-colors"
                                >
                                  {group.name}
                                </Badge>
                              ))}
                              {studentGroups.length === 0 && (
                                <span className="text-xs text-tertiary-white">No groups assigned</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {expandedStudents.has(student.id) && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                            <div className="glass-card p-3">
                              <p className="text-secondary-white text-sm">Prepaid Sessions</p>
                              <p className="font-semibold text-primary-white">{student.prepaidSessions}</p>
                            </div>
                            <div className="glass-card p-3">
                              <p className="text-secondary-white text-sm">Remaining Sessions</p>
                              <p className="font-semibold text-primary-white">{student.remainingSessions}</p>
                            </div>
                            <div className="glass-card p-3">
                              <p className="text-secondary-white text-sm">Make-up Sessions</p>
                              <p className="font-semibold text-primary-white">{student.makeupSessions}</p>
                            </div>
                          </div>
                        )}

                        {expandedStudents.has(student.id) && (
                          <>
                            {student.notes && (
                              <div className="mb-3">
                                <p className="text-secondary-white text-sm mb-1">Notes:</p>
                                <p className="text-primary-white text-sm bg-white/5 rounded p-2">{student.notes}</p>
                              </div>
                            )}

                            {studentGroups.length > 0 && (
                              <div>
                                <p className="text-secondary-white text-sm mb-2 flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  Groups ({studentGroups.length})
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {studentGroups.map((group) => (
                                    <Badge key={group.id} className="glass-card text-primary-white border-white/20">
                                      {group.name}
                                      {group.dayOfWeek && group.time && (
                                        <span className="ml-1 opacity-75">
                                          • {formatDayDisplay(group.dayOfWeek)} {group.time}
                                        </span>
                                      )}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      <div className="flex gap-2 ml-4">
                        <StudentDialog profileData={profileData} onUpdateProfile={updateProfile} student={student}>
                          <Button 
                            size="sm" 
                            className="glass-button text-primary-white"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </StudentDialog>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteStudent(student.id)
                          }}
                          className="glass-delete-button"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
