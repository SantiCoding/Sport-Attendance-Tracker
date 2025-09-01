-- Create coach_profiles table
CREATE TABLE IF NOT EXISTS coach_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES coach_profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  notes TEXT DEFAULT '',
  prepaid_sessions INTEGER DEFAULT 0,
  remaining_sessions INTEGER DEFAULT 0,
  makeup_sessions INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES coach_profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('group', 'private')) NOT NULL,
  student_ids UUID[] DEFAULT '{}',
  day_of_week TEXT,
  time TEXT,
  duration TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attendance_records table
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES coach_profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  group_id UUID NOT NULL,
  student_id UUID NOT NULL,
  status TEXT CHECK (status IN ('present', 'absent', 'canceled')) NOT NULL,
  notes TEXT DEFAULT '',
  time_adjustment_amount TEXT,
  time_adjustment_type TEXT CHECK (time_adjustment_type IN ('more', 'less')),
  time_adjustment_reason TEXT,
  cancel_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create archived_terms table
CREATE TABLE IF NOT EXISTS archived_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES coach_profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_month TEXT NOT NULL,
  end_month TEXT NOT NULL,
  year TEXT NOT NULL,
  attendance_records JSONB DEFAULT '[]',
  student_snapshot JSONB DEFAULT '[]',
  group_snapshot JSONB DEFAULT '[]',
  completed_makeup_sessions JSONB DEFAULT '[]',
  finalized_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create completed_makeup_sessions table
CREATE TABLE IF NOT EXISTS completed_makeup_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES coach_profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  student_name TEXT NOT NULL,
  date DATE NOT NULL,
  group_id UUID,
  group_name TEXT,
  type TEXT CHECK (type IN ('group', 'private')) NOT NULL,
  completed_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create makeup_sessions table
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

-- Enable Row Level Security (RLS)
ALTER TABLE coach_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE archived_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE completed_makeup_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE makeup_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can only see their own coach profiles" ON coach_profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only see their own students" ON students
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only see their own groups" ON groups
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only see their own attendance records" ON attendance_records
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only see their own archived terms" ON archived_terms
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only see their own completed makeup sessions" ON completed_makeup_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only see their own makeup sessions" ON makeup_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_coach_profiles_user_id ON coach_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_students_profile_id ON students(profile_id);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_groups_profile_id ON groups(profile_id);
CREATE INDEX IF NOT EXISTS idx_groups_user_id ON groups(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_profile_id ON attendance_records(profile_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_user_id ON attendance_records(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_date ON attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_archived_terms_profile_id ON archived_terms(profile_id);
CREATE INDEX IF NOT EXISTS idx_archived_terms_user_id ON archived_terms(user_id);
CREATE INDEX IF NOT EXISTS idx_completed_makeup_sessions_profile_id ON completed_makeup_sessions(profile_id);
CREATE INDEX IF NOT EXISTS idx_completed_makeup_sessions_user_id ON completed_makeup_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_makeup_sessions_profile_id ON makeup_sessions(profile_id);
CREATE INDEX IF NOT EXISTS idx_makeup_sessions_user_id ON makeup_sessions(user_id);
