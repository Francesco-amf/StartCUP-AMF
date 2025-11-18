@echo off
setlocal enabledelayedexpansion

REM Configuration
set SUPABASE_URL=https://scmyfwhhjwlmsoobqjyk.supabase.co
set SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjbXlmd2hvandsbXNvb2JxanlrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg0NTAwOSwiZXhwIjoyMDc3NDIxMDA5fQ.aSzcF8hbo9j_dJpuQ2joqxa1n4efDCHuEKJHXagkJ3c
set SQL_FILE=ADD_EVALUATORS_CORRECT.sql

echo ==========================================
echo Executing SQL via Supabase API
echo ==========================================

REM Read SQL file
for /f "delims=" %%A in (%SQL_FILE%) do (
    set "SQL_CONTENT=!SQL_CONTENT!%%A "
)

REM Execute curl command
echo Sending SQL to Supabase...
echo.

curl -X POST ^
  "%SUPABASE_URL%/rest/v1/rpc/sql" ^
  -H "Authorization: Bearer %SERVICE_KEY%" ^
  -H "Content-Type: application/json" ^
  -H "apikey: %SERVICE_KEY%" ^
  -d "{\"sql\": \"!SQL_CONTENT!\"}"

echo.
echo ==========================================
echo Execution completed!
echo ==========================================

pause
