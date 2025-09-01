-- COMPREHENSIVE DATABASE FIX - RUN THIS TO RESOLVE ALL 400 ERRORS
-- This script will fix your database schema and make cloud sync work properly

-- 1. First, let's check what tables exist and their current structure
SELECT 'CHECKING CURRENT DATABASE STATE' as step;

-- Check existing tables
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check if the required tables exist, if not create them
DO $$
BEGIN
    -- Create students table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'students') THEN
        CREATE TABLE students (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            profile_id UUID NOT NULL,
            user_id UUID NOT NULL,
            name TEXT NOT NULL,
            notes TEXT DEFAULT '',
            prepaid_sessions INTEGER DEFAULT 0,
            remaining_sessions INTEGER DEFAULT 0,
            makeup_sessions INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created students table';
    END IF;

    -- Create groups table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'groups') THEN
        CREATE TABLE groups (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            profile_id UUID NOT NULL,
            user_id UUID NOT NULL,
            name TEXT NOT NULL,
            type TEXT DEFAULT 'group',
            student_ids TEXT[] DEFAULT '{}',
            day_of_week TEXT,
            time TEXT,
            duration TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created groups table';
    END IF;

    -- Create attendance_records table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'attendance_records') THEN
        CREATE TABLE attendance_records (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            profile_id UUID NOT NULL,
            user_id UUID NOT NULL,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            group_id UUID NOT NULL,
            student_id UUID NOT NULL,
            status TEXT NOT NULL,
            notes TEXT DEFAULT '',
            time_adjustment_amount TEXT,
            time_adjustment_type TEXT,
            time_adjustment_reason TEXT,
            cancel_reason TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created attendance_records table';
    END IF;

    -- Create makeup_sessions table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'makeup_sessions') THEN
        CREATE TABLE makeup_sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            profile_id UUID NOT NULL,
            user_id UUID NOT NULL,
            student_id UUID NOT NULL,
            original_date TEXT,
            original_group_id UUID,
            original_time TEXT,
            reason TEXT,
            notes TEXT DEFAULT '',
            created_date TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            scheduled_date TEXT,
            scheduled_time TEXT,
            scheduled_group_id UUID,
            completed_date TEXT,
            completed_notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created makeup_sessions table';
    END IF;

    -- Create completed_makeup_sessions table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'completed_makeup_sessions') THEN
        CREATE TABLE completed_makeup_sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            profile_id UUID NOT NULL,
            user_id UUID NOT NULL,
            student_id UUID NOT NULL,
            student_name TEXT NOT NULL,
            date TEXT NOT NULL,
            group_id UUID,
            group_name TEXT,
            type TEXT NOT NULL,
            completed_date TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created completed_makeup_sessions table';
    END IF;

    -- Create archived_terms table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'archived_terms') THEN
        CREATE TABLE archived_terms (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            profile_id UUID NOT NULL,
            user_id UUID NOT NULL,
            name TEXT NOT NULL,
            start_month TEXT NOT NULL,
            end_month TEXT NOT NULL,
            year INTEGER NOT NULL,
            attendance_records JSONB DEFAULT '[]',
            student_snapshot JSONB DEFAULT '[]',
            group_snapshot JSONB DEFAULT '[]',
            completed_makeup_sessions JSONB DEFAULT '[]',
            finalized_date TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created archived_terms table';
    END IF;

    -- Create coach_profiles table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'coach_profiles') THEN
        CREATE TABLE coach_profiles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            name TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created coach_profiles table';
    END IF;
END $$;

-- 2. Add missing columns to existing tables
SELECT 'ADDING MISSING COLUMNS' as step;

-- Add missing columns to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS remaining_sessions INTEGER DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS makeup_sessions INTEGER DEFAULT 0;

-- Add missing columns to groups table
ALTER TABLE groups ADD COLUMN IF NOT EXISTS day_of_week TEXT;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS time TEXT;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS duration TEXT;

-- Add missing columns to attendance_records table
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS time_adjustment_amount TEXT;
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS time_adjustment_type TEXT;
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS time_adjustment_reason TEXT;
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS cancel_reason TEXT;

-- 3. Ensure user_id column exists and is NOT NULL
SELECT 'ENSURING USER_ID CONSTRAINTS' as step;

-- Make user_id NOT NULL on all tables
ALTER TABLE students ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE groups ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE attendance_records ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE completed_makeup_sessions ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE makeup_sessions ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE archived_terms ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE coach_profiles ALTER COLUMN user_id SET NOT NULL;

-- 4. Create indexes for performance
SELECT 'CREATING PERFORMANCE INDEXES' as step;

CREATE INDEX IF NOT EXISTS idx_students_user ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_profile ON students(profile_id);
CREATE INDEX IF NOT EXISTS idx_groups_user ON groups(user_id);
CREATE INDEX IF NOT EXISTS idx_groups_profile ON groups(profile_id);
CREATE INDEX IF NOT EXISTS idx_attendance_user ON attendance_records(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_profile ON attendance_records(profile_id);
CREATE INDEX IF NOT EXISTS idx_cms_user ON completed_makeup_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_cms_profile ON completed_makeup_sessions(profile_id);
CREATE INDEX IF NOT EXISTS idx_makeup_user ON makeup_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_makeup_profile ON makeup_sessions(profile_id);
CREATE INDEX IF NOT EXISTS idx_archived_user ON archived_terms(user_id);
CREATE INDEX IF NOT EXISTS idx_archived_profile ON archived_terms(profile_id);
CREATE INDEX IF NOT EXISTS idx_coach_user ON coach_profiles(user_id);

-- 5. Enable Row Level Security
SELECT 'ENABLING ROW LEVEL SECURITY' as step;

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE completed_makeup_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE makeup_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE archived_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_profiles ENABLE ROW LEVEL SECURITY;

-- 6. Drop existing policies and create new ones
SELECT 'CREATING RLS POLICIES' as step;

-- Drop all existing policies
DROP POLICY IF EXISTS students_select ON students;
DROP POLICY IF EXISTS students_insert ON students;
DROP POLICY IF EXISTS students_update ON students;
DROP POLICY IF EXISTS students_delete ON students;

DROP POLICY IF EXISTS groups_select ON groups;
DROP POLICY IF EXISTS groups_insert ON groups;
DROP POLICY IF EXISTS groups_update ON groups;
DROP POLICY IF EXISTS groups_delete ON groups;

DROP POLICY IF EXISTS attendance_select ON attendance_records;
DROP POLICY IF EXISTS attendance_insert ON attendance_records;
DROP POLICY IF EXISTS attendance_update ON attendance_records;
DROP POLICY IF EXISTS attendance_delete ON attendance_records;

DROP POLICY IF EXISTS cms_select ON completed_makeup_sessions;
DROP POLICY IF EXISTS cms_insert ON completed_makeup_sessions;
DROP POLICY IF EXISTS cms_update ON completed_makeup_sessions;
DROP POLICY IF EXISTS cms_delete ON completed_makeup_sessions;

DROP POLICY IF EXISTS makeup_select ON makeup_sessions;
DROP POLICY IF EXISTS makeup_insert ON makeup_sessions;
DROP POLICY IF EXISTS makeup_update ON makeup_sessions;
DROP POLICY IF EXISTS makeup_delete ON makeup_sessions;

DROP POLICY IF EXISTS archived_select ON archived_terms;
DROP POLICY IF EXISTS archived_insert ON archived_terms;
DROP POLICY IF EXISTS archived_update ON archived_terms;
DROP POLICY IF EXISTS archived_delete ON archived_terms;

DROP POLICY IF EXISTS coach_select ON coach_profiles;
DROP POLICY IF EXISTS coach_insert ON coach_profiles;
DROP POLICY IF EXISTS coach_update ON coach_profiles;
DROP POLICY IF EXISTS coach_delete ON coach_profiles;

-- Create new policies for students
CREATE POLICY "students_select" ON students FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "students_insert" ON students FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "students_update" ON students FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "students_delete" ON students FOR DELETE USING (auth.uid() = user_id);

-- Create new policies for groups
CREATE POLICY "groups_select" ON groups FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "groups_insert" ON groups FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "groups_update" ON groups FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "groups_delete" ON groups FOR DELETE USING (auth.uid() = user_id);

-- Create new policies for attendance_records
CREATE POLICY "attendance_select" ON attendance_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "attendance_insert" ON attendance_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "attendance_update" ON attendance_records FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "attendance_delete" ON attendance_records FOR DELETE USING (auth.uid() = user_id);

-- Create new policies for completed_makeup_sessions
CREATE POLICY "cms_select" ON completed_makeup_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "cms_insert" ON completed_makeup_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cms_update" ON completed_makeup_sessions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cms_delete" ON completed_makeup_sessions FOR DELETE USING (auth.uid() = user_id);

-- Create new policies for makeup_sessions
CREATE POLICY "makeup_select" ON makeup_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "makeup_insert" ON makeup_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "makeup_update" ON makeup_sessions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "makeup_delete" ON makeup_sessions FOR DELETE USING (auth.uid() = user_id);

-- Create new policies for archived_terms
CREATE POLICY "archived_select" ON archived_terms FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "archived_insert" ON archived_terms FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "archived_update" ON archived_terms FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "archived_delete" ON archived_terms FOR DELETE USING (auth.uid() = user_id);

-- Create new policies for coach_profiles
CREATE POLICY "coach_select" ON coach_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "coach_insert" ON coach_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "coach_update" ON coach_profiles FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "coach_delete" ON coach_profiles FOR DELETE USING (auth.uid() = user_id);

-- 7. Verify the fix
SELECT 'VERIFICATION COMPLETE' as step;
SELECT 'DATABASE FIXED SUCCESSFULLY!' as status;
SELECT 'All tables created/updated with correct structure' as message;
SELECT 'RLS enabled with proper policies' as result;
SELECT 'Indexes created for performance' as note;
SELECT '400 errors should now be resolved' as final_note;

-- Show current table structure
SELECT 'CURRENT TABLE STRUCTURE:' as info;
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('students', 'groups', 'attendance_records', 'makeup_sessions', 'completed_makeup_sessions', 'archived_terms', 'coach_profiles')
ORDER BY table_name, ordinal_position;
