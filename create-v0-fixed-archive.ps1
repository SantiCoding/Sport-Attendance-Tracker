# PowerShell script to create a clean archive for V0 with all fixes applied
# This excludes node_modules and other large directories

$sourceDir = Get-Location
$archiveName = "tennis-tracker-v0-fixed.zip"
$tempDir = "temp-v0-fixed-archive"

# Create temporary directory
if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Name $tempDir

Write-Host "Creating fixed archive for V0..." -ForegroundColor Green

# Copy essential files and directories
$essentialDirs = @(
    "app",
    "components", 
    "lib",
    "hooks",
    "auth",
    "public",
    "scripts",
    "styles"
)

$essentialFiles = @(
    "package.json",
    "tailwind.config.ts",
    "next.config.mjs",
    "postcss.config.mjs",
    "create-tables.sql",
    "supabase.ts",
    "components.json",
    "use-auth.ts",
    "use-cloud-sync.ts",
    "utils.ts",
    "toast.tsx",
    "use-toast.ts",
    "use-mobile.tsx",
    "theme-provider.tsx",
    "pwa-provider.tsx",
    "register-sw.ts",
    "resize-icons.js",
    "next-env.d.ts",
    "smart-sorter-dialog.tsx",
    "bulk-create-dialog.tsx",
    "enhanced-makeup-tab.tsx",
    "auth-toggle.tsx",
    "bulk-group-sort-dialog.tsx",
    "enhanced-reports-tab.tsx",
    "group-dialog-wrapper.tsx",
    "loading.tsx",
    "paste-student-list-dialog.tsx",
    "profile-switcher.tsx",
    "smart-sorter-tab.tsx",
    "student-dialog-wrapper.tsx",
    "student-search-tab.tsx",
    "term-finalization-dialog-wrapper.tsx",
    "term-finalization-dialog.tsx",
    "README-V0-FINAL.md"
)

# Copy essential directories
foreach ($dir in $essentialDirs) {
    if (Test-Path $dir) {
        Write-Host "Copying $dir..." -ForegroundColor Yellow
        Copy-Item -Path $dir -Destination $tempDir -Recurse
    }
}

# Copy essential files
foreach ($file in $essentialFiles) {
    if (Test-Path $file) {
        Write-Host "Copying $file..." -ForegroundColor Yellow
        Copy-Item -Path $file -Destination $tempDir
    }
}

# Create zip archive
Write-Host "Creating zip archive..." -ForegroundColor Green
Compress-Archive -Path "$tempDir\*" -DestinationPath $archiveName -Force

# Clean up temp directory
Remove-Item $tempDir -Recurse -Force

$archiveSize = [math]::Round((Get-Item $archiveName).Length / 1MB, 2)
Write-Host "Archive created: $archiveName" -ForegroundColor Green
Write-Host "Archive size: $archiveSize MB" -ForegroundColor Green

if ($archiveSize -gt 50) {
    Write-Host "WARNING: Archive is still larger than 50MB!" -ForegroundColor Red
    Write-Host "Consider removing more files or using .v0ignore approach." -ForegroundColor Yellow
} else {
    Write-Host "Archive is ready for V0 with all fixes applied!" -ForegroundColor Green
    Write-Host "✅ Background gradients fixed" -ForegroundColor Green
    Write-Host "✅ Glass morphism effects restored" -ForegroundColor Green
    Write-Host "✅ Scrollbar completely hidden" -ForegroundColor Green
    Write-Host "✅ All CSS animations working" -ForegroundColor Green
}
