-- Migration to update schema for reliable persistence system
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

ALTER TABLE makeup_sessions 
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

CREATE INDEX IF NOT EXISTS idx_makeup_sessions_user_id ON makeup_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_makeup_sessions_updated_at ON makeup_sessions(updated_at);
CREATE INDEX IF NOT EXISTS idx_makeup_sessions_deleted ON makeup_sessions(deleted);

CREATE INDEX IF NOT EXISTS idx_completed_makeup_sessions_user_id ON completed_makeup_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_completed_makeup_sessions_updated_at ON completed_makeup_sessions(updated_at);
CREATE INDEX IF NOT EXISTS idx_completed_makeup_sessions_deleted ON completed_makeup_sessions(deleted);

CREATE INDEX IF NOT EXISTS idx_archived_terms_user_id ON archived_terms(user_id);
CREATE INDEX IF NOT EXISTS idx_archived_terms_updated_at ON archived_terms(updated_at);
CREATE INDEX IF NOT EXISTS idx_archived_terms_deleted ON archived_terms(deleted);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    NEW.version = COALESCE(NEW.version, 0) + 1;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_records_updated_at BEFORE UPDATE ON attendance_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_makeup_sessions_updated_at BEFORE UPDATE ON makeup_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_completed_makeup_sessions_updated_at BEFORE UPDATE ON completed_makeup_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_archived_terms_updated_at BEFORE UPDATE ON archived_terms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update RLS policies to include user_id
DROP POLICY IF EXISTS "Users can only see their own students" ON students;
CREATE POLICY "Users can only see their own students" ON students
    FOR ALL USING (user_id = auth.uid() OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can only see their own groups" ON groups;
CREATE POLICY "Users can only see their own groups" ON groups
    FOR ALL USING (user_id = auth.uid() OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can only see their own attendance records" ON attendance_records;
CREATE POLICY "Users can only see their own attendance records" ON attendance_records
    FOR ALL USING (user_id = auth.uid() OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can only see their own makeup sessions" ON makeup_sessions;
CREATE POLICY "Users can only see their own makeup sessions" ON makeup_sessions
    FOR ALL USING (user_id = auth.uid() OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can only see their own completed makeup sessions" ON completed_makeup_sessions;
CREATE POLICY "Users can only see their own completed makeup sessions" ON completed_makeup_sessions
    FOR ALL USING (user_id = auth.uid() OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can only see their own archived terms" ON archived_terms;
CREATE POLICY "Users can only see their own archived terms" ON archived_terms
    FOR ALL USING (user_id = auth.uid() OR user_id IS NULL);
