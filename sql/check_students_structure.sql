-- CHECK STUDENTS TABLE STRUCTURE
-- Let's see what columns actually exist in the students table

SELECT 'Students table columns:' as info;
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'students'
ORDER BY ordinal_position;

-- Also check groups table structure
SELECT 'Groups table columns:' as info;
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'groups'
ORDER BY ordinal_position;

-- Check attendance_records table structure
SELECT 'Attendance records table columns:' as info;
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'attendance_records'
ORDER BY ordinal_position;
