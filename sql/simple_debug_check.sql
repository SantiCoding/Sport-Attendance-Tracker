-- SIMPLE DEBUG CHECK: Basic database state verification
-- This script checks the essential information without complex queries

-- Step 1: Check if user_id columns exist
SELECT 'Checking user_id columns:' as info;
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('students', 'groups', 'attendance_records', 'completed_makeup_sessions', 'archived_terms', 'coach_profiles')
  AND column_name = 'user_id'
ORDER BY table_name;

-- Step 2: Check current data counts (simple)
SELECT 'Current data counts:' as info;
SELECT 
  'coach_profiles' as table_name,
  COUNT(*) as total_count
FROM coach_profiles
UNION ALL
SELECT 
  'students' as table_name,
  COUNT(*) as total_count
FROM students
UNION ALL
SELECT 
  'groups' as table_name,
  COUNT(*) as total_count
FROM groups
UNION ALL
SELECT 
  'attendance_records' as table_name,
  COUNT(*) as total_count
FROM attendance_records
UNION ALL
SELECT 
  'completed_makeup_sessions' as table_name,
  COUNT(*) as total_count
FROM completed_makeup_sessions
UNION ALL
SELECT 
  'archived_terms' as table_name,
  COUNT(*) as total_count
FROM archived_terms;

-- Step 3: Check RLS status
SELECT 'RLS Status:' as info;
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('students', 'groups', 'attendance_records', 'completed_makeup_sessions', 'archived_terms', 'coach_profiles')
ORDER BY tablename;

-- Step 4: Show sample coach_profiles (safe query)
SELECT 'Sample coach_profiles:' as info;
SELECT 
  id,
  name,
  user_id
FROM coach_profiles 
LIMIT 3;

-- Step 5: Show sample students (safe query)
SELECT 'Sample students:' as info;
SELECT 
  id,
  name,
  user_id
FROM students 
LIMIT 3;

-- Step 6: Check for data without user_id
SELECT 'Data without user_id:' as info;
SELECT 
  'coach_profiles' as table_name,
  COUNT(*) as count_without_user_id
FROM coach_profiles 
WHERE user_id IS NULL
UNION ALL
SELECT 
  'students' as table_name,
  COUNT(*) as count_without_user_id
FROM students 
WHERE user_id IS NULL
UNION ALL
SELECT 
  'groups' as table_name,
  COUNT(*) as count_without_user_id
FROM groups 
WHERE user_id IS NULL
UNION ALL
SELECT 
  'attendance_records' as table_name,
  COUNT(*) as count_without_user_id
FROM attendance_records 
WHERE user_id IS NULL
UNION ALL
SELECT 
  'completed_makeup_sessions' as table_name,
  COUNT(*) as count_without_user_id
FROM completed_makeup_sessions 
WHERE user_id IS NULL
UNION ALL
SELECT 
  'archived_terms' as table_name,
  COUNT(*) as count_without_user_id
FROM archived_terms 
WHERE user_id IS NULL;

-- Step 7: Success message
SELECT '✅ Simple debug check completed! Check the results above.' as status;
