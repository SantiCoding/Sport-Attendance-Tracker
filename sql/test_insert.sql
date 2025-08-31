-- TEST INSERT: Try to manually insert test data to see if the structure works
-- This will help us understand if the issue is with the database or the app

-- First, let's see what a coach profile looks like
SELECT 'Sample coach profile:' as info;
SELECT id, name, user_id FROM coach_profiles LIMIT 1;

-- Now let's try to insert a test student
INSERT INTO students (
  id,
  name,
  profile_id,
  user_id,
  notes,
  prepaid_sessions,
  remaining_sessions,
  makeup_sessions,
  session_history
) VALUES (
  gen_random_uuid(),
  'Test Student',
  (SELECT id FROM coach_profiles LIMIT 1),
  (SELECT user_id FROM coach_profiles LIMIT 1),
  'Test notes',
  10,
  10,
  0,
  '[]'
) RETURNING id, name, profile_id, user_id;

-- Let's also try to insert a test group
INSERT INTO groups (
  id,
  name,
  profile_id,
  user_id,
  type,
  student_ids,
  day_of_week,
  time,
  duration
) VALUES (
  gen_random_uuid(),
  'Test Group',
  (SELECT id FROM coach_profiles LIMIT 1),
  (SELECT user_id FROM coach_profiles LIMIT 1),
  'regular',
  '[]',
  'monday',
  '09:00',
  60
) RETURNING id, name, profile_id, user_id;

-- Check if the inserts worked
SELECT 'After test inserts:' as info;
SELECT 'students' as table_name, COUNT(*) as count FROM students
UNION ALL
SELECT 'groups' as table_name, COUNT(*) as count FROM groups;

-- Show the test data we just inserted
SELECT 'Test students:' as info;
SELECT id, name, profile_id, user_id FROM students WHERE name = 'Test Student';

SELECT 'Test groups:' as info;
SELECT id, name, profile_id, user_id FROM groups WHERE name = 'Test Group';
