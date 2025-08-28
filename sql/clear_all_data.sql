-- Clear all data from Supabase tables
-- WARNING: This will delete ALL user data. Use only on development DB.
-- Run this in your Supabase SQL editor to start fresh

BEGIN;

-- Clear all tables in correct order (due to foreign key constraints)
TRUNCATE TABLE completed_makeup_sessions RESTART IDENTITY CASCADE;
TRUNCATE TABLE archived_terms RESTART IDENTITY CASCADE;
TRUNCATE TABLE attendance_records RESTART IDENTITY CASCADE;
TRUNCATE TABLE makeup_sessions RESTART IDENTITY CASCADE;
TRUNCATE TABLE groups RESTART IDENTITY CASCADE;
TRUNCATE TABLE students RESTART IDENTITY CASCADE;
TRUNCATE TABLE coach_profiles RESTART IDENTITY CASCADE;

-- Alternative: If you want to clear only for a specific user
-- Replace '00000000-0000-0000-0000-000000000000' with the actual user ID
-- DELETE FROM completed_makeup_sessions WHERE user_id = '00000000-0000-0000-0000-000000000000';
-- DELETE FROM archived_terms WHERE user_id = '00000000-0000-0000-0000-000000000000';
-- DELETE FROM attendance_records WHERE user_id = '00000000-0000-0000-0000-000000000000';
-- DELETE FROM makeup_sessions WHERE user_id = '00000000-0000-0000-0000-000000000000';
-- DELETE FROM groups WHERE user_id = '00000000-0000-0000-0000-000000000000';
-- DELETE FROM students WHERE user_id = '00000000-0000-0000-0000-000000000000';
-- DELETE FROM coach_profiles WHERE user_id = '00000000-0000-0000-0000-000000000000';

COMMIT;

-- Verify tables are empty
SELECT 'coach_profiles' as table_name, COUNT(*) as count FROM coach_profiles
UNION ALL
SELECT 'students' as table_name, COUNT(*) as count FROM students
UNION ALL
SELECT 'groups' as table_name, COUNT(*) as count FROM groups
UNION ALL
SELECT 'attendance_records' as table_name, COUNT(*) as count FROM attendance_records
UNION ALL
SELECT 'archived_terms' as table_name, COUNT(*) as count FROM archived_terms
UNION ALL
SELECT 'makeup_sessions' as table_name, COUNT(*) as count FROM makeup_sessions
UNION ALL
SELECT 'completed_makeup_sessions' as table_name, COUNT(*) as count FROM completed_makeup_sessions;
