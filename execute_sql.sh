#!/bin/bash

# Configuration
SUPABASE_URL="https://scmyfwhhjwlmsoobqjyk.supabase.co"
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjbXlmd2hoandsbXNvb2JxanlrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg0NTAwOSwiZXhwIjoyMDc3NDIxMDA5fQ.aSzcF8hbo9j_dJpuQ2joqxa1n4efDCHuEKJHXagkJ3c"
SQL_FILE="ADD_EVALUATORS_CORRECT.sql"

echo "=========================================="
echo "Executing SQL via Supabase API"
echo "=========================================="

# Read SQL file content
SQL_CONTENT=$(cat "$SQL_FILE")

# Escape for JSON
JSON_SQL=$(echo "$SQL_CONTENT" | jq -Rs .)

# Create JSON payload
JSON_PAYLOAD="{\"sql\": $JSON_SQL}"

echo "Executing SQL statements..."
echo ""

# Execute via curl
RESPONSE=$(curl -s -X POST \
  "$SUPABASE_URL/rest/v1/rpc/sql" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "apikey: $SUPABASE_SERVICE_KEY" \
  -d "$JSON_PAYLOAD")

echo "Response:"
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"

echo ""
echo "=========================================="
echo "Execution completed!"
echo "=========================================="
