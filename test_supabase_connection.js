#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://scmyfwhhjwlmsoobqjyk.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjbXlmd2hvandzbXNvb2JxanlrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg0NTAwOSwiZXhwIjoyMDc3NDIxMDA5fQ.aSzcF8hbo9j_dJpuQ2joqxa1n4efDCHuEKJHXagkJ3c';

console.log('Testing Supabase connection...\n');
console.log('URL:', SUPABASE_URL);
console.log('Key length:', SUPABASE_SERVICE_KEY.length);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function test() {
  try {
    // Test simple query
    console.log('\n1. Testing simple SELECT query...');
    const { data, error } = await supabase
      .from('teams')
      .select('count');

    if (error) {
      console.log('❌ Query error:', error);
    } else {
      console.log('✅ Query success! Data:', data);
    }

    // Test auth endpoint
    console.log('\n2. Testing auth.admin.listUsers()...');
    const { data: users, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.log('❌ Auth error:', authError);
    } else {
      console.log('✅ Auth success! Users count:', users?.users?.length);
    }
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }
}

test();
