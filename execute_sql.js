#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_URL = 'scmyfwhhjwlmsoobqjyk.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjbXlmd2hvandsbXNvb2JxanlrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg0NTAwOSwiZXhwIjoyMDc3NDIxMDA5fQ.aSzcF8hbo9j_dJpuQ2joqxa1n4efDCHuEKJHXagkJ3c';
const SQL_FILE = path.join(__dirname, 'ADD_EVALUATORS_AND_UPDATE_TEAM.sql');

console.log('==========================================');
console.log('Executing SQL via Supabase API');
console.log('==========================================\n');

// Read SQL file
const sqlContent = fs.readFileSync(SQL_FILE, 'utf-8');

// Prepare payload
const payload = JSON.stringify({
  sql: sqlContent
});

// Make HTTPS request
const options = {
  hostname: SUPABASE_URL,
  port: 443,
  path: '/rest/v1/rpc/sql',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    'apikey': SERVICE_KEY
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response Status:', res.statusCode);
    console.log('Response Headers:', res.headers);
    console.log('\nResponse Body:');

    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log(data);
    }

    console.log('\n==========================================');
    console.log('Execution completed!');
    console.log('==========================================');
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
  process.exit(1);
});

console.log('Sending SQL to Supabase...\n');
req.write(payload);
req.end();
