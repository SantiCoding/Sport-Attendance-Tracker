# PowerShell script to clean up app/page.tsx by removing cloud sync references

$content = Get-Content "app/page.tsx" -Raw

# Remove cloud sync related lines
$content = $content -replace "const \{ loadFromCloud, saveToCloud, syncing, lastSyncTime, syncStatus \} = useCloudSync\(user\)", ""
$content = $content -replace "const hasLoadedFromCloudThisSession = useRef\(false\)", ""
$content = $content -replace "const \{ user, loading, signInAsGuest, signOut, isSupabaseConfigured \} = useAuth\(\)", "const { user, loading, signInAsGuest, signOut } = useAuth()"

# Remove cloud sync related useEffect blocks
$content = $content -replace "// Initialize auth and load data on app startup[\s\S]*?}, \[supabase\]\)", ""

# Remove cloud sync related variables and functions
$content = $content -replace "hasLoadedFromCloudThisSession\.current = true", ""
$content = $content -replace "hasLoadedFromCloudThisSession\.current = false", ""
$content = $content -replace "if \(user && supabase\)", "if (false)" # Disable cloud sync
$content = $content -replace "if \(user && isSupabaseConfigured\)", "if (false)" # Disable cloud sync
$content = $content -replace "saveToCloud\([^)]*\)", "// saveToCloud disabled"
$content = $content -replace "loadFromCloud\(\)", "// loadFromCloud disabled"

# Remove sync status references
$content = $content -replace "syncStatus", "// syncStatus disabled"
$content = $content -replace "lastSyncTime", "// lastSyncTime disabled"
$content = $content -replace "syncing", "// syncing disabled"

# Remove user email references since user is now null
$content = $content -replace "user\.email", "// user.email disabled"
$content = $content -replace "user\.id", "// user.id disabled"

# Save the cleaned content
Set-Content "app/page.tsx" $content -Encoding UTF8

Write-Host "✅ Cleaned up app/page.tsx - removed cloud sync references"
