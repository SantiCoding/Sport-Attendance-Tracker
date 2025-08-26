-- Add missing columns to existing tables
-- This script adds the missing columns that are needed for the updated application

-- Add remaining_sessions column to students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS remaining_sessions INTEGER DEFAULT 0;

-- Add missing columns to groups table
ALTER TABLE groups 
ADD COLUMN IF NOT EXISTS day_of_week TEXT,
ADD COLUMN IF NOT EXISTS time TEXT,
ADD COLUMN IF NOT EXISTS duration TEXT;

-- Update existing records to have default values
UPDATE students 
SET remaining_sessions = prepaid_sessions 
WHERE remaining_sessions IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN students.remaining_sessions IS 'Number of remaining sessions for the student';
COMMENT ON COLUMN groups.day_of_week IS 'Day of the week for the group (e.g., Monday, Tuesday)';
COMMENT ON COLUMN groups.time IS 'Time of the group session (e.g., 9:00 AM)';
COMMENT ON COLUMN groups.duration IS 'Duration of the group session (e.g., 1h, 1.5h)';
