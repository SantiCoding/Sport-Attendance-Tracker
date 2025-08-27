-- Add missing columns to existing tables
-- This script should be run on existing databases to add missing columns

-- Add remaining_sessions column to students table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'students' AND column_name = 'remaining_sessions'
    ) THEN
        ALTER TABLE students ADD COLUMN remaining_sessions INTEGER DEFAULT 0;
        -- Update existing records to set remaining_sessions = prepaid_sessions
        UPDATE students SET remaining_sessions = prepaid_sessions WHERE remaining_sessions IS NULL;
    END IF;
END $$;

-- Add missing columns to groups table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'groups' AND column_name = 'day_of_week'
    ) THEN
        ALTER TABLE groups ADD COLUMN day_of_week TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'groups' AND column_name = 'time'
    ) THEN
        ALTER TABLE groups ADD COLUMN time TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'groups' AND column_name = 'duration'
    ) THEN
        ALTER TABLE groups ADD COLUMN duration TEXT;
    END IF;
END $$;

-- Add missing columns to attendance_records table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance_records' AND column_name = 'time_adjustment_amount'
    ) THEN
        ALTER TABLE attendance_records ADD COLUMN time_adjustment_amount TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance_records' AND column_name = 'time_adjustment_type'
    ) THEN
        ALTER TABLE attendance_records ADD COLUMN time_adjustment_type TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance_records' AND column_name = 'time_adjustment_reason'
    ) THEN
        ALTER TABLE attendance_records ADD COLUMN time_adjustment_reason TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance_records' AND column_name = 'cancel_reason'
    ) THEN
        ALTER TABLE attendance_records ADD COLUMN cancel_reason TEXT;
    END IF;
END $$;

-- Update status constraint in attendance_records to include 'canceled'
DO $$ 
BEGIN
    -- Drop the existing constraint if it exists
    ALTER TABLE attendance_records DROP CONSTRAINT IF EXISTS attendance_records_status_check;
    
    -- Add the new constraint with 'canceled' status
    ALTER TABLE attendance_records ADD CONSTRAINT attendance_records_status_check 
    CHECK (status IN ('present', 'absent', 'canceled'));
END $$;
