"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, User, Users, Edit, Trash2 } from "lucide-react"
import { StudentDialog } from "./student-dialog"
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

interface StudentSearchTabProps {
  profileData: CoachProfile | null
  updateProfile: (profile: CoachProfile) => void
  isActive: boolean
}

export function StudentSearchTab({ profileData, updateProfile, isActive }: StudentSearchTabProps) {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("name")
  const [filterBy, setFilterBy] = useState("all_students")

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
            <Search className="h-5 w-5" />
            Student Search & Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>

      {/* Students List */}
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
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-primary-white text-lg">{student.name}</h3>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <Badge
                              className={
                                student.remainingSessions > 0
                                  ? "bg-green-500/20 text-green-300 border-green-400/30"
                                  : "bg-red-500/20 text-red-300 border-red-400/30"
                              }
                            >
                              {student.remainingSessions} sessions left
                            </Badge>
                            {student.makeupSessions > 0 && (
                              <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-400/30">
                                {student.makeupSessions} make-ups
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

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
                              <Badge key={group.id} className="bg-blue-500/20 text-blue-300 border-blue-400/30">
                                {group.name}
                                {group.dayOfWeek && group.time && (
                                  <span className="ml-1 opacity-75">
                                    • {group.dayOfWeek} {group.time}
                                  </span>
                                )}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <StudentDialog profileData={profileData} onUpdateProfile={updateProfile} student={student}>
                        <Button size="sm" className="glass-button text-primary-white">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </StudentDialog>
                      <Button
                        size="sm"
                        onClick={() => deleteStudent(student.id)}
                        className="glass-button bg-white/8 hover:bg-red-500/15 border-white/15 hover:border-red-400/25 text-red-300 hover:text-red-200 transition-all duration-300"
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
    </div>
  )
}
