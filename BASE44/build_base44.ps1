$ErrorActionPreference = 'Stop'

$root = "Tennis_Tracker_nogooogle"
$outDir = "BASE44"
$exts = @('.ts','.tsx','.js','.jsx','.json','.md','.mjs','.css','.txt')

function Write-Bundle {
  param(
    [string]$Title,
    [string]$OutputFile,
    [string[]]$Paths
  )
  if (Test-Path $OutputFile) { Remove-Item $OutputFile -Force }
  "===== $Title =====" | Out-File -FilePath $OutputFile -Encoding utf8
  ("Generated: " + (Get-Date -Format o)) | Out-File -FilePath $OutputFile -Append -Encoding utf8
  "" | Out-File -FilePath $OutputFile -Append -Encoding utf8

  foreach ($p in $Paths) {
    $target = Join-Path $root $p
    if (Test-Path $target) {
      $basePath = (Resolve-Path $target).Path
      Get-ChildItem -Path $target -Recurse -File |
        Where-Object { $exts -contains $_.Extension } |
        Sort-Object FullName |
        ForEach-Object {
          $rel = $_.FullName.Substring($basePath.Length + 1)
          $header = "----- BEGIN FILE: $p/$rel -----"
          $header | Out-File -FilePath $OutputFile -Append -Encoding utf8
          Get-Content -Path $_.FullName -Raw -Encoding utf8 | Out-File -FilePath $OutputFile -Append -Encoding utf8
          $footer = "----- END FILE: $p/$rel -----"
          $footer | Out-File -FilePath $OutputFile -Append -Encoding utf8
          "" | Out-File -FilePath $OutputFile -Append -Encoding utf8
        }
    }
  }
  ("===== END $Title =====") | Out-File -FilePath $OutputFile -Append -Encoding utf8
}

New-Item -ItemType Directory -Path $outDir -Force | Out-Null

Write-Bundle -Title "APP" -OutputFile (Join-Path $outDir "ALL_CODE_app.txt") -Paths @('app')
Write-Bundle -Title "COMPONENTS" -OutputFile (Join-Path $outDir "ALL_CODE_components.txt") -Paths @('components')
Write-Bundle -Title "UI" -OutputFile (Join-Path $outDir "ALL_CODE_ui.txt") -Paths @('ui','components/ui')
Write-Bundle -Title "ROOT FILES" -OutputFile (Join-Path $outDir "ALL_CODE_root.txt") -Paths @('.')
Write-Bundle -Title "LIB AND HOOKS" -OutputFile (Join-Path $outDir "ALL_CODE_lib_hooks.txt") -Paths @('lib','hooks')
Write-Bundle -Title "PUBLIC (text only)" -OutputFile (Join-Path $outDir "ALL_CODE_public.txt") -Paths @('public')
Write-Bundle -Title "STYLES" -OutputFile (Join-Path $outDir "ALL_CODE_styles.txt") -Paths @('styles')


