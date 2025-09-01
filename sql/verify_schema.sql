-- Verify database schema is correct
-- Run this to check if all required columns exist

SELECT 'Checking students table...' as status;

-- Check students table columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'students' 
ORDER BY ordinal_position;

SELECT 'Checking groups table...' as status;

-- Check groups table columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'groups' 
ORDER BY ordinal_position;

SELECT 'Checking attendance_records table...' as status;

-- Check attendance_records table columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'attendance_records' 
ORDER BY ordinal_position;

SELECT 'Checking completed_makeup_sessions table...' as status;

-- Check completed_makeup_sessions table columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'completed_makeup_sessions' 
ORDER BY ordinal_position;

SELECT 'Checking archived_terms table...' as status;

-- Check archived_terms table columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'archived_terms' 
ORDER BY ordinal_position;

SELECT 'Checking makeup_sessions table...' as status;

-- Check makeup_sessions table columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'makeup_sessions' 
ORDER BY ordinal_position;

-- Check if required columns exist
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'remaining_sessions') 
    THEN '✅ students.remaining_sessions exists'
    ELSE '❌ students.remaining_sessions MISSING'
  END as check_result
UNION ALL
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'user_id') 
    THEN '✅ students.user_id exists'
    ELSE '❌ students.user_id MISSING'
  END
UNION ALL
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'day_of_week') 
    THEN '✅ groups.day_of_week exists'
    ELSE '❌ groups.day_of_week MISSING'
  END
UNION ALL
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'user_id') 
    THEN '✅ groups.user_id exists'
    ELSE '❌ groups.user_id MISSING'
  END
UNION ALL
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'attendance_records' AND column_name = 'time_adjustment_amount') 
    THEN '✅ attendance_records.time_adjustment_amount exists'
    ELSE '❌ attendance_records.time_adjustment_amount MISSING'
  END
UNION ALL
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'attendance_records' AND column_name = 'user_id') 
    THEN '✅ attendance_records.user_id exists'
    ELSE '❌ attendance_records.user_id MISSING'
  END
UNION ALL
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'makeup_sessions') 
    THEN '✅ makeup_sessions table exists'
    ELSE '❌ makeup_sessions table MISSING'
  END;

-- Check RLS policies
SELECT 'Checking RLS policies...' as status;

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename IN ('students', 'groups', 'attendance_records', 'completed_makeup_sessions', 'archived_terms', 'makeup_sessions')
ORDER BY tablename, policyname;
