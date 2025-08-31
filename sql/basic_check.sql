-- BASIC DATABASE CHECK
-- Simple queries to see what's in the database

-- Check if tables exist
SELECT 'Tables that exist:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('students', 'groups', 'attendance_records', 'completed_makeup_sessions', 'archived_terms', 'coach_profiles')
ORDER BY table_name;

-- Check if user_id columns exist
SELECT 'user_id columns:' as info;
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE table_name IN ('students', 'groups', 'attendance_records', 'completed_makeup_sessions', 'archived_terms', 'coach_profiles')
  AND column_name = 'user_id';

-- Count data in each table
SELECT 'Data counts:' as info;
SELECT 'coach_profiles' as table_name, COUNT(*) as count FROM coach_profiles
UNION ALL
SELECT 'students' as table_name, COUNT(*) as count FROM students
UNION ALL
SELECT 'groups' as table_name, COUNT(*) as count FROM groups
UNION ALL
SELECT 'attendance_records' as table_name, COUNT(*) as count FROM attendance_records
UNION ALL
SELECT 'completed_makeup_sessions' as table_name, COUNT(*) as count FROM completed_makeup_sessions
UNION ALL
SELECT 'archived_terms' as table_name, COUNT(*) as count FROM archived_terms;

-- Show any coach profiles
SELECT 'Coach profiles:' as info;
SELECT id, name FROM coach_profiles LIMIT 5;

-- Show any students
SELECT 'Students:' as info;
SELECT id, name FROM students LIMIT 5;

-- Check RLS
SELECT 'RLS enabled:' as info;
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename IN ('students', 'groups', 'attendance_records', 'completed_makeup_sessions', 'archived_terms', 'coach_profiles');
