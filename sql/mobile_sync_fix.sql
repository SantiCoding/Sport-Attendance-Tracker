-- MOBILE SYNC FIX: Ensure RLS policies work correctly for cross-device sync
-- This script fixes the issue where mobile devices can't see data due to RLS policy mismatches

-- Step 1: Verify all tables have user_id columns
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name IN ('students', 'groups', 'attendance_records', 'completed_makeup_sessions', 'archived_terms', 'coach_profiles')
  AND column_name = 'user_id'
ORDER BY table_name;

-- Step 2: Add user_id column to any missing tables (if needed)
DO $$ 
BEGIN
  -- Add user_id to students if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'user_id') THEN
    ALTER TABLE students ADD COLUMN user_id UUID REFERENCES auth.users(id);
  END IF;
  
  -- Add user_id to groups if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'user_id') THEN
    ALTER TABLE groups ADD COLUMN user_id UUID REFERENCES auth.users(id);
  END IF;
  
  -- Add user_id to attendance_records if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'attendance_records' AND column_name = 'user_id') THEN
    ALTER TABLE attendance_records ADD COLUMN user_id UUID REFERENCES auth.users(id);
  END IF;
  
  -- Add user_id to completed_makeup_sessions if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'completed_makeup_sessions' AND column_name = 'user_id') THEN
    ALTER TABLE completed_makeup_sessions ADD COLUMN user_id UUID REFERENCES auth.users(id);
  END IF;
  
  -- Add user_id to archived_terms if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'archived_terms' AND column_name = 'user_id') THEN
    ALTER TABLE archived_terms ADD COLUMN user_id UUID REFERENCES auth.users(id);
  END IF;
  
  -- Add user_id to coach_profiles if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coach_profiles' AND column_name = 'user_id') THEN
    ALTER TABLE coach_profiles ADD COLUMN user_id UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Step 3: Update existing records to have user_id (if they don't have it)
-- This maps profile_id to user_id through coach_profiles table
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

-- Step 4: Drop and recreate all RLS policies to ensure they're correct
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

-- Step 5: Ensure RLS is enabled on all tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE completed_makeup_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE archived_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_profiles ENABLE ROW LEVEL SECURITY;

-- Step 6: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_groups_user_id ON groups(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_user_id ON attendance_records(user_id);
CREATE INDEX IF NOT EXISTS idx_completed_makeup_sessions_user_id ON completed_makeup_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_archived_terms_user_id ON archived_terms(user_id);
CREATE INDEX IF NOT EXISTS idx_coach_profiles_user_id ON coach_profiles(user_id);

-- Step 7: Verify the setup
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('students', 'groups', 'attendance_records', 'completed_makeup_sessions', 'archived_terms', 'coach_profiles')
ORDER BY tablename;

-- Step 8: Show current data counts (this will work for authenticated users)
SELECT 
  'coach_profiles' as table_name,
  COUNT(*) as count
FROM coach_profiles 
WHERE user_id = auth.uid()
UNION ALL
SELECT 
  'students' as table_name,
  COUNT(*) as count
FROM students 
WHERE user_id = auth.uid()
UNION ALL
SELECT 
  'groups' as table_name,
  COUNT(*) as count
FROM groups 
WHERE user_id = auth.uid()
UNION ALL
SELECT 
  'attendance_records' as table_name,
  COUNT(*) as count
FROM attendance_records 
WHERE user_id = auth.uid()
UNION ALL
SELECT 
  'completed_makeup_sessions' as table_name,
  COUNT(*) as count
FROM completed_makeup_sessions 
WHERE user_id = auth.uid()
UNION ALL
SELECT 
  'archived_terms' as table_name,
  COUNT(*) as count
FROM archived_terms 
WHERE user_id = auth.uid();

-- Step 9: Success message
SELECT '✅ Mobile sync fix completed successfully!' as status;
