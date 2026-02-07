# Fix ALL versioned imports in the codebase
$files = Get-ChildItem -Recurse -Include *.tsx,*.ts,*.jsx,*.js | Where-Object { 
    $_.FullName -notmatch "node_modules" -and 
    $_.FullName -notmatch "electron" -and
    $_.FullName -notmatch "dist"
}

$totalFixed = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Fix versioned imports - simpler approach
    $content = $content -replace 'from "([^"]+)@[0-9][^"]*"', 'from "$1"'
    $content = $content -replace "from '([^']+)@[0-9][^']*'", "from '`$1'"
    
    if ($originalContent -ne $content) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Fixed: $($file.Name)" -ForegroundColor Green
        $totalFixed++
    }
}

Write-Host ""
Write-Host "Fixed $totalFixed files" -ForegroundColor Cyan
