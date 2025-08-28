-- Clear all data from Supabase tables
-- Run this in your Supabase SQL editor to start fresh

-- Clear all tables (in correct order due to foreign key constraints)
DELETE FROM completed_makeup_sessions;
DELETE FROM archived_terms;
DELETE FROM attendance_records;
DELETE FROM makeup_sessions;
DELETE FROM groups;
DELETE FROM students;
DELETE FROM coach_profiles;

-- Reset sequences (if using auto-increment IDs)
-- ALTER SEQUENCE coach_profiles_id_seq RESTART WITH 1;
-- ALTER SEQUENCE students_id_seq RESTART WITH 1;
-- ALTER SEQUENCE groups_id_seq RESTART WITH 1;
-- ALTER SEQUENCE attendance_records_id_seq RESTART WITH 1;
-- ALTER SEQUENCE archived_terms_id_seq RESTART WITH 1;
-- ALTER SEQUENCE completed_makeup_sessions_id_seq RESTART WITH 1;

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
SELECT 'completed_makeup_sessions' as table_name, COUNT(*) as count FROM completed_makeup_sessions;
