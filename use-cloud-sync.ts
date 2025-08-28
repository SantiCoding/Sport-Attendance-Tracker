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
  timeAdjustmentAmount?: string
  timeAdjustmentType?: "more" | "less"
  timeAdjustmentReason?: string
  cancelReason?: string
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

interface MakeupSession {
  id: string
  studentId: string
  originalDate?: string
  originalGroupId?: string
  reason: string
  notes: string
  createdDate: string
  status: "pending" | "completed"
  completedDate?: string
}

interface CoachProfile {
  id: string
  name: string
  students: Student[]
  groups: Group[]
  attendanceRecords: AttendanceRecord[]
  archivedTerms: ArchivedTerm[]
  completedMakeupSessions: CompletedMakeupSession[]
  makeupSessions: MakeupSession[]
}

export function useCloudSync(user: User | null) {
  const [syncing, setSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)

  // Generate a proper UUID v4
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Migrate old timestamp-based IDs to proper UUIDs
  const migrateOldIds = (profiles: CoachProfile[]): CoachProfile[] => {
    const idMap = new Map<string, string>()
    
    return profiles.map(profile => {
      // Check if profile ID needs migration - only migrate if it's a timestamp-based ID
      const needsMigration = profile.id.startsWith('profile_') || 
                           profile.id.startsWith('student_') || 
                           profile.id.startsWith('group_') ||
                           profile.id.startsWith('attendance_') ||
                           profile.id.startsWith('makeup_') ||
                           profile.id.startsWith('term_')
      
      // If profile already has a proper UUID, don't migrate it
      if (!needsMigration) {
        console.log("✅ Profile already has proper UUID, skipping migration:", profile.name)
        return profile
      }
      
      if (needsMigration) {
        const newProfileId = generateUUID()
        idMap.set(profile.id, newProfileId)
        
        // Migrate profile
        const migratedProfile = {
          ...profile,
          id: newProfileId,
          students: profile.students.map(student => {
            const newStudentId = generateUUID()
            idMap.set(student.id, newStudentId)
            
            return {
              ...student,
              id: newStudentId
            }
          }),
          groups: profile.groups.map(group => {
            const newGroupId = generateUUID()
            idMap.set(group.id, newGroupId)
            
            return {
              ...group,
              id: newGroupId,
              studentIds: group.studentIds.map(oldId => idMap.get(oldId) || oldId)
            }
          }),
          attendanceRecords: profile.attendanceRecords.map(record => ({
            ...record,
            id: generateUUID(),
            studentId: idMap.get(record.studentId) || record.studentId,
            groupId: idMap.get(record.groupId) || record.groupId
          })),
          makeupSessions: profile.makeupSessions.map(session => ({
            ...session,
            id: generateUUID(),
            studentId: idMap.get(session.studentId) || session.studentId,
            originalGroupId: idMap.get(session.originalGroupId) || session.originalGroupId
          })),
          completedMakeupSessions: profile.completedMakeupSessions.map(session => ({
            ...session,
            id: generateUUID(),
            studentId: idMap.get(session.studentId) || session.studentId,
            groupId: idMap.get(session.groupId) || session.groupId
          })),
          archivedTerms: profile.archivedTerms.map(term => ({
            ...term,
            id: generateUUID(),
            attendanceRecords: term.attendanceRecords.map(record => ({
              ...record,
              id: generateUUID(),
              studentId: idMap.get(record.studentId) || record.studentId,
              groupId: idMap.get(record.groupId) || record.groupId
            })),
            studentSnapshot: term.studentSnapshot.map(student => ({
              ...student,
              id: idMap.get(student.id) || student.id
            })),
            groupSnapshot: term.groupSnapshot.map(group => ({
              ...group,
              id: idMap.get(group.id) || group.id,
              studentIds: group.studentIds.map(oldId => idMap.get(oldId) || oldId)
            }))
          }))
        }
        
        console.log("🔄 Migrated profile:", profile.name, "from", profile.id, "to", newProfileId)
        return migratedProfile
      }
      
      return profile
    })
  }

  // Load data from cloud with optimized parallel queries
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

      if (!profiles || profiles.length === 0) {
        return []
      }

      const cloudProfiles: CoachProfile[] = []

      // Load all data for all profiles in parallel for better performance
      const profileIds = profiles.map(p => p.id)
      
      // Parallel queries for better performance
      const [
        { data: allStudents, error: studentsError },
        { data: allGroups, error: groupsError },
        { data: allAttendanceRecords, error: attendanceError },
        { data: allArchivedTerms, error: archivedError },
        { data: allCompletedMakeups, error: makeupError }
      ] = await Promise.all([
        supabase.from("students").select("*").in("profile_id", profileIds),
        supabase.from("groups").select("*").in("profile_id", profileIds),
        supabase.from("attendance_records").select("*").in("profile_id", profileIds),
        supabase.from("archived_terms").select("*").in("profile_id", profileIds),
        supabase.from("completed_makeup_sessions").select("*").in("profile_id", profileIds)
      ])

      if (studentsError) throw studentsError
      if (groupsError) throw groupsError
      if (attendanceError) throw attendanceError
      if (archivedError) throw archivedError
      if (makeupError) throw makeupError

      // Try to load makeup sessions (if table exists). Cache absence to avoid repeated 404s.
      let allMakeupSessions: any[] = []
      const MAKEUP_FLAG = 'app:has_makeup_sessions'
      const shouldQueryMakeup = typeof window === 'undefined' 
        ? true 
        : (localStorage.getItem(MAKEUP_FLAG) !== 'false')
      if (shouldQueryMakeup) {
        try {
          const { data: makeupData, error: makeupSessionsError, status } = await supabase
            .from("makeup_sessions")
            .select("*")
            .in("profile_id", profileIds)
          
          if (!makeupSessionsError && makeupData) {
            allMakeupSessions = makeupData
            try { localStorage.setItem(MAKEUP_FLAG, 'true') } catch {}
          } else if ((makeupSessionsError as any)?.status === 404 || status === 404) {
            // Table missing – remember to skip next time
            try { localStorage.setItem(MAKEUP_FLAG, 'false') } catch {}
            console.log("Makeup sessions table not found (404). Skipping future queries.")
          }
        } catch (e: any) {
          // If network or 404 at fetch level, cache 'false' to avoid future noisy requests
          try { localStorage.setItem(MAKEUP_FLAG, 'false') } catch {}
          console.log("Makeup sessions table not available, using empty array")
        }
      }

      // Group data by profile_id for efficient lookup
      const studentsByProfile = new Map<string, any[]>()
      const groupsByProfile = new Map<string, any[]>()
      const attendanceByProfile = new Map<string, any[]>()
      const archivedByProfile = new Map<string, any[]>()
      const completedMakeupsByProfile = new Map<string, any[]>()
      const makeupSessionsByProfile = new Map<string, any[]>()

      ;(allStudents || []).forEach(s => {
        const profileId = s.profile_id
        if (!studentsByProfile.has(profileId)) studentsByProfile.set(profileId, [])
        studentsByProfile.get(profileId)!.push(s)
      })

      ;(allGroups || []).forEach(g => {
        const profileId = g.profile_id
        if (!groupsByProfile.has(profileId)) groupsByProfile.set(profileId, [])
        groupsByProfile.get(profileId)!.push(g)
      })

      ;(allAttendanceRecords || []).forEach(a => {
        const profileId = a.profile_id
        if (!attendanceByProfile.has(profileId)) attendanceByProfile.set(profileId, [])
        attendanceByProfile.get(profileId)!.push(a)
      })

      ;(allArchivedTerms || []).forEach(t => {
        const profileId = t.profile_id
        if (!archivedByProfile.has(profileId)) archivedByProfile.set(profileId, [])
        archivedByProfile.get(profileId)!.push(t)
      })

      ;(allCompletedMakeups || []).forEach(m => {
        const profileId = m.profile_id
        if (!completedMakeupsByProfile.has(profileId)) completedMakeupsByProfile.set(profileId, [])
        completedMakeupsByProfile.get(profileId)!.push(m)
      })

      ;(allMakeupSessions || []).forEach(m => {
        const profileId = m.profile_id
        if (!makeupSessionsByProfile.has(profileId)) makeupSessionsByProfile.set(profileId, [])
        makeupSessionsByProfile.get(profileId)!.push(m)
      })

      // Build profiles with grouped data
      for (const profile of profiles) {
        const students = studentsByProfile.get(profile.id) || []
        const groups = groupsByProfile.get(profile.id) || []
        const attendanceRecords = attendanceByProfile.get(profile.id) || []
        const archivedTerms = archivedByProfile.get(profile.id) || []
        const completedMakeups = completedMakeupsByProfile.get(profile.id) || []
        const makeupSessions = makeupSessionsByProfile.get(profile.id) || []

        // Transform data to match local format
        const cloudProfile: CoachProfile = {
          id: profile.id,
          name: profile.name,
          students: (students || []).map((s) => ({
            id: s.id,
            name: s.name,
            notes: s.notes,
            prepaidSessions: s.prepaid_sessions,
            remainingSessions: s.remaining_sessions || s.prepaid_sessions, // Use remaining_sessions if available, fallback to prepaid_sessions
            makeupSessions: s.makeup_sessions,
            sessionHistory: s.session_history || [],
          })),
          groups: (groups || []).map((g) => ({
            id: g.id,
            name: g.name,
            type: g.type,
            studentIds: g.student_ids || [],
            dayOfWeek: g.day_of_week ? (g.day_of_week.includes(',') ? g.day_of_week.split(',') : g.day_of_week) : undefined,
            time: g.time || undefined,
            duration: g.duration || undefined,
          })),
          attendanceRecords: (attendanceRecords || []).map((a) => ({
            id: a.id,
            date: a.date,
            time: a.time,
            groupId: a.group_id,
            studentId: a.student_id,
            status: a.status,
            notes: a.notes,
            timeAdjustmentAmount: a.time_adjustment_amount || undefined,
            timeAdjustmentType: a.time_adjustment_type as "more" | "less" || undefined,
            timeAdjustmentReason: a.time_adjustment_reason || undefined,
            cancelReason: a.cancel_reason || undefined,
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
          makeupSessions: (makeupSessions || []).map((m) => ({
            id: m.id,
            studentId: m.student_id,
            originalDate: m.original_date,
            originalGroupId: m.original_group_id,
            reason: m.reason,
            notes: m.notes,
            createdDate: m.created_date,
            status: m.status,
            scheduledDate: m.scheduled_date,
            scheduledTime: m.scheduled_time,
            scheduledGroupId: m.scheduled_group_id,
            completedDate: m.completed_date,
            completedNotes: m.completed_notes,
            originalTime: m.original_time,
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

    // Migrate old IDs to proper UUIDs
    const migratedProfiles = migrateOldIds(profiles)
    if (migratedProfiles.length !== profiles.length) {
      console.log("🔄 Data migration completed - old timestamp IDs converted to UUIDs")
    }

    console.log("🔄 Starting cloud save...", { 
      userEmail: user.email, 
      profilesCount: migratedProfiles.length 
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
      // Batch save all profiles for better performance
      const profileUpserts = migratedProfiles.map(profile => ({
        id: profile.id,
        user_id: user.id,
        name: profile.name,
        updated_at: new Date().toISOString(),
      }))

      // Upsert all profiles in one batch
      const { error: profileError } = await supabase.from("coach_profiles").upsert(profileUpserts)
      if (profileError) {
        console.error("❌ Profile batch save error:", profileError)
        throw profileError
      }
      console.log("✅ All profiles saved successfully")

      // Clear all existing data for all profiles in parallel
      const profileIds = migratedProfiles.map(p => p.id)
      await Promise.all([
        supabase.from("students").delete().in("profile_id", profileIds),
        supabase.from("groups").delete().in("profile_id", profileIds),
        supabase.from("attendance_records").delete().in("profile_id", profileIds),
        supabase.from("completed_makeup_sessions").delete().in("profile_id", profileIds)
      ])

      // Prepare all data for batch insertion
      const allStudents = migratedProfiles.flatMap(profile => 
        profile.students.map((s) => ({
          id: s.id,
          profile_id: profile.id,
          name: s.name,
          notes: s.notes,
          prepaid_sessions: s.prepaidSessions,
          remaining_sessions: s.remainingSessions,
          makeup_sessions: s.makeupSessions,
          session_history: s.sessionHistory || [],
        }))
      )

      const allGroups = migratedProfiles.flatMap(profile => 
        profile.groups.map((g) => ({
          id: g.id,
          profile_id: profile.id,
          name: g.name,
          type: g.type,
          student_ids: g.studentIds,
          day_of_week: Array.isArray(g.dayOfWeek) ? g.dayOfWeek.join(',') : g.dayOfWeek,
          time: g.time,
          duration: g.duration,
        }))
      )

      const allAttendanceRecords = migratedProfiles.flatMap(profile => 
        profile.attendanceRecords.map((a) => ({
          id: a.id,
          profile_id: profile.id,
          date: a.date,
          time: a.time,
          group_id: a.groupId,
          student_id: a.studentId,
          status: a.status,
          notes: a.notes,
          time_adjustment_amount: a.timeAdjustmentAmount,
          time_adjustment_type: a.timeAdjustmentType,
          time_adjustment_reason: a.timeAdjustmentReason,
          cancel_reason: a.cancelReason,
        }))
      )

      const allCompletedMakeups = migratedProfiles.flatMap(profile => 
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
        }))
      )

      // Batch insert all data in parallel
      const insertPromises = []
      
      if (allStudents.length > 0) {
        insertPromises.push(supabase.from("students").insert(allStudents))
      }
      
      if (allGroups.length > 0) {
        insertPromises.push(supabase.from("groups").insert(allGroups))
      }
      
      if (allAttendanceRecords.length > 0) {
        insertPromises.push(supabase.from("attendance_records").insert(allAttendanceRecords))
      }
      
      if (allCompletedMakeups.length > 0) {
        insertPromises.push(supabase.from("completed_makeup_sessions").insert(allCompletedMakeups))
      }

      // Execute all insertions in parallel
      const insertResults = await Promise.all(insertPromises)
      
      // Check for errors
      for (const result of insertResults) {
        if (result.error) {
          console.error("❌ Batch insert error:", result.error)
          throw result.error
        }
      }

      // Handle archived terms for all profiles
      for (const profile of migratedProfiles) {
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
