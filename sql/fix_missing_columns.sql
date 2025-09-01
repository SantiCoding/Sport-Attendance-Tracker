-- Fix missing columns in existing database
-- Run this in your Supabase SQL editor to add missing columns

-- Add missing columns to students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS remaining_sessions INTEGER DEFAULT 0;

-- Add missing columns to groups table
ALTER TABLE groups 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS day_of_week TEXT,
ADD COLUMN IF NOT EXISTS time TEXT,
ADD COLUMN IF NOT EXISTS duration TEXT;

-- Add missing columns to attendance_records table
ALTER TABLE attendance_records 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS time_adjustment_amount TEXT,
ADD COLUMN IF NOT EXISTS time_adjustment_type TEXT CHECK (time_adjustment_type IN ('more', 'less')),
ADD COLUMN IF NOT EXISTS time_adjustment_reason TEXT,
ADD COLUMN IF NOT EXISTS cancel_reason TEXT;

-- Update status constraint to include 'canceled'
ALTER TABLE attendance_records DROP CONSTRAINT IF EXISTS attendance_records_status_check;
ALTER TABLE attendance_records ADD CONSTRAINT attendance_records_status_check 
  CHECK (status IN ('present', 'absent', 'canceled'));

-- Add missing columns to archived_terms table
ALTER TABLE archived_terms 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add missing columns to completed_makeup_sessions table
ALTER TABLE completed_makeup_sessions 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create makeup_sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS makeup_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES coach_profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  original_date DATE,
  original_group_id UUID,
  original_time TEXT,
  reason TEXT NOT NULL,
  notes TEXT DEFAULT '',
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT CHECK (status IN ('pending', 'scheduled', 'completed')) DEFAULT 'pending',
  scheduled_date DATE,
  scheduled_time TEXT,
  scheduled_group_id UUID,
  completed_date TIMESTAMP WITH TIME ZONE,
  completed_notes TEXT
);

-- Enable RLS on makeup_sessions if not already enabled
ALTER TABLE makeup_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for makeup_sessions
DROP POLICY IF EXISTS "Users can only see their own makeup sessions" ON makeup_sessions;
CREATE POLICY "Users can only see their own makeup sessions" ON makeup_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_groups_user_id ON groups(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_user_id ON attendance_records(user_id);
CREATE INDEX IF NOT EXISTS idx_archived_terms_user_id ON archived_terms(user_id);
CREATE INDEX IF NOT EXISTS idx_completed_makeup_sessions_user_id ON completed_makeup_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_makeup_sessions_profile_id ON makeup_sessions(profile_id);
CREATE INDEX IF NOT EXISTS idx_makeup_sessions_user_id ON makeup_sessions(user_id);

-- Update existing RLS policies to use user_id directly
DROP POLICY IF EXISTS "Users can only see their own students" ON students;
CREATE POLICY "Users can only see their own students" ON students
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can only see their own groups" ON groups;
CREATE POLICY "Users can only see their own groups" ON groups
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can only see their own attendance records" ON attendance_records;
CREATE POLICY "Users can only see their own attendance records" ON attendance_records
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can only see their own archived terms" ON archived_terms;
CREATE POLICY "Users can only see their own archived terms" ON archived_terms
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can only see their own completed makeup sessions" ON completed_makeup_sessions;
CREATE POLICY "Users can only see their own completed makeup sessions" ON completed_makeup_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Set default values for existing records
UPDATE students SET user_id = (
  SELECT user_id FROM coach_profiles WHERE id = students.profile_id
) WHERE user_id IS NULL;

UPDATE groups SET user_id = (
  SELECT user_id FROM coach_profiles WHERE id = groups.profile_id
) WHERE user_id IS NULL;

UPDATE attendance_records SET user_id = (
  SELECT user_id FROM coach_profiles WHERE id = attendance_records.profile_id
) WHERE user_id IS NULL;

UPDATE archived_terms SET user_id = (
  SELECT user_id FROM coach_profiles WHERE id = archived_terms.profile_id
) WHERE user_id IS NULL;

UPDATE completed_makeup_sessions SET user_id = (
  SELECT user_id FROM coach_profiles WHERE id = completed_makeup_sessions.profile_id
) WHERE user_id IS NULL;

-- Set remaining_sessions to prepaid_sessions for existing students
UPDATE students SET remaining_sessions = prepaid_sessions WHERE remaining_sessions = 0;

-- Verify the changes
SELECT 'Database schema updated successfully!' as status;
