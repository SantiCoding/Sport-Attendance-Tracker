-- Simple diagnostic script to check current database state
-- Run this first to see what's currently in your database

-- Check what tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check the structure of the students table (if it exists)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'students'
ORDER BY ordinal_position;

-- Check if there are any existing records
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
