"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Clock, User, CheckCircle, AlertCircle, Plus } from "lucide-react"
import { format } from "date-fns"
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

interface MakeupSession {
  id: string
  studentId: string
  originalDate: string
  originalGroupId: string
  reason: string
  notes: string
  createdDate: string
  status: "pending" | "scheduled" | "completed"
  scheduledDate?: string
  scheduledTime?: string
  scheduledGroupId?: string
  completedDate?: string
  completedNotes?: string
}

interface CoachProfile {
  id: string
  name: string
  students: Student[]
  groups: Group[]
  attendanceRecords: any[]
  archivedTerms: any[]
  completedMakeupSessions: any[]
  makeupSessions?: MakeupSession[]
}

interface EnhancedMakeUpTabProps {
  profileData: CoachProfile | null
  updateProfile: (profile: CoachProfile) => void
  isActive: boolean
}

export function EnhancedMakeUpTab({ profileData, updateProfile, isActive }: EnhancedMakeUpTabProps) {
  const { toast } = useToast()
  const [selectedStudent, setSelectedStudent] = useState<string>("all_students")
  const [schedulingSession, setSchedulingSession] = useState<MakeupSession | null>(null)
  const [completingSession, setCompletingSession] = useState<MakeupSession | null>(null)
  const [scheduleDate, setScheduleDate] = useState<Date>(new Date())
  const [scheduleTime, setScheduleTime] = useState<string>("")
  const [scheduleGroup, setScheduleGroup] = useState<string>("no_group")
  const [completionNotes, setCompletionNotes] = useState<string>("")

  if (!profileData) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6 text-center">
          <p className="text-secondary-white">Please create a coach profile first.</p>
        </CardContent>
      </Card>
    )
  }

  const makeupSessions = profileData.makeupSessions ?? []
  const filteredSessions =
    selectedStudent === "all_students"
      ? makeupSessions
      : makeupSessions.filter((session) => session.studentId === selectedStudent)

  const pendingSessions = filteredSessions.filter((session) => session.status === "pending")
  const scheduledSessions = filteredSessions.filter((session) => session.status === "scheduled")
  const completedSessions = filteredSessions.filter((session) => session.status === "completed")

  const scheduleSession = () => {
    if (!schedulingSession || !scheduleTime.trim()) {
      toast("❌ Please fill in all required fields", "error")
      return
    }

    const updatedSessions = makeupSessions.map((session) =>
      session.id === schedulingSession.id
        ? {
            ...session,
            status: "scheduled" as const,
            scheduledDate: format(scheduleDate, "yyyy-MM-dd"),
            scheduledTime: scheduleTime,
            scheduledGroupId: scheduleGroup === "no_group" ? undefined : scheduleGroup,
          }
        : session,
    )

    updateProfile({
      ...profileData,
      makeupSessions: updatedSessions,
    })

    setSchedulingSession(null)
    setScheduleTime("")
    setScheduleGroup("no_group")
    toast("✅ Make-up session scheduled successfully", "success")
  }

  const deletePendingSession = (sessionId: string) => {
    const target = (profileData.makeupSessions ?? []).find((s) => s.id === sessionId)
    if (!target) return

    const updatedSessions = (profileData.makeupSessions ?? []).filter((s) => s.id !== sessionId)

    // Decrease student's makeup count
    const updatedStudents = (profileData.students ?? []).map((s) =>
      s.id === target.studentId ? { ...s, makeupSessions: Math.max(0, s.makeupSessions - 1) } : s,
    )

    updateProfile({
      ...profileData,
      students: updatedStudents,
      makeupSessions: updatedSessions,
    })

    toast("🗑️ Pending make-up deleted", "success")
  }

  const completePendingSessionQuick = (sessionId: string) => {
    const target = (profileData.makeupSessions ?? []).find((s) => s.id === sessionId)
    if (!target) return

    const updatedSessions = (profileData.makeupSessions ?? []).map((s) =>
      s.id === sessionId
        ? { ...s, status: "completed" as const, completedDate: new Date().toISOString() }
        : s,
    )

    const updatedStudents = (profileData.students ?? []).map((s) =>
      s.id === target.studentId ? { ...s, makeupSessions: Math.max(0, s.makeupSessions - 1) } : s,
    )

    updateProfile({
      ...profileData,
      students: updatedStudents,
      makeupSessions: updatedSessions,
    })

    toast("✅ Make-up marked complete", "success")
  }

  const completeSession = () => {
    if (!completingSession) return

    const student = (profileData.students ?? []).find((s) => s.id === completingSession.studentId)
    if (!student) return

    // Update the makeup session to completed
    const updatedSessions = makeupSessions.map((session) =>
      session.id === completingSession.id
        ? {
            ...session,
            status: "completed" as const,
            completedDate: new Date().toISOString(),
            completedNotes: completionNotes,
          }
        : session,
    )

    // Decrease student's makeup sessions count
    const updatedStudents = (profileData.students ?? []).map((s) =>
      s.id === completingSession.studentId ? { ...s, makeupSessions: Math.max(0, s.makeupSessions - 1) } : s,
    )

    updateProfile({
      ...profileData,
      students: updatedStudents,
      makeupSessions: updatedSessions,
    })

    setCompletingSession(null)
    setCompletionNotes("")
    toast("✅ Make-up session completed successfully", "success")
  }

  const addManualMakeup = (studentId: string) => {
    const newMakeupSession: MakeupSession = {
      id: `makeup_${Date.now()}_${studentId}`,
      studentId,
      originalDate: format(new Date(), "yyyy-MM-dd"),
      originalGroupId: "",
      reason: "Manual addition",
      notes: "",
      createdDate: new Date().toISOString(),
      status: "pending",
    }

    const updatedStudents = (profileData.students ?? []).map((s) =>
      s.id === studentId ? { ...s, makeupSessions: s.makeupSessions + 1 } : s,
    )

    updateProfile({
      ...profileData,
      students: updatedStudents,
      makeupSessions: [...makeupSessions, newMakeupSession],
    })

    toast("✅ Make-up session added successfully", "success")
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-primary-white flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Make-up Sessions Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label className="text-secondary-white">Filter by Student</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger className="glass-input text-primary-white">
                  <SelectValue placeholder="All students" />
                </SelectTrigger>
                <SelectContent className="glass-dropdown">
                  <SelectItem value="all_students" className="text-primary-white">
                    All Students
                  </SelectItem>
                  {(profileData.students ?? []).map((student) => (
                    <SelectItem key={student.id} value={student.id} className="text-primary-white">
                      {student.name} ({student.makeupSessions} make-ups)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Add Make-up */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-primary-white">Quick Add Make-up Session</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(profileData.students ?? []).map((student) => (
              <div key={student.id} className="glass-card p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-primary-white">{student.name}</p>
                    <p className="text-sm text-secondary-white">{student.makeupSessions} make-ups</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => addManualMakeup(student.id)}
                    className="glass-button text-primary-white"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Sessions */}
      {pendingSessions.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-primary-white flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
              Pending Make-ups ({pendingSessions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingSessions.map((session) => {
                const student = (profileData.students ?? []).find((s) => s.id === session.studentId)
                const originalGroup = (profileData.groups ?? []).find((g) => g.id === session.originalGroupId)

                return (
                  <div key={session.id} className="glass-card p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4 text-blue-400" />
                          <h3 className="font-semibold text-primary-white">{student?.name}</h3>
                          <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-400/30">Pending</Badge>
                        </div>
                        <div className="text-sm text-secondary-white space-y-1">
                          <p>
                            Original: {originalGroup?.name || "Unknown Group"} on {session.originalDate}
                          </p>
                          <p>Reason: {session.reason}</p>
                          {session.notes && <p>Notes: {session.notes}</p>}
                          <p>Created: {format(new Date(session.createdDate), "PPP")}</p>
                        </div>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            onClick={() => setSchedulingSession(session)}
                            className="glass-button text-primary-white"
                          >
                            Schedule
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="glass-dropdown text-primary-white max-w-md mx-auto">
                          <DialogHeader>
                            <DialogTitle className="text-primary-white">Schedule Make-up Session</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label className="text-secondary-white">Date</Label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "glass-input w-full justify-start text-left font-normal text-primary-white",
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {format(scheduleDate, "PPP")}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="glass-dropdown w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={scheduleDate}
                                    onSelect={(date) => date && setScheduleDate(date)}
                                    initialFocus
                                    className="text-primary-white"
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                            <div>
                              <Label className="text-secondary-white">Time</Label>
                              <Input
                                value={scheduleTime}
                                onChange={(e) => setScheduleTime(e.target.value)}
                                placeholder="e.g., 10:00 AM"
                                className="glass-input text-primary-white placeholder:text-tertiary-white"
                              />
                            </div>
                            <div>
                              <Label className="text-secondary-white">Group (Optional)</Label>
                              <Select value={scheduleGroup} onValueChange={setScheduleGroup}>
                                <SelectTrigger className="glass-input text-primary-white">
                                  <SelectValue placeholder="Select group or leave empty for private" />
                                </SelectTrigger>
                                <SelectContent className="glass-dropdown">
                                  <SelectItem value="no_group" className="text-primary-white">
                                    Private Session (No Group)
                                  </SelectItem>
                                  {(profileData.groups ?? []).map((group) => (
                                    <SelectItem key={group.id} value={group.id} className="text-primary-white">
                                      {group.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={() => setSchedulingSession(null)} variant="outline" className="flex-1">
                                Cancel
                              </Button>
                              <Button onClick={scheduleSession} className="glass-button flex-1 text-primary-white">
                                Schedule
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <div className="flex gap-2 ml-2">
                        <Button
                          size="sm"
                          className="glass-button text-primary-white bg-green-500/20 hover:bg-green-500/30"
                          onClick={() => completePendingSessionQuick(session.id)}
                        >
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          className="glass-delete-button"
                          onClick={() => deletePendingSession(session.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scheduled Sessions */}
      {scheduledSessions.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-primary-white flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-blue-400" />
              Scheduled Make-ups ({scheduledSessions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {scheduledSessions.map((session) => {
                const student = (profileData.students ?? []).find((s) => s.id === session.studentId)
                const scheduledGroup = session.scheduledGroupId
                  ? (profileData.groups ?? []).find((g) => g.id === session.scheduledGroupId)
                  : null

                return (
                  <div key={session.id} className="glass-card p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4 text-blue-400" />
                          <h3 className="font-semibold text-primary-white">{student?.name}</h3>
                          <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30">Scheduled</Badge>
                        </div>
                        <div className="text-sm text-secondary-white space-y-1">
                          <p>
                            Scheduled: {session.scheduledDate} at {session.scheduledTime}
                          </p>
                          {scheduledGroup ? <p>Group: {scheduledGroup.name}</p> : <p>Private Session</p>}
                          <p>Original reason: {session.reason}</p>
                        </div>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            onClick={() => setCompletingSession(session)}
                            className="glass-button text-primary-white bg-green-500/20 hover:bg-green-500/30"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Complete
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="glass-dropdown text-primary-white max-w-md mx-auto">
                          <DialogHeader>
                            <DialogTitle className="text-primary-white">Complete Make-up Session</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="bg-white/5 rounded-lg p-3">
                              <p className="text-primary-white font-medium">{student?.name}</p>
                              <p className="text-secondary-white text-sm">
                                {session.scheduledDate} at {session.scheduledTime}
                              </p>
                            </div>
                            <div>
                              <Label className="text-secondary-white">Completion Notes (Optional)</Label>
                              <Textarea
                                value={completionNotes}
                                onChange={(e) => setCompletionNotes(e.target.value)}
                                placeholder="Add notes about the completed session..."
                                className="glass-input text-primary-white placeholder:text-tertiary-white"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={() => setCompletingSession(null)} variant="outline" className="flex-1">
                                Cancel
                              </Button>
                              <Button onClick={completeSession} className="glass-button flex-1 text-primary-white">
                                Mark Complete
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Sessions */}
      {completedSessions.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-primary-white flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              Completed Make-ups ({completedSessions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {completedSessions.map((session) => {
                const student = (profileData.students ?? []).find((s) => s.id === session.studentId)

                return (
                  <div key={session.id} className="glass-card p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-4 w-4 text-green-400" />
                          <h4 className="font-medium text-primary-white">{student?.name}</h4>
                          <Badge className="bg-green-500/20 text-green-300 border-green-400/30">Completed</Badge>
                        </div>
                        <div className="text-xs text-secondary-white">
                          <p>
                            Completed:{" "}
                            {session.completedDate ? format(new Date(session.completedDate), "PPP") : "Unknown"}
                          </p>
                          {session.completedNotes && <p>Notes: {session.completedNotes}</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {filteredSessions.length === 0 && (
        <Card className="glass-card">
          <CardContent className="p-6 text-center">
            <p className="text-secondary-white">
              {selectedStudent !== "all_students"
                ? "No make-up sessions for this student"
                : "No make-up sessions found"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
