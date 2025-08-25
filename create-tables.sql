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
  name TEXT NOT NULL,
  notes TEXT DEFAULT '',
  prepaid_sessions INTEGER DEFAULT 0,
  makeup_sessions INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES coach_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('group', 'private')) NOT NULL,
  student_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attendance_records table
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES coach_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  group_id UUID NOT NULL,
  student_id UUID NOT NULL,
  status TEXT CHECK (status IN ('present', 'absent')) NOT NULL,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create archived_terms table
CREATE TABLE IF NOT EXISTS archived_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES coach_profiles(id) ON DELETE CASCADE,
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
  student_id UUID NOT NULL,
  student_name TEXT NOT NULL,
  date DATE NOT NULL,
  group_id UUID,
  group_name TEXT,
  type TEXT CHECK (type IN ('group', 'private')) NOT NULL,
  completed_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE coach_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE archived_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE completed_makeup_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can only see their own coach profiles" ON coach_profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only see their own students" ON students
  FOR ALL USING (
    profile_id IN (
      SELECT id FROM coach_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can only see their own groups" ON groups
  FOR ALL USING (
    profile_id IN (
      SELECT id FROM coach_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can only see their own attendance records" ON attendance_records
  FOR ALL USING (
    profile_id IN (
      SELECT id FROM coach_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can only see their own archived terms" ON archived_terms
  FOR ALL USING (
    profile_id IN (
      SELECT id FROM coach_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can only see their own completed makeup sessions" ON completed_makeup_sessions
  FOR ALL USING (
    profile_id IN (
      SELECT id FROM coach_profiles WHERE user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_coach_profiles_user_id ON coach_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_students_profile_id ON students(profile_id);
CREATE INDEX IF NOT EXISTS idx_groups_profile_id ON groups(profile_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_profile_id ON attendance_records(profile_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_date ON attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_archived_terms_profile_id ON archived_terms(profile_id);
CREATE INDEX IF NOT EXISTS idx_completed_makeup_sessions_profile_id ON completed_makeup_sessions(profile_id);
