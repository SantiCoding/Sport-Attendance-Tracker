# Session Management Features - Visual Guide

## 🎯 Where to Find the New Features

The new session management features are located in the **Students tab** of your app. When you click on the "Students" tab in the bottom navigation, you'll see a new interface with two view modes.

---

## 📍 Feature Location: Students Tab

### Step 1: Navigate to Students Tab
- Click the **"Students"** tab in the bottom navigation bar
- You should see a header with two toggle buttons: **"Students"** and **"Sessions"**

---

## 🎨 Feature 1: View Mode Toggle

**Location:** Top right of the Students tab header

**What you'll see:**
```
┌─────────────────────────────────────────────────┐
│ 🔍 Student Search & Management    [Students] [Sessions] │
└─────────────────────────────────────────────────┘
```

**How it works:**
- **Students button** (default): Shows the student search and management interface
- **Sessions button**: Switches to the new session management view

---

## 📊 Feature 2: Sessions View - Quick Stats

**Location:** Top of Sessions view

**What you'll see:**
```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Total        │ Present      │ Absent       │ Canceled     │
│ Sessions     │              │              │              │
│    25        │    18        │     5        │     2        │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

**Colors:**
- Total: White
- Present: Green
- Absent: Red  
- Canceled: Yellow

---

## 🔍 Feature 3: View Mode Selector

**Location:** First row of filters in Sessions view

**What you'll see:**
```
View Mode: [All Sessions ▼]
```

**Options:**
1. **All Sessions** - Shows all sessions in one list
2. **By Group** - Organizes sessions by group name
3. **By Week** - Groups sessions by week (Monday-Saturday)
4. **By Student** - Organizes sessions by student name
5. **Private Sessions** - Shows only private lesson sessions

**Visual Example:**
- When you select "By Group", you'll see sections like:
  ```
  ┌─────────────────────────────┐
  │ Group A                     │
  │ 5 sessions • 4 present • 1 absent │
  │ [Expand]                    │
  └─────────────────────────────┘
  ```

---

## 📅 Feature 4: Week Selection (By Week Mode)

**Location:** Appears when "By Week" is selected

**What you'll see:**
```
Select Week: [📅 This Week ▼]
```

**How it works:**
- Click the calendar button
- A calendar popup appears
- Select any date to view that week's sessions
- Default shows current week (Monday-Saturday)

---

## 🎯 Feature 5: Group/Student Filter

**Location:** Appears based on selected view mode

**When "By Group" is selected:**
```
Select Group: [All Groups ▼]
```

**When "By Student" is selected:**
```
Select Student: [All Students ▼]
```

---

## 🔎 Feature 6: Search Sessions

**Location:** Second row of filters

**What you'll see:**
```
Search Sessions: [🔍 Search by student, group, date, time...]
```

**What it searches:**
- Student names
- Group names
- Dates
- Times

---

## 📆 Feature 7: Custom Date Range

**Location:** Next to search box

**What you'll see:**
```
Custom Date Range: [📅 Select date range ▼]
```

**How it works:**
- Click to open calendar
- Select a start date and end date
- Sessions are filtered to that range
- Shows as: "Jan 15 - Feb 20, 2024"

---

## 📥 Feature 8: Export Buttons

**Location:** Action buttons row

**What you'll see:**
```
[📥 Export Current View] [📥 Export This Week] [📥 Export Selected (3)]
```

**Buttons:**
1. **Export Current View** - Exports all visible sessions based on filters
2. **Export This Week** - Only appears in "By Week" mode, exports current week
3. **Export Selected (X)** - Only appears when sessions are selected, exports selected sessions

**Export Format:**
- CSV file with Excel compatibility
- Includes: Group, Date, Time, Student, Status, Duration, Time Adjustment, Notes, Makeup info
- Organized by group and date

---

## ☑️ Feature 9: Bulk Selection

**Location:** Each session card has a checkbox

**What you'll see:**
```
┌─────────────────────────────────────────────┐
│ ☑️ Student: John Doe                        │
│    Group: Group A                           │
│    Date: Jan 15, 2024 9:00 AM              │
│    Status: [present]                        │
│    Duration: 1h 30m                         │
└─────────────────────────────────────────────┘
```

**How it works:**
- Click checkbox to select individual sessions
- Selected sessions are highlighted in blue
- Use "Select All" button to select all visible sessions
- Use "Deselect All" to clear selection

---

## 📦 Feature 10: Archive/Restore

**Location:** Action buttons (when sessions are selected)

**What you'll see:**
```
[📦 Archive Selected]  or  [📦 Restore Selected]
```

**Archive:**
- Moves sessions from active to archived
- Only appears when viewing active sessions
- Button is yellow/orange colored

**Restore:**
- Moves sessions from archived back to active
- Only appears when viewing archived sessions
- Button is green colored

---

## 🗑️ Feature 11: Delete Sessions

**Location:** Action buttons (when sessions are selected)

**What you'll see:**
```
[🗑️ Delete Selected]
```

**How it works:**
- Click to open confirmation dialog
- Confirms: "Are you sure you want to delete X session(s)? This action cannot be undone."
- Permanently removes sessions from the system

---

## 📚 Feature 12: View Archived

**Location:** Right side of action buttons

**What you'll see:**
```
[📚 View Archived]  or  [📚 View Active]
```

**How it works:**
- Toggle between active and archived sessions
- Archived sessions are stored separately
- Can restore archived sessions back to active

---

## ⏰ Feature 13: Archive Old Sessions

**Location:** Action buttons (when viewing active sessions)

**What you'll see:**
```
[📚 Archive Old ▼]
```

**Options when clicked:**
- 1 Month
- 3 Months
- 6 Months
- 12 Months

**How it works:**
- Automatically archives all sessions older than selected period
- Shows confirmation toast with count of archived sessions

---

## 📋 Feature 14: Session List Display

**Location:** Below all filters and buttons

**What you'll see (when expanded):**
```
┌─────────────────────────────────────────────────────┐
│ Jan 15, 2024                              [Collapse] │
│ 3 sessions • 2 present • 1 absent                   │
├─────────────────────────────────────────────────────┤
│ ☐ Student: John Doe                                 │
│    Group: Group A                                    │
│    Date: Jan 15, 2024 9:00 AM                      │
│    Status: [present]  Duration: 1h 30m              │
│                                                     │
│ ☐ Student: Jane Smith                               │
│    Group: Group A                                    │
│    Date: Jan 15, 2024 9:00 AM                      │
│    Status: [present]  Duration: 1h 30m              │
└─────────────────────────────────────────────────────┘
```

**Organization:**
- Sessions grouped by date, group, week, or student (based on view mode)
- Each section shows stats (total, present, absent, canceled)
- Click section header to expand/collapse
- Individual sessions can be selected with checkboxes

---

## 🎨 Visual Status Badges

**Status indicators:**
- **Present**: Green badge with "present" text
- **Absent**: Red badge with "absent" text
- **Canceled**: Yellow badge with "canceled" text

---

## 🔄 How Features Work Together

1. **Select View Mode** → Choose how to organize sessions
2. **Apply Filters** → Narrow down by group, student, week, or date range
3. **Search** → Find specific sessions quickly
4. **Select Sessions** → Choose sessions for bulk operations
5. **Export/Archive/Delete** → Perform actions on selected sessions

---

## 🐛 Troubleshooting

**If you don't see the features:**

1. **Check you're on the Students tab** - Look for the bottom navigation
2. **Click "Sessions" button** - Top right of the Students tab header
3. **Refresh the page** - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
4. **Check browser console** - Look for any JavaScript errors
5. **Verify deployment** - Make sure Vercel has deployed the latest commit

**If the toggle buttons don't appear:**
- The component might not be integrated yet
- Check that `StudentSearchTab` is imported in `app/page.tsx`
- Verify the component file exists at `student-search-tab.tsx`

---

## 📸 Expected UI Flow

```
1. Open App
   ↓
2. Click "Students" tab (bottom nav)
   ↓
3. See header: "Student Search & Management" with [Students] [Sessions] buttons
   ↓
4. Click "Sessions" button
   ↓
5. See:
   - Quick stats (Total, Present, Absent, Canceled)
   - View Mode dropdown
   - Search box
   - Date range picker
   - Export/Archive buttons
   - Session list organized by selected view mode
```

---

## ✅ Checklist

- [ ] Can see "Students" and "Sessions" toggle buttons
- [ ] Can switch to Sessions view
- [ ] See quick stats at the top
- [ ] View Mode dropdown works
- [ ] Can search sessions
- [ ] Can select date range
- [ ] Can select individual sessions
- [ ] Export buttons appear
- [ ] Archive/Restore buttons work
- [ ] Sessions are organized correctly
- [ ] Can expand/collapse sections

---

## 🚀 Next Steps

If features are not visible:
1. Check that the code changes are deployed to Vercel
2. Hard refresh your browser
3. Check browser console for errors
4. Verify the component is properly imported

If you see the features but they don't work:
1. Check browser console for errors
2. Verify you have session data in your profile
3. Try creating a test session first

