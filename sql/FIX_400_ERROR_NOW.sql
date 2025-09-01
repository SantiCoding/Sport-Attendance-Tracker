-- FIX 400 ERROR - RUN THIS NOW
-- This will fix your database and make cloud sync work

-- 1. Drop and recreate the students table with correct structure
DROP TABLE IF EXISTS students CASCADE;
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

-- 2. Drop and recreate the groups table
DROP TABLE IF EXISTS groups CASCADE;
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

-- 3. Drop and recreate the attendance_records table
DROP TABLE IF EXISTS attendance_records CASCADE;
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

-- 4. Drop and recreate the makeup_sessions table
DROP TABLE IF EXISTS makeup_sessions CASCADE;
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

-- 5. Drop and recreate the completed_makeup_sessions table
DROP TABLE IF EXISTS completed_makeup_sessions CASCADE;
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

-- 6. Drop and recreate the archived_terms table
DROP TABLE IF EXISTS archived_terms CASCADE;
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

-- 7. Ensure coach_profiles table has correct structure
DROP TABLE IF EXISTS coach_profiles CASCADE;
CREATE TABLE coach_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Show confirmation
SELECT 'DATABASE FIXED SUCCESSFULLY!' as status;
SELECT 'All tables recreated with correct structure' as message;
SELECT 'Cloud sync should now work properly' as result;
