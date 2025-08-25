"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Download, BarChart3, TrendingUp, Users, Clock } from "lucide-react"
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns"
import { cn } from "@/lib/utils"
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

interface AttendanceRecord {
  id: string
  date: string
  time: string
  groupId: string
  studentId: string
  status: "present" | "absent" | "canceled"
  notes: string
}

interface CoachProfile {
  id: string
  name: string
  students: Student[]
  groups: Group[]
  attendanceRecords: AttendanceRecord[]
  archivedTerms: any[]
  completedMakeupSessions: any[]
}

interface EnhancedReportsTabProps {
  profileData: CoachProfile | null
  updateProfile: (profile: CoachProfile) => void
}

export function EnhancedReportsTab({ profileData, updateProfile }: EnhancedReportsTabProps) {
  const { toast } = useToast()
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date())
  const [selectedGroup, setSelectedGroup] = useState<string>("all")
  const [reportType, setReportType] = useState<"attendance" | "financial" | "student">("attendance")

  const monthlyData = useMemo(() => {
    if (!profileData) return null

    const monthStart = startOfMonth(selectedMonth)
    const monthEnd = endOfMonth(selectedMonth)

    const monthlyRecords = (profileData.attendanceRecords ?? []).filter((record) =>
      isWithinInterval(new Date(record.date), { start: monthStart, end: monthEnd }),
    )

    const filteredRecords =
      selectedGroup === "all" ? monthlyRecords : monthlyRecords.filter((record) => record.groupId === selectedGroup)

    const totalSessions = filteredRecords.length
    const presentSessions = filteredRecords.filter((r) => r.status === "present").length
    const absentSessions = filteredRecords.filter((r) => r.status === "absent").length
    const canceledSessions = filteredRecords.filter((r) => r.status === "canceled").length
    const attendanceRate = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0

    const studentStats = (profileData.students ?? [])
      .map((student) => {
        const studentRecords = filteredRecords.filter((r) => r.studentId === student.id)
        const present = studentRecords.filter((r) => r.status === "present").length
        const absent = studentRecords.filter((r) => r.status === "absent").length
        const canceled = studentRecords.filter((r) => r.status === "canceled").length
        const total = studentRecords.length
        const rate = total > 0 ? Math.round((present / total) * 100) : 0

        return {
          ...student,
          sessionsAttended: present,
          sessionsAbsent: absent,
          sessionsCanceled: canceled,
          totalSessions: total,
          attendanceRate: rate,
        }
      })
      .filter((student) => student.totalSessions > 0)

    const groupStats = (profileData.groups ?? [])
      .map((group) => {
        const groupRecords = filteredRecords.filter((r) => r.groupId === group.id)
        const present = groupRecords.filter((r) => r.status === "present").length
        const total = groupRecords.length
        const rate = total > 0 ? Math.round((present / total) * 100) : 0

        return {
          ...group,
          totalSessions: total,
          attendanceRate: rate,
          studentsCount: group.studentIds.length,
        }
      })
      .filter((group) => group.totalSessions > 0)

    return {
      totalSessions,
      presentSessions,
      absentSessions,
      canceledSessions,
      attendanceRate,
      studentStats,
      groupStats,
      records: filteredRecords,
    }
  }, [profileData, selectedMonth, selectedGroup])

  const exportReport = () => {
    if (!monthlyData || !profileData) {
      toast("❌ No data to export", "error")
      return
    }

    const csvData = []

    if (reportType === "attendance") {
      csvData.push(["Date", "Student", "Group", "Status", "Notes"])
      monthlyData.records.forEach((record) => {
        const student = (profileData.students ?? []).find((s) => s.id === record.studentId)
        const group = (profileData.groups ?? []).find((g) => g.id === record.groupId)
        csvData.push([
          record.date,
          student?.name || "Unknown",
          group?.name || "Unknown",
          record.status,
          record.notes || "",
        ])
      })
    } else if (reportType === "student") {
      csvData.push([
        "Student",
        "Sessions Attended",
        "Sessions Absent",
        "Sessions Canceled",
        "Total Sessions",
        "Attendance Rate",
        "Remaining Sessions",
        "Makeup Sessions",
      ])
      monthlyData.studentStats.forEach((student) => {
        csvData.push([
          student.name,
          student.sessionsAttended,
          student.sessionsAbsent,
          student.sessionsCanceled,
          student.totalSessions,
          `${student.attendanceRate}%`,
          student.remainingSessions,
          student.makeupSessions,
        ])
      })
    }

    const csvContent = csvData
      .map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `${reportType}_report_${format(selectedMonth, "yyyy-MM")}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast("✅ Report exported successfully", "success")
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
            <BarChart3 className="h-5 w-5" />
            Enhanced Reports
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-secondary-white text-sm">Month</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("glass-input w-full justify-start text-left font-normal text-primary-white")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedMonth, "MMMM yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="glass-modal-content w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedMonth}
                    onSelect={(date) => date && setSelectedMonth(date)}
                    initialFocus
                    className="text-primary-white"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="text-secondary-white text-sm">Group</label>
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger className="glass-input text-primary-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-modal-content">
                  <SelectItem value="all" className="text-primary-white">
                    All Groups
                  </SelectItem>
                  {(profileData.groups ?? []).map((group) => (
                    <SelectItem key={group.id} value={group.id} className="text-primary-white">
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-secondary-white text-sm">Report Type</label>
              <Select
                value={reportType}
                onValueChange={(value: "attendance" | "financial" | "student") => setReportType(value)}
              >
                <SelectTrigger className="glass-input text-primary-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-modal-content">
                  <SelectItem value="attendance" className="text-primary-white">
                    Attendance
                  </SelectItem>
                  <SelectItem value="student" className="text-primary-white">
                    Student Summary
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={exportReport} className="glass-button text-primary-white">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </CardContent>
      </Card>

      {monthlyData && (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-secondary-white text-sm">Total Sessions</p>
                    <p className="text-2xl font-bold text-primary-white">{monthlyData.totalSessions}</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-secondary-white text-sm">Attendance Rate</p>
                    <p className="text-2xl font-bold text-primary-white">{monthlyData.attendanceRate}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-secondary-white text-sm">Present</p>
                    <p className="text-2xl font-bold text-green-400">{monthlyData.presentSessions}</p>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <div className="h-4 w-4 rounded-full bg-green-400"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-secondary-white text-sm">Absent</p>
                    <p className="text-2xl font-bold text-red-400">{monthlyData.absentSessions}</p>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-red-500/20 flex items-center justify-center">
                    <div className="h-4 w-4 rounded-full bg-red-400"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Student Performance */}
          {monthlyData.studentStats.length > 0 && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-primary-white flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Student Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {monthlyData.studentStats.map((student) => (
                    <div key={student.id} className="glass-card p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-primary-white">{student.name}</h3>
                        <Badge
                          className={
                            student.attendanceRate >= 80
                              ? "bg-green-500/20 text-green-300 border-green-400/30"
                              : student.attendanceRate >= 60
                                ? "bg-yellow-500/20 text-yellow-300 border-yellow-400/30"
                                : "bg-red-500/20 text-red-300 border-red-400/30"
                          }
                        >
                          {student.attendanceRate}% attendance
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-secondary-white">Present</p>
                          <p className="font-semibold text-green-400">{student.sessionsAttended}</p>
                        </div>
                        <div>
                          <p className="text-secondary-white">Absent</p>
                          <p className="font-semibold text-red-400">{student.sessionsAbsent}</p>
                        </div>
                        <div>
                          <p className="text-secondary-white">Remaining</p>
                          <p className="font-semibold text-blue-400">{student.remainingSessions}</p>
                        </div>
                        <div>
                          <p className="text-secondary-white">Make-ups</p>
                          <p className="font-semibold text-yellow-400">{student.makeupSessions}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
