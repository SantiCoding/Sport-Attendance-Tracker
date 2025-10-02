"use client"

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar-rac"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { EnhancedSwitch } from "@/components/ui/enhanced-switch"
import {
  Download,
  CalendarDays,
  Users,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Edit,
  Trash2,
  Search,
  Brain,
  Save,
  TrendingUp,
  User,
  Archive,
  Upload,
  Database,
  Trophy,
  Zap,
  Settings,
  X,
  AlertTriangle,
} from "lucide-react"
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns"
import { cn } from "@/lib/utils"
import { useToast } from "@/toast"
import { useAuth } from "@/use-auth"
import { DataManagementWithSuspense } from "@/components/lazy-components"
import { PerformanceMonitor } from "@/components/performance-monitor"
import { motion } from "framer-motion"
// Local storage functions - simplified for guest mode only
const loadLocalStore = (): CoachProfile[] => {
  try {
    if (typeof window === 'undefined') return []
    const stored = localStorage.getItem('tennis-tracker-profiles')
    if (!stored) return []
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error('Error loading from local storage:', error)
    return []
  }
}

const saveLocal = (profiles: CoachProfile[]) => {
  try {
    if (typeof window === 'undefined') return
    localStorage.setItem('tennis-tracker-profiles', JSON.stringify(profiles))
  } catch (error) {
    console.error('Error saving to local storage:', error)
  }
}

const deleteLocal = () => {
  try {
    if (typeof window === 'undefined') return
    localStorage.removeItem('tennis-tracker-profiles')
  } catch (error) {
    console.error('Error clearing local storage:', error)
  }
}

const generateClientId = () => {
  return 'client_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now()
}

import { MenuBar } from "@/components/menu-bar"
import { StudentDialog } from "@/components/student-dialog"
import { GroupDialog } from "@/components/group-dialog"
import { TermFinalizationDialogWrapper } from "../components/term-finalization-dialog-wrapper"

// Types
interface Student {
  id: string
  name: string
  notes: string
  prepaidSessions: number
  remainingSessions: number
  makeupSessions: number
  sessionHistory?: {
    date: string
    type: "attended" | "missed" | "makeup" | "cancelled"
    groupId?: string
    notes?: string
  }[]
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
  originalTime?: string
}

interface CoachProfile {
  id: string
  name: string
  students: Student[]
  groups: Group[]
  attendanceRecords: AttendanceRecord[]
  archivedTerms: any[]
  completedMakeupSessions: any[]
  makeupSessions?: MakeupSession[]
}

// Helper function to merge profiles - keeps local data and merges with cloud data
const mergeProfiles = (localProfiles: CoachProfile[], cloudProfiles: CoachProfile[]): CoachProfile[] => {
  const mergedProfiles: CoachProfile[] = []
  const localById = new Map<string, CoachProfile>()
  const cloudById = new Map<string, CoachProfile>()
  
  // Index local profiles by ID
  localProfiles.forEach(profile => {
    localById.set(profile.id, profile)
  })
  
  // Index cloud profiles by ID
  cloudProfiles.forEach(profile => {
    cloudById.set(profile.id, profile)
  })
  
  // Process all profiles (local + cloud)
  const allIds = new Set([...localById.keys(), ...cloudById.keys()])
  
  allIds.forEach(id => {
    const localProfile = localById.get(id)
    const cloudProfile = cloudById.get(id)
    
    if (localProfile && cloudProfile) {
      // Both exist - merge them (prefer local for conflicts)
      const mergedProfile: CoachProfile = {
        ...cloudProfile,
        students: [...localProfile.students, ...cloudProfile.students.filter(cs => 
          !localProfile.students.some(ls => ls.id === cs.id)
        )],
        groups: [...localProfile.groups, ...cloudProfile.groups.filter(cg => 
          !localProfile.groups.some(lg => lg.id === cg.id)
        )],
        attendanceRecords: [...localProfile.attendanceRecords, ...cloudProfile.attendanceRecords.filter(ca => 
          !localProfile.attendanceRecords.some(la => la.id === ca.id)
        )],
        archivedTerms: [...localProfile.archivedTerms, ...cloudProfile.archivedTerms.filter(cat => 
          !localProfile.archivedTerms.some(lat => lat.id === cat.id)
        )],
        completedMakeupSessions: [...localProfile.completedMakeupSessions, ...cloudProfile.completedMakeupSessions.filter(cms => 
          !localProfile.completedMakeupSessions.some(lms => lms.id === cms.id)
        )],
        makeupSessions: [...(localProfile.makeupSessions || []), ...(cloudProfile.makeupSessions || []).filter(cms => 
          !(localProfile.makeupSessions || []).some(lms => lms.id === cms.id)
        )],
      }
      mergedProfiles.push(mergedProfile)
    } else if (localProfile) {
      // Only local exists - keep it
      mergedProfiles.push(localProfile)
    } else if (cloudProfile) {
      // Only cloud exists - add it
      mergedProfiles.push(cloudProfile)
    }
  })
  
  return mergedProfiles
}

export default function TennisTracker() {
  // Debug log to verify the latest changes are loaded
  console.log("🎾 Tennis Tracker - VERSION 3.0 - REVERTED TO ORIGINAL");
  console.log("🎾 Build timestamp:", new Date().toISOString());
  const { toast } = useToast()
  const { signInAsGuest } = useAuth() // Only keep signInAsGuest for auto-starting returning users
  // Cloud sync removed - using local storage only
  const hasLoadedData = useRef(false)
  const hasLoadedFromCloudThisSession = useRef(false)
  const [profiles, setProfiles] = useState<CoachProfile[]>([])
  const [currentProfileId, setCurrentProfileId] = useState<string>("")
  const [activeTab, setActiveTab] = useState("students")
  const [hasInteractedWithWelcome, setHasInteractedWithWelcome] = useState(false)
  const [hasExistingData, setHasExistingData] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedGroupId, setSelectedGroupId] = useState<string>("")
  const [selectedTime, setSelectedTime] = useState({ hour: "9", minute: "00", period: "AM" })
  const [timeAdjustmentNeeded, setTimeAdjustmentNeeded] = useState(false)
  const [timeAdjustmentAmount, setTimeAdjustmentAmount] = useState<string>("")
  const [timeAdjustmentType, setTimeAdjustmentType] = useState<"more" | "less">("more")
  const [timeAdjustmentReason, setTimeAdjustmentReason] = useState<string>("")
  const [attendanceNotes, setAttendanceNotes] = useState<string>("")
  const [cancelReason, setCancelReason] = useState<string>("")
  const [newProfileName, setNewProfileName] = useState("")
  const [editProfileName, setEditProfileName] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("name")
  const [filterBy, setFilterBy] = useState("all_students")
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<string>("all")
  const [reportType, setReportType] = useState<"attendance" | "financial" | "student">("attendance")
  const [showCreateProfile, setShowCreateProfile] = useState(false)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showArchivedTerms, setShowArchivedTerms] = useState(false)
  const [expandedStudentId, setExpandedStudentId] = useState<string>("")
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)

  // Smart mode toggles
  const [studentsSmartMode, setStudentsSmartMode] = useState(false)
  const [attendanceSmartMode, setAttendanceSmartMode] = useState(false)

  // Smart Sorter states
  const [smartSorterGroupName, setSmartSorterGroupName] = useState("")
  const [smartSorterStudentList, setSmartSorterStudentList] = useState("")
  const [smartSorterUsualDays, setSmartSorterUsualDays] = useState<string[]>([])
  const [smartSorterUsualTime, setSmartSorterUsualTime] = useState({ hour: "9", minute: "00", period: "AM" })
  const [smartSorterDuration, setSmartSorterDuration] = useState("1h")
  const [smartSorterPreview, setSmartSorterPreview] = useState<{
    students: Student[]
    group: Group
  } | null>(null)

  // Smart Attendance states
  const [smartAttendanceGroupId, setSmartAttendanceGroupId] = useState("")
  const [smartAttendanceTime, setSmartAttendanceTime] = useState({ hour: "9", minute: "00", period: "AM" })
  const [smartAttendanceTimeAdjustment, setSmartAttendanceTimeAdjustment] = useState(false)
  const [smartAttendanceTimeAdjustmentAmount, setSmartAttendanceTimeAdjustmentAmount] = useState<string>("")
  const [smartAttendanceTimeAdjustmentType, setSmartAttendanceTimeAdjustmentType] = useState<"more" | "less">("more")
  const [smartAttendanceTimeAdjustmentReason, setSmartAttendanceTimeAdjustmentReason] = useState<string>("")
  const [smartAttendancePresentStudents, setSmartAttendancePresentStudents] = useState("")

  const [attendanceSelections, setAttendanceSelections] = useState<Record<string, "present" | "absent" | null>>({})
  const [sessionCancelled, setSessionCancelled] = useState(false)

  const [expandedCards, setExpandedCards] = useState<{ [key: string]: boolean }>({})

  const saveDebounceTimer = useRef<NodeJS.Timeout | null>(null)
  const lastSaveTime = useRef<number>(0)

  // Data management functions
  const handleDataImported = (importedProfiles: CoachProfile[]) => {
    setProfiles(importedProfiles)
    saveLocal(importedProfiles)
    if (importedProfiles.length > 0) {
      setCurrentProfileId(importedProfiles[0].id)
    }
  }

  const handleDataCleared = () => {
    setProfiles([])
    setCurrentProfileId("")
    deleteLocal()
  }

  // Initialize dates on client side to prevent hydration issues
  useEffect(() => {
    const today = new Date()
    if (!selectedDate) {
      setSelectedDate(today)
    }
    if (!selectedMonth) {
      setSelectedMonth(today)
    }
  }, [])

  // Load data from local storage on app startup
  useEffect(() => {
    const loadData = () => {
      try {
        const loadedProfiles = loadLocalStore()
        if (loadedProfiles.length > 0) {
          setProfiles(loadedProfiles)
          setCurrentProfileId(loadedProfiles[0].id)
          console.log("✅ Data loaded from local storage:", loadedProfiles.length, "profiles")
        } else {
          console.log("📄 No data found in local storage")
        }
      } catch (error) {
        console.error("❌ Error loading data from local storage:", error)
        setProfiles([])
      }
    }

    loadData()
  }, [])

  const toggleCardExpansion = (cardId: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }))
  }

  const toggleStudentExpansion = (studentId: string) => {
    setExpandedStudentId(expandedStudentId === studentId ? "" : studentId)
  }

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

  const updateStudentSessionCount = (studentId: string, type: "attended" | "missed" | "makeup" | "cancelled") => {
    const updatedStudents = currentProfile.students.map(student => {
      if (student.id === studentId) {
        let newRemainingSessions = student.remainingSessions
        let newMakeupSessions = student.makeupSessions
        
        switch (type) {
          case "attended":
            newRemainingSessions = Math.max(0, student.remainingSessions - 1)
            break
          case "missed":
            newMakeupSessions = student.makeupSessions + 1
            break
          case "makeup":
            newMakeupSessions = Math.max(0, student.makeupSessions - 1)
            break
          case "cancelled":
            // Don't change session counts for cancelled sessions
            break
        }
        
        return {
          ...student,
          remainingSessions: newRemainingSessions,
          makeupSessions: newMakeupSessions,
          sessionHistory: [
            ...(student.sessionHistory || []),
            {
              date: new Date().toISOString().split('T')[0],
              type,
              notes: `Session ${type}`
            }
          ]
        }
      }
      return student
    })
    
    updateProfile({
      ...currentProfile,
      students: updatedStudents
    })
  }



  const currentProfile = profiles.find((p) => p.id === currentProfileId) || {
    id: "",
    name: "",
    students: [],
    groups: [],
    attendanceRecords: [],
    archivedTerms: [],
    completedMakeupSessions: [],
    makeupSessions: [],
  }

  const updateProfile = (updatedProfile: CoachProfile) => {
    const updatedProfiles = profiles.map((p) => (p.id === updatedProfile.id ? updatedProfile : p))
    setProfiles(updatedProfiles)
    
    // ALWAYS save to localStorage FIRST - this is the primary data source
    try {
      localStorage.setItem("tennisTrackerProfiles", JSON.stringify(updatedProfiles))
      localStorage.setItem("tennisTrackerCurrentProfile", updatedProfile.id)
      console.log("✅ Data saved to localStorage IMMEDIATELY")
    } catch (error) {
      console.error("❌ CRITICAL ERROR saving to localStorage:", error)
    }
    
    // Cloud sync removed - using local storage only
  }

  useEffect(() => {
    if (selectedGroupId && currentProfile) {
      const group = currentProfile.groups.find((g) => g.id === selectedGroupId)
      if (group && group.time) {
        // Parse the group's usual time and auto-load it
        const timeMatch = group.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
        if (timeMatch) {
          setSelectedTime({
            hour: timeMatch[1],
            minute: timeMatch[2],
            period: timeMatch[3].toUpperCase() as "AM" | "PM",
          })
        }
      }
    }
  }, [selectedGroupId, currentProfile])

  useEffect(() => {
    if (smartAttendanceGroupId && currentProfile) {
      const group = currentProfile.groups.find((g) => g.id === smartAttendanceGroupId)
      if (group && group.time) {
        // Parse the group's usual time and auto-load it
        const timeMatch = group.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
        if (timeMatch) {
          setSmartAttendanceTime({
            hour: timeMatch[1],
            minute: timeMatch[2],
            period: timeMatch[3].toUpperCase() as "AM" | "PM",
          })
        }
      }
    }
  }, [smartAttendanceGroupId, currentProfile])

  // Load profiles from localStorage FIRST, then sync with cloud if needed
  useEffect(() => {
    // Only load if we haven't loaded data for the current user yet
    if (hasLoadedData.current) return
    
    let isMounted = true
    
    const loadData = async () => {
      // ALWAYS load from localStorage FIRST - this is the primary source
      console.log("📂 Loading data from localStorage FIRST...")
      const savedProfiles = localStorage.getItem("tennisTrackerProfiles")
      const savedCurrentProfile = localStorage.getItem("tennisTrackerCurrentProfile")

      if (savedProfiles) {
        try {
          const parsedProfiles = JSON.parse(savedProfiles).map((profile: any) => ({
            ...profile,
            students: profile.students || [],
            groups: profile.groups || [],
            attendanceRecords: profile.attendanceRecords || [],
            archivedTerms: profile.archivedTerms || [],
            completedMakeupSessions: profile.completedMakeupSessions || [],
            makeupSessions: profile.makeupSessions || [],
          }))
          
          if (isMounted) {
            setProfiles(parsedProfiles as any)
            if (savedCurrentProfile) {
              // Check if the saved current profile still exists
              const profileExists = parsedProfiles.some((p: any) => p.id === savedCurrentProfile)
              if (profileExists) {
                setCurrentProfileId(savedCurrentProfile)
                console.log("✅ Restored last used profile:", savedCurrentProfile)
              } else {
                console.log("⚠️ Saved profile no longer exists, will auto-select first profile")
              }
            }
            console.log("✅ Data loaded from localStorage - UI should show data immediately")
          }
        } catch (error: any) {
          console.error("❌ Error parsing localStorage data:", error)
        }
      }
      
            // Guest mode - use local data only (cloud sync removed)
      /* Cloud sync section disabled - all references commented out
      if (false) {
        // Load from cloud when signed in
        console.log("🔄 Loading data from cloud for user:", user.id, user.email)
        try {
          // const cloudProfiles = await loadFromCloud() // Disabled - cloud sync removed
          if (!isMounted) return
        
        // if (cloudProfiles.length > 0) { // Disabled - cloud sync removed
          // Dedupe profiles from cloud by id then by name (keep the one with most students)
          const seenIds = new Set<string>()
          const dedupedById: CoachProfile[] = []
          for (const p of cloudProfiles as any[]) {
            if (p && p.id && !seenIds.has(p.id)) {
              seenIds.add(p.id)
              dedupedById.push(p)
            }
          }
          const byName = new Map<string, CoachProfile>()
          for (const p of dedupedById) {
            const key = (p.name || "").trim().toLowerCase()
            const current = byName.get(key)
            if (!current || (p.students?.length || 0) > (current.students?.length || 0)) {
              byName.set(key, p)
            }
          }
          const finalCloudProfiles = Array.from(byName.values()) as any[]
          
          // ✅ FIXED: MERGE cloud data with existing local data instead of replacing
          const currentLocalProfiles = profiles.length > 0 ? profiles : []
          const mergedProfiles = mergeProfiles(currentLocalProfiles, finalCloudProfiles)
          
          setProfiles(mergedProfiles as any)
          // Keep current profile ID if it exists, otherwise use first cloud profile
          if (!currentProfileId && cloudProfiles[0]?.id) {
            setCurrentProfileId(cloudProfiles[0].id)
          }
          
          // Update localStorage with merged data as backup
          localStorage.setItem("tennisTrackerProfiles", JSON.stringify(mergedProfiles))
          
          console.log("✅ Data loaded from cloud and merged with local data")
          hasLoadedFromCloudThisSession.current = true
        } else {
          console.log("📄 Cloud returned empty profiles, checking for migration...")
          // First-time sign-in migration: if cloud is empty, import guest/local data ONCE
          try {
            const migrationFlagKey = `tennisTrackerMigratedToUser_${user.id}`
            const alreadyMigrated = localStorage.getItem(migrationFlagKey) === 'true'
            const savedProfilesRaw = localStorage.getItem("tennisTrackerProfiles")
            const savedCurrentProfile = localStorage.getItem("tennisTrackerCurrentProfile")

            if (!alreadyMigrated && savedProfilesRaw) {
              const parsedProfiles: CoachProfile[] = JSON.parse(savedProfilesRaw).map((profile: any) => ({
                ...profile,
                students: profile.students || [],
                groups: profile.groups || [],
                attendanceRecords: profile.attendanceRecords || [],
                archivedTerms: profile.archivedTerms || [],
                completedMakeupSessions: profile.completedMakeupSessions || [],
                makeupSessions: profile.makeupSessions || [],
              }))

              // Dedupe by id then by name (keep larger dataset)
              const seenIds = new Set<string>()
              const dedupedById: CoachProfile[] = []
              for (const p of parsedProfiles) {
                if (p && p.id && !seenIds.has(p.id)) {
                  seenIds.add(p.id)
                  dedupedById.push(p)
                }
              }
              const byName = new Map<string, CoachProfile>()
              for (const p of dedupedById) {
                const key = (p.name || "").trim().toLowerCase()
                const current = byName.get(key)
                if (!current || (p.students?.length || 0) > (current.students?.length || 0)) {
                  byName.set(key, p)
                }
              }
              const finalProfiles = Array.from(byName.values()) as any[]

              if (finalProfiles.length > 0) {
                console.log("🛟 Migrating guest data to cloud for this user", { count: finalProfiles.length })
                setProfiles(finalProfiles as any)
                setCurrentProfileId(savedCurrentProfile || finalProfiles[0].id)
                hasLoadedFromCloudThisSession.current = true
                // Local storage only (cloud sync removed)
                localStorage.setItem(migrationFlagKey, 'true')
                console.log("✅ Guest data migration complete")
              } else {
                console.log("📄 No guest data to migrate. Starting fresh for this user.")
                setProfiles([])
                hasLoadedFromCloudThisSession.current = true
              }
            } else {
              console.log("📄 Cloud empty and no eligible guest data to migrate (or already migrated). Checking localStorage...")
              // Check localStorage as fallback even when cloud is empty
              const savedProfiles = localStorage.getItem("tennisTrackerProfiles")
              const savedCurrentProfile = localStorage.getItem("tennisTrackerCurrentProfile")
              
              if (savedProfiles) {
                try {
                  const parsedProfiles = JSON.parse(savedProfiles).map((profile: any) => ({
                    ...profile,
                    students: profile.students || [],
                    groups: profile.groups || [],
                    attendanceRecords: profile.attendanceRecords || [],
                    archivedTerms: profile.archivedTerms || [],
                    completedMakeupSessions: profile.completedMakeupSessions || [],
                    makeupSessions: profile.makeupSessions || [],
                  }))
                  setProfiles(parsedProfiles as any)
                  if (savedCurrentProfile) {
                    setCurrentProfileId(savedCurrentProfile)
                  }
                  console.log("✅ Loaded data from localStorage fallback")
                } catch (parseError) {
                  console.error("❌ Error parsing localStorage fallback data:", parseError)
                  setProfiles([])
                }
              } else {
                console.log("📄 No data found anywhere. Starting fresh.")
                setProfiles([])
              }
              hasLoadedFromCloudThisSession.current = true
            }
                  } catch (e: any) {
          console.error("❌ Error during first-time migration:", e)
          setProfiles([])
          hasLoadedFromCloudThisSession.current = true
        }
        }
        } catch (error: any) {
          console.error("❌ Error loading from cloud:", error)
          // If cloud loading fails, fall back to localStorage
          const savedProfiles = localStorage.getItem("tennisTrackerProfiles")
          if (savedProfiles) {
            try {
              const parsedProfiles = JSON.parse(savedProfiles).map((profile: any) => ({
                ...profile,
                students: profile.students || [],
                groups: profile.groups || [],
                attendanceRecords: profile.attendanceRecords || [],
                archivedTerms: profile.archivedTerms || [],
                completedMakeupSessions: profile.completedMakeupSessions || [],
                makeupSessions: profile.makeupSessions || [],
              }))
              setProfiles(parsedProfiles as any)
              const savedCurrentProfile = localStorage.getItem("tennisTrackerCurrentProfile")
              if (savedCurrentProfile) {
                // Check if the saved current profile still exists
                const profileExists = parsedProfiles.some((p: any) => p.id === savedCurrentProfile)
                if (profileExists) {
                  setCurrentProfileId(savedCurrentProfile)
                  console.log("✅ Restored last used profile from fallback:", savedCurrentProfile)
                } else {
                  console.log("⚠️ Saved profile no longer exists in fallback, will auto-select first profile")
                }
              }
              console.log("🔄 Fallback to localStorage due to cloud loading error")
            } catch (parseError) {
              console.error("❌ Error parsing localStorage data:", parseError)
              setProfiles([])
            }
          } else {
            setProfiles([])
          }
          hasLoadedFromCloudThisSession.current = true
        }
      } 
      */
      // Cloud sync section disabled - using local storage only
      {
        // Local storage only
        console.log("📂 Loading data from localStorage...", { 
          user: false,
          isSupabaseConfigured: false
        })
        const savedProfiles = localStorage.getItem("tennisTrackerProfiles")
        const savedCurrentProfile = localStorage.getItem("tennisTrackerCurrentProfile")

        console.log("📂 Found saved data:", { 
          hasProfiles: !!savedProfiles, 
          hasCurrentProfile: !!savedCurrentProfile,
          profilesLength: savedProfiles ? JSON.parse(savedProfiles).length : 0,
          savedProfilesRaw: savedProfiles ? savedProfiles.substring(0, 100) + "..." : "null"
        })

        if (savedProfiles) {
          try {
            const parsedProfiles = JSON.parse(savedProfiles).map((profile: any) => ({
              ...profile,
              // Ensure all arrays are initialized
              students: profile.students || [],
              groups: profile.groups || [],
              attendanceRecords: profile.attendanceRecords || [],
              archivedTerms: profile.archivedTerms || [],
              completedMakeupSessions: profile.completedMakeupSessions || [],
              makeupSessions: profile.makeupSessions || [],
            }))

            // Dedupe as a safeguard
            const seenIds = new Set<string>()
            const dedupedById: CoachProfile[] = []
            for (const p of parsedProfiles) {
              if (p && p.id && !seenIds.has(p.id)) {
                seenIds.add(p.id)
                dedupedById.push(p)
              }
            }
            const byName = new Map<string, CoachProfile>()
            for (const p of dedupedById) {
              const key = (p.name || "").trim().toLowerCase()
              const current = byName.get(key)
              if (!current || (p.students?.length || 0) > (current.students?.length || 0)) {
                byName.set(key, p)
              }
            }
            const finalProfiles = Array.from(byName.values()) as any[]

            console.log("✅ Loaded profiles from localStorage:", finalProfiles.length)
            if (isMounted) {
              setProfiles(finalProfiles as any)
              if (savedCurrentProfile) {
                // Check if the saved current profile still exists
                const profileExists = finalProfiles.some((p: any) => p.id === savedCurrentProfile)
                if (profileExists) {
                  setCurrentProfileId(savedCurrentProfile)
                  console.log("✅ Restored last used profile from local storage:", savedCurrentProfile)
                } else {
                  console.log("⚠️ Saved profile no longer exists in local storage, will auto-select first profile")
                }
              }
            }
          } catch (error: any) {
            console.error("Error parsing saved profiles:", error)
            if (isMounted) {
              setProfiles([])
            }
          }
        } else {
          console.log("📂 No saved profiles found in localStorage")
        }

        if (savedCurrentProfile && isMounted) {
          console.log("✅ Loaded current profile ID from localStorage:", savedCurrentProfile)
          setCurrentProfileId(savedCurrentProfile)
        }
      }
      if (isMounted) {
        hasLoadedData.current = true
      }
    }

    loadData()
    
    return () => {
      isMounted = false
    }
  }, []) // Local storage only - no user dependencies needed

  // Reset data loading flag when profiles change
  useEffect(() => {
    hasLoadedData.current = false
    hasLoadedFromCloudThisSession.current = false
  }, [profiles.length])

  // Auto-show create profile dialog when no profiles exist
  useEffect(() => {
    if (hasLoadedData.current && profiles.length === 0 && !showCreateProfile) {
      console.log("📝 No profiles found - showing create profile dialog")
      setShowCreateProfile(true)
    }
  }, [hasLoadedData.current, profiles.length, showCreateProfile])

  // Ensure data is saved to cloud when user signs in
  // Cloud sync removed - data is saved locally only

  // Save profiles to cloud or localStorage whenever they change
  useEffect(() => {
    // Debounce saves to prevent rapid successive saves
    const now = Date.now()
    if (saveDebounceTimer.current) {
      clearTimeout(saveDebounceTimer.current)
    }
    
    // Skip if we just saved (within 500ms)
    if (now - lastSaveTime.current < 500) {
      return
    }
    
    // Skip saving if we haven't finished initial data loading yet
    if (!hasLoadedData.current) {
      return
    }
    
    // Prevent saving empty profiles unless explicitly starting fresh
    if (profiles.length === 0) {
      return
    }
    
    // Debounce the actual save operation
    saveDebounceTimer.current = setTimeout(() => {
      lastSaveTime.current = Date.now()
      
      // Always save when we have profiles
      if (profiles.length > 0) {
        // Save to localStorage only (cloud sync removed)
        localStorage.setItem("tennisTrackerProfiles", JSON.stringify(profiles))
      }
    }, 300) // 300ms debounce
    
    // Cleanup timer on unmount
    return () => {
      if (saveDebounceTimer.current) {
        clearTimeout(saveDebounceTimer.current)
      }
    }
  }, [profiles]) // Local storage only - no user dependencies needed

  // Save current profile ID to localStorage
  useEffect(() => {
    if (currentProfileId) {
      localStorage.setItem("tennisTrackerCurrentProfile", currentProfileId)
    }
  }, [currentProfileId])

  // Auto-select first profile if no current profile is set
  useEffect(() => {
    if (profiles.length > 0 && !currentProfileId) {
      console.log("🎯 Auto-selecting first profile:", profiles[0].name)
      setCurrentProfileId(profiles[0].id)
    }
  }, [profiles, currentProfileId])

  // Generate a proper UUID v4
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  const createProfile = () => {
    if (!newProfileName.trim()) {
      toast("❌ Name required", "error")
      return
    }

    // Check if a profile with this name already exists
    const existingProfile = profiles.find(p => p.name.toLowerCase() === newProfileName.trim().toLowerCase())
    if (existingProfile) {
      toast(`❌ A profile named "${newProfileName.trim()}" already exists`, "error")
      return
    }

    const newProfile: CoachProfile = {
      id: generateUUID(),
      name: newProfileName.trim(),
      students: [],
      groups: [],
      attendanceRecords: [],
      archivedTerms: [],
      completedMakeupSessions: [],
      makeupSessions: [],
    }

    const updatedProfiles = [...profiles, newProfile]
    setProfiles(updatedProfiles)
    setCurrentProfileId(newProfile.id)
    setNewProfileName("")
    setShowCreateProfile(false)
    setActiveTab("students") // Start on students tab after creating profile

    toast(`✅ Welcome, ${newProfile.name}!`, "success")
  }

  const editProfile = () => {
    if (!editProfileName.trim() || !currentProfile) return

    const updatedProfiles = profiles.map((p) =>
      p.id === currentProfileId ? { ...p, name: editProfileName.trim() } : p,
    )
    setProfiles(updatedProfiles)
    setEditProfileName("")
    setShowEditProfile(false)

    toast(`✏️ Profile updated to "${editProfileName.trim()}"`, "success")
  }

  const deleteProfile = () => {
    if (profiles.length <= 1) {
      toast("❌ Cannot delete the last profile", "error")
      return
    }

    const updatedProfiles = profiles.filter((p) => p.id !== currentProfileId)
    setProfiles(updatedProfiles)
    setCurrentProfileId(updatedProfiles[0].id)

    toast("🗑️ Profile deleted successfully", "success")
  }



  const toggleAttendanceSelection = (studentId: string, status: "present" | "absent") => {
    setAttendanceSelections((prev) => {
      const newState = {
        ...prev,
        [studentId]: prev[studentId] === status ? null : status,
      }
      console.log(`Toggle ${studentId} to ${status}:`, newState)
      return newState
    })
  }

  const saveAttendance = () => {
    if (!currentProfile || !selectedGroupId) return

    const group = currentProfile.groups.find((g) => g.id === selectedGroupId)
    if (!group) return

    const timeString = `${selectedTime.hour}:${selectedTime.minute} ${selectedTime.period}`
    const newAttendanceRecords: AttendanceRecord[] = []
    const newMakeupSessions: MakeupSession[] = []

    // Process all students with selections
    Object.entries(attendanceSelections).forEach(([studentId, status]) => {
      if (!status) return

      const student = currentProfile.students.find((s) => s.id === studentId)
      if (!student) return

      const attendanceRecord: AttendanceRecord = {
        id: generateUUID(),
        date: selectedDate ? format(selectedDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
        time: timeString,
        groupId: selectedGroupId,
        studentId,
        status,
        notes: attendanceNotes,
        timeAdjustmentAmount: timeAdjustmentNeeded ? timeAdjustmentAmount : undefined,
        timeAdjustmentType: timeAdjustmentNeeded ? timeAdjustmentType : undefined,
        timeAdjustmentReason: timeAdjustmentNeeded ? timeAdjustmentReason : undefined,
      }

      newAttendanceRecords.push(attendanceRecord)

      if (status === "present") {
        updateStudentSessionCount(studentId, "attended")
      } else if (status === "absent") {
        const makeupSession: MakeupSession = {
          id: generateUUID(),
          studentId,
          originalDate: selectedDate ? format(selectedDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
          originalGroupId: selectedGroupId,
          reason: "Absent from session",
          notes: attendanceNotes,
          createdDate: new Date().toISOString(),
          status: "pending",
        }

        newMakeupSessions.push(makeupSession)
        updateStudentSessionCount(studentId, "missed")
      }
    })

    const updatedProfile = {
      ...currentProfile,
      attendanceRecords: [...currentProfile.attendanceRecords, ...newAttendanceRecords],
      makeupSessions: [...(currentProfile.makeupSessions || []), ...newMakeupSessions],
    }

    updateProfile(updatedProfile)
    setAttendanceSelections({})
    setAttendanceNotes("")
    setTimeAdjustmentAmount("")
    setTimeAdjustmentReason("")

    const presentCount = newAttendanceRecords.filter((r) => r.status === "present").length
    const absentCount = newAttendanceRecords.filter((r) => r.status === "absent").length

    toast(`✅ Attendance saved: ${presentCount} present, ${absentCount} absent`, "success")

    // Navigate to reports tab after saving and show sessions (not terms)
    setActiveTab("reports")
    setShowArchivedTerms(false)
  }

  const cancelSession = () => {
    if (!currentProfile || !selectedGroupId) return

    const group = currentProfile.groups.find((g) => g.id === selectedGroupId)
    if (!group) return

    const timeString = `${selectedTime.hour}:${selectedTime.minute} ${selectedTime.period}`
    const newMakeupSessions: MakeupSession[] = []
    const newAttendanceRecords: AttendanceRecord[] = []

    // Create cancelled attendance records for all students in the group
    group.studentIds.forEach((studentId) => {
      const student = currentProfile.students.find((s) => s.id === studentId)
      if (!student) return

       const attendanceRecord: AttendanceRecord = {
        id: generateUUID(),
        date: selectedDate ? format(selectedDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
        time: timeString,
        groupId: selectedGroupId,
        studentId,
        status: "canceled",
        notes: cancelReason || "Session cancelled",
        timeAdjustmentAmount: timeAdjustmentNeeded ? timeAdjustmentAmount : undefined,
        timeAdjustmentType: timeAdjustmentNeeded ? timeAdjustmentType : undefined,
        timeAdjustmentReason: timeAdjustmentNeeded ? timeAdjustmentReason : undefined,
      }

      newAttendanceRecords.push(attendanceRecord)

      const makeupSession: MakeupSession = {
        id: generateUUID(),
        studentId,
        originalGroupId: selectedGroupId,
        originalDate: selectedDate ? format(selectedDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
        reason: cancelReason || "Session cancelled",
        notes: cancelReason || "Session cancelled",
        createdDate: new Date().toISOString(),
        status: "pending",
      }

      newMakeupSessions.push(makeupSession)
    })

    // Update student make-up counts
    group.studentIds.forEach((studentId) => {
      updateStudentSessionCount(studentId, "missed")
    })

    const updatedProfile = {
      ...currentProfile,
      attendanceRecords: [...currentProfile.attendanceRecords, ...newAttendanceRecords],
      makeupSessions: [...(currentProfile.makeupSessions || []), ...newMakeupSessions],
    }

    updateProfile(updatedProfile)
    setAttendanceSelections({})
    setAttendanceNotes("")
    setCancelReason("")
    setTimeAdjustmentAmount("")
    setTimeAdjustmentReason("")
    setSessionCancelled(true)

    toast(`❌ Session cancelled for ${group.name} - Make-up sessions created`, "error")

    // Navigate to make-up tab after cancelling
    setActiveTab("makeup")
  }

  const deletePendingMakeup = (makeupId: string) => {
    if (!currentProfile) return

    const makeupSession = currentProfile.makeupSessions?.find((m) => m.id === makeupId)
    if (!makeupSession) return

    const student = currentProfile.students.find((s) => s.id === makeupSession.studentId)
    if (!student) return

    // Remove make-up session and reduce student count
    const updatedMakeupSessions = (currentProfile.makeupSessions ?? []).filter((m) => m.id !== makeupId)
    
    // Update student makeup count
    const updatedStudents = currentProfile.students.map((s) =>
      s.id === makeupSession.studentId ? { ...s, makeupSessions: Math.max(0, s.makeupSessions - 1) } : s,
    )

    const updatedProfile = {
      ...currentProfile,
      students: updatedStudents,
      makeupSessions: updatedMakeupSessions,
    }

    updateProfile(updatedProfile)
    toast(`🗑️ Make-up session deleted for ${student.name}`, "success")
  }

  const deleteCompletedMakeup = (makeupId: string) => {
    if (!currentProfile) return

    const makeupSession = currentProfile.completedMakeupSessions?.find((m) => m.id === makeupId)
    if (!makeupSession) return

    const student = currentProfile.students.find((s) => s.id === makeupSession.studentId)
    if (!student) return

    // Remove completed make-up session
    const updatedCompletedMakeupSessions = (currentProfile.completedMakeupSessions ?? []).filter(
      (m) => m.id !== makeupId,
    )

    const updatedProfile = {
      ...currentProfile,
      completedMakeupSessions: updatedCompletedMakeupSessions,
    }

    updateProfile(updatedProfile)
    toast(`🗑️ Completed make-up session deleted for ${student.name}`, "success")
  }

  // Smart Sorter functionality
  const handleSmartSorterPreview = () => {
    if (!smartSorterGroupName.trim() || !smartSorterStudentList.trim()) {
      toast("❌ Please enter both group name and student list", "error")
      return
    }

    const studentNames = smartSorterStudentList
      .split(/[,\n]/)
      .map((name) => name.trim())
      .filter((name) => name.length > 0)

    if (studentNames.length === 0) {
      toast("❌ No valid student names found", "error")
      return
    }

    if (!currentProfile) return

    const newStudents = studentNames.map((name) => ({
      id: generateUUID(),
      name,
      notes: "",
      prepaidSessions: 0, // No preset sessions
      remainingSessions: 0,
      makeupSessions: 0,
    }))

    let targetGroup = currentProfile.groups.find((g) => g.name === smartSorterGroupName.trim())

    if (!targetGroup) {
      targetGroup = {
        id: generateUUID(),
        name: smartSorterGroupName.trim(),
        type: "group",
        studentIds: newStudents.map((s) => s.id),
        dayOfWeek: smartSorterUsualDays.join(", ") || undefined,
        time: `${smartSorterUsualTime.hour}:${smartSorterUsualTime.minute} ${smartSorterUsualTime.period}`,
        duration: smartSorterDuration,
      }
    } else {
      targetGroup = {
        ...targetGroup,
        studentIds: [...targetGroup.studentIds, ...newStudents.map((s) => s.id)],
        dayOfWeek: smartSorterUsualDays.join(", ") || targetGroup.dayOfWeek,
        time: `${smartSorterUsualTime.hour}:${smartSorterUsualTime.minute} ${smartSorterUsualTime.period}`,
        duration: smartSorterDuration,
      }
    }

    setSmartSorterPreview({
      students: newStudents,
      group: targetGroup,
    })
  }

  const handleSmartSorterConfirm = () => {
    if (!smartSorterPreview || !currentProfile) return

    // Check if this is a new group by looking for it in the current profile
    const existingGroup = currentProfile.groups.find(g => g.id === smartSorterPreview.group.id)
    
    const updatedProfile = {
      ...currentProfile,
      students: [...currentProfile.students, ...smartSorterPreview.students],
      groups: existingGroup 
        ? currentProfile.groups.map((g) => (g.id === smartSorterPreview.group.id ? smartSorterPreview.group : g))
        : [...currentProfile.groups, smartSorterPreview.group],
    }

    updateProfile(updatedProfile)
    setSmartSorterGroupName("")
    setSmartSorterStudentList("")
    setSmartSorterUsualDays([])
    setSmartSorterUsualTime({ hour: "9", minute: "00", period: "AM" })
    setSmartSorterDuration("1h")
    setSmartSorterPreview(null)
    toast(`✅ Added ${smartSorterPreview.students.length} students to ${smartSorterPreview.group.name}`, "success")
    // Switch to students tab after successful confirmation
    setActiveTab("students")
  }

  const handleUsualDayToggle = (day: string) => {
    setSmartSorterUsualDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]))
  }

  // Smart Attendance functionality
  const handleSmartAttendanceParse = () => {
    if (!smartAttendanceGroupId || !smartAttendancePresentStudents.trim()) {
      toast("❌ Please select a group and enter present students", "error")
      return
    }

    if (!currentProfile) return

    const group = currentProfile.groups.find((g) => g.id === smartAttendanceGroupId)
    if (!group) return

    const presentStudentNames = smartAttendancePresentStudents
      .split(/[,\n]/)
      .map((name) => name.trim())
      .filter((name) => name.length > 0)

    const timeString = `${smartAttendanceTime.hour}:${smartAttendanceTime.minute} ${smartAttendanceTime.period}`
    const currentDate = format(new Date(), "yyyy-MM-dd")

    let updatedStudents = [...currentProfile.students]
    const newAttendanceRecords: AttendanceRecord[] = []

    // Process all students in the group
    group.studentIds.forEach((studentId) => {
      const student = currentProfile.students.find((s) => s.id === studentId)
      if (!student) return

      const isPresent = presentStudentNames.some(
        (name) =>
          name.toLowerCase().includes(student.name.toLowerCase()) ||
          student.name.toLowerCase().includes(name.toLowerCase()),
      )

      const status = isPresent ? "present" : "absent"

      // Create attendance record
      const attendanceRecord: AttendanceRecord = {
        id: generateUUID(),
        date: currentDate,
        time: timeString,
        groupId: smartAttendanceGroupId,
        studentId,
        status,
        notes: "",
        timeAdjustmentAmount: smartAttendanceTimeAdjustment ? smartAttendanceTimeAdjustmentAmount : undefined,
        timeAdjustmentType: smartAttendanceTimeAdjustment ? smartAttendanceTimeAdjustmentType : undefined,
        timeAdjustmentReason: smartAttendanceTimeAdjustment ? smartAttendanceTimeAdjustmentReason : undefined,
      }

      newAttendanceRecords.push(attendanceRecord)

      // Update student sessions
      if (status === "present") {
        updatedStudents = updatedStudents.map((s) =>
          s.id === studentId ? { ...s, remainingSessions: Math.max(0, s.remainingSessions - 1) } : s,
        )
      } else {
        // Create makeup session for absent students
        const makeupSession: MakeupSession = {
          id: generateUUID(),
          studentId,
          originalDate: currentDate,
          originalGroupId: smartAttendanceGroupId,
          reason: "Absent from session",
          notes: "",
          createdDate: new Date().toISOString(),
          status: "pending",
        }

        updatedStudents = updatedStudents.map((s) =>
          s.id === studentId ? { ...s, makeupSessions: s.makeupSessions + 1 } : s,
        )

        currentProfile.makeupSessions = [...(currentProfile.makeupSessions || []), makeupSession]
      }
    })

    const updatedProfile = {
      ...currentProfile,
      students: updatedStudents,
      attendanceRecords: [...currentProfile.attendanceRecords, ...newAttendanceRecords],
    }

    updateProfile(updatedProfile)
    setSmartAttendancePresentStudents("")
    setSmartAttendanceTimeAdjustmentAmount("")
    setSmartAttendanceTimeAdjustmentReason("")

    const presentCount = newAttendanceRecords.filter((r) => r.status === "present").length
    const absentCount = newAttendanceRecords.filter((r) => r.status === "absent").length

    toast(`✅ Attendance recorded: ${presentCount} present, ${absentCount} absent`, "success")
  }

  // Filter and sort students for search - Memoized for performance
  const filteredAndSortedStudents = useMemo(() => {
    if (!currentProfile) return []
    
    return currentProfile.students
      .filter((student) => {
        const matchesSearch =
          searchTerm === "" ||
          student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.notes.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesFilter =
          filterBy === "all_students" ||
          (filterBy === "active" && student.remainingSessions > 0) ||
          (filterBy === "inactive" && student.remainingSessions === 0) ||
          (filterBy === "has_makeups" && student.makeupSessions > 0)

        return matchesSearch && matchesFilter
      })
      .sort((a, b) => {
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
  }, [currentProfile, searchTerm, filterBy, sortBy])

  // Get student groups - Memoized for performance
  const getStudentGroups = useCallback((studentId: string) => {
    if (!currentProfile) return []
    return (currentProfile.groups ?? []).filter((group) => group.studentIds.includes(studentId))
  }, [currentProfile])

  // Delete student
  const deleteStudent = (studentId: string) => {
    if (!currentProfile) return

    const student = (currentProfile.students ?? []).find((s) => s.id === studentId)
    if (!student) return

    const updatedGroups = (currentProfile.groups ?? []).map((group) => ({
      ...group,
      studentIds: group.studentIds.filter((id) => id !== studentId),
    }))

    const updatedStudents = (currentProfile.students ?? []).filter((s) => s.id !== studentId)

    updateProfile({
      ...currentProfile,
      students: updatedStudents,
      groups: updatedGroups,
    })

    toast(`✅ ${student.name} has been removed`, "success")
  }

  // Reports data
  const monthlyData = currentProfile && selectedMonth
    ? (() => {
        const monthStart = startOfMonth(selectedMonth)
        const monthEnd = endOfMonth(selectedMonth)

        const monthlyRecords = (currentProfile.attendanceRecords ?? []).filter((record) =>
          isWithinInterval(new Date(record.date), { start: monthStart, end: monthEnd }),
        )

        const filteredRecords =
          selectedGroup === "all" ? monthlyRecords : monthlyRecords.filter((record) => record.groupId === selectedGroup)

        const totalSessions = filteredRecords.length
        const presentSessions = filteredRecords.filter((r) => r.status === "present").length
        const absentSessions = filteredRecords.filter((r) => r.status === "absent").length
        const canceledSessions = filteredRecords.filter((r) => r.status === "canceled").length
        const attendanceRate = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0

        return {
          totalSessions,
          presentSessions,
          absentSessions,
          canceledSessions,
          attendanceRate,
          records: filteredRecords,
        }
      })()
    : null

  // Export report
  const exportReport = () => {
    if (!monthlyData || !currentProfile) {
      toast("❌ No data to export", "error")
      return
    }

    const csvData = []
    csvData.push(["Date", "Student", "Group", "Status", "Notes"])
    monthlyData.records.forEach((record) => {
      const student = currentProfile.students.find((s) => s.id === record.studentId)
      const group = currentProfile.groups.find((g) => g.id === record.groupId)
      csvData.push([
        record.date,
        student?.name || "Unknown",
        group?.name || "Unknown",
        record.status,
        record.notes || "",
      ])
    })

    const csvContent = csvData
      .map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `attendance_report_${format(selectedMonth || new Date(), "yyyy-MM")}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast("✅ Report exported successfully", "success")
  }

  // Set edit profile name when current profile changes
  useEffect(() => {
    if (currentProfile) {
      setEditProfileName(currentProfile.name)
    }
  }, [currentProfile])

  // Check for existing data on component mount
  useEffect(() => {
    const checkExistingData = () => {
      try {
        const savedData = localStorage.getItem('tennis-tracker-data')
        if (savedData) {
          const parsedData = JSON.parse(savedData)
          if (parsedData.profiles && parsedData.profiles.length > 0) {
            setHasExistingData(true)
          }
        }
      } catch (error) {
        console.error('Error checking existing data:', error)
      }
    }
    
    checkExistingData()
  }, [])

  // Auto-start for returning users (has existing data)
  useEffect(() => {
    if (profiles.length > 0) {
      // Auto-start for returning users
      signInAsGuest()
      // Show welcome back message
      const currentProfile = profiles[0]
      if (currentProfile) {
        toast(`Welcome back, ${currentProfile.name}!`, "success")
      } else {
        toast("Welcome back!", "success")
      }
    }
  }, [profiles.length])

  const markMakeupAsCompleted = (makeupId: string, completedNotes = "") => {
    if (!currentProfile) return

    const makeupSession = currentProfile.makeupSessions?.find((m) => m.id === makeupId)
    if (!makeupSession) return

    const student = currentProfile.students.find((s) => s.id === makeupSession.studentId)
    if (!student) return

    // Update makeup session to completed
    const updatedMakeupSessions = (currentProfile.makeupSessions ?? []).map((m) =>
      m.id === makeupId
        ? {
            ...m,
            status: "completed" as const,
            completedDate: new Date().toISOString(),
            completedNotes,
          }
        : m,
    )

    // Move to completed makeup sessions and reduce student makeup count
    const completedSession = updatedMakeupSessions.find((m) => m.id === makeupId)
    const updatedStudents = currentProfile.students.map((s) =>
      s.id === makeupSession.studentId ? { ...s, makeupSessions: Math.max(0, s.makeupSessions - 1) } : s,
    )

    const updatedProfile = {
      ...currentProfile,
      students: updatedStudents,
      makeupSessions: updatedMakeupSessions.filter((m) => m.status !== "completed"),
      completedMakeupSessions: [...(currentProfile.completedMakeupSessions ?? []), completedSession],
    }

    updateProfile(updatedProfile)
    toast(`✅ Make-up session completed for ${student.name}`, "success")
  }

  const exportSessionData = (session: any) => {
    if (!currentProfile) return

    const group = currentProfile.groups.find((g) => g.id === session.groupId)
    const csvData = []
    csvData.push(["Group Name", "Date", "Time", "Duration", "Student Name", "Status", "Notes", "Time Adjustments"])

    session.records.forEach((record: any) => {
      const student = currentProfile.students.find((s) => s.id === record.studentId)
      csvData.push([
        session.groupName,
        session.date && !isNaN(new Date(session.date).getTime()) 
          ? format(new Date(session.date), "MMM dd, yyyy")
          : "Invalid Date",
        session.time,
        "60 minutes", // Default duration - could be made dynamic
        student?.name || "Unknown",
        record.status,
        record.notes || "",
        record.timeAdjustment || "None",
      ])
    })

    const csvContent = csvData
      .map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `session_${session.groupName}_${session.date}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast("✅ Session data exported successfully", "success")
  }

  const exportArchivedTerm = (term: any) => {
    const csvData = []
    csvData.push(["Term", "Date", "Time", "Group", "Student", "Status", "Notes"])

    term.attendanceRecords.forEach((record: any) => {
      const student = term.studentSnapshot.find((s: any) => s.id === record.studentId)
      const group = term.groupSnapshot.find((g: any) => g.id === record.groupId)
      csvData.push([
        term.name,
        record.date,
        record.time,
        group?.name || "Unknown",
        student?.name || "Unknown",
        record.status,
        record.notes || "",
      ])
    })

    const csvContent = csvData
      .map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `archived_term_${term.name.replace(/\s+/g, "_")}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast("✅ Archived term data exported successfully", "success")
  }

  const deleteArchivedTerm = (termId: string) => {
    if (!currentProfile) return

    const updatedProfile = {
      ...currentProfile,
      archivedTerms: (currentProfile.archivedTerms ?? []).filter((term) => term.id !== termId),
    }

    updateProfile(updatedProfile)
    toast("🗑️ Archived term deleted", "success")
  }

  const getStudentAttendanceHistory = useCallback((studentId: string) => {
    if (!currentProfile) return []

    return (currentProfile.attendanceRecords ?? [])
      .filter((record) => record.studentId === studentId)
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime()
        const dateB = new Date(b.date).getTime()
        // Handle invalid dates by putting them at the end
        if (isNaN(dateA) && isNaN(dateB)) return 0
        if (isNaN(dateA)) return 1
        if (isNaN(dateB)) return -1
        return dateB - dateA
      })
      .slice(0, 10) // Show last 10 sessions
  }, [currentProfile])

  const getSessionHistory = useMemo(() => {
    if (!currentProfile) return []

    // Group attendance records by session (date + group + time)
    const sessionGroups = (currentProfile.attendanceRecords ?? []).reduce((groups, record) => {
      const sessionKey = `${record.date}_${record.groupId}_${record.time}`
      if (!groups[sessionKey]) {
        const group = currentProfile.groups?.find(g => g.id === record.groupId)
        groups[sessionKey] = {
          id: sessionKey,
          date: record.date,
          time: record.time,
          groupId: record.groupId,
          groupName: group?.name || 'Unknown Group',
          records: [],
          isCancelled: false
        }
      }
      groups[sessionKey].records.push(record)
      return groups
    }, {} as Record<string, any>)

    // Convert to array and sort by date (newest first)
    return Object.values(sessionGroups)
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime()
        const dateB = new Date(b.date).getTime()
        // Handle invalid dates by putting them at the end
        if (isNaN(dateA) && isNaN(dateB)) return 0
        if (isNaN(dateA)) return 1
        if (isNaN(dateB)) return -1
        return dateB - dateA
      })
      .slice(0, 20) as Array<{
        id: string
        date: string
        time: string
        groupId: string
        groupName: string
        records: any[]
        isCancelled: boolean
      }>
  }, [currentProfile])

  const finalizeTerm = () => {
    if (!currentProfile) return

    const termName = `Term ${currentProfile.archivedTerms.length + 1}`
    const startMonth = format(selectedMonth || new Date(), "MMMM")
    const endMonth = format(selectedMonth || new Date(), "MMMM")
    const year = format(selectedMonth || new Date(), "yyyy")

    const termData = {
      id: generateUUID(),
      name: termName,
      startMonth,
      endMonth,
      year,
      finalizedDate: new Date().toISOString(),
      attendanceRecords: [...currentProfile.attendanceRecords],
      studentSnapshot: [...currentProfile.students],
      groupSnapshot: [...currentProfile.groups],
    }

    const updatedProfile = {
      ...currentProfile,
      archivedTerms: [...(currentProfile.archivedTerms ?? []), termData],
      attendanceRecords: [],
    }

    updateProfile(updatedProfile)
    toast(`✅ Term "${termName}" finalized and archived`, "success")
  }

  const exportStudentData = (student: Student) => {
    if (!currentProfile) return

    const studentAttendance = (currentProfile.attendanceRecords ?? []).filter((record) => record.studentId === student.id)

    const exportData = {
      studentName: student.name,
      studentId: student.id,
      notes: student.notes,
      prepaidSessions: student.prepaidSessions,
      remainingSessions: student.remainingSessions,
      makeupSessions: student.makeupSessions,
      attendanceHistory: studentAttendance.map((record) => ({
        date: record.date,
        status: record.status as any,
        groupName: currentProfile.groups.find((g) => g.id === record.groupId)?.name || "Unknown Group",
        timeAdjustment: (record as any).timeAdjustment || 0,
      })),
      totalSessions: studentAttendance.length,
      presentSessions: studentAttendance.filter((r) => r.status === "present").length,
      absentSessions: studentAttendance.filter((r) => r.status === "absent").length,
      cancelledSessions: studentAttendance.filter((r) => (r as any).status === "cancelled").length,
    }

    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${student.name.replace(/\s+/g, "_")}_attendance_data.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast(`📊 Exported data for ${student.name}`, "success")
  }

  const completeMakeupSession = (makeupId: string) => {
    if (!currentProfile) return

    const makeupSession = currentProfile.makeupSessions?.find((m) => m.id === makeupId)
    if (!makeupSession) return

    const student = currentProfile.students.find((s) => s.id === makeupSession.studentId)
    if (!student) return

    // Update makeup session to completed
    const updatedMakeupSessions = (currentProfile.makeupSessions ?? []).map((m) =>
      m.id === makeupId
        ? {
            ...m,
            status: "completed" as const,
            completedDate: new Date().toISOString(),
          }
        : m,
    )

    // Move to completed makeup sessions and reduce student makeup count
    const completedSession = updatedMakeupSessions.find((m) => m.id === makeupId)
    
    // Update student session count
    updateStudentSessionCount(makeupSession.studentId, "makeup")

    const updatedProfile = {
      ...currentProfile,
      makeupSessions: updatedMakeupSessions.filter((m) => m.status !== "completed"),
      completedMakeupSessions: [...(currentProfile.completedMakeupSessions ?? []), completedSession],
    }

    updateProfile(updatedProfile)
    toast(`✅ Make-up session completed for ${student.name}`, "success")
  }

  // Show welcome page for first-time users (no existing data)
  if (profiles.length === 0 && !hasInteractedWithWelcome) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in-up">
        <Card className="glass-card w-full max-w-md">
          <CardHeader className="text-center">
            <motion.div 
              className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <span className="text-2xl">🎾</span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <CardTitle className="text-primary-white text-xl">Attendance Tracker</CardTitle>
              <p className="text-secondary-white text-sm">
                {hasExistingData ? "Welcome back! Choose an option below:" : "Start tracking your tennis classes"}
              </p>
            </motion.div>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasExistingData ? (
              <>
                <Button 
                  onClick={() => {
                    // Load existing data
                    const savedData = localStorage.getItem('tennis-tracker-data')
                    if (savedData) {
                      try {
                        const parsedData = JSON.parse(savedData)
                        const profiles = parsedData.profiles || []
                        setProfiles(profiles)
                        
                        // Validate and set current profile ID
                        const savedCurrentProfileId = parsedData.currentProfileId || ""
                        if (savedCurrentProfileId) {
                          const profileExists = profiles.some((p: any) => p.id === savedCurrentProfileId)
                          if (profileExists) {
                            setCurrentProfileId(savedCurrentProfileId)
                            console.log("✅ Restored last used profile from legacy data:", savedCurrentProfileId)
                          } else {
                            console.log("⚠️ Saved profile no longer exists in legacy data, will auto-select first profile")
                          }
                        }
                        
                        setHasInteractedWithWelcome(true)
                        toast("Previous data loaded successfully!", "success")
                      } catch (error) {
                        console.error('Error loading data:', error)
                        toast("Error loading previous data", "error")
                      }
                    }
                  }}
                  className="glass-button w-full text-primary-white"
                >
                  Load Previous Data
                </Button>
                <Button 
                  onClick={() => {
                    setShowCreateProfile(true)
                    setHasInteractedWithWelcome(true)
                  }}
                  variant="outline"
                  className="glass-button w-full text-primary-white border-primary-white/20"
                >
                  Start Fresh
                </Button>
              </>
            ) : (
              <Button 
                onClick={() => {
                  setShowCreateProfile(true)
                  setHasInteractedWithWelcome(true)
                }}
                className="glass-button w-full text-primary-white"
              >
                Start Coaching
              </Button>
            )}
            <p className="text-xs text-tertiary-white text-center">
              💾 Data stored locally on this device
            </p>
            <p className="text-xs text-tertiary-white text-center">
              Made by Santiago Gonzalez
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Auto-start for returning users (no loading screen needed)

  return (
    <div className="min-h-screen animate-fade-in-up">
      {/* Error Banner */}
      {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('error') && (
        <div className="p-2 sm:p-4">
          <div className="max-w-7xl mx-auto">
            <Card className="glass-card bg-red-900/20 border-red-500/30">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                                          <div>
                        <p className="text-red-200 font-medium text-sm sm:text-base">Sign-in Error</p>
                        <p className="text-red-300/80 text-xs sm:text-sm">
                        {decodeURIComponent(new URLSearchParams(window.location.search).get('error') || '')}
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => window.history.replaceState({}, '', '/')}
                    size="sm"
                    variant="outline"
                    className="glass-button text-primary-white border-white/20 text-xs"
                  >
                    Dismiss
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Sync Status (non-shifting fixed badge) */}
      {/* Sync Status removed - using local storage only */}

      
      {/* Header */}
      <div className="p-2 sm:p-4">
        <div className="max-w-7xl mx-auto">
          <Card className="glass-card mb-4 sm:mb-6">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-primary-white text-xl sm:text-2xl font-bold">
                    Current Coach: {currentProfile.name || "None Selected"}
                  </h1>
                  <p className="text-secondary-white text-sm sm:text-base">
                    {currentProfile.students.length} Students • {currentProfile.groups.length} Groups
                  </p>
                </div>
                <Sheet open={showSettings} onOpenChange={setShowSettings}>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="glass-button text-primary-white"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent 
                    side="right" 
                    className="w-[400px] sm:w-[540px] bg-transparent border-white/20 p-0"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                    }}
                  >
                    <div className="p-6">
                      <SheetHeader>
                        <SheetTitle className="text-primary-white">Settings</SheetTitle>
                      </SheetHeader>
                      <ScrollArea className="h-[calc(100vh-120px)] mt-6">
                        <div className="space-y-6 pr-4">
                          {/* Coach Management Section */}
                          <div className="space-y-3">
                            <h3 className="text-primary-white font-semibold text-lg">Coach Management</h3>
                            <div className="space-y-3">
                              <div>
                                <Label className="text-secondary-white text-sm">Current Coach Profile</Label>
                                <Select value={currentProfileId} onValueChange={setCurrentProfileId}>
                                  <SelectTrigger className="glass-input text-primary-white w-full text-sm">
                                    <SelectValue placeholder="Select coach profile" />
                                  </SelectTrigger>
                                  <SelectContent className="glass-dropdown">
                                    {profiles.map((profile) => (
                                      <SelectItem key={profile.id} value={profile.id} className="text-primary-white">
                                        Coach: {profile.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => setShowCreateProfile(true)}
                                  size="sm"
                                  className="glass-button text-primary-white flex-1"
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Coach
                                </Button>
                                <Button
                                  onClick={() => setShowEditProfile(true)}
                                  size="sm"
                                  variant="outline"
                                  className="glass-button text-primary-white flex-1"
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </Button>
                                <Button
                                  onClick={() => {
                                    if (profiles.length > 1) {
                                      const updatedProfiles = profiles.filter((p) => p.id !== currentProfileId)
                                      setProfiles(updatedProfiles)
                                      setCurrentProfileId(updatedProfiles[0].id)
                                      toast("🗑️ Profile deleted successfully", "success")
                                    } else {
                                      toast("❌ Cannot delete the last profile", "error")
                                    }
                                  }}
                                  size="sm"
                                  className="glass-delete-button"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              {currentProfile && (
                                <div className="flex gap-2">
                                  <Badge className="glass-card text-primary-white border-white/20">
                                    <Users className="h-3 w-3 mr-1" />
                                    {currentProfile.students.length} Students
                                  </Badge>
                                  <Badge className="glass-card text-primary-white border-white/20">
                                    <Users className="h-3 w-3 mr-1" />
                                    {currentProfile.groups.length} Groups
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Data Management Section */}
                          <div className="space-y-3">
                            <h3 className="text-primary-white font-semibold text-lg">Data Management</h3>
                            <div className="flex gap-2">
                              <DataManagementWithSuspense
                                profiles={profiles}
                                onDataImported={handleDataImported}
                                onDataCleared={handleDataCleared}
                              />
                            </div>
                          </div>

                          {/* App Info Section */}
                          <div className="space-y-3">
                            <h3 className="text-primary-white font-semibold text-lg">App Info</h3>
                            <div className="glass-card p-4 space-y-2">
                              <p className="text-secondary-white text-sm">Created by Santiago González</p>
                              <p className="text-secondary-white text-sm">Version 1.0.0</p>
                              <p className="text-secondary-white text-sm font-medium">Tennis Attendance Tracker</p>
                              <p className="text-secondary-white text-xs leading-relaxed">
                                A comprehensive attendance management system for tennis coaches. 
                                Track student attendance, organize groups, manage sessions, and generate 
                                detailed reports. Features smart attendance, bulk operations, and 
                                cloud synchronization for seamless coaching management.
                              </p>
                            </div>
                          </div>

                          {/* Clear Data Section */}
                          <div className="space-y-3">
                            <h3 className="text-primary-white font-semibold text-lg">Clear Data</h3>
                            <div className="glass-card p-4 border-red-500/20 border">
                              <div className="flex items-start gap-3 mb-4">
                                <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-red-300 font-medium text-sm">⚠️ Danger Zone</p>
                                  <p className="text-secondary-white text-xs mt-1">
                                    This action will permanently delete ALL your data and cannot be undone.
                                  </p>
                                </div>
                              </div>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className="w-full glass-button text-red-300 border-red-500/30 hover:bg-red-500/10 hover:border-red-500/50"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Clear All Data
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="glass-dropdown w-[95vw] max-w-md">
                                  <AlertDialogHeader>
                                    <div className="flex items-center gap-3 mb-2">
                                      <div className="p-2 rounded-full bg-red-500/20">
                                        <AlertTriangle className="h-6 w-6 text-red-400" />
                                      </div>
                                      <AlertDialogTitle className="text-primary-white text-lg">
                                        Clear All Data
                                      </AlertDialogTitle>
                                    </div>
                                    <AlertDialogDescription className="text-secondary-white space-y-3">
                                      <p className="font-medium text-red-300">⚠️ This action cannot be undone!</p>
                                      <div className="glass-card p-3 bg-red-500/5 border border-red-500/20">
                                        <p className="text-sm font-medium text-red-300 mb-2">The following will be permanently deleted:</p>
                                        <ul className="text-xs text-secondary-white space-y-1">
                                          <li>• All coach profiles ({profiles.length} profile{profiles.length !== 1 ? 's' : ''})</li>
                                          <li>• All students ({profiles.reduce((sum, profile) => sum + (profile.students?.length || 0), 0)} students)</li>
                                          <li>• All groups ({profiles.reduce((sum, profile) => sum + (profile.groups?.length || 0), 0)} groups)</li>
                                          <li>• All attendance records</li>
                                          <li>• All makeup sessions</li>
                                          <li>• All app settings and preferences</li>
                                        </ul>
                                      </div>
                                      <p className="text-sm">
                                        This will completely reset your Tennis Attendance Tracker to its initial state.
                                      </p>
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                    <AlertDialogCancel className="glass-button text-primary-white w-full sm:w-auto">
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => {
                                        setProfiles([])
                                        setCurrentProfileId("")
                                        deleteLocal()
                                        setShowSettings(false)
                                        toast("🗑️ All data cleared successfully", "success")
                                      }}
                                      className="glass-button bg-red-600/20 hover:bg-red-600/30 text-red-300 border-red-500/30 hover:border-red-500/50 w-full sm:w-auto"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Yes, Clear All Data
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </div>
                      </ScrollArea>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>


      {/* Main Content with Mobile Swipe Support */}
      <motion.div 
        className="px-2 sm:px-4"
        onPanEnd={(event, info) => {
          // Only enable swipe on mobile
          if (window.innerWidth < 768) {
            const threshold = 100 // Minimum distance for swipe
            const tabs = ["students", "attendance", "search", "makeup", "reports"]
            const currentIndex = tabs.indexOf(activeTab)
            
            if (info.offset.x > threshold && currentIndex > 0) {
              // Swipe right - go to previous tab
              setActiveTab(tabs[currentIndex - 1])
            } else if (info.offset.x < -threshold && currentIndex < tabs.length - 1) {
              // Swipe left - go to next tab
              setActiveTab(tabs[currentIndex + 1])
            }
          }
        }}
        style={{ touchAction: 'pan-y' }} // Allow vertical scrolling, handle horizontal swipes
      >
        <div className="max-w-7xl mx-auto">
          {/* Record Attendance Page */}
          {activeTab === "attendance" && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary-white" />
                  <h2 className="text-primary-white text-xl font-semibold">
                    {attendanceSmartMode ? "Smart Attendance" : "Record Attendance"}
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <CalendarDays
                    className={cn(
                      "h-4 w-4 transition-colors duration-300",
                      !attendanceSmartMode ? "text-blue-400" : "text-tertiary-white",
                    )}
                  />
                  <EnhancedSwitch
                    checked={attendanceSmartMode}
                    onCheckedChange={(checked: boolean) => setAttendanceSmartMode(checked)}
                    leftIcon={<Brain className="h-3 w-3 text-blue-400" />}
                    rightIcon={<Zap className="h-3 w-3 text-blue-400" />}
                  />
                  <Brain
                    className={cn(
                      "h-4 w-4 transition-colors duration-300",
                      attendanceSmartMode ? "text-blue-400" : "text-tertiary-white",
                    )}
                  />
                </div>
              </div>

              {!attendanceSmartMode ? (
                <>
                  <Card className="glass-card">
                    <CardContent className="p-6 space-y-6">
                      <div>
                        <Label className="text-secondary-white">Select Group or Private Lesson</Label>
                        <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                          <SelectTrigger className="glass-input text-primary-white">
                            <SelectValue placeholder="Choose a group or private lesson" />
                          </SelectTrigger>
                          <SelectContent className="glass-dropdown">
                            {currentProfile?.groups.map((group) => (
                              <SelectItem key={group.id} value={group.id} className="text-primary-white">
                                {group.name} - {formatDayDisplay(group.dayOfWeek)} {group.time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-secondary-white">Select Date</Label>
                        <div className="mt-2">
                          <Calendar
                            value={selectedDate}
                            onChange={(date) => date && setSelectedDate(date)}
                            className="glass-card p-4 text-primary-white w-full"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-secondary-white">Select Time</Label>
                        <div className="flex gap-2">
                          <Select
                            value={selectedTime.hour}
                            onValueChange={(value) => setSelectedTime({ ...selectedTime, hour: value })}
                          >
                            <SelectTrigger className="glass-input text-primary-white flex-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="glass-dropdown">
                              {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
                                <SelectItem key={hour} value={hour.toString()} className="text-primary-white">
                                  {hour}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={selectedTime.minute}
                            onValueChange={(value) => setSelectedTime({ ...selectedTime, minute: value })}
                          >
                            <SelectTrigger className="glass-input text-primary-white flex-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="glass-dropdown">
                              <SelectItem value="00" className="text-primary-white">
                                00
                              </SelectItem>
                              <SelectItem value="15" className="text-primary-white">
                                15
                              </SelectItem>
                              <SelectItem value="30" className="text-primary-white">
                                30
                              </SelectItem>
                              <SelectItem value="45" className="text-primary-white">
                                45
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <Select
                            value={selectedTime.period}
                            onValueChange={(value) => setSelectedTime({ ...selectedTime, period: value })}
                          >
                            <SelectTrigger className="glass-input text-primary-white flex-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="glass-dropdown">
                              <SelectItem value="AM" className="text-primary-white">
                                AM
                              </SelectItem>
                              <SelectItem value="PM" className="text-primary-white">
                                PM
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="time-adjustment"
                          checked={timeAdjustmentNeeded}
                          onCheckedChange={(checked) => setTimeAdjustmentNeeded(checked as boolean)}
                        />
                        <Label htmlFor="time-adjustment" className="text-secondary-white">
                          Time adjustment needed?
                        </Label>
                      </div>

                      {timeAdjustmentNeeded && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-secondary-white">Adjustment Amount</Label>
                              <Select value={timeAdjustmentAmount} onValueChange={setTimeAdjustmentAmount}>
                                <SelectTrigger className="glass-input text-primary-white">
                                  <SelectValue placeholder="Select amount" />
                                </SelectTrigger>
                                                            <SelectContent className="glass-dropdown">
                              <SelectItem value="15 min" className="text-primary-white">
                                15 min
                              </SelectItem>
                              <SelectItem value="30 min" className="text-primary-white">
                                30 min
                              </SelectItem>
                              <SelectItem value="45 min" className="text-primary-white">
                                45 min
                              </SelectItem>
                              <SelectItem value="1 h" className="text-primary-white">
                                1 h
                              </SelectItem>
                            </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-secondary-white">Adjustment Type</Label>
                              <Select
                                value={timeAdjustmentType}
                                onValueChange={(value: "more" | "less") => setTimeAdjustmentType(value)}
                              >
                                <SelectTrigger className="glass-input text-primary-white">
                                  <SelectValue />
                                </SelectTrigger>
                                                            <SelectContent className="glass-dropdown">
                              <SelectItem value="more" className="text-primary-white">
                                More
                              </SelectItem>
                              <SelectItem value="less" className="text-primary-white">
                                Less
                              </SelectItem>
                            </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div>
                            <Label className="text-secondary-white">Reason for Time Adjustment</Label>
                            <Input
                              value={timeAdjustmentReason}
                              onChange={(e) => setTimeAdjustmentReason(e.target.value)}
                              placeholder="Enter reason"
                              className="glass-input text-primary-white placeholder:text-tertiary-white"
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Student List for Selected Group */}
                  {selectedGroupId && currentProfile && (
                    <Card className="glass-card">
                      <CardHeader>
                        <CardTitle className="text-primary-white">
                          Students in {currentProfile.groups.find((g) => g.id === selectedGroupId)?.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {currentProfile.groups
                            .find((g) => g.id === selectedGroupId)
                            ?.studentIds.map((studentId) => {
                              const student = currentProfile.students.find((s) => s.id === studentId)
                              if (!student) return null

                              const currentSelection = attendanceSelections[studentId]

                              return (
                                <div key={studentId} className="glass-card p-4">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex-1">
                                      <h3 className="font-semibold text-primary-white">{student.name}</h3>
                                      <p className="text-sm text-secondary-white">
                                        Remaining: {student.remainingSessions} | Make-ups: {student.makeupSessions}
                                      </p>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        onClick={(e) => {
                                          e.preventDefault()
                                          e.stopPropagation()
                                          toggleAttendanceSelection(studentId, "present")
                                        }}
                                        className={cn(
                                          "transition-all duration-200 ease-in-out transform min-w-[60px] sm:min-w-[80px] active:scale-95",
                                          attendanceSelections[studentId] === "present"
                                            ? "bg-green-500/20 backdrop-blur-sm border-2 border-green-400 text-green-300 font-bold shadow-lg shadow-green-500/25 ring-2 ring-green-400/40"
                                            : "glass-button border border-green-400/30 text-primary-white hover:scale-105 hover:bg-green-500/10 hover:border-green-400/50",
                                        )}
                                        style={{ borderRadius: '8px' }}
                                      >
                                        <CheckCircle className="h-4 w-4 mr-1" />
                                        <span className="text-sm font-medium">Present</span>
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={(e) => {
                                          e.preventDefault()
                                          e.stopPropagation()
                                          toggleAttendanceSelection(studentId, "absent")
                                        }}
                                        className={cn(
                                          "transition-all duration-200 ease-in-out transform min-w-[60px] sm:min-w-[80px] active:scale-95",
                                          attendanceSelections[studentId] === "absent"
                                            ? "bg-red-500/20 backdrop-blur-sm border-2 border-red-400 text-red-300 font-bold shadow-lg shadow-red-500/25 ring-2 ring-red-400/40"
                                            : "glass-button border border-red-400/30 text-primary-white hover:scale-105 hover:bg-red-500/10 hover:border-red-400/50",
                                        )}
                                        style={{ borderRadius: '8px' }}
                                      >
                                        <XCircle className="h-4 w-4 mr-1" />
                                        <span className="text-sm font-medium">Absent</span>
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                        </div>

                        <div className="flex gap-3 mt-6">
                          <Button
                            onClick={saveAttendance}
                            disabled={Object.keys(attendanceSelections).length === 0}
                            className="glass-button text-primary-white bg-blue-500/20 hover:bg-blue-500/30 flex-1"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Save Attendance
                          </Button>
                          <Button
                            onClick={cancelSession}
                            className="glass-button text-primary-white bg-red-500/20 hover:bg-red-500/30 flex-1"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancel Session
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                /* Smart Attendance Section */
                <Card className="glass-card">
                  <CardContent className="p-6 space-y-6">
                    <div>
                      <p className="text-secondary-white text-sm mb-4">
                        Select a group and enter student names to quickly record attendance
                      </p>
                    </div>

                    <div>
                      <Label className="text-secondary-white">Select Group</Label>
                      <Select value={smartAttendanceGroupId} onValueChange={setSmartAttendanceGroupId}>
                        <SelectTrigger className="glass-input text-primary-white">
                          <SelectValue placeholder="Choose a group or private lesson" />
                        </SelectTrigger>
                        <SelectContent className="glass-dropdown">
                          {currentProfile?.groups.map((group) => (
                            <SelectItem key={group.id} value={group.id} className="text-primary-white">
                              {group.name} - {formatDayDisplay(group.dayOfWeek)} {group.time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-secondary-white">Select Time</Label>
                      <div className="flex gap-2">
                        <Select
                          value={smartAttendanceTime.hour}
                          onValueChange={(value) => setSmartAttendanceTime({ ...smartAttendanceTime, hour: value })}
                        >
                          <SelectTrigger className="glass-input text-primary-white flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="glass-dropdown">
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
                              <SelectItem key={hour} value={hour.toString()} className="text-primary-white">
                                {hour}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={smartAttendanceTime.minute}
                          onValueChange={(value) => setSmartAttendanceTime({ ...smartAttendanceTime, minute: value })}
                        >
                          <SelectTrigger className="glass-input text-primary-white flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="glass-dropdown">
                            <SelectItem value="00" className="text-primary-white">
                              00
                            </SelectItem>
                            <SelectItem value="15" className="text-primary-white">
                              15
                            </SelectItem>
                            <SelectItem value="30" className="text-primary-white">
                              30
                            </SelectItem>
                            <SelectItem value="45" className="text-primary-white">
                              45
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <Select
                          value={smartAttendanceTime.period}
                          onValueChange={(value) => setSmartAttendanceTime({ ...smartAttendanceTime, period: value })}
                        >
                          <SelectTrigger className="glass-input text-primary-white flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="glass-dropdown">
                            <SelectItem value="AM" className="text-primary-white">
                              AM
                            </SelectItem>
                            <SelectItem value="PM" className="text-primary-white">
                              PM
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="smart-time-adjustment"
                        checked={smartAttendanceTimeAdjustment}
                        onCheckedChange={(checked) => setSmartAttendanceTimeAdjustment(checked as boolean)}
                      />
                      <Label htmlFor="smart-time-adjustment" className="text-secondary-white">
                        Time adjustment needed?
                      </Label>
                    </div>

                    {smartAttendanceTimeAdjustment && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-secondary-white">Adjustment Amount</Label>
                            <Select
                              value={smartAttendanceTimeAdjustmentAmount}
                              onValueChange={setSmartAttendanceTimeAdjustmentAmount}
                            >
                              <SelectTrigger className="glass-input text-primary-white">
                                <SelectValue placeholder="Select amount" />
                              </SelectTrigger>
                              <SelectContent className="glass-dropdown">
                                <SelectItem value="15 min" className="text-primary-white">
                                  15 min
                                </SelectItem>
                                <SelectItem value="30 min" className="text-primary-white">
                                  30 min
                                </SelectItem>
                                <SelectItem value="45 min" className="text-primary-white">
                                  45 min
                                </SelectItem>
                                <SelectItem value="1 h" className="text-primary-white">
                                  1 h
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-secondary-white">Adjustment Type</Label>
                            <Select
                              value={smartAttendanceTimeAdjustmentType}
                              onValueChange={(value: "more" | "less") => setSmartAttendanceTimeAdjustmentType(value)}
                            >
                              <SelectTrigger className="glass-input text-primary-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="glass-dropdown">
                                <SelectItem value="more" className="text-primary-white">
                                  More
                                </SelectItem>
                                <SelectItem value="less" className="text-primary-white">
                                  Less
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <Label className="text-secondary-white">Reason for Time Adjustment</Label>
                          <Input
                            value={smartAttendanceTimeAdjustmentReason}
                            onChange={(e) => setSmartAttendanceTimeAdjustmentReason(e.target.value)}
                            placeholder="Enter reason"
                            className="glass-input text-primary-white placeholder:text-tertiary-white"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <Label className="text-secondary-white">Enter Present Students</Label>
                      <Textarea
                        value={smartAttendancePresentStudents}
                        onChange={(e) => setSmartAttendancePresentStudents(e.target.value)}
                        placeholder="Enter student names (one per line or comma-separated)"
                        className="glass-input text-primary-white placeholder:text-tertiary-white min-h-[120px] mt-2"
                      />
                      <p className="text-tertiary-white text-xs mt-1">
                        Format: Enter student names (one per line or comma-separated)
                      </p>
                    </div>

                    <Button
                      onClick={handleSmartAttendanceParse}
                      disabled={!smartAttendanceGroupId || !smartAttendancePresentStudents.trim()}
                      className="glass-button text-primary-white w-full"
                    >
                      Parse Attendance
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Students Page */}
          {activeTab === "students" && currentProfile && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary-white" />
                  <h2 className="text-primary-white text-xl font-semibold">
                    {studentsSmartMode ? "Smart Sorter" : "Students & Groups"}
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <Users
                    className={cn(
                      "h-4 w-4 transition-colors duration-300",
                      !studentsSmartMode ? "text-blue-400" : "text-tertiary-white",
                    )}
                  />
                  <EnhancedSwitch
                    checked={studentsSmartMode}
                    onCheckedChange={(checked: boolean) => setStudentsSmartMode(checked)}
                    leftIcon={<Brain className="h-3 w-3 text-blue-400" />}
                    rightIcon={<Zap className="h-3 w-3 text-blue-400" />}
                  />
                  <Brain
                    className={cn(
                      "h-4 w-4 transition-colors duration-300",
                      studentsSmartMode ? "text-blue-400" : "text-tertiary-white",
                    )}
                  />
                </div>
              </div>

              {!studentsSmartMode ? (
                <>
                  <Card className="glass-card">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-primary-white">Students</CardTitle>
                        <StudentDialog profileData={currentProfile} onUpdateProfile={updateProfile}>
                          <Button className="glass-button text-primary-white">
                            <Plus className="h-4 w-4 mr-1" />
                            Add Student
                          </Button>
                        </StudentDialog>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {currentProfile.students.length === 0 ? (
                        <p className="text-secondary-white text-center py-8">No students added yet.</p>
                      ) : (
                        <div className="space-y-3">
                          {(currentProfile.students ?? []).map((student) => {
                            const studentGroups = (currentProfile.groups ?? []).filter((group) =>
                              group.studentIds.includes(student.id),
                            )
                            const attendanceHistory = getStudentAttendanceHistory(student.id)
                            const isExpanded = expandedStudentId === student.id

                            return (
                              <div key={student.id} className="glass-card p-3">
                                <div 
                                  className="flex items-center justify-between cursor-pointer"
                                  onClick={() => toggleStudentExpansion(student.id)}
                                >
                                  <div className="flex-1">
                                    <h3 className="font-medium text-primary-white">{student.name}</h3>
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
                                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                    <StudentDialog
                                      profileData={currentProfile}
                                      onUpdateProfile={updateProfile}
                                      student={student}
                                    >
                                      <Button
                                        size="sm"
                                        className="glass-button text-primary-white p-2"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    </StudentDialog>
                                    <Button
                                      onClick={() => exportStudentData(student)}
                                      size="sm"
                                      className="glass-button text-primary-white p-2"
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      onClick={() => deleteStudent(student.id)}
                                      size="sm"
                                      className="glass-delete-button p-2"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                {isExpanded && (
                                  <div className="mt-3 pt-3 border-t border-white/10">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                      <div className="mt-3">
                                        <p className="text-secondary-white text-sm mb-1">Notes:</p>
                                        <p className="text-primary-white text-sm bg-white/5 rounded p-2">{student.notes}</p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Groups Section */}
                  <Card className="glass-card">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-primary-white">Groups & Private Lessons</CardTitle>
                        <GroupDialog profileData={currentProfile} onUpdateProfile={updateProfile}>
                          <Button className="glass-button text-primary-white">
                            <Plus className="h-4 w-4 mr-1" />
                            Add Group
                          </Button>
                        </GroupDialog>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {currentProfile.groups.length === 0 ? (
                        <p className="text-secondary-white text-center py-8">No groups created yet.</p>
                      ) : (
                        <div className="space-y-3">
                          {(currentProfile.groups ?? []).map((group) => {
                            const isExpanded = expandedCards[`group-${group.id}`]
                            const groupStudents = (currentProfile.students ?? []).filter((s) =>
                              group.studentIds.includes(s.id),
                            )

                            return (
                              <div
                                key={group.id}
                                className="glass-card p-4 cursor-pointer hover:bg-white/5 transition-colors"
                                onClick={() => toggleCardExpansion(`group-${group.id}`)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <h3 className="font-semibold text-primary-white text-lg">{group.name}</h3>
                                    <p className="text-sm text-secondary-white">
                                      {formatDayDisplay(group.dayOfWeek)} {group.time}
                                    </p>
                                    <p className="text-xs text-tertiary-white">
                                      {group.studentIds.length} student{group.studentIds.length !== 1 ? "s" : ""}
                                    </p>
                                  </div>
                                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                    <GroupDialog
                                      profileData={currentProfile}
                                      onUpdateProfile={updateProfile}
                                      group={group}
                                    >
                                      <Button size="sm" className="glass-button text-primary-white">
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    </GroupDialog>
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        if (group.studentIds.length === 0) {
                                          const updatedGroups = (currentProfile.groups ?? []).filter((g) => g.id !== group.id)
                                          updateProfile({ ...currentProfile, groups: updatedGroups })
                                        }
                                      }}
                                      disabled={group.studentIds.length > 0}
                                      className={cn(
                                        group.studentIds.length > 0
                                          ? "glass-button text-primary-white opacity-50 cursor-not-allowed"
                                          : "glass-delete-button",
                                      )}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>

                                {isExpanded && (
                                  <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <span className="text-secondary-white">Type:</span>
                                        <span className="text-primary-white ml-2">
                                          {group.type === "group" ? "Group Class" : "Private"}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-secondary-white">Duration:</span>
                                        <span className="text-primary-white ml-2">{group.duration}</span>
                                      </div>
                                    </div>

                                    {groupStudents.length > 0 && (
                                      <div>
                                        <p className="text-secondary-white text-sm mb-2">Students in this group:</p>
                                        <div className="space-y-2">
                                          {groupStudents.map((student) => (
                                            <div
                                              key={student.id}
                                              className="flex items-center justify-between bg-white/5 rounded p-2"
                                            >
                                              <span className="text-primary-white">{student.name}</span>
                                              <div className="text-xs text-secondary-white">
                                                Prepaid: {student.prepaidSessions} • Remaining: {student.remainingSessions} • Make-ups: {student.makeupSessions}
                                                {student.sessionHistory && student.sessionHistory.length > 0 && (
                                                  <div className="mt-1 text-xs text-tertiary-white">
                                                    Last session: {student.sessionHistory[student.sessionHistory.length - 1].date} ({student.sessionHistory[student.sessionHistory.length - 1].type})
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              ) : (
                /* Smart Sorter Section */
                <Card className="glass-card">
                  <CardContent className="p-6 space-y-6">
                    <div>
                      <p className="text-secondary-white text-sm mb-4">
                        Create students and assign them to groups with customizable schedules
                      </p>
                    </div>

                    <div>
                      <Label className="text-secondary-white">Group Name</Label>
                      <Input
                        value={smartSorterGroupName}
                        onChange={(e) => setSmartSorterGroupName(e.target.value)}
                        placeholder="Enter group name"
                        className="glass-input text-primary-white placeholder:text-tertiary-white mt-2 text-sm"
                      />
                      <p className="text-tertiary-white text-xs mt-1">
                        If the group does not exist, it will be created.
                      </p>
                    </div>

                    <div>
                      <Label className="text-secondary-white">Usual Days</Label>
                      <div className="grid grid-cols-4 sm:grid-cols-7 gap-3 mt-2">
                        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                          <div key={day} className="flex items-center space-x-2">
                            <Checkbox
                              id={`day-${day}`}
                              checked={smartSorterUsualDays.includes(day)}
                              onCheckedChange={() => handleUsualDayToggle(day)}
                              className="border-white/20 data-[state=checked]:bg-blue-500/30"
                            />
                            <Label htmlFor={`day-${day}`} className="text-secondary-white text-sm">
                              {day.slice(0, 3)}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-secondary-white">Usual Time</Label>
                      <div className="flex gap-2 mt-2">
                        <Select
                          value={smartSorterUsualTime.hour}
                          onValueChange={(value) => setSmartSorterUsualTime((prev) => ({ ...prev, hour: value }))}
                        >
                          <SelectTrigger className="glass-input text-primary-white w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="glass-dropdown">
                            {Array.from({ length: 12 }, (_, i) => (
                              <SelectItem
                                key={i + 1}
                                value={String(i + 1)}
                                className="text-primary-white hover:bg-white/10"
                              >
                                {i + 1}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={smartSorterUsualTime.minute}
                          onValueChange={(value) => setSmartSorterUsualTime((prev) => ({ ...prev, minute: value }))}
                        >
                          <SelectTrigger className="glass-input text-primary-white w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="glass-dropdown">
                            {["00", "15", "30", "45"].map((minute) => (
                              <SelectItem key={minute} value={minute} className="text-primary-white hover:bg-white/10">
                                {minute}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={smartSorterUsualTime.period}
                          onValueChange={(value) =>
                            setSmartSorterUsualTime((prev) => ({ ...prev, period: value as "AM" | "PM" }))
                          }
                        >
                          <SelectTrigger className="glass-input text-primary-white w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="glass-dropdown">
                            <SelectItem value="AM" className="text-primary-white hover:bg-white/10">
                              AM
                            </SelectItem>
                            <SelectItem value="PM" className="text-primary-white hover:bg-white/10">
                              PM
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label className="text-secondary-white">Duration of Session</Label>
                      <Select value={smartSorterDuration} onValueChange={setSmartSorterDuration}>
                        <SelectTrigger className="glass-input text-primary-white mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="glass-dropdown">
                          <SelectItem value="30min" className="text-primary-white hover:bg-white/10">
                            30 minutes
                          </SelectItem>
                          <SelectItem value="45min" className="text-primary-white hover:bg-white/10">
                            45 minutes
                          </SelectItem>
                          <SelectItem value="1h" className="text-primary-white hover:bg-white/10">
                            1 hour
                          </SelectItem>
                          <SelectItem value="1.5h" className="text-primary-white hover:bg-white/10">
                            1.5 hours
                          </SelectItem>
                          <SelectItem value="2h" className="text-primary-white hover:bg-white/10">
                            2 hours
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-secondary-white">Paste Student Lists</Label>
                      <Textarea
                        value={smartSorterStudentList}
                        onChange={(e) => setSmartSorterStudentList(e.target.value)}
                        placeholder="Type or paste names here (comma, space, or new line)"
                        className="glass-input text-primary-white placeholder:text-tertiary-white min-h-[120px] mt-2"
                      />
                      <p className="text-tertiary-white text-xs mt-1">
                        Enter student names separated by commas, spaces, or new lines
                      </p>
                    </div>

                    {smartSorterPreview && (
                      <Card className="glass-card border-blue-500/30">
                        <CardContent className="p-4">
                          <h4 className="text-primary-white font-medium mb-3">Preview Changes</h4>
                          <div className="space-y-2 text-sm">
                            <p className="text-secondary-white">
                              <span className="text-blue-400">Group:</span> {smartSorterPreview.group.name}
                            </p>
                            <p className="text-secondary-white">
                              <span className="text-blue-400">Days:</span>{" "}
                              {formatDayDisplay(smartSorterPreview.group.dayOfWeek)}
                            </p>
                            <p className="text-secondary-white">
                              <span className="text-blue-400">Time:</span> {smartSorterPreview.group.time}
                            </p>
                            <p className="text-secondary-white">
                              <span className="text-blue-400">Duration:</span> {smartSorterPreview.group.duration}
                            </p>
                            <p className="text-secondary-white">
                              <span className="text-blue-400">Students to add:</span>{" "}
                              {smartSorterPreview.students.length}
                            </p>
                            <div className="text-tertiary-white text-xs">
                              {smartSorterPreview.students.map((s) => s.name).join(", ")}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <div className="flex gap-2">
                      <Button
                        onClick={handleSmartSorterPreview}
                        disabled={!smartSorterGroupName.trim() || !smartSorterStudentList.trim()}
                        className="glass-button text-primary-white flex-1"
                      >
                        Preview Changes
                      </Button>
                      {smartSorterPreview && (
                        <Button
                          onClick={handleSmartSorterConfirm}
                          className="glass-button text-primary-white bg-blue-500/20 border-blue-500/30 flex-1"
                        >
                          Confirm
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Search Page */}
          {activeTab === "search" && currentProfile && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center gap-2 mb-6">
                <Search className="h-5 w-5 text-primary-white" />
                <h2 className="text-primary-white text-xl font-semibold">Student Search</h2>
              </div>

              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-tertiary-white" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search student by name"
                      className="glass-input text-primary-white placeholder:text-tertiary-white pl-10"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Search Results */}
              <div className="space-y-3">
                {filteredAndSortedStudents.length === 0 ? (
                  <Card className="glass-card">
                    <CardContent className="p-6 text-center">
                      <p className="text-secondary-white">
                        {searchTerm ? "No students match your search" : "Start typing to search students"}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredAndSortedStudents.map((student) => {
                    const studentGroups = getStudentGroups(student.id)
                    const isExpanded = expandedCards[`search-${student.id}`]

                    return (
                      <Card
                        key={student.id}
                        className="glass-card cursor-pointer hover:bg-white/5 transition-colors"
                        onClick={() => toggleCardExpansion(`search-${student.id}`)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-primary-white text-lg">{student.name}</h3>
                              <div className="text-sm text-secondary-white">
                                {studentGroups.map((g) => g.name).join(", ") || "No groups"}
                              </div>
                            </div>
                            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                              <StudentDialog
                                profileData={currentProfile}
                                onUpdateProfile={updateProfile}
                                student={student}
                              >
                                <Button size="sm" className="glass-button text-primary-white">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </StudentDialog>
                              <Button
                                size="sm"
                                onClick={() => deleteStudent(student.id)}
                                className="glass-delete-button"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="mt-4 pt-4 border-t border-white/10">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                                  <User className="h-6 w-6 text-blue-400" />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <p className="text-sm text-secondary-white">
                                    Prepaid: {student.prepaidSessions} • Remaining: {student.remainingSessions} • Make-ups: {student.makeupSessions}
                                    {student.sessionHistory && student.sessionHistory.length > 0 && (
                                      <span className="ml-2 text-xs text-tertiary-white">
                                        • Last: {student.sessionHistory[student.sessionHistory.length - 1].date}
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>

                              {studentGroups.length > 0 && (
                                <div>
                                  <p className="text-secondary-white text-sm mb-2 flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    Groups ({studentGroups.length})
                                  </p>
                                  <div className="space-y-2">
                                    {studentGroups.map((group) => (
                                      <div key={group.id} className="bg-white/5 rounded p-2">
                                        <div className="flex justify-between items-center">
                                          <span className="text-primary-white font-medium">{group.name}</span>
                                          <span className="text-secondary-white text-sm">
                                            {formatDayDisplay(group.dayOfWeek)} {group.time}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })
                )}
              </div>
            </div>
          )}

          {/* Make-Up Page */}
          {activeTab === "makeup" && currentProfile && (
            <div className="space-y-4 sm:space-y-6">
                              <div className="flex items-center gap-2 mb-4 sm:mb-6">
                  <Clock className="h-5 w-5 text-primary-white" />
                <h2 className="text-primary-white text-xl font-semibold">Make-Up Sessions</h2>
              </div>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-primary-white">Pending Make-Up Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  {!currentProfile.makeupSessions || currentProfile.makeupSessions.length === 0 ? (
                    <p className="text-secondary-white text-center py-8">No pending make-up sessions.</p>
                  ) : (
                    <div className="space-y-3">
                      {currentProfile.makeupSessions.map((makeup) => {
                        const student = currentProfile.students.find((s) => s.id === makeup.studentId)
                        const group = currentProfile.groups.find((g) => g.id === makeup.originalGroupId)
                        const isExpanded = expandedCards[`makeup-${makeup.id}`]

                        return (
                          <div
                            key={makeup.id}
                            className="glass-card p-4 cursor-pointer hover:bg-white/5 transition-colors"
                            onClick={() => toggleCardExpansion(`makeup-${makeup.id}`)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold text-primary-white text-lg">
                                  {student?.name || "Unknown Student"}
                                </h3>
                                <p className="text-sm text-secondary-white">{group?.name || "Unknown Group"}</p>
                                <p className="text-xs text-tertiary-white">{makeup.originalDate}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {/* Confirm first, then Delete (requested order) */}
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    completeMakeupSession(makeup.id)
                                  }}
                                  size="sm"
                                  className="glass-button text-primary-white bg-green-500/20 border-green-500/30"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    deletePendingMakeup(makeup.id)
                                  }}
                                  size="sm"
                                  className="glass-delete-button"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="mt-4 pt-4 border-t border-white/10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-secondary-white">Group:</span>
                                      <span className="text-primary-white">{group?.name || "Unknown Group"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-secondary-white">Time:</span>
                                      <span className="text-primary-white">{group?.time || "Not specified"}</span>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-secondary-white">Duration:</span>
                                      <span className="text-primary-white">{group?.duration || "Not specified"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-secondary-white">Original Date:</span>
                                      <span className="text-primary-white">{makeup.originalDate}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-primary-white">Completed Make-Up History</CardTitle>
                </CardHeader>
                <CardContent>
                  {!currentProfile.completedMakeupSessions || currentProfile.completedMakeupSessions.length === 0 ? (
                    <p className="text-secondary-white text-center py-8">No completed make-up sessions yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {currentProfile.completedMakeupSessions.map((makeup) => {
                        const student = currentProfile.students.find((s) => s.id === makeup.studentId)
                        const group = currentProfile.groups.find((g) => g.id === makeup.originalGroupId)
                        const isExpanded = expandedCards[`completed-makeup-${makeup.id}`]

                        return (
                          <div
                            key={makeup.id}
                            className="glass-card p-4 border-green-500/20 cursor-pointer hover:bg-white/5 transition-colors"
                            onClick={() => toggleCardExpansion(`completed-makeup-${makeup.id}`)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold text-primary-white text-lg">
                                  {student?.name || "Unknown Student"}
                                </h3>
                                <p className="text-sm text-secondary-white">{group?.name || "Unknown Group"}</p>
                                <p className="text-sm text-green-400 font-medium">
                                  ✅ Completed: {makeup.completedDate && !isNaN(new Date(makeup.completedDate).getTime())
                                    ? format(new Date(makeup.completedDate), "MMM dd, yyyy 'at' h:mm a")
                                    : "Invalid Date"}
                                </p>
                              </div>
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteCompletedMakeup(makeup.id)
                                }}
                                size="sm"
                                className="glass-delete-button"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            {isExpanded && (
                              <div className="mt-4 pt-4 border-t border-white/10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-secondary-white">Group:</span>
                                      <span className="text-primary-white">{group?.name || "Unknown"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-secondary-white">Time:</span>
                                      <span className="text-primary-white">{group?.time || "Not specified"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-secondary-white">Duration:</span>
                                      <span className="text-primary-white">{group?.duration || "Not specified"}</span>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-secondary-white">Original Absence:</span>
                                      <span className="text-primary-white">{makeup.originalDate}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-secondary-white">Status:</span>
                                      <span className="text-green-400 flex items-center">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Completed
                                      </span>
                                    </div>
                                    {makeup.completedNotes && (
                                      <div className="col-span-2">
                                        <span className="text-secondary-white">Notes:</span>
                                        <p className="text-primary-white mt-1">{makeup.completedNotes}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === "reports" && currentProfile && (
            <div className="space-y-4 sm:space-y-6">
                              <div className="flex items-center gap-2 mb-4 sm:mb-6">
                <BarChart3 className="h-5 w-5 text-primary-white" />
                <h2 className="text-primary-white text-xl font-semibold">Reports & Analytics</h2>
              </div>

              {/* Report Tabs */}
              <div className="flex gap-1 glass-card p-1">
                <Button
                  onClick={() => {
                    setReportType("attendance")
                    setShowArchivedTerms(false)
                  }}
                  className={cn(
                    "flex-1 text-primary-white",
                    !showArchivedTerms ? "bg-white/20" : "bg-transparent hover:bg-white/10",
                  )}
                >
                  Sessions
                </Button>
                <Button
                  onClick={() => {
                    setShowArchivedTerms(true)
                    setReportType("attendance")
                  }}
                  className={cn(
                    "flex-1 text-primary-white",
                    showArchivedTerms ? "bg-white/20" : "bg-transparent hover:bg-white/10",
                  )}
                >
                  <Archive className="h-4 w-4 mr-1" />
                  Terms
                </Button>
              </div>

              {!showArchivedTerms && (
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="text-primary-white">Session History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {currentProfile.attendanceRecords.length === 0 ? (
                      <p className="text-secondary-white text-center py-8">No session records yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {getSessionHistory.map((session, index) => {
                          const presentCount = (session.records ?? []).filter((r: any) => r.status === "present").length
                          const absentCount = (session.records ?? []).filter((r: any) => r.status === "absent").length
                          const cancelledCount = (session.records ?? []).filter((r: any) => r.status === "canceled").length
                          const isExpanded = expandedCards[`session-${index}`]

                            return (
                              <div
                                key={index}
                                className={cn(
                                  "glass-card p-4 cursor-pointer hover:bg-white/5 transition-colors",
                                  session.isCancelled && "border-red-500/50 border-2",
                                )}
                                onClick={() => toggleCardExpansion(`session-${index}`)}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <h3 className="font-semibold text-primary-white text-lg">
                                      {session.groupName}
                                      {session.isCancelled && (
                                        <span className="ml-2 text-red-400 text-sm">(CANCELLED)</span>
                                      )}
                                    </h3>
                                    <p className="text-sm text-secondary-white">
                                      {session.date && !isNaN(new Date(session.date).getTime()) 
                                        ? format(new Date(session.date), "MMM dd, yyyy") 
                                        : "Invalid Date"} at {session.time}
                                    </p>
                                    <div className="text-xs text-tertiary-white mt-1">
                                      {cancelledCount > 0 ? (
                                        <span className="text-red-400">Session cancelled ({cancelledCount} students)</span>
                                      ) : (
                                        <>
                                          Present: {presentCount} | Absent: {absentCount}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-2 ml-2">
                                    <Button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        exportSessionData(session)
                                      }}
                                      size="sm"
                                      className="glass-button text-primary-white"
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        // Remove session records from attendanceRecords
                                        const updatedAttendanceRecords = (currentProfile.attendanceRecords ?? []).filter(
                                          (record) => !(record.date === session.date && record.groupId === session.groupId && record.time === session.time)
                                        )
                                        updateProfile({
                                          ...currentProfile,
                                          attendanceRecords: updatedAttendanceRecords,
                                        })
                                        toast("🗑️ Session deleted successfully", "success")
                                      }}
                                      size="sm"
                                      className="glass-delete-button"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>

                                {isExpanded && (
                                  <div className="mt-4 pt-4 border-t border-white/10">
                                    <div className="space-y-3">
                                      <h4 className="text-primary-white font-medium">Student Attendance:</h4>
                                      <div className="space-y-2">
                                        {session.records.map((record: any, recordIndex: number) => {
                                          const student = currentProfile.students.find((s) => s.id === record.studentId)
                                          return (
                                            <div
                                              key={recordIndex}
                                              className="flex justify-between items-center bg-white/5 rounded p-2"
                                            >
                                              <span className="text-primary-white">{student?.name || "Unknown"}</span>
                                              <div className="flex flex-col items-end gap-1">
                                                <Badge
                                                  className={
                                                    record.status === "present"
                                                      ? "bg-green-500/20 text-green-300 border-green-400/30"
                                                      : record.status === "absent"
                                                        ? "bg-red-500/20 text-red-300 border-red-400/30"
                                                        : record.status === "canceled"
                                                          ? "bg-red-500/20 text-red-300 border-red-400/30"
                                                          : "bg-gray-500/20 text-gray-300 border-gray-400/30"
                                                  }
                                                >
                                                  {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                                                </Badge>
                                                {record.timeAdjustmentAmount && record.timeAdjustmentType && (
                                                  <div className="text-xs text-blue-400 bg-blue-500/10 rounded px-2 py-1">
                                                    <div className="font-medium">
                                                      {record.timeAdjustmentType === "more" ? "+" : "-"}{record.timeAdjustmentAmount}
                                                    </div>
                                                    {record.timeAdjustmentReason && (
                                                      <div className="text-blue-300/80 text-[10px]">
                                                        {record.timeAdjustmentReason}
                                                      </div>
                                                    )}
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          )
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {showArchivedTerms && (
                <div className="space-y-4">
                  <Card className="glass-card">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-primary-white">Term Management</CardTitle>
                        <TermFinalizationDialogWrapper onFinalize={finalizeTerm} buttonText="Finalize Current Term" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      {currentProfile.archivedTerms.length === 0 ? (
                        <p className="text-secondary-white text-center py-8">No finalized terms yet.</p>
                      ) : (
                        <div className="space-y-3">
                          {currentProfile.archivedTerms.map((term) => (
                            <div key={term.id} className="glass-card p-4">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h3 className="font-semibold text-primary-white">{term.name}</h3>
                                  <p className="text-sm text-secondary-white">
                                    {term.startMonth} - {term.endMonth} {term.year}
                                  </p>
                                  <div className="text-xs text-tertiary-white mt-1">
                                    {term.attendanceRecords.length} sessions • {term.studentSnapshot.length} students
                                  </div>
                                  <p className="text-xs text-tertiary-white">
                                    Finalized: {term.finalizedDate && !isNaN(new Date(term.finalizedDate).getTime())
                                      ? format(new Date(term.finalizedDate), "MMM dd, yyyy")
                                      : "Invalid Date"}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => exportArchivedTerm(term)}
                                    size="sm"
                                    className="glass-button text-primary-white"
                                  >
                                    <Download className="h-3 w-3 mr-1" />
                                    Export
                                  </Button>
                                  <Button
                                    onClick={() => deleteArchivedTerm(term.id)}
                                    size="sm"
                                    className="glass-delete-button"
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}


            </div>
          )}
        </div>
      </motion.div>

      {/* Create Profile Dialog */}
      <Dialog 
        open={showCreateProfile} 
        onOpenChange={(open) => {
          // Only allow closing if there are profiles (not when forced to create first profile)
          if (profiles.length > 0 || !open) {
            setShowCreateProfile(open)
          }
        }}
      >
        <DialogContent className="glass-dropdown w-[95vw] max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-primary-white">Create New Coach Profile</DialogTitle>
            <DialogDescription className="text-secondary-white">
              {profiles.length === 0 
                ? "Welcome! Create your first coach profile to get started." 
                : "Fill in the details and click Create Profile."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="form-field">
              <Label htmlFor="new-profile-name" className="text-secondary-white">
                Coach Name
              </Label>
              <Input
                id="new-profile-name"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                placeholder="Enter coach name"
                className="glass-input text-primary-white placeholder:text-tertiary-white mt-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newProfileName.trim()) {
                    createProfile()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter className="form-buttons flex-col sm:flex-row gap-2">
            {profiles.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setShowCreateProfile(false)}
                className="glass-button text-primary-white min-h-[48px] w-full sm:w-auto"
              >
                Cancel
              </Button>
            )}
            <Button
              onClick={createProfile}
              disabled={!newProfileName.trim()}
              className="glass-button text-primary-white min-h-[48px] w-full sm:w-auto"
            >
              Create Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
        <DialogContent className="glass-dropdown w-[95vw] max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-primary-white">Edit Coach Profile</DialogTitle>
            <DialogDescription className="text-secondary-white">Update the profile name.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="form-field">
              <Label htmlFor="edit-profile-name" className="text-secondary-white">
                Coach Name
              </Label>
              <Input
                id="edit-profile-name"
                value={editProfileName}
                onChange={(e) => setEditProfileName(e.target.value)}
                placeholder="Enter coach name"
                className="glass-input text-primary-white placeholder:text-tertiary-white mt-1"
              />
            </div>
          </div>
          <DialogFooter className="form-buttons flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowEditProfile(false)}
              className="glass-button text-primary-white min-h-[48px] w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={editProfile}
              disabled={!editProfileName.trim()}
              className="glass-button text-primary-white min-h-[48px] w-full sm:w-auto"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating Bottom Navigation */}
      <MenuBar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Performance Monitor - Development Only */}
      <PerformanceMonitor />
    </div>
  )
}
