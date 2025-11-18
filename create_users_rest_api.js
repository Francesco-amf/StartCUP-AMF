#!/usr/bin/env node

const https = require('https');

const SUPABASE_URL = 'scmyfwhhjwlmsoobqjyk.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjbXlmd2hvandzbXNvb2JxanlrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg0NTAwOSwiZXhwIjoyMDc3NDIxMDA5fQ.aSzcF8hbo9j_dJpuQ2joqxa1n4efDCHuEKJHXagkJ3c';

const users = [
  {
    email: 'michael.silva@startcup-amf.com',
    password: 'MSEvaluator@2025!',
    name: 'Michael Silva',
    type: 'evaluator'
  },
  {
    email: 'bruna.leao@startcup-amf.com',
    password: 'BLEvaluator@2025!',
    name: 'Bruna Leao',
    type: 'evaluator'
  },
  {
    email: 'outsiders@startcup-amf.com',
    password: 'Outsiders@9930!',
    name: 'Outsiders',
    type: 'team'
  }
];

console.log('==========================================');
console.log('Creating users via Supabase Auth REST API');
console.log('==========================================\n');

async function createUser(user) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      email: user.email,
      password: user.password
    });

    const options = {
      hostname: SUPABASE_URL,
      port: 443,
      path: '/auth/v1/signup',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY
      }
    };

    console.log(`Creating user: ${user.email}...`);

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          try {
            const parsed = JSON.parse(data);
            console.log(`✓ User created (ID: ${parsed.user?.id || 'unknown'})`);
            resolve(true);
          } catch (e) {
            console.log(`✓ User created (status ${res.statusCode})`);
            resolve(true);
          }
        } else {
          try {
            const parsed = JSON.parse(data);
            console.error(`✗ Error (${res.statusCode}): ${parsed.message || JSON.stringify(parsed)}`);
          } catch (e) {
            console.error(`✗ Error (${res.statusCode}): ${data}`);
          }
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.error(`✗ Error: ${error.message}`);
      resolve(false);
    });

    req.write(payload);
    req.end();
  });
}

async function main() {
  for (const user of users) {
    await createUser(user);
    // Small delay between requests
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\n==========================================');
  console.log('All users created!');
  console.log('Try logging in with the credentials above');
  console.log('==========================================');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
