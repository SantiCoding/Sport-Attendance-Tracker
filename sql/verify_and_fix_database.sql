-- Comprehensive Database Verification and Fix Script
-- This script will verify the current database structure and fix any mismatches

-- 1. First, let's check what tables exist and their current structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('students', 'groups', 'attendance_records', 'makeup_sessions', 'completed_makeup_sessions', 'archived_terms', 'coach_profiles')
ORDER BY table_name, ordinal_position;

-- 2. Check if the students table has the correct structure
-- If any of these columns are missing, we'll add them
DO $$
BEGIN
    -- Check if students table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'students') THEN
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
    ELSE
        -- Add missing columns if they don't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'students' AND column_name = 'user_id') THEN
            ALTER TABLE students ADD COLUMN user_id UUID;
            RAISE NOTICE 'Added user_id column to students table';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'students' AND column_name = 'created_at') THEN
            ALTER TABLE students ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            RAISE NOTICE 'Added created_at column to students table';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'students' AND column_name = 'updated_at') THEN
            ALTER TABLE students ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            RAISE NOTICE 'Added updated_at column to students table';
        END IF;
    END IF;
END $$;

-- 3. Check if the groups table has the correct structure
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'groups') THEN
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
    ELSE
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'groups' AND column_name = 'user_id') THEN
            ALTER TABLE groups ADD COLUMN user_id UUID;
            RAISE NOTICE 'Added user_id column to groups table';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'groups' AND column_name = 'created_at') THEN
            ALTER TABLE groups ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            RAISE NOTICE 'Added created_at column to groups table';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'groups' AND column_name = 'updated_at') THEN
            ALTER TABLE groups ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            RAISE NOTICE 'Added updated_at column to groups table';
        END IF;
    END IF;
END $$;

-- 4. Check if the attendance_records table has the correct structure
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'attendance_records') THEN
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
    ELSE
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'attendance_records' AND column_name = 'user_id') THEN
            ALTER TABLE attendance_records ADD COLUMN user_id UUID;
            RAISE NOTICE 'Added user_id column to attendance_records table';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'attendance_records' AND column_name = 'created_at') THEN
            ALTER TABLE attendance_records ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            RAISE NOTICE 'Added created_at column to attendance_records table';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'attendance_records' AND column_name = 'updated_at') THEN
            ALTER TABLE attendance_records ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            RAISE NOTICE 'Added updated_at column to attendance_records table';
        END IF;
    END IF;
END $$;

-- 5. Check if the makeup_sessions table has the correct structure
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'makeup_sessions') THEN
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
    ELSE
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'makeup_sessions' AND column_name = 'user_id') THEN
            ALTER TABLE makeup_sessions ADD COLUMN user_id UUID;
            RAISE NOTICE 'Added user_id column to makeup_sessions table';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'makeup_sessions' AND column_name = 'created_at') THEN
            ALTER TABLE makeup_sessions ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            RAISE NOTICE 'Added created_at column to makeup_sessions table';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'makeup_sessions' AND column_name = 'updated_at') THEN
            ALTER TABLE makeup_sessions ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            RAISE NOTICE 'Added updated_at column to makeup_sessions table';
        END IF;
    END IF;
END $$;

-- 6. Check if the completed_makeup_sessions table has the correct structure
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'completed_makeup_sessions' AND column_name = 'user_id') THEN
        ALTER TABLE completed_makeup_sessions ADD COLUMN user_id UUID;
        RAISE NOTICE 'Added user_id column to completed_makeup_sessions table';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'completed_makeup_sessions' AND column_name = 'created_at') THEN
        ALTER TABLE completed_makeup_sessions ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added created_at column to completed_makeup_sessions table';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'completed_makeup_sessions' AND column_name = 'updated_at') THEN
        ALTER TABLE completed_makeup_sessions ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to completed_makeup_sessions table';
    END IF;
END $$;

-- 7. Check if the archived_terms table has the correct structure
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'archived_terms' AND column_name = 'user_id') THEN
        ALTER TABLE archived_terms ADD COLUMN user_id UUID;
        RAISE NOTICE 'Added user_id column to archived_terms table';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'archived_terms' AND column_name = 'created_at') THEN
        ALTER TABLE archived_terms ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added created_at column to archived_terms table';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'archived_terms' AND column_name = 'updated_at') THEN
        ALTER TABLE archived_terms ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to archived_terms table';
    END IF;
END $$;

-- 8. Check if the coach_profiles table has the correct structure
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coach_profiles' AND column_name = 'created_at') THEN
        ALTER TABLE coach_profiles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added created_at column to coach_profiles table';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coach_profiles' AND column_name = 'updated_at') THEN
        ALTER TABLE coach_profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to coach_profiles table';
    END IF;
END $$;

-- 9. Update any existing records that have NULL user_id with a default value
-- This is a temporary fix - in production, you should have proper user authentication
UPDATE students SET user_id = '00000000-0000-0000-0000-000000000000' WHERE user_id IS NULL;
UPDATE groups SET user_id = '00000000-0000-0000-0000-000000000000' WHERE user_id IS NULL;
UPDATE attendance_records SET user_id = '00000000-0000-0000-0000-000000000000' WHERE user_id IS NULL;
UPDATE makeup_sessions SET user_id = '00000000-0000-0000-0000-000000000000' WHERE user_id IS NULL;
UPDATE completed_makeup_sessions SET user_id = '00000000-0000-0000-0000-000000000000' WHERE user_id IS NULL;
UPDATE archived_terms SET user_id = '00000000-0000-0000-0000-000000000000' WHERE user_id IS NULL;

-- 10. Final verification - show the current table structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('students', 'groups', 'attendance_records', 'makeup_sessions', 'completed_makeup_sessions', 'archived_terms', 'coach_profiles')
ORDER BY table_name, ordinal_position;

-- 11. Show table row counts to verify data integrity
SELECT 'students' as table_name, COUNT(*) as row_count FROM students
UNION ALL
SELECT 'groups', COUNT(*) FROM groups
UNION ALL
SELECT 'attendance_records', COUNT(*) FROM attendance_records
UNION ALL
SELECT 'makeup_sessions', COUNT(*) FROM makeup_sessions
UNION ALL
SELECT 'completed_makeup_sessions', COUNT(*) FROM completed_makeup_sessions
UNION ALL
SELECT 'archived_terms', COUNT(*) FROM archived_terms
UNION ALL
SELECT 'coach_profiles', COUNT(*) FROM coach_profiles;
