-- Migration to add persistence v2 fields to all tables
-- Run this in your Supabase SQL editor

-- Add new columns to existing tables
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS deleted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS client_id text,
ADD COLUMN IF NOT EXISTS version integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

ALTER TABLE groups 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS deleted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS client_id text,
ADD COLUMN IF NOT EXISTS version integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

ALTER TABLE attendance_records 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS deleted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS client_id text,
ADD COLUMN IF NOT EXISTS version integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

ALTER TABLE completed_makeup_sessions 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS deleted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS client_id text,
ADD COLUMN IF NOT EXISTS version integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

ALTER TABLE archived_terms 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS deleted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS client_id text,
ADD COLUMN IF NOT EXISTS version integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables
CREATE TRIGGER set_timestamp_students 
  BEFORE INSERT OR UPDATE ON students 
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER set_timestamp_groups 
  BEFORE INSERT OR UPDATE ON groups 
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER set_timestamp_attendance_records 
  BEFORE INSERT OR UPDATE ON attendance_records 
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER set_timestamp_completed_makeup_sessions 
  BEFORE INSERT OR UPDATE ON completed_makeup_sessions 
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER set_timestamp_archived_terms 
  BEFORE INSERT OR UPDATE ON archived_terms 
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_updated_at ON students(updated_at);
CREATE INDEX IF NOT EXISTS idx_students_deleted ON students(deleted);

CREATE INDEX IF NOT EXISTS idx_groups_user_id ON groups(user_id);
CREATE INDEX IF NOT EXISTS idx_groups_updated_at ON groups(updated_at);
CREATE INDEX IF NOT EXISTS idx_groups_deleted ON groups(deleted);

CREATE INDEX IF NOT EXISTS idx_attendance_records_user_id ON attendance_records(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_updated_at ON attendance_records(updated_at);
CREATE INDEX IF NOT EXISTS idx_attendance_records_deleted ON attendance_records(deleted);

CREATE INDEX IF NOT EXISTS idx_completed_makeup_sessions_user_id ON completed_makeup_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_completed_makeup_sessions_updated_at ON completed_makeup_sessions(updated_at);
CREATE INDEX IF NOT EXISTS idx_completed_makeup_sessions_deleted ON completed_makeup_sessions(deleted);

CREATE INDEX IF NOT EXISTS idx_archived_terms_user_id ON archived_terms(user_id);
CREATE INDEX IF NOT EXISTS idx_archived_terms_updated_at ON archived_terms(updated_at);
CREATE INDEX IF NOT EXISTS idx_archived_terms_deleted ON archived_terms(deleted);

-- Create migration_logs table for debugging (dev only)
CREATE TABLE IF NOT EXISTS migration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  migration_type TEXT NOT NULL,
  status TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on migration_logs
ALTER TABLE migration_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for migration_logs
CREATE POLICY "Users can only see their own migration logs" ON migration_logs
  FOR ALL USING (auth.uid() = user_id);

-- Create index on migration_logs
CREATE INDEX IF NOT EXISTS idx_migration_logs_user_id ON migration_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_migration_logs_created_at ON migration_logs(created_at);

-- Update existing RLS policies to include user_id filter
-- Students
DROP POLICY IF EXISTS "Users can only see their own students" ON students;
CREATE POLICY "Users can only see their own students" ON students
  FOR ALL USING (auth.uid() = user_id);

-- Groups  
DROP POLICY IF EXISTS "Users can only see their own groups" ON groups;
CREATE POLICY "Users can only see their own groups" ON groups
  FOR ALL USING (auth.uid() = user_id);

-- Attendance records
DROP POLICY IF EXISTS "Users can only see their own attendance records" ON attendance_records;
CREATE POLICY "Users can only see their own attendance records" ON attendance_records
  FOR ALL USING (auth.uid() = user_id);

-- Completed makeup sessions
DROP POLICY IF EXISTS "Users can only see their own completed makeup sessions" ON completed_makeup_sessions;
CREATE POLICY "Users can only see their own completed makeup sessions" ON completed_makeup_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Archived terms
DROP POLICY IF EXISTS "Users can only see their own archived terms" ON archived_terms;
CREATE POLICY "Users can only see their own archived terms" ON archived_terms
  FOR ALL USING (auth.uid() = user_id);
