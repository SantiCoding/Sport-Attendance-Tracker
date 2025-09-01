-- Database Schema Fix Script
-- Run this in your Supabase SQL Editor to fix all the issues

-- 1. Fix IDs to generate automatically if missing
ALTER TABLE students ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE groups ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE attendance_records ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE completed_makeup_sessions ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 2. Make sure user_id exists and is not null on writes
ALTER TABLE students ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE groups ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE attendance_records ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE completed_makeup_sessions ALTER COLUMN user_id SET NOT NULL;

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_students_user ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_groups_user ON groups(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_user ON attendance_records(user_id);
CREATE INDEX IF NOT EXISTS idx_cms_user ON completed_makeup_sessions(user_id);

-- 4. Enable RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE completed_makeup_sessions ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies if they exist
DROP POLICY IF EXISTS students_select ON students;
DROP POLICY IF EXISTS students_insert ON students;
DROP POLICY IF EXISTS students_update ON students;
DROP POLICY IF EXISTS students_delete ON students;

DROP POLICY IF EXISTS groups_select ON groups;
DROP POLICY IF EXISTS groups_insert ON groups;
DROP POLICY IF EXISTS groups_update ON groups;
DROP POLICY IF EXISTS groups_delete ON groups;

DROP POLICY IF EXISTS attendance_select ON attendance_records;
DROP POLICY IF EXISTS attendance_insert ON attendance_records;
DROP POLICY IF EXISTS attendance_update ON attendance_records;
DROP POLICY IF EXISTS attendance_delete ON attendance_records;

DROP POLICY IF EXISTS cms_select ON completed_makeup_sessions;
DROP POLICY IF EXISTS cms_insert ON completed_makeup_sessions;
DROP POLICY IF EXISTS cms_update ON completed_makeup_sessions;
DROP POLICY IF EXISTS cms_delete ON completed_makeup_sessions;

-- 6. Create policies: user can only see/modify their own rows
-- Students table policies
CREATE POLICY "students_select" ON students
FOR SELECT USING ( auth.uid() = user_id );

CREATE POLICY "students_insert" ON students
FOR INSERT WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "students_update" ON students
FOR UPDATE USING ( auth.uid() = user_id ) WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "students_delete" ON students
FOR DELETE USING ( auth.uid() = user_id );

-- Groups table policies
CREATE POLICY "groups_select" ON groups
FOR SELECT USING ( auth.uid() = user_id );

CREATE POLICY "groups_insert" ON groups
FOR INSERT WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "groups_update" ON groups
FOR UPDATE USING ( auth.uid() = user_id ) WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "groups_delete" ON groups
FOR DELETE USING ( auth.uid() = user_id );

-- Attendance records table policies
CREATE POLICY "attendance_select" ON attendance_records
FOR SELECT USING ( auth.uid() = user_id );

CREATE POLICY "attendance_insert" ON attendance_records
FOR INSERT WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "attendance_update" ON attendance_records
FOR UPDATE USING ( auth.uid() = user_id ) WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "attendance_delete" ON attendance_records
FOR DELETE USING ( auth.uid() = user_id );

-- Completed makeup sessions table policies
CREATE POLICY "cms_select" ON completed_makeup_sessions
FOR SELECT USING ( auth.uid() = user_id );

CREATE POLICY "cms_insert" ON completed_makeup_sessions
FOR INSERT WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "cms_update" ON completed_makeup_sessions
FOR UPDATE USING ( auth.uid() = user_id ) WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "cms_delete" ON completed_makeup_sessions
FOR DELETE USING ( auth.uid() = user_id );

-- 7. Show confirmation
SELECT 'DATABASE SCHEMA FIXED SUCCESSFULLY!' as status;
SELECT 'RLS enabled with proper policies' as message;
SELECT 'Indexes created for performance' as result;
SELECT 'All tables now require user_id on writes' as note;
