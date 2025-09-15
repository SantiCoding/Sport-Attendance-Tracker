# Database Migration Instructions

## Problem
The database is missing some columns that the application now needs:
- `remaining_sessions` in the `students` table
- `day_of_week`, `time`, `duration` in the `groups` table

## Solution
Run the migration script in your Supabase dashboard.

## Steps:

1. **Go to your Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your Tennis Tracker project

2. **Open the SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Migration Script**
   - Copy and paste the contents of `scripts/add-missing-columns.sql`
   - Click "Run" to execute the script

4. **Verify the Migration**
   - The script will add the missing columns
   - Existing data will be preserved
   - New students will have `remaining_sessions` set to their `prepaid_sessions` value

## What the Script Does:
- Adds `remaining_sessions` column to students table
- Adds `day_of_week`, `time`, `duration` columns to groups table
- Sets default values for existing records
- Adds helpful comments to the database

## After Migration:
- Your Tennis Tracker will work properly
- Students will persist when you reload the page
- All data will be properly saved and loaded from the cloud
