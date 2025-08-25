import { createClient } from "@supabase/supabase-js"

// Check if environment variables are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create a mock client or real client based on environment variables
export const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : createMockSupabaseClient()

// Mock client for when environment variables are not available
function createMockSupabaseClient() {
  console.warn("Supabase environment variables are missing. Using mock client that will only support local storage.")

  // Return a mock client that implements the necessary methods
  return {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({
        data: {
          subscription: {
            unsubscribe: () => {},
          },
        },
      }),
      signInWithOAuth: () =>
        Promise.resolve({
          data: { user: null, session: null },
          error: { message: "Auth not configured - Supabase environment variables are missing" },
        }),
      signOut: () => Promise.resolve({ error: null }),
    },
    from: () => ({
      select: () => ({
        eq: () => Promise.resolve({ data: [], error: null }),
      }),
      insert: () => Promise.resolve({ data: null, error: null }),
      upsert: () => Promise.resolve({ data: null, error: null }),
      delete: () => ({
        eq: () => Promise.resolve({ data: null, error: null }),
      }),
    }),
  }
}

// Check if Supabase is properly configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

// Types for database
export interface Database {
  public: {
    Tables: {
      coach_profiles: {
        Row: {
          id: string
          user_id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      students: {
        Row: {
          id: string
          profile_id: string
          name: string
          notes: string
          prepaid_sessions: number
          makeup_sessions: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          name: string
          notes?: string
          prepaid_sessions?: number
          makeup_sessions?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          name?: string
          notes?: string
          prepaid_sessions?: number
          makeup_sessions?: number
          created_at?: string
          updated_at?: string
        }
      }
      groups: {
        Row: {
          id: string
          profile_id: string
          name: string
          type: "group" | "private"
          student_ids: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          name: string
          type: "group" | "private"
          student_ids?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          name?: string
          type?: "group" | "private"
          student_ids?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      attendance_records: {
        Row: {
          id: string
          profile_id: string
          date: string
          time: string
          group_id: string
          student_id: string
          status: "present" | "absent"
          notes: string
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          date: string
          time: string
          group_id: string
          student_id: string
          status: "present" | "absent"
          notes?: string
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          date?: string
          time?: string
          group_id?: string
          student_id?: string
          status?: "present" | "absent"
          notes?: string
          created_at?: string
        }
      }
      archived_terms: {
        Row: {
          id: string
          profile_id: string
          name: string
          start_month: string
          end_month: string
          year: string
          attendance_records: any[]
          student_snapshot: any[]
          group_snapshot: any[]
          completed_makeup_sessions: any[]
          finalized_date: string
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          name: string
          start_month: string
          end_month: string
          year: string
          attendance_records?: any[]
          student_snapshot?: any[]
          group_snapshot?: any[]
          completed_makeup_sessions?: any[]
          finalized_date: string
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          name?: string
          start_month?: string
          end_month?: string
          year?: string
          attendance_records?: any[]
          student_snapshot?: any[]
          group_snapshot?: any[]
          completed_makeup_sessions?: any[]
          finalized_date?: string
          created_at?: string
        }
      }
      completed_makeup_sessions: {
        Row: {
          id: string
          profile_id: string
          student_id: string
          student_name: string
          date: string
          group_id: string | null
          group_name: string | null
          type: "group" | "private"
          completed_date: string
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          student_id: string
          student_name: string
          date: string
          group_id?: string | null
          group_name?: string | null
          type: "group" | "private"
          completed_date: string
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          student_id?: string
          student_name?: string
          date?: string
          group_id?: string | null
          group_name?: string | null
          type?: "group" | "private"
          completed_date?: string
          created_at?: string
        }
      }
    }
  }
}
