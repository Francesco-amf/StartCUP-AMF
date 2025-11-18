# PowerShell script to execute SQL via Supabase API
# This uses the Supabase REST API to run SQL statements

$projectUrl = "https://scmyfwhhjwlmsoobqjyk.supabase.co"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjbXlmd2hvandsbXNvb2JxanlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NDUwMDksImV4cCI6MjA3NzQyMTAwOX0.9ibCEN9XzONOmJE0TWNWdZnn5RD5OlaXhiI1tGZJmBM"

# Read the SQL file
$sqlContent = Get-Content -Path "c:\Users\symbi\StartCUP-AMF\ADD_EVALUATORS_CORRECT.sql" -Raw

# Split by GO or semicolon for multiple statements
$statements = $sqlContent -split "(?<=;)\s*(?=SELECT|INSERT|UPDATE|DELETE)" | Where-Object { $_.Trim() -ne "" }

Write-Host "Found $($statements.Count) SQL statements to execute"
Write-Host "=========================================="

foreach ($i = 0; $i -lt $statements.Count; $i++) {
    $statement = $statements[$i].Trim()

    # Skip comments and empty statements
    if ($statement.StartsWith("--") -or $statement -eq "") {
        continue
    }

    Write-Host "Executing statement $($i + 1)..."

    # Use curl to execute via REST API
    $body = @{
        sql = $statement
    } | ConvertTo-Json

    $response = curl -X POST `
        -H "Authorization: Bearer $anonKey" `
        -H "Content-Type: application/json" `
        -H "apikey: $anonKey" `
        "$projectUrl/rest/v1/rpc/sql_exec" `
        -d $body

    Write-Host "Response: $response"
    Write-Host "---"
}

Write-Host "=========================================="
Write-Host "All statements executed!"
