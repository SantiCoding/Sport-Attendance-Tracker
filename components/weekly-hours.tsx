"use client"

import React, { memo, useMemo, useCallback, useState, useEffect } from "react"
import { Clock, Calendar, Download, ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { useToast } from "@/toast"

interface WeeklyData {
  weekStart: string
  weekEnd: string
  totalHours: number
  totalSessions: number
  sessions: Array<{
    id: string
    date: string
    time: string
    groupName: string
    students: Array<{
      name: string
      status: string
      isMakeup?: boolean
      originalGroup?: string
    }>
    duration: number
  }>
  makeups: Array<{
    id: string
    absentStudent: string
    makeupStudent: string
    groupName: string
    absenceDate: string
    makeupDate: string
  }>
}

interface WeeklyHoursProps {
  profileData: any
  updateProfile: (profile: any) => void
}

const WeeklyHours = memo(function WeeklyHours({ profileData, updateProfile }: WeeklyHoursProps) {
  const { toast } = useToast()
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set())
  const [selectedWeek, setSelectedWeek] = useState<WeeklyData | null>(null)
  const [showModal, setShowModal] = useState(false)

  // Check if it's a new week and reset if needed
  useEffect(() => {
    const checkAndResetWeeklyData = () => {
      const now = new Date()
      const lastReset = localStorage.getItem('weeklyHoursLastReset')
      
      if (lastReset) {
        const lastResetDate = new Date(lastReset)
        const daysSinceReset = Math.floor((now.getTime() - lastResetDate.getTime()) / (1000 * 60 * 60 * 24))
        
        // If it's been more than 7 days or it's Monday and past midnight
        if (daysSinceReset >= 7 || (now.getDay() === 1 && now.getHours() >= 0)) {
          localStorage.setItem('weeklyHoursLastReset', now.toISOString())
          // Weekly data will be recalculated automatically
        }
      } else {
        // First time setup
        localStorage.setItem('weeklyHoursLastReset', now.toISOString())
      }
    }

    checkAndResetWeeklyData()
  }, [])

  // Get current week's data
  const currentWeekData = useMemo(() => {
    if (!profileData) return null

    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay()) // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0)

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    const weekSessions = (profileData.attendanceRecords ?? []).filter((record: any) => {
      const recordDate = new Date(record.date)
      return recordDate >= weekStart && recordDate <= weekEnd
    })

    // Group sessions by date and time
    const sessionGroups = weekSessions.reduce((groups: any, record: any) => {
      const key = `${record.date}_${record.groupId}`
      if (!groups[key]) {
        const group = profileData.groups.find((g: any) => g.id === record.groupId)
        
        // Calculate actual session duration including time adjustments
        let baseDuration = 1.5 // Default base duration
        let timeAdjustment = 0
        
        // Check if this record has time adjustment data
        if (record.timeAdjustmentAmount && record.timeAdjustmentType) {
          const adjustmentAmount = parseFloat(record.timeAdjustmentAmount) || 0
          timeAdjustment = record.timeAdjustmentType === "more" ? adjustmentAmount : -adjustmentAmount
        }
        
        const actualDuration = baseDuration + (timeAdjustment / 60) // Convert minutes to hours
        
        groups[key] = {
          id: key,
          date: record.date,
          groupName: group?.name || "Unknown Group",
          students: [],
          duration: actualDuration,
          timeAdjustment: timeAdjustment,
          timeAdjustmentReason: record.timeAdjustmentReason
        }
      }
      
      const student = profileData.students.find((s: any) => s.id === record.studentId)
      const currentGroup = profileData.groups.find((g: any) => g.id === record.groupId)
      const recordGroup = profileData.groups.find((g: any) => g.id === record.groupId)
      
      const isMakeup = record.status === "present" && 
        recordGroup && 
        currentGroup && 
        recordGroup.id !== currentGroup.id

      groups[key].students.push({
        name: student?.name || "Unknown",
        status: record.status,
        isMakeup,
        originalGroup: isMakeup ? recordGroup?.name : undefined
      })
      
      return groups
    }, {})

    const sessions = Object.values(sessionGroups)
    const totalHours = sessions.reduce((sum: number, session: any) => sum + session.duration, 0)
    const totalSessions = sessions.length

    return {
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      totalHours,
      totalSessions,
      sessions,
      makeups: [] // TODO: Implement makeup tracking
    }
  }, [profileData])

  // Get all historical weeks
  const historicalWeeks = useMemo(() => {
    if (!profileData) return []

    const allRecords = profileData.attendanceRecords ?? []
    const weekGroups: { [key: string]: WeeklyData } = {}

    allRecords.forEach((record: any) => {
      const recordDate = new Date(record.date)
      const weekStart = new Date(recordDate)
      weekStart.setDate(recordDate.getDate() - recordDate.getDay())
      weekStart.setHours(0, 0, 0, 0)
      
      const weekKey = weekStart.toISOString().split('T')[0]
      
      if (!weekGroups[weekKey]) {
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        weekEnd.setHours(23, 59, 59, 999)
        
        weekGroups[weekKey] = {
          weekStart: weekKey,
          weekEnd: weekEnd.toISOString().split('T')[0],
          totalHours: 0,
          totalSessions: 0,
          sessions: [],
          makeups: []
        }
      }
    })

    return Object.values(weekGroups)
      .filter(week => week.weekStart !== currentWeekData?.weekStart)
      .sort((a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime())
  }, [profileData, currentWeekData])

  const formatHours = useCallback((hours: number) => {
    const wholeHours = Math.floor(hours)
    const minutes = Math.round((hours - wholeHours) * 60)
    return minutes > 0 ? `${wholeHours}h ${minutes}m` : `${wholeHours}h`
  }, [])

  const formatWeekRange = useCallback((weekStart: string, weekEnd: string) => {
    const start = new Date(weekStart)
    const end = new Date(weekEnd)
    const startMonth = start.toLocaleDateString('en-US', { month: 'short' })
    const endMonth = end.toLocaleDateString('en-US', { month: 'short' })
    
    if (startMonth === endMonth) {
      return `${startMonth} ${start.getDate()}–${end.getDate()}`
    } else {
      return `${startMonth} ${start.getDate()} – ${endMonth} ${end.getDate()}`
    }
  }, [])

  const toggleWeekExpansion = useCallback((weekKey: string) => {
    setExpandedWeeks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(weekKey)) {
        newSet.delete(weekKey)
      } else {
        newSet.add(weekKey)
      }
      return newSet
    })
  }, [])

  const openWeekModal = useCallback((week: WeeklyData) => {
    setSelectedWeek(week)
    setShowModal(true)
  }, [])

  const exportWeekCSV = useCallback((week: WeeklyData) => {
    try {
      const csvData = [
        ["Student", "Group", "Date", "Status", "Duration", "Time Adjustment", "Reason"],
        ...week.sessions.flatMap(session => 
          session.students.map(student => [
            student.name,
            session.groupName,
            session.date,
            student.isMakeup ? "Makeup" : student.status,
            formatHours(session.duration),
            session.timeAdjustment !== 0 ? `${session.timeAdjustment > 0 ? '+' : ''}${session.timeAdjustment}min` : "",
            session.timeAdjustmentReason || ""
          ])
        ),
        ["", "", "", "", "", "", ""],
        ["Total Hours", "", "", "", formatHours(week.totalHours), "", ""],
        ["Total Sessions", "", "", "", week.totalSessions.toString(), "", ""]
      ]

      const csvContent = csvData
        .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(","))
        .join("\n")

      const dataBlob = new Blob([csvContent], { 
        type: "text/csv;charset=utf-8" 
      })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `week_${week.weekStart}_to_${week.weekEnd}_sessions.csv`
      link.style.display = "none"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast(`📊 Exported week data for ${formatWeekRange(week.weekStart, week.weekEnd)}`, "success")
    } catch (error) {
      console.error('Export failed:', error)
      toast(`❌ Failed to export week data`, "error")
    }
  }, [formatWeekRange, toast])

  if (!profileData) return null

  return (
    <div className="weekly-hours space-y-4">
      {/* Current Week Header */}
      {currentWeekData && (
        <div className="weekly-hours-header flex items-center gap-2 text-sm text-secondary-white">
          <Clock className="h-4 w-4" />
          <span>
            {formatHours(currentWeekData.totalHours)} this week
          </span>
        </div>
      )}

      {/* Historical Weeks */}
      {historicalWeeks.length > 0 && (
        <div className="weekly-hours-history space-y-2">
          {historicalWeeks.map((week) => {
            const weekKey = week.weekStart
            const isExpanded = expandedWeeks.has(weekKey)
            
            return (
              <Card key={weekKey} className="weekly-hours-card glass-card">
                <CardHeader 
                  className="cursor-pointer"
                  onClick={() => toggleWeekExpansion(weekKey)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-secondary-white" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-secondary-white" />
                      )}
                      <Calendar className="h-4 w-4 text-secondary-white" />
                      <CardTitle className="text-primary-white text-sm">
                        Week of {formatWeekRange(week.weekStart, week.weekEnd)}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30">
                        {formatHours(week.totalHours)} total
                      </Badge>
                      <Badge className="bg-green-500/20 text-green-300 border-green-400/30">
                        {week.totalSessions} sessions
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                {isExpanded && (
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-secondary-white text-sm">
                          {week.sessions.length} sessions recorded
                        </span>
                        <Button
                          onClick={() => openWeekModal(week)}
                          size="sm"
                          className="glass-button text-primary-white"
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Week Details Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="weekly-hours-modal glass-modal-content w-[95vw] max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-primary-white">
              Week of {selectedWeek && formatWeekRange(selectedWeek.weekStart, selectedWeek.weekEnd)} — Session Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedWeek && (
            <div className="weekly-hours-modal-content space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="glass-card p-3 text-center">
                  <div className="text-2xl font-bold text-primary-white">
                    {formatHours(selectedWeek.totalHours)}
                  </div>
                  <div className="text-sm text-secondary-white">Total Hours</div>
                </div>
                <div className="glass-card p-3 text-center">
                  <div className="text-2xl font-bold text-primary-white">
                    {selectedWeek.totalSessions}
                  </div>
                  <div className="text-sm text-secondary-white">Total Sessions</div>
                </div>
                <div className="glass-card p-3 text-center">
                  <div className="text-2xl font-bold text-primary-white">
                    {selectedWeek.sessions.reduce((sum, session) => 
                      sum + session.students.filter(s => s.status === "absent").length, 0
                    )}
                  </div>
                  <div className="text-sm text-secondary-white">Total Absences</div>
                </div>
              </div>

              <div className="space-y-3">
                {selectedWeek.sessions.map((session) => (
                  <div key={session.id} className="glass-card p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-primary-white font-medium">
                          {session.groupName}
                        </h4>
                        <p className="text-sm text-secondary-white">
                          {new Date(session.date).toLocaleDateString()} • {formatHours(session.duration)}
                          {session.timeAdjustment !== 0 && (
                            <span className="text-blue-400 ml-2">
                              ({session.timeAdjustment > 0 ? '+' : ''}{session.timeAdjustment}min)
                            </span>
                          )}
                        </p>
                        {session.timeAdjustmentReason && (
                          <p className="text-xs text-blue-300 mt-1">
                            {session.timeAdjustmentReason}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {session.students.map((student, index) => (
                        <div
                          key={index}
                          className={cn(
                            "flex justify-between items-center p-2 rounded",
                            student.isMakeup 
                              ? "bg-purple-500/10 border border-purple-400/30"
                              : "bg-white/5"
                          )}
                        >
                          <div className="flex flex-col">
                            <span className="text-primary-white">{student.name}</span>
                            {student.isMakeup && (
                              <span className="text-xs text-purple-300">
                                Makeup from {student.originalGroup}
                              </span>
                            )}
                          </div>
                          <Badge
                            className={
                              student.status === "present"
                                ? student.isMakeup
                                  ? "bg-purple-500/20 text-purple-300 border-purple-400/30"
                                  : "bg-green-500/20 text-green-300 border-green-400/30"
                                : student.status === "absent"
                                  ? "bg-red-500/20 text-red-300 border-red-400/30"
                                  : "bg-gray-500/20 text-gray-300 border-gray-400/30"
                            }
                          >
                            {student.isMakeup ? "Makeup" : student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              onClick={() => selectedWeek && exportWeekCSV(selectedWeek)}
              className="glass-button text-primary-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
})

export { WeeklyHours }
