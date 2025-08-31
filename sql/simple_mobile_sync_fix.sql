-- SIMPLE MOBILE SYNC FIX: No complex blocks, just straightforward SQL
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

-- Step 2: Add user_id columns safely (simple approach)
-- Students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS user_id UUID;

-- Groups table  
ALTER TABLE groups ADD COLUMN IF NOT EXISTS user_id UUID;

-- Attendance records table
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS user_id UUID;

-- Completed makeup sessions table
ALTER TABLE completed_makeup_sessions ADD COLUMN IF NOT EXISTS user_id UUID;

-- Archived terms table
ALTER TABLE archived_terms ADD COLUMN IF NOT EXISTS user_id UUID;

-- Coach profiles table
ALTER TABLE coach_profiles ADD COLUMN IF NOT EXISTS user_id UUID;

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
SELECT '✅ Simple mobile sync fix completed! The 400 errors should now be resolved.' as status;
