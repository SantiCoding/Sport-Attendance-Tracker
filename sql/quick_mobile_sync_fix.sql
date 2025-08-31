-- QUICK MOBILE SYNC FIX: Simple and safe approach
-- This script fixes the 400 errors by ensuring all tables have user_id and proper RLS

-- Step 1: Check current state
SELECT 'Current table structure:' as info;
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('students', 'groups', 'attendance_records', 'completed_makeup_sessions', 'archived_terms', 'coach_profiles')
  AND column_name IN ('user_id', 'profile_id')
ORDER BY table_name, column_name;

-- Step 2: Add user_id columns safely (only if they don't exist)
DO $$ 
BEGIN
  -- Students table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'user_id') THEN
    ALTER TABLE students ADD COLUMN user_id UUID;
    RAISE NOTICE 'Added user_id column to students table';
  ELSE
    RAISE NOTICE 'user_id column already exists in students table';
  END IF;
  
  -- Groups table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'user_id') THEN
    ALTER TABLE groups ADD COLUMN user_id UUID;
    RAISE NOTICE 'Added user_id column to groups table';
  ELSE
    RAISE NOTICE 'user_id column already exists in groups table';
  END IF;
  
  -- Attendance records table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'attendance_records' AND column_name = 'user_id') THEN
    ALTER TABLE attendance_records ADD COLUMN user_id UUID;
    RAISE NOTICE 'Added user_id column to attendance_records table';
  ELSE
    RAISE NOTICE 'user_id column already exists in attendance_records table';
  END IF;
  
  -- Completed makeup sessions table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'completed_makeup_sessions' AND column_name = 'user_id') THEN
    ALTER TABLE completed_makeup_sessions ADD COLUMN user_id UUID;
    RAISE NOTICE 'Added user_id column to completed_makeup_sessions table';
  ELSE
    RAISE NOTICE 'user_id column already exists in completed_makeup_sessions table';
  END IF;
  
  -- Archived terms table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'archived_terms' AND column_name = 'user_id') THEN
    ALTER TABLE archived_terms ADD COLUMN user_id UUID;
    RAISE NOTICE 'Added user_id column to archived_terms table';
  ELSE
    RAISE NOTICE 'user_id column already exists in archived_terms table';
  END IF;
  
  -- Coach profiles table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coach_profiles' AND column_name = 'user_id') THEN
    ALTER TABLE coach_profiles ADD COLUMN user_id UUID;
    RAISE NOTICE 'Added user_id column to coach_profiles table';
  ELSE
    RAISE NOTICE 'user_id column already exists in coach_profiles table';
  END IF;
END $$;

-- Step 3: Populate user_id for existing records (only if user_id is NULL)
UPDATE students 
SET user_id = cp.user_id 
FROM coach_profiles cp 
WHERE students.profile_id = cp.id 
  AND students.user_id IS NULL;

UPDATE groups 
SET user_id = cp.user_id 
FROM coach_profiles cp 
WHERE groups.profile_id = cp.id 
  AND groups.user_id IS NULL;

UPDATE attendance_records 
SET user_id = cp.user_id 
FROM coach_profiles cp 
WHERE attendance_records.profile_id = cp.id 
  AND attendance_records.user_id IS NULL;

UPDATE completed_makeup_sessions 
SET user_id = cp.user_id 
FROM coach_profiles cp 
WHERE completed_makeup_sessions.profile_id = cp.id 
  AND completed_makeup_sessions.user_id IS NULL;

UPDATE archived_terms 
SET user_id = cp.user_id 
FROM coach_profiles cp 
WHERE archived_terms.profile_id = cp.id 
  AND archived_terms.user_id IS NULL;

-- Step 4: Create simple RLS policies (drop old ones first)
-- Students
DROP POLICY IF EXISTS "Users can manage their own students" ON students;
DROP POLICY IF EXISTS "Users can only see their own students" ON students;
CREATE POLICY "Users can manage their own students" ON students
  FOR ALL USING (auth.uid() = user_id);

-- Groups
DROP POLICY IF EXISTS "Users can manage their own groups" ON groups;
DROP POLICY IF EXISTS "Users can only see their own groups" ON groups;
CREATE POLICY "Users can manage their own groups" ON groups
  FOR ALL USING (auth.uid() = user_id);

-- Attendance records
DROP POLICY IF EXISTS "Users can manage their own attendance records" ON attendance_records;
DROP POLICY IF EXISTS "Users can only see their own attendance records" ON attendance_records;
CREATE POLICY "Users can manage their own attendance records" ON attendance_records
  FOR ALL USING (auth.uid() = user_id);

-- Completed makeup sessions
DROP POLICY IF EXISTS "Users can manage their own completed makeup sessions" ON completed_makeup_sessions;
DROP POLICY IF EXISTS "Users can only see their own completed makeup sessions" ON completed_makeup_sessions;
CREATE POLICY "Users can manage their own completed makeup sessions" ON completed_makeup_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Archived terms
DROP POLICY IF EXISTS "Users can manage their own archived terms" ON archived_terms;
DROP POLICY IF EXISTS "Users can only see their own archived terms" ON archived_terms;
CREATE POLICY "Users can manage their own archived terms" ON archived_terms
  FOR ALL USING (auth.uid() = user_id);

-- Coach profiles
DROP POLICY IF EXISTS "Users can manage their own coach profiles" ON coach_profiles;
DROP POLICY IF EXISTS "Users can only see their own coach profiles" ON coach_profiles;
CREATE POLICY "Users can manage their own coach profiles" ON coach_profiles
  FOR ALL USING (auth.uid() = user_id);

-- Step 5: Enable RLS on all tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE completed_makeup_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE archived_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_profiles ENABLE ROW LEVEL SECURITY;

-- Step 6: Show final state
SELECT 'Final table structure:' as info;
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('students', 'groups', 'attendance_records', 'completed_makeup_sessions', 'archived_terms', 'coach_profiles')
  AND column_name IN ('user_id', 'profile_id')
ORDER BY table_name, column_name;

-- Step 7: Show RLS status
SELECT 'RLS Status:' as info;
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('students', 'groups', 'attendance_records', 'completed_makeup_sessions', 'archived_terms', 'coach_profiles')
ORDER BY tablename;

-- Step 8: Success message
SELECT '✅ Quick mobile sync fix completed! The 400 errors should now be resolved.' as status;
