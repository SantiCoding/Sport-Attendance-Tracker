-- RESET ALL DATA: Clear all data to start fresh
-- This will help avoid sync issues with multiple coach profiles

-- Step 1: Clear all data from all tables
TRUNCATE TABLE archived_terms RESTART IDENTITY CASCADE;
TRUNCATE TABLE completed_makeup_sessions RESTART IDENTITY CASCADE;
TRUNCATE TABLE attendance_records RESTART IDENTITY CASCADE;
TRUNCATE TABLE groups RESTART IDENTITY CASCADE;
TRUNCATE TABLE students RESTART IDENTITY CASCADE;
TRUNCATE TABLE coach_profiles RESTART IDENTITY CASCADE;

-- Step 2: Verify all tables are empty
SELECT 'Data counts after reset:' as info;
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

-- Step 3: Success message
SELECT '✅ All data cleared successfully! You can now start fresh.' as status;
