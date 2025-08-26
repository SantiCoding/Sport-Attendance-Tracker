"use client"

import { useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase, isSupabaseConfigured } from "./supabase"

// Types
interface Student {
  id: string
  name: string
  notes: string
  prepaidSessions: number
  makeupSessions: number
}

interface Group {
  id: string
  name: string
  type: "group" | "private"
  studentIds: string[]
}

interface AttendanceRecord {
  id: string
  date: string
  time: string
  groupId: string
  studentId: string
  status: "present" | "absent"
  notes: string
}

interface CompletedMakeupSession {
  id: string
  studentId: string
  studentName: string
  date: string
  groupId?: string
  groupName?: string
  type: "group" | "private"
  completedDate: string
}

interface ArchivedTerm {
  id: string
  name: string
  startMonth: string
  endMonth: string
  year: string
  attendanceRecords: AttendanceRecord[]
  studentSnapshot: Student[]
  groupSnapshot: Group[]
  completedMakeupSessions: CompletedMakeupSession[]
  finalizedDate: string
}

interface CoachProfile {
  id: string
  name: string
  students: Student[]
  groups: Group[]
  attendanceRecords: AttendanceRecord[]
  archivedTerms: ArchivedTerm[]
  completedMakeupSessions: CompletedMakeupSession[]
}

export function useCloudSync(user: User | null) {
  const [syncing, setSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)

  // Load data from cloud
  const loadFromCloud = async (): Promise<CoachProfile[]> => {
    if (!user || !isSupabaseConfigured) return []

    setSyncing(true)
    try {
      // Load coach profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("coach_profiles")
        .select("*")
        .eq("user_id", user.id)

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError)
        return []
      }

      const cloudProfiles: CoachProfile[] = []

      for (const profile of profiles || []) {
        // Load students
        const { data: students, error: studentsError } = await supabase
          .from("students")
          .select("*")
          .eq("profile_id", profile.id)

        if (studentsError) throw studentsError

        // Load groups
        const { data: groups, error: groupsError } = await supabase
          .from("groups")
          .select("*")
          .eq("profile_id", profile.id)

        if (groupsError) throw groupsError

        // Load attendance records
        const { data: attendanceRecords, error: attendanceError } = await supabase
          .from("attendance_records")
          .select("*")
          .eq("profile_id", profile.id)

        if (attendanceError) throw attendanceError

        // Load archived terms
        const { data: archivedTerms, error: archivedError } = await supabase
          .from("archived_terms")
          .select("*")
          .eq("profile_id", profile.id)

        if (archivedError) throw archivedError

        // Load completed makeup sessions
        const { data: completedMakeups, error: makeupError } = await supabase
          .from("completed_makeup_sessions")
          .select("*")
          .eq("profile_id", profile.id)

        if (makeupError) throw makeupError

        // Transform data to match local format
        const cloudProfile: CoachProfile = {
          id: profile.id,
          name: profile.name,
          students: (students || []).map((s) => ({
            id: s.id,
            name: s.name,
            notes: s.notes,
            prepaidSessions: s.prepaid_sessions,
            makeupSessions: s.makeup_sessions,
          })),
          groups: (groups || []).map((g) => ({
            id: g.id,
            name: g.name,
            type: g.type,
            studentIds: g.student_ids || [],
          })),
          attendanceRecords: (attendanceRecords || []).map((a) => ({
            id: a.id,
            date: a.date,
            time: a.time,
            groupId: a.group_id,
            studentId: a.student_id,
            status: a.status,
            notes: a.notes,
          })),
          archivedTerms: (archivedTerms || []).map((t) => ({
            id: t.id,
            name: t.name,
            startMonth: t.start_month,
            endMonth: t.end_month,
            year: t.year,
            attendanceRecords: t.attendance_records || [],
            studentSnapshot: t.student_snapshot || [],
            groupSnapshot: t.group_snapshot || [],
            completedMakeupSessions: t.completed_makeup_sessions || [],
            finalizedDate: t.finalized_date,
          })),
          completedMakeupSessions: (completedMakeups || []).map((m) => ({
            id: m.id,
            studentId: m.student_id,
            studentName: m.student_name,
            date: m.date,
            groupId: m.group_id,
            groupName: m.group_name,
            type: m.type,
            completedDate: m.completed_date,
          })),
        }

        cloudProfiles.push(cloudProfile)
      }

      setLastSyncTime(new Date())
      return cloudProfiles
    } catch (error) {
      console.error("Error loading from cloud:", error)
      return []
    } finally {
      setSyncing(false)
    }
  }

  // Save data to cloud
  const saveToCloud = async (profiles: CoachProfile[]) => {
    console.log("🚀 NEW VERSION DEPLOYED - Enhanced error logging active!")
    
    if (!user || !isSupabaseConfigured) {
      console.log("❌ Cannot save to cloud:", { user: !!user, isSupabaseConfigured })
      return
    }

    console.log("🔄 Starting cloud save...", { 
      userEmail: user.email, 
      profilesCount: profiles.length 
    })
    setSyncing(true)
    try {
      // Test database connection first
      console.log("🔍 Testing database connection...")
      const { data: testData, error: testError } = await supabase
        .from("coach_profiles")
        .select("count")
        .limit(1)
      
      if (testError) {
        console.error("❌ Database connection test failed:", testError)
      } else {
        console.log("✅ Database connection test successful")
      }
      for (const profile of profiles) {
        console.log("🔄 Saving profile:", { 
          profileId: profile.id, 
          profileName: profile.name,
          userId: user.id,
          isProfileIdValid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profile.id)
        })
        
        // Upsert coach profile
        const { error: profileError } = await supabase.from("coach_profiles").upsert({
          id: profile.id,
          user_id: user.id,
          name: profile.name,
          updated_at: new Date().toISOString(),
        })

        if (profileError) {
          console.error("❌ Profile save error details:", {
            message: profileError.message,
            details: profileError.details,
            hint: profileError.hint,
            code: profileError.code
          })
          console.error("❌ Profile data being sent:", {
            id: profile.id,
            user_id: user.id,
            name: profile.name,
            updated_at: new Date().toISOString(),
          })
          console.error("❌ Full error object:", JSON.stringify(profileError, null, 2))
          
          // Simple error logging that should definitely show up
          console.error("❌ ERROR MESSAGE:", profileError.message || "No message")
          console.error("❌ ERROR CODE:", profileError.code || "No code")
          console.error("❌ ERROR DETAILS:", profileError.details || "No details")
          
          throw profileError
        }
        console.log("✅ Profile saved successfully")

        // Clear existing data for this profile
        await supabase.from("students").delete().eq("profile_id", profile.id)
        await supabase.from("groups").delete().eq("profile_id", profile.id)
        await supabase.from("attendance_records").delete().eq("profile_id", profile.id)
        await supabase.from("completed_makeup_sessions").delete().eq("profile_id", profile.id)

        // Insert students
        if (profile.students.length > 0) {
          const { error: studentsError } = await supabase.from("students").insert(
            profile.students.map((s) => ({
              id: s.id,
              profile_id: profile.id,
              name: s.name,
              notes: s.notes,
              prepaid_sessions: s.prepaidSessions,
              makeup_sessions: s.makeupSessions,
            })),
          )

          if (studentsError) throw studentsError
        }

        // Insert groups
        if (profile.groups.length > 0) {
          const { error: groupsError } = await supabase.from("groups").insert(
            profile.groups.map((g) => ({
              id: g.id,
              profile_id: profile.id,
              name: g.name,
              type: g.type,
              student_ids: g.studentIds,
            })),
          )

          if (groupsError) throw groupsError
        }

        // Insert attendance records
        if (profile.attendanceRecords.length > 0) {
          const { error: attendanceError } = await supabase.from("attendance_records").insert(
            profile.attendanceRecords.map((a) => ({
              id: a.id,
              profile_id: profile.id,
              date: a.date,
              time: a.time,
              group_id: a.groupId,
              student_id: a.studentId,
              status: a.status,
              notes: a.notes,
            })),
          )

          if (attendanceError) throw attendanceError
        }

        // Insert completed makeup sessions
        if (profile.completedMakeupSessions.length > 0) {
          const { error: makeupError } = await supabase.from("completed_makeup_sessions").insert(
            profile.completedMakeupSessions.map((m) => ({
              id: m.id,
              profile_id: profile.id,
              student_id: m.studentId,
              student_name: m.studentName,
              date: m.date,
              group_id: m.groupId,
              group_name: m.groupName,
              type: m.type,
              completed_date: m.completedDate,
            })),
          )

          if (makeupError) throw makeupError
        }

        // Update archived terms
        await supabase.from("archived_terms").delete().eq("profile_id", profile.id)
        if (profile.archivedTerms.length > 0) {
          const { error: archivedError } = await supabase.from("archived_terms").insert(
            profile.archivedTerms.map((t) => ({
              id: t.id,
              profile_id: profile.id,
              name: t.name,
              start_month: t.startMonth,
              end_month: t.endMonth,
              year: t.year,
              attendance_records: t.attendanceRecords,
              student_snapshot: t.studentSnapshot,
              group_snapshot: t.groupSnapshot,
              completed_makeup_sessions: t.completedMakeupSessions,
              finalized_date: t.finalizedDate,
            })),
          )

          if (archivedError) throw archivedError
        }
      }

      setLastSyncTime(new Date())
    } catch (error) {
      console.error("Error saving to cloud:", error)
      throw error
    } finally {
      setSyncing(false)
    }
  }

  return {
    loadFromCloud,
    saveToCloud,
    syncing,
    lastSyncTime,
  }
}
