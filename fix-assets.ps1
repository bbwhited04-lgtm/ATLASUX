# Find all figma:asset imports
$files = Get-ChildItem -Recurse -Include *.tsx,*.ts,*.jsx,*.js | Where-Object { $_.FullName -notmatch "node_modules" }

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # Replace figma:asset imports with placeholder
    $newContent = $content -replace 'import\s+(\w+)\s+from\s+"figma:asset/[^"]+";', 'const $1 = "https://placehold.co/800x600/1a1a1a/00bcd4?text=Atlas+UX";'
    
    if ($content -ne $newContent) {
        Set-Content -Path $file.FullName -Value $newContent
        Write-Host "Fixed: $($file.FullName)" -ForegroundColor Green
    }
}

Write-Host "`nDone! All figma:asset imports replaced." -ForegroundColor Cyan
