# Find all files with @version imports
$files = Get-ChildItem -Recurse -Include *.tsx,*.ts,*.jsx,*.js | Where-Object { $_.FullName -notmatch "node_modules" }

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # Remove @version from imports
    # Matches: from "@radix-ui/react-switch@1.1"
    # Becomes: from "@radix-ui/react-switch"
    $newContent = $content -replace 'from\s+"(@radix-ui/[^@"]+)@[^"]+";', 'from "$1";'
    
    # Also fix other versioned imports
    $newContent = $newContent -replace 'from\s+"(react-hook-form)@[^"]+";', 'from "$1";'
    $newContent = $newContent -replace 'from\s+"(sonner)@[^"]+";', 'from "$1";'
    
    if ($content -ne $newContent) {
        Set-Content -Path $file.FullName -Value $newContent
        Write-Host "Fixed: $($file.FullName)" -ForegroundColor Green
    }
}

Write-Host "`nDone! All versioned imports fixed." -ForegroundColor Cyan
